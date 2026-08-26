import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

export interface StatItem {
  id: string;
  title: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}

export function DashboardStatsGrid({ stats }: { stats?: StatItem[] }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const defaultStats: StatItem[] = [
    {
      id: 'jobs',
      title: 'Jobs Found',
      value: 14,
      trend: '↑ 3 this week',
      trendUp: true,
      icon: 'briefcase',
      iconBg: 'rgba(109, 94, 252, 0.15)',
      iconColor: '#8a77ff',
    },
    {
      id: 'apps',
      title: 'Applications',
      value: 0,
      trend: 'No change',
      trendUp: false,
      icon: 'document-text',
      iconBg: 'rgba(34, 197, 94, 0.15)',
      iconColor: '#22c55e',
    },
    {
      id: 'interviews',
      title: 'Interviews',
      value: 0,
      trend: 'No change',
      trendUp: false,
      icon: 'calendar',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3b82f6',
    },
    {
      id: 'offers',
      title: 'Offers',
      value: 0,
      trend: 'No change',
      trendUp: false,
      icon: 'trophy',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#f59e0b',
    },
  ];

  const items = stats || defaultStats;

  return (
    <View style={styles.gridContainer}>
      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.card,
            isMobile && styles.cardMobile,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              isMobile && styles.iconWrapperMobile,
              { backgroundColor: item.iconBg },
            ]}
          >
            <Ionicons name={item.icon} size={isMobile ? 18 : 22} color={item.iconColor} />
          </View>
          <View style={styles.infoWrapper}>
            <Text style={[styles.valueText, isMobile && styles.valueTextMobile, { color: colors.text }]}>
              {item.value}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.titleText, isMobile && styles.titleTextMobile, { color: colors.textSecondary }]}
            >
              {item.title}
            </Text>
            {item.trend && (
              <Text
                numberOfLines={1}
                style={[
                  styles.trendText,
                  isMobile && styles.trendTextMobile,
                  { color: item.trendUp ? '#22c55e' : colors.textMuted },
                ]}
              >
                {item.trend}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  card: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  cardMobile: {
    minWidth: '47%',
    maxWidth: '48.5%',
    padding: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapperMobile: {
    width: 36,
    height: 36,
    marginRight: 8,
    borderRadius: BorderRadius.sm,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  valueText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    lineHeight: 26,
  },
  valueTextMobile: {
    fontSize: FontSize.lg,
    lineHeight: 22,
  },
  titleText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  titleTextMobile: {
    fontSize: 11,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  trendTextMobile: {
    fontSize: 9,
  },
});
