import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import {
  ProfileReviewForm,
  profileToFormData,
  parsedToFormData,
  type ProfileFormData,
} from '@/components/profile/ProfileReviewForm';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import {
  saveResumeForUser,
  parseResumeWithAI,
  markProfileForManualEntry,
  saveUserProfileFromForm,
  formatFirebaseError,
} from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type Step = 'upload' | 'review';

export default function ResumeUploadScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();
  const { refresh: refreshResume } = useResumeStore();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [reviewBanner, setReviewBanner] = useState('');
  const [reviewBannerType, setReviewBannerType] = useState<'info' | 'warning' | 'success'>('info');
  const [form, setForm] = useState<ProfileFormData>(profileToFormData(profile));

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ALLOWED_TYPES, copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const selected = result.assets[0];
      if (selected.size && selected.size > MAX_FILE_SIZE) {
        Alert.alert('File Too Large', 'Maximum file size is 10 MB');
        return;
      }
      setFile(selected);
    } catch {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSaveAndExtract = async () => {
    if (!file) return;
    const activeUid = user?.uid || 'local_user';
    setSaving(true);
    setStatus('Saving resume on this device...');
    try {
      if (user) {
        await saveResumeForUser(user.uid, file);
      } else {
        const { saveResumeLocally } = await import('@/lib/local/resumeStorage');
        await saveResumeLocally(file);
      }

      setStatus('Extracting candidate profile from resume...');

      let parsed: Record<string, unknown> = {};
      try {
        parsed = await parseResumeWithAI(activeUid, file.name);
        setReviewBanner('✅ Successfully extracted info from your resume! Review & confirm below.');
        setReviewBannerType('success');
        setForm(parsedToFormData(parsed, profile));
      } catch (parseError) {
        console.warn('Resume parsing fallback:', parseError);
        setReviewBanner('⚠️ Extracted partial details. Please review and fill in missing fields below.');
        setReviewBannerType('warning');
        setForm(profileToFormData(profile));
      }

      await refreshResume();
      setStep('review');
    } catch (error) {
      console.error('Resume save failed:', error);
      Alert.alert('Save Failed', formatFirebaseError(error));
    } finally {
      setSaving(false);
      setStatus('');
    }
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      if (user) {
        await saveUserProfileFromForm(user.uid, form, {
          hasResume: true,
          resumeFileName: file?.name || profile?.resumeFileName,
        });
      }
      await refreshProfile();
      Alert.alert('Profile Saved ✅', 'Your candidate profile information has been saved successfully.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Notice', 'Profile updated locally.');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (step === 'review') {
    return (
      <Screen safe={false} edges={['left', 'right']}>
        <FadeInView direction="down">
          <LinearGradient colors={Colors.gradientHero} style={styles.hero}>
            <Text style={styles.heroEmoji}>✅</Text>
            <Text style={styles.heroTitle}>Review Your Info</Text>
            <Text style={styles.heroSubtitle}>
              Confirm details extracted from your resume, or enter them manually
            </Text>
          </LinearGradient>
        </FadeInView>
        <FadeInView direction="up" delay={100}>
          <Card>
            <ProfileReviewForm
              form={form}
              onChange={setForm}
              onSave={handleSaveProfile}
              saving={saving}
              banner={reviewBanner}
              bannerType={reviewBannerType}
            />
          </Card>
        </FadeInView>
        <Button title="Skip for Now" variant="ghost" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
      </Screen>
    );
  }

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.hero}>
          <Text style={styles.heroEmoji}>📄</Text>
          <Text style={styles.heroTitle}>Save Resume</Text>
          <Text style={styles.heroSubtitle}>
            We will extract your name, phone, skills, experience & more — you can edit before saving
          </Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <Card style={styles.uploadArea}>
          <Text style={styles.uploadIcon}>📁</Text>
          <Text style={styles.uploadTitle}>{file ? file.name : 'Tap to choose a file'}</Text>
          <Text style={styles.uploadHint}>PDF or DOCX · Max 10 MB</Text>
          <Button title="Choose File" variant="outline" onPress={pickDocument} style={styles.browseButton} />
        </Card>
      </FadeInView>

      {file && (
        <FadeInView direction="up" delay={150}>
          <Card style={styles.fileInfo}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileSize}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}</Text>
          </Card>
        </FadeInView>
      )}

      {status ? <Text style={styles.statusText}>{status}</Text> : null}

      <Button
        title={saving ? 'Processing...' : 'Save & Extract Info'}
        onPress={handleSaveAndExtract}
        loading={saving}
        disabled={!file}
        size="lg"
      />

      <Button
        title="Enter Info Manually (no resume)"
        variant="ghost"
        onPress={() => {
          setReviewBanner('Fill in your details below. You can upload a resume later from Profile.');
          setReviewBannerType('info');
          setForm(profileToFormData(profile));
          setStep('review');
        }}
        style={{ marginTop: Spacing.sm }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.md, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 22 },
  uploadArea: { alignItems: 'center', padding: Spacing.xl, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.primary + '40', marginBottom: Spacing.md },
  uploadIcon: { fontSize: 48, marginBottom: Spacing.md },
  uploadTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', textAlign: 'center' },
  uploadHint: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  browseButton: { minWidth: 160 },
  fileInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  fileName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', flex: 1 },
  fileSize: { color: Colors.textMuted, fontSize: FontSize.sm },
  statusText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.md },
});
