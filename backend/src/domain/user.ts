import type { SmartApplyPlatformPrefs } from './audit';
import type { NotificationPrefs } from './notification';
import type { PlanId } from './plans';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
} from './resume';

export type UserRole = 'user' | 'admin';

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface UserSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  provider: 'razorpay' | 'demo' | 'manual';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  dailyAutoApplyQuota?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  activatedAt?: string;
}

/**
 * Admin / Console toggles on users/{uid}.
 * Set any plan to true in Firebase to grant access (highest true wins: elite > pro > starter).
 */
export type UserPlanFlags = {
  starter?: boolean;
  pro?: boolean;
  elite?: boolean;
};

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
}

/**
 * Credentials for background outreach FROM the user's own accounts.
 * Email uses SMTP (e.g. Gmail App Password) so From = user's address.
 * WhatsApp uses Meta Cloud API or Twilio WhatsApp on the user's Business number
 * (personal WhatsApp mobile app cannot send silently — Meta/OS restriction).
 */
export interface OutreachCredentials {
  /** Master switch — when true, skip dry-run and send in background. */
  autoSendEnabled?: boolean;
  /** Opt into daily background auto-apply (default true when resume exists). */
  dailyAutoApplyEnabled?: boolean;
  /** Max roles to auto-apply per daily run. */
  dailyAutoApplyLimit?: number;
  /** Minimum match score for daily auto-apply. */
  dailyMinScore?: number;
  /** SMTP — send email as the user */
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  /** Meta WhatsApp Cloud API (preferred for "your" WA business number) */
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  /** Twilio WhatsApp (alternative) */
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsappFrom?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
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
  /** Background email / WhatsApp send settings (user's accounts). */
  outreach?: OutreachCredentials;
  /** Product notification preferences (Module 10). */
  notificationPrefs?: NotificationPrefs;
  /**
   * Per-platform Smart Apply toggles (AD-002).
   * When a platform is disabled, smart/outreach/auto-apply skips that source.
   */
  smartApplyPlatforms?: SmartApplyPlatformPrefs;
  /**
   * Last time the user confirmed assistive-only Smart Apply consent.
   * Required UX gate before batch automation.
   */
  smartApplyConsentAt?: string;
  /** Paid access. Enforced when Razorpay keys are configured. */
  subscription?: UserSubscription;
  /** True/false plan activation flags editable from Firebase Console. */
  plans?: UserPlanFlags;
  createdAt: string;
  updatedAt: string;
}
