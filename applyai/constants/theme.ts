/** ApplyAI brand palettes — dark (default) + light */

const brand = {
  primary: '#6d5efc',
  primaryDark: '#4f46e5',
  primaryLight: '#9d95ff',
  secondary: '#1ec7b5',
  secondaryDark: '#0f766e',
  secondaryLight: '#7ef2df',
  accent: '#ff7a66',
  danger: '#ef4444',
  warning: '#f7b955',
  success: '#2cc88a',
  info: '#4da3ff',
  white: '#ffffff',
  black: '#000000',
  linkedin: '#0A66C2',
  indeed: '#2164F3',
  naukri: '#4A90D9',
  statusApplied: '#22c55e',
  statusInterview: '#3b82f6',
  statusViewed: '#ef4444',
  statusSaved: '#f59e0b',
  statusOffer: '#f59e0b',
  statusRejected: '#ef4444',
  statusWithdrawn: '#6b6f8c',
} as const;

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  background: string;
  backgroundLight: string;
  surface: string;
  surfaceLight: string;
  card: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSecondary: string;
  white: string;
  black: string;
  glass: string;
  bottomNavGlass: string;
  primaryTint: string;
  primaryTintSoft: string;
  gradient: readonly [string, string];
  gradientBrand: readonly [string, string];
  gradientHero: readonly [string, string, string];
  gradientYellow: readonly [string, string];
  gradientSuccess: readonly [string, string];
  gradientDrawer: readonly [string, string, string];
  gradientSplash: readonly [string, string, string];
  linkedin: string;
  indeed: string;
  naukri: string;
  statusApplied: string;
  statusInterview: string;
  statusViewed: string;
  statusSaved: string;
  statusOffer: string;
  statusRejected: string;
  statusWithdrawn: string;
};

export const DarkColors: ThemeColors = {
  ...brand,
  background: '#0b0c18',
  backgroundLight: '#15172a',
  surface: '#15172a',
  surfaceLight: '#1c1f36',
  card: '#15172a',
  border: 'rgba(238,240,255,0.10)',
  borderLight: 'rgba(238,240,255,0.06)',
  text: '#eef0ff',
  textSecondary: '#9aa0c0',
  textMuted: '#6b6f8c',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#0b0c18',
  glass: 'rgba(21,23,42,0.92)',
  bottomNavGlass: 'rgba(14,16,32,0.96)',
  primaryTint: 'rgba(91,92,226,0.16)',
  primaryTintSoft: 'rgba(91,92,226,0.10)',
  gradient: ['#6d5efc', '#4f46e5'],
  gradientBrand: ['#6d5efc', '#8f7dff'],
  gradientHero: ['#6d5efc', '#3b82f6', '#ff7a66'],
  gradientYellow: ['#f7b955', '#f59e0b'],
  gradientSuccess: ['#2cc88a', '#15803d'],
  gradientDrawer: ['#6d5efc', '#4842d2', '#ff7a66'],
  gradientSplash: ['#0b0c18', '#15172a', '#2e2b6f'],
};

export const LightColors: ThemeColors = {
  ...brand,
  background: '#f3f4fb',
  backgroundLight: '#ffffff',
  surface: '#ffffff',
  surfaceLight: '#eef0fa',
  card: '#ffffff',
  border: 'rgba(30,34,70,0.10)',
  borderLight: 'rgba(30,34,70,0.06)',
  text: '#14162b',
  textSecondary: '#4d5373',
  textMuted: '#7a8099',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#0b0c18',
  glass: 'rgba(255,255,255,0.92)',
  bottomNavGlass: 'rgba(255,255,255,0.96)',
  primaryTint: 'rgba(91,92,226,0.12)',
  primaryTintSoft: 'rgba(91,92,226,0.07)',
  gradient: ['#6d5efc', '#8b5cf6'],
  gradientBrand: ['#6d5efc', '#9d95ff'],
  gradientHero: ['#6d5efc', '#3da9ff', '#ff9a66'],
  gradientYellow: ['#f7b955', '#f59e0b'],
  gradientSuccess: ['#2cc88a', '#15803d'],
  gradientDrawer: ['#6d5efc', '#7c6af8', '#ff9a66'],
  gradientSplash: ['#eef4ff', '#dde7ff', '#f7e7fb'],
};

/** Default export for existing screens — dark palette */
export const Colors = DarkColors;

export function getThemeColors(mode: 'light' | 'dark'): ThemeColors {
  return mode === 'light' ? LightColors : DarkColors;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 40,
};

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5b5ce2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const PlatformConfig = {
  linkedin: {
    name: 'LinkedIn',
    color: Colors.linkedin,
    icon: '💼',
    applyLabel: 'Apply on LinkedIn',
    shareSupported: true,
  },
  indeed: {
    name: 'Indeed',
    color: Colors.indeed,
    icon: '🔍',
    applyLabel: 'Apply on Indeed',
    shareSupported: false,
  },
  naukri: {
    name: 'Naukri',
    color: Colors.naukri,
    icon: '🇮🇳',
    applyLabel: 'Apply on Naukri',
    shareSupported: false,
  },
  other: {
    name: 'Job Portal',
    color: Colors.primary,
    icon: '🌐',
    applyLabel: 'Apply Now',
    shareSupported: false,
  },
} as const;

export type PlatformKey = keyof typeof PlatformConfig;
