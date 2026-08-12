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
      const profile = await getUserProfile(user.uid);
      set({ profile });
    } catch (e) {
      console.warn('refreshProfile failed:', e);
      set({ profile: null });
    }
  },

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // Only email/password or Google sessions are allowed — reject anonymous
        if (user && user.isAnonymous) {
          await signOut(auth).catch(() => undefined);
          await setApiToken(null);
          set({ user: null, profile: null, loading: false, initialized: true });
          void setAnalyticsUserId(null);
          void setCrashlyticsUser(null);
          return;
        }

        if (user) {
          const idToken = await user.getIdToken();
          await setApiToken(idToken);
          const profile = await getUserProfile(user.uid);
          set({ user, profile, loading: false, initialized: true });
          void setAnalyticsUserId(user.uid);
          void setCrashlyticsUser({
            uid: user.uid,
            email: user.email,
            name: profile?.name ?? user.displayName,
          });
        } else {
          await setApiToken(null);
          set({ user: null, profile: null, loading: false, initialized: true });
          void setAnalyticsUserId(null);
          void setCrashlyticsUser(null);
        }
      } catch (e) {
        // Never leave the app stuck on the loading spinner
        console.warn('Auth init failed:', e);
        recordError(e, 'auth_initialize');
        set({ user: user?.isAnonymous ? null : user, profile: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },
}));
