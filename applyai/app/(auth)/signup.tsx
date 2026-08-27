import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '@/components/ui';
import {
  AuthShell,
  AuthDivider,
  AuthErrorBanner,
  GoogleSignInButton,
} from '@/components/auth/AuthShell';
import { signUp, formatAuthError } from '@/lib/firebase/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) return { score: 0, label: '', color: Colors.border };
  if (score <= 2) return { score: 1, label: 'Weak', color: Colors.danger };
  if (score <= 3) return { score: 2, label: 'Okay', color: Colors.warning };
  if (score <= 4) return { score: 3, label: 'Good', color: Colors.primary };
  return { score: 4, label: 'Strong', color: Colors.primaryDark };
}

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const strength = useMemo(() => passwordStrength(password), [password]);

  const { signInWithGoogle, googleAuthReady } = useGoogleAuth(
    () => {
      setGoogleLoading(false);
      router.replace('/plans');
    },
    (msg) => {
      setError(msg);
      setGoogleLoading(false);
    }
  );

  const clearField = (key: keyof typeof fieldErrors) => {
    setFieldErrors((f) => ({ ...f, [key]: undefined }));
  };

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Use at least 8 characters';
    if (!confirmPassword) next.confirmPassword = 'Confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignUp = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/plans');
    } catch (e: unknown) {
      console.error('Sign up failed:', e);
      setError(formatAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register free — then sign in anytime with email or Google."
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerHref="/(auth)/login"
      brandTagline="Auto-apply smarter on LinkedIn, Indeed & Naukri"
    >
      <AuthErrorBanner message={error} />

      <GoogleSignInButton
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={!googleAuthReady || busy}
      />

      <AuthDivider />

      <Input
        label="Full Name"
        icon="person-outline"
        placeholder="Your name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          clearField('name');
        }}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        error={fieldErrors.name}
        editable={!busy}
      />
      <Input
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clearField('email');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={fieldErrors.email}
        editable={!busy}
      />
      <Input
        label="Password"
        icon="lock-closed-outline"
        placeholder="At least 8 characters"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clearField('password');
        }}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={fieldErrors.password}
        editable={!busy}
      />

      {password ? (
        <View style={styles.strengthRow}>
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      strength.score >= level ? strength.color : Colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      ) : null}

      <Input
        label="Confirm Password"
        icon="shield-checkmark-outline"
        placeholder="Re-enter password"
        value={confirmPassword}
        onChangeText={(v) => {
          setConfirmPassword(v);
          clearField('confirmPassword');
        }}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        error={fieldErrors.confirmPassword}
        editable={!busy}
      />

      <Button
        title="Create Free Account"
        onPress={handleSignUp}
        loading={loading}
        disabled={busy}
        size="lg"
      />

      <Text style={styles.legal}>
        By creating an account you agree to continue with ApplyAI for your job search.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
  },
  strengthLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
  legal: {
    marginTop: Spacing.md,
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
  },
});
