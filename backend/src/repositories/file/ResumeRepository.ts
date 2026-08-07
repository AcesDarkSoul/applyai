import type { CoverLetterDocument, ResumeDocument } from '../../domain/resume';
import type { ICoverLetterRepository, IResumeRepository } from '../interfaces';
import { fileStore } from './fileStore';

export class FileResumeRepository implements IResumeRepository {
  async getLatest(userId: string): Promise<ResumeDocument | null> {
    const list = await this.list(userId);
    return list[0] ?? null;
  }

  async getById(userId: string, resumeId: string): Promise<ResumeDocument | null> {
    const doc = await fileStore.get<ResumeDocument>('resumes', resumeId);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  }

  async list(userId: string): Promise<ResumeDocument[]> {
    const rows = await fileStore.queryByField<ResumeDocument>('resumes', 'userId', userId);
    return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  async upsert(doc: ResumeDocument): Promise<ResumeDocument> {
    return fileStore.set('resumes', doc.id, doc);
  }
}

export class FileCoverLetterRepository implements ICoverLetterRepository {
  async create(doc: CoverLetterDocument): Promise<CoverLetterDocument> {
    return fileStore.set('coverLetters', doc.id, doc);
  }

  async listByUser(userId: string): Promise<CoverLetterDocument[]> {
    const rows = await fileStore.queryByField<CoverLetterDocument>(
      'coverLetters',
      'userId',
      userId,
    );
    return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
}
