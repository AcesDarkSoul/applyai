import admin from 'firebase-admin';
import { env, isDemoMode } from '../../config/env';
import { logger } from '../../config/logger';

let initialized = false;

export function getFirebaseAdmin(): typeof admin | null {
  if (isDemoMode) {
    return null;
  }

  if (!initialized) {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      logger.warn('Firebase credentials incomplete; falling back to demo mode behavior');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    initialized = true;
    logger.info('Firebase Admin initialized');
  }

  return admin;
}

export function getFirestore() {
  const app = getFirebaseAdmin();
  return app ? app.firestore() : null;
}
