import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Badge, PlatformBadge, Button, JobCardSkeleton, useResponsive } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { RecordApplicationModal } from '@/components/RecordApplicationModal';
import { JobFilterModal } from '@/components/JobFilterModal';
import { useAuthStore } from '@/stores/authStore';
import { searchJobsPaginated } from '@/lib/services/jobs';
import { detectPlatform, getPlatformConfig, openSmartApply } from '@/lib/services/platforms';
import { createApplication } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job, ApplicationStatus, JobFilterParams } from '@/types';
import { useJobStore } from '@/stores/jobStore';

const PLATFORM_FILTERS = [
  { key: 'all', label: 'All', icon: '🌐' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'indeed', label: 'Indeed', icon: '🔍' },
  { key: 'naukri', label: 'Naukri', icon: '🇮🇳' },
] as const;

export default function JobsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const addJobs = useJobStore((s) => s.addJobs);
  const setSelectedJob = useJobStore((s) => s.setSelectedJob);
  const { isTablet } = useResponsive();

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<JobFilterParams>({
    platform: 'all',
    workMode: 'all',
    employmentType: 'all',
    seniority: 'all',
    minMatchScore: 0,
    page: 1,
    pageSize: 8,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Modals state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [recordModalJob, setRecordModalJob] = useState<Job | null>(null);
  const [recordModalVisible, setRecordModalVisible] = useState(false);

  const fetchJobsData = useCallback(
    async (pageToFetch: number, isAppending = false) => {
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await searchJobsPaginated(
          { ...filters, query, page: pageToFetch, pageSize: 8 },
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
        setTotalJobs(response.total);
        addJobs(response.jobs);
      } catch (err) {
        console.warn('Failed to load paginated jobs:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, filters, profile, addJobs]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobsData(1, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchJobsData]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = (filters.page || 1) + 1;
    setFilters((prev) => ({ ...prev, page: nextPage }));
    fetchJobsData(nextPage, true);
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
      setRecordModalJob(job);
      setRecordModalVisible(true);
    }
  };

  const handleConfirmModalStatus = async (status: ApplicationStatus) => {
    if (!recordModalJob) return;
    const activeUserId = user?.uid || 'local_user';
    try {
      await createApplication(activeUserId, {
        id: recordModalJob.id,
        title: recordModalJob.title,
        company: recordModalJob.company,
        matchScore: recordModalJob.matchScore?.overall || 0,
        status,
      });
      Alert.alert(
        'Saved to Record Tracker 📋',
        `Application for "${recordModalJob.title}" at ${recordModalJob.company} marked as "${status}" in your tracker.`
      );
    } catch (err) {
      console.warn('Failed to save application status:', err);
    } finally {
      setRecordModalVisible(false);
      setRecordModalJob(null);
    }
  };

  const activeFilterCount = [
    filters.workMode !== 'all',
    filters.seniority !== 'all',
    filters.employmentType !== 'all',
    (filters.minMatchScore || 0) > 0,
  ].filter(Boolean).length;

  return (
    <Screen safe={false} edges={['left', 'right']} scroll={false}>
      <View style={styles.searchSection}>
        <FadeInView direction="down">
          <View style={styles.searchBarRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search jobs, skills, companies..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
            <Pressable style={styles.filterToggleBtn} onPress={() => setFilterModalVisible(true)}>
              <Text style={styles.filterToggleIcon}>🎛️</Text>
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </FadeInView>

        {/* Platform Quick Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {PLATFORM_FILTERS.map((f) => {
            const isActive = (filters.platform || 'all') === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilters((prev) => ({ ...prev, platform: f.key, page: 1 }))}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.icon} {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultCount}>
              {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found matching your profile
            </Text>
            {profile?.skills && profile.skills.length > 0 && (
              <Text style={styles.skillsTagline}>Matched with: {profile.skills.slice(0, 3).join(', ')}</Text>
            )}
          </View>

          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching jobs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search query or filters to discover more roles.</Text>
            </View>
          ) : (
            <ResponsiveGrid>
              {jobs.map((job, i) => {
                const platform = detectPlatform(job.url, job.source);
                const pConfig = getPlatformConfig(platform);
                return (
                  <FadeInView key={`${job.id}_${i}`} direction="up" delay={Math.min(i * 35, 300)}>
                    <Card style={styles.jobCard} onPress={() => { setSelectedJob(job); router.push(`/job/${job.id}`); }}>
                      <View style={styles.jobHeader}>
                        <View style={[styles.companyLogo, { backgroundColor: pConfig.color }]}>
                          <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.jobTitle} numberOfLines={isTablet ? 2 : 1}>{job.title}</Text>
                          <Text style={styles.jobCompany}>{job.company}</Text>
                        </View>
                        <View style={styles.matchBadge}>
                          <Text style={styles.matchScore}>{job.matchScore?.overall}%</Text>
                          <Text style={styles.matchLabel}>match</Text>
                        </View>
                      </View>

                      <View style={styles.tags}>
                        <PlatformBadge platform={pConfig.name} color={pConfig.color} icon={pConfig.icon} />
                        {job.remote && <Badge text="Remote" backgroundColor={Colors.secondary + '30'} color={Colors.secondaryDark} />}
                        {job.salary && <Badge text={job.salary} backgroundColor={Colors.primary + '15'} color={Colors.primary} />}
                      </View>

                      <Text style={styles.location}>📍 {job.location}</Text>
                      <Text style={styles.description} numberOfLines={isTablet ? 3 : 2}>{job.description}</Text>

                      <View style={styles.cardActions}>
                        <Button
                          title={pConfig.applyLabel}
                          size="sm"
                          loading={applyingId === job.id}
                          onPress={() => handleSmartApply(job)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          title="Analysis →"
                          size="sm"
                          variant="outline"
                          onPress={() => { setSelectedJob(job); router.push(`/job/${job.id}`); }}
                          style={{ flex: 0.8 }}
                        />
                      </View>
                    </Card>
                  </FadeInView>
                );
              })}
            </ResponsiveGrid>
          )}

          {/* Load More Pagination Button */}
          {hasMore && jobs.length > 0 && (
            <View style={styles.loadMoreSection}>
              <Button
                title={loadingMore ? 'Loading More Jobs...' : 'Load More Jobs 🚀'}
                variant="outline"
                size="md"
                loading={loadingMore}
                onPress={handleLoadMore}
                style={styles.loadMoreBtn}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* Advanced Filter Modal */}
      <JobFilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={(newFilters) => {
          setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
        }}
        onResetFilters={() => {
          setFilters({
            platform: 'all',
            workMode: 'all',
            employmentType: 'all',
            seniority: 'all',
            minMatchScore: 0,
            page: 1,
            pageSize: 8,
          });
          setFilterModalVisible(false);
        }}
      />

      {/* Record Management Modal */}
      <RecordApplicationModal
        visible={recordModalVisible}
        job={recordModalJob}
        onClose={() => {
          setRecordModalVisible(false);
          setRecordModalJob(null);
        }}
        onConfirmStatus={handleConfirmModalStatus}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchSection: { paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  searchBarRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterToggleBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterToggleIcon: { fontSize: 20 },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
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
  filterTextActive: { color: Colors.primary, fontWeight: '800' },
  loadingContainer: { flex: 1, paddingTop: Spacing.md },
  list: { paddingBottom: Spacing.xxl },
  resultsHeader: { marginBottom: Spacing.md },
  resultCount: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  skillsTagline: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, marginTop: Spacing.xl },
  emptyIcon: { fontSize: 54, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '800', marginBottom: Spacing.xs },
  emptySubtext: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  jobCard: { marginBottom: Spacing.md },
  jobHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  companyLogo: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  companyInitial: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  jobCompany: { color: Colors.textSecondary, fontSize: FontSize.sm },
  matchBadge: { alignItems: 'center', backgroundColor: Colors.primary + '12', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg },
  matchScore: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '800' },
  matchLabel: { color: Colors.textMuted, fontSize: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  location: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  description: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.md },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  loadMoreSection: { marginTop: Spacing.md, marginBottom: Spacing.xl, alignItems: 'center' },
  loadMoreBtn: { width: '100%', maxWidth: 320 },
});
