import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Badge, SectionHeader } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore, userHasResume } from '@/stores/resumeStore';
import { ensureApiToken } from '@/lib/api/client';
import {
  applicationRepository,
  jobRepository,
  type ApiApplication,
  type ApiJob,
} from '@/lib/api/repositories';
import { detectPlatform, getPlatformConfig, shareOnLinkedIn } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius, PlatformConfig } from '@/constants/theme';

type DupKind = 'job' | 'company';

function findLocalDuplicate(
  applications: ApiApplication[],
  job: ApiJob
): { kind: DupKind; label: string } | null {
  const active = applications.filter((a) => {
    const s = (a.status || '').toLowerCase();
    return !['rejected'].includes(s);
  });
  if (active.some((a) => a.jobId === job.id)) {
    return { kind: 'job', label: 'Applied' };
  }
  const company = job.company.trim().toLowerCase();
  if (!company) return null;
  if (active.some((a) => a.company.trim().toLowerCase() === company)) {
    return { kind: 'company', label: 'Same company' };
  }
  return null;
}

async function confirmDuplicate(jobId: string): Promise<boolean> {
  try {
    const dup = await applicationRepository.checkDuplicate(jobId);
    if (!dup.duplicate) return true;
    return await new Promise<boolean>((resolve) => {
      Alert.alert('Possible duplicate', dup.message || 'You may have applied already.', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Apply anyway', onPress: () => resolve(true) },
      ]);
    });
  } catch {
    return true;
  }
}

export default function SmartApplyScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { hasResume } = useResumeStore();
  const hasResumeSaved = userHasResume(hasResume, profile?.hasResume);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureApiToken();
      const [board, apps] = await Promise.all([
        jobRepository.board('', { minScore: 40 }),
        applicationRepository.list(),
      ]);
      setJobs(board.slice(0, 20));
      setApplications(apps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const filteredJobs =
    selectedPlatform === 'all'
      ? jobs
      : jobs.filter((j) => detectPlatform(j.applyUrl || '', j.source) === selectedPlatform);

  const handleSmartApply = async (job: ApiJob) => {
    const ok = await confirmDuplicate(job.id);
    if (!ok) return;

    setApplyingId(job.id);
    try {
      const res = await applicationRepository.smartApply(job.id, {
        acknowledgeDuplicate: true,
      });
      const applyUrl = res.applyUrl || job.applyUrl;
      if (applyUrl) await Linking.openURL(applyUrl);
      const apps = await applicationRepository.list();
      setApplications(apps);
      const platform = detectPlatform(applyUrl || '', job.source);
      Alert.alert(
        'Smart Apply ready',
        res.complianceNote ||
          `Opening ${getPlatformConfig(platform).name} to complete your application.`
      );
    } catch (e) {
      Alert.alert('Smart Apply failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setApplyingId(null);
    }
  };

  const handleShareLinkedIn = async (job: ApiJob) => {
    await shareOnLinkedIn(
      {
        title: job.title,
        company: job.company,
        location: job.location || '',
        salary: job.salary,
        url: job.applyUrl || '',
        remote: Boolean(job.isRemote),
      },
      profile || undefined
    );
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.hero}>
          <Text style={styles.heroTitle}>⚡ Smart Apply</Text>
          <Text style={styles.heroSubtitle}>
            Apply on LinkedIn, Indeed & Naukri with one tap. Your resume and profile are ready to go.
          </Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <SectionHeader title="Choose Platform" subtitle="Filter jobs by portal" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformFilters}>
          <Button
            title="All"
            size="sm"
            variant={selectedPlatform === 'all' ? 'primary' : 'outline'}
            onPress={() => setSelectedPlatform('all')}
            style={styles.platformBtn}
          />
          {(['linkedin', 'indeed', 'naukri'] as const).map((key) => {
            const p = PlatformConfig[key];
            return (
              <Button
                key={key}
                title={`${p.icon} ${p.name}`}
                size="sm"
                variant={selectedPlatform === key ? 'primary' : 'outline'}
                onPress={() => setSelectedPlatform(key)}
                style={styles.platformBtn}
              />
            );
          })}
        </ScrollView>
      </FadeInView>

      {!hasResumeSaved && (
        <FadeInView direction="up" delay={150}>
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>📄 Resume Required</Text>
            <Text style={styles.warningText}>
              Save your resume on this device first — it will be sent when you apply.
            </Text>
            <Button title="Save Resume" size="sm" onPress={() => router.push('/resume/upload')} />
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={200}>
        <SectionHeader title={`${filteredJobs.length} Jobs Ready`} subtitle="Tap to smart apply" />
      </FadeInView>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : error ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>Could not load jobs</Text>
          <Text style={styles.warningText}>{error}</Text>
          <Button title="Retry" size="sm" onPress={() => void load()} />
        </Card>
      ) : filteredJobs.length === 0 ? (
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>No matching jobs yet</Text>
          <Text style={styles.warningText}>
            Upload a resume and try Find Jobs, or clear the platform filter.
          </Text>
          <Button title="Find Jobs" size="sm" onPress={() => router.push('/(tabs)/jobs')} />
        </Card>
      ) : (
        <ResponsiveGrid>
          {filteredJobs.map((job, i) => {
            const platform = detectPlatform(job.applyUrl || '', job.source);
            const pConfig = getPlatformConfig(platform);
            const dup = findLocalDuplicate(applications, job);
            const match = job.matchScore != null ? Math.round(job.matchScore) : null;
            return (
              <FadeInView key={job.id} direction="up" delay={Math.min(i * 40, 400)}>
                <Card style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={[styles.jobLogo, { backgroundColor: pConfig.color }]}>
                      <Text style={styles.jobLogoText}>{pConfig.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobCompany}>
                        {job.company} · {job.location || (job.isRemote ? 'Remote' : 'Onsite')}
                      </Text>
                      {dup && (
                        <Badge
                          text={dup.label}
                          backgroundColor={Colors.warning + '25'}
                          color={Colors.warning}
                        />
                      )}
                    </View>
                    {match != null && (
                      <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>{match}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.jobActions}>
                    <Button
                      title={dup?.kind === 'job' ? 'Apply again' : pConfig.applyLabel}
                      size="sm"
                      loading={applyingId === job.id}
                      onPress={() => void handleSmartApply(job)}
                      style={{ flex: 1 }}
                    />
                    {platform === 'linkedin' && (
                      <Button
                        title="Share"
                        size="sm"
                        variant="yellow"
                        onPress={() => void handleShareLinkedIn(job)}
                        style={{ flex: 0.4 }}
                      />
                    )}
                    <Button
                      title="Details"
                      size="sm"
                      variant="outline"
                      onPress={() => router.push(`/job/${job.id}`)}
                      style={{ flex: 0.4 }}
                    />
                  </View>
                </Card>
              </FadeInView>
            );
          })}
        </ResponsiveGrid>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: BorderRadius.xxl, padding: Spacing.lg, marginBottom: Spacing.lg },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  platformFilters: { marginBottom: Spacing.lg },
  platformBtn: { marginRight: Spacing.sm },
  warningCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  warningTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  warningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  jobCard: { marginBottom: Spacing.md },
  jobHeader: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  jobLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobLogoText: { fontSize: 24 },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  jobCompany: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  matchPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  matchPillText: { color: Colors.success, fontWeight: '800', fontSize: FontSize.xs },
  jobActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});
