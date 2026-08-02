import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, StatCard, Badge, SectionHeader, useResponsive } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView, AnimatedProgress } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore, userHasResume } from '@/stores/resumeStore';
import { getApplications, calculateProfileCompleteness } from '@/lib/firebase/profile';
import { getRecommendedJobs } from '@/lib/services/jobs';
import { detectPlatform, getPlatformConfig } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius, PlatformConfig } from '@/constants/theme';
import type { Application, Job } from '@/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { hasResume } = useResumeStore();
  const { isTablet, columns } = useResponsive();
  const [applications, setApplications] = useState<Application[]>([]);
  const [topJobs, setTopJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (user) getApplications(user.uid).then(setApplications);
    getRecommendedJobs(profile?.skills || []).then((jobs) => setTopJobs(jobs.slice(0, columns === 1 ? 3 : 6)));
  }, [user, profile, columns]);

  const stats = {
    applicationsSent: applications.filter((a) => a.status !== 'pending').length,
    pending: applications.filter((a) => a.status === 'pending').length,
    interviews: applications.filter((a) => a.status === 'interview').length,
    offers: applications.filter((a) => a.status === 'offer' || a.status === 'accepted').length,
  };

  const profileCompleteness = calculateProfileCompleteness(profile, hasResume);
  const hasResumeSaved = userHasResume(hasResume, profile?.hasResume);

  return (
    <Screen safe edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.heroSubtitle}>
            {hasResumeSaved ? 'Your AI assistant found new matches!' : 'Save resume locally to unlock smart apply'}
          </Text>
          <View style={styles.heroActions}>
            {!hasResumeSaved && (
              <Pressable style={styles.heroBtn} onPress={() => router.push('/resume/upload')}>
                <Text style={styles.heroBtnText}>📄 Save Resume</Text>
              </Pressable>
            )}
            <Pressable style={[styles.heroBtn, styles.heroBtnYellow]} onPress={() => router.push('/share/linkedin')}>
              <Text style={[styles.heroBtnText, { color: Colors.text }]}>💼 Share on LinkedIn</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </FadeInView>

      {profileCompleteness < 100 && (
        <FadeInView direction="up" delay={80}>
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileTitle}>Profile Strength</Text>
                <Text style={styles.profileSubtitle}>Complete for better matches</Text>
              </View>
              <Text style={styles.profilePercent}>{profileCompleteness}%</Text>
            </View>
            <AnimatedProgress progress={profileCompleteness} color={Colors.primary} height={10} />
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={120}>
        <SectionHeader title="Your Stats" />
        <ScrollView horizontal={!isTablet} showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
            <StatCard title="Applied" value={stats.applicationsSent} icon="📤" color={Colors.primary} />
            <StatCard title="Pending" value={stats.pending} icon="⏳" color={Colors.secondaryDark} />
            <StatCard title="Interviews" value={stats.interviews} icon="🎯" color={Colors.info} />
            <StatCard title="Offers" value={stats.offers} icon="🎉" color={Colors.success} />
          </View>
        </ScrollView>
      </FadeInView>

      <FadeInView direction="up" delay={160}>
        <SectionHeader title="Apply on Platforms" />
        <View style={styles.platformGrid}>
          {(['linkedin', 'indeed', 'naukri'] as const).map((key) => {
            const p = PlatformConfig[key];
            return (
              <Pressable key={key} style={[styles.platformCard, { borderColor: p.color + '50' }]}
                onPress={() => router.push('/(tabs)/apply')}>
                <Text style={styles.platformEmoji}>{p.icon}</Text>
                <Text style={[styles.platformName, { color: p.color }]}>{p.name}</Text>
                <Text style={styles.platformDesc}>Smart Apply</Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInView>

      <FadeInView direction="up" delay={200}>
        <SectionHeader title="Top Matches" action={{ label: 'See all →', onPress: () => router.push('/(tabs)/jobs') }} />
        <ResponsiveGrid>
          {topJobs.map((job) => {
            const platform = detectPlatform(job.url, job.source);
            const pConfig = getPlatformConfig(platform);
            return (
              <Card key={job.id} style={styles.jobCard} onPress={() => router.push(`/job/${job.id}`)}>
                <View style={styles.jobHeader}>
                  <View style={[styles.jobLogo, { backgroundColor: pConfig.color }]}>
                    <Text style={styles.jobLogoText}>{job.company.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.jobCompany} numberOfLines={1}>{job.company}</Text>
                  </View>
                  <Badge text={`${job.matchScore?.overall}%`} backgroundColor={Colors.primary + '18'} color={Colors.primary} />
                </View>
                <Text style={styles.jobMetaText}>📍 {job.location}</Text>
              </Card>
            );
          })}
        </ResponsiveGrid>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: BorderRadius.xxl, padding: Spacing.lg, marginBottom: Spacing.md },
  greeting: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.92)', fontSize: FontSize.md, marginTop: Spacing.xs, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  heroBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full },
  heroBtnYellow: { backgroundColor: Colors.secondary },
  heroBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  profileCard: { marginBottom: Spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  profileTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  profileSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  profilePercent: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: '800' },
  statsScroll: { marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statsRowTablet: { flexWrap: 'wrap' },
  platformGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  platformCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 2 },
  platformEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  platformName: { fontSize: FontSize.sm, fontWeight: '800' },
  platformDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  jobCard: { marginBottom: Spacing.sm },
  jobHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  jobLogo: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  jobLogoText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  jobCompany: { color: Colors.textSecondary, fontSize: FontSize.sm },
  jobMetaText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
