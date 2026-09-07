import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { SHELL_NAV, isNavActive } from '@/components/layout/navItems';
import { SHELL_FONT, getShellPalette } from '@/components/layout/shellTheme';
import { useThemeMode } from '@/hooks/useColors';

type Props = {
  unreadCount?: number;
  onNavigate?: () => void;
  fill?: boolean;
};

export function AppSidebar({ unreadCount = 0, onNavigate, fill }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useThemeMode();
  const p = getShellPalette(isDark);

  const go = (href: string) => {
    onNavigate?.();
    router.push(href as never);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: p.sidebar }, fill && styles.fill]}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="briefcase" size={16} color="#fff" />
        </View>
        <Text style={styles.brandText}>FindJob</Text>
      </View>

      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false} contentContainerStyle={styles.navInner}>
        {SHELL_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Pressable
              key={item.label}
              onPress={() => go(item.href)}
              style={[styles.item, active && { backgroundColor: p.sidebarActive }]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={18}
                color={active ? '#fff' : p.sidebarMuted}
              />
              <Text style={[styles.itemLabel, { color: active ? '#fff' : p.sidebarMuted }]}>{item.label}</Text>
              {item.badgeKey === 'messages' && unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.promo, { backgroundColor: p.sidebarCard }]}>
        <View style={styles.promoIcon}>
          <Ionicons name="ribbon" size={16} color="#F7D774" />
        </View>
        <Text style={styles.promoTitle}>Upgrade to Premium</Text>
        <Text style={styles.promoBody}>Unlock exclusive jobs and features.</Text>
        <Pressable onPress={() => go('/plans')}>
          <LinearGradient colors={['#6D5EFC', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Upgrade Now</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', flex: 1 },
  wrap: {
    width: 236,
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#fff',
    fontFamily: SHELL_FONT,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  nav: { flex: 1 },
  navInner: { gap: 4, paddingBottom: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemLabel: {
    flex: 1,
    fontFamily: SHELL_FONT,
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6D5EFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', fontFamily: SHELL_FONT },
  promo: {
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
  },
  promoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 215, 116, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  promoTitle: {
    color: '#fff',
    fontFamily: SHELL_FONT,
    fontSize: 15,
    fontWeight: '800',
  },
  promoBody: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: SHELL_FONT,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  promoBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  promoBtnText: { color: '#fff', fontFamily: SHELL_FONT, fontWeight: '800', fontSize: 13 },
});
