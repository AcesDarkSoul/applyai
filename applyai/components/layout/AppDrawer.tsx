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
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useDrawerStore } from '@/stores/drawerStore';
import { useColors } from '@/hooks/useColors';

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/(tabs)/', icon: 'grid-outline' },
  { label: 'Find Jobs', href: '/(tabs)/jobs', icon: 'briefcase-outline' },
  { label: 'Resume', href: '/(tabs)/resume', icon: 'document-text-outline' },
  { label: 'Profile', href: '/(tabs)/profile', icon: 'person-outline' },
  { label: 'Plans', href: '/plans', icon: 'diamond-outline' },
  { label: 'Hiring Posts', href: '/posts', icon: 'newspaper-outline' },
  { label: 'Applications', href: '/(tabs)/applications', icon: 'clipboard-outline' },
  { label: 'Notifications', href: '/notifications', icon: 'notifications-outline' },
  { label: 'AI Tools', href: '/ai-tools', icon: 'sparkles-outline' },
  { label: 'Analytics', href: '/analytics', icon: 'stats-chart-outline' },
];

export function AppDrawer() {
  const open = useDrawerStore((s) => s.open);
  const setOpen = useDrawerStore((s) => s.setOpen);
  const openProfile = useDrawerStore((s) => s.setProfileOpen);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();

  const close = () => setOpen(false);

  const go = (href: string) => {
    close();
    router.push(href as never);
  };

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              borderRightColor: colors.border,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(91,92,226,0.18)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.brandRow}>
            <BrandLogo size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.brand, { color: colors.text }]}>ApplyAI</Text>
              <Text style={[styles.brandSub, { color: colors.textMuted }]}>
                Job search workspace
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={12}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
              accessibilityLabel="Close menu"
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
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
                  style={[
                    styles.navItem,
                    active && { backgroundColor: colors.primaryTint },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={active ? colors.primaryLight : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      { color: active ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <LinearGradient colors={[...colors.gradientDrawer]} style={styles.boost}>
            <Text style={styles.boostTitle}>Plans</Text>
            <Text style={styles.boostBody}>Starter ₹599 · Pro ₹1499 · Elite ₹2999</Text>
            <Pressable style={styles.boostBtn} onPress={() => go('/plans')}>
              <Text style={styles.boostBtnText}>View packages</Text>
            </Pressable>
          </LinearGradient>

          <Pressable
            style={[
              styles.accountBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              close();
              openProfile(true);
            }}
          >
            <Ionicons name="person-circle-outline" size={20} color={colors.primaryLight} />
            <Text style={[styles.accountBtnText, { color: colors.text }]}>
              Account & theme
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu" />
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
    borderRightWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brand: {
    fontWeight: '800',
    fontSize: FontSize.lg,
  },
  brandSub: {
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
  navLabel: {
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  boost: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  boostTitle: {
    color: '#fff',
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
    color: '#fff',
    fontWeight: '800',
    fontSize: FontSize.xs,
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  accountBtnText: {
    flex: 1,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
});
