import { api } from './client';
import type { ApiResponse, AppStats, Application, Job, UserProfile } from '../types';

export const profileRepository = {
  async me(): Promise<UserProfile> {
    const { data } = await api.get<ApiResponse<UserProfile>>('/me');
    return data.data;
  },
  async update(patch: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.patch<ApiResponse<UserProfile>>('/me', patch);
    return data.data;
  },
};

export const jobRepository = {
  async search(q = ''): Promise<Job[]> {
    const { data } = await api.get<ApiResponse<Job[]>>('/jobs', { params: { q } });
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
