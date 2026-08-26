import type Ionicons from '@expo/vector-icons/Ionicons';

export type ShellNavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badgeKey?: 'messages';
  match: string[];
};

export const SHELL_NAV: ShellNavItem[] = [
  {
    label: 'Dashboard',
    href: '/(tabs)',
    icon: 'grid-outline',
    activeIcon: 'grid',
    match: ['/', '/(tabs)', '/(tabs)/'],
  },
  {
    label: 'Find Jobs',
    href: '/(tabs)/jobs',
    icon: 'briefcase-outline',
    activeIcon: 'briefcase',
    match: ['/jobs', '/(tabs)/jobs'],
  },
  {
    label: 'Applications',
    href: '/(tabs)/applications',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
    match: ['/applications'],
  },
  {
    label: 'Interviews',
    href: '/(tabs)/applications',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    match: ['/interviews'],
  },
  {
    label: 'Offers',
    href: '/(tabs)/applications',
    icon: 'trophy-outline',
    activeIcon: 'trophy',
    match: ['/offers'],
  },
  {
    label: 'Saved Jobs',
    href: '/(tabs)/jobs',
    icon: 'bookmark-outline',
    activeIcon: 'bookmark',
    match: ['/saved'],
  },
  {
    label: 'Messages',
    href: '/notifications',
    icon: 'chatbubble-outline',
    activeIcon: 'chatbubble',
    badgeKey: 'messages',
    match: ['/notifications'],
  },
  {
    label: 'Profile',
    href: '/(tabs)/profile',
    icon: 'person-outline',
    activeIcon: 'person',
    match: ['/profile'],
  },
  {
    label: 'Settings',
    href: '/(tabs)/profile',
    icon: 'settings-outline',
    activeIcon: 'settings',
    match: ['/settings'],
  },
];

export function isNavActive(pathname: string | null, item: ShellNavItem) {
  const path = pathname || '/';
  if (item.label === 'Dashboard') {
    return path === '/' || path === '/(tabs)' || path.endsWith('/(tabs)') || path === '/index';
  }
  return item.match.some((m) => path === m || path.endsWith(m));
}
