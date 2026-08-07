import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from './resume';

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
  website?: string;
  location?: string;
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
  resumeId?: string;
  /** Advanced builder sections — also mirrored on resume docs in Firestore. */
  experienceEntries?: ExperienceEntry[];
  educationEntries?: EducationEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  languages?: string[];
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}
