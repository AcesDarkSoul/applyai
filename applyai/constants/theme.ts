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
  heroCardBg: readonly [string, string, string];
  heroCardText: string;
  heroCardSubtext: string;
  heroInnerCardBg: string;
  heroInnerCardBorder: string;
  chartLine: string;
  chartFillGradient: readonly [string, string];
  matchBadgeBg: string;
  matchBadgeText: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
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
  background: '#0a0c16',
  backgroundLight: '#131528',
  surface: '#131528',
  surfaceLight: '#1a1d36',
  card: '#131528',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.04)',
  text: '#ffffff',
  textSecondary: '#9aa1c2',
  textMuted: '#656b8a',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#0a0c16',
  glass: 'rgba(19, 21, 40, 0.90)',
  bottomNavGlass: 'rgba(12, 14, 28, 0.96)',
  primaryTint: 'rgba(109, 94, 252, 0.18)',
  primaryTintSoft: 'rgba(109, 94, 252, 0.10)',
  heroCardBg: ['#161539', '#191845', '#1c174e'],
  heroCardText: '#ffffff',
  heroCardSubtext: '#b3b7dd',
  heroInnerCardBg: '#131528',
  heroInnerCardBorder: 'rgba(255, 255, 255, 0.12)',
  chartLine: '#8a77ff',
  chartFillGradient: ['rgba(138, 119, 255, 0.35)', 'rgba(138, 119, 255, 0.0)'],
  matchBadgeBg: 'rgba(34, 197, 94, 0.14)',
  matchBadgeText: '#22c55e',
  sidebarActiveBg: '#6d5efc',
  sidebarActiveText: '#ffffff',
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
  background: '#f4f5fa',
  backgroundLight: '#ffffff',
  surface: '#ffffff',
  surfaceLight: '#f0f2fb',
  card: '#ffffff',
  border: '#e4e7f3',
  borderLight: '#edf0fa',
  text: '#121633',
  textSecondary: '#5a6080',
  textMuted: '#8b92b0',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#0a0c16',
  glass: 'rgba(255, 255, 255, 0.92)',
  bottomNavGlass: 'rgba(255, 255, 255, 0.96)',
  primaryTint: 'rgba(109, 94, 252, 0.10)',
  primaryTintSoft: 'rgba(109, 94, 252, 0.05)',
  heroCardBg: ['#6054f9', '#755ff5', '#9865f7'],
  heroCardText: '#ffffff',
  heroCardSubtext: '#e3dffd',
  heroInnerCardBg: '#ffffff',
  heroInnerCardBorder: 'rgba(255, 255, 255, 0.40)',
  chartLine: '#6d5efc',
  chartFillGradient: ['rgba(109, 94, 252, 0.25)', 'rgba(109, 94, 252, 0.0)'],
  matchBadgeBg: '#e6f7ed',
  matchBadgeText: '#16a34a',
  sidebarActiveBg: '#6d5efc',
  sidebarActiveText: '#ffffff',
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
