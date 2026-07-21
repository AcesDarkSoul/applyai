export const Colors = {
  // Primary palette — Yellow, Green, White
  primary: '#22C55E',        // Green
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  secondary: '#FACC15',      // Yellow
  secondaryDark: '#EAB308',
  secondaryLight: '#FDE047',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#0EA5E9',

  // Backgrounds — light theme
  background: '#F8FAFC',
  backgroundLight: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#0F172A',

  white: '#FFFFFF',
  black: '#000000',

  // Gradients
  gradient: ['#22C55E', '#16A34A', '#059669'] as const,
  gradientYellow: ['#FACC15', '#EAB308', '#CA8A04'] as const,
  gradientHero: ['#22C55E', '#4ADE80', '#FACC15'] as const,
  gradientSuccess: ['#22C55E', '#16A34A'] as const,

  // Platform colors
  linkedin: '#0A66C2',
  indeed: '#2164F3',
  naukri: '#4A90D9',
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
