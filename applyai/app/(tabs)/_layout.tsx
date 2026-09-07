import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { notificationRepository } from '@/lib/api/repositories';
import { useAuthStore } from '@/stores/authStore';
import { useColors } from '@/hooks/useColors';
import { getShellPalette } from '@/components/layout/shellTheme';
import { useThemeMode } from '@/hooks/useColors';
import { Shadows } from '@/constants/theme';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { isDark } = useThemeMode();
  const p = getShellPalette(isDark);
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(0);

  const isDesktop = width >= 1024;
  const isPhone = width < 768;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    notificationRepository
      .list(true)
      .then((res) => {
        if (!cancelled) setUnread(res.unreadCount || res.items.length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <View style={[styles.root, { backgroundColor: p.page }]}>
      {isDesktop ? <AppSidebar unreadCount={unread} /> : null}
      <View style={styles.main}>
        <DashboardHeader unreadCount={unread} showMenu={!isDesktop} />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: isPhone
              ? [
                  styles.tabBar,
                  {
                    backgroundColor: colors.bottomNavGlass,
                    borderTopColor: colors.border,
                  },
                ]
              : styles.tabBarHidden,
            tabBarLabelStyle: styles.tabLabel,
            sceneStyle: { backgroundColor: p.page },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="jobs"
            options={{
              title: 'Jobs',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="resume"
            options={{
              title: 'Resume',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="applications"
            options={{
              title: 'Apps',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen name="apply" options={{ href: null, title: 'Apply' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, minWidth: 0 },
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 64 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    ...Shadows.md,
  },
  tabBarHidden: {
    display: 'none',
    height: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
