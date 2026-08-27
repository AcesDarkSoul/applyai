import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useColors } from '@/hooks/useColors';

/** Entry route: login first, then plan purchase, then the app. */
export default function Index() {
  const { user, initialized } = useAuthStore();
  const active = useSubscriptionStore((s) => s.active);
  const planHydrated = useSubscriptionStore((s) => s.hydrated);
  const colors = useColors();

  if (!initialized || (user && !planHydrated)) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!active) {
    return <Redirect href="/plans" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
