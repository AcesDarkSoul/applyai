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
  interviewAt?: string;
  createdAt: string;
  updatedAt: string;
}
