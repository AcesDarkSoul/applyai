import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Button, Badge, SectionHeader } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { MatchScoreBreakdown } from '@/components/jobs/MatchScoreBreakdown';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore, userHasResume } from '@/stores/resumeStore';
import { searchJobs } from '@/lib/services/jobs';
import { detectPlatform, getPlatformConfig, openSmartApply, shareOnLinkedIn } from '@/lib/services/platforms';
import { createApplication, getApplications } from '@/lib/firebase/profile';
import { confirmDuplicateApply } from '@/lib/confirmDuplicateApply';
import { findDuplicateApply } from '@/lib/duplicateApply';
import { Colors, Spacing, FontSize, BorderRadius, PlatformConfig } from '@/constants/theme';
import type { Application, Job } from '@/types';

export default function SmartApplyScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { hasResume } = useResumeStore();
  const hasResumeSaved = userHasResume(hasResume, profile?.hasResume);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    searchJobs({}, profile?.skills || []).then((result) => {
      setJobs(result.slice(0, 20));
      setLoading(false);
    });
  }, [profile?.skills]);

  useFocusEffect(
    useCallback(() => {
      if (user) getApplications(user.uid).then(setApplications);
    }, [user])
  );

  const filteredJobs = selectedPlatform === 'all'
    ? jobs
    : jobs.filter((j) => detectPlatform(j.url, j.source) === selectedPlatform);

  const handleSmartApply = async (job: Job) => {
    if (!user) return;
    const ok = await confirmDuplicateApply(applications, job);
    if (!ok) return;

    const platform = detectPlatform(job.url, job.source);
    setApplyingId(job.id);
    try {
      await openSmartApply({ job, platform, profile: profile || {} });
      await createApplication(user.uid, {
        id: job.id, title: job.title, company: job.company, matchScore: job.matchScore?.overall || 0,
      });
      const apps = await getApplications(user.uid);
      setApplications(apps);
      Alert.alert('Application Started! 🎉', `Opening ${getPlatformConfig(platform).name} to complete your application.`);
    } catch {
      Alert.alert('Error', 'Failed to start application');
    } finally {
      setApplyingId(null);
    }
  };

  const handleShareLinkedIn = async (job: Job) => {
    await shareOnLinkedIn(job, profile || undefined);
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
          <Button title="All" size="sm" variant={selectedPlatform === 'all' ? 'primary' : 'outline'}
            onPress={() => setSelectedPlatform('all')} style={styles.platformBtn} />
          {(['linkedin', 'indeed', 'naukri'] as const).map((key) => {
            const p = PlatformConfig[key];
            return (
              <Button key={key} title={`${p.icon} ${p.name}`} size="sm"
                variant={selectedPlatform === key ? 'primary' : 'outline'}
                onPress={() => setSelectedPlatform(key)} style={styles.platformBtn} />
            );
          })}
        </ScrollView>
      </FadeInView>

      {!hasResumeSaved && (
        <FadeInView direction="up" delay={150}>
          <Card style={styles.warningCard}>
            <Text style={styles.warningTitle}>📄 Resume Required</Text>
            <Text style={styles.warningText}>Save your resume on this device first — it will be sent when you apply.</Text>
            <Button title="Save Resume" size="sm" onPress={() => router.push('/resume/upload')} />
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={200}>
        <SectionHeader title={`${filteredJobs.length} Jobs Ready`} subtitle="Tap to smart apply" />
      </FadeInView>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <ResponsiveGrid>
          {filteredJobs.map((job, i) => {
            const platform = detectPlatform(job.url, job.source);
            const pConfig = getPlatformConfig(platform);
            const dup = findDuplicateApply(applications, job);
            return (
              <FadeInView key={job.id} direction="up" delay={Math.min(i * 40, 400)}>
                <Card style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={[styles.jobLogo, { backgroundColor: pConfig.color }]}>
                      <Text style={styles.jobLogoText}>{pConfig.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
                      {dup && (
                        <Badge
                          text={dup.kind === 'job' ? 'Applied' : 'Same company'}
                          backgroundColor={Colors.warning + '25'}
                          color={Colors.warning}
                        />
                      )}
                    </View>
                  </View>
                  <MatchScoreBreakdown score={job.matchScore} variant="compact" />
                  <View style={styles.jobActions}>
                    <Button
                      title={dup?.kind === 'job' ? 'Apply again' : pConfig.applyLabel}
                      size="sm"
                      loading={applyingId === job.id}
                      onPress={() => handleSmartApply(job)}
                      style={{ flex: 1 }}
                    />
                    {platform === 'linkedin' && (
                      <Button title="Share" size="sm" variant="yellow" onPress={() => handleShareLinkedIn(job)} style={{ flex: 0.4 }} />
                    )}
                    <Button title="Details" size="sm" variant="outline" onPress={() => router.push(`/job/${job.id}`)} style={{ flex: 0.4 }} />
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
  matchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, flexWrap: 'wrap' },
  jobActions: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
});
