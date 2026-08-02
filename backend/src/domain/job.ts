export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  isRemote: boolean;
  salary?: string;
  source: 'linkedin' | 'indeed' | 'naukri' | 'other';
  applyUrl: string;
  postedAt?: string;
  matchScore?: number;
  matchBreakdown?: MatchBreakdown;
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  location: number;
  salary: number;
  overall: number;
}
