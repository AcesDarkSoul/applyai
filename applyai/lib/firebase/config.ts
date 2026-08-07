import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function assertFirebaseConfig() {
  const required: Array<keyof typeof firebaseConfig> = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ];
  const missing = required.filter((key) => !firebaseConfig[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase config: ${missing.join(', ')}. Copy values into applyai/.env and restart Expo.`
    );
  }
}

function createFirebaseApp(): FirebaseApp {
  assertFirebaseConfig();
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

function createAuth(app: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    // RN build of firebase/auth exports persistence helpers (not available in Node/web builds)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (fast refresh) or persistence unavailable
    return getAuth(app);
  }
}

const app = createFirebaseApp();

export const auth = createAuth(app);
export const db = getFirestore(app);
// Resume files are stored locally on device — no Firebase Storage needed

// Analytics only works on web
export async function initAnalytics() {
  if (Platform.OS === 'web') {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
}

export default app;
