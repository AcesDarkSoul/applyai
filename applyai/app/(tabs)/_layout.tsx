import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { AppTopBar } from '@/components/layout/AppTopBar';

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  index: { title: 'Home', subtitle: 'Your job search HQ' },
  jobs: { title: 'Find Jobs', subtitle: 'Matched to your resume' },
  apply: { title: 'Smart Apply', subtitle: 'Apply with one tap' },
  applications: { title: 'Applications', subtitle: 'Track every outreach' },
  profile: { title: 'Profile', subtitle: 'Resume & account' },
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
      <Tabs
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: [styles.tabBar, isWebDesktop && styles.tabBarWeb],
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
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
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="apply"
          options={{
            title: 'Apply',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.applyIcon, focused && styles.applyIconActive]}>
                <Ionicons name="flash" size={22} color={focused ? Colors.white : color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applied',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
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
              <Ionicons
                name={focused ? 'person-circle' : 'person-circle-outline'}
                size={24}
                color={color}
              />
            ),
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
    backgroundColor: Colors.white,
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
    borderRadius: 24,
    marginBottom: 12,
    marginHorizontal: 16,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 4,
  },
  applyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  applyIconActive: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
});
