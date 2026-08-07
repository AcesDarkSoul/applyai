import type { Job, MatchBreakdown } from '../domain/job';
import type { UserProfile } from '../domain/user';
import { profileMatchKeywords } from './jobQuery';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function skillsScore(profile: UserProfile, job: Job): number {
  const skills = (profile.skills || []).map((s) => s.trim()).filter(Boolean);
  if (!skills.length) return 35;
  const text = `${job.title} ${job.description}`.toLowerCase();
  let hits = 0;
  for (const skill of skills) {
    const s = skill.toLowerCase();
    if (s.length < 2) continue;
    if (text.includes(s)) {
      hits += 1;
      continue;
    }
    // partial token hit (e.g. "Jetpack Compose" → "compose")
    const parts = s.split(/[\s/]+/).filter((p) => p.length > 3);
    if (parts.some((p) => text.includes(p))) hits += 0.6;
  }
  return clamp((hits / Math.max(skills.length, 1)) * 100);
}

function titleScore(profile: UserProfile, job: Job): number {
  const target = (profile.title || '').trim().toLowerCase();
  const jobTitle = (job.title || '').toLowerCase();
  if (!target) {
    // Fall back to keyword overlap from skills/experience
    const keywords = profileMatchKeywords(profile);
    if (!keywords.length) return 45;
    const hits = keywords.filter((k) => jobTitle.includes(k)).length;
    return clamp(40 + hits * 12);
  }
  if (jobTitle.includes(target) || target.includes(jobTitle)) return 95;

  const targetTokens = tokenize(target).filter((t) => t.length > 2);
  const jobTokens = new Set(tokenize(jobTitle));
  if (!targetTokens.length) return 45;
  const overlap = targetTokens.filter((t) => jobTokens.has(t)).length;
  const ratio = overlap / targetTokens.length;
  // Strong boost when core role words align (android, developer, engineer…)
  return clamp(35 + ratio * 65);
}

function experienceScore(profile: UserProfile, job: Job): number {
  const years =
    profile.experienceYears ??
    (profile.experienceEntries?.length ? Math.max(1, profile.experienceEntries.length) : 0);
  const text = `${job.title} ${job.description}`.toLowerCase();
  if (/\b(senior|lead|staff|principal)\b/.test(text)) {
    return clamp(years >= 4 ? 90 : years * 18);
  }
  if (/\b(junior|entry|intern|fresher|graduate)\b/.test(text)) {
    return clamp(years <= 2 ? 90 : years <= 4 ? 75 : 55);
  }
  return clamp(50 + Math.min(years, 8) * 5);
}

function educationScore(profile: UserProfile): number {
  if ((profile.educationEntries?.length ?? 0) > 0) return 85;
  if ((profile.education?.length ?? 0) > 0) return 80;
  return 50;
}

function locationScore(profile: UserProfile, job: Job): number {
  if (job.isRemote) {
    if (profile.remotePreference === 'onsite') return 55;
    return 95;
  }
  const prefs = [
    ...(profile.preferredLocations || []),
    ...(profile.location ? [profile.location] : []),
  ].filter(Boolean);
  if (!prefs.length) return 60;
  const loc = job.location.toLowerCase();
  const hit = prefs.some((p) => loc.includes(p.toLowerCase()) || p.toLowerCase().includes(loc));
  return hit ? 92 : 42;
}

function salaryScore(profile: UserProfile, job: Job): number {
  if (!profile.expectedSalary || !job.salary) return 65;
  return 75;
}

export function computeMatch(profile: UserProfile, job: Job): MatchBreakdown {
  const skills = skillsScore(profile, job);
  const title = titleScore(profile, job);
  const experience = experienceScore(profile, job);
  const education = educationScore(profile);
  const location = locationScore(profile, job);
  const salary = salaryScore(profile, job);

  // Weight resume title + skills highest so Android resumes surface Android jobs
  const overall = clamp(
    skills * 0.34 + title * 0.28 + experience * 0.18 + location * 0.1 + education * 0.05 + salary * 0.05,
  );

  return { skills, title, experience, education, location, salary, overall };
}
