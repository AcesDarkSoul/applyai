import { api, ensureApiToken, getApiBaseUrl } from './client';
import { Platform } from 'react-native';

type ApiResponse<T> = { data: T; meta?: Record<string, unknown> };

export type AppStats = {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected?: number;
  coverLetters?: number;
};

export type ApiJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  employmentType?: string;
  isRemote?: boolean;
  salary?: string;
  source: string;
  applyUrl?: string;
  matchScore?: number;
  postedAt?: string;
};

export type ApiApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  source?: string;
  coverLetter?: string;
  syncNote?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type HiringPost = {
  id: string;
  title: string;
  company: string;
  location?: string;
  source: string;
  snippet?: string;
  body?: string;
  matchScore?: number;
  applyUrl?: string;
  contacts?: { email?: string | null; phone?: string | null };
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type NotificationPrefs = {
  emailEnabled?: boolean;
  highMatchJobs?: boolean;
  interviewUpdates?: boolean;
  weeklySummary?: boolean;
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
};

export type LearningStep = {
  skill: string;
  why: string;
  estimatedHours: number;
  resources: Array<{ title: string; url: string }>;
};

export type SkillGapResult = {
  missing: string[];
  matched: string[];
  score?: number;
  summary?: string;
  learningRoadmap?: LearningStep[];
};

export type SmartApplyPlatformPrefs = {
  linkedin?: boolean;
  indeed?: boolean;
  naukri?: boolean;
  other?: boolean;
};

export type PlanId = 'starter' | 'pro' | 'elite';

export type ApiSubscription = {
  planId?: PlanId;
  status?: 'none' | 'active' | 'past_due' | 'cancelled' | 'expired';
  provider?: 'razorpay' | 'demo' | 'manual';
  dailyAutoApplyQuota?: number;
  currentPeriodEnd?: string;
  activatedAt?: string;
};

export type BillingCatalog = {
  currency: string;
  periodDays: number;
  razorpayKeyId: string;
  razorpayConfigured: boolean;
  billingEnforced: boolean;
  demoActivateEnabled: boolean;
  plans: Array<{
    id: PlanId;
    name: string;
    tagline: string;
    priceInr: number;
    amountPaise: number;
    periodLabel: string;
    popular: boolean;
    dailyAutoApplyQuota: number;
    highlights: string[];
    includes: string[];
  }>;
};

export type ApiUserProfile = {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  website?: string;
  location?: string;
  skills: string[];
  experienceYears?: number;
  education: string[];
  summary?: string;
  preferredLocations?: string[];
  atsScore?: number;
  profileCompleteness?: number;
  resumeFileName?: string;
  notificationPrefs?: NotificationPrefs;
  smartApplyPlatforms?: SmartApplyPlatformPrefs;
  smartApplyConsentAt?: string;
  outreach?: {
    dailyAutoApplyEnabled?: boolean;
    dailyAutoApplyLimit?: number;
    dailyMinScore?: number;
    autoSendEnabled?: boolean;
  };
  subscription?: ApiSubscription;
};

export const profileRepository = {
  async me(): Promise<ApiUserProfile> {
    const { data } = await api.get<ApiResponse<ApiUserProfile>>('/me');
    return data.data;
  },
  async update(patch: Partial<ApiUserProfile>) {
    const { data } = await api.patch<ApiResponse<ApiUserProfile>>('/me', patch);
    return data.data;
  },
  async uploadResume(file: { uri: string; name: string; mimeType?: string } | Blob) {
    const { fileName, mimeType, contentBase64 } = await readResumeAsBase64(file);

    const token = await ensureApiToken();
    const res = await fetch(`${getApiBaseUrl()}/me/resume`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token
          ? { Authorization: `Bearer ${token}`, 'X-Firebase-Authorization': `Bearer ${token}` }
          : {}),
      },
      body: JSON.stringify({ fileName, mimeType, contentBase64 }),
    });
    const json = (await res.json().catch(() => null)) as
      | ApiResponse<{ profile: ApiUserProfile; parsed: Record<string, unknown> }>
      | { error?: { message?: string } }
      | null;
    if (!res.ok) {
      const msg =
        json && 'error' in json && json.error?.message
          ? json.error.message
          : `Upload failed (${res.status})`;
      throw new Error(msg);
    }
    if (!json || !('data' in json) || !json.data) {
      throw new Error('Upload failed');
    }
    return json.data;
  },
  async optimizeResume(input?: { jobTitle?: string; jobDescription?: string }) {
    const { data } = await api.post<ApiResponse<{ profile: ApiUserProfile; tips?: string[] }>>(
      '/me/resume/optimize',
      input || {},
      { timeout: 60_000 }
    );
    return data.data;
  },
  async latestResume() {
    const { data } = await api.get<ApiResponse<{ id: string; fileName?: string; content?: string } | null>>(
      '/me/resume'
    );
    return data.data;
  },
};

