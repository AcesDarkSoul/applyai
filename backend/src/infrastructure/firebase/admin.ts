import admin from 'firebase-admin';
import { env, isDemoMode } from '../../config/env';
import { logger } from '../../config/logger';

let initialized = false;

export function getFirebaseAdmin(): typeof admin | null {
  if (initialized) {
    return admin.apps.length ? admin : null;
  }

  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    if (!isDemoMode) {
      logger.warn('Firebase credentials incomplete; falling back to file store');
    }
    initialized = true;
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    initialized = true;
    logger.info('Firebase Admin initialized');
    return admin;
  } catch (err) {
    logger.warn('Firebase Admin init failed; using file store', {
      err: err instanceof Error ? err.message : err,
    });
    initialized = true;
    return null;
  }
}

export function getFirestore() {
  const app = getFirebaseAdmin();
  return app ? app.firestore() : null;
}
