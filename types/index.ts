export type ApplicationStatus =
  | 'pending'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  skills: string[];
  experience: number;
  education: Education[];
  certifications: string[];
  projects: Project[];
  languages: string[];
  preferredLocation: string;
  expectedSalary?: string;
  workAuthorization?: string;
  atsScore?: number;
  hasResume?: boolean;
  resumeUrl?: string;
  resumeFileName?: string;
  summary?: string;
  linkedin?: string;
  parseStatus?: 'complete' | 'manual' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  remote: boolean;
  description: string;
  requirements: string[];
  skills: string[];
  url: string;
  source: string;
  postedAt: string;
  matchScore?: JobMatchScore;
}

export interface AIJobAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
  atsKeywords: string[];
  outreachStrategy: string;
  summary: string;
}

export interface JobMatchScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  analysis?: AIJobAnalysis;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  matchScore: number;
  appliedAt?: string;
  updatedAt: string;
  notes?: string;
}

export interface DashboardStats {
  applicationsSent: number;
  pending: number;
  interviews: number;
  offers: number;
  rejections: number;
  profileCompleteness: number;
}

export interface OutreachEmail {
  id: string;
  userId: string;
  recruiterEmail: string;
  recruiterName?: string;
  jobTitle: string;
  company: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed';
  sentAt?: string;
}

export interface JobFilterParams {
  query?: string;
  platform?: string; // 'all' | 'linkedin' | 'indeed' | 'naukri' | 'other'
  remote?: boolean;
  workMode?: 'all' | 'remote' | 'hybrid' | 'onsite';
  employmentType?: 'all' | 'full-time' | 'part-time' | 'contract' | 'internship';
  seniority?: 'all' | 'entry' | 'mid' | 'senior' | 'lead';
  minSalary?: number;
  minMatchScore?: number;
  datePosted?: 'any' | '24h' | 'week' | 'month';
  location?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedJobsResponse {
  jobs: Job[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
}
