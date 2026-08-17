import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView, AnimatedProgress } from '@/components/AnimatedView';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { profileRepository, type ApiUserProfile } from '@/lib/api/repositories';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function pickWebResumeFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept =
      '.pdf,.doc,.docx,.txt,.md,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => finish(null));
    input.click();
  });
}

export default function ResumeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { profile, refreshProfile, user } = useAuthStore();
  const { refresh: refreshLocalResume } = useResumeStore();
  const [apiProfile, setApiProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 260 },
        hero: {
          borderRadius: BorderRadius.xxl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: isWide ? Spacing.xl : Spacing.lg,
          marginBottom: Spacing.md,
          overflow: 'hidden',
          ...Shadows.md,
        },
        heroEyebrow: {
          color: colors.primaryLight,
          fontWeight: '800',
          fontSize: FontSize.xs,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        heroTitle: {
          color: colors.text,
          fontWeight: '800',
          fontSize: isWide ? FontSize.xxl : FontSize.xl,
          letterSpacing: -0.4,
          marginTop: 6,
        },
        heroBody: {
          color: colors.textSecondary,
          fontSize: FontSize.sm,
          lineHeight: 21,
          marginTop: 8,
          maxWidth: 520,
        },
        heroRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: Spacing.md,
          alignItems: 'center',
        },
        atsCard: {
          backgroundColor: colors.card,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: Spacing.md,
          marginBottom: Spacing.md,
          gap: 10,
          ...Shadows.card,
        },
        atsHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        atsTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.lg },
        atsScore: { color: colors.primaryLight, fontWeight: '800', fontSize: FontSize.xl },
        atsHint: { color: colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
        grid: {
          flexDirection: isWide ? 'row' : 'column',
          gap: Spacing.md,
          marginBottom: Spacing.md,
        },
        card: {
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: Spacing.md,
          gap: 12,
          ...Shadows.card,
        },
        cardIcon: {
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryTint,
        },
        cardTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.lg },
        cardBody: { color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
        uploadBtn: {
          borderRadius: BorderRadius.lg,
          overflow: 'hidden',
          minHeight: 50,
        },
        uploadInner: {
          minHeight: 50,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        uploadText: { color: colors.white, fontWeight: '800', fontSize: FontSize.sm },
        fileChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: BorderRadius.lg,
          backgroundColor: colors.surfaceLight,
          borderWidth: 1,
          borderColor: colors.border,
        },
        fileText: { flex: 1, color: colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
        tip: {
          color: colors.textSecondary,
          fontSize: FontSize.sm,
          lineHeight: 20,
          paddingLeft: 4,
        },
        linkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: 14,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: Spacing.xl,
        },
        linkTextWrap: { flex: 1, gap: 2 },
        linkTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.sm },
        linkSub: { color: colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
      }),
    [colors, isWide]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await profileRepository.me();
      setApiProfile(me);
    } catch {
      setApiProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onUpload = async () => {
    try {
      let payload: Blob | { uri: string; name: string; mimeType?: string };
      if (Platform.OS === 'web') {
        const webFile = await pickWebResumeFile();
        if (!webFile) return;
        if (webFile.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Resume must be under 10 MB');
          return;
        }
        payload = webFile;
      } else {
        const picked = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (picked.canceled || !picked.assets?.[0]) return;
        const asset = picked.assets[0];
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Resume must be under 10 MB');
          return;
        }
        payload = {
          uri: asset.uri,
          name: asset.name || 'resume.pdf',
          mimeType: asset.mimeType || 'application/pdf',
        };
      }
      setUploading(true);
      const result = await profileRepository.uploadResume(payload);
      setApiProfile(result.profile);
      await refreshProfile();
      await refreshLocalResume();
      Alert.alert('Resume uploaded', 'Your resume was parsed and saved.');
      await load();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setUploading(false);
    }
  };

  const onOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await profileRepository.optimizeResume({
        jobTitle: apiProfile?.title || profile?.title,
      });
      setApiProfile(res.profile);
      setTips(res.tips || []);
      await refreshProfile();
      Alert.alert('ATS optimize done', 'Resume optimized for ATS parsing.');
      await load();
    } catch (e) {
      Alert.alert('Optimize failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <Screen safe edges={['left', 'right']} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const ats = apiProfile?.atsScore ?? profile?.atsScore ?? 0;
  const fileName = apiProfile?.resumeFileName;
  const hasResume = Boolean(fileName || profile?.hasResume);

  return (
    <Screen safe edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient
          colors={['rgba(91,92,226,0.28)', 'rgba(20,184,166,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { backgroundColor: colors.card }]}
        >
          <Text style={styles.heroEyebrow}>Resume studio</Text>
          <Text style={styles.heroTitle}>Make your resume match-ready</Text>
          <Text style={styles.heroBody}>
            Upload any file up to 10 MB, check your ATS score, and optimize for the roles you want.
          </Text>
          <View style={styles.heroRow}>
            <Pressable
              onPress={() => void onUpload()}
              disabled={uploading}
              style={styles.uploadBtn}
            >
              <LinearGradient colors={[...colors.gradientBrand]} style={styles.uploadInner}>
                {uploading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                    <Text style={styles.uploadText}>
                      {hasResume ? 'Replace resume' : 'Upload resume'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </FadeInView>

      <FadeInView delay={80}>
        <View style={styles.atsCard}>
          <View style={styles.atsHeader}>
            <View>
              <Text style={styles.atsTitle}>ATS score</Text>
              <Text style={styles.atsHint}>Higher scores parse cleaner for recruiters</Text>
            </View>
            <Text style={styles.atsScore}>{ats || '—'}</Text>
          </View>
          <AnimatedProgress progress={Number(ats) || 0} color={colors.primary} height={10} />
        </View>
      </FadeInView>

      <View style={styles.grid}>
        <FadeInView delay={120} style={{ flex: 1 }}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.primaryLight} />
            </View>
            <Text style={styles.cardTitle}>Current file</Text>
            <Text style={styles.cardBody}>
              Keep one strong master resume. We’ll use it for match ranking and apply flows.
            </Text>
            {hasResume ? (
              <View style={styles.fileChip}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.fileText} numberOfLines={1}>
                  {fileName || 'Resume on file'}
                </Text>
              </View>
            ) : (
              <View style={styles.fileChip}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                <Text style={styles.fileText}>No resume uploaded yet</Text>
              </View>
            )}
          </View>
        </FadeInView>

        <FadeInView delay={180} style={{ flex: 1 }}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name="sparkles-outline" size={20} color={colors.primaryLight} />
            </View>
            <Text style={styles.cardTitle}>ATS optimize</Text>
            <Text style={styles.cardBody}>
              Improve structure and keywords so applicant tracking systems read you clearly.
            </Text>
            <Button
              title={optimizing ? 'Optimizing…' : 'Optimize for ATS'}
              onPress={() => void onOptimize()}
              disabled={optimizing || !hasResume}
              size="md"
            />
            {tips.map((t) => (
                <Text key={t} style={styles.tip}>
                  • {t}
                </Text>
              ))}
          </View>
        </FadeInView>
      </View>

      <FadeInView delay={240}>
        <Pressable style={styles.linkRow} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.cardIcon}>
            <Ionicons name="person-outline" size={20} color={colors.primaryLight} />
          </View>
          <View style={styles.linkTextWrap}>
            <Text style={styles.linkTitle}>Edit profile details</Text>
            <Text style={styles.linkSub}>Name, title, skills, summary — separate from resume file</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </FadeInView>
    </Screen>
  );
}