export const jobRepository = {
  async search(q = '', opts?: { minScore?: number }): Promise<ApiJob[]> {
    const { data } = await api.get<ApiResponse<ApiJob[]>>('/jobs', {
      params: { q, matched: true, minScore: opts?.minScore },
    });
    return data.data;
  },
  async board(q = '', opts?: { minScore?: number }): Promise<ApiJob[]> {
    const { data } = await api.get<ApiResponse<ApiJob[]>>('/jobs/board', {
      params: { q, minScore: opts?.minScore },
    });
    return data.data;
  },
  async today(): Promise<ApiJob[]> {
    const { data } = await api.get<ApiResponse<ApiJob[]>>('/jobs/today');
    return data.data;
  },
  async recommended(opts?: { minScore?: number; limit?: number }): Promise<ApiJob[]> {
    const { data } = await api.get<ApiResponse<ApiJob[]>>('/jobs/recommended', {
      params: { minScore: opts?.minScore ?? 50, limit: opts?.limit ?? 25 },
    });
    return data.data;
  },
  async saved(): Promise<ApiJob[]> {
    const { data } = await api.get<ApiResponse<ApiJob[]>>('/jobs/saved');
    return data.data;
  },
  async get(id: string): Promise<ApiJob> {
    const { data } = await api.get<ApiResponse<ApiJob>>(`/jobs/${id}`);
    return data.data;
  },
  async save(id: string) {
    await api.post(`/jobs/${id}/save`);
  },
  async unsave(id: string) {
    await api.delete(`/jobs/${id}/save`);
  },
  async refresh(query?: string, location?: string) {
    const { data } = await api.post('/jobs/refresh', { query, location }, { timeout: 120_000 });
    return data.data;
  },
};

export const postRepository = {
  async list(q = ''): Promise<HiringPost[]> {
    const { data } = await api.get<ApiResponse<HiringPost[]>>('/posts', { params: { q } });
    return data.data;
  },
  async get(id: string): Promise<HiringPost> {
    const { data } = await api.get<ApiResponse<HiringPost>>(`/posts/${id}`);
    return data.data;
  },
};

