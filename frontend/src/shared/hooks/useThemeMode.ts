import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggle: () => void;
}

const initial =
  (localStorage.getItem('applyai_theme') as 'light' | 'dark' | null) || 'dark';

export const useThemeMode = create<ThemeState>((set, get) => ({
  mode: initial,
  toggle() {
    const next = get().mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('applyai_theme', next);
    document.body.classList.toggle('dark', next === 'dark');
    set({ mode: next });
  },
}));

if (typeof document !== 'undefined') {
  document.body.classList.toggle('dark', initial === 'dark');
}
