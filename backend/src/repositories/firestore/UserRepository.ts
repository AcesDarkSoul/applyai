import type { UserProfile } from '../../domain/user';
import { getFirestore } from '../../infrastructure/firebase/admin';
import { omitUndefinedDeep } from '../../infrastructure/firebase/sanitize';
import type { IUserRepository } from '../interfaces';

/** Firestore users docs are keyed by normalized email. */
function emailDocId(email: string | undefined | null): string | null {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  return normalized.includes('@') ? normalized : null;
}

export class FirestoreUserRepository implements IUserRepository {
  async getById(uid: string): Promise<UserProfile | null> {
    const db = getFirestore();
    if (!db) return null;

    // Preferred: look up by email field via collection query when callers pass uid only.
    // Direct email-key lookup happens when uid looks like an email (see getByEmail).
    if (uid.includes('@')) {
      return this.getByEmail(uid);
    }

    const byUidField = await db.collection('users').where('uid', '==', uid).limit(1).get();
    if (!byUidField.empty) {
      const d = byUidField.docs[0];
      return { uid, ...(d.data() as Omit<UserProfile, 'uid'>) };
    }

    // Legacy: document ID was Auth UID
    const legacy = await db.collection('users').doc(uid).get();
    if (!legacy.exists) return null;
    return { uid, ...(legacy.data() as Omit<UserProfile, 'uid'>) };
  }

  async getByEmail(email: string): Promise<UserProfile | null> {
    const db = getFirestore();
    if (!db) return null;
    const docId = emailDocId(email);
    if (!docId) return null;

    const snap = await db.collection('users').doc(docId).get();
    if (snap.exists) {
      const data = snap.data() as Omit<UserProfile, 'uid'> & { uid?: string };
      return { uid: data.uid || snap.id, ...data, email: docId };
    }

    // Legacy fallback: find by email field under UID-keyed docs
    const byEmail = await db.collection('users').where('email', '==', docId).limit(1).get();
    if (byEmail.empty) {
      const byEmailRaw = await db.collection('users').where('email', '==', email).limit(1).get();
      if (byEmailRaw.empty) return null;
      const d = byEmailRaw.docs[0];
      const data = d.data() as Omit<UserProfile, 'uid'>;
      return { uid: (data as { uid?: string }).uid || d.id, ...data };
    }
    const d = byEmail.docs[0];
    const data = d.data() as Omit<UserProfile, 'uid'>;
    return { uid: (data as { uid?: string }).uid || d.id, ...data };
  }

  async upsert(profile: UserProfile): Promise<UserProfile> {
    const db = getFirestore();
    if (!db) throw new Error('Firestore unavailable');

    const docId = emailDocId(profile.email);
    if (!docId) {
      throw new Error('User profile email is required to save to Firestore');
    }

    const { uid, ...rest } = profile;
    await db.collection('users').doc(docId).set(
      omitUndefinedDeep({
        ...rest,
        uid,
        email: docId,
      } as Record<string, unknown>),
      { merge: true },
    );
    return { ...profile, email: docId };
  }

  async listAll(): Promise<UserProfile[]> {
    const db = getFirestore();
    if (!db) return [];
    const snap = await db.collection('users').limit(200).get();
    return snap.docs.map((d) => {
      const data = d.data() as Omit<UserProfile, 'uid'>;
      return {
        uid: (data as { uid?: string }).uid || d.id,
        ...data,
        email: emailDocId(data.email) || data.email || d.id,
      };
    });
  }
}
