import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Card, MatchScoreBar, Badge } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { searchJobs } from '@/lib/services/jobs';
import { createApplication } from '@/lib/firebase/profile';
import { generateCoverLetterAPI, sendOutreachEmailAPI } from '@/lib/firebase/functions';
import { detectPlatform, getPlatformConfig, openSmartApply, shareOnLinkedIn } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job } from '@/types';

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

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    try {
      await openSmartApply({ job, platform, profile: profile || {} });
      await createApplication(user.uid, {
        id: job.id, title: job.title, company: job.company, matchScore: job.matchScore?.overall || 0,
      });
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
        jobTitle: job.title, company: job.company, jobDescription: job.description,
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
    if (!recruiterEmail) { Alert.alert('Error', 'Please enter the recruiter email'); return; }
    setSendingEmail(true);
    try {
      const result = await sendOutreachEmailAPI({
        recruiterEmail, recruiterName: recruiterName || undefined,
        jobTitle: job.title, company: job.company,
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
          <View style={[styles.companyLogo, { backgroundColor: pConfig.color }]}>
            <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <View style={styles.tags}>
            {job.remote && <Badge text="Remote" backgroundColor={Colors.secondary + '30'} color={Colors.secondaryDark} />}
            <Badge text={job.employmentType} backgroundColor={Colors.surfaceLight} color={Colors.textSecondary} />
          </View>
        </View>
      </FadeInView>

      <FadeInView direction="up" delay={80}>
        <Card style={styles.matchCard}>
          <Text style={styles.matchTitle}>AI Match Score</Text>
          <Text style={styles.overallScore}>{job.matchScore?.overall}%</Text>
          <MatchScoreBar label="Skills" score={job.matchScore?.skills || 0} />
          <MatchScoreBar label="Experience" score={job.matchScore?.experience || 0} />
          <MatchScoreBar label="Education" score={job.matchScore?.education || 0} />
          <MatchScoreBar label="Location" score={job.matchScore?.location || 0} />
          <MatchScoreBar label="Salary" score={job.matchScore?.salary || 0} />
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
                  (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
                );
                return (
                  <View key={skill} style={[styles.skillTag, hasSkill && styles.skillTagMatch]}>
                    <Text style={[styles.skillText, hasSkill && styles.skillTextMatch]}>{hasSkill ? '✓ ' : ''}{skill}</Text>
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
          <Button title={generatingCL ? 'Generating...' : coverLetter ? 'Regenerate' : 'Generate with AI'}
            variant={coverLetter ? 'outline' : 'secondary'} size="sm" onPress={handleGenerateCoverLetter} loading={generatingCL} />
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={280}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Outreach</Text>
          {showEmailForm ? (
            <View>
              <TextInput style={styles.emailInput} placeholder="Recruiter email" placeholderTextColor={Colors.textMuted}
                value={recruiterEmail} onChangeText={setRecruiterEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.emailInput} placeholder="Recruiter name (optional)" placeholderTextColor={Colors.textMuted}
                value={recruiterName} onChangeText={setRecruiterName} />
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
        <Button title={pConfig.applyLabel} onPress={handleApply} loading={applying} icon={pConfig.icon} size="lg" />
        {platform === 'linkedin' && (
          <Button title="Share on LinkedIn" variant="yellow" onPress={() => shareOnLinkedIn(job, profile || undefined)} icon="💼" />
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
  companyLogo: { width: 72, height: 72, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  companyInitial: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  title: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  company: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.xs },
  tags: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  matchCard: { marginBottom: Spacing.md, alignItems: 'center' },
  matchTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs },
  overallScore: { color: Colors.primary, fontSize: 48, fontWeight: '900', marginBottom: Spacing.md },
  section: { marginBottom: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  sectionHint: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  detailIcon: { fontSize: 16, marginRight: Spacing.sm },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm, width: 80 },
  detailValue: { color: Colors.text, fontSize: FontSize.sm, flex: 1 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  skillTagMatch: { backgroundColor: Colors.primary + '20' },
  skillText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  skillTextMatch: { color: Colors.success, fontWeight: '700' },
  coverLetterText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, marginBottom: Spacing.md, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  emailInput: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  emailActions: { flexDirection: 'row', gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.lg },
});
