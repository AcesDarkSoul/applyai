import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useThemeMode } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

export function FindJobHeader({
  userName = 'Sagar Patel',
  userRole = 'Job Seeker',
  userAvatar,
  searchQuery,
  onSearchChange,
  onNotificationPress,
  onProfilePress,
}: {
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}) {
  const colors = useColors();
  const { isDark, toggle: toggleTheme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.topRow}>
        {/* Mobile Brand Logo */}
        {isMobile && (
          <View style={styles.brandRow}>
            <LinearGradient colors={['#6d5efc', '#3b82f6']} style={styles.logoIcon}>
              <Ionicons name="briefcase" size={16} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.brandText, { color: colors.text }]}>FindJob</Text>
          </View>
        )}

        {/* Desktop Search Input Bar */}
        {!isMobile && (
          <View style={[styles.searchWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              placeholder="Search for jobs, roles or companies..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <View style={[styles.shortcutPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.shortcutText, { color: colors.textMuted }]}>⌘ K</Text>
            </View>
          </View>
        )}

        {/* Right Action Icons & User Info */}
        <View style={styles.rightActions}>
          {/* Theme Toggle Button */}
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {/* Notification Bell */}
          <Pressable
            onPress={onNotificationPress}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </Pressable>

          {/* User Profile Avatar Pill */}
          <Pressable
            onPress={onProfilePress}
            style={({ pressed }) => [
              styles.userProfilePill,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {userName.split(' ').map((n) => n[0]).join('')}
                  </Text>
                </View>
              )}
              {/* Online status indicator dot */}
              <View style={styles.onlineDot} />
            </View>
            {!isMobile && (
              <View style={styles.userInfoCol}>
                <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                <Text style={[styles.userRole, { color: colors.textMuted }]}>{userRole}</Text>
              </View>
            )}
            {!isMobile && <Ionicons name="chevron-down" size={14} color={colors.textMuted} />}
          </Pressable>
        </View>
      </View>

      {/* Mobile Search Bar (under top row on mobile) */}
      {isMobile && (
        <View style={[styles.searchWrapperMobile, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search jobs, roles or companies..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            style={[styles.searchInputMobile, { color: colors.text }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchWrapper: {
    flex: 1,
    maxWidth: 420,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchWrapperMobile: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchInputMobile: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  shortcutPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 2,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    overflow: 'visible',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  userInfoCol: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '500',
  },
});
