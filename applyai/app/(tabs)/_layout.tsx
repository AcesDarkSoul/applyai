import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { AppDrawer } from '@/components/layout/AppDrawer';

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  index: { title: 'Dashboard', subtitle: 'Your job search HQ' },
  jobs: { title: 'Find Jobs', subtitle: 'Matched to your resume' },
  apply: { title: 'Smart Apply', subtitle: 'Apply with one tap' },
  applications: { title: 'Applications', subtitle: 'Track every outreach' },
  profile: { title: 'Resume Studio', subtitle: 'Resume & account' },
};

function TabHeader({ routeName }: { routeName: string }) {
  const meta = TAB_META[routeName] || { title: 'ApplyAI', subtitle: '' };
  return <AppTopBar title={meta.title} subtitle={meta.subtitle} />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 1024;

  return (
    <View style={styles.wrapper}>
      <AppDrawer />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: Colors.primaryLight,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: [styles.tabBar, isWebDesktop && styles.tabBarWeb],
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarActiveBackgroundColor: Colors.primaryTint,
          header: () => <TabHeader routeName={route.name} />,
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: Colors.background },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
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
          name="profile"
          options={{
            title: 'Resume',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Apps',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'clipboard' : 'clipboard-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="apply"
          options={{
            href: null,
            title: 'Apply',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
    ...(Platform.OS === 'web' && { maxWidth: 1400, width: '100%', alignSelf: 'center' }),
  },
  tabBar: {
    backgroundColor: Colors.bottomNavGlass,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 72 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'web' ? 12 : 10,
    paddingTop: 10,
    paddingHorizontal: Spacing.sm,
    ...Shadows.md,
  },
  tabBarWeb: {
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    marginBottom: 12,
    marginHorizontal: 16,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginHorizontal: 2,
  },
});
