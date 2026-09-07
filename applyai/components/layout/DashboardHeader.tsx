import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '@/stores/authStore';
import { useDrawerStore } from '@/stores/drawerStore';
import { SHELL_FONT, getShellPalette, webShadow } from '@/components/layout/shellTheme';
import { useThemeMode } from '@/hooks/useColors';

type Props = {
  unreadCount?: number;
  showMenu?: boolean;
};

export function DashboardHeader({ unreadCount = 0, showMenu = false }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isDark } = useThemeMode();
  const p = getShellPalette(isDark);
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const openNav = useDrawerStore((s) => s.setOpen);
  const openProfile = useDrawerStore((s) => s.setProfileOpen);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const compact = width < 768;
  const name = profile?.name || user?.displayName || 'Job Seeker';
  const initial = name.trim().charAt(0).toUpperCase();
  const photo = user?.photoURL;
  const hotkey = Platform.OS === 'web' && Platform.select({ web: true }) ? (navigator.platform?.includes('Mac') ? '⌘ K' : 'Ctrl K') : '⌘ K';

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (compact) {
          router.push('/(tabs)/jobs');
          return;
        }
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compact, router]);

  const submitSearch = () => {
    router.push('/(tabs)/jobs');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: p.header,
          borderColor: p.border,
        },
        webShadow(isDark ? '0 8px 24px rgba(0,0,0,0.28)' : '0 8px 24px rgba(40,44,90,0.06)'),
      ]}
    >
      {compact ? (
        <View style={styles.brandMini}>
          <View style={styles.brandIcon}>
            <Ionicons name="briefcase" size={14} color="#fff" />
          </View>
          <Text style={[styles.brandText, { color: p.text }]}>FindJob</Text>
        </View>
      ) : null}

      {!compact ? (
        <Pressable
          style={[styles.search, { backgroundColor: p.searchBg, borderColor: p.border }]}
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="search-outline" size={18} color={p.muted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for jobs, roles or companies..."
            placeholderTextColor={p.muted}
            style={[styles.searchInput, { color: p.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
          <View style={[styles.hotkey, { borderColor: p.border, backgroundColor: p.header }]}>
            <Text style={[styles.hotkeyText, { color: p.muted }]}>{hotkey}</Text>
          </View>
        </Pressable>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View style={styles.right}>
        {compact ? (
          <Pressable
            onPress={() => router.push('/(tabs)/jobs')}
            style={[styles.iconBtn, { backgroundColor: p.searchBg, borderColor: p.border }]}
            accessibilityLabel="Search jobs"
          >
            <Ionicons name="search-outline" size={18} color={p.text} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/notifications')}
          style={[styles.iconBtn, { backgroundColor: p.searchBg, borderColor: p.border }]}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={p.text} />
          {unreadCount > 0 ? <View style={styles.dot} /> : null}
        </Pressable>

        <Pressable onPress={() => openProfile(true)} style={styles.profile} accessibilityLabel="Account">
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          {!compact ? (
            <View style={{ minWidth: 0 }}>
              <Text style={[styles.name, { color: p.text }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[styles.role, { color: p.muted }]}>Job Seeker</Text>
            </View>
          ) : null}
          {!compact ? <Ionicons name="chevron-down" size={14} color={p.muted} /> : null}
        </Pressable>

        {showMenu ? (
          <Pressable
            onPress={() => openNav(true)}
            style={[styles.iconBtn, { backgroundColor: p.searchBg, borderColor: p.border }]}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={20} color={p.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  brandMini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#2A3392',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontFamily: SHELL_FONT, fontWeight: '800', fontSize: 16 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontFamily: SHELL_FONT,
    fontSize: 14,
    fontWeight: '600',
    outlineStyle: 'none',
  } as never,
  hotkey: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hotkeyText: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '700' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 180 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: '#6D5EFC', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontFamily: SHELL_FONT },
  name: { fontFamily: SHELL_FONT, fontSize: 13, fontWeight: '800' },
  role: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '600' },
});
