import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { logOut } from '@/lib/firebase/auth';
import { profileRepository, type ApiUserProfile } from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ResumeStudioScreen() {
  const router = useRouter();
  const { profile, refreshProfile, user } = useAuthStore();
  const { refresh: refreshLocalResume } = useResumeStore();
  const [apiProfile, setApiProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [form, setForm] = useState({
    displayName: '',
    title: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const me = await profileRepository.me();
      setApiProfile(me);
      setForm({
        displayName: me.displayName || profile?.name || '',
        title: me.title || profile?.title || '',
        phone: me.phone || profile?.phone || '',
        location: me.location || profile?.location || '',
        summary: me.summary || profile?.summary || '',
        skills: (me.skills || profile?.skills || []).join(', '),
      });
    } catch {
      setForm({
        displayName: profile?.name || '',
        title: profile?.title || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        summary: profile?.summary || '',
        skills: (profile?.skills || []).join(', '),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user?.uid]);

  const onUpload = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setUploading(true);
      const result = await profileRepository.uploadResume(
        Platform.OS === 'web' && (asset as { file?: File }).file
          ? (asset as { file: File }).file
          : {
              uri: asset.uri,
              name: asset.name || 'resume.pdf',
              mimeType: asset.mimeType || 'application/pdf',
            }
      );
      setApiProfile(result.profile);
      await refreshProfile();
      await refreshLocalResume();
      Alert.alert('Resume uploaded', 'Profile fields updated from parse.');
      await load();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await profileRepository.update({
        displayName: form.displayName,
        title: form.title,
        phone: form.phone,
        location: form.location,
        summary: form.summary,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setApiProfile(updated);
      await refreshProfile();
      Alert.alert('Saved', 'Resume profile updated.');
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSaving(false);
    }
  };

  const onOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await profileRepository.optimizeResume({
        jobTitle: form.title,
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
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  const ats = apiProfile?.atsScore ?? profile?.atsScore;

  return (
    <Screen safe edges={['left', 'right']}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Resume Studio</Text>
        <Text style={styles.title}>Build an ATS-ready profile</Text>
        <Text style={styles.body}>
          Upload a resume, edit skills/experience, and optimize — same pipeline as the web app.
        </Text>
        {ats != null && (
          <View style={styles.atsChip}>
            <Text style={styles.atsText}>ATS score {ats}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Upload resume</Text>
        <Pressable style={styles.uploadBtn} onPress={() => void onUpload()} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />
              <Text style={styles.uploadText}>Upload PDF / DOCX</Text>
            </>
          )}
        </Pressable>
        {(apiProfile?.resumeFileName || profile?.hasResume) && (
          <Text style={styles.hint}>
            Current: {apiProfile?.resumeFileName || 'Resume on file'}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Edit profile</Text>
        {(
          [
            ['displayName', 'Full name'],
            ['title', 'Target title'],
            ['phone', 'Phone'],
            ['location', 'Location'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        ))}
        <View style={styles.field}>
          <Text style={styles.label}>Summary</Text>
          <TextInput
            value={form.summary}
            onChangeText={(v) => setForm((f) => ({ ...f, summary: v }))}
            style={[styles.input, styles.textarea]}
            multiline
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Skills (comma separated)</Text>
          <TextInput
            value={form.skills}
            onChangeText={(v) => setForm((f) => ({ ...f, skills: v }))}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <Button title={saving ? 'Saving…' : 'Save profile'} onPress={() => void onSave()} disabled={saving} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Generate / optimize ATS</Text>
        <Button
          title={optimizing ? 'Optimizing…' : 'Optimize for ATS'}
          onPress={() => void onOptimize()}
          disabled={optimizing}
        />
        {tips.map((t) => (
          <Text key={t} style={styles.tip}>
            • {t}
          </Text>
        ))}
      </View>

      <Button
        title="Sign out"
        variant="outline"
        onPress={() =>
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: async () => {
                await logOut();
                router.replace('/(auth)/login');
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 240 },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  eyebrow: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  atsChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  atsText: { color: Colors.primaryLight, fontWeight: '800', fontSize: FontSize.xs },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 10,
  },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg },
  uploadBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
  },
  uploadText: { color: Colors.white, fontWeight: '800' },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs },
  field: { gap: 6 },
  label: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.xs },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  tip: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
