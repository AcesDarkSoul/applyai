import type { CoverLetterDocument, ResumeDocument } from '../../domain/resume';
import { getFirestore } from '../../infrastructure/firebase/admin';
import { omitUndefinedDeep } from '../../infrastructure/firebase/sanitize';
import type { ICoverLetterRepository, IResumeRepository } from '../interfaces';

export class FirestoreResumeRepository implements IResumeRepository {
  async getLatest(userId: string): Promise<ResumeDocument | null> {
    const list = await this.list(userId);
    return list[0] ?? null;
  }

  async getById(userId: string, resumeId: string): Promise<ResumeDocument | null> {
    const db = getFirestore();
    if (!db) return null;
    const snap = await db.collection('resumes').doc(resumeId).get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<ResumeDocument, 'id'>;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }

  async list(userId: string): Promise<ResumeDocument[]> {
    const db = getFirestore();
    if (!db) return [];
    const snap = await db.collection('resumes').where('userId', '==', userId).get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResumeDocument, 'id'>) }));
    return rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  async upsert(doc: ResumeDocument): Promise<ResumeDocument> {
    const db = getFirestore();
    if (!db) throw new Error('Firestore unavailable');
    const { id, ...rest } = doc;
    await db.collection('resumes').doc(id).set(omitUndefinedDeep(rest as Record<string, unknown>), {
      merge: true,
    });
    return doc;
  }
}

export class FirestoreCoverLetterRepository implements ICoverLetterRepository {
  async create(doc: CoverLetterDocument): Promise<CoverLetterDocument> {
    const db = getFirestore();
    if (!db) throw new Error('Firestore unavailable');
    const { id, ...rest } = doc;
    await db.collection('coverLetters').doc(id).set(omitUndefinedDeep(rest as Record<string, unknown>));
    return doc;
  }

  async listByUser(userId: string): Promise<CoverLetterDocument[]> {
    const db = getFirestore();
    if (!db) return [];
    const snap = await db.collection('coverLetters').where('userId', '==', userId).get();
    const rows = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Omit<CoverLetterDocument, 'id'>) }),
    );
    return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
}
