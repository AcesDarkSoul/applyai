import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { applicationRepository, jobRepository, type ApiJob } from '@/lib/api/repositories';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

type SourceFilter = 'all' | 'naukri' | 'indeed' | 'other';

const FILTERS: Array<{ id: SourceFilter; label: string; color: string }> = [
  { id: 'all', label: 'All boards', color: Colors.primary },
  { id: 'naukri', label: 'Naukri', color: Colors.accent },
  { id: 'indeed', label: 'Indeed', color: Colors.secondary },
  { id: 'other', label: 'Other', color: Colors.warning },
];

export default function JobsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const quota = useSubscriptionStore((s) => s.dailyAutoApplyQuota);
  const resumeQuery = profile?.title || (profile?.skills || []).slice(0, 3).join(' ') || '';

  const [q, setQ] = useState('');
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [source, setSource] = useState<SourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [assistiveChecked, setAssistiveChecked] = useState(false);
  const [applying, setApplying] = useState(false);
  const [autoResult, setAutoResult] = useState<string | null>(null);
  const [topMatch, setTopMatch] = useState(0);

  const load = useCallback(async (query = '', matchedOnly = !query) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        matchedOnly && !query.trim()
          ? await jobRepository.board('', { minScore: 40 })
          : await jobRepository.board(query);
      setJobs(data);
      const best = data.reduce((m, j) => Math.max(m, j.matchScore ?? 0), 0);
      setTopMatch(Math.round(best));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('', true);
  }, [load, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      void load(q, !q.trim());
    }, [load, q])
  );

  const counts = useMemo(() => {
    const c = { all: jobs.length, naukri: 0, indeed: 0, other: 0 };
    for (const j of jobs) {
      const s = (j.source || '').toLowerCase();
      if (s.includes('naukri')) c.naukri += 1;
      else if (s.includes('indeed')) c.indeed += 1;
      else c.other += 1;
    }
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    if (source === 'all') return jobs;
    return jobs.filter((j) => {
      const s = (j.source || '').toLowerCase();
      if (source === 'naukri') return s.includes('naukri');
      if (source === 'indeed') return s.includes('indeed');
      return !s.includes('naukri') && !s.includes('indeed');
    });
  }, [jobs, source]);

  const onAutoApply = async () => {
    if (!assistiveChecked) {
      Alert.alert('Consent required', 'Confirm assistive-only auto-apply to continue.');
      return;
    }
    setApplying(true);
    setAutoResult(null);
    try {
      const res = await applicationRepository.autoApply({ minScore: 55, limit: quota });
      setAutoResult(
        `Applied to ${res.applied.length} roles · skipped ${res.skipped.length}. ${res.complianceNote || ''}`
      );
      for (const url of res.applyUrls || []) {
        // URLs opened from detail / web; list summary is enough on mobile
      }
      await load(q, !q.trim());
    } catch (e) {
      Alert.alert('Auto-apply failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setApplying(false);
    }
  };

  const onSave = async (job: ApiJob) => {
    try {
      await jobRepository.save(job.id);
      Alert.alert('Saved', `${job.title} added to shortlist`);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not save');
    }
  };

  return (
    <Screen safe edges={['left', 'right']}>
      <FadeInView direction="down">
        <View style={styles.hero}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live matching to your resume.</Text>
          </View>
          <Text style={styles.title}>Find Jobs</Text>
          <Text style={styles.body}>
            Ranked for {resumeQuery || 'your profile'} — best matches first, with AI cover letters on
            apply.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="briefcase-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.badgeText}>{jobs.length} roles</Text>
            </View>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={styles.badgeGreenText}>Top match {topMatch}%</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={`Search or leave blank for "${resumeQuery.slice(0, 18) || 'matches'}…"`}
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              onSubmitEditing={() => void load(q, !q.trim())}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryBtn} onPress={() => void load(q, false)}>
              <Text style={styles.primaryBtnText}>Search</Text>
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={() => void load('', true)}>
              <Ionicons name="sparkles" size={16} color={Colors.primaryLight} />
              <Text style={styles.outlineBtnText}>Best Matches</Text>
            </Pressable>
          </View>

          <Pressable style={styles.autoBtn} onPress={() => setAutoOpen(true)}>
            <Ionicons name="flash" size={18} color={Colors.white} />
            <Text style={styles.autoBtnText}>Auto Apply</Text>
          </Pressable>
        </View>
      </FadeInView>

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setSource(f.id)}
            style={[
              styles.chip,
              source === f.id && { backgroundColor: f.color, borderColor: f.color },
            ]}
          >
            <Text style={[styles.chipText, source === f.id && styles.chipTextActive]}>
              {f.label} ({f.id === 'all' ? counts.all : counts[f.id]})
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.summary}>
        {filtered.length} roles · sorted by resume match
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No jobs found. Try Best Matches or another query.</Text>
      ) : (
        filtered.map((job, i) => (
          <FadeInView key={job.id} delay={Math.min(i * 30, 240)}>
            <Pressable style={styles.card} onPress={() => router.push(`/job/${job.id}`)}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{job.company.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {job.title}
                  </Text>
                  <Text style={styles.company}>
                    {job.company} · {job.location || 'Remote'}
                  </Text>
                </View>
                <Text style={styles.match}>{Math.round(job.matchScore ?? 0)}%</Text>
              </View>
              <View style={styles.cardActions}>
                <View style={styles.sourceChip}>
                  <Text style={styles.sourceText}>{job.source}</Text>
                </View>
                <Pressable onPress={() => void onSave(job)}>
                  <Text style={styles.saveLink}>Save</Text>
                </Pressable>
              </View>
            </Pressable>
          </FadeInView>
        ))
      )}

      <Modal visible={autoOpen} transparent animationType="fade" onRequestClose={() => setAutoOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Auto Apply</Text>
            <Text style={styles.modalBody}>
              Assistive auto-apply ranks board jobs to your resume (up to {quota} today on your plan), drafts cover
              letters, and opens apply URLs. You confirm each platform action — no silent portal submissions.
            </Text>
            <View style={styles.consentRow}>
              <Switch
                value={assistiveChecked}
                onValueChange={setAssistiveChecked}
                trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              />
              <Text style={styles.consentText}>I confirm assistive-only auto-apply</Text>
            </View>
            {autoResult ? <Text style={styles.autoResult}>{autoResult}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.outlineBtn} onPress={() => setAutoOpen(false)}>
                <Text style={styles.outlineBtnText}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, applying && { opacity: 0.6 }]}
                disabled={applying}
                onPress={() => void onAutoApply()}
              >
                {applying ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Run Auto Apply</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeGreenText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 4,
  },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.sm },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800' },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
  },
  outlineBtnText: { color: Colors.text, fontWeight: '700' },
  autoBtn: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryDark,
  },
  autoBtnText: { color: Colors.white, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.xs },
  chipTextActive: { color: Colors.white },
  summary: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primaryLight, fontWeight: '800' },
  jobTitle: { color: Colors.text, fontWeight: '800' },
  company: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  match: { color: Colors.primaryLight, fontWeight: '800' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sourceChip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  sourceText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  saveLink: { color: Colors.primaryLight, fontWeight: '700' },
  error: { color: Colors.danger },
  empty: { color: Colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: 12,
  },
  modalTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xl },
  modalBody: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consentText: { color: Colors.text, flex: 1, fontWeight: '600', fontSize: FontSize.sm },
  autoResult: { color: Colors.success, fontSize: FontSize.sm },
  modalActions: { flexDirection: 'row', gap: 8 },
});
