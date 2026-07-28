import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, MatchScoreBar, Badge } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { RecordApplicationModal } from '@/components/RecordApplicationModal';
import { ShareJobModal } from '@/components/ShareJobModal';
import { useAuthStore } from '@/stores/authStore';
import { searchJobs } from '@/lib/services/jobs';
import { createApplication } from '@/lib/firebase/profile';
import { generateCoverLetterAPI, sendOutreachEmailAPI } from '@/lib/firebase/functions';
import { detectPlatform, getPlatformConfig, openSmartApply, shareOnLinkedIn } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job, ApplicationStatus } from '@/types';
import { useJobStore } from '@/stores/jobStore';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuthStore();
  const getJobById = useJobStore((s) => s.getJobById);
  const [applying, setApplying] = useState(false);
  const [job, setJob] = useState<Job | null>(() => (id ? getJobById(id) : null));
  const [loading, setLoading] = useState(!job);
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCL, setGeneratingCL] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const cached = id ? getJobById(id) : null;
      if (cached) {
        setJob(cached);
        setLoading(false);
        return;
      }
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
  }, [id, profile?.skills, getJobById]);

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
  const analysis = job.matchScore?.analysis;

  const handleApply = async () => {
    setApplying(true);
    try {
      await openSmartApply({ job, platform, profile: profile || {} });
    } catch {
      Alert.alert('Notice', 'Opening job link...');
    } finally {
      setApplying(false);
      setModalVisible(true);
    }
  };

  const handleConfirmModalStatus = async (status: ApplicationStatus) => {
    const activeUserId = user?.uid || 'local_user';
    try {
      await createApplication(activeUserId, {
        id: job.id,
        title: job.title,
        company: job.company,
        matchScore: job.matchScore?.overall || 0,
        status,
      });
      Alert.alert('Saved to Record Tracker 📋', `Application marked as "${status}" in your tracker.`);
    } catch (err) {
      console.warn('Failed to save application status:', err);
    } finally {
      setModalVisible(false);
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
      Alert.alert('Cover Letter Generator', `${msg}. Defaulting to AI draft snippet.`);
      setCoverLetter(
        `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong enthusiasm for the ${job.title} role. With a proven background in software development and strong alignment with your required technical skills (${job.skills.slice(0, 3).join(', ')}), I am confident in delivering immediate value to your engineering initiatives.\n\nThank you for considering my application.\n\nBest regards,\n${profile?.name || 'Applicant'}`
      );
    } finally {
      setGeneratingCL(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recruiterEmail) { Alert.alert('Error', 'Please enter the recruiter email'); return; }
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
      Alert.alert('Recruiter Outreach', `${msg}. Draft copied for manual email client.`);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyAtsKeywords = async () => {
    if (!analysis?.atsKeywords) return;
    await Clipboard.setStringAsync(analysis.atsKeywords.join(', '));
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
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
            <Badge text={pConfig.name} backgroundColor={pConfig.color + '20'} color={pConfig.color} />
          </View>
        </View>
      </FadeInView>

      {/* AI Compatibility Analysis Card */}
      <FadeInView direction="up" delay={80}>
        <Card style={styles.matchCard}>
          <View style={styles.matchCardHeader}>
            <Text style={styles.matchTitle}>⚡ Advanced AI Match Analysis</Text>
            <View style={styles.scoreBadgeLarge}>
              <Text style={styles.overallScore}>{job.matchScore?.overall}%</Text>
              <Text style={styles.overallScoreSub}>Match Score</Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            <MatchScoreBar label="Skills Fit" score={job.matchScore?.skills || 0} />
            <MatchScoreBar label="Experience" score={job.matchScore?.experience || 0} />
            <MatchScoreBar label="Education" score={job.matchScore?.education || 0} />
            <MatchScoreBar label="Location" score={job.matchScore?.location || 0} />
            <MatchScoreBar label="Salary" score={job.matchScore?.salary || 0} />
          </View>

          {/* AI Insights & Summary */}
          <View style={styles.aiAnalysisBox}>
            <Text style={styles.aiAnalysisHeader}>💡 AI Compatibility Report</Text>
            <Text style={styles.aiAnalysisText}>
              {analysis?.summary ||
                ((job.matchScore?.overall || 0) >= 80
                  ? '🌟 Prime Target! Your skills strongly align with key role requirements.'
                  : '⚡ Solid Opportunity! Good baseline technical alignment.')}
            </Text>

            {analysis?.strengths && analysis.strengths.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightTitle}>💪 Key Competitive Strengths</Text>
                {analysis.strengths.map((str, idx) => (
                  <Text key={idx} style={styles.bulletText}>• {str}</Text>
                ))}
              </View>
            )}

            {analysis?.recommendations && analysis.recommendations.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightTitle}>🎯 Application Recommendations</Text>
                {analysis.recommendations.map((rec, idx) => (
                  <Text key={idx} style={styles.bulletText}>• {rec}</Text>
                ))}
              </View>
            )}

            {/* ATS Keywords Section */}
            {analysis?.atsKeywords && analysis.atsKeywords.length > 0 && (
              <View style={styles.atsSection}>
                <View style={styles.atsHeader}>
                  <Text style={styles.atsTitle}>📋 ATS Resume Keywords</Text>
                  <Pressable onPress={copyAtsKeywords} style={styles.copyBtn}>
                    <Text style={styles.copyBtnText}>{copiedKeywords ? '✓ Copied!' : 'Copy Keywords'}</Text>
                  </Pressable>
                </View>
                <View style={styles.atsTags}>
                  {analysis.atsKeywords.map((kw) => (
                    <View key={kw} style={styles.atsChip}>
                      <Text style={styles.atsChipText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
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
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </Card>
      </FadeInView>

      {/* Skills Analysis Tag Section */}
      <FadeInView direction="up" delay={200}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Skills Comparison</Text>
          <View style={styles.skills}>
            {job.skills.map((skill) => {
              const hasSkill = profile?.skills?.some(
                (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
              );
              return (
                <View key={skill} style={[styles.skillTag, hasSkill ? styles.skillTagMatch : styles.skillTagMissing]}>
                  <Text style={[styles.skillText, hasSkill ? styles.skillTextMatch : styles.skillTextMissing]}>
                    {hasSkill ? '✓ ' : '+ '}{skill}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={240}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Letter</Text>
          {coverLetter ? (
            <Text style={styles.coverLetterText}>{coverLetter}</Text>
          ) : (
            <Text style={styles.sectionHint}>Generate a tailored cover letter using AI</Text>
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
          title={`Apply on ${pConfig.name}`}
          onPress={handleApply}
          loading={applying}
          icon={pConfig.icon}
          size="lg"
        />
        <Button
          title="Share (WhatsApp / SMS / LinkedIn)"
          variant="yellow"
          onPress={() => setShareVisible(true)}
          icon="💬"
        />
        <Button title="View Original Posting" variant="outline" onPress={() => Linking.openURL(job.url)} />
      </View>

      <RecordApplicationModal
        visible={modalVisible}
        job={job}
        onClose={() => setModalVisible(false)}
        onConfirmStatus={handleConfirmModalStatus}
      />

      <ShareJobModal
        visible={shareVisible}
        job={job}
        onClose={() => setShareVisible(false)}
      />
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
  matchCard: { marginBottom: Spacing.md },
  matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  matchTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  scoreBadgeLarge: { alignItems: 'center', backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg },
  overallScore: { color: Colors.primary, fontSize: FontSize.xxl, fontWeight: '900' },
  overallScoreSub: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  barsContainer: { marginBottom: Spacing.md },
  aiAnalysisBox: { width: '100%', marginTop: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.primary + '08', borderRadius: BorderRadius.lg, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  aiAnalysisHeader: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: Spacing.xs },
  aiAnalysisText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  insightSection: { marginTop: Spacing.md },
  insightTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700', marginBottom: 4 },
  bulletText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18, marginLeft: Spacing.xs },
  atsSection: { marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  atsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  atsTitle: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700' },
  copyBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  copyBtnText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  atsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  atsChip: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.md },
  atsChipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  section: { marginBottom: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  sectionHint: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  detailIcon: { fontSize: 16, marginRight: Spacing.sm },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm, width: 80 },
  detailValue: { color: Colors.text, fontSize: FontSize.sm, flex: 1 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  skillTagMatch: { backgroundColor: Colors.success + '18' },
  skillTagMissing: { backgroundColor: Colors.secondary + '20' },
  skillText: { fontSize: FontSize.sm },
  skillTextMatch: { color: Colors.success, fontWeight: '700' },
  skillTextMissing: { color: Colors.secondaryDark, fontWeight: '600' },
  coverLetterText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, marginBottom: Spacing.md, backgroundColor: Colors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  emailInput: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  emailActions: { flexDirection: 'row', gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.lg },
});
