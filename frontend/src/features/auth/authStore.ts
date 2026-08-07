import { create } from 'zustand';
import { profileRepository } from '../../shared/api/repositories';
import type { UserProfile } from '../../shared/types';

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function demoUidFromEmail(email: string): string {
  const local = email.trim().toLowerCase().split('@')[0] || 'user';
  return local.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'user';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('applyai_token'),
  profile: null,
  loading: false,
  error: null,

  async login(email, password) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      set({ error: 'Enter a valid email address' });
      return;
    }
    if (!password || password.length < 6) {
      set({ error: 'Password must be at least 6 characters' });
      return;
    }

    set({ loading: true, error: null });
    try {
      // Demo auth: one candidate session per email (no admin/candidate split).
      const token = `demo-${demoUidFromEmail(trimmedEmail)}`;
      localStorage.setItem('applyai_token', token);
      set({ token });
      const profile = await profileRepository.me();
      set({ profile, loading: false, error: null });
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
    set({ token: null, profile: null, error: null, loading: false });
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