export const applicationRepository = {
  async list(): Promise<ApiApplication[]> {
    const { data } = await api.get<ApiResponse<ApiApplication[]>>('/applications');
    return data.data;
  },
  async stats(): Promise<AppStats> {
    const { data } = await api.get<ApiResponse<AppStats>>('/applications/stats');
    return data.data;
  },
  async smartApply(jobId: string, opts?: { acknowledgeDuplicate?: boolean }) {
    const { data } = await api.post(
      '/applications/smart-apply',
      {
        jobId,
        confirmed: true,
        confirmedAssistiveOnly: true,
        acknowledgeDuplicate: opts?.acknowledgeDuplicate || undefined,
      },
      { timeout: 90_000 }
    );
    return data.data as {
      application: ApiApplication;
      applyUrl: string;
      complianceNote: string;
      coverLetter?: string;
    };
  },
  async checkDuplicate(jobId: string) {
    const { data } = await api.get<
      ApiResponse<{ duplicate: boolean; kind: 'job' | 'company' | null; message: string | null }>
    >('/applications/check-duplicate', { params: { jobId } });
    return data.data;
  },
  async outreachApply(jobId: string, opts?: { acknowledgeDuplicate?: boolean }) {
    const { data } = await api.post(
      '/applications/outreach-apply',
      {
        jobId,
        confirmed: true,
        confirmedAssistiveOnly: true,
        acknowledgeDuplicate: opts?.acknowledgeDuplicate || undefined,
      },
      { timeout: 90_000 }
    );
    return data.data;
  },
  async autoApply(opts?: { minScore?: number; limit?: number; boardOnly?: boolean }) {
    const { data } = await api.post(
      '/applications/auto-apply',
      {
        confirmed: true,
        confirmedAssistiveOnly: true,
        minScore: opts?.minScore ?? 55,
        limit: opts?.limit ?? 8,
        boardOnly: opts?.boardOnly ?? true,
      },
      { timeout: 180_000 }
    );
    return data.data as {
      applied: Array<{ job: ApiJob; application: ApiApplication }>;
      skipped: Array<{ jobId: string; title: string; reason: string }>;
      applyUrls: string[];
      complianceNote: string;
    };
  },
  async updateStatus(id: string, status: string, note?: string) {
    const { data } = await api.patch<ApiResponse<ApiApplication>>(`/applications/${id}/status`, {
      status,
      note,
    });
    return data.data;
  },
  async syncStatuses(applicationId?: string) {
    const { data } = await api.post<
      ApiResponse<{ checked: number; updated: ApiApplication[]; unchanged: number; note?: string }>
    >('/applications/sync-statuses', { applicationId }, { timeout: 60_000 });
    return data.data;
  },
};

export const aiRepository = {
  async coverLetter(jobId: string): Promise<string> {
    const { data } = await api.post<ApiResponse<{ content: string }>>(
      '/ai/cover-letter',
      { jobId },
      { timeout: 90_000 }
    );
    return data.data.content;
  },
  async tailorResume(jobId: string) {
    const { data } = await api.post('/ai/tailor-resume', { jobId }, { timeout: 120_000 });
    return data.data;
  },
  async skillGap(jobId: string): Promise<SkillGapResult> {
    const { data } = await api.get<
      ApiResponse<{
        missing?: string[];
        matched?: string[];
        missingSkills?: string[];
        matchedSkills?: string[];
        matchScore?: number;
        score?: number;
        summary?: string;
        learningRoadmap?: LearningStep[];
      }>
    >(`/ai/skill-gap/${jobId}`, {
      timeout: 90_000,
    });
    const raw = data.data;
    return {
      missing: raw.missing || raw.missingSkills || [],
      matched: raw.matched || raw.matchedSkills || [],
      score: raw.score ?? raw.matchScore,
      summary: raw.summary,
      learningRoadmap: raw.learningRoadmap || [],
    };
  },
};

export const notificationRepository = {
  async list(unreadOnly = false) {
    const { data } = await api.get<ApiResponse<AppNotification[]> & { meta?: { unreadCount?: number } }>(
      '/notifications',
      { params: unreadOnly ? { unread: true } : undefined }
    );
    return { items: data.data, unreadCount: data.meta?.unreadCount ?? 0 };
  },
  async markRead(id: string) {
    const { data } = await api.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
    return data.data;
  },
  async markAllRead() {
    const { data } = await api.post<ApiResponse<{ count: number }>>('/notifications/read-all');
    return data.data;
  },
  async updatePrefs(prefs: NotificationPrefs) {
    const { data } = await api.patch<ApiResponse<NotificationPrefs>>('/notifications/prefs', prefs);
    return data.data;
  },
};

export const complianceRepository = {
  async settings() {
    const { data } = await api.get<
      ApiResponse<{
        smartApplyConsentAt: string | null;
        smartApplyPlatforms: SmartApplyPlatformPrefs;
        notificationPrefs: NotificationPrefs | null;
        policy: string;
      }>
    >('/compliance/settings');
    return data.data;
  },
  async confirmConsent() {
    const { data } = await api.post('/compliance/consent', { confirmedAssistiveOnly: true });
    return data.data;
  },
  async updatePlatforms(platforms: SmartApplyPlatformPrefs) {
    const { data } = await api.patch<ApiResponse<SmartApplyPlatformPrefs>>(
      '/compliance/platforms',
      platforms
    );
    return data.data;
  },
  async auditLog(limit = 40) {
    const { data } = await api.get('/compliance/audit', { params: { limit } });
    return data.data as Array<{ id: string; action: string; createdAt: string; note?: string }>;
  },
};

