export type PlanId = 'starter' | 'pro' | 'elite';

export type PlanFeature =
  | 'jobs'
  | 'posts'
  | 'autoApply'
  | 'resume'
  | 'dashboard'
  | 'smartApply'
  | 'aiCoverLetters'
  | 'analytics'
  | 'aiTools'
  | 'outreach'
  | 'linkedinShare'
  | 'jobRefresh';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  priceInr: number;
  periodLabel: string;
  popular?: boolean;
  dailyAutoApplyQuota: number;
  features: Record<PlanFeature, boolean>;
  highlights: string[];
  includes: string[];
}

export const PLAN_PERIOD_DAYS = 30;

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get in, fetch jobs, and start applying',
    priceInr: 599,
    periodLabel: 'per month',
    dailyAutoApplyQuota: 8,
    features: {
      jobs: true,
      posts: true,
      autoApply: true,
      resume: true,
      dashboard: true,
      smartApply: true,
      aiCoverLetters: false,
      analytics: false,
      aiTools: false,
      outreach: false,
      linkedinShare: false,
      jobRefresh: false,
    },
    highlights: [
      '8 auto-apply per day',
      'Daily job fetch',
      'Hiring posts access',
    ],
    includes: [
      '8 assistive auto-applies every day',
      'Today’s jobs + search',
      'Hiring posts feed',
      'Resume upload & ATS score',
      'Dashboard and application tracker',
      'Manual Smart Apply (open official listing)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Serious search with AI letters and outreach',
    priceInr: 1499,
    periodLabel: 'per month',
    popular: true,
    dailyAutoApplyQuota: 25,
    features: {
      jobs: true,
      posts: true,
      autoApply: true,
      resume: true,
      dashboard: true,
      smartApply: true,
      aiCoverLetters: true,
      analytics: true,
      aiTools: true,
      outreach: true,
      linkedinShare: true,
      jobRefresh: false,
    },
    highlights: [
      '25 auto-apply per day',
      'AI cover letters & tools',
      'Email / WhatsApp outreach',
    ],
    includes: [
      'Everything in Starter',
      '25 assistive auto-applies every day',
      'AI cover letters on every apply',
      'AI Tools: tailor resume, skill gap',
      'Analytics funnel',
      'Daily automation included',
      'Background email / WhatsApp when you connect accounts',
      'LinkedIn share templates',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    tagline: 'Maximum reach — full AI stack',
    priceInr: 2999,
    periodLabel: 'per month',
    dailyAutoApplyQuota: 50,
    features: {
      jobs: true,
      posts: true,
      autoApply: true,
      resume: true,
      dashboard: true,
      smartApply: true,
      aiCoverLetters: true,
      analytics: true,
      aiTools: true,
      outreach: true,
      linkedinShare: true,
      jobRefresh: true,
    },
    highlights: [
      '50 auto-apply per day',
      'Live job refresh',
      'Full outreach + priority matching',
    ],
    includes: [
      'Everything in Pro',
      '50 assistive auto-applies every day',
      'On-demand live job refresh',
      'Highest daily quota and AI rate room',
      'Priority matching for daily automation',
      'All AI tools and recruiter outreach',
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.starter, PLANS.pro, PLANS.elite];

export function isPlanId(value: unknown): value is PlanId {
  return value === 'starter' || value === 'pro' || value === 'elite';
}

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS[planId];
}

export function planAmountPaise(planId: PlanId): number {
  return PLANS[planId].priceInr * 100;
}

/** Exclusive true/false flags for Firebase Console activation. */
export function buildPlanFlags(planId: PlanId): Record<PlanId, boolean> {
  return {
    starter: planId === 'starter',
    pro: planId === 'pro',
    elite: planId === 'elite',
  };
}

/** Highest active flag wins: elite > pro > starter. */
export function planIdFromFlags(flags?: Partial<Record<PlanId, boolean>> | null): PlanId | null {
  if (!flags) return null;
  if (flags.elite) return 'elite';
  if (flags.pro) return 'pro';
  if (flags.starter) return 'starter';
  return null;
}
