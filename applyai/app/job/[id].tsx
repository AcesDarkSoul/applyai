import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Linking, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Badge } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { MatchScoreBreakdown } from '@/components/jobs/MatchScoreBreakdown';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { useAuthStore } from '@/stores/authStore';
import { searchJobs } from '@/lib/services/jobs';
import {
  createApplication,
  getApplications,
  formatFirebaseError,
} from '@/lib/firebase/profile';
import { confirmDuplicateApply } from '@/lib/confirmDuplicateApply';
import { findDuplicateApply } from '@/lib/duplicateApply';
import { isJobSaved, toggleSaveJob } from '@/lib/firebase/savedJobs';
import { generateCoverLetterAPI, sendOutreachEmailAPI } from '@/lib/firebase/functions';
import { detectPlatform, getPlatformConfig, openSmartApply, shareOnLinkedIn } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Application, Job } from '@/types';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuthStore();
  const [applying, setApplying] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const jobs = await searchJobs({}, profile?.skills || []);
        setJob(jobs.find((j) => j.id === id) || null);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, profile?.skills]);

  const refreshMeta = useCallback(async () => {
    if (!user || !id) return;
    try {
      const [apps, isSaved] = await Promise.all([
        getApplications(user.uid),
        isJobSaved(user.uid, id),
      ]);
      setApplications(apps);
      setSaved(isSaved);
    } catch {
      /* ignore */
    }
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      refreshMeta();
    }, [refreshMeta])
  );

  if (loading) {
    return (
      <Screen safe={false} edges={['left', 'right']} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen safe={false} edges={['left', 'right']} contentStyle={styles.center}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>Job not found</Text>
      </Screen>
    );
  }

  const platform = detectPlatform(job.url, job.source);
  const pConfig = getPlatformConfig(platform);
  const duplicate = findDuplicateApply(applications, job);

  const handleToggleSave = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to save jobs to your shortlist.');
      return;
    }
    setSaving(true);
    try {
      const next = await toggleSaveJob(user.uid, job, saved);
      setSaved(next);
    } catch (e) {
      Alert.alert('Error', formatFirebaseError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!user) return;
    const ok = await confirmDuplicateApply(applications, job);
    if (!ok) return;

    setApplying(true);
    try {
      await openSmartApply({ job, platform, profile: profile || {} });
      await createApplication(user.uid, {
        id: job.id,
        title: job.title,
        company: job.company,
        matchScore: job.matchScore?.overall || 0,
      });
      const apps = await getApplications(user.uid);
      setApplications(apps);
    } catch {
      Alert.alert('Error', 'Failed to start application');
    } finally {
      setApplying(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGeneratingCL(true);
    try {
      const result = await generateCoverLetterAPI({
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
      });
      setCoverLetter(result.content);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate';
      Alert.alert('Error', msg + '. Make sure Cloud Functions are deployed with your OpenAI key.');
    } finally {
      setGeneratingCL(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recruiterEmail) {
      Alert.alert('Error', 'Please enter the recruiter email');
      return;
    }
    setSendingEmail(true);
    try {
      const result = await sendOutreachEmailAPI({
        recruiterEmail,
        recruiterName: recruiterName || undefined,
        jobTitle: job.title,
        company: job.company,
      });
      Alert.alert('Email Sent!', `Subject: ${result.subject}`);
      setShowEmailForm(false);
      setRecruiterEmail('');
      setRecruiterName('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send';
      Alert.alert('Error', msg + '. Make sure Cloud Functions are deployed with your SendGrid key.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.companyLogo, { backgroundColor: pConfig.color }]}>
              <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
            </View>
            <View style={styles.saveAbsolute}>
              <SaveJobButton saved={saved} loading={saving} onPress={handleToggleSave} size={26} />
            </View>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <View style={styles.tags}>
            {job.remote && (
              <Badge text="Remote" backgroundColor={Colors.secondary + '30'} color={Colors.secondaryDark} />
            )}
            <Badge
              text={job.employmentType}
              backgroundColor={Colors.surfaceLight}
              color={Colors.textSecondary}
            />
            {saved && (
              <Badge text="Saved" backgroundColor={Colors.primary + '18'} color={Colors.primary} />
            )}
          </View>
        </View>
      </FadeInView>

      {duplicate && (
        <FadeInView direction="up" delay={40}>
          <Card style={styles.dupCard}>
            <Text style={styles.dupTitle}>
              {duplicate.kind === 'job' ? 'Already applied to this job' : 'Already applied at this company'}
            </Text>
            <Text style={styles.dupText}>
              Prior application: {duplicate.application.jobTitle} · status{' '}
              {duplicate.application.status}
            </Text>
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={80}>
        <Card style={styles.matchCard}>
          <MatchScoreBreakdown score={job.matchScore} variant="detail" defaultExpanded={false} />
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={120}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <DetailRow icon="📍" label="Location" value={job.location} />
          {job.salary && <DetailRow icon="💰" label="Salary" value={job.salary} />}
          <DetailRow icon="🔗" label="Source" value={job.source} />
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={160}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </Card>
      </FadeInView>

      {job.skills.length > 0 && (
        <FadeInView direction="up" delay={200}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skills}>
              {job.skills.map((skill) => {
                const hasSkill = profile?.skills?.some(
                  (s) =>
                    s.toLowerCase().includes(skill.toLowerCase()) ||
                    skill.toLowerCase().includes(s.toLowerCase())
                );
                return (
                  <View key={skill} style={[styles.skillTag, hasSkill && styles.skillTagMatch]}>
                    <Text style={[styles.skillText, hasSkill && styles.skillTextMatch]}>
                      {hasSkill ? '✓ ' : ''}
                      {skill}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={240}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Letter</Text>
          {coverLetter ? (
            <Text style={styles.coverLetterText}>{coverLetter}</Text>
          ) : (
            <Text style={styles.sectionHint}>Generate a personalized cover letter using AI</Text>
          )}
          <Button
            title={generatingCL ? 'Generating...' : coverLetter ? 'Regenerate' : 'Generate with AI'}
            variant={coverLetter ? 'outline' : 'secondary'}
            size="sm"
            onPress={handleGenerateCoverLetter}
            loading={generatingCL}
          />
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={280}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Outreach</Text>
          {showEmailForm ? (
            <View>
              <TextInput
                style={styles.emailInput}
                placeholder="Recruiter email"
                placeholderTextColor={Colors.textMuted}
                value={recruiterEmail}
                onChangeText={setRecruiterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.emailInput}
                placeholder="Recruiter name (optional)"
                placeholderTextColor={Colors.textMuted}
                value={recruiterName}
                onChangeText={setRecruiterName}
              />
              <View style={styles.emailActions}>
                <Button title="Send AI Email" size="sm" onPress={handleSendEmail} loading={sendingEmail} />
                <Button title="Cancel" size="sm" variant="ghost" onPress={() => setShowEmailForm(false)} />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.sectionHint}>Send AI-crafted outreach email to the recruiter</Text>
              <Button title="Compose Outreach" variant="outline" size="sm" onPress={() => setShowEmailForm(true)} />
            </>
          )}
        </Card>
      </FadeInView>

      <View style={styles.actions}>
        <Button
          title={
            duplicate?.kind === 'job'
              ? 'Apply again'
              : duplicate?.kind === 'company'
                ? 'Apply to this role'
                : pConfig.applyLabel
          }
          onPress={handleApply}
          loading={applying}
          icon={pConfig.icon}
          size="lg"
        />
        <Button
          title={saved ? 'Remove from shortlist' : 'Save for later'}
          variant="outline"
          onPress={handleToggleSave}
          loading={saving}
        />
        {platform === 'linkedin' && (
          <Button
            title="Share on LinkedIn"
            variant="yellow"
            onPress={() => shareOnLinkedIn(job, profile || undefined)}
            icon="💼"
          />
        )}
        <Button title="View Original Posting" variant="outline" onPress={() => Linking.openURL(job.url)} />
      </View>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  headerTop: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  saveAbsolute: { position: 'absolute', right: 0, top: 0 },
  companyLogo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  company: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.xs },
  tags: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dupCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.warning + '18',
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  dupTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800', marginBottom: 4 },
  dupText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  matchCard: { marginBottom: Spacing.md, alignItems: 'center' },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  sectionHint: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  detailIcon: { fontSize: 16, marginRight: Spacing.sm },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm, width: 80 },
  detailValue: { color: Colors.text, fontSize: FontSize.sm, flex: 1 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  skillTagMatch: { backgroundColor: Colors.primary + '20' },
  skillText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  skillTextMatch: { color: Colors.success, fontWeight: '700' },
  coverLetterText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emailInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  emailActions: { flexDirection: 'row', gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.lg },
});
