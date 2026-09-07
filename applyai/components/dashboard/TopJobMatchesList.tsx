import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

export interface JobMatchItem {
  id: string;
  title: string;
  company: string;
  logoLetter: string;
  logoBg: string;
  matchPercent: number;
}

const DEFAULT_MATCHES: JobMatchItem[] = [
  {
    id: '1',
    title: 'Android Developer',
    company: 'Mobibee',
    logoLetter: 'M',
    logoBg: '#1e293b',
    matchPercent: 95,
  },
  {
    id: '2',
    title: 'Mobile Android Developer',
    company: 'TravelLoop',
    logoLetter: 'G',
    logoBg: '#312e81',
    matchPercent: 90,
  },
  {
    id: '3',
    title: 'Kotlin Developer',
    company: 'TechWings',
    logoLetter: 'K',
    logoBg: '#ea580c',
    matchPercent: 88,
  },
  {
    id: '4',
    title: 'Android Engineer',
    company: 'CodeLabs',
    logoLetter: 'O',
    logoBg: '#1e3a8a',
    matchPercent: 86,
  },
];

export function TopJobMatchesList({
  matches = DEFAULT_MATCHES,
  onViewAll,
  onSelectJob,
}: {
  matches?: JobMatchItem[];
  onViewAll?: () => void;
  onSelectJob?: (job: JobMatchItem) => void;
}) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Top Job Matches</Text>
        <Pressable onPress={onViewAll}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
        </Pressable>
      </View>

      {/* Matches List */}
      <View style={styles.listContainer}>
        {matches.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onSelectJob?.(item)}
            style={({ pressed }) => [
              styles.matchRow,
              index < matches.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              },
              pressed && { backgroundColor: colors.primaryTintSoft },
            ]}
          >
            {/* Logo Badge */}
            <View style={[styles.logoBadge, { backgroundColor: item.logoBg }]}>
              <Text style={styles.logoText}>{item.logoLetter}</Text>
            </View>

            {/* Info */}
            <View style={styles.infoCol}>
              <Text numberOfLines={1} style={[styles.jobTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={[styles.companyName, { color: colors.textSecondary }]}>
                {item.company}
              </Text>
            </View>

            {/* Match Percentage Badge */}
            <View style={[styles.matchBadge, { backgroundColor: colors.matchBadgeBg }]}>
              <Text style={[styles.matchText, { color: colors.matchBadgeText }]}>
                {item.matchPercent}% Match
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  listContainer: {
    gap: 4,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  companyName: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
