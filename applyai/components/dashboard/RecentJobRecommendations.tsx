import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

export interface RecommendedJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  postedTime: string;
  logoLetter: string;
  logoBg: string;
}

const DEFAULT_RECOMMENDATIONS: RecommendedJobItem[] = [
  {
    id: 'r1',
    title: 'Android Developer',
    company: 'Mobibee',
    location: 'Ahmedabad, India',
    type: 'Full Time',
    salary: '₹ 8 - 12 LPA',
    postedTime: '2h ago',
    logoLetter: 'M',
    logoBg: '#312e81',
  },
  {
    id: 'r2',
    title: 'Kotlin Developer',
    company: 'TechWings',
    location: 'Bangalore, India',
    type: 'Full Time',
    salary: '₹ 10 - 16 LPA',
    postedTime: '5h ago',
    logoLetter: 'K',
    logoBg: '#854d0e',
  },
  {
    id: 'r3',
    title: 'Android Engineer',
    company: 'CodeLabs',
    location: 'Pune, India',
    type: 'Full Time',
    salary: '₹ 9 - 14 LPA',
    postedTime: '1d ago',
    logoLetter: 'O',
    logoBg: '#1e3a8a',
  },
];

export function RecentJobRecommendations({
  jobs = DEFAULT_RECOMMENDATIONS,
  onViewAll,
  onSelectJob,
}: {
  jobs?: RecommendedJobItem[];
  onViewAll?: () => void;
  onSelectJob?: (job: RecommendedJobItem) => void;
}) {
  const colors = useColors();
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  const toggleSave = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Recent Job Recommendations</Text>
        <Pressable onPress={onViewAll} style={styles.viewAllRow}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>View all jobs</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      </View>

      {/* Horizontal Scroll Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {jobs.map((item) => {
          const isSaved = savedIds[item.id];
          return (
            <View
              key={item.id}
              style={[
                styles.jobCard,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              {/* Top row: Logo + Info */}
              <View style={styles.cardHeader}>
                <View style={[styles.logoBadge, { backgroundColor: item.logoBg }]}>
                  <Text style={styles.logoText}>{item.logoLetter}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text numberOfLines={1} style={[styles.jobTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.companyText, { color: colors.textSecondary }]}>
                    {item.company}
                  </Text>
                  <Text numberOfLines={1} style={[styles.locationText, { color: colors.textMuted }]}>
                    {item.location}
                  </Text>
                </View>
              </View>

              {/* Tags row */}
              <View style={styles.tagsRow}>
                <View style={[styles.pillTag, { backgroundColor: colors.primaryTint }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>{item.type}</Text>
                </View>
                <View style={[styles.pillTag, { backgroundColor: colors.primaryTintSoft }]}>
                  <Text style={[styles.pillText, { color: colors.textSecondary }]}>{item.salary}</Text>
                </View>
              </View>

              {/* Card Footer: Time + Bookmark */}
              <View style={styles.cardFooter}>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{item.postedTime}</Text>
                <Pressable onPress={() => toggleSave(item.id)} hitSlop={8}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={isSaved ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    marginBottom: 14,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 8,
  },
  jobCard: {
    width: 220,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  companyText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  locationText: {
    fontSize: 10,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  pillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  timeText: {
    fontSize: 10,
  },
});
