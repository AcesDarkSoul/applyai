import type { UserProfile } from '../domain/user';
import type { AuthUser } from '../domain/user';
import { userRepository } from '../repositories';

function completeness(p: Omit<UserProfile, 'profileCompleteness'>): number {
  const skills = p.skills ?? [];
  const education = p.education ?? [];
  const preferredLocations = p.preferredLocations ?? [];
  const checks = [
    Boolean(p.displayName),
    Boolean(p.email),
    Boolean(p.phone),
    Boolean(p.title),
    skills.length >= 3,
    education.length > 0 || (p.educationEntries?.length ?? 0) > 0,
    Boolean(p.summary && p.summary.length > 80),
    preferredLocations.length > 0 || Boolean(p.location),
    Boolean(p.expectedSalary) || Boolean(p.experienceYears),
    Boolean(p.resumeFileName) || (p.experienceEntries?.length ?? 0) > 0,
    (p.projects?.length ?? 0) > 0 || (p.certifications?.length ?? 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export class ProfileService {
  async getOrCreate(auth: AuthUser): Promise<UserProfile> {
    const byEmail =
      typeof (userRepository as { getByEmail?: (email: string) => Promise<UserProfile | null> })
        .getByEmail === 'function' && auth.email
        ? await (
            userRepository as { getByEmail: (email: string) => Promise<UserProfile | null> }
          ).getByEmail(auth.email)
        : null;
    const existing = byEmail || (await userRepository.getById(auth.uid));
    if (existing) {
      // Normalize older/corrupt docs missing array fields
      const normalized: UserProfile = {
        ...existing,
        uid: existing.uid || auth.uid,
        email: (existing.email || auth.email || '').toLowerCase(),
        skills: existing.skills ?? [],
        education: existing.education ?? [],
        preferredLocations: existing.preferredLocations ?? [],
      };
      if (
        !existing.skills ||
        !existing.education ||
        !existing.preferredLocations ||
        existing.uid !== auth.uid ||
        (existing.email || '').toLowerCase() !== (auth.email || '').toLowerCase()
      ) {
        return userRepository.upsert({
          ...normalized,
          uid: auth.uid,
          email: (auth.email || normalized.email).toLowerCase(),
          profileCompleteness: completeness(normalized),
          updatedAt: new Date().toISOString(),
        });
      }
      return normalized;
    }

    const now = new Date().toISOString();
    const email = (auth.email || '').toLowerCase();
    const base = {
      uid: auth.uid,
      email,
      displayName: email.split('@')[0] || 'Candidate',
      role: auth.role,
      skills: [] as string[],
      education: [],
      preferredLocations: [],
      remotePreference: 'any' as const,
      plans: { starter: false, pro: false, elite: false },
      createdAt: now,
      updatedAt: now,
    };
    const profile: UserProfile = {
      ...base,
      profileCompleteness: completeness(base),
    };
    return userRepository.upsert(profile);
  }

  async update(auth: AuthUser, patch: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getOrCreate(auth);
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as Partial<UserProfile>;
    const merged = {
      ...current,
      ...cleanPatch,
      uid: current.uid,
      email: current.email,
      role: current.role,
      skills: cleanPatch.skills ?? current.skills ?? [],
      education: cleanPatch.education ?? current.education ?? [],
      preferredLocations: cleanPatch.preferredLocations ?? current.preferredLocations ?? [],
      outreach: cleanPatch.outreach
        ? { ...(current.outreach || {}), ...cleanPatch.outreach }
        : current.outreach,
      updatedAt: new Date().toISOString(),
    };
    const profile: UserProfile = {
      ...merged,
      profileCompleteness: completeness(merged),
    };
    return userRepository.upsert(profile);
  }
}

export const profileService = new ProfileService();
