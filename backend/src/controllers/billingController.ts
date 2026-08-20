import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { isPlanId, PLANS } from '../domain/plans';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { profileService } from '../services/profileService';
import {
  buildActivatedSubscription,
  getActivePlan,
  getDailyAutoApplyQuota,
  isRazorpayConfigured,
  isSubscriptionActive,
  publicPlansPayload,
} from '../services/planService';
import {
  createRazorpayOrder,
  createRazorpayPaymentLink,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpayService';

const orderSchema = z.object({
  planId: z.enum(['starter', 'pro', 'elite']),
});

const verifySchema = z.object({
  planId: z.enum(['starter', 'pro', 'elite']),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const demoSchema = z.object({
  planId: z.enum(['starter', 'pro', 'elite']),
});

export function listPlans(_req: Request, res: Response): void {
  res.json({ success: true, data: publicPlansPayload() });
}

export async function getSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getOrCreate(req.user!);
    const active = isSubscriptionActive(profile.subscription);
    const plan = getActivePlan(profile);
    res.json({
      success: true,
      data: {
        subscription: profile.subscription || { status: 'none' },
        active,
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              dailyAutoApplyQuota: plan.dailyAutoApplyQuota,
              features: plan.features,
            }
          : null,
        dailyAutoApplyQuota: getDailyAutoApplyQuota(profile),
        razorpayConfigured: isRazorpayConfigured(),
        catalog: publicPlansPayload(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { planId } = orderSchema.parse(req.body);
    const order = await createRazorpayOrder({
      planId,
      uid: req.user!.uid,
      email: req.user!.email,
    });
    const plan = PLANS[planId];
    const paymentLinkUrl = await createRazorpayPaymentLink({
      planId,
      uid: req.user!.uid,
      email: req.user!.email,
      amount: order.amount,
      description: `ApplyAI ${plan.name} — ₹${plan.priceInr}/month`,
    });
    res.json({
      success: true,
      data: {
        keyId: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planId,
        paymentLinkUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = verifySchema.parse(req.body);
    const ok = verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
    if (!ok) {
      throw new AppError(400, 'Payment signature mismatch', 'RAZORPAY_VERIFY_FAILED');
    }

    const subscription = buildActivatedSubscription(body.planId, {
      provider: 'razorpay',
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      razorpaySignature: body.razorpay_signature,
    });

    const profile = await profileService.update(req.user!, {
      subscription,
      outreach: {
        dailyAutoApplyLimit: subscription.dailyAutoApplyQuota,
        dailyAutoApplyEnabled: true,
      },
    });

    logger.info('Plan activated via Razorpay', {
      uid: req.user!.uid,
      planId: body.planId,
      paymentId: body.razorpay_payment_id,
    });

    res.json({
      success: true,
      data: {
        subscription: profile.subscription,
        dailyAutoApplyQuota: subscription.dailyAutoApplyQuota,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Local/dev only — activate a plan without Razorpay when keys are missing. */
export async function demoActivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isRazorpayConfigured()) {
      throw new AppError(403, 'Demo activate is disabled when Razorpay is configured', 'FORBIDDEN');
    }
    const { planId } = demoSchema.parse(req.body);
    const subscription = buildActivatedSubscription(planId, { provider: 'demo' });
    const profile = await profileService.update(req.user!, {
      subscription,
      outreach: {
        dailyAutoApplyLimit: subscription.dailyAutoApplyQuota,
        dailyAutoApplyEnabled: true,
      },
    });
    res.json({
      success: true,
      data: {
        subscription: profile.subscription,
        dailyAutoApplyQuota: subscription.dailyAutoApplyQuota,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function razorpayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const raw =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : JSON.stringify(req.body || {});

    if (!verifyWebhookSignature(raw, signature)) {
      throw new AppError(400, 'Invalid webhook signature', 'RAZORPAY_WEBHOOK_INVALID');
    }

    const payload = JSON.parse(raw) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            notes?: { uid?: string; planId?: string };
          };
        };
        payment_link?: {
          entity?: {
            notes?: { uid?: string; planId?: string };
          };
        };
      };
    };

    const notes =
      payload.payload?.payment?.entity?.notes || payload.payload?.payment_link?.entity?.notes;
    const uid = notes?.uid;
    const planId = notes?.planId;
    if (
      (payload.event === 'payment.captured' || payload.event === 'payment_link.paid') &&
      uid &&
      isPlanId(planId)
    ) {
      await profileService.update(
        { uid, email: '', role: 'user' },
        {
          subscription: buildActivatedSubscription(planId, {
            provider: 'razorpay',
            razorpayOrderId: payload.payload?.payment?.entity?.order_id,
            razorpayPaymentId: payload.payload?.payment?.entity?.id,
          }),
        },
      );
      logger.info('Plan activated via Razorpay webhook', {
        uid,
        planId,
        event: payload.event,
        paymentId: payload.payload?.payment?.entity?.id,
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
