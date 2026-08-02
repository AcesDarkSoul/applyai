import { randomUUID } from 'crypto';
import type { Application, ApplicationStatus } from '../domain/application';
import type { Job } from '../domain/job';
import { AppError } from '../middleware/errorHandler';
import { applicationRepository } from '../repositories';

export class ApplicationService {
  list(userId: string): Promise<Application[]> {
    return applicationRepository.listByUser(userId);
  }

  async smartApply(userId: string, job: Job): Promise<Application> {
    const existing = (await applicationRepository.listByUser(userId)).find(
      (a) => a.jobId === job.id && a.status !== 'withdrawn',
    );
    if (existing) {
      return applicationRepository.updateStatus(userId, existing.id, 'applied', 'Smart Apply confirmed');
    }

    const now = new Date().toISOString();
    const app: Application = {
      id: randomUUID(),
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      source: job.source,
      applyUrl: job.applyUrl,
      status: 'applied',
      timeline: [{ status: 'applied', at: now, note: 'Smart Apply confirmed — opened official posting' }],
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    return applicationRepository.create(app);
  }

  async updateStatus(
    userId: string,
    id: string,
    status: ApplicationStatus,
    note?: string,
  ): Promise<Application> {
    return applicationRepository.updateStatus(userId, id, status, note);
  }

  async getStats(userId: string) {
    const apps = await this.list(userId);
    return {
      total: apps.length,
      applied: apps.filter((a) => a.status === 'applied' || a.status === 'viewed').length,
      interview: apps.filter((a) => a.status === 'interview').length,
      offer: apps.filter((a) => a.status === 'offer').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      saved: apps.filter((a) => a.status === 'saved').length,
    };
  }

  async requireOwned(userId: string, id: string): Promise<Application> {
    const app = await applicationRepository.getById(userId, id);
    if (!app) throw new AppError(404, 'Application not found', 'NOT_FOUND');
    return app;
  }
}

export const applicationService = new ApplicationService();
