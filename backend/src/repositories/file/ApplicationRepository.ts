import type { Application, ApplicationStatus } from '../../domain/application';
import { AppError } from '../../middleware/errorHandler';
import type { IApplicationRepository } from '../interfaces';
import { fileStore } from './fileStore';

export class FileApplicationRepository implements IApplicationRepository {
  async listByUser(userId: string): Promise<Application[]> {
    const rows = await fileStore.queryByField<Application>('applications', 'userId', userId);
    return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  async getById(userId: string, id: string): Promise<Application | null> {
    const app = await fileStore.get<Application>('applications', id);
    if (!app || app.userId !== userId) return null;
    return app;
  }

  async create(app: Application): Promise<Application> {
    return fileStore.set('applications', app.id, app);
  }

  async updateStatus(
    userId: string,
    id: string,
    status: ApplicationStatus,
    note?: string,
  ): Promise<Application> {
    const existing = await this.getById(userId, id);
    if (!existing) throw new AppError(404, 'Application not found', 'NOT_FOUND');

    const now = new Date().toISOString();
    const updated: Application = {
      ...existing,
      status,
      updatedAt: now,
      timeline: [...existing.timeline, { status, at: now, note }],
      notes: note ? `${existing.notes}\n${note}`.trim() : existing.notes,
    };
    return fileStore.set('applications', id, updated);
  }
}
