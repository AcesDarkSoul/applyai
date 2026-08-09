import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './config';

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  const message = error instanceof Error ? error.message : 'Authentication failed';

  const byCode: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email. Please register.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
    'auth/popup-blocked': 'Popup was blocked. Allow popups for this site and try again.',
    'auth/unauthorized-domain':
      'This domain is not authorized. Add localhost in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed':
      'This sign-in method is not enabled. Enable Email/Password and Google in Firebase Console → Authentication → Sign-in method.',
  };

  if (code && code in byCode) return byCode[code];
  return message.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/g, '').trim() || 'Authentication failed.';
}

function requireAuth() {
  if (!auth || !isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_* keys to frontend/.env and restart Vite.',
    );
  }
  return auth;
}

export async function firebaseSignUp(email: string, password: string, name: string): Promise<User> {
  const a = requireAuth();
  const cred = await createUserWithEmailAndPassword(a, email, password);
  try {
    await updateProfile(cred.user, { displayName: name });
  } catch {
    // non-blocking
  }
  return cred.user;
}

export async function firebaseSignIn(email: string, password: string): Promise<User> {
  const a = requireAuth();
  const cred = await signInWithEmailAndPassword(a, email, password);
  return cred.user;
}

export async function firebaseSignInWithGoogle(): Promise<User> {
  const a = requireAuth();
  const cred = await signInWithPopup(a, googleProvider);
  return cred.user;
}

export async function firebaseSignOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function firebaseResetPassword(email: string): Promise<void> {
  const a = requireAuth();
  try {
    await sendPasswordResetEmail(a, email);
  } catch (error) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(forceRefresh);
}
