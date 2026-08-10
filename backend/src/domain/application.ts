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
  /** Last automatic status sync attempt (Module 9 / auto-sync). */
  lastSyncedAt?: string;
  /** How the current status was last advanced. */
  syncSource?: 'manual' | 'auto' | 'email_heuristic';
  createdAt: string;
  updatedAt: string;
}
