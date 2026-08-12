import { api } from './client';
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

export type SkillGapResult = {
  missing: string[];
  matched: string[];
  score?: number;
  summary?: string;
};

export type SmartApplyPlatformPrefs = {
  linkedin?: boolean;
  indeed?: boolean;
  naukri?: boolean;
  other?: boolean;
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
  async uploadResume(file: { uri: string; name: string; mimeType?: string } | File) {
    const form = new FormData();
    if (Platform.OS === 'web' && file instanceof File) {
      form.append('resume', file);
    } else {
      const f = file as { uri: string; name: string; mimeType?: string };
      form.append('resume', {
        uri: f.uri,
        name: f.name,
        type: f.mimeType || 'application/pdf',
      } as unknown as Blob);
    }
    const { data } = await api.post<ApiResponse<{ profile: ApiUserProfile; parsed: Record<string, unknown> }>>(
      '/me/resume',
      form,
      { timeout: 90_000 }
    );
    return data.data;
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
    const { data } = await api.get<ApiResponse<SkillGapResult>>(`/ai/skill-gap/${jobId}`, {
      timeout: 90_000,
    });
    return data.data;
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
