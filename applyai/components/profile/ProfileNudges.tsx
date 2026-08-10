import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '@/components/ui';
import type { ProfileGap } from '@/lib/profileCompleteness';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface Props {
  gaps: ProfileGap[];
  completeness: number;
  /** If set, called instead of default navigation (e.g. open edit on Profile). */
  onNudgePress?: (gap: ProfileGap) => void;
}

export function ProfileNudges({ gaps, completeness, onNudgePress }: Props) {
  const router = useRouter();

  if (gaps.length === 0 || completeness >= 100) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={18} color={Colors.secondaryDark} />
        <Text style={styles.title}>Improve your matches</Text>
      </View>
      <Text style={styles.lead}>
        Profile strength {completeness}%. Fix these to raise AI match scores.
      </Text>
      <View style={styles.list}>
        {gaps.map((gap) => (
          <Pressable
            key={gap.id}
            onPress={() => {
              if (onNudgePress) onNudgePress(gap);
              else router.push(gap.href as never);
            }}
            style={({ pressed }) => [styles.nudge, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={gap.nudge}
          >
            <View style={styles.nudgeIcon}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.nudgeText}>{gap.nudge}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md, borderColor: Colors.secondary + '55', borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.xs },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  lead: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  list: { gap: Spacing.xs },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  pressed: { opacity: 0.88 },
  nudgeIcon: { width: 24, alignItems: 'center' },
  nudgeText: { flex: 1, color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
});
