import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDistanceToNow } from 'date-fns';
import { FadeInView } from '@/components/AnimatedView';
import { LineChart } from '@/components/dashboard/LineChart';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { ensureApiToken } from '@/lib/api/client';
import {
  applicationRepository,
  jobRepository,
  type ApiApplication,
  type ApiJob,
  type AppStats,
} from '@/lib/api/repositories';
import { calculateProfileCompleteness } from '@/lib/profileCompleteness';
import { SHELL_FONT, getShellPalette, webShadow } from '@/components/layout/shellTheme';
import { useThemeMode } from '@/hooks/useColors';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HERO_ART = require('../../assets/images/hero-character.png');
const CALENDAR_ART = require('../../assets/images/calendar-empty.png');
const LOGO_COLORS = ['#4F46E5', '#0EA5E9', '#F59E0B', '#10B981', '#EC4899'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function timeAgo(value?: string) {
  if (!value) return 'Recently';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Recently';
  return formatDistanceToNow(d, { addSuffix: true }).replace('about ', '');
}

function jobType(job: ApiJob) {
  const raw = (job.employmentType || 'Full Time').replace('-', ' ');
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardScreen() {
  const router = useRouter();
  const { isDark } = useThemeMode();
  const p = getShellPalette(isDark);
  const { width } = useWindowDimensions();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const hasResume = useResumeStore((s) => s.hasResume);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [jobsFound, setJobsFound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const firstName = (profile?.name || user?.displayName || 'there').split(' ')[0];
  const completeness = calculateProfileCompleteness(profile, hasResume);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await ensureApiToken();
      const [s, today, list] = await Promise.all([
        applicationRepository.stats(),
        jobRepository.today(),
        applicationRepository.list(),
      ]);
      setStats(s);
      setJobsFound(today.length);
      setJobs(today.slice(0, 6));
      setApps(list.slice(0, 14));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      setStats({ total: 0, applied: 0, interviews: 0, offers: 0, coverLetters: 0 });
      setJobs([]);
      setApps([]);
      setJobsFound(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      counts[js === 0 ? 6 : js - 1] += 1;
    }
    const hasData = counts.some((c) => c > 0);
    const values = hasData ? counts : [4, 12, 7, 9, 6, 3, 5];
    return DAYS.map((day, i) => ({ day, value: values[i] }));
  }, [apps]);

  const matches = jobs.slice(0, 4);
  const recs = jobs.slice(0, 3);
  const cardShadow = webShadow(isDark ? '0 10px 28px rgba(0,0,0,0.35)' : '0 10px 28px rgba(40,44,90,0.07)');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={p.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.page }}
      contentContainerStyle={[styles.page, !isDesktop && styles.pageCompact]}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      <FadeInView direction="down">
        <LinearGradient colors={[...p.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={[styles.heroCopy, isDesktop && { flex: 1.15 }]}>
            <Text style={styles.heroGreet}>
              {greeting()}, {firstName}! 👋
            </Text>
            <Text style={[styles.heroTitle, width < 400 && { fontSize: 26, lineHeight: 32 }]}>
              Find your dream job today!
            </Text>
            <Text style={styles.heroSub}>Explore thousands of opportunities and build your future.</Text>
            <View style={[styles.heroActions, width < 420 && { flexDirection: 'column' }]}>
              <Pressable style={styles.heroPrimary} onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={[styles.heroPrimaryText, { color: isDark ? '#fff' : p.primary }]}>Find Jobs</Text>
              </Pressable>
              <Pressable style={styles.heroGhost} onPress={() => router.push('/resume/upload')}>
                <Text style={styles.heroGhostText}>Upload Resume</Text>
              </Pressable>
            </View>
          </View>

          {(isDesktop || isTablet) && (
            <Image source={HERO_ART} style={styles.heroArt} resizeMode="contain" />
          )}

          <View style={[styles.strength, { backgroundColor: isDark ? 'rgba(11,16,32,0.92)' : '#fff' }, cardShadow]}>
            <Text style={[styles.strengthLabel, { color: p.muted }]}>Profile Strength</Text>
            <ProgressRing
              percent={completeness || 85}
              fillColor={p.primary}
              trackColor={isDark ? 'rgba(109,94,252,0.22)' : '#E8E4FF'}
              textColor={p.text}
            />
            <Text style={[styles.strengthMsg, { color: p.text }]}>
              {completeness >= 80 ? 'Great! Keep it up.' : 'Add a few details to stand out.'}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/profile')}>
              <Text style={[styles.strengthLink, { color: p.primary }]}>Improve Profile</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={[styles.stats, isDesktop ? styles.statsRow : styles.statsGrid]}>
          <StatCard
            label="Jobs Found"
            value={jobsFound}
            icon="briefcase"
            tint="#EDEBFF"
            iconColor="#6D5EFC"
            trend={jobsFound > 0 ? `+${Math.min(jobsFound, 3)} this week` : 'No change'}
            trendUp={jobsFound > 0}
            palette={p}
            shadow={cardShadow}
          />
          <StatCard
            label="Applications"
            value={stats?.total ?? 0}
            icon="document-text"
            tint="#E7F8F0"
            iconColor="#16A34A"
            trend={(stats?.total ?? 0) > 0 ? 'Active this week' : 'No change'}
            trendUp={(stats?.total ?? 0) > 0}
            palette={p}
            shadow={cardShadow}
          />
          <StatCard
            label="Interviews"
            value={stats?.interviews ?? 0}
            icon="calendar"
            tint="#EEE9FF"
            iconColor="#7C3AED"
            trend={(stats?.interviews ?? 0) > 0 ? 'Coming up' : 'No change'}
            trendUp={(stats?.interviews ?? 0) > 0}
            palette={p}
            shadow={cardShadow}
          />
          <StatCard
            label="Offers"
            value={stats?.offers ?? 0}
            icon="trophy"
            tint="#FFF4E0"
            iconColor="#F59E0B"
            trend={(stats?.offers ?? 0) > 0 ? 'New offer' : 'No change'}
            trendUp={(stats?.offers ?? 0) > 0}
            palette={p}
            shadow={cardShadow}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.mid, isDesktop ? styles.midRow : styles.midStack]}>
          <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border, flex: 1.7 }, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: p.text }]}>Application Overview</Text>
              <View style={[styles.chip, { borderColor: p.border }]}>
                <Text style={[styles.chipText, { color: p.muted }]}>This Week</Text>
                <Ionicons name="chevron-down" size={12} color={p.muted} />
              </View>
            </View>
            <LineChart data={chartData} labelColor={p.muted} lineColor={p.primary} />
          </View>

          <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border, flex: 1 }, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: p.text }]}>Top Job Matches</Text>
              <Pressable onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={[styles.link, { color: p.primary }]}>View all matches</Text>
              </Pressable>
            </View>
            {matches.length === 0 ? (
              <Text style={[styles.empty, { color: p.muted }]}>Upload your resume to see tailored matches.</Text>
            ) : (
              matches.map((job, i) => (
                <Pressable
                  key={job.id}
                  style={[styles.matchRow, { backgroundColor: p.cardAlt }]}
                  onPress={() => router.push(`/job/${job.id}`)}
                >
                  <View style={[styles.logo, { backgroundColor: LOGO_COLORS[i % LOGO_COLORS.length] }]}>
                    <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.jobTitle, { color: p.text }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[styles.jobMeta, { color: p.muted }]} numberOfLines={1}>
                      {job.company}
                    </Text>
                  </View>
                  <View style={styles.matchPill}>
                    <Text style={styles.matchPillText}>{Math.round(job.matchScore ?? 0)}% Match</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>

        <View style={[styles.mid, isDesktop ? styles.midRow : styles.midStack]}>
          <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border, flex: 1.7 }, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: p.text }]}>Recent Job Recommendations</Text>
              <Pressable onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={[styles.link, { color: p.primary }]}>View all jobs →</Text>
              </Pressable>
            </View>
            {recs.length === 0 ? (
              <Text style={[styles.empty, { color: p.muted }]}>No recommendations yet.</Text>
            ) : (
              recs.map((job, i) => (
                <Pressable
                  key={job.id}
                  style={[styles.recRow, { borderColor: p.border }]}
                  onPress={() => router.push(`/job/${job.id}`)}
                >
                  <View style={[styles.logoLg, { backgroundColor: LOGO_COLORS[i % LOGO_COLORS.length] }]}>
                    <Text style={styles.logoText}>{job.company.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.jobTitle, { color: p.text }]} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <Text style={[styles.jobMeta, { color: p.muted }]} numberOfLines={1}>
                      {job.company}
                      {job.location ? `  ·  ${job.location}` : ''}
                    </Text>
                    <View style={styles.recTags}>
                      <View style={[styles.typeChip, { backgroundColor: isDark ? 'rgba(109,94,252,0.18)' : '#EEEBFF' }]}>
                        <Text style={[styles.typeChipText, { color: p.primary }]}>{jobType(job)}</Text>
                      </View>
                      {job.salary ? (
                        <Text style={[styles.salary, { color: p.text }]}>{job.salary}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 10 }}>
                    <Text style={[styles.ago, { color: p.muted }]}>{timeAgo(job.postedAt)}</Text>
                    <Ionicons name="bookmark-outline" size={16} color={p.muted} />
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border, flex: 1 }, cardShadow]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: p.text }]}>Upcoming Interviews</Text>
            </View>
            <View style={styles.emptyState}>
              <Image source={CALENDAR_ART} style={styles.calendarArt} resizeMode="contain" />
              <Text style={[styles.emptyTitle, { color: p.text }]}>No upcoming interviews</Text>
              <Text style={[styles.emptyBody, { color: p.muted }]}>
                Your scheduled interviews will appear here.
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
  tint,
  iconColor,
  trend,
  trendUp,
  palette,
  shadow,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  trend: string;
  trendUp: boolean;
  palette: ReturnType<typeof getShellPalette>;
  shadow: object;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: palette.card, borderColor: palette.border }, shadow]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.statTrend, { color: trendUp ? palette.success : palette.muted }]}>{trend}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 6,
    gap: 16,
  },
  pageCompact: { paddingHorizontal: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  hero: {
    borderRadius: 24,
    padding: 22,
    minHeight: 220,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  heroCopy: { minWidth: 220, flexGrow: 1 },
  heroGreet: { color: '#fff', fontFamily: SHELL_FONT, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  heroTitle: {
    color: '#fff',
    fontFamily: SHELL_FONT,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: SHELL_FONT,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 420,
  },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroPrimary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  heroPrimaryText: { fontFamily: SHELL_FONT, fontWeight: '800', fontSize: 14 },
  heroGhost: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
  },
  heroGhostText: { color: '#fff', fontFamily: SHELL_FONT, fontWeight: '800', fontSize: 14 },
  heroArt: { width: 180, height: 160 },
  strength: {
    width: 168,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  strengthLabel: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '700' },
  strengthMsg: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  strengthLink: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '800', marginTop: 2 },
  stats: { gap: 12 },
  statsRow: { flexDirection: 'row' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: {
    flexGrow: 1,
    flexBasis: 150,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontFamily: SHELL_FONT, fontSize: 26, fontWeight: '800' },
  statLabel: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '700', marginTop: 2 },
  statTrend: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '700', marginTop: 6 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: '#ef4444', fontWeight: '700', fontFamily: SHELL_FONT },
  mid: { gap: 14 },
  midRow: { flexDirection: 'row', alignItems: 'stretch' },
  midStack: { flexDirection: 'column' },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minWidth: 0,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: { fontFamily: SHELL_FONT, fontSize: 17, fontWeight: '800' },
  link: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '800' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '700' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  logo: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoLg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800', fontFamily: SHELL_FONT },
  jobTitle: { fontFamily: SHELL_FONT, fontSize: 13, fontWeight: '800' },
  jobMeta: { fontFamily: SHELL_FONT, fontSize: 11, marginTop: 2, fontWeight: '600' },
  matchPill: {
    backgroundColor: 'rgba(22,163,74,0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchPillText: { color: '#16A34A', fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '800' },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  typeChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  typeChipText: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '800' },
  salary: { fontFamily: SHELL_FONT, fontSize: 12, fontWeight: '800' },
  ago: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '700' },
  empty: { fontFamily: SHELL_FONT, fontSize: 13, lineHeight: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, minHeight: 210 },
  calendarArt: { width: 92, height: 92, marginBottom: 8 },
  emptyTitle: { fontFamily: SHELL_FONT, fontSize: 16, fontWeight: '800', marginTop: 4 },
  emptyBody: { fontFamily: SHELL_FONT, fontSize: 12, textAlign: 'center', marginTop: 6, maxWidth: 200, lineHeight: 18 },
});
