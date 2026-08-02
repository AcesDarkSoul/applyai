import type { UserProfile } from '../domain/user';
import type { AuthUser } from '../domain/user';
import { userRepository } from '../repositories';

function completeness(p: Omit<UserProfile, 'profileCompleteness'>): number {
  const checks = [
    Boolean(p.displayName),
    Boolean(p.email),
    Boolean(p.phone),
    p.skills.length > 0,
    p.education.length > 0,
    Boolean(p.summary),
    p.preferredLocations.length > 0,
    Boolean(p.expectedSalary),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export class ProfileService {
  async getOrCreate(auth: AuthUser): Promise<UserProfile> {
    const existing = await userRepository.getById(auth.uid);
    if (existing) return existing;

    const now = new Date().toISOString();
    const base = {
      uid: auth.uid,
      email: auth.email,
      displayName: auth.email.split('@')[0] || 'Candidate',
      role: auth.role,
      skills: ['TypeScript', 'React', 'Node.js'],
      education: [],
      preferredLocations: [],
      remotePreference: 'any' as const,
      atsScore: 72,
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
    const merged = {
      ...current,
      ...patch,
      uid: current.uid,
      email: current.email,
      role: current.role,
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
