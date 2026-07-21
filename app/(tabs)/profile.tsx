import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Badge } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import {
  ProfileReviewForm,
  profileToFormData,
  type ProfileFormData,
} from '@/components/profile/ProfileReviewForm';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore, userHasResume } from '@/stores/resumeStore';
import { logOut } from '@/lib/firebase/auth';
import { saveUserProfileFromForm, calculateProfileCompleteness, formatFirebaseError } from '@/lib/firebase/profile';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();
  const { hasResume, fileName: localFileName } = useResumeStore();
  const hasResumeSaved = userHasResume(hasResume, profile?.hasResume);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(profileToFormData(profile));

  const completeness = calculateProfileCompleteness(profile, hasResume);
  const needsManualFill = profile?.parseStatus === 'manual' || (!profile?.skills?.length && hasResumeSaved);

  useEffect(() => {
    setForm(profileToFormData(profile));
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      await saveUserProfileFromForm(user.uid, form);
      await refreshProfile();
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', formatFirebaseError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.heroBanner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Complete your profile'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.completenessBadge}>
            <Text style={styles.completenessText}>Profile {completeness}% complete</Text>
          </View>
        </LinearGradient>
      </FadeInView>

      {needsManualFill && !editing && (
        <FadeInView direction="up" delay={50}>
          <Card style={styles.alertCard}>
            <Text style={styles.alertTitle}>📝 Complete your profile</Text>
            <Text style={styles.alertText}>
              Some details are missing. Tap Edit to fill in manually or re-upload your resume.
            </Text>
            <Button title="Edit Profile" size="sm" onPress={() => setEditing(true)} />
          </Card>
        </FadeInView>
      )}

      <FadeInView direction="up" delay={100}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resume</Text>
            <Button title={hasResumeSaved ? 'Update' : 'Save'} size="sm" variant="outline"
              onPress={() => router.push('/resume/upload')} />
          </View>
          {hasResumeSaved ? (
            <View>
              <Text style={styles.resumeName}>📄 {localFileName || profile?.resumeFileName || 'resume.pdf'}</Text>
              <Text style={styles.localHint}>Stored locally on this device</Text>
              {profile?.atsScore != null && (
                <View style={styles.atsRow}>
                  <Text style={styles.atsLabel}>ATS Score:</Text>
                  <Badge text={`${profile.atsScore}%`}
                    backgroundColor={profile.atsScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
                    color={profile.atsScore >= 80 ? Colors.success : Colors.warning} />
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noResume}>No resume saved — upload to auto-fill your profile</Text>
          )}
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={150}>
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <Button title={editing ? 'Cancel' : 'Edit'} size="sm" variant="ghost"
              onPress={() => { setEditing(!editing); if (!editing) setForm(profileToFormData(profile)); }} />
          </View>
          {editing ? (
            <ProfileReviewForm form={form} onChange={setForm} onSave={handleSave} saving={saving} />
          ) : (
            <View>
              <InfoRow label="Name" value={profile?.name || 'Not set'} />
              <InfoRow label="Phone" value={profile?.phone || 'Not set'} />
              <InfoRow label="Location" value={profile?.preferredLocation || 'Not set'} />
              <InfoRow label="Salary" value={profile?.expectedSalary || 'Not set'} />
              <InfoRow label="Authorization" value={profile?.workAuthorization || 'Not set'} />
              <InfoRow label="Experience" value={`${profile?.experience || 0} years`} />
              {profile?.summary ? (
                <View style={styles.summaryBlock}>
                  <Text style={styles.infoLabel}>Summary</Text>
                  <Text style={styles.summaryText}>{profile.summary}</Text>
                </View>
              ) : null}
            </View>
          )}
        </Card>
      </FadeInView>

      {profile?.skills && profile.skills.length > 0 && (
        <FadeInView direction="up" delay={200}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsGrid}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>
        </FadeInView>
      )}

      {profile?.languages && profile.languages.length > 0 && (
        <FadeInView direction="up" delay={220}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.listText}>{profile.languages.join(' · ')}</Text>
          </Card>
        </FadeInView>
      )}

      {profile?.certifications && profile.certifications.length > 0 && (
        <FadeInView direction="up" delay={240}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <Text style={styles.listText}>{profile.certifications.join(' · ')}</Text>
          </Card>
        </FadeInView>
      )}

      {profile?.education && profile.education.length > 0 && (
        <FadeInView direction="up" delay={260}>
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((edu, i) => (
              <View key={i} style={styles.eduItem}>
                <Text style={styles.eduDegree}>{edu.degree} in {edu.field}</Text>
                <Text style={styles.eduSchool}>{edu.institution}</Text>
                <Text style={styles.eduYears}>{edu.startYear} - {edu.endYear || 'Present'}</Text>
              </View>
            ))}
          </Card>
        </FadeInView>
      )}

      <Button title="Sign Out" variant="outline" onPress={handleLogout} style={styles.logoutButton} />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    borderWidth: 4, borderColor: Colors.secondary,
  },
  avatarText: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  name: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  email: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.md, marginTop: 2 },
  completenessBadge: { marginTop: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  completenessText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  alertCard: { marginBottom: Spacing.md, backgroundColor: Colors.secondary + '25', borderColor: Colors.secondary },
  alertTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  alertText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.md, lineHeight: 20 },
  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  resumeName: { color: Colors.text, fontSize: FontSize.md },
  localHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
  noResume: { color: Colors.textMuted, fontSize: FontSize.md },
  atsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  atsLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  infoValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500', flex: 1, textAlign: 'right' },
  summaryBlock: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryText: { color: Colors.text, fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  listText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  skillTag: { backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  skillText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  eduItem: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  eduDegree: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  eduSchool: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  eduYears: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  logoutButton: { marginTop: Spacing.md, marginBottom: Spacing.lg },
});
