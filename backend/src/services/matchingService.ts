import type { Job, MatchBreakdown } from '../domain/job';
import type { UserProfile } from '../domain/user';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function skillsScore(profile: UserProfile, job: Job): number {
  if (!profile.skills.length) return 40;
  const text = `${job.title} ${job.description}`.toLowerCase();
  const hits = profile.skills.filter((s) => text.includes(s.toLowerCase())).length;
  return clamp((hits / Math.max(profile.skills.length, 1)) * 100);
}

function experienceScore(profile: UserProfile, job: Job): number {
  const years = profile.experienceYears ?? 0;
  const text = job.description.toLowerCase();
  if (text.includes('senior') || text.includes('lead')) {
    return clamp(years >= 5 ? 90 : years * 15);
  }
  if (text.includes('junior') || text.includes('entry')) {
    return clamp(years <= 3 ? 85 : 70);
  }
  return clamp(50 + Math.min(years, 8) * 5);
}

function educationScore(profile: UserProfile): number {
  return profile.education.length ? 80 : 50;
}

function locationScore(profile: UserProfile, job: Job): number {
  if (job.isRemote) {
    if (profile.remotePreference === 'onsite') return 55;
    return 95;
  }
  if (!profile.preferredLocations.length) return 60;
  const loc = job.location.toLowerCase();
  const hit = profile.preferredLocations.some((p) => loc.includes(p.toLowerCase()));
  return hit ? 90 : 45;
}

function salaryScore(profile: UserProfile, job: Job): number {
  if (!profile.expectedSalary || !job.salary) return 65;
  return 75;
}

export function computeMatch(profile: UserProfile, job: Job): MatchBreakdown {
  const skills = skillsScore(profile, job);
  const experience = experienceScore(profile, job);
  const education = educationScore(profile);
  const location = locationScore(profile, job);
  const salary = salaryScore(profile, job);
  const overall = clamp((skills + experience + education + location + salary) / 5);

  return { skills, experience, education, location, salary, overall };
}
