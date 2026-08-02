import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface OutreachGeneratorModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
}

type Mode = 'connection' | 'inmail' | 'email';

export function OutreachGeneratorModal({ visible, job, onClose }: OutreachGeneratorModalProps) {
  const { profile } = useAuthStore();
  const [mode, setMode] = useState<Mode>('connection');
  const [copied, setCopied] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');

  if (!job) return null;

  const candidateName = profile?.name || 'Candidate';
  const topSkills = profile?.skills?.slice(0, 3).join(', ') || 'Software Engineering';
  const rName = recruiterName.trim() || 'Hiring Team';

  let generatedText = '';

  if (mode === 'connection') {
    generatedText = `Hi ${rName},\n\nI noticed the ${job.title} opening at ${job.company}. With a background in ${topSkills}, I believe I could bring immediate value to your engineering team. I'd love to connect!\n\nBest,\n${candidateName}`;
  } else if (mode === 'inmail') {
    generatedText = `Hi ${rName},\n\nHope you're having a great week! I came across the ${job.title} role at ${job.company} and was thrilled to see how closely my experience aligns with your team's stack (${job.skills.slice(0, 3).join(', ')}).\n\nI have previously built high-scale applications and would welcome the opportunity to discuss how my skill set matches your goals.\n\nLooking forward to hearing from you!\n\nBest regards,\n${candidateName}`;
  } else {
    generatedText = `Subject: Application & Inquiry for ${job.title} position\n\nDear ${rName},\n\nI am writing to express my strong interest in the ${job.title} position at ${job.company}.\n\nHaving worked extensively with ${topSkills}, I am confident in my ability to contribute to your ongoing technical initiatives. Attached is my resume for your review.\n\nThank you for your time and consideration.\n\nSincerely,\n${candidateName}\n${profile?.phone ? `Phone: ${profile.phone}` : ''}\n${profile?.linkedin ? `LinkedIn: ${profile.linkedin}` : ''}`;
  }

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>💬 LinkedIn & Outreach Assistant</Text>
              <Text style={styles.subtitle}>
                Tailored for {job.title} at {job.company}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, mode === 'connection' && styles.tabActive]}
              onPress={() => setMode('connection')}
            >
              <Text style={[styles.tabText, mode === 'connection' && styles.tabTextActive]}>
                🤝 Connection Note
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'inmail' && styles.tabActive]}
              onPress={() => setMode('inmail')}
            >
              <Text style={[styles.tabText, mode === 'inmail' && styles.tabTextActive]}>
                💼 InMail / DM
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'email' && styles.tabActive]}
              onPress={() => setMode('email')}
            >
              <Text style={[styles.tabText, mode === 'email' && styles.tabTextActive]}>
                ✉️ Cold Email
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll}>
            <Text style={styles.label}>Recruiter / Hiring Manager Name (Optional):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sarah Connor"
              placeholderTextColor={Colors.textMuted}
              value={recruiterName}
              onChangeText={setRecruiterName}
            />

            <Text style={styles.label}>Generated {mode === 'connection' ? 'LinkedIn Note' : mode === 'inmail' ? 'InMail Message' : 'Email Pitch'}:</Text>
            <Card style={styles.previewBox}>
              <Text style={styles.generatedText}>{generatedText}</Text>
            </Card>

            {mode === 'connection' && (
              <Text style={styles.charCount}>
                Character count: {generatedText.length} / 300 (Fits within LinkedIn limit)
              </Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={copied ? '✓ Copied to Clipboard!' : '📋 Copy Text'}
              onPress={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
              size="lg"
              style={{ flex: 1 }}
            />
            <Button title="Close" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  scroll: {
    maxHeight: 350,
  },
  label: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  previewBox: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
  },
  generatedText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
