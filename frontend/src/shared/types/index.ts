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
  title?: number;
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

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  url?: string;
  tech?: string;
  description: string;
  bullets?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
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
  experienceEntries?: ExperienceEntry[];
  educationEntries?: EducationEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  languages?: string[];
  achievements?: string[];
  outreach?: {
    autoSendEnabled?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPass?: string;
    whatsappPhoneNumberId?: string;
    whatsappAccessToken?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioWhatsappFrom?: string;
  };
}

export interface ResumeDocument {
  id: string;
  userId: string;
  source: 'upload' | 'builder';
  fileName: string;
  mimeType?: string;
  uploadedAt: string;
  updatedAt: string;
  parseMethod?: string;
  textChars?: number;
  htmlContent?: string;
  template?: 'classic' | 'modern' | 'executive';
  atsScore?: number;
  parsed?: Record<string, unknown>;
}

export interface ResumeBuilderInput {
  displayName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  website?: string;
  summary?: string;
  skills: string[];
  experienceYears?: number;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  languages: string[];
  achievements: string[];
  template?: 'classic' | 'modern' | 'executive';
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
  coverLetterId?: string;
  coverLetter?: string;
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

export interface HiringPost {
  id: string;
  title: string;
  company: string;
  author: string;
  body: string;
  excerpt: string;
  location: string;
  isRemote: boolean;
  source: string;
  postUrl: string;
  postedAt?: string;
  jobId: string;
  contacts: { email: string | null; phone: string | null };
  sections: Array<{ heading: string; content: string }>;
  matchScore?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  meta?: Record<string, unknown>;
}
