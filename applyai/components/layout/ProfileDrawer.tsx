import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useColors, useThemeMode } from '@/hooks/useColors';
import { useDrawerStore } from '@/stores/drawerStore';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { logOut } from '@/lib/firebase/auth';
import { PLANS } from '@/constants/plans';

type ActionItem = {
  label: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
  onPress?: () => void;
  danger?: boolean;
};

export function ProfileDrawer() {
  const open = useDrawerStore((s) => s.profileOpen);
  const setOpen = useDrawerStore((s) => s.setProfileOpen);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { mode, setMode } = useThemeMode();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);

  const close = () => setOpen(false);

  const go = (href: string) => {
    close();
    router.push(href as never);
  };

  const onLogout = () => {
    Alert.alert('Log out', 'Sign out of ApplyAI on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          close();
          await logOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = profile?.name || user?.displayName || user?.email || 'Your account';
  const displayEmail = profile?.email || user?.email || '';
  const initial = (displayName || 'A').trim().charAt(0).toUpperCase();
  const catalog = useSubscriptionStore((s) => s.catalog);
  const amount = (id: 'starter' | 'pro' | 'elite') =>
    catalog?.plans?.find((p) => p.id === id)?.priceInr ?? PLANS[id].priceInr;

  const actions: ActionItem[] = [
    {
      label: 'Plans & billing',
      hint: `Starter ₹${amount('starter')} · Pro ₹${amount('pro')} · Elite ₹${amount('elite')}`,
      icon: 'diamond-outline',
      href: '/plans',
    },
    {
      label: 'Profile',
      hint: 'Name, skills, summary',
      icon: 'person-circle-outline',
      href: '/(tabs)/profile',
    },
    {
      label: 'Resume studio',
      hint: 'Upload & ATS optimize',
      icon: 'document-text-outline',
      href: '/(tabs)/resume',
    },
    {
      label: 'Applications',
      hint: 'Track outreach',
      icon: 'clipboard-outline',
      href: '/(tabs)/applications',
    },
    {
      label: 'Notifications',
      hint: 'Alerts & updates',
      icon: 'notifications-outline',
      href: '/notifications',
    },
    {
      label: 'AI Tools',
      hint: 'Cover letters & helpers',
      icon: 'sparkles-outline',
      href: '/ai-tools',
    },
    {
      label: 'Analytics',
      hint: 'Funnel health',
      icon: 'stats-chart-outline',
      href: '/analytics',
    },
  ];

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close profile" />

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              borderLeftColor: colors.border,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <LinearGradient
            colors={
              mode === 'dark'
                ? ['rgba(91,92,226,0.22)', 'transparent']
                : ['rgba(91,92,226,0.14)', 'transparent']
            }
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
            <Pressable
              onPress={close}
              hitSlop={12}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <LinearGradient colors={[...colors.gradientBrand]} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              {Boolean(displayEmail) && (
                <Text style={[styles.email, { color: colors.textMuted }]} numberOfLines={1}>
                  {displayEmail}
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.themeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.themeHeader}>
              <View
                style={[styles.themeIconWrap, { backgroundColor: colors.primaryTint }]}
              >
                <Ionicons
                  name={mode === 'dark' ? 'moon' : 'sunny'}
                  size={18}
                  color={colors.primaryLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeTitle, { color: colors.text }]}>Appearance</Text>
                <Text style={[styles.themeHint, { color: colors.textMuted }]}>
                  {mode === 'dark' ? 'Dark mode on' : 'Light mode on'}
                </Text>
              </View>
            </View>

            <View style={styles.themeToggleRow}>
              <Pressable
                onPress={() => setMode('light')}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: mode === 'light' ? colors.primaryTint : colors.surfaceLight,
                    borderColor: mode === 'light' ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="sunny-outline"
                  size={16}
                  color={mode === 'light' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeChipText,
                    { color: mode === 'light' ? colors.primary : colors.textSecondary },
                  ]}
                >
                  Light
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('dark')}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: mode === 'dark' ? colors.primaryTint : colors.surfaceLight,
                    borderColor: mode === 'dark' ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={16}
                  color={mode === 'dark' ? colors.primaryLight : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeChipText,
                    { color: mode === 'dark' ? colors.primaryLight : colors.textSecondary },
                  ]}
                >
                  Dark
                </Text>
              </Pressable>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
                Use dark theme
              </Text>
              <Switch
                value={mode === 'dark'}
                onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {actions.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => (item.href ? go(item.href) : item.onPress?.())}
                style={({ pressed }) => [
                  styles.navItem,
                  {
                    backgroundColor: pressed ? colors.primaryTintSoft : 'transparent',
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={[styles.navIcon, { backgroundColor: colors.primaryTint }]}>
                  <Ionicons name={item.icon} size={18} color={colors.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.navLabel, { color: colors.text }]}>{item.label}</Text>
                  {Boolean(item.hint) && (
                    <Text style={[styles.navHint, { color: colors.textMuted }]}>{item.hint}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[
              styles.logout,
              {
                borderColor: 'rgba(239,68,68,0.45)',
                backgroundColor: 'rgba(239,68,68,0.12)',
              },
            ]}
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: Platform.OS === 'web' ? 320 : '86%',
    maxWidth: 360,
    borderLeftWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  name: {
    fontWeight: '800',
    fontSize: FontSize.md,
  },
  email: {
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: '600',
  },
  themeCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTitle: {
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  themeHint: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 1,
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  themeChipText: {
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  switchLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  nav: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
    borderWidth: 1,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  navHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  logoutText: {
    fontWeight: '800',
    fontSize: FontSize.md,
  },
});
