export type NotificationType =
  | 'high_match_job'
  | 'interview_update'
  | 'weekly_summary'
  | 'application_sync'
  | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  jobId?: string;
  applicationId?: string;
  read: boolean;
  channels: NotificationChannel[];
  emailSent?: boolean;
  createdAt: string;
}

export interface NotificationPrefs {
  /** Master in-app feed (default on). */
  inAppEnabled?: boolean;
  /** Product emails via SendGrid / platform mail (default on when SendGrid configured). */
  emailEnabled?: boolean;
  /** Push tokens reserved for mobile (default off until Expo push wired). */
  pushEnabled?: boolean;
  highMatchJobs?: boolean;
  interviewUpdates?: boolean;
  weeklySummary?: boolean;
  /** Minimum match % to notify for high-match jobs. */
  highMatchMinScore?: number;
  /** Push device tokens (Expo / FCM) — stored for future delivery. */
  pushTokens?: string[];
}

export const DEFAULT_NOTIFICATION_PREFS: Required<
  Omit<NotificationPrefs, 'pushTokens'>
> & { pushTokens: string[] } = {
  inAppEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  highMatchJobs: true,
  interviewUpdates: true,
  weeklySummary: true,
  highMatchMinScore: 70,
  pushTokens: [],
};
