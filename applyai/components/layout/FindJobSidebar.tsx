import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize } from '@/constants/theme';

export interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  route?: string;
}

const SIDEBAR_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/' },
  { id: 'jobs', label: 'Find Jobs', icon: 'briefcase-outline', route: '/jobs' },
  { id: 'applications', label: 'Applications', icon: 'document-text-outline', route: '/applications' },
  { id: 'interviews', label: 'Interviews', icon: 'calendar-outline', route: '/interviews' },
  { id: 'offers', label: 'Offers', icon: 'trophy-outline' },
  { id: 'saved', label: 'Saved Jobs', icon: 'bookmark-outline' },
  { id: 'messages', label: 'Messages', icon: 'chatbubble-outline', badge: 3 },
  { id: 'profile', label: 'Profile', icon: 'person-outline', route: '/profile' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export function FindJobSidebar({
  activeId = 'dashboard',
  onSelect,
  onUpgradePress,
}: {
  activeId?: string;
  onSelect?: (item: MenuItem) => void;
  onUpgradePress?: () => void;
}) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Brand Logo */}
      <View style={styles.brandRow}>
        <LinearGradient colors={['#6d5efc', '#3b82f6']} style={styles.logoIcon}>
          <Ionicons name="briefcase" size={18} color="#ffffff" />
        </LinearGradient>
        <Text style={[styles.brandText, { color: colors.text }]}>FindJob</Text>
      </View>

      {/* Navigation List */}
      <View style={styles.menuList}>
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect?.(item)}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && { backgroundColor: colors.sidebarActiveBg },
                !isActive && pressed && { backgroundColor: colors.primaryTintSoft },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? colors.sidebarActiveText : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: isActive ? colors.sidebarActiveText : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {item.label}
              </Text>
              {item.badge !== undefined && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isActive ? '#ffffff' : colors.primary },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: isActive ? colors.primary : '#ffffff' }]}>
                    {item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Upgrade Banner Card */}
      <View style={styles.upgradeWrapper}>
        <LinearGradient
          colors={['#1c174e', '#2a2273']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.upgradeCard}
        >
          <View style={styles.upgradeTitleRow}>
            <Ionicons name="sparkles" size={16} color="#f59e0b" />
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          </View>
          <Text style={styles.upgradeSubtext}>
            Unlock exclusive jobs and features.
          </Text>

          <Pressable
            onPress={onUpgradePress}
            style={({ pressed }) => [
              styles.upgradeBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={['#6d5efc', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtnGrad}
            >
              <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    height: '100%',
    padding: 18,
    borderRightWidth: 1,
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  menuList: {
    flex: 1,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
  },
  menuLabel: {
    fontSize: FontSize.sm,
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  upgradeWrapper: {
    marginTop: 16,
  },
  upgradeCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  upgradeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  upgradeTitle: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  upgradeSubtext: {
    color: '#b3b7dd',
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 15,
  },
  upgradeBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  upgradeBtnGrad: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
