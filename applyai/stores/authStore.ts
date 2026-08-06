import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/auth';
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
        if (user) {
          const profile = await getUserProfile(user.uid);
          set({ user, profile, loading: false, initialized: true });
        } else {
          set({ user: null, profile: null, loading: false, initialized: true });
        }
      } catch (e) {
        // Never leave the app stuck on the loading spinner
        console.warn('Auth init failed:', e);
        set({ user, profile: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },
}));
