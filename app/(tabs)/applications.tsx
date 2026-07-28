import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Card, Badge, SectionHeader, Button } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { getApplications, deleteApplication, updateApplicationStatus, getOutreachEmails } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Application, ApplicationStatus, OutreachEmail } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: Colors.secondaryDark, bg: Colors.secondary + '30' },
  applied: { label: 'Applied', color: Colors.info, bg: '#DBEAFE' },
  viewed: { label: 'Viewed', color: Colors.primary, bg: Colors.primary + '15' },
  interview: { label: 'Interview', color: Colors.success, bg: Colors.primary + '20' },
  offer: { label: 'Offer', color: '#7C3AED', bg: '#EDE9FE' },
  accepted: { label: 'Accepted', color: Colors.success, bg: Colors.primary + '25' },
  rejected: { label: 'Rejected', color: Colors.danger, bg: '#FEE2E2' },
};

const TIMELINE_STEPS: ApplicationStatus[] = ['applied', 'viewed', 'interview', 'offer', 'accepted'];

const FILTER_STATUSES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'pending', label: 'Pending' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offers' },
];

type Tab = 'applications' | 'outreach';

export default function ApplicationsScreen() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const uid = user?.uid || 'local_user';
    setLoading(true);
    try {
      const [apps, outreach] = await Promise.all([
        getApplications(uid),
        user ? getOutreachEmails(user.uid) : Promise.resolve([]),
      ]);
      setApplications(apps);
      setEmails(outreach);
    } catch (e) {
      console.warn('Failed to load tracker data', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateStatus = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(app.id, newStatus);
      await loadData();
    } catch (err) {
      console.warn('Failed to update status', err);
    }
  };

  const handleDelete = (app: Application) => {
    Alert.alert('Withdraw Application', `Remove application for ${app.jobTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => { await deleteApplication(app.id); loadData(); } },
    ]);
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
            ✉️ Outreach ({emails.length})
          </Text>
        </Pressable>
      </View>

      {tab === 'applications' ? (
        applications.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No application records yet</Text>
            <Text style={styles.emptyText}>
              When you apply to jobs on LinkedIn, Indeed, or Naukri via Smart Apply, your applications will automatically be tracked here.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
              {FILTER_STATUSES.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.statusChip, statusFilter === f.key && styles.statusChipActive]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text style={[styles.statusChipText, statusFilter === f.key && styles.statusChipTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <SectionHeader title="Application Records" subtitle={`${filteredApps.length} shown`} />
            <ResponsiveGrid>
              {filteredApps.map((app, i) => {
                const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                const progress = getTimelineProgress(app.status);
                return (
                  <FadeInView key={app.id} direction="up" delay={Math.min(i * 50, 400)}>
                    <Card style={styles.card}>
                      <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.title}>{app.jobTitle}</Text>
                          <Text style={styles.company}>{app.company}</Text>
                        </View>
                        <Badge text={statusConfig.label} backgroundColor={statusConfig.bg} color={statusConfig.color} />
                      </View>

                      {/* Interactive Progress Timeline */}
                      <View style={styles.timeline}>
                        {TIMELINE_STEPS.map((step, index) => (
                          <View key={step} style={styles.timelineStep}>
                            <View style={[styles.timelineDot, index <= progress && styles.timelineDotActive]} />
                            {index < TIMELINE_STEPS.length - 1 && (
                              <View style={[styles.timelineLine, index < progress && styles.timelineLineActive]} />
                            )}
                          </View>
                        ))}
                      </View>
                      <View style={styles.timelineLabels}>
                        {['Applied', 'Viewed', 'Interview', 'Offer', 'Accepted'].map((label) => (
                          <Text key={label} style={styles.timelineLabel}>{label}</Text>
                        ))}
                      </View>

                      {/* Status Quick Update */}
                      <View style={styles.statusUpdateRow}>
                        <Text style={styles.statusUpdateLabel}>Update Status:</Text>
                        <View style={styles.statusBtns}>
                          {app.status === 'pending' && (
                            <Pressable style={styles.quickStatusBtn} onPress={() => handleUpdateStatus(app, 'applied')}>
                              <Text style={styles.quickStatusText}>Mark Applied</Text>
                            </Pressable>
                          )}
                          {app.status !== 'interview' && app.status !== 'offer' && app.status !== 'accepted' && (
                            <Pressable style={styles.quickStatusBtn} onPress={() => handleUpdateStatus(app, 'interview')}>
                              <Text style={styles.quickStatusText}>Interview 🎯</Text>
                            </Pressable>
                          )}
                          {app.status === 'interview' && (
                            <Pressable style={styles.quickStatusBtn} onPress={() => handleUpdateStatus(app, 'offer')}>
                              <Text style={styles.quickStatusText}>Received Offer 🎉</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>

                      <View style={styles.footer}>
                        <Text style={styles.matchText}>Match: {app.matchScore}%</Text>
                        <Text style={styles.dateText}>
                          {app.appliedAt ? formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true }) : 'Recently'}
                        </Text>
                      </View>
                      <Pressable style={styles.withdrawButton} onPress={() => handleDelete(app)}>
                        <Text style={styles.withdrawText}>Remove Record</Text>
                      </Pressable>
                    </Card>
                  </FadeInView>
                );
              })}
            </ResponsiveGrid>
          </>
        )
      ) : (
        emails.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyTitle}>No outreach emails sent yet</Text>
            <Text style={styles.emptyText}>Use Recruiter Outreach on any job detail screen to compose and send emails.</Text>
          </View>
        ) : (
          <>
            <SectionHeader title="Recruiter Outreach History" subtitle={`${emails.length} emails sent`} />
            <ResponsiveGrid>
              {emails.map((email, i) => (
                <FadeInView key={email.id} direction="up" delay={Math.min(i * 50, 400)}>
                  <Card style={styles.card}>
                    <View style={styles.header}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{email.subject}</Text>
                        <Text style={styles.company}>To: {email.recruiterName ? `${email.recruiterName} (${email.recruiterEmail})` : email.recruiterEmail}</Text>
                        <Text style={styles.emailRole}>Role: {email.jobTitle} at {email.company}</Text>
                      </View>
                      <Badge text={email.status.toUpperCase()} backgroundColor={Colors.success + '20'} color={Colors.success} />
                    </View>
                    <Text style={styles.emailBodyPreview} numberOfLines={3}>{email.body}</Text>
                    <View style={styles.footer}>
                      <Text style={styles.dateText}>
                        {email.sentAt ? formatDistanceToNow(new Date(email.sentAt), { addSuffix: true }) : 'Recently'}
                      </Text>
                    </View>
                  </Card>
                </FadeInView>
              ))}
            </ResponsiveGrid>
          </>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.xl, padding: 4, marginBottom: Spacing.md },
  tabButton: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.lg },
  tabButtonActive: { backgroundColor: Colors.white },
  tabText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  tabTextActive: { color: Colors.primary, fontWeight: '800' },
  statusFilters: { marginBottom: Spacing.md },
  statusChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.xs },
  statusChipActive: { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
  statusChipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  statusChipTextActive: { color: Colors.primary, fontWeight: '800' },
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  company: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  emailRole: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  emailBodyPreview: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm, backgroundColor: Colors.surfaceLight, padding: Spacing.sm, borderRadius: BorderRadius.md },
  timeline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, paddingHorizontal: Spacing.xs },
  timelineStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceLight },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceLight },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  timelineLabel: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', flex: 1 },
  statusUpdateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.xs, flexWrap: 'wrap' },
  statusUpdateLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  statusBtns: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  quickStatusBtn: { backgroundColor: Colors.primary + '12', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.md },
  quickStatusText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  matchText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  dateText: { color: Colors.textMuted, fontSize: FontSize.sm },
  withdrawButton: { alignSelf: 'flex-end', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  withdrawText: { color: Colors.danger, fontSize: FontSize.xs, fontWeight: '600' },
});
