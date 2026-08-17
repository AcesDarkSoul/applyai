import admin from 'firebase-admin';
import { env, isDemoMode } from '../../config/env';
import { logger } from '../../config/logger';

let initialized = false;

function runningOnGcp(): boolean {
  return Boolean(
    process.env.K_SERVICE ||
      process.env.FUNCTION_TARGET ||
      process.env.FUNCTION_NAME ||
      process.env.GCLOUD_PROJECT,
  );
}

export function getFirebaseAdmin(): typeof admin | null {
  if (initialized) {
    return admin.apps.length ? admin : null;
  }

  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const hasServiceAccount =
    Boolean(env.FIREBASE_PROJECT_ID) &&
    Boolean(env.FIREBASE_CLIENT_EMAIL) &&
    Boolean(privateKey);

  try {
    if (hasServiceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      initialized = true;
      logger.info('Firebase Admin initialized (service account)');
      return admin;
    }

    // Cloud Functions / Cloud Run: use Application Default Credentials
    if (runningOnGcp()) {
      admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
      });
      initialized = true;
      logger.info('Firebase Admin initialized (ADC / Cloud)');
      return admin;
    }

    if (!isDemoMode) {
      logger.warn('Firebase credentials incomplete; falling back to file store');
    }
    initialized = true;
    return null;
  } catch (err) {
    logger.warn('Firebase Admin init failed; using file store', {
      err: err instanceof Error ? err.message : err,
    });
    initialized = true;
    return null;
  }
}

let firestoreSettingsApplied = false;

export function getFirestore() {
  const app = getFirebaseAdmin();
  if (!app) return null;
  const db = app.firestore();
  if (!firestoreSettingsApplied) {
    db.settings({ ignoreUndefinedProperties: true });
    firestoreSettingsApplied = true;
  }
  return db;
}
