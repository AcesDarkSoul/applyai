import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { AppDrawer } from '@/components/layout/AppDrawer';
import {
  notificationRepository,
  type AppNotification,
  type NotificationPrefs,
} from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailEnabled: true,
    highMatchJobs: true,
    interviewUpdates: true,
    weeklySummary: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationRepository.list();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePref = async (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await notificationRepository.updatePrefs(next);
    } catch {
      // keep optimistic UI
    }
  };

  return (
    <View style={styles.root}>
      <AppDrawer />
      <AppTopBar title="Notifications" subtitle="Push + email alerts" />
      <Screen safe edges={['left', 'right', 'bottom']}>
        <View style={styles.hero}>
          <Ionicons name="notifications" size={22} color={Colors.primaryLight} />
          <Text style={styles.heroMeta}>Module 10 · Push + email alerts</Text>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.body}>
            High-match jobs, interview updates, and weekly summaries — in-app now, email when
            SendGrid/SMTP is configured.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>
          {(
            [
              ['emailEnabled', 'Email digests'],
              ['highMatchJobs', 'New high-match jobs'],
              ['interviewUpdates', 'Interview / status updates'],
              ['weeklySummary', 'Weekly summary'],
            ] as const
          ).map(([key, label]) => (
            <View key={key} style={styles.prefRow}>
              <Text style={styles.prefLabel}>{label}</Text>
              <Switch
                value={Boolean(prefs[key])}
                onValueChange={() => void togglePref(key)}
                trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
        </View>

        <View style={styles.inboxHeader}>
          <Text style={styles.cardTitle}>Inbox</Text>
          <Pressable
            onPress={async () => {
              try {
                await notificationRepository.markAllRead();
                void load();
              } catch {
                /* ignore */
              }
            }}
            style={styles.markAll}
          >
            <Ionicons name="checkmark-done" size={16} color={Colors.primaryLight} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>No notifications yet.</Text>
        ) : (
          items.map((n) => (
            <View key={n.id} style={styles.item}>
              <View style={styles.tags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{n.type}</Text>
                </View>
                {!n.read && (
                  <View style={[styles.tag, styles.tagNew]}>
                    <Text style={styles.tagNewText}>new</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemTitle}>{n.title}</Text>
              <Text style={styles.itemBody}>{n.body}</Text>
              <Pressable
                style={styles.openBtn}
                onPress={async () => {
                  try {
                    await notificationRepository.markRead(n.id);
                    void load();
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Text style={styles.openBtnText}>Open</Text>
              </Pressable>
            </View>
          ))
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
  heroMeta: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg, marginBottom: 8 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  prefLabel: { color: Colors.text, fontWeight: '600' },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.sm },
  item: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  tags: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagNew: { backgroundColor: Colors.primaryTint },
  tagText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  tagNewText: { color: Colors.primaryLight, fontSize: 10, fontWeight: '700' },
  itemTitle: { color: Colors.text, fontWeight: '800' },
  itemBody: { color: Colors.textSecondary, fontSize: FontSize.sm },
  openBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  openBtnText: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  error: { color: Colors.danger },
  empty: { color: Colors.textMuted },
});
