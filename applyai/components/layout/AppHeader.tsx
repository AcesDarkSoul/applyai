import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Font } from '@/constants/fonts';
import { useAuthStore } from '@/stores/authStore';
import { useDrawerStore } from '@/stores/drawerStore';
import { useThemeMode } from '@/hooks/useColors';

type Variant = 'mobile' | 'tablet' | 'desktop';

export function AppHeader({ variant }: { variant: Variant }) {
  const router = useRouter();
  const { isDark } = useThemeMode();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const openNav = useDrawerStore((s) => s.setOpen);
  const openProfile = useDrawerStore((s) => s.setProfileOpen);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const name = profile?.name || user?.displayName || 'Job seeker';
  const initial = name.trim().charAt(0).toUpperCase();
  const photo = user?.photoURL;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = () => {
    const q = query.trim();
    router.push({ pathname: '/(tabs)/jobs', params: q ? { q } : {} } as never);
  };

  const searchBox = (
    <View style={[styles.search, isDark ? styles.searchDark : styles.searchLight]}>
      <Ionicons name="search-outline" size={18} color={isDark ? '#8b93b3' : '#8a90a8'} />
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submitSearch}
        placeholder="Search for jobs, roles or companies..."
        placeholderTextColor={isDark ? '#6f7694' : '#9aa0b5'}
        style={[styles.searchInput, { color: isDark ? '#eef0ff' : '#171d31' }]}
        returnKeyType="search"
      />
      {variant !== 'mobile' ? (
        <View style={[styles.hotkey, isDark ? styles.hotkeyDark : styles.hotkeyLight]}>
          <Text style={[styles.hotkeyText, { color: isDark ? '#c5cbe4' : '#6b7590' }]}>⌘ K</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.bar, isDark ? styles.barDark : styles.barLight]}>
      {variant !== 'desktop' ? (
        <View style={styles.brandRow}>
          <LinearGradient colors={['#8b7dff', '#6d5efc']} style={styles.brandIcon}>
            <Ionicons name="briefcase" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[styles.brand, { color: isDark ? '#fff' : '#1c1b4f' }]}>FindJob</Text>
        </View>
      ) : null}

      {variant === 'mobile' ? (
        <View style={styles.right}>
          <Pressable onPress={() => router.push('/(tabs)/jobs')} style={[styles.iconBtn, isDark ? styles.iconDark : styles.iconLight]}>
            <Ionicons name="search-outline" size={18} color={isDark ? '#eef0ff' : '#3b4060'} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} style={[styles.iconBtn, isDark ? styles.iconDark : styles.iconLight]}>
            <Ionicons name="notifications-outline" size={18} color={isDark ? '#eef0ff' : '#3b4060'} />
            <View style={styles.badge} />
          </Pressable>
          <Pressable onPress={() => openNav(true)} style={[styles.iconBtn, isDark ? styles.iconDark : styles.iconLight]}>
            <Ionicons name="menu" size={20} color={isDark ? '#eef0ff' : '#3b4060'} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchWrap}>{searchBox}</View>
          <View style={styles.right}>
            <Pressable onPress={() => router.push('/notifications')} style={[styles.iconBtn, isDark ? styles.iconDark : styles.iconLight]}>
              <Ionicons name="notifications-outline" size={18} color={isDark ? '#eef0ff' : '#3b4060'} />
              <View style={styles.badge} />
            </Pressable>
            <Pressable onPress={() => openProfile(true)} style={styles.profile}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#8b7dff', '#6d5efc']} style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
              )}
              {variant === 'desktop' ? (
                <View>
                  <Text style={[styles.name, { color: isDark ? '#edf0ff' : '#171d31' }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.role}>Job Seeker</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-down" size={14} color={isDark ? '#8b93b3' : '#7c879f'} />
            </Pressable>
            {variant === 'tablet' ? (
              <Pressable onPress={() => openNav(true)} style={[styles.iconBtn, isDark ? styles.iconDark : styles.iconLight]}>
                <Ionicons name="menu" size={20} color={isDark ? '#eef0ff' : '#3b4060'} />
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 72,
  },
  barLight: { backgroundColor: '#f7f8fd' },
  barDark: { backgroundColor: '#07091a' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 18, fontFamily: Font.extrabold },
  searchWrap: { flex: 1, minWidth: 0 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
  },
  searchLight: {
    backgroundColor: '#fff',
    borderColor: 'rgba(30,34,70,0.08)',
  },
  searchDark: {
    backgroundColor: '#12152a',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Font.medium,
    outlineStyle: 'none',
  } as never,
  hotkey: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  hotkeyLight: { backgroundColor: '#f3f5fb', borderColor: 'rgba(30,34,70,0.08)' },
  hotkeyDark: { backgroundColor: '#0c0f20', borderColor: 'rgba(255,255,255,0.08)' },
  hotkeyText: { fontSize: 11, fontFamily: Font.bold },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  iconLight: { backgroundColor: '#fff', borderColor: 'rgba(30,34,70,0.08)' },
  iconDark: { backgroundColor: '#12152a', borderColor: 'rgba(255,255,255,0.08)' },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: Font.bold, fontSize: 14 },
  name: { fontSize: 13, fontFamily: Font.bold, maxWidth: 140 },
  role: { fontSize: 11, color: '#8a90a8', fontFamily: Font.medium },
});
