import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button, Input } from '@/components/ui';
import {
  AuthShell,
  AuthDivider,
  AuthErrorBanner,
  GoogleSignInButton,
} from '@/components/auth/AuthShell';
import { signIn, formatAuthError } from '@/lib/firebase/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Colors, Spacing, FontSize } from '@/constants/theme';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { signInWithGoogle, googleAuthReady } = useGoogleAuth(
    () => {
      setGoogleLoading(false);
      // AuthGuard sends users without a plan to /plans
      router.replace('/plans');
    },
    (msg) => {
      setError(msg);
      setGoogleLoading(false);
    }
  );

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/plans');
    } catch (e: unknown) {
      console.error('Login failed:', e);
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
      title="Welcome back"
      subtitle="Sign in with email or Google to continue your job search."
      footerPrompt="New here?"
      footerLinkLabel="Create a free account"
      footerHref="/(auth)/signup"
    >
      <AuthErrorBanner message={error} />

      <Input
        label="Email"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
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
        placeholder="Enter your password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
        }}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        error={fieldErrors.password}
        editable={!busy}
      />

      <Link href="/(auth)/forgot-password" asChild>
        <Pressable style={styles.forgotLink} disabled={busy}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </Link>

      <Button title="Sign In" onPress={handleLogin} loading={loading} disabled={busy} size="lg" />

      <AuthDivider />

      <GoogleSignInButton
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={!googleAuthReady || busy}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.md, marginTop: -Spacing.xs },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
});
