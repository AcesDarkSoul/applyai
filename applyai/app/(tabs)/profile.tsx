import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useDrawerStore } from '@/stores/drawerStore';
import { profileRepository, type ApiUserProfile } from '@/lib/api/repositories';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const openAccountMenu = useDrawerStore((s) => s.setProfileOpen);
  const { profile, refreshProfile, user } = useAuthStore();
  const [apiProfile, setApiProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    title: '',
    phone: '',
    location: '',
    summary: '',
    skills: '',
  });

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
        heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
        avatar: {
          width: isWide ? 72 : 64,
          height: isWide ? 72 : 64,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: { color: '#fff', fontWeight: '800', fontSize: isWide ? 28 : 24 },
        heroMeta: { flex: 1, gap: 4 },
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
          letterSpacing: -0.3,
        },
        heroEmail: { color: colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
        actions: {
          flexDirection: isWide ? 'row' : 'column',
          gap: 10,
          marginTop: Spacing.md,
        },
        actionChip: {
          flex: isWide ? 1 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: BorderRadius.lg,
          backgroundColor: colors.surfaceLight,
          borderWidth: 1,
          borderColor: colors.border,
        },
        actionText: { color: colors.text, fontWeight: '800', fontSize: FontSize.sm },
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
          marginBottom: isWide ? 0 : Spacing.md,
          ...Shadows.card,
        },
        cardTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.lg },
        cardBody: { color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
        field: { gap: 6 },
        label: { color: colors.textSecondary, fontWeight: '700', fontSize: FontSize.xs },
        input: {
          backgroundColor: colors.surfaceLight,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: BorderRadius.lg,
          color: colors.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: FontSize.sm,
          fontWeight: '600',
        },
        textarea: { minHeight: 100, textAlignVertical: 'top' as const },
        twoCol: {
          flexDirection: isWide ? 'row' : 'column',
          gap: Spacing.sm,
        },
        half: { flex: 1 },
        hint: { color: colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
        shortcut: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: Spacing.sm,
        },
        shortcutIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryTint,
        },
        shortcutText: { flex: 1, gap: 2 },
        shortcutTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.sm },
        shortcutSub: { color: colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
        footerNote: {
          color: colors.textMuted,
          fontSize: FontSize.xs,
          textAlign: 'center',
          marginTop: Spacing.md,
          marginBottom: Spacing.xl,
          fontWeight: '600',
        },
      }),
    [colors, isWide]
  );

  const load = useCallback(async () => {
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
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

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
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSaving(false);
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

  const displayName =
    form.displayName || profile?.name || user?.displayName || user?.email || 'Your profile';
  const email = profile?.email || user?.email || '';
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <Screen safe edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient
          colors={['rgba(91,92,226,0.26)', 'rgba(236,72,153,0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { backgroundColor: colors.card }]}
        >
          <View style={styles.heroTop}>
            <LinearGradient colors={[...colors.gradientBrand]} style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
            <View style={styles.heroMeta}>
              <Text style={styles.heroEyebrow}>Profile</Text>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {displayName}
              </Text>
              {Boolean(email) && (
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {email}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionChip} onPress={() => router.push('/(tabs)/resume')}>
              <Ionicons name="document-text-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.actionText}>Resume studio</Text>
            </Pressable>
            <Pressable style={styles.actionChip} onPress={() => router.push('/plans' as never)}>
              <Ionicons name="diamond-outline" size={18} color={colors.primaryLight} />
              <Text style={styles.actionText}>Plans</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </FadeInView>

      <FadeInView delay={90}>
        <View style={[styles.card, { marginBottom: Spacing.md }]}>
          <Text style={styles.cardTitle}>About you</Text>
          <Text style={styles.cardBody}>
            These details power job matching and applications. Resume upload lives on the Resume tab.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={form.displayName}
              onChangeText={(v) => setForm((f) => ({ ...f, displayName: v }))}
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="Your name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Target title</Text>
            <TextInput
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="e.g. Frontend Engineer"
            />
          </View>

          <View style={styles.twoCol}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                value={form.location}
                onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
                style={styles.input}
                placeholderTextColor={colors.textMuted}
                placeholder="Remote / city"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Summary</Text>
            <TextInput
              value={form.summary}
              onChangeText={(v) => setForm((f) => ({ ...f, summary: v }))}
              style={[styles.input, styles.textarea]}
              multiline
              placeholderTextColor={colors.textMuted}
              placeholder="Short professional summary"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Skills (comma separated)</Text>
            <TextInput
              value={form.skills}
              onChangeText={(v) => setForm((f) => ({ ...f, skills: v }))}
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              placeholder="React, TypeScript, ..."
            />
            <Text style={styles.hint}>
              {(apiProfile?.skills || []).length
                ? `${(apiProfile?.skills || []).length} skills on file`
                : 'Add skills to improve match quality'}
            </Text>
          </View>

          <Button
            title={saving ? 'Saving…' : 'Save profile'}
            onPress={() => void onSave()}
            disabled={saving}
            size="lg"
          />
        </View>
      </FadeInView>

      <FadeInView delay={160}>
        <Pressable style={styles.shortcut} onPress={() => router.push('/(tabs)/resume')}>
          <View style={styles.shortcutIcon}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.shortcutText}>
            <Text style={styles.shortcutTitle}>Manage resume file</Text>
            <Text style={styles.shortcutSub}>Upload, ATS score, optimize</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.shortcut} onPress={() => router.push('/plans' as never)}>
          <View style={styles.shortcutIcon}>
            <Ionicons name="diamond-outline" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.shortcutText}>
            <Text style={styles.shortcutTitle}>Plans & billing</Text>
            <Text style={styles.shortcutSub}>Starter ₹599 · Pro ₹1499 · Elite ₹2999</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.shortcut} onPress={() => openAccountMenu(true)}>
          <View style={styles.shortcutIcon}>
            <Ionicons name="settings-outline" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.shortcutText}>
            <Text style={styles.shortcutTitle}>Account menu</Text>
            <Text style={styles.shortcutSub}>Theme, shortcuts, and log out</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </FadeInView>

      <Text style={styles.footerNote}>Log out is in the avatar menu (top right) — not on this page.</Text>
    </Screen>
  );
}
