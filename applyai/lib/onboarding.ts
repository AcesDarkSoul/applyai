import { calculateProfileCompleteness, isProfileCompleteEnough } from '@/lib/profileCompleteness';
import type { Application, UserProfile } from '@/types';

export type OnboardingStepId = 'signup' | 'resume' | 'profile' | 'match' | 'apply';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  done: boolean;
  href: string;
}

export interface OnboardingInput {
  isSignedIn: boolean;
  profile: UserProfile | null;
  localHasResume: boolean;
  /** True when recommended/search jobs with match scores are available */
  hasMatches: boolean;
  applications: Application[];
}

export function getOnboardingSteps(input: OnboardingInput): OnboardingStep[] {
  const hasResume =
    input.localHasResume || Boolean(input.profile?.hasResume) || Boolean(input.profile?.resumeUrl);
  const completeness = calculateProfileCompleteness(input.profile, input.localHasResume);
  const hasApplied = input.applications.some(
    (a) => a.status !== 'pending' || Boolean(a.appliedAt)
  );

  return [
    {
      id: 'signup',
      title: 'Sign up',
      subtitle: 'Create your ApplyAI account',
      done: input.isSignedIn,
      href: '/(auth)/signup',
    },
    {
      id: 'resume',
      title: 'Upload resume',
      subtitle: 'Unlock AI parsing and smarter matches',
      done: hasResume,
      href: '/resume/upload',
    },
    {
      id: 'profile',
      title: 'Complete profile',
      subtitle: 'Skills, salary, location & more',
      done: isProfileCompleteEnough(completeness),
      href: '/(tabs)/profile',
    },
    {
      id: 'match',
      title: 'First match',
      subtitle: 'Browse AI-scored job matches',
      done: input.hasMatches,
      href: '/(tabs)/jobs',
    },
    {
      id: 'apply',
      title: 'First apply',
      subtitle: 'Track your first Smart Apply',
      done: hasApplied,
      href: '/(tabs)/apply',
    },
  ];
}

export function getOnboardingProgress(steps: OnboardingStep[]): {
  completed: number;
  total: number;
  percent: number;
  allDone: boolean;
  next: OnboardingStep | null;
} {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    allDone: completed === total,
    next: steps.find((s) => !s.done) ?? null,
  };
}
