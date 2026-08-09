import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Link, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';

function FloatingOrb({
  size,
  color,
  top,
  left,
  delay = 0,
}: {
  size: number;
  color: string;
  top: `${number}%` | number;
  left: `${number}%` | number;
  delay?: number;
}) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2200 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 2200 + delay, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left },
        style,
      ]}
    />
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: Href;
  brandTagline?: string;
  /** Hide the brand gradient strip (e.g. compact secondary screens) */
  hideBrandCard?: boolean;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  brandTagline = 'Smart applications for LinkedIn, Indeed & Naukri',
  hideBrandCard = false,
}: AuthShellProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMax = isWide ? 440 : undefined;

  return (
    <Screen keyboard safe contentStyle={styles.scroll} backgroundColor={Colors.background}>
      <View style={[styles.inner, contentMax ? { maxWidth: contentMax, alignSelf: 'center', width: '100%' } : null]}>
        <View style={styles.atmosphere} pointerEvents="none">
          <FloatingOrb size={160} color="rgba(34,197,94,0.14)" top="6%" left="-8%" />
          <FloatingOrb size={120} color="rgba(250,204,21,0.16)" top="18%" left="72%" delay={400} />
          <FloatingOrb size={90} color="rgba(74,222,128,0.12)" top="68%" left="8%" delay={800} />
        </View>

        {!hideBrandCard && (
          <FadeInView direction="down">
            <LinearGradient
              colors={Colors.gradientHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.brandCard, isWide && styles.brandCardWide]}
            >
              <View style={styles.brandRow}>
                <View style={styles.logoMark}>
                  <Ionicons name="flash" size={22} color={Colors.primary} />
                </View>
                <View style={styles.brandText}>
                  <Text style={styles.brandName}>ApplyAI</Text>
                  <Text style={styles.brandTag}>{brandTagline}</Text>
                </View>
              </View>
            </LinearGradient>
          </FadeInView>
        )}

        <FadeInView direction="up" delay={80}>
          <Text style={[styles.title, isWide && styles.titleWide]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </FadeInView>

        <FadeInView direction="up" delay={160}>
          <View style={[styles.formCard, isWide && styles.formCardWide]}>{children}</View>
        </FadeInView>

        <FadeInView direction="up" delay={260}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{footerPrompt} </Text>
            <Link href={footerHref} asChild>
              <Pressable hitSlop={10}>
                <Text style={styles.link}>{footerLinkLabel}</Text>
              </Pressable>
            </Link>
          </View>
        </FadeInView>
      </View>
    </Screen>
  );
}

export function AuthDivider({ label = 'or continue with' }: { label?: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={Colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function AuthSuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.successBanner}>
      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, loading, disabled }: GoogleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.googleBtn,
        (disabled || loading) && styles.googleDisabled,
        pressed && styles.googlePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      {loading ? (
        <Text style={styles.googleLabel}>Connecting…</Text>
      ) : (
        <>
          <View style={styles.googleG}>
            <Text style={styles.googleGText}>G</Text>
          </View>
          <Text style={styles.googleLabel}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  inner: {
    position: 'relative',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
  },
  brandCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  brandCardWide: {
    paddingVertical: Spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  brandName: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTag: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FontSize.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: Spacing.xs,
  },
  titleWide: {
    fontSize: FontSize.hero - 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  formCardWide: {
    padding: Spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(34,197,94,0.12)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    flex: 1,
    fontWeight: '600',
    lineHeight: 20,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  googleDisabled: { opacity: 0.5 },
  googlePressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  googleG: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4285F4',
  },
  googleLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  link: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
