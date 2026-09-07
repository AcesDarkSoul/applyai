import type { Request, Response } from 'express';
import { env, isDemoMode } from '../config/env';
import { repositoryMode } from '../repositories';

export function health(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'applyai-api',
      env: env.NODE_ENV,
      demoMode: isDemoMode,
      repository: repositoryMode(),
      razorpayConfigured: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
      billingRequirePlan: env.BILLING_REQUIRE_PLAN,
      timestamp: new Date().toISOString(),
    },
  });
}
