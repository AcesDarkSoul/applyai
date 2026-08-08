import { api } from './client';
import type {
  ApiResponse,
  AppStats,
  Application,
  EducationEntry,
  ExperienceEntry,
  HiringPost,
  Job,
  ProjectEntry,
  ResumeBuilderInput,
  ResumeDocument,
  UserProfile,
} from '../types';

export const profileRepository = {
  async me(): Promise<UserProfile> {
    const { data } = await api.get<ApiResponse<UserProfile>>('/me');
    return data.data;
  },
  async update(patch: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.patch<ApiResponse<UserProfile>>('/me', patch);
    return data.data;
  },
  async uploadResume(file: File) {
    const form = new FormData();
    form.append('resume', file);
    // Do NOT set Content-Type manually — browser must add multipart boundary
    const { data } = await api.post<
      ApiResponse<{
        profile: UserProfile;
        resume: ResumeDocument;
        parsed: {
          name: string | null;
          email: string | null;
          phone: string | null;
          title: string;
          skills: string[];
          experience: number;
          education: string[];
          summary: string;
          linkedin: string | null;
          website?: string | null;
          location: string;
          experienceEntries?: ExperienceEntry[];
          educationEntries?: EducationEntry[];
          projects?: ProjectEntry[];
          certifications?: string[];
          languages?: string[];
          achievements?: string[];
          parseMethod: string;
          textChars: number;
          atsScore?: number;
          fileStored?: boolean;
        };
      }>
    >('/me/resume', form, {
      timeout: 90_000,
    });
    return data.data;
  },
  async buildResume(input: ResumeBuilderInput & { optimizeAts?: boolean }) {
    const { optimizeAts, ...payload } = input;
    const { data } = await api.post<
      ApiResponse<{
        profile: UserProfile;
        resume: ResumeDocument;
        tips?: string[];
        template?: string;
      }>
    >('/me/resume/build', { ...payload, optimizeAts }, { timeout: 60_000 });
    return data.data;
  },
  async optimizeResume(
    input?: Partial<ResumeBuilderInput> & {
      jobTitle?: string;
      jobDescription?: string;
    },
  ) {
    const { data } = await api.post<
      ApiResponse<{
        profile: UserProfile;
        resume: ResumeDocument;
        tips?: string[];
        template?: string;
      }>
    >('/me/resume/optimize', input || {}, { timeout: 60_000 });
    return data.data;
  },
  async latestResume(): Promise<ResumeDocument | null> {
    const { data } = await api.get<ApiResponse<ResumeDocument | null>>('/me/resume');
    return data.data;
  },
  async listResumes(): Promise<ResumeDocument[]> {
    const { data } = await api.get<ApiResponse<ResumeDocument[]>>('/me/resumes');
    return data.data;
  },
};

