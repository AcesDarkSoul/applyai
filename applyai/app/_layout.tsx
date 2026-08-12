import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { Colors } from '@/constants/theme';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { trackScreen } from '@/lib/firebase/analytics';
import { initTelemetry } from '@/lib/firebase/telemetry';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

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

  const root = segments[0];
  const inAuthGroup = AUTH_ROUTES.has(String(root ?? ''));
  const needsAuth = !inAuthGroup;

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

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user && needsAuth) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (user && inAuthGroup) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const refreshResume = useResumeStore((s) => s.refresh);

  useEffect(() => {
    void initTelemetry();
  }, []);
  useEffect(() => {
    const unsub = initialize();
    return unsub;
  }, []);
  useEffect(() => {
    refreshResume();
  }, []);
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthGuard>
        <ScreenTracker />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: Platform.OS === 'ios' ? 'default' : 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
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
                <AppTopBar title="Job Details" subtitle="Match, apply, follow up" showBack showMenu={false} />
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
    backgroundColor: Colors.background,
  },
});
