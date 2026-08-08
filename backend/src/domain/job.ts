export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  isRemote: boolean;
  salary?: string;
  source: 'linkedin' | 'indeed' | 'naukri' | 'googlejobs' | 'other';
  applyUrl: string;
  contactEmail?: string;
  contactPhone?: string;
  hrEmail?: string;
  hrPhone?: string;
  postedAt?: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface MatchBreakdown {
  skills: number;
  title: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  overall: number;
}
