import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { Colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, initialized, segments]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const initialize = useAuthStore((s) => s.initialize);
  const refreshResume = useResumeStore((s) => s.refresh);

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { const unsub = initialize(); return unsub; }, []);
  useEffect(() => { refreshResume(); }, []);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AuthGuard>
        <StatusBar style="dark" />
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: Platform.OS === 'ios' ? 'default' : 'fade',
        }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="job/[id]" options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.white },
            headerTintColor: Colors.primary,
            headerTitleStyle: { fontWeight: '800', fontSize: 18 },
            headerShadowVisible: false,
            title: 'Job Details',
          }} />
          <Stack.Screen name="share/linkedin" options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.white },
            headerTintColor: Colors.primary,
            headerShadowVisible: false,
            title: 'AI Social Posts',
            presentation: 'modal',
          }} />
          <Stack.Screen name="resume/upload" options={{
            headerShown: true,
            headerStyle: { backgroundColor: Colors.white },
            headerTintColor: Colors.primary,
            headerShadowVisible: false,
            title: 'Save Resume',
            presentation: 'modal',
          }} />
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
