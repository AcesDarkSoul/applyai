import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { applicationRepository, type AppStats } from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function AnalyticsScreen() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setStats(await applicationRepository.stats());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
        setStats({ total: 0, applied: 0, interviews: 0, offers: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const funnel = [
    { label: 'Saved / tracked', value: stats?.total ?? 0, color: Colors.primary },
    { label: 'Applied', value: stats?.applied ?? 0, color: Colors.secondary },
    { label: 'Interview', value: stats?.interviews ?? 0, color: Colors.info },
    { label: 'Offer', value: stats?.offers ?? 0, color: Colors.warning },
  ];
  const max = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <View style={styles.root}>
<AppTopBar title="Analytics" subtitle="Funnel health at a glance" />
      <Screen safe edges={['left', 'right', 'bottom']}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Funnel health at a glance</Text>
          <Text style={styles.title}>Insights & Analytics</Text>
          <Text style={styles.body}>
            Track how applications move from saved → applied → interview → offer, then improve what
            converts.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Metric label="Total tracked" value={stats?.total ?? 0} icon="pulse-outline" />
            <Metric
              label="Applied"
              value={stats?.applied ?? 0}
              icon="paper-plane-outline"
              color={Colors.secondary}
            />
            <Metric
              label="Interviews"
              value={stats?.interviews ?? 0}
              icon="person-outline"
              color={Colors.info}
            />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Application funnel</Text>
              {funnel.map((f) => (
                <View key={f.label} style={styles.funnelRow}>
                  <Text style={styles.funnelLabel}>{f.label}</Text>
                  <View style={styles.funnelTrack}>
                    <View
                      style={[
                        styles.funnelFill,
                        {
                          width: `${Math.max(6, (f.value / max) * 100)}%` as `${number}%`,
                          backgroundColor: f.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.funnelValue}>{f.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

function Metric({
  label,
  value,
  icon,
  color = Colors.primary,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}) {
  return (
    <View style={styles.metric}>
      <View>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  eyebrow: { color: Colors.textMuted, fontWeight: '700', fontSize: FontSize.xs },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  metricLabel: { color: Colors.textMuted, fontWeight: '600', fontSize: FontSize.sm },
  metricValue: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl, marginTop: 2 },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: 12,
  },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  funnelLabel: { width: 110, color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  funnelTrack: {
    flex: 1,
    height: 10,
    borderRadius: 99,
    backgroundColor: Colors.primaryTintSoft,
    overflow: 'hidden',
  },
  funnelFill: { height: '100%', borderRadius: 99 },
  funnelValue: { width: 28, textAlign: 'right', color: Colors.text, fontWeight: '800' },
  error: { color: Colors.danger, marginBottom: 8 },
});
