import { api } from './client';
import type { ApiResponse, AppStats, Application, HiringPost, Job, UserProfile } from '../types';

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
    const { data } = await api.post<
      ApiResponse<{
        profile: UserProfile;
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
          location: string;
          parseMethod: string;
          textChars: number;
          atsScore?: number;
        };
      }>
    >('/me/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90_000,
    });
    return data.data;
  },
};

export const jobRepository = {
  async search(q = ''): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs', { params: { q } });
    return data.data;
  },
  /** Formal board jobs (Indeed / Naukri / other) — excludes LinkedIn & Google Jobs posts. */
  async board(q = ''): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/board', { params: { q } });
    return data.data;
  },
  async today(): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs/today');
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
      ApiResponse<{ application: Application; applyUrl: string; complianceNote: string }>
    >('/applications/smart-apply', { jobId, confirmed: true });
    return data.data;
  },
  async outreachApply(jobId: string) {
    const { data } = await api.post<
      ApiResponse<{
        application: Application;
        applyUrl: string;
        outreach: {
          channel: 'email' | 'whatsapp' | 'smart_apply';
          contacts: { email: string | null; phone: string | null };
          dryRun: boolean;
          sent: boolean;
          subject?: string;
          body?: string;
          to?: string;
          waLink?: string;
          note: string;
        };
      }>
    >('/applications/outreach-apply', { jobId, confirmed: true }, { timeout: 60_000 });
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
    const { data } = await api.post<ApiResponse<{ content: string }>>('/ai/cover-letter', {
      jobId,
    });
    return data.data.content;
  },
};
