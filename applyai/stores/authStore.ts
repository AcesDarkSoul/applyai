import { create } from 'zustand';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/auth';
import { setAnalyticsUserId } from '@/lib/firebase/analytics';
import { recordError, setCrashlyticsUser } from '@/lib/firebase/crashlytics';
import { setApiToken } from '@/lib/api/client';
import type { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  refreshProfile: () => Promise<void>;
  initialize: () => () => void;
}

async function hydrateSignedInUser(user: User) {
  try {
    const idToken = await user.getIdToken();
    await setApiToken(idToken);
  } catch (e) {
    console.warn('getIdToken failed:', e);
  }

  try {
    const profile = await getUserProfile(user.uid, { email: user.email, uid: user.uid });
    useAuthStore.setState({ profile });
    void setCrashlyticsUser({
      uid: user.uid,
      email: user.email,
      name: profile?.name ?? user.displayName,
    });
  } catch (e) {
    console.warn('getUserProfile failed:', e);
    useAuthStore.setState({ profile: null });
  }

  void setAnalyticsUserId(user.uid);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null });
      return;
    }
    try {
      const profile = await getUserProfile(user.uid, { email: user.email, uid: user.uid });
      set({ profile });
    } catch (e) {
      console.warn('refreshProfile failed:', e);
      set({ profile: null });
    }
  },

  initialize: () => {
    let settled = false;

    const markReady = (partial: Partial<AuthState>) => {
      settled = true;
      set({ loading: false, initialized: true, ...partial });
    };

    // Never leave splash/auth gate hanging if Firebase is slow/offline
    const safety = setTimeout(() => {
      if (!get().initialized) {
        console.warn('Auth init timed out — continuing without blocking UI');
        markReady({});
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void (async () => {
        try {
          if (user?.isAnonymous) {
            await signOut(auth).catch(() => undefined);
            await setApiToken(null);
            markReady({ user: null, profile: null });
            void setAnalyticsUserId(null);
            void setCrashlyticsUser(null);
            return;
          }

          if (user) {
            // Attach API token before unlocking the dashboard (avoids 401 on first load)
            try {
              const idToken = await user.getIdToken();
              await setApiToken(idToken);
            } catch (e) {
              console.warn('getIdToken failed:', e);
            }
            markReady({ user });
            void hydrateSignedInUser(user);
            return;
          }

          await setApiToken(null);
          markReady({ user: null, profile: null });
          void setAnalyticsUserId(null);
          void setCrashlyticsUser(null);
        } catch (e) {
          console.warn('Auth init failed:', e);
          recordError(e, 'auth_initialize');
          markReady({
            user: user && !user.isAnonymous ? user : null,
            profile: null,
          });
        }
      })();
    });

    return () => {
      clearTimeout(safety);
      unsubscribe();
      void settled;
    };
  },
}));
