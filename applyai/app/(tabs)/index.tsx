import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import {
  applicationRepository,
  jobRepository,
  type ApiApplication,
  type ApiJob,
  type AppStats,
} from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DashboardScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [jobsFound, setJobsFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, today, list] = await Promise.all([
        applicationRepository.stats(),
        jobRepository.today(),
        applicationRepository.list(),
      ]);
      setStats(s);
      setJobsFound(today.length);
      setJobs(today.slice(0, 3));
      setApps(list.slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      // Soft fallback so UI still matches web shell when API is down
      setStats({ total: 0, applied: 0, interviews: 0, offers: 0, coverLetters: 0 });
      setJobs([]);
      setApps([]);
      setJobsFound(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const chartData = useMemo(() => {
    const counts = DAYS.map(() => 0);
    for (const app of apps) {
      const d = new Date(app.updatedAt || app.createdAt || '');
      if (Number.isNaN(d.getTime())) continue;
      const js = d.getDay();
      const idx = js === 0 ? 6 : js - 1;
      counts[idx] += 1;
    }
    const fallback = [1, 4, 0, 0, 0, 0, 0];
    const hasData = counts.some((c) => c > 0);
    return DAYS.map((day, i) => ({ day, value: hasData ? counts[i] : fallback[i] }));
  }, [apps]);

  const maxChart = Math.max(...chartData.map((d) => d.value), 1);
  const firstName = (profile?.name || 'there').split(' ')[0];

  if (loading) {
    return (
      <Screen safe edges={['left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safe edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient
          colors={['rgba(91,92,226,0.22)', 'rgba(15,23,42,0.4)', 'rgba(20,184,166,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>Ready for your next move, {firstName}?</Text>
          <Text style={styles.heroTitle}>Dashboard</Text>
          <Text style={styles.heroBody}>
            Match roles, track applications, and keep cover letters with every apply.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.primaryBtnText}>Find matches</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.ghostBtnText}>Resume Studio</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </FadeInView>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Start backend on :4000 for live web-parity data.</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <Stat label="Jobs Found" value={jobsFound} icon="briefcase-outline" />
        <Stat label="Applications" value={stats?.total ?? 0} icon="send-outline" color={Colors.secondary} />
        <Stat label="Interviews" value={stats?.interviews ?? 0} icon="people-outline" color={Colors.info} />
        <Stat label="Offers" value={stats?.offers ?? 0} icon="trophy-outline" color={Colors.warning} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application Overview</Text>
        <View style={styles.chart}>
          {chartData.map((d) => (
            <View key={d.day} style={styles.chartCol}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBar,
                    { height: `${Math.max(8, (d.value / maxChart) * 100)}%` as `${number}%` },
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Top Job Matches</Text>
          <Pressable onPress={() => router.push('/(tabs)/jobs')} style={styles.linkRow}>
            <Text style={styles.link}>View all</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primaryLight} />
          </Pressable>
        </View>
        {jobs.length === 0 ? (
          <Text style={styles.empty}>No matches yet — upload a resume and search jobs.</Text>
        ) : (
          jobs.map((job) => (
            <Pressable
              key={job.id}
              style={styles.jobRow}
              onPress={() => router.push(`/job/${job.id}`)}
            >
              <View style={styles.jobAvatar}>
                <Text style={styles.jobAvatarText}>{job.company.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.jobMeta}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={styles.jobCompany} numberOfLines={1}>
                  {job.company}
                </Text>
              </View>
              <Text style={styles.match}>{Math.round(job.matchScore ?? 0)}%</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={[styles.card, { marginBottom: Spacing.xl }]}>
        <Text style={styles.cardTitle}>Recent Applications</Text>
        {apps.length === 0 ? (
          <Text style={styles.empty}>No applications yet.</Text>
        ) : (
          apps.map((app) => (
            <View key={app.id} style={styles.appRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                <Text style={styles.jobCompany}>{app.company}</Text>
              </View>
              <View style={styles.statusChip}>
                <Text style={styles.statusText}>{app.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

function Stat({
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
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  hero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  heroEyebrow: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.sm },
  heroTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl, letterSpacing: -0.5 },
  heroBody: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800' },
  ghostBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  ghostBtnText: { color: Colors.text, fontWeight: '700' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.danger, fontWeight: '700' },
  errorHint: { color: Colors.textMuted, marginTop: 4, fontSize: FontSize.xs },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
    ...Shadows.card,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xl },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: FontSize.lg,
    marginBottom: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 8,
  },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBarTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.primaryTintSoft,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chartBar: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  chartLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  link: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  jobAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobAvatarText: { color: Colors.primaryLight, fontWeight: '800' },
  jobMeta: { flex: 1, minWidth: 0 },
  jobTitle: { color: Colors.text, fontWeight: '700' },
  jobCompany: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  match: { color: Colors.primaryLight, fontWeight: '800' },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusChip: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs, textTransform: 'capitalize' },
});
