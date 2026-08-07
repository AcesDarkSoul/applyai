import type { UserProfile } from '../domain/user';

/**
 * Build a job-board search query from the user's resume/profile.
 * Prefer explicit user search text when provided.
 */
export function buildJobSearchQuery(
  profile: UserProfile | null | undefined,
  explicit?: string,
): string {
  const typed = explicit?.trim();
  if (typed) return typed;

  if (!profile) return 'software engineer';

  const parts: string[] = [];
  if (profile.title?.trim()) {
    parts.push(profile.title.trim());
  } else if (profile.skills?.length) {
    parts.push(...profile.skills.slice(0, 3));
  }

  const loc =
    profile.preferredLocations?.find((l) => l && !/^remote$/i.test(l)) ||
    (profile.location && !/^remote$/i.test(profile.location) ? profile.location : '');
  if (loc) parts.push(loc);

  return parts.join(' ').trim() || 'software engineer';
}

/** Soft keywords derived from resume for local ranking boosts. */
export function profileMatchKeywords(profile: UserProfile | null | undefined): string[] {
  if (!profile) return [];
  const words = new Set<string>();
  if (profile.title) {
    for (const w of profile.title.split(/[\s,/|]+/)) {
      if (w.length > 2) words.add(w.toLowerCase());
    }
  }
  for (const s of profile.skills || []) {
    if (s.trim()) words.add(s.toLowerCase());
  }
  for (const e of profile.experienceEntries || []) {
    for (const w of `${e.title} ${e.company}`.split(/[\s,/|]+/)) {
      if (w.length > 3) words.add(w.toLowerCase());
    }
  }
  return [...words].slice(0, 40);
}
