import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { shareToWhatsApp, shareToSMS, openLinkedInWithPost, buildShareMessage } from '@/lib/services/socialShare';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import type { Job } from '@/types';

interface ShareJobModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
}

export function ShareJobModal({ visible, job, onClose }: ShareJobModalProps) {
  if (!job || !visible) return null;

  const handleWhatsApp = async () => {
    onClose();
    await shareToWhatsApp(job);
  };

  const handleSMS = async () => {
    onClose();
    await shareToSMS(job);
  };

  const handleLinkedIn = () => {
    onClose();
    const msg = buildShareMessage(job);
    openLinkedInWithPost(msg, job.url);
  };

  const handleCopy = async () => {
    const msg = buildShareMessage(job);
    await Clipboard.setStringAsync(msg);
    Alert.alert('Copied to Clipboard 📋', 'Job details and apply link copied! You can paste it anywhere.');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <Text style={styles.title}>Share Job Opportunity</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              {/* Job Preview Box */}
              <View style={styles.jobBox}>
                <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
              </View>

              <Text style={styles.prompt}>Select share channel:</Text>

              <View style={styles.shareGrid}>
                {/* WhatsApp */}
                <Pressable style={({ pressed }) => [styles.channelBtn, styles.btnWhatsApp, pressed && styles.pressed]} onPress={handleWhatsApp}>
                  <Text style={styles.channelIcon}>💬</Text>
                  <Text style={styles.channelLabel}>WhatsApp</Text>
                </Pressable>

                {/* Text Msg / SMS */}
                <Pressable style={({ pressed }) => [styles.channelBtn, styles.btnSMS, pressed && styles.pressed]} onPress={handleSMS}>
                  <Text style={styles.channelIcon}>📱</Text>
                  <Text style={styles.channelLabel}>Text Msg (SMS)</Text>
                </Pressable>

                {/* LinkedIn */}
                <Pressable style={({ pressed }) => [styles.channelBtn, styles.btnLinkedIn, pressed && styles.pressed]} onPress={handleLinkedIn}>
                  <Text style={styles.channelIcon}>💼</Text>
                  <Text style={styles.channelLabel}>LinkedIn</Text>
                </Pressable>

                {/* Copy Link */}
                <Pressable style={({ pressed }) => [styles.channelBtn, styles.btnCopy, pressed && styles.pressed]} onPress={handleCopy}>
                  <Text style={styles.channelIcon}>📋</Text>
                  <Text style={[styles.channelLabel, { color: Colors.text }]}>Copy Details</Text>
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
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  jobBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  jobTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  jobCompany: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  prompt: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  channelBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnWhatsApp: {
    backgroundColor: '#25D366',
  },
  btnSMS: {
    backgroundColor: '#34D399',
  },
  btnLinkedIn: {
    backgroundColor: '#0A66C2',
  },
  btnCopy: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  channelIcon: {
    fontSize: 22,
  },
  channelLabel: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
});
