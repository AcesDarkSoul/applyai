import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { signIn, formatAuthError } from '@/lib/firebase/auth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithGoogle, googleAuthReady } = useGoogleAuth(
    () => router.replace('/(tabs)'),
    (msg) => { setError(msg); setLoading(false); }
  );

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      console.error('Login failed:', e);
      setError(formatAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard safe contentStyle={styles.scroll}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🚀</Text>
          <Text style={styles.heroTitle}>ApplyAI</Text>
          <Text style={styles.heroSubtitle}>Smart job applications on LinkedIn, Indeed & Naukri</Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSub}>Sign in to continue your job search</Text>
      </FadeInView>

      <FadeInView direction="up" delay={200}>
        <View style={styles.form}>
          {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Input label="Email" icon="📧" placeholder="you@example.com" value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Input label="Password" icon="🔒" placeholder="Enter your password" value={password}
            onChangeText={setPassword} secureTextEntry autoComplete="password" />
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={styles.forgotLink}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>
          </Link>
          <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" />
          <View style={styles.divider}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
          </View>
          <Button title="Continue with Google" variant="outline" onPress={async () => { setLoading(true); await signInWithGoogle(); setLoading(false); }}
            loading={loading} disabled={!googleAuthReady} />
        </View>
      </FadeInView>

      <FadeInView direction="up" delay={300}>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable><Text style={styles.link}>Sign Up Free</Text></Pressable>
          </Link>
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.xl },
  heroBanner: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  heroTitle: { color: Colors.white, fontSize: FontSize.hero, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.92)', fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 22 },
  welcomeTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.xs },
  welcomeSub: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.lg },
  form: { marginBottom: Spacing.lg },
  errorBanner: { backgroundColor: '#FEE2E2', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.md },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, paddingHorizontal: Spacing.md, fontSize: FontSize.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  link: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
