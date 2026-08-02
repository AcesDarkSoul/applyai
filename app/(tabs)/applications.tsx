import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Button, Card, Badge } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { useAutomationStore } from '@/stores/automationStore';
import { getApplications, updateApplicationStatus, deleteApplication, getOutreachEmails } from '@/lib/firebase/profile';
import { exportApplicationsToCSV, syncAllApplicationsToWebhook } from '@/lib/services/trackerExport';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Application, ApplicationStatus, OutreachEmail } from '@/types';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offers' },
  { key: 'rejected', label: 'Rejected' },
];

const TIMELINE_STEPS: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected'];

export default function ApplicationsScreen() {
  const { user } = useAuthStore();
  const { sheetsWebhookUrl, whatsappWebhookUrl, telegramWebhookUrl } = useAutomationStore();
  const [tab, setTab] = useState<'applications' | 'outreach'>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    const uid = user?.uid || 'local_user';
    setLoading(true);
    try {
      const [apps, outreach] = await Promise.all([
        getApplications(uid),
        getOutreachEmails(uid),
      ]);
      setApplications(apps);
      setEmails(outreach);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    await updateApplicationStatus(appId, newStatus);
    loadData();
  };

  const handleDelete = async (app: Application) => {
    Alert.alert('Withdraw Application', `Remove application for ${app.jobTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => { await deleteApplication(app.id); loadData(); } },
    ]);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await exportApplicationsToCSV(applications);
      Alert.alert(res.success ? 'Export Complete ✅' : 'Notice', res.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSyncWebhook = async () => {
    const targetUrl = sheetsWebhookUrl || whatsappWebhookUrl || telegramWebhookUrl;
    if (!targetUrl) {
      Alert.alert('No Webhook Configured', 'Please configure your Google Sheets, WhatsApp, or Telegram Webhook URL in Profile → Configure Webhooks.');
      return;
    }
    setExporting(true);
    try {
      const res = await syncAllApplicationsToWebhook(targetUrl, applications);
      Alert.alert(res.success ? 'Sync Complete 🚀' : 'Notice', res.message);
    } finally {
      setExporting(false);
    }
  };

  const getTimelineProgress = (status: ApplicationStatus) => {
    const index = TIMELINE_STEPS.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  if (loading) {
    return (
      <Screen safe={false} edges={['left', 'right']} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading record tracker...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, tab === 'applications' && styles.tabButtonActive]}
          onPress={() => setTab('applications')}
        >
          <Text style={[styles.tabText, tab === 'applications' && styles.tabTextActive]}>
            📋 Applications ({applications.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'outreach' && styles.tabButtonActive]}
          onPress={() => setTab('outreach')}
        >
          <Text style={[styles.tabText, tab === 'outreach' && styles.tabTextActive]}>
            ✉️ Outreach Log ({emails.length})
          </Text>
        </Pressable>
      </View>

      {/* Batch Export & Webhook Action Buttons */}
      <FadeInView direction="down">
        <Card style={styles.exportBarCard}>
          <Text style={styles.exportBarTitle}>📊 Data Sync & Export</Text>
          <View style={styles.exportBtnRow}>
            <Button
              title="📥 Export CSV"
              variant="outline"
              size="sm"
              loading={exporting}
              onPress={handleExportCSV}
              style={{ flex: 1 }}
            />
            <Button
              title="⚡ Sync Webhooks"
              variant="primary"
              size="sm"
              loading={exporting}
              onPress={handleSyncWebhook}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </FadeInView>

      {tab === 'applications' ? (
        <View>
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((f) => (
              <Pressable
                key={f.key}
                style={[styles.chip, statusFilter === f.key && styles.chipActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {filteredApps.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No applications found</Text>
            </View>
          ) : (
            filteredApps.map((app, index) => {
              const currentStep = getTimelineProgress(app.status);
              return (
                <FadeInView key={app.id} direction="up" delay={index * 40}>
                  <Card style={styles.appCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                        <Text style={styles.companyName}>{app.company}</Text>
                      </View>
                      <Badge
                        text={`${app.matchScore}% Match`}
                        backgroundColor={app.matchScore >= 80 ? Colors.success + '20' : Colors.warning + '20'}
                        color={app.matchScore >= 80 ? Colors.success : Colors.warning}
                      />
                    </View>

                    <View style={styles.timeline}>
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStep;
                        return (
                          <Pressable
                            key={step}
                            style={styles.stepContainer}
                            onPress={() => handleStatusChange(app.id, step)}
                          >
                            <View style={[styles.stepDot, isDone && styles.stepDotDone]}>
                              <Text style={[styles.stepDotText, isDone && styles.stepDotTextDone]}>
                                {isDone ? '✓' : idx + 1}
                              </Text>
                            </View>
                            <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                              {step}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <View style={styles.cardActions}>
                      <Text style={styles.dateText}>
                        Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                      </Text>
                      <Pressable onPress={() => handleDelete(app)}>
                        <Text style={styles.deleteText}>Withdraw</Text>
                      </Pressable>
                    </View>
                  </Card>
                </FadeInView>
              );
            })
          )}
        </View>
      ) : (
        <View>
          {emails.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>✉️</Text>
              <Text style={styles.emptyText}>No outreach emails logged yet</Text>
            </View>
          ) : (
            emails.map((e, index) => (
              <FadeInView key={e.id} direction="up" delay={index * 40}>
                <Card style={styles.appCard}>
                  <Text style={styles.jobTitle}>{e.subject}</Text>
                  <Text style={styles.companyName}>To: {e.recruiterEmail} ({e.company})</Text>
                  <Text style={styles.dateText} numberOfLines={3}>{e.body}</Text>
                </Card>
              </FadeInView>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md },
  tabContainer: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tabButton: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.surfaceLight, alignItems: 'center' },
  tabButtonActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  tabTextActive: { color: Colors.white },
  exportBarCard: { marginBottom: Spacing.md, backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '30', borderWidth: 1 },
  exportBarTitle: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: Spacing.xs },
  exportBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  filterRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceLight },
  chipActive: { backgroundColor: Colors.text },
  chipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  chipTextActive: { color: Colors.white },
  appCard: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  jobTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  companyName: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.borderLight },
  stepContainer: { alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotDone: { backgroundColor: Colors.success },
  stepDotText: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },
  stepDotTextDone: { color: Colors.white },
  stepLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize' },
  stepLabelDone: { color: Colors.success, fontWeight: '700' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  dateText: { color: Colors.textMuted, fontSize: FontSize.xs },
  deleteText: { color: Colors.danger, fontSize: FontSize.xs, fontWeight: '700' },
});
