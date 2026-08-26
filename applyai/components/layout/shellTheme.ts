import { Platform } from 'react-native';

export const SHELL_FONT = Platform.select({
  web: 'Plus Jakarta Sans, system-ui, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

export function webShadow(light: string) {
  if (Platform.OS !== 'web') {
    return {
      shadowColor: '#1b2048',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 4,
    };
  }
  return { boxShadow: light } as const;
}

export function getShellPalette(isDark: boolean) {
  if (isDark) {
    return {
      page: '#050914',
      sidebar: '#0A0B18',
      sidebarText: '#F3F5FF',
      sidebarMuted: 'rgba(238,240,255,0.62)',
      sidebarActive: 'rgba(109, 94, 252, 0.32)',
      sidebarCard: '#12142A',
      header: '#070B16',
      card: '#0B1020',
      cardAlt: '#10162A',
      border: 'rgba(238,240,255,0.08)',
      text: '#F4F6FF',
      muted: '#8B92B5',
      searchBg: '#0E1428',
      hero: ['#16113F', '#3A2A9C', '#6B4EE6'] as const,
      primary: '#6D5EFC',
      success: '#22C55E',
      match: '#16C784',
    };
  }

  return {
    page: '#F4F5FA',
    sidebar: '#2A3392',
    sidebarText: '#FFFFFF',
    sidebarMuted: 'rgba(255,255,255,0.78)',
    sidebarActive: 'rgba(255,255,255,0.16)',
    sidebarCard: '#232C86',
    header: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F7F8FF',
    border: 'rgba(40, 44, 90, 0.08)',
    text: '#171D31',
    muted: '#7A829C',
    searchBg: '#F4F6FB',
    hero: ['#6D5EFC', '#8B5CF6', '#FF8B66'] as const,
    primary: '#6D5EFC',
    success: '#16A34A',
    match: '#16A34A',
  };
}

export type ShellPalette = ReturnType<typeof getShellPalette>;
