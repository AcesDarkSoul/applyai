import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import {
  applicationRepository,
  type ApiApplication,
  type AppStats,
} from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        applicationRepository.list(),
        applicationRepository.stats(),
      ]);
      setApplications(list);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSync = async () => {
    setSyncing(true);
    try {
      const res = await applicationRepository.syncStatuses();
      Alert.alert(
        'Auto-sync complete',
        `Checked ${res.checked}, updated ${res.updated.length}, unchanged ${res.unchanged}.`
      );
      await load();
    } catch (e) {
      Alert.alert('Sync failed', e instanceof Error ? e.message : 'Could not sync');
    } finally {
      setSyncing(false);
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

  return (
    <Screen safe edges={['left', 'right']}>
      <View style={styles.hero}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Outreach + cover letters in one place.</Text>
        </View>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.body}>
          Track every apply — status updates and AI cover letters stay with each role. Auto-sync
          advances Applied → Viewed → Interview using timeline heuristics.
        </Text>
        <View style={styles.chips}>
          <Chip label={`Total: ${stats?.total ?? applications.length}`} />
          <Chip label={`Applied: ${stats?.applied ?? 0}`} />
          <Chip label={`Interviews: ${stats?.interviews ?? 0}`} />
          <Chip label={`Cover letters: ${stats?.coverLetters ?? 0}`} />
        </View>
        <Pressable style={styles.syncBtn} onPress={() => void onSync()} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.syncBtnText}>Auto-sync statuses</Text>
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {applications.length === 0 ? (
        <Text style={styles.empty}>No applications yet. Apply from Find Jobs to start tracking.</Text>
      ) : (
        applications.map((app, i) => (
          <FadeInView key={app.id} direction="up" delay={Math.min(i * 40, 300)}>
            <View style={styles.card}>
              <Text style={styles.jobTitle}>{app.jobTitle}</Text>
              <Text style={styles.meta}>
                {app.company}
                {app.source ? ` · ${app.source}` : ''}
              </Text>
              <View style={styles.tagRow}>
                <Pressable
                  style={styles.statusChip}
                  onPress={() => {
                    const next = ['applied', 'viewed', 'interview', 'offer', 'rejected'] as const;
                    Alert.alert(
                      'Update status',
                      'Choose a status',
                      next.map((status) => ({
                        text: status,
                        onPress: () => {
                          void applicationRepository
                            .updateStatus(app.id, status)
                            .then(() => load())
                            .catch((e) =>
                              Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again')
                            );
                        },
                      })).concat([{ text: 'Cancel', style: 'cancel' } as never])
                    );
                  }}
                >
                  <Text style={styles.statusText}>{app.status}</Text>
                </Pressable>
                <Pressable
                  style={styles.coverChip}
                  onPress={() => setExpandedId(expandedId === app.id ? null : app.id)}
                >
                  <Text style={styles.coverText}>AI cover letter</Text>
                </Pressable>
              </View>
              {app.syncNote ? (
                <Text style={styles.syncNote}>sync: {app.syncNote}</Text>
              ) : null}
              {app.updatedAt ? (
                <Text style={styles.syncedAt}>Synced {new Date(app.updatedAt).toLocaleString()}</Text>
              ) : null}
              {expandedId === app.id && app.coverLetter ? (
                <Text style={styles.coverBody}>{app.coverLetter}</Text>
              ) : null}
            </View>
          </FadeInView>
        ))
      )}
    </Screen>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
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
    gap: 8,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '700' },
  syncBtn: {
    marginTop: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  syncBtnText: { color: Colors.background, fontWeight: '800' },
  error: { color: Colors.danger, marginBottom: 8 },
  empty: { color: Colors.textMuted },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  jobTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.md },
  meta: { color: Colors.textMuted, fontSize: FontSize.xs },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusChip: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { color: Colors.info, fontWeight: '700', fontSize: FontSize.xs, textTransform: 'capitalize' },
  coverChip: {
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  coverText: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  syncNote: {
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: Colors.textMuted,
    fontSize: 10,
    overflow: 'hidden',
  },
  syncedAt: { color: Colors.textMuted, fontSize: 10 },
  coverBody: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
