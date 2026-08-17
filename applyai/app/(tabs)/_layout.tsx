import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { useColors } from '@/hooks/useColors';

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  index: { title: 'Dashboard', subtitle: 'Your job search HQ' },
  jobs: { title: 'Find Jobs', subtitle: 'Matched to your resume' },
  resume: { title: 'Resume', subtitle: 'Upload, ATS score & optimize' },
  profile: { title: 'Profile', subtitle: 'Your details & skills' },
  apply: { title: 'Smart Apply', subtitle: 'Apply with one tap' },
  applications: { title: 'Applications', subtitle: 'Track every outreach' },
};

function TabHeader({ routeName }: { routeName: string }) {
  const meta = TAB_META[routeName] || { title: 'ApplyAI', subtitle: '' };
  return <AppTopBar title={meta.title} subtitle={meta.subtitle} />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width >= 1024;
  const isCompact = width < 400;
  const colors = useColors();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: colors.primaryLight,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.bottomNavGlass,
              borderTopColor: colors.border,
            },
            isWebDesktop && styles.tabBarWeb,
            isWebDesktop && { borderColor: colors.border },
          ],
          tabBarLabelStyle: [styles.tabLabel, isCompact && styles.tabLabelCompact],
          tabBarItemStyle: styles.tabItem,
          tabBarActiveBackgroundColor: colors.primaryTint,
          header: () => <TabHeader routeName={route.name} />,
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colors.background },
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
          name="resume"
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
    ...(Platform.OS === 'web' && { maxWidth: 1400, width: '100%', alignSelf: 'center' }),
  },
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 72 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'web' ? 12 : 10,
    paddingTop: 10,
    paddingHorizontal: 4,
    ...Shadows.md,
  },
  tabBarWeb: {
    maxWidth: 640,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    marginBottom: 12,
    marginHorizontal: 16,
    borderTopWidth: 0,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  tabLabelCompact: {
    fontSize: 9,
  },
  tabItem: {
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginHorizontal: 1,
  },
});
