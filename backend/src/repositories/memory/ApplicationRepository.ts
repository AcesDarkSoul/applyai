import type { Application, ApplicationStatus } from '../../domain/application';
import { AppError } from '../../middleware/errorHandler';
import type { IApplicationRepository } from '../interfaces';
import { memoryStore } from './store';

export class MemoryApplicationRepository implements IApplicationRepository {
  async listByUser(userId: string): Promise<Application[]> {
    return [...memoryStore.applications.values()]
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(userId: string, id: string): Promise<Application | null> {
    const app = memoryStore.applications.get(id);
    if (!app || app.userId !== userId) return null;
    return app;
  }

  async create(app: Application): Promise<Application> {
    memoryStore.applications.set(app.id, app);
    return app;
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
    memoryStore.applications.set(id, updated);
    return updated;
  }
}