export const jobRepository = {
  async search(q = '', opts?: { minScore?: number }): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs', {
      params: { q, matched: true, minScore: opts?.minScore },
    });
    return data.data;
  },
  /** Formal board jobs (Indeed / Naukri / other) — excludes LinkedIn & Google Jobs posts. */
  async board(q = '', opts?: { minScore?: number }): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/board', {
      params: { q, minScore: opts?.minScore },
    });
    return data.data;
  },
  async today(): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/today');
    return data.data;
  },
  async recommended(opts?: { minScore?: number; limit?: number }): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/recommended', {
      params: { minScore: opts?.minScore ?? 50, limit: opts?.limit ?? 25 },
    });
    return data.data;
  },
  async saved(): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/saved');
    return data.data;
  },
  async get(id: string): Promise<Job> {
    const { data } = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return data.data;
  },
  async save(id: string): Promise<void> {
    await api.post(`/jobs/${id}/save`);
  },
  async refresh(query?: string, location?: string) {
    const { data } = await api.post<ApiResponse<{ query?: string; catalog?: unknown }>>(
      '/jobs/refresh',
      { query, location },
      { timeout: 120_000 },
    );
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
  async list(): Promise<Application[]> {
    const { data } = await api.get<ApiResponse<Application[]>>('/applications');
    return data.data;
  },
  async stats(): Promise<AppStats> {
    const { data } = await api.get<ApiResponse<AppStats>>('/applications/stats');
    return data.data;
  },
  async smartApply(jobId: string) {
    const { data } = await api.post<
      ApiResponse<{
        application: Application;
        applyUrl: string;
        complianceNote: string;
        coverLetter?: string;
        coverLetterId?: string;
      }>
    >('/applications/smart-apply', { jobId, confirmed: true }, { timeout: 90_000 });
    return data.data;
  },
  async outreachApply(jobId: string) {
    const { data } = await api.post<
      ApiResponse<{
        application: Application;
        applyUrl: string;
        coverLetter?: string;
        coverLetterId?: string;
        outreach: {
          channel: 'email' | 'whatsapp' | 'none';
          contacts: { email: string | null; phone: string | null };
          dryRun: boolean;
          sent: boolean;
          subject?: string;
          body?: string;
          to?: string;
          waLink?: string;
          note: string;
          fromAccount?: string;
          coverLetter?: string;
        };
        openedExternal?: boolean;
      }>
    >('/applications/outreach-apply', { jobId, confirmed: true }, { timeout: 90_000 });
    return data.data;
  },
  async autoApply(opts?: { minScore?: number; limit?: number; boardOnly?: boolean }) {
    const { data } = await api.post<
      ApiResponse<{
        queryHint: string;
        applied: Array<{
          job: {
            id: string;
            title: string;
            company: string;
            applyUrl: string;
            source: string;
            matchScore?: number;
          };
          application: Application;
          coverLetter?: { id: string; content: string };
          outreach: {
            channel: 'email' | 'whatsapp' | 'none';
            sent: boolean;
            note: string;
            waLink?: string;
            fromAccount?: string;
            coverLetter?: string;
          };
        }>;
        skipped: Array<{ jobId: string; title: string; reason: string }>;
        applyUrls: string[];
        complianceNote: string;
      }>
    >(
      '/applications/auto-apply',
      {
        confirmed: true,
        minScore: opts?.minScore ?? 55,
        limit: opts?.limit ?? 8,
        boardOnly: opts?.boardOnly ?? true,
      },
      { timeout: 180_000 },
    );
    return data.data;
  },
  async updateStatus(id: string, status: Application['status'], note?: string) {
    const { data } = await api.patch<ApiResponse<Application>>(`/applications/${id}/status`, {
      status,
      note,
    });
    return data.data;
  },
};

export const aiRepository = {
  async coverLetter(jobId: string): Promise<string> {
    const { data } = await api.post<
      ApiResponse<{ content: string; coverLetterId?: string; aiAssisted?: boolean }>
    >('/ai/cover-letter', { jobId }, { timeout: 90_000 });
    return data.data.content;
  },
};

export type DailyAutomationStatus = {
  enabled: boolean;
  cron: string;
  timezone: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastError?: string | null;
  lastFetch?: {
    query?: string;
    ingested?: number;
    sources?: string[];
    error?: string;
  };
  lastUsers?: Array<{
    uid: string;
    email: string;
    applied: number;
    skipped: number;
    sentEmail: number;
    sentWhatsapp: number;
    error?: string;
  }>;
  running: boolean;
};

export const automationRepository = {
  async dailyStatus(): Promise<DailyAutomationStatus> {
    const { data } = await api.get<ApiResponse<DailyAutomationStatus>>('/automation/daily/status');
    return data.data;
  },
  async runDailyNow(): Promise<DailyAutomationStatus> {
    const { data } = await api.post<ApiResponse<DailyAutomationStatus>>(
      '/automation/daily/run-auth',
      {},
      { timeout: 300_000 },
    );
    return data.data;
  },
};
