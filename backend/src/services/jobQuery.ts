import type { UserProfile } from '../domain/user';

/** Keep only short place-like strings (avoid resume bullets leaking into SerpApi location). */
export function sanitizeJobLocation(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const loc = String(raw).replace(/\s+/g, ' ').trim();
  if (!loc || /^remote$/i.test(loc)) return undefined;
  if (loc.length > 60) return undefined;
  if (/[•·|]/.test(loc)) return undefined;
  if (/\b(contributed|developed|responsible|experience|skills)\b/i.test(loc)) return undefined;
  return loc;
}

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

  // Location is passed separately to scrapers — keep query title/skills only
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
