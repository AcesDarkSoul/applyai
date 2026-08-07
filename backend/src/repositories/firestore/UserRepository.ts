import type { UserProfile } from '../../domain/user';
import { getFirestore } from '../../infrastructure/firebase/admin';
import type { IUserRepository } from '../interfaces';

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

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
    await db.collection('users').doc(uid).set(stripUndefined(rest as Record<string, unknown>), {
      merge: true,
    });
    return profile;
  }
}
