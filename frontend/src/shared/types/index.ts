export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  overall: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  isRemote: boolean;
  salary?: string;
  source: string;
  applyUrl: string;
  postedAt?: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  phone?: string;
  skills: string[];
  experienceYears?: number;
  education: string[];
  summary?: string;
  preferredLocations: string[];
  expectedSalary?: string;
  remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'any';
  atsScore?: number;
  profileCompleteness: number;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  source: string;
  applyUrl: string;
  status: ApplicationStatus;
  timeline: Array<{ status: ApplicationStatus; at: string; note?: string }>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppStats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  saved: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}
