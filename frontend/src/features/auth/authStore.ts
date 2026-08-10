import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { profileRepository } from '../../shared/api/repositories';
import type { UserProfile } from '../../shared/types';
import { auth, initAnalytics, isFirebaseConfigured } from '../../shared/firebase/config';
import { setAnalyticsUserId } from '../../shared/firebase/analytics';
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  formatFirebaseAuthError,
} from '../../shared/firebase/auth';

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = 'applyai_token';

function friendlyNetworkError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Request failed';
  if (/network|failed to fetch|timeout|ECONNREFUSED|Network Error/i.test(message)) {
    return 'Cannot reach the API. Make sure the backend is running on port 4000.';
  }
  return message;
}

/**
 * Prefer a real Firebase ID token for the API.
 * If Admin SDK is not configured (local DEMO_MODE), fall back to demo-<uid>.
 */
async function establishApiSession(
  user: User,
  displayName?: string,
): Promise<{ token: string; profile: UserProfile }> {
  const idToken = await user.getIdToken();
  const previous = localStorage.getItem(TOKEN_KEY);

  const tryWith = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    let profile = await profileRepository.me();
    const name = displayName?.trim() || user.displayName || undefined;
    if (name && profile.displayName !== name) {
      try {
        profile = await profileRepository.update({ displayName: name });
      } catch {
        // best-effort
      }
    }
    return { token, profile };
  };

  try {
    return await tryWith(idToken);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const needsDemoFallback =
      import.meta.env.VITE_DEMO_MODE === 'true' ||
      /AUTH_UNAVAILABLE|Unauthorized|Invalid or expired|503|401/i.test(msg);

    if (!needsDemoFallback) {
      if (previous) localStorage.setItem(TOKEN_KEY, previous);
      else localStorage.removeItem(TOKEN_KEY);
      throw err;
    }

    try {
      // Backend DEMO_MODE accepts Bearer demo-<uid>
      const demoToken = `demo-${user.uid.slice(0, 36)}`;
      return await tryWith(demoToken);
    } catch (demoErr) {
      if (previous) localStorage.setItem(TOKEN_KEY, previous);
      else localStorage.removeItem(TOKEN_KEY);
      throw demoErr;
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  profile: null,
  firebaseUser: null,
  loading: false,
  error: null,

  clearError() {
    set({ error: null });
  },

  async login(email, password) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      set({ error: 'Enter a valid email address' });
      return false;
    }
    if (!password || password.length < 6) {
      set({ error: 'Password must be at least 6 characters' });
      return false;
    }

    if (!isFirebaseConfigured()) {
      set({
        error:
          'Firebase is not configured. Add VITE_FIREBASE_* to frontend/.env and restart the Vite server.',
      });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const user = await firebaseSignIn(trimmedEmail, password);
      const { token, profile } = await establishApiSession(user);
      set({ token, profile, firebaseUser: user, loading: false, error: null });
      return true;
    } catch (err) {
      const message = formatFirebaseAuthError(err) || friendlyNetworkError(err);
      set({ loading: false, error: message || null, token: null, profile: null, firebaseUser: null });
      return false;
    }
  },

  async register(name, email, password) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      set({ error: 'Enter your full name' });
      return false;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      set({ error: 'Enter a valid email address' });
      return false;
    }
    if (!password || password.length < 6) {
      set({ error: 'Password must be at least 6 characters' });
      return false;
    }

    if (!isFirebaseConfigured()) {
      set({
        error:
          'Firebase is not configured. Add VITE_FIREBASE_* to frontend/.env and restart the Vite server.',
      });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const user = await firebaseSignUp(trimmedEmail, password, trimmedName);
      const { token, profile } = await establishApiSession(user, trimmedName);
      set({ token, profile, firebaseUser: user, loading: false, error: null });
      return true;
    } catch (err) {
      const message = formatFirebaseAuthError(err) || friendlyNetworkError(err);
      set({ loading: false, error: message || null, token: null, profile: null, firebaseUser: null });
      return false;
    }
  },

  async loginWithGoogle() {
    if (!isFirebaseConfigured()) {
      set({
        error:
          'Firebase is not configured. Add VITE_FIREBASE_* to frontend/.env and restart the Vite server.',
      });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const user = await firebaseSignInWithGoogle();
      const { token, profile } = await establishApiSession(
        user,
        user.displayName || undefined,
      );
      set({ token, profile, firebaseUser: user, loading: false, error: null });
      return true;
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      set({
        loading: false,
        error: message || null,
        // keep existing session on cancel
      });
      return false;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    void firebaseSignOut();
    set({ token: null, profile: null, firebaseUser: null, error: null, loading: false });
  },

  async hydrate() {
    const token = get().token;
    if (!token) return;
    if (get().profile && !get().loading) return;

    set({ loading: true });
    try {
      // If Firebase is available, refresh ID token when possible
      if (auth?.currentUser) {
        try {
          const { token: nextToken, profile } = await establishApiSession(auth.currentUser);
          set({ token: nextToken, profile, firebaseUser: auth.currentUser, loading: false });
          return;
        } catch {
          // fall through to existing token
        }
      }

      const profile = await profileRepository.me();
      set({ profile, loading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, profile: null, firebaseUser: null, loading: false });
    }
  },

  async refreshProfile() {
    const profile = await profileRepository.me();
    set({ profile });
  },
}));

/** Keep Zustand in sync with Firebase Auth persistence (browser refresh). */
let authListenerStarted = false;
export function startFirebaseAuthListener() {
  if (authListenerStarted || !auth) return () => undefined;
  authListenerStarted = true;
  void initAnalytics();

  return onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ firebaseUser: user });
    void setAnalyticsUserId(user?.uid ?? null);
  });
}
