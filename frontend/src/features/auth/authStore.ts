import { create } from 'zustand';
import { profileRepository } from '../../shared/api/repositories';
import type { UserProfile } from '../../shared/types';

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loginDemo: (asAdmin?: boolean) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('applyai_token'),
  profile: null,
  loading: false,
  error: null,

  async loginDemo(asAdmin = false) {
    set({ loading: true, error: null });
    try {
      const token = asAdmin ? 'demo-admin-owner' : 'demo-user-sagar';
      localStorage.setItem('applyai_token', token);
      set({ token });
      const profile = await profileRepository.me();
      set({ profile, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed',
        token: null,
      });
      localStorage.removeItem('applyai_token');
    }
  },

  logout() {
    localStorage.removeItem('applyai_token');
    set({ token: null, profile: null, error: null });
  },

  async hydrate() {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const profile = await profileRepository.me();
      set({ profile, loading: false });
    } catch {
      localStorage.removeItem('applyai_token');
      set({ token: null, profile: null, loading: false });
    }
  },

  async refreshProfile() {
    const profile = await profileRepository.me();
    set({ profile });
  },
}));
