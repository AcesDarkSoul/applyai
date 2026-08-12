import { Pressable, StyleSheet, Text, View, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAuthStore } from '@/stores/authStore';
import { useDrawerStore } from '@/stores/drawerStore';

type AppTopBarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
};

export function AppTopBar({
  title,
  subtitle,
  showBack = false,
  showMenu = true,
  rightAction,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const profile = useAuthStore((s) => s.profile);
  const openDrawer = useDrawerStore((s) => s.setOpen);
  const isCompact = width < 640;
  const isWide = width >= 1024;

  const initial = (profile?.name || profile?.email || 'A').trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 12 : 8),
          paddingHorizontal: isWide ? Spacing.xl : Spacing.md,
        },
      ]}
    >
      <View style={[styles.bar, isWide && styles.barWide]}>
        <View style={styles.left}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>
          ) : showMenu ? (
            <Pressable
              onPress={() => openDrawer(true)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={22} color={Colors.text} />
            </Pressable>
          ) : (
            <BrandLogo size={36} />
          )}

          <View style={styles.titleBlock}>
            <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={1}>
              {title}
            </Text>
            {!isCompact && Boolean(subtitle) && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.right}>
          {rightAction && (
            <Pressable
              onPress={rightAction.onPress}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel={rightAction.label || 'Action'}
            >
              <Ionicons name={rightAction.icon} size={20} color={Colors.primaryLight} />
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          </Pressable>

          {!isCompact && (
            <Pressable
              onPress={() => router.push('/(tabs)/jobs')}
              style={({ pressed }) => [styles.searchChip, pressed && styles.pressed]}
              accessibilityLabel="Search jobs"
            >
              <Ionicons name="search" size={16} color={Colors.primaryLight} />
              <Text style={styles.searchText}>Search jobs</Text>
            </Pressable>
          )}

          {isCompact && (
            <Pressable
              onPress={() => router.push('/(tabs)/jobs')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Search jobs"
            >
              <Ionicons name="search" size={20} color={Colors.text} />
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
            accessibilityLabel="Open profile"
          >
            <LinearGradient
              colors={Colors.gradientBrand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  barWide: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: FontSize.md,
  },
  subtitle: {
    marginTop: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  avatarWrap: {
    borderRadius: 999,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
