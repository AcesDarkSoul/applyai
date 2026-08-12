import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '@/components/ui';
import { AnimatedProgress } from '@/components/AnimatedView';
import { getOnboardingProgress, type OnboardingStep } from '@/lib/onboarding';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface Props {
  steps: OnboardingStep[];
}

export function OnboardingChecklist({ steps }: Props) {
  const router = useRouter();
  const progress = getOnboardingProgress(steps);

  if (progress.allDone) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Getting started</Text>
          <Text style={styles.subtitle}>
            {progress.completed} of {progress.total} steps · PRD journey
          </Text>
        </View>
        <Text style={styles.percent}>{progress.percent}%</Text>
      </View>
      <AnimatedProgress progress={progress.percent} color={Colors.primary} height={8} />

      <View style={styles.list}>
        {steps.map((step, index) => {
          const isNext = progress.next?.id === step.id;
          return (
            <Pressable
              key={step.id}
              disabled={step.done}
              onPress={() => router.push(step.href as never)}
              style={({ pressed }) => [
                styles.row,
                isNext && styles.rowNext,
                pressed && !step.done && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: step.done, checked: step.done }}
              accessibilityLabel={`${step.title}. ${step.done ? 'Completed' : step.subtitle}`}
            >
              <View
                style={[
                  styles.check,
                  step.done && styles.checkDone,
                  isNext && !step.done && styles.checkNext,
                ]}
              >
                {step.done ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Text style={[styles.stepNum, isNext && styles.stepNumNext]}>{index + 1}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>
                  {step.title}
                </Text>
                <Text style={styles.stepSub}>{step.subtitle}</Text>
              </View>
              {!step.done && (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isNext ? Colors.primary : Colors.textMuted}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  percent: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: '800' },
  list: { marginTop: Spacing.md, gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  rowNext: { backgroundColor: Colors.primary + '10' },
  pressed: { opacity: 0.85 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  checkDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkNext: { borderColor: Colors.primary },
  stepNum: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  stepNumNext: { color: Colors.primary },
  stepTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700' },
  stepTitleDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  stepSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
});
