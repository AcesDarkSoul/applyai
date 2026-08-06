export type UserRole = 'user' | 'admin';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  skills: string[];
  experienceYears?: number;
  education: string[];
  summary?: string;
  preferredLocations: string[];
  expectedSalary?: string;
  remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'any';
  atsScore?: number;
  profileCompleteness: number;
  resumeFileName?: string;
  resumeParsedAt?: string;
  createdAt: string;
  updatedAt: string;
}
