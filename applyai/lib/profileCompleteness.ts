import type { UserProfile } from '@/types';

export type ProfileGapId =
  | 'name'
  | 'email'
  | 'skills'
  | 'experience'
  | 'education'
  | 'resume'
  | 'location'
  | 'summary'
  | 'expectedSalary';

export interface ProfileGap {
  id: ProfileGapId;
  label: string;
  nudge: string;
  /** Where to send the user to fix this */
  href: '/(tabs)/profile' | '/resume/upload';
}

const GAP_DEFS: Record<
  ProfileGapId,
  Omit<ProfileGap, 'id'> & { check: (p: UserProfile, hasResume: boolean) => boolean }
> = {
  name: {
    label: 'Full name',
    nudge: 'Add your name so applications look complete.',
    href: '/(tabs)/profile',
    check: (p) => Boolean(p.name?.trim()),
  },
  email: {
    label: 'Email',
    nudge: 'Confirm your email for recruiter replies.',
    href: '/(tabs)/profile',
    check: (p) => Boolean(p.email?.trim()),
  },
  skills: {
    label: 'Skills',
    nudge: 'Add skills to improve match accuracy.',
    href: '/(tabs)/profile',
    check: (p) => (p.skills?.length ?? 0) > 0,
  },
  experience: {
    label: 'Experience',
    nudge: 'Add years of experience for better role matching.',
    href: '/(tabs)/profile',
    check: (p) => (p.experience ?? 0) > 0,
  },
  education: {
    label: 'Education',
    nudge: 'Add education to raise your match score.',
    href: '/(tabs)/profile',
    check: (p) => (p.education?.length ?? 0) > 0,
  },
  resume: {
    label: 'Resume',
    nudge: 'Upload your resume to unlock smarter matching.',
    href: '/resume/upload',
    check: (_p, hasResume) => hasResume,
  },
  location: {
    label: 'Preferred location',
    nudge: 'Add preferred location to improve location match.',
    href: '/(tabs)/profile',
    check: (p) => Boolean(p.preferredLocation?.trim()),
  },
  summary: {
    label: 'Summary',
    nudge: 'Add a short professional summary for stronger matches.',
    href: '/(tabs)/profile',
    check: (p) => Boolean(p.summary?.trim()),
  },
  expectedSalary: {
    label: 'Expected salary',
    nudge: 'Add expected salary to improve matches.',
    href: '/(tabs)/profile',
    check: (p) => Boolean(p.expectedSalary?.trim()),
  },
};

const FIELD_ORDER: ProfileGapId[] = [
  'resume',
  'expectedSalary',
  'skills',
  'experience',
  'education',
  'location',
  'summary',
  'name',
  'email',
];

export function hasResumeFlag(profile: UserProfile | null, localHasResume = false): boolean {
  if (!profile) return localHasResume;
  return localHasResume || Boolean(profile.hasResume) || Boolean(profile.resumeUrl);
}

/** Profile completeness including expected salary (9 signals). */
export function calculateProfileCompleteness(
  profile: UserProfile | null,
  localHasResume = false
): number {
  if (!profile) return 0;
  const hasResume = hasResumeFlag(profile, localHasResume);
  const completed = FIELD_ORDER.filter((id) => GAP_DEFS[id].check(profile, hasResume)).length;
  return Math.round((completed / FIELD_ORDER.length) * 100);
}

/** Missing fields with actionable nudges, prioritized for impact. */
export function getProfileGaps(
  profile: UserProfile | null,
  localHasResume = false,
  limit = 3
): ProfileGap[] {
  if (!profile) {
    return [
      {
        id: 'resume' as const,
        label: GAP_DEFS.resume.label,
        nudge: GAP_DEFS.resume.nudge,
        href: GAP_DEFS.resume.href,
      },
    ].slice(0, limit);
  }
  const hasResume = hasResumeFlag(profile, localHasResume);
  const gaps: ProfileGap[] = [];
  for (const id of FIELD_ORDER) {
    const def = GAP_DEFS[id];
    if (!def.check(profile, hasResume)) {
      gaps.push({ id, label: def.label, nudge: def.nudge, href: def.href });
      if (gaps.length >= limit) break;
    }
  }
  return gaps;
}

export function isProfileCompleteEnough(completeness: number): boolean {
  return completeness >= 80;
}