export const automationRepository = {
  async dailyStatus() {
    const { data } = await api.get('/automation/daily/status');
    return data.data as {
      enabled: boolean;
      running: boolean;
      lastFinishedAt?: string;
      lastError?: string | null;
    };
  },
  async runDailyNow() {
    const { data } = await api.post('/automation/daily/run-auth', {}, { timeout: 300_000 });
    return data.data;
  },
};

export const billingRepository = {
  async catalog(): Promise<BillingCatalog> {
    const { data } = await api.get<ApiResponse<BillingCatalog>>('/billing/plans');
    return data.data;
  },
  async subscription() {
    const { data } = await api.get<
      ApiResponse<{
        subscription: ApiSubscription;
        plans?: { starter?: boolean; pro?: boolean; elite?: boolean };
        active: boolean;
        plan: { id: PlanId; name: string; dailyAutoApplyQuota: number } | null;
        dailyAutoApplyQuota: number;
        razorpayConfigured: boolean;
        catalog: BillingCatalog;
      }>
    >('/billing/subscription');
    return data.data;
  },
  async createOrder(planId: PlanId) {
    const { data } = await api.post<
      ApiResponse<{
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        planId: PlanId;
        paymentLinkUrl?: string | null;
      }>
    >('/billing/razorpay/order', { planId });
    return data.data;
  },
  async verify(input: {
    planId: PlanId;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { data } = await api.post('/billing/razorpay/verify', input);
    return data.data as { subscription: ApiSubscription; dailyAutoApplyQuota: number };
  },
  async demoActivate(planId: PlanId) {
    const { data } = await api.post('/billing/demo-activate', { planId });
    return data.data as { subscription: ApiSubscription; dailyAutoApplyQuota: number };
  },
};

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function isBlobLike(value: unknown): value is Blob {
  return (
    typeof Blob !== 'undefined' &&
    value != null &&
    typeof value === 'object' &&
    typeof (value as Blob).arrayBuffer === 'function' &&
    typeof (value as Blob).size === 'number'
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(blob);
  });
}

async function readResumeAsBase64(
  file: { uri: string; name: string; mimeType?: string } | Blob
): Promise<{ fileName: string; mimeType: string; contentBase64: string }> {
  let fileName = 'resume.pdf';
  let mimeType = 'application/octet-stream';
  let contentBase64 = '';

  if (Platform.OS === 'web') {
    let blob: Blob;
    if (isBlobLike(file)) {
      blob = file;
      if ('name' in file && typeof (file as File).name === 'string') {
        fileName = (file as File).name || fileName;
      }
      mimeType = blob.type || mimeType;
    } else {
      const f = file as { uri: string; name: string; mimeType?: string };
      fileName = f.name || fileName;
      mimeType = f.mimeType || mimeType;
      const res = await fetch(f.uri);
      if (!res.ok) {
        throw new Error('Could not read resume file from this browser');
      }
      blob = await res.blob();
      if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = blob.type || mimeType;
      }
    }
    if (blob.size > MAX_RESUME_BYTES) {
      throw new Error('Resume must be under 10 MB');
    }
    contentBase64 = await blobToBase64(blob);
  } else {
    const f = file as { uri: string; name: string; mimeType?: string };
    fileName = f.name || fileName;
    mimeType = f.mimeType || mimeType;
    const FileSystem = await import('expo-file-system/legacy');
    let uri = f.uri;
    if (!uri.startsWith('file') && FileSystem.cacheDirectory) {
      const dest = `${FileSystem.cacheDirectory}resume-upload-${Date.now()}-${fileName.replace(/[^\w.\-]+/g, '_')}`;
      await FileSystem.copyAsync({ from: f.uri, to: dest });
      uri = dest;
    }
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && 'size' in info && typeof info.size === 'number' && info.size > MAX_RESUME_BYTES) {
      throw new Error('Resume must be under 10 MB');
    }
    contentBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  if (!contentBase64) {
    throw new Error('Could not read resume file from this device');
  }
  return { fileName, mimeType, contentBase64 };
}
