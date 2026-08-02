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

export interface JobMatchScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
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
