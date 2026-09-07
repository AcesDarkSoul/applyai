import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';
import type { ApiApplication } from '@/lib/api/repositories';

type Props = {
  interviews?: ApiApplication[];
};

export function UpcomingInterviewsCard({ interviews = [] }: Props) {
  const colors = useColors();
  const router = useRouter();
  const items = interviews.slice(0, 4);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Upcoming Interviews</Text>

      {items.length === 0 ? (
        <View style={styles.contentContainer}>
          <View style={styles.svgWrapper}>
            <Svg width={110} height={100} viewBox="0 0 110 100">
              <Defs>
                <LinearGradient id="calHeader" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#3b82f6" />
                  <Stop offset="1" stopColor="#1d4ed8" />
                </LinearGradient>
                <LinearGradient id="clockBg" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#a78bfa" />
                  <Stop offset="1" stopColor="#6d5efc" />
                </LinearGradient>
              </Defs>
              <Rect x="20" y="25" width="70" height="60" rx="12" fill="rgba(0,0,0,0.15)" />
              <Rect x="15" y="20" width="70" height="60" rx="12" fill="#ffffff" />
              <Rect x="15" y="20" width="70" height="20" rx="12" fill="url(#calHeader)" />
              <Rect x="30" y="14" width="6" height="12" rx="3" fill="#cbd5e1" />
              <Rect x="64" y="14" width="6" height="12" rx="3" fill="#cbd5e1" />
              <Circle cx="32" cy="50" r="3" fill="#94a3b8" />
              <Circle cx="50" cy="50" r="3" fill="#94a3b8" />
              <Circle cx="68" cy="50" r="3" fill="#94a3b8" />
              <Circle cx="32" cy="64" r="3" fill="#94a3b8" />
              <Circle cx="50" cy="64" r="4" fill="#3b82f6" />
              <Circle cx="68" cy="64" r="3" fill="#94a3b8" />
              <Circle cx="76" cy="72" r="16" fill="url(#clockBg)" />
              <Circle cx="76" cy="72" r="13" fill="#ffffff" />
              <Path d="M 76 64 L 76 72 L 82 72" stroke="#6d5efc" strokeWidth="2" strokeLinecap="round" />
              <Circle cx="16" cy="18" r="4" fill="#a78bfa" opacity="0.8" />
            </Svg>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming interviews</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Applications in Interview or Offer status appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((app) => (
            <Pressable
              key={app.id}
              style={[styles.row, { borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/applications')}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                  {app.jobTitle}
                </Text>
                <Text style={[styles.company, { color: colors.textSecondary }]} numberOfLines={1}>
                  {app.company}
                </Text>
              </View>
              <Text style={[styles.status, { color: colors.primary }]}>
                {(app.status || 'interview').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
    height: '100%',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  svgWrapper: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  list: { marginTop: 12, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  jobTitle: { fontSize: FontSize.sm, fontWeight: '700' },
  company: { fontSize: FontSize.xs, marginTop: 2 },
  status: { fontSize: FontSize.xs, fontWeight: '800' },
});
