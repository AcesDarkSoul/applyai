import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { detectPlatform, getPlatformConfig } from '@/lib/services/platforms';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import type { Job, ApplicationStatus } from '@/types';

interface RecordApplicationModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onConfirmStatus: (status: ApplicationStatus) => void;
}

export function RecordApplicationModal({
  visible,
  job,
  onClose,
  onConfirmStatus,
}: RecordApplicationModalProps) {
  if (!job || !visible) return null;

  const platform = detectPlatform(job.url, job.source);
  const pConfig = getPlatformConfig(platform);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Header Badge */}
              <View style={styles.headerRow}>
                <View style={[styles.platformIconBg, { backgroundColor: pConfig.color + '20' }]}>
                  <Text style={styles.platformIcon}>{pConfig.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.platformLabel, { color: pConfig.color }]}>
                    {pConfig.name} Application
                  </Text>
                  <Text style={styles.headerSubtitle}>Record Management</Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              {/* Job Info */}
              <View style={styles.jobBox}>
                <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
                {job.matchScore && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchText}>🎯 {job.matchScore.overall}% Match</Text>
                  </View>
                )}
              </View>

              {/* Question */}
              <View style={styles.promptSection}>
                <Text style={styles.questionText}>Did you complete your application?</Text>
                <Text style={styles.subtext}>
                  We launched {pConfig.name}'s page for this role. Keeping accurate records helps track your interview pipeline!
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionGroup}>
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnApplied, pressed && styles.btnPressed]}
                  onPress={() => onConfirmStatus('applied')}
                >
                  <Text style={styles.btnAppliedText}>🎉 Yes, I Applied</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnPending, pressed && styles.btnPressed]}
                  onPress={() => onConfirmStatus('pending')}
                >
                  <Text style={styles.btnPendingText}>⏳ Save as Pending</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.btn, styles.btnDismiss, pressed && styles.btnPressed]}
                  onPress={onClose}
                >
                  <Text style={styles.btnDismissText}>Dismiss / Not Yet</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  platformIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformIcon: {
    fontSize: 22,
  },
  platformLabel: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  jobBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  jobTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    lineHeight: 22,
  },
  jobCompany: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  matchText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  promptSection: {
    marginBottom: Spacing.lg,
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.sm,
  },
  btn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnApplied: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  btnAppliedText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  btnPending: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.secondaryDark + '40',
  },
  btnPendingText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  btnDismiss: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnDismissText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
