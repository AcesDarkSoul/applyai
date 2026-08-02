import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Badge } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Job } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface AtsOptimizerModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
}

export function AtsOptimizerModal({ visible, job, onClose }: AtsOptimizerModalProps) {
  const { profile } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const candidateSkills = profile?.skills || [];
  
  // Categorize job skills into matched vs missing
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  job.skills.forEach((skill) => {
    const isMatch = candidateSkills.some(
      (cSkill) => cSkill.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(cSkill.toLowerCase())
    );
    if (isMatch) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Generate 3 Tailored Resume Bullet Points incorporating job keywords
  const topJobSkills = job.skills.slice(0, 3).join(', ');
  const tailoredBullets = [
    `• Architected and optimized scalable components utilizing ${topJobSkills || 'modern technical frameworks'}, improving overall application performance by 35%.`,
    `• Spearheaded cross-functional development for ${job.title} initiatives at ${job.company}, implementing robust testing patterns and clean architecture standards.`,
    `• Streamlined API integrations and data processing workflows, reducing latency by 25% while ensuring zero-downtime reliability.`,
  ];

  const fullOptimizedSnippet = `RECOMMENDED RESUME SKILLS FOR ${job.title.toUpperCase()}:\nMatched: ${matchedSkills.join(', ') || 'General'}\nMissing ATS Keywords to add: ${missingSkills.join(', ') || 'None'}\n\nTAILORED RESUME BULLET POINTS:\n${tailoredBullets.join('\n')}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(fullOptimizedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎯 Tailored ATS Resume Optimizer</Text>
              <Text style={styles.subtitle}>Optimized for {job.title} at {job.company}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll}>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>1. ATS Keyword Comparison</Text>
              <Text style={styles.sectionDesc}>Skills detected in job description vs your saved candidate profile:</Text>

              {matchedSkills.length > 0 && (
                <View style={styles.chipGroup}>
                  <Text style={styles.chipLabel}>✓ Matched Skills ({matchedSkills.length}):</Text>
                  <View style={styles.chips}>
                    {matchedSkills.map((s) => (
                      <Badge key={s} text={s} backgroundColor={Colors.success + '20'} color={Colors.success} />
                    ))}
                  </View>
                </View>
              )}

              {missingSkills.length > 0 ? (
                <View style={styles.chipGroup}>
                  <Text style={styles.chipLabel}>⚠️ Missing Keywords to Add ({missingSkills.length}):</Text>
                  <View style={styles.chips}>
                    {missingSkills.map((s) => (
                      <Badge key={s} text={`+ ${s}`} backgroundColor={Colors.secondary + '25'} color={Colors.secondaryDark} />
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.perfectMatchText}>🌟 Perfect Match! Your profile includes all primary job skills.</Text>
              )}
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Tailored Resume Bullet Points</Text>
              <Text style={styles.sectionDesc}>Copy these AI-optimized bullet points into your resume experience section:</Text>
              <View style={styles.bulletsBox}>
                {tailoredBullets.map((bullet, idx) => (
                  <Text key={idx} style={styles.bulletText}>{bullet}</Text>
                ))}
              </View>
            </Card>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              title={copied ? '✓ Copied ATS Snippet!' : '📋 Copy Optimized Resume Snippet'}
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
  scroll: {
    maxHeight: 400,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  chipGroup: {
    marginBottom: Spacing.sm,
  },
  chipLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  perfectMatchText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  bulletsBox: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  bulletText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
