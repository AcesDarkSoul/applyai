import { env } from '../config/env';
import type { PlanDefinition, PlanFeature, PlanId } from '../domain/plans';
import { PLAN_PERIOD_DAYS, PLANS, getPlan } from '../domain/plans';
import type { UserProfile, UserSubscription } from '../domain/user';
import { AppError } from '../middleware/errorHandler';

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/** When keys are missing, we still show plans but do not lock existing testers. */
export function isBillingEnforced(): boolean {
  return isRazorpayConfigured();
}

export function isSubscriptionActive(sub?: UserSubscription | null): boolean {
  if (!sub || (sub.status !== 'active' && sub.status !== 'past_due')) return false;
  if (!sub.currentPeriodEnd) return true;
  return new Date(sub.currentPeriodEnd).getTime() > Date.now();
}

export function getActivePlan(profile: UserProfile): PlanDefinition | null {
  const sub = profile.subscription;
  if (!isSubscriptionActive(sub) || !sub?.planId) return null;
  return getPlan(sub.planId);
}

export function getDailyAutoApplyQuota(profile: UserProfile): number {
  const plan = getActivePlan(profile);
  if (plan) return plan.dailyAutoApplyQuota;
  if (profile.subscription?.dailyAutoApplyQuota) {
    return profile.subscription.dailyAutoApplyQuota;
  }
  if (!isBillingEnforced()) {
    return env.DAILY_AUTO_APPLY_LIMIT;
  }
  return 0;
}

export function clampAutoApplyLimit(requested: number | undefined, profile: UserProfile): number {
  const quota = getDailyAutoApplyQuota(profile);
  if (quota <= 0) {
    throw new AppError(
      402,
      'Choose a plan to use auto-apply. Starter includes 8 applies per day.',
      'PLAN_REQUIRED',
    );
  }
  const asked = requested ?? quota;
  return Math.min(Math.max(asked, 1), quota);
}

export function assertFeature(profile: UserProfile, feature: PlanFeature): PlanDefinition | null {
  if (!isBillingEnforced()) {
    return getActivePlan(profile);
  }
  const plan = getActivePlan(profile);
  if (!plan) {
    throw new AppError(
      402,
      'An active ApplyAI plan is required to use this feature.',
      'PLAN_REQUIRED',
    );
  }
  if (!plan.features[feature]) {
    throw new AppError(
      403,
      `Upgrade your plan to use this. Included from ${featureLabel(feature)}.`,
      'PLAN_UPGRADE_REQUIRED',
      { feature, planId: plan.id },
    );
  }
  return plan;
}

function featureLabel(feature: PlanFeature): string {
  const map: Record<PlanFeature, string> = {
    jobs: 'Starter',
    posts: 'Starter',
    autoApply: 'Starter',
    resume: 'Starter',
    dashboard: 'Starter',
    smartApply: 'Starter',
    aiCoverLetters: 'Pro',
    analytics: 'Pro',
    aiTools: 'Pro',
    outreach: 'Pro',
    linkedinShare: 'Pro',
    jobRefresh: 'Elite',
  };
  return map[feature];
}

export function buildActivatedSubscription(
  planId: PlanId,
  extra: Partial<UserSubscription> = {},
): UserSubscription {
  const plan = PLANS[planId];
  const start = new Date();
  const end = new Date(start.getTime() + PLAN_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  return {
    ...extra,
    planId,
    status: 'active',
    provider: extra.provider || 'razorpay',
    dailyAutoApplyQuota: plan.dailyAutoApplyQuota,
    currentPeriodStart: extra.currentPeriodStart || start.toISOString(),
    currentPeriodEnd: extra.currentPeriodEnd || end.toISOString(),
    activatedAt: extra.activatedAt || start.toISOString(),
  };
}

export function publicPlansPayload() {
  return {
    currency: 'INR',
    periodDays: PLAN_PERIOD_DAYS,
    razorpayKeyId: env.RAZORPAY_KEY_ID || '',
    razorpayConfigured: isRazorpayConfigured(),
    billingEnforced: isBillingEnforced(),
    demoActivateEnabled: !isRazorpayConfigured(),
    plans: Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      priceInr: p.priceInr,
      amountPaise: p.priceInr * 100,
      periodLabel: p.periodLabel,
      popular: Boolean(p.popular),
      dailyAutoApplyQuota: p.dailyAutoApplyQuota,
      features: p.features,
      highlights: p.highlights,
      includes: p.includes,
    })),
  };
}
