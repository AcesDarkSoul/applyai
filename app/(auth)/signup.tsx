import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { signUp } from '@/lib/firebase/auth';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard safe contentStyle={styles.scroll}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Join ApplyAI</Text>
          <Text style={styles.heroSubtitle}>Auto-apply on LinkedIn, Indeed & Naukri</Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <View style={styles.form}>
          {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
          <Input label="Full Name" icon="👤" placeholder="John Doe" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Email" icon="📧" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" icon="🔒" placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Confirm Password" icon="🔒" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Button title="Create Free Account" onPress={handleSignUp} loading={loading} size="lg" />
        </View>
      </FadeInView>

      <FadeInView direction="up" delay={200}>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable><Text style={styles.link}>Sign In</Text></Pressable>
          </Link>
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.xl },
  heroBanner: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.md, marginTop: Spacing.xs, textAlign: 'center' },
  form: { marginBottom: Spacing.lg },
  errorBanner: { backgroundColor: '#FEE2E2', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  link: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
