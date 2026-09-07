import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import {
  aiRepository,
  applicationRepository,
  jobRepository,
  type ApiJob,
  type SkillGapResult,
} from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<ApiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [skillGap, setSkillGap] = useState<SkillGapResult | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setJob(await jobRepository.get(id));
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDuplicate = async (jobId: string) => {
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
  };

  const onSmartApply = async () => {
    if (!job) return;
    const ok = await confirmDuplicate(job.id);
    if (!ok) return;
    setBusy('smart');
    try {
      const res = await applicationRepository.smartApply(job.id, { acknowledgeDuplicate: true });
      if (res.coverLetter) setCoverLetter(res.coverLetter);
      if (res.applyUrl) await Linking.openURL(res.applyUrl);
      Alert.alert('Smart Apply ready', res.complianceNote || 'Apply URL opened.');
    } catch (e) {
      Alert.alert('Smart Apply failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onOutreach = async () => {
    if (!job) return;
    const ok = await confirmDuplicate(job.id);
    if (!ok) return;
    setBusy('outreach');
    try {
      const res = (await applicationRepository.outreachApply(job.id, {
        acknowledgeDuplicate: true,
      })) as { applyUrl?: string; coverLetter?: string; outreach?: { note?: string } };
      if (res.coverLetter) setCoverLetter(res.coverLetter);
      if (res.applyUrl) await Linking.openURL(res.applyUrl);
      Alert.alert('Outreach Apply', res.outreach?.note || 'Completed.');
    } catch (e) {
      Alert.alert('Outreach failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onCoverLetter = async () => {
    if (!job) return;
    setBusy('cover');
    try {
      const content = await aiRepository.coverLetter(job.id);
      setCoverLetter(content);
    } catch (e) {
      Alert.alert('Cover letter failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onSkillGap = async () => {
    if (!job) return;
    setBusy('gap');
    try {
      setSkillGap(await aiRepository.skillGap(job.id));
    } catch (e) {
      Alert.alert('Skill gap failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onTailor = async () => {
    if (!job) return;
    setBusy('tailor');
    try {
      await aiRepository.tailorResume(job.id);
      Alert.alert('Resume tailored', 'ATS resume updated for this role.');
      router.push('/(tabs)/profile');
    } catch (e) {
      Alert.alert('Tailor failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onSave = async () => {
    if (!job) return;
    try {
      await jobRepository.save(job.id);
      Alert.alert('Saved', 'Added to shortlist');
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again');
    }
  };

  if (loading) {
    return (
      <Screen safe edges={['left', 'right']} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen safe edges={['left', 'right']}>
        <Text style={styles.error}>Job not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen safe edges={['left', 'right']}>
      <View style={styles.hero}>
        <Text style={styles.source}>{job.source}</Text>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.meta}>
          {job.company} · {job.location || (job.isRemote ? 'Remote' : 'Onsite')}
        </Text>
        {job.matchScore != null && (
          <Text style={styles.match}>{Math.round(job.matchScore)}% resume match</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Action label="Smart Apply" busy={busy === 'smart'} onPress={onSmartApply} primary />
        <Action label="Outreach Apply" busy={busy === 'outreach'} onPress={onOutreach} />
        <Action label="AI Cover Letter" busy={busy === 'cover'} onPress={onCoverLetter} />
        <Action label="Skill Gap" busy={busy === 'gap'} onPress={onSkillGap} />
        <Action label="Tailor Resume" busy={busy === 'tailor'} onPress={onTailor} />
        <Action label="Save Job" onPress={onSave} />
      </View>

      {coverLetter ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>AI Cover Letter</Text>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(coverLetter);
                Alert.alert('Copied');
              }}
            >
              <Ionicons name="copy-outline" size={18} color={Colors.primaryLight} />
            </Pressable>
          </View>
          <Text style={styles.cover}>{coverLetter}</Text>
        </View>
      ) : null}

      {skillGap ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skill Gap</Text>
          {skillGap.score != null ? (
            <Text style={styles.match}>{Math.round(skillGap.score)}% skill fit</Text>
          ) : null}
          <Text style={styles.body}>Matched: {(skillGap.matched || []).join(', ') || '—'}</Text>
          <Text style={styles.body}>Missing: {(skillGap.missing || []).join(', ') || '—'}</Text>
          {skillGap.summary ? <Text style={styles.body}>{skillGap.summary}</Text> : null}
          {(skillGap.learningRoadmap || []).length > 0 ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={styles.cardTitle}>Learning roadmap</Text>
              {skillGap.learningRoadmap!.map((step) => (
                <View key={step.skill} style={styles.roadmapStep}>
                  <Text style={styles.roadmapSkill}>
                    {step.skill}
                    {step.estimatedHours ? ` · ~${step.estimatedHours}h` : ''}
                  </Text>
                  {step.why ? <Text style={styles.body}>{step.why}</Text> : null}
                  {(step.resources || []).slice(0, 2).map((r) => (
                    <Pressable key={r.url} onPress={() => void Linking.openURL(r.url)}>
                      <Text style={styles.resourceLink}>{r.title}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          <Text style={styles.body}>{job.description || 'No description available.'}</Text>
        </ScrollView>
      </View>
    </Screen>
  );
}

function Action({
  label,
  onPress,
  busy,
  primary,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, primary && styles.actionPrimary]}
      onPress={onPress}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color={primary ? Colors.white : Colors.primaryLight} />
      ) : (
        <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 240 },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  source: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xl },
  meta: { color: Colors.textMuted, fontSize: FontSize.sm },
  match: { color: Colors.success, fontWeight: '800', marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  actionBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '47%',
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  actionPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionText: { color: Colors.text, fontWeight: '700', fontSize: FontSize.xs },
  actionTextPrimary: { color: Colors.white },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg },
  cover: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  roadmapStep: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    gap: 4,
  },
  roadmapSkill: { color: Colors.text, fontWeight: '800', fontSize: FontSize.sm },
  resourceLink: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  error: { color: Colors.danger },
});
