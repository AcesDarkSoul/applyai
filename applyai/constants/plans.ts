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

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  priceInr: number;
  periodLabel: string;
  popular?: boolean;
  dailyAutoApplyQuota: number;
  accent: [string, string];
  features: Record<PlanFeature, boolean>;
  highlights: string[];
  includes: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get in, fetch jobs, and start applying',
    priceInr: 599,
    periodLabel: 'per month',
    dailyAutoApplyQuota: 8,
    accent: ['#6d5efc', '#8b5cf6'],
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
    highlights: ['8 auto-apply / day', 'Daily job fetch', 'Hiring posts'],
    includes: [
      '8 assistive auto-applies every day',
      'Today’s jobs + search',
      'Hiring posts feed',
      'Resume upload & ATS score',
      'Dashboard and application tracker',
      'Manual Smart Apply',
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
    accent: ['#8b5cf6', '#ff7a66'],
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
    highlights: ['25 auto-apply / day', 'AI cover letters', 'Email / WhatsApp outreach'],
    includes: [
      'Everything in Starter',
      '25 assistive auto-applies every day',
      'AI cover letters on every apply',
      'AI Tools: tailor resume, skill gap',
      'Analytics funnel',
      'Daily automation',
      'Outreach when you connect accounts',
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
    accent: ['#0ea5e9', '#6d5efc'],
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
    highlights: ['50 auto-apply / day', 'Live job refresh', 'Priority matching'],
    includes: [
      'Everything in Pro',
      '50 assistive auto-applies every day',
      'On-demand live job refresh',
      'Highest daily quota',
      'Priority matching for daily automation',
      'All AI tools and recruiter outreach',
    ],
  },
};

export const PLAN_LIST: PlanDefinition[] = [PLANS.starter, PLANS.pro, PLANS.elite];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
