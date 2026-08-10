import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, Badge, PlatformBadge, useResponsive } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { MatchScoreBreakdown } from '@/components/jobs/MatchScoreBreakdown';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { useAuthStore } from '@/stores/authStore';
import { searchJobs } from '@/lib/services/jobs';
import { detectPlatform, getPlatformConfig } from '@/lib/services/platforms';
import {
  getSavedJobIds,
  listSavedJobs,
  toggleSaveJob,
  type SavedJob,
} from '@/lib/firebase/savedJobs';
import { formatFirebaseError } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job } from '@/types';

const PLATFORM_FILTERS = [
  { key: 'all', label: 'All', icon: '🌐' },
  { key: 'saved', label: 'Saved', icon: '🔖' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'indeed', label: 'Indeed', icon: '🔍' },
  { key: 'naukri', label: 'Naukri', icon: '🇮🇳' },
] as const;

function savedToJob(s: SavedJob): Job {
  return {
    id: s.jobId,
    title: s.title,
    company: s.company,
    location: s.location,
    salary: s.salary,
    employmentType: s.employmentType || 'full-time',
    remote: Boolean(s.remote),
    description: '',
    requirements: [],
    skills: [],
    url: s.url,
    source: s.source,
    postedAt: s.savedAt,
    matchScore: s.matchScore,
  };
}

export default function JobsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { isTablet } = useResponsive();
  const [query, setQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const refreshSavedIds = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    try {
      setSavedIds(await getSavedJobIds(user.uid));
    } catch {
      /* ignore */
    }
  }, [user]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      if (platformFilter === 'saved') {
        if (!user) {
          setJobs([]);
          return;
        }
        const saved = await listSavedJobs(user.uid);
        let result = saved.map(savedToJob);
        if (query.trim()) {
          const q = query.trim().toLowerCase();
          result = result.filter(
            (j) =>
              j.title.toLowerCase().includes(q) ||
              j.company.toLowerCase().includes(q) ||
              j.location.toLowerCase().includes(q)
          );
        }
        if (remoteOnly) result = result.filter((j) => j.remote);
        setJobs(result);
        setSavedIds(new Set(saved.map((s) => s.jobId)));
        return;
      }

      let result = await searchJobs(
        { query: query || undefined, remote: remoteOnly || undefined },
        profile?.skills || []
      );
      if (platformFilter !== 'all') {
        result = result.filter((j) => detectPlatform(j.url, j.source) === platformFilter);
      }
      setJobs(result);
    } catch {
      console.warn('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [query, remoteOnly, platformFilter, profile?.skills, user]);

  useEffect(() => {
    const timeout = setTimeout(loadJobs, 400);
    return () => clearTimeout(timeout);
  }, [loadJobs]);

  useFocusEffect(
    useCallback(() => {
      refreshSavedIds();
    }, [refreshSavedIds])
  );

  const handleToggleSave = async (job: Job) => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to save jobs to your shortlist.');
      return;
    }
    const currentlySaved = savedIds.has(job.id);
    setSavingId(job.id);
    try {
      const next = await toggleSaveJob(user.uid, job, currentlySaved);
      setSavedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(job.id);
        else copy.delete(job.id);
        return copy;
      });
      if (platformFilter === 'saved' && !next) {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
      }
    } catch (e) {
      Alert.alert('Error', formatFirebaseError(e));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Screen safe={false} edges={['left', 'right']} scroll={false}>
      <View style={styles.searchSection}>
        <FadeInView direction="down">
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search jobs, companies, skills..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </FadeInView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {PLATFORM_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, platformFilter === f.key && styles.filterChipActive]}
              onPress={() => setPlatformFilter(f.key)}
            >
              <Text style={[styles.filterText, platformFilter === f.key && styles.filterTextActive]}>
                {f.icon} {f.label}
                {f.key === 'saved' && savedIds.size > 0 ? ` (${savedIds.size})` : ''}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.filterChip, remoteOnly && styles.filterChipActive]}
            onPress={() => setRemoteOnly(!remoteOnly)}
          >
            <Text style={[styles.filterText, remoteOnly && styles.filterTextActive]}>🌐 Remote</Text>
          </Pressable>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {platformFilter === 'saved' ? 'Loading shortlist...' : 'Finding jobs for you...'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultCount}>
            {platformFilter === 'saved'
              ? `${jobs.length} saved ${jobs.length === 1 ? 'job' : 'jobs'}`
              : `${jobs.length} jobs found`}
          </Text>
          {platformFilter === 'saved' && jobs.length === 0 && (
            <Text style={styles.emptySaved}>
              No shortlisted jobs yet. Tap the bookmark on any role to save it for later.
            </Text>
          )}
          <ResponsiveGrid>
            {jobs.map((job, i) => {
              const platform = detectPlatform(job.url, job.source);
              const pConfig = getPlatformConfig(platform);
              const isSaved = savedIds.has(job.id);
              return (
                <FadeInView key={job.id} direction="up" delay={Math.min(i * 40, 400)}>
                  <Card style={styles.jobCard} onPress={() => router.push(`/job/${job.id}`)}>
                    <View style={styles.jobHeader}>
                      <View style={[styles.companyLogo, { backgroundColor: pConfig.color }]}>
                        <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle} numberOfLines={isTablet ? 2 : 1}>
                          {job.title}
                        </Text>
                        <Text style={styles.jobCompany}>{job.company}</Text>
                      </View>
                      <SaveJobButton
                        saved={isSaved}
                        loading={savingId === job.id}
                        onPress={() => handleToggleSave(job)}
                      />
                    </View>
                    <MatchScoreBreakdown score={job.matchScore} variant="compact" />
                    <View style={styles.tags}>
                      <PlatformBadge platform={pConfig.name} color={pConfig.color} icon={pConfig.icon} />
                      {job.remote && (
                        <Badge
                          text="Remote"
                          backgroundColor={Colors.secondary + '30'}
                          color={Colors.secondaryDark}
                        />
                      )}
                      {job.salary && (
                        <Badge
                          text={job.salary}
                          backgroundColor={Colors.primary + '15'}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                    <Text style={styles.location}>📍 {job.location}</Text>
                    {job.description ? (
                      <Text style={styles.description} numberOfLines={isTablet ? 4 : 2}>
                        {job.description}
                      </Text>
                    ) : null}
                  </Card>
                </FadeInView>
              );
            })}
          </ResponsiveGrid>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchSection: { paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  filters: { marginBottom: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  filterTextActive: { color: Colors.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.md },
  list: { paddingBottom: Spacing.xxl },
  resultCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  emptySaved: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  jobCard: { marginBottom: Spacing.md },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  jobCompany: { color: Colors.textSecondary, fontSize: FontSize.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  location: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  description: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
});
