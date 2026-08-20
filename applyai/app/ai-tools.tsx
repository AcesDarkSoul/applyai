import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { AppTopBar } from '@/components/layout/AppTopBar';
import {
  automationRepository,
  complianceRepository,
  applicationRepository,
  type SmartApplyPlatformPrefs,
} from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function AiToolsScreen() {
  const quota = useSubscriptionStore((s) => s.dailyAutoApplyQuota);
  const [loading, setLoading] = useState(true);
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<SmartApplyPlatformPrefs>({
    linkedin: true,
    indeed: true,
    naukri: true,
    other: true,
  });
  const [policy, setPolicy] = useState('');
  const [audit, setAudit] = useState<Array<{ id: string; action: string; createdAt: string }>>([]);
  const [daily, setDaily] = useState<{ enabled: boolean; running: boolean; lastFinishedAt?: string } | null>(
    null
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, logs, status] = await Promise.all([
        complianceRepository.settings(),
        complianceRepository.auditLog(20),
        automationRepository.dailyStatus(),
      ]);
      setConsentAt(settings.smartApplyConsentAt);
      setPlatforms(settings.smartApplyPlatforms || platforms);
      setPolicy(settings.policy || '');
      setAudit(logs || []);
      setDaily(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI tools');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onConsent = async () => {
    setBusy('consent');
    try {
      await complianceRepository.confirmConsent();
      await load();
      Alert.alert('Consent saved', 'Assistive smart-apply enabled.');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const togglePlatform = async (key: keyof SmartApplyPlatformPrefs) => {
    const next = { ...platforms, [key]: !platforms[key] };
    setPlatforms(next);
    try {
      await complianceRepository.updatePlatforms(next);
    } catch {
      /* keep UI */
    }
  };

  const onDaily = async () => {
    setBusy('daily');
    try {
      await automationRepository.runDailyNow();
      await load();
      Alert.alert('Daily automation', 'Run triggered for your account.');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  const onAutoApply = async () => {
    setBusy('auto');
    try {
      const res = await applicationRepository.autoApply({ minScore: 55, limit: quota });
      Alert.alert(
        'Auto Apply',
        `Applied ${res.applied.length}, skipped ${res.skipped.length}. ${res.complianceNote || ''}`
      );
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
<AppTopBar title="AI Tools" subtitle="Assistive apply stack" />
      <Screen safe edges={['left', 'right', 'bottom']}>
        <View style={styles.hero}>
          <Text style={styles.title}>AI Tools</Text>
          <Text style={styles.body}>
            Consent, platforms, daily auto-apply, and audit — same controls as the web AI Tools page.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assistive consent</Text>
              <Text style={styles.meta}>
                {consentAt ? `Confirmed ${new Date(consentAt).toLocaleString()}` : 'Not confirmed yet'}
              </Text>
              {policy ? <Text style={styles.body}>{policy}</Text> : null}
              <Pressable style={styles.primaryBtn} onPress={() => void onConsent()} disabled={busy === 'consent'}>
                {busy === 'consent' ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Confirm assistive-only consent</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Smart-apply platforms</Text>
              {(['linkedin', 'indeed', 'naukri', 'other'] as const).map((key) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.rowLabel}>{key}</Text>
                  <Switch
                    value={Boolean(platforms[key])}
                    onValueChange={() => void togglePlatform(key)}
                    trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
                  />
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily auto-apply</Text>
              <Text style={styles.meta}>
                {daily?.enabled ? 'Enabled' : 'Disabled'} · {quota} applies/day on your plan
                {daily?.lastFinishedAt
                  ? ` · last run ${new Date(daily.lastFinishedAt).toLocaleString()}`
                  : ''}
              </Text>
              <Pressable style={styles.primaryBtn} onPress={() => void onDaily()} disabled={busy === 'daily'}>
                {busy === 'daily' ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Run daily now</Text>
                )}
              </Pressable>
              <Pressable style={styles.outlineBtn} onPress={() => void onAutoApply()} disabled={busy === 'auto'}>
                {busy === 'auto' ? (
                  <ActivityIndicator color={Colors.primaryLight} />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color={Colors.primaryLight} />
                    <Text style={styles.outlineBtnText}>Run Auto Apply now</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Audit log</Text>
              {audit.length === 0 ? (
                <Text style={styles.meta}>No audit entries yet.</Text>
              ) : (
                audit.slice(0, 8).map((a) => (
                  <View key={a.id} style={styles.auditRow}>
                    <Text style={styles.rowLabel}>{a.action}</Text>
                    <Text style={styles.meta}>{new Date(a.createdAt).toLocaleString()}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 10,
  },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg },
  meta: { color: Colors.textMuted, fontSize: FontSize.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLabel: { color: Colors.text, fontWeight: '700', textTransform: 'capitalize' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
  },
  outlineBtnText: { color: Colors.text, fontWeight: '700' },
  auditRow: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  error: { color: Colors.danger, marginBottom: 8 },
});
