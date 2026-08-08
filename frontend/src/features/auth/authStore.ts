import { create } from 'zustand';
import { profileRepository } from '../../shared/api/repositories';
import type { UserProfile } from '../../shared/types';

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleEmail: string, googleName?: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function demoUidFromEmail(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase());
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

  async register(name, email, password) {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || trimmedName.length < 2) {
      set({ error: 'Please enter your full name (at least 2 characters)' });
      return;
    }
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
      const token = `demo-${demoUidFromEmail(trimmedEmail)}`;
      localStorage.setItem('applyai_token', token);
      set({ token });

      let profile = await profileRepository.me();
      if (trimmedName && profile.displayName !== trimmedName) {
        profile = await profileRepository.update({ displayName: trimmedName });
      }
      set({ profile, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
        token: null,
      });
      localStorage.removeItem('applyai_token');
    }
  },

  async loginWithGoogle(googleEmail: string, googleName?: string) {
    const trimmedEmail = googleEmail.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      set({ error: 'Please enter a valid Google account email' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const localPart = trimmedEmail.split('@')[0] || 'googleuser';
      const derivedName =
        googleName ||
        localPart
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const token = `demo-${demoUidFromEmail(trimmedEmail)}`;
      localStorage.setItem('applyai_token', token);
      set({ token });

      let profile = await profileRepository.me();
      if (derivedName && profile.displayName !== derivedName) {
        profile = await profileRepository.update({
          displayName: derivedName,
        });
      }
      set({ profile, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Google sign in failed',
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
