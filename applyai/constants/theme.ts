/** Dark purple palette — parity with frontend/src/shared/theme/theme.ts */
export const Colors = {
  primary: '#5b5ce2',
  primaryDark: '#4546c7',
  primaryLight: '#8183f0',
  secondary: '#14b8a6',
  secondaryDark: '#0f766e',
  secondaryLight: '#5eead4',
  accent: '#ec4899',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',

  background: '#0b0c18',
  backgroundLight: '#15172a',
  surface: '#15172a',
  surfaceLight: '#1c1f36',
  card: '#15172a',
  border: 'rgba(238,240,255,0.08)',
  borderLight: 'rgba(238,240,255,0.05)',

  text: '#eef0ff',
  textSecondary: '#9aa0c0',
  textMuted: '#6b6f8c',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#0b0c18',

  white: '#ffffff',
  black: '#000000',

  glass: 'rgba(21,23,42,0.86)',
  bottomNavGlass: 'rgba(21,23,42,0.94)',
  primaryTint: 'rgba(91,92,226,0.12)',
  primaryTintSoft: 'rgba(91,92,226,0.08)',

  gradient: ['#5b5ce2', '#6d6ff0'] as const,
  gradientBrand: ['#5b5ce2', '#8183f0'] as const,
  gradientHero: ['#5b5ce2', '#14b8a6', '#ec4899'] as const,
  gradientYellow: ['#5b5ce2', '#8183f0'] as const,
  gradientSuccess: ['#22c55e', '#16a34a'] as const,
  gradientDrawer: ['#5b5ce2', '#6d6ff0', '#8b5cf6'] as const,
  gradientSplash: ['#0b0c18', '#15172a', '#2a2d6b'] as const,

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
};

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
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5b5ce2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
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
