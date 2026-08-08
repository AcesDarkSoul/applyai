export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface StatusEvent {
  status: ApplicationStatus;
  at: string;
  note?: string;
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
  timeline: StatusEvent[];
  notes: string;
  /** Latest AI/heuristic cover letter used for this apply. */
  coverLetterId?: string;
  coverLetter?: string;
  interviewAt?: string;
  createdAt: string;
  updatedAt: string;
}
