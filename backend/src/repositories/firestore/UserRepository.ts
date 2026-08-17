import type { UserProfile } from '../../domain/user';
import { getFirestore } from '../../infrastructure/firebase/admin';
import { omitUndefinedDeep } from '../../infrastructure/firebase/sanitize';
import type { IUserRepository } from '../interfaces';

export class FirestoreUserRepository implements IUserRepository {
  async getById(uid: string): Promise<UserProfile | null> {
    const db = getFirestore();
    if (!db) return null;
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    const db = getFirestore();
    if (!db) throw new Error('Firestore unavailable');
    const { uid, ...rest } = profile;
    await db.collection('users').doc(uid).set(omitUndefinedDeep(rest as Record<string, unknown>), {
      merge: true,
    });
    return profile;
  }

  async listAll(): Promise<UserProfile[]> {
    const db = getFirestore();
    if (!db) return [];
    const snap = await db.collection('users').limit(200).get();
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
  }
}
