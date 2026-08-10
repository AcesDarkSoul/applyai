import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MatchScoreBar } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { JobMatchScore } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  score?: JobMatchScore | null;
  /** compact = list cards; detail = job page hero score */
  variant?: 'compact' | 'detail';
  /** Start expanded (detail defaults collapsed so tap reveals) */
  defaultExpanded?: boolean;
}

/**
 * Tap the overall score to reveal Skills / Experience / Education / Location / Salary.
 */
export function MatchScoreBreakdown({
  score,
  variant = 'compact',
  defaultExpanded,
}: Props) {
  const expandedDefault = defaultExpanded ?? false;
  const [expanded, setExpanded] = useState(expandedDefault);

  if (!score) return null;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  if (variant === 'compact') {
    return (
      <View style={styles.compactRoot}>
        <View style={styles.compactHeader}>
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              toggle();
            }}
            hitSlop={8}
            style={styles.compactBadge}
            accessibilityRole="button"
            accessibilityLabel={`${score.overall}% match. ${expanded ? 'Hide' : 'Show'} breakdown`}
          >
            <Text style={styles.compactScore}>{score.overall}%</Text>
            <Text style={styles.compactLabel}>{expanded ? 'hide' : 'match'}</Text>
          </Pressable>
        </View>
        {expanded && (
          <View
            style={styles.compactPanel}
            onStartShouldSetResponder={() => true}
          >
            <BreakdownBars score={score} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.detailWrap}>
      <Text style={styles.detailTitle}>AI Match Score</Text>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`${score.overall}% overall. Tap to ${expanded ? 'hide' : 'show'} breakdown`}
        style={styles.overallPress}
      >
        <Text style={styles.overallScore}>{score.overall}%</Text>
        <Text style={styles.tapHint}>
          {expanded
            ? 'Tap to hide breakdown'
            : 'Tap for Skills · Experience · Education · Location · Salary'}
        </Text>
      </Pressable>
      {expanded && (
        <View style={styles.detailBars}>
          <BreakdownBars score={score} />
        </View>
      )}
    </View>
  );
}

function BreakdownBars({ score }: { score: JobMatchScore }) {
  return (
    <>
      <MatchScoreBar label="Skills" score={score.skills || 0} />
      <MatchScoreBar label="Experience" score={score.experience || 0} />
      <MatchScoreBar label="Education" score={score.education || 0} />
      <MatchScoreBar label="Location" score={score.location || 0} />
      <MatchScoreBar label="Salary" score={score.salary || 0} />
    </>
  );
}

const styles = StyleSheet.create({
  compactRoot: { width: '100%' },
  compactHeader: { flexDirection: 'row', justifyContent: 'flex-end' },
  compactBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    minWidth: 52,
  },
  compactScore: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '800' },
  compactLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  compactPanel: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    width: '100%',
  },
  detailWrap: { alignItems: 'center', width: '100%' },
  detailTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  overallPress: { alignItems: 'center', marginBottom: Spacing.sm },
  overallScore: { color: Colors.primary, fontSize: 48, fontWeight: '900' },
  tapHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  detailBars: { width: '100%', marginTop: Spacing.xs },
});
