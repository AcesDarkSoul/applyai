import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

export function UpcomingInterviewsCard() {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Upcoming Interviews</Text>

      <View style={styles.contentContainer}>
        {/* 3D Calendar Graphics */}
        <View style={styles.svgWrapper}>
          <Svg width={110} height={100} viewBox="0 0 110 100">
            <Defs>
              <LinearGradient id="calBg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#60a5fa" />
                <Stop offset="1" stopColor="#3b82f6" />
              </LinearGradient>
              <LinearGradient id="calHeader" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#3b82f6" />
                <Stop offset="1" stopColor="#1d4ed8" />
              </LinearGradient>
              <LinearGradient id="clockBg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#a78bfa" />
                <Stop offset="1" stopColor="#6d5efc" />
              </LinearGradient>
            </Defs>

            {/* Calendar shadow */}
            <Rect x="20" y="25" width="70" height="60" rx="12" fill="rgba(0,0,0,0.15)" />

            {/* Calendar Main Card */}
            <Rect x="15" y="20" width="70" height="60" rx="12" fill="#ffffff" />
            <Rect x="15" y="20" width="70" height="20" rx="12" fill="url(#calHeader)" />

            {/* Binder Rings */}
            <Rect x="30" y="14" width="6" height="12" rx="3" fill="#cbd5e1" />
            <Rect x="64" y="14" width="6" height="12" rx="3" fill="#cbd5e1" />

            {/* Calendar Grid dots */}
            <Circle cx="32" cy="50" r="3" fill="#94a3b8" />
            <Circle cx="50" cy="50" r="3" fill="#94a3b8" />
            <Circle cx="68" cy="50" r="3" fill="#94a3b8" />
            <Circle cx="32" cy="64" r="3" fill="#94a3b8" />
            <Circle cx="50" cy="64" r="4" fill="#3b82f6" />
            <Circle cx="68" cy="64" r="3" fill="#94a3b8" />

            {/* 3D Clock Badge overlay */}
            <Circle cx="76" cy="72" r="16" fill="url(#clockBg)" />
            <Circle cx="76" cy="72" r="13" fill="#ffffff" />
            {/* Clock hands */}
            <Path d="M 76 64 L 76 72 L 82 72" stroke="#6d5efc" strokeWidth="2" strokeLinecap="round" />

            {/* Sparkle Floating Dot */}
            <Circle cx="16" cy="18" r="4" fill="#a78bfa" opacity="0.8" />
          </Svg>
        </View>

        <Text style={[styles.emptyTitle, { color: colors.text }]}>No upcoming interviews</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Your scheduled interviews will appear here.
        </Text>
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
});
