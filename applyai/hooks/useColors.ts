import { useMemo } from 'react';
import { getThemeColors, type ThemeColors } from '@/constants/theme';
import { useThemeStore } from '@/stores/themeStore';

export function useColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  return useMemo(() => getThemeColors(mode), [mode]);
}

export function useThemeMode() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const toggle = useThemeStore((s) => s.toggle);
  return { mode, setMode, toggle, isDark: mode === 'dark' };
}
