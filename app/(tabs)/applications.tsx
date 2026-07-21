import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Card, Badge, SectionHeader } from '@/components/ui';
import { Screen, ResponsiveGrid } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { getApplications, deleteApplication } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import type { Application, ApplicationStatus } from '@/types';

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

export default function ApplicationsScreen() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getApplications(user.uid);
    setApplications(data);
    setLoading(false);
  };

  useEffect(() => { loadApplications(); }, [user]);

  const handleDelete = (app: Application) => {
    Alert.alert('Withdraw Application', `Remove application for ${app.jobTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => { await deleteApplication(app.id); loadApplications(); } },
    ]);
  };

  const getTimelineProgress = (status: ApplicationStatus) => {
    const index = TIMELINE_STEPS.indexOf(status);
    return index >= 0 ? index : 0;
  };

  if (loading) {
    return (
      <Screen safe={false} edges={['left', 'right']} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading applications...</Text>
        </View>
      </Screen>
    );
  }

  if (applications.length === 0) {
    return (
      <Screen safe={false} edges={['left', 'right']} contentStyle={styles.center}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptyText}>Browse jobs and apply to start tracking your applications here.</Text>
      </Screen>
    );
  }

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <SectionHeader title="Your Applications" subtitle={`${applications.length} total`} />
      <ResponsiveGrid>
        {applications.map((app, i) => {
          const statusConfig = STATUS_CONFIG[app.status];
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
                <View style={styles.footer}>
                  <Text style={styles.matchText}>Match: {app.matchScore}%</Text>
                  <Text style={styles.dateText}>
                    {app.appliedAt ? formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true }) : 'Recently'}
                  </Text>
                </View>
                <Pressable style={styles.withdrawButton} onPress={() => handleDelete(app)}>
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </Pressable>
              </Card>
            </FadeInView>
          );
        })}
      </ResponsiveGrid>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  title: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  company: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  timeline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, paddingHorizontal: Spacing.xs },
  timelineStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceLight },
  timelineDotActive: { backgroundColor: Colors.primary },
  timelineLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceLight },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  timelineLabel: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  matchText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  dateText: { color: Colors.textMuted, fontSize: FontSize.sm },
  withdrawButton: { alignSelf: 'flex-end', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  withdrawText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' },
});
