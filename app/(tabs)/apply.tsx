import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Badge, SectionHeader, JobCardSkeleton } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { RecordApplicationModal } from '@/components/RecordApplicationModal';
import { ShareJobModal } from '@/components/ShareJobModal';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore, userHasResume } from '@/stores/resumeStore';
import { searchJobsPaginated } from '@/lib/services/jobs';
import { detectPlatform, getPlatformConfig, openSmartApply } from '@/lib/services/platforms';
import { createApplication } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius, PlatformConfig } from '@/constants/theme';
import type { Job, ApplicationStatus } from '@/types';
import { useJobStore } from '@/stores/jobStore';

export default function SmartApplyScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { hasResume } = useResumeStore();
  const addJobs = useJobStore((s) => s.addJobs);
  const setSelectedJob = useJobStore((s) => s.setSelectedJob);
  const hasResumeSaved = userHasResume(hasResume, profile?.hasResume);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Record modal state
  const [modalJob, setModalJob] = useState<Job | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Share modal state
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  const loadApplyJobs = useCallback(
    async (pageToFetch: number, isAppending = false) => {
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await searchJobsPaginated(
          { platform: selectedPlatform !== 'all' ? selectedPlatform : undefined, page: pageToFetch, pageSize: 8 },
          profile?.skills || [],
          profile?.preferredLocation || 'Remote',
          profile?.experience || 3
        );

        if (isAppending) {
          setJobs((prev) => [...prev, ...response.jobs]);
        } else {
          setJobs(response.jobs);
        }

        setHasMore(response.hasMore);
        addJobs(response.jobs);
      } catch (err) {
        console.warn('Failed to load smart apply jobs:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedPlatform, profile, addJobs]
  );

  useEffect(() => {
    setPage(1);
    loadApplyJobs(1, false);
  }, [selectedPlatform, profile?.skills, loadApplyJobs]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadApplyJobs(nextPage, true);
  };

  const handleSmartApply = async (job: Job) => {
    const platform = detectPlatform(job.url, job.source);
    setApplyingId(job.id);
    try {
      await openSmartApply({ job, platform, profile: profile || {} });
    } catch {
      Alert.alert('Notice', 'Opening job URL in browser...');
    } finally {
      setApplyingId(null);
      setModalJob(job);
      setModalVisible(true);
    }
  };

  const handleConfirmModalStatus = async (status: ApplicationStatus) => {
    if (!modalJob) return;
    const activeUserId = user?.uid || 'local_user';
    try {
      await createApplication(activeUserId, {
        id: modalJob.id,
        title: modalJob.title,
        company: modalJob.company,
        matchScore: modalJob.matchScore?.overall || 0,
        status,
      });
      Alert.alert(
        'Saved to Record Tracker 📋',
        `Application for "${modalJob.title}" at ${modalJob.company} marked as "${status}" in your tracker.`
      );
    } catch (err) {
      console.warn('Failed to save application status:', err);
    } finally {
      setModalVisible(false);
      setModalJob(null);
    }
  };

  const handleOpenShare = (job: Job) => {
    setShareJob(job);
    setShareVisible(true);
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.hero}>
          <Text style={styles.heroTitle}>⚡ Smart Apply Hub</Text>
          <Text style={styles.heroSubtitle}>
            Categorized for LinkedIn, Indeed & Naukri. Profile skills matched automatically.
          </Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <SectionHeader title="Categorized Platforms" subtitle="Filter by portal" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformFilters}>
          <Button
            title="All Platforms"
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
            <Text style={styles.warningTitle}>📄 Resume Recommended</Text>
            <Text style={styles.warningText}>Save your resume on this device to extract skills & streamline candidate submissions.</Text>
            <Button title="Save Resume" size="sm" onPress={() => router.push('/resume/upload')} />
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={200}>
        <SectionHeader title={`${jobs.length} Profile-Matched Roles`} subtitle="Tap to open job portal & record application" />
      </FadeInView>

      {loading ? (
        <View style={{ marginTop: Spacing.md }}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : (
        <>
          <ResponsiveGrid>
            {jobs.map((job, i) => {
              const platform = detectPlatform(job.url, job.source);
              const pConfig = getPlatformConfig(platform);
              return (
                <FadeInView key={`${job.id}_${i}`} direction="up" delay={Math.min(i * 35, 300)}>
                  <Card style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <View style={[styles.jobLogo, { backgroundColor: pConfig.color }]}>
                        <Text style={styles.jobLogoText}>{pConfig.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
                        <Badge text={`${job.matchScore?.overall || 0}% match`} backgroundColor={Colors.primary + '15'} color={Colors.primary} />
                      </View>
                    </View>
                    <View style={styles.jobActions}>
                      <Button
                        title={pConfig.applyLabel}
                        size="sm"
                        loading={applyingId === job.id}
                        onPress={() => handleSmartApply(job)}
                        style={{ flex: 1 }}
                      />
                      <Button title="Share" size="sm" variant="yellow" onPress={() => handleOpenShare(job)} style={{ flex: 0.4 }} />
                      <Button
                        title="Details"
                        size="sm"
                        variant="outline"
                        onPress={() => { setSelectedJob(job); router.push(`/job/${job.id}`); }}
                        style={{ flex: 0.4 }}
                      />
                    </View>
                  </Card>
                </FadeInView>
              );
            })}
          </ResponsiveGrid>

          {hasMore && (
            <View style={styles.loadMoreSection}>
              <Button
                title={loadingMore ? 'Loading More Roles...' : 'Load More Smart Apply Roles ⚡'}
                variant="outline"
                size="md"
                loading={loadingMore}
                onPress={handleLoadMore}
                style={styles.loadMoreBtn}
              />
            </View>
          )}
        </>
      )}

      {/* Record Management Modal */}
      <RecordApplicationModal
        visible={modalVisible}
        job={modalJob}
        onClose={() => {
          setModalVisible(false);
          setModalJob(null);
        }}
        onConfirmStatus={handleConfirmModalStatus}
      />

      {/* Share Job Modal */}
      <ShareJobModal
        visible={shareVisible}
        job={shareJob}
        onClose={() => {
          setShareVisible(false);
          setShareJob(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: BorderRadius.xxl, padding: Spacing.lg, marginBottom: Spacing.lg },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.md, marginTop: Spacing.sm, lineHeight: 22 },
  platformFilters: { marginBottom: Spacing.lg },
  platformBtn: { marginRight: Spacing.sm },
  warningCard: { marginBottom: Spacing.lg, backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary },
  warningTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  warningText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md },
  jobCard: { marginBottom: Spacing.md },
  jobHeader: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  jobLogo: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  jobLogoText: { fontSize: 24 },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  jobCompany: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  jobActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  loadMoreSection: { marginTop: Spacing.md, marginBottom: Spacing.xl, alignItems: 'center' },
  loadMoreBtn: { width: '100%', maxWidth: 340 },
});
