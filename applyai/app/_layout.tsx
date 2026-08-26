import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useColors, useThemeMode } from '@/hooks/useColors';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { AppDrawer } from '@/components/layout/AppDrawer';
import { ProfileDrawer } from '@/components/layout/ProfileDrawer';
import { trackScreen } from '@/lib/firebase/analytics';
import { initTelemetry } from '@/lib/firebase/telemetry';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const AUTH_ROUTES = new Set(['(auth)']);

function ScreenTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const screen = pathname === '/' ? 'index' : pathname.replace(/^\//, '').replace(/\//g, '_');
    void trackScreen(screen, pathname);
  }, [pathname]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();

  const root = segments[0];
  const inAuthGroup = AUTH_ROUTES.has(String(root ?? ''));
  const needsAuth = !inAuthGroup;

  useEffect(() => {
    if (initialized) {
      void SplashScreen.hideAsync();
    }
  }, [initialized]);

  // fontsLoaded is referenced so splash can wait on typefaces without blocking auth.

  useEffect(() => {
    if (!initialized) return;

    if (!user && needsAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, needsAuth, inAuthGroup, router]);

  // Only block before Firebase answers. Always keep the Stack mounted after that
  // (returning <Redirect /> without a navigator caused the blank screen).
  if (!initialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const initialize = useAuthStore((s) => s.initialize);
  const refreshResume = useResumeStore((s) => s.refresh);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateSubscription = useSubscriptionStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const colors = useColors();
  const { isDark } = useThemeMode();

  useEffect(() => {
    void hydrateTheme();
    const t = setTimeout(() => {
      void initTelemetry();
    }, 1500);
    return () => clearTimeout(t);
  }, [hydrateTheme]);

  useEffect(() => {
    const unsub = initialize();
    return unsub;
  }, [initialize]);

  useEffect(() => {
    const t = setTimeout(() => {
      void refreshResume();
    }, 300);
    return () => clearTimeout(t);
  }, [refreshResume]);

  useEffect(() => {
    if (!user) return;
    void hydrateSubscription();
  }, [user, hydrateSubscription]);

  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthGuard>
        <ScreenTracker />
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppDrawer />
        <ProfileDrawer />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: Platform.OS === 'ios' ? 'default' : 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="plans" />
          <Stack.Screen name="posts/index" />
          <Stack.Screen name="posts/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="ai-tools" />
          <Stack.Screen
            name="job/[id]"
            options={{
              headerShown: true,
              header: () => (
                <AppTopBar title="Job Details" subtitle="Match, apply, follow up" showBack />
              ),
              headerShadowVisible: false,
              title: 'Job Details',
            }}
          />
          <Stack.Screen
            name="share/linkedin"
            options={{
              headerShown: true,
              header: () => (
                <AppTopBar title="AI Social Posts" subtitle="Share your wins" showBack showMenu={false} />
              ),
              headerShadowVisible: false,
              title: 'AI Social Posts',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="resume/upload"
            options={{
              headerShown: true,
              header: () => (
                <AppTopBar title="Save Resume" subtitle="Unlock smarter matches" showBack showMenu={false} />
              ),
              headerShadowVisible: false,
              title: 'Save Resume',
              presentation: 'modal',
            }}
          />
        </Stack>
      </AuthGuard>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
