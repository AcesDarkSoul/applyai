import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { resetPassword } from '@/lib/firebase/auth';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Reset failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard safe contentStyle={styles.scroll}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.heroBanner}>
          <Text style={styles.heroEmoji}>🔑</Text>
          <Text style={styles.heroTitle}>Reset Password</Text>
          <Text style={styles.heroSubtitle}>We'll send a reset link to your email</Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Password reset email sent! Check your inbox.</Text>
          </View>
        ) : (
          <View style={styles.form}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
            <Input label="Email" icon="📧" placeholder="you@example.com" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" />
            <Button title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" />
          </View>
        )}
      </FadeInView>

      <FadeInView direction="up" delay={200}>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.backLink}>
            <Text style={styles.link}>← Back to Sign In</Text>
          </Pressable>
        </Link>
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
  successBanner: { backgroundColor: Colors.primary + '20', padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  successText: { color: Colors.success, fontSize: FontSize.md, fontWeight: '600', textAlign: 'center' },
  backLink: { alignItems: 'center', paddingBottom: Spacing.xl },
  link: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
