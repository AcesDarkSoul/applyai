export type AuditAction =
  | 'smart_apply'
  | 'outreach_apply'
  | 'auto_apply'
  | 'status_sync'
  | 'consent_update'
  | 'platform_toggle'
  | 'resume_tailor'
  | 'notification_pref';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  /** Human-readable summary for the compliance log. */
  summary: string;
  jobId?: string;
  applicationId?: string;
  platform?: string;
  /** Explicit user confirmation captured at action time. */
  confirmedAssistiveOnly?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Per-platform Smart Apply enablement (AD-002). */
export interface SmartApplyPlatformPrefs {
  linkedin?: boolean;
  indeed?: boolean;
  naukri?: boolean;
  googlejobs?: boolean;
  other?: boolean;
}

export const DEFAULT_SMART_APPLY_PLATFORMS: Required<SmartApplyPlatformPrefs> = {
  linkedin: true,
  indeed: true,
  naukri: true,
  googlejobs: true,
  other: true,
};
