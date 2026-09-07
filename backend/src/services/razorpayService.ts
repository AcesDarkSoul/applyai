import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import type { PlanId } from '../domain/plans';
import { AppError } from '../middleware/errorHandler';
import { planAmountPaiseFromSettings } from './appSettingsService';

const RAZORPAY_ORDERS = 'https://api.razorpay.com/v1/orders';

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

function authHeader(): string {
  const token = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

export async function createRazorpayOrder(input: {
  planId: PlanId;
  uid: string;
  email: string;
}): Promise<RazorpayOrder> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(
      503,
      'Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      'BILLING_NOT_CONFIGURED',
    );
  }

  const amount = await planAmountPaiseFromSettings(input.planId);
  const receipt = `aa_${input.planId}_${Date.now().toString(36)}`.slice(0, 40);
  const res = await fetch(RAZORPAY_ORDERS, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        uid: input.uid,
        email: input.email,
        planId: input.planId,
        product: 'applyai',
      },
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | RazorpayOrder
    | { error?: { description?: string; code?: string } }
    | null;

  if (!res.ok || !json || !('id' in json)) {
    const msg =
      json && 'error' in json && json.error?.description
        ? json.error.description
        : 'Could not create Razorpay order';
    throw new AppError(502, msg, 'RAZORPAY_ORDER_FAILED');
  }

  return json;
}

export async function createRazorpayPaymentLink(input: {
  planId: PlanId;
  uid: string;
  email: string;
  amount: number;
  description: string;
}): Promise<string | null> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  const res = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: 'INR',
      accept_partial: false,
      description: input.description,
      // Do not set customer.email/contact — keeps checkout from requiring them.
      notify: { email: false, sms: false },
      reminder_enable: false,
      notes: {
        uid: input.uid,
        email: input.email || '',
        planId: input.planId,
        product: 'applyai',
      },
    }),
  });
  const json = (await res.json().catch(() => null)) as { short_url?: string } | null;
  return json?.short_url || null;
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(input.signature, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
