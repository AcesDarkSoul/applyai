import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useDrawerStore } from '@/stores/drawerStore';
import { useAuthStore } from '@/stores/authStore';
import { logOut } from '@/lib/firebase/auth';

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(tabs)/', icon: 'grid-outline' },
  { label: 'Find Jobs', href: '/(tabs)/jobs', icon: 'briefcase-outline' },
  { label: 'Resume Studio', href: '/(tabs)/profile', icon: 'document-text-outline' },
  { label: 'Hiring Posts', href: '/posts', icon: 'newspaper-outline' },
  { label: 'Applications', href: '/(tabs)/applications', icon: 'clipboard-outline' },
  { label: 'Notifications', href: '/notifications', icon: 'notifications-outline' },
  { label: 'AI Tools', href: '/ai-tools', icon: 'sparkles-outline' },
  { label: 'Analytics', href: '/analytics', icon: 'stats-chart-outline' },
];

export function AppDrawer() {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const profile = useAuthStore((s) => s.profile);

  const close = () => setOpen(false);

  const go = (href: string) => {
    close();
    router.push(href as never);
  };

  const onLogout = async () => {
    close();
    await logOut();
    router.replace('/(auth)/login');
  };

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View
          style={[
            styles.panel,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(91,92,226,0.16)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.brandRow}>
            <BrandLogo size={40} />
            <View>
              <Text style={styles.brand}>ApplyAI</Text>
              <Text style={styles.brandSub}>Job search workspace</Text>
            </View>
          </View>

          <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
            {NAV.map((item) => {
              const active =
                pathname === item.href.replace('/(tabs)', '') ||
                pathname?.includes(item.href.split('/').pop() || '');
              return (
                <Pressable
                  key={item.href}
                  onPress={() => go(item.href)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? Colors.primaryLight : Colors.textSecondary}
                  />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <LinearGradient colors={Colors.gradientDrawer} style={styles.boost}>
            <Text style={styles.boostTitle}>Match boost</Text>
            <Text style={styles.boostBody}>Find roles ranked to your resume</Text>
            <Pressable style={styles.boostBtn} onPress={() => go('/(tabs)/jobs')}>
              <Text style={styles.boostBtnText}>Find matches</Text>
            </Pressable>
          </LinearGradient>

          <Pressable style={styles.logout} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.logoutText}>
              Log out{profile?.email ? ` · ${profile.email.split('@')[0]}` : ''}
            </Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: Platform.OS === 'web' ? 300 : '82%',
    maxWidth: 320,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brand: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: FontSize.lg,
  },
  brandSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  nav: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: Colors.primaryTint,
  },
  navLabel: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  navLabelActive: {
    color: Colors.text,
  },
  boost: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  boostTitle: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.md,
  },
  boostBody: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.xs,
    marginBottom: 8,
  },
  boostBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  boostBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSize.xs,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
});
