import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from './config';
import { trackLogin, trackSignUp } from './analytics';
import { recordError } from './crashlytics';
import { recordNewUser, recordUserLogin } from './stats';
import { tryUserDocIdFromEmail, userDocIdFromEmail } from './userDocId';
import { setApiToken } from '@/lib/api/client';
import type { UserProfile } from '@/types';

async function persistApiToken(user: User) {
  try {
    const token = await user.getIdToken();
    await setApiToken(token);
  } catch (e) {
    console.warn('persistApiToken failed:', e);
  }
}

function baseProfileFields(input: {
  uid: string;
  email: string;
  name: string;
}): DocumentData {
  return {
    uid: input.uid,
    email: input.email,
    name: input.name,
    skills: [],
    experience: 0,
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    preferredLocation: 'Remote',
    plans: { starter: false, pro: false, elite: false },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Map Firebase Auth errors to clear user-facing messages */
export function formatAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  const message = error instanceof Error ? error.message : 'Authentication failed';

  const byCode: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists. Please sign in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed':
      'Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Popup was blocked. Allow popups for this site and try again.',
    'auth/unauthorized-domain':
      'This domain is not authorized. Add localhost in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
    'permission-denied':
      'Firestore permission denied. Deploy Firestore rules in Firebase Console.',
  };

  if (code && byCode[code]) return byCode[code];

  return message
    .replace('Firebase: ', '')
    .replace(/\(auth\/[^)]+\)\.?/g, '')
    .trim() || 'Authentication failed. Please try again.';
}

export async function signUp(email: string, password: string, name: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(credential.user, { displayName: name });
  } catch (e) {
    console.warn('updateProfile failed:', e);
    recordError(e, 'signup_update_profile');
  }

  try {
    const emailKey = userDocIdFromEmail(credential.user.email || email);
    await setDoc(
      doc(db, 'users', emailKey),
      baseProfileFields({
        uid: credential.user.uid,
        email: emailKey,
        name,
      }),
    );
    void recordNewUser();
  } catch (e) {
    // Auth succeeded — profile can be created later. Don't block signup.
    console.warn('Profile create failed (check Firestore rules):', e);
    recordError(e, 'signup_profile_create');
  }

  void trackSignUp('password');
  void recordUserLogin();
  await persistApiToken(credential.user);
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  void trackLogin('password');
  void recordUserLogin();
  await persistApiToken(credential.user);
  return credential.user;
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const isNewUser = await ensureUserProfile(result.user);
  if (isNewUser) void recordNewUser();
  void trackLogin('google');
  void recordUserLogin();
  await persistApiToken(result.user);
  return result.user;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (Platform.OS === 'web') {
    const credential = await signInWithPopup(auth, provider);
    const isNewUser = await ensureUserProfile(credential.user);
    if (isNewUser) void recordNewUser();
    void trackLogin('google');
    void recordUserLogin();
    await persistApiToken(credential.user);
    return credential.user;
  }

  throw new Error('Use signInWithGoogleIdToken on mobile via useGoogleAuth hook.');
}

/**
 * Ensure users/{email} exists. Migrates legacy users/{uid} docs when found.
 * Returns true when a new email-keyed profile was created.
 */
async function ensureUserProfile(user: User): Promise<boolean> {
  try {
    const emailKey = tryUserDocIdFromEmail(user.email);
    if (!emailKey) {
      console.warn('ensureUserProfile: missing email on auth user');
      return false;
    }

    const emailRef = doc(db, 'users', emailKey);
    const emailSnap = await getDoc(emailRef);
    if (emailSnap.exists()) {
      // Keep uid in sync if missing
      const data = emailSnap.data();
      if (data?.uid !== user.uid) {
        await setDoc(
          emailRef,
          { uid: user.uid, email: emailKey, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      return false;
    }

    // Migrate legacy UID-keyed document into email-keyed document
    const legacyRef = doc(db, 'users', user.uid);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const legacy = legacySnap.data() || {};
      await setDoc(
        emailRef,
        {
          ...legacy,
          uid: user.uid,
          email: emailKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return true;
    }

    await setDoc(
      emailRef,
      baseProfileFields({
        uid: user.uid,
        email: emailKey,
        name: user.displayName || 'User',
      }),
    );
    return true;
  } catch (e) {
    console.warn('ensureUserProfile failed (check Firestore rules):', e);
  }
  return false;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logOut(): Promise<void> {
  await setApiToken(null);
  await signOut(auth);
}

export async function getUserProfile(
  userId: string,
  opts?: { email?: string | null; uid?: string },
): Promise<UserProfile | null> {
  try {
    const emailKey = tryUserDocIdFromEmail(opts?.email) || tryUserDocIdFromEmail(userId);
    const uid = opts?.uid || (!userId.includes('@') ? userId : undefined);

    if (emailKey) {
      const byEmail = await getDoc(doc(db, 'users', emailKey));
      if (byEmail.exists()) {
        const data = byEmail.data();
        return {
          id: byEmail.id,
          ...data,
          email: emailKey,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as UserProfile;
      }

      // Migrate legacy UID doc on read when possible
      if (uid) {
        const legacy = await getDoc(doc(db, 'users', uid));
        if (legacy.exists()) {
          const data = legacy.data() || {};
          await setDoc(
            doc(db, 'users', emailKey),
            {
              ...data,
              uid,
              email: emailKey,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
          return {
            id: emailKey,
            ...data,
            email: emailKey,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          } as UserProfile;
        }
      }
    }

    // Last resort: treat userId as document id (legacy UID)
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as UserProfile;
  } catch (e) {
    console.warn('getUserProfile failed:', e);
    return null;
  }
}
