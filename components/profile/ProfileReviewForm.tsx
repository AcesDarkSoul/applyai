import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '@/components/ui';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import type { UserProfile } from '@/types';

export interface ProfileFormData {
  name: string;
  phone: string;
  linkedin: string;
  preferredLocation: string;
  expectedSalary: string;
  workAuthorization: string;
  experience: string;
  summary: string;
  skillsText: string;
  languagesText: string;
  certificationsText: string;
}

export function profileToFormData(profile: UserProfile | null): ProfileFormData {
  return {
    name: profile?.name || '',
    phone: profile?.phone || '',
    linkedin: profile?.linkedin || '',
    preferredLocation: profile?.preferredLocation || '',
    expectedSalary: profile?.expectedSalary || '',
    workAuthorization: profile?.workAuthorization || '',
    experience: profile?.experience !== undefined ? String(profile.experience) : '0',
    summary: profile?.summary || '',
    skillsText: profile?.skills?.join(', ') || '',
    languagesText: profile?.languages?.join(', ') || '',
    certificationsText: profile?.certifications?.join(', ') || '',
  };
}

export function parsedToFormData(
  parsed: Record<string, unknown>,
  existing?: UserProfile | null
): ProfileFormData {
  const skills = Array.isArray(parsed.skills) ? (parsed.skills as string[]) : [];
  const languages = Array.isArray(parsed.languages) ? (parsed.languages as string[]) : [];
  const certs = Array.isArray(parsed.certifications) ? (parsed.certifications as string[]) : [];

  return {
    name: (parsed.name as string) || (existing?.name || ''),
    phone: (parsed.phone as string) || '',
    linkedin: (parsed.linkedin as string) || '',
    preferredLocation:
      (parsed.location as string) ||
      (parsed.preferredLocation as string) ||
      'Remote',
    expectedSalary: (parsed.expectedSalary as string) || '',
    workAuthorization: (parsed.workAuthorization as string) || '',
    experience:
      typeof parsed.experience === 'number'
        ? String(parsed.experience)
        : typeof parsed.experience === 'string'
        ? parsed.experience
        : '0',
    summary: (parsed.summary as string) || '',
    skillsText: skills.join(', '),
    languagesText: languages.join(', '),
    certificationsText: certs.join(', '),
  };
}

export function formDataToProfileUpdate(form: ProfileFormData): Partial<UserProfile> {
  const splitList = (text: string) =>
    text
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    linkedin: form.linkedin.trim() || undefined,
    preferredLocation: form.preferredLocation.trim() || 'Remote',
    expectedSalary: form.expectedSalary.trim() || undefined,
    workAuthorization: form.workAuthorization.trim() || undefined,
    experience: Math.max(0, parseInt(form.experience, 10) || 0),
    summary: form.summary.trim() || undefined,
    skills: splitList(form.skillsText),
    languages: splitList(form.languagesText),
    certifications: splitList(form.certificationsText),
  };
}

interface ProfileReviewFormProps {
  form: ProfileFormData;
  onChange: (form: ProfileFormData) => void;
  onSave: () => void;
  saving?: boolean;
  banner?: string;
  bannerType?: 'info' | 'warning' | 'success';
}

export function ProfileReviewForm({
  form,
  onChange,
  onSave,
  saving,
  banner,
  bannerType = 'info',
}: ProfileReviewFormProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = (key: keyof ProfileFormData, value: string) => {
    setValidationError(null);
    onChange({ ...form, [key]: value });
  };

  const handleValidateAndSave = () => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Full Name');
    if (!form.skillsText.trim()) missing.push('At least 1 Skill (e.g. Kotlin, React, Python)');
    if (form.experience.trim() === '') missing.push('Years of Experience (enter 0 if Fresher)');

    if (missing.length > 0) {
      const msg = `Please complete missing required fields:\n• ${missing.join('\n• ')}`;
      setValidationError(msg);
      Alert.alert('Incomplete Profile Details ⚠️', msg);
      return;
    }

    setValidationError(null);
    onSave();
  };

  const bannerStyles = {
    info: styles.bannerInfo,
    warning: styles.bannerWarning,
    success: styles.bannerSuccess,
  };

  return (
    <View>
      {banner ? (
        <View style={[styles.banner, bannerStyles[bannerType]]}>
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      ) : null}

      {validationError ? (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.bannerErrorText}>{validationError}</Text>
        </View>
      ) : null}

      <Text style={styles.groupTitle}>Personal Information</Text>
      <Input label="Full Name *" icon="👤" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Full Name (Required)" />
      <Input label="Phone" icon="📞" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="+91 98765 43210" keyboardType="phone-pad" />
      <Input label="LinkedIn Profile URL" icon="💼" value={form.linkedin} onChangeText={(v) => set('linkedin', v)} placeholder="https://linkedin.com/in/yourname" autoCapitalize="none" keyboardType="url" />
      <Input label="Location" icon="📍" value={form.preferredLocation} onChangeText={(v) => set('preferredLocation', v)} placeholder="City, Remote, Hybrid..." />
      <Input label="Expected Salary" icon="💰" value={form.expectedSalary} onChangeText={(v) => set('expectedSalary', v)} placeholder="e.g. 6-10 LPA" />
      <Input label="Work Authorization" icon="🛂" value={form.workAuthorization} onChangeText={(v) => set('workAuthorization', v)} placeholder="e.g. Authorized to work in India" />

      <Text style={styles.groupTitle}>Professional Details</Text>
      <Input label="Years of Experience * (Enter 0 for Fresher)" icon="💼" value={form.experience} onChangeText={(v) => set('experience', v)} placeholder="0 for Fresher, 1, 2..." keyboardType="numeric" />
      <Input label="Professional Summary" icon="📝" value={form.summary} onChangeText={(v) => set('summary', v)} placeholder="Brief summary from resume..." multiline numberOfLines={4} />

      <Text style={styles.groupTitle}>Skills & More</Text>
      <Input label="Skills * (comma-separated)" icon="⚡" value={form.skillsText} onChangeText={(v) => set('skillsText', v)} placeholder="Kotlin, Android, React, Python..." multiline numberOfLines={2} />
      <Input label="Languages" icon="🌐" value={form.languagesText} onChangeText={(v) => set('languagesText', v)} placeholder="English, Hindi..." />
      <Input label="Certifications" icon="🏅" value={form.certificationsText} onChangeText={(v) => set('certificationsText', v)} placeholder="AWS Certified, Java..." multiline numberOfLines={2} />

      <Button title="Save Profile" onPress={handleValidateAndSave} loading={saving} size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  banner: {
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  bannerInfo: { backgroundColor: Colors.primary + '15' },
  bannerWarning: { backgroundColor: Colors.secondary + '30' },
  bannerSuccess: { backgroundColor: '#D1FAE5' },
  bannerError: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: Colors.danger },
  bannerText: { color: Colors.text, fontSize: FontSize.sm, lineHeight: 20 },
  bannerErrorText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '700', lineHeight: 20 },
});
