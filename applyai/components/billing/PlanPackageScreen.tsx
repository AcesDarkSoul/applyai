import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PLANS, formatInr, type PlanId } from '@/constants/plans';
import { billingRepository } from '@/lib/api/repositories';
import { openRazorpayCheckout } from '@/lib/razorpayCheckout';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';

const PLAN_ICON: Record<PlanId, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  starter: { icon: 'rocket-outline', label: 'Launch' },
  pro: { icon: 'sparkles-outline', label: 'Growth' },
  elite: { icon: 'diamond-outline', label: 'Premium' },
};

export function PlanPackageScreen({ planId }: { planId: PlanId }) {
  const plan = PLANS[planId];
  const router = useRouter();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const hydrate = useSubscriptionStore((s) => s.hydrate);
  const activePlanId = useSubscriptionStore((s) => s.planId);
  const active = useSubscriptionStore((s) => s.active);
  const razorpayConfigured = useSubscriptionStore((s) => s.razorpayConfigured);
  const catalog = useSubscriptionStore((s) => s.catalog);
  const [busy, setBusy] = useState(false);
  const isCurrent = active && activePlanId === planId;
  const demoOk = catalog?.demoActivateEnabled ?? !razorpayConfigured;
  const iconMeta = PLAN_ICON[planId];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          borderRadius: BorderRadius.xxl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: Spacing.lg,
          marginBottom: Spacing.md,
          overflow: 'hidden',
          ...Shadows.lg,
          position: 'relative',
        },
        heroArt: {
          position: 'absolute',
          right: -12,
          top: 10,
          width: 130,
          height: 130,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroOrb: {
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
        },
        heroIcon: {
          position: 'absolute',
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.16)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        },
        badge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: BorderRadius.full,
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          marginBottom: 10,
        },
        badgeText: { color: '#fff', fontWeight: '800', fontSize: FontSize.xs, letterSpacing: 0.6 },
        name: { color: '#fff', fontWeight: '800', fontSize: FontSize.xxl, letterSpacing: -0.4, maxWidth: 220 },
        tagline: { color: 'rgba(255,255,255,0.88)', fontWeight: '700', marginTop: 6, fontSize: FontSize.sm, lineHeight: 20, maxWidth: 230 },
        priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: Spacing.md },
        price: { color: '#fff', fontWeight: '800', fontSize: 40, letterSpacing: -1 },
        period: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 8 },
        quota: {
          marginTop: Spacing.md,
          padding: 12,
          borderRadius: BorderRadius.lg,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        },
        quotaText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
        card: {
          backgroundColor: colors.card,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: Spacing.md,
          marginBottom: Spacing.md,
          ...Shadows.card,
        },
        cardTitle: { color: colors.text, fontWeight: '800', fontSize: FontSize.lg, marginBottom: 10 },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 12,
          paddingVertical: 2,
        },
        include: { color: colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
        payBtn: {
          borderRadius: BorderRadius.xl,
          overflow: 'hidden',
          marginBottom: Spacing.sm,
          ...Shadows.md,
        },
        payInner: { paddingVertical: 16, alignItems: 'center' },
        payText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
        ghost: {
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        ghostText: { color: colors.text, fontWeight: '800' },
        hint: {
          color: colors.textMuted,
          fontSize: FontSize.xs,
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: Spacing.lg,
        },
        current: {
          textAlign: 'center',
          color: colors.success,
          fontWeight: '800',
          marginBottom: Spacing.sm,
        },
      }),
    [colors],
  );

  const onPay = async () => {
    setBusy(true);
    try {
      if (!razorpayConfigured && demoOk) {
        await billingRepository.demoActivate(planId);
        await hydrate();
        Alert.alert('Plan activated', `${plan.name} is active (demo — add Razorpay keys for live payments).`);
        router.replace('/(tabs)');
        return;
      }
      const order = await billingRepository.createOrder(planId);
      const result = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        planId,
        name: user?.displayName || undefined,
        email: user?.email || undefined,
        description: `ApplyAI ${plan.name}`,
        paymentLinkUrl: order.paymentLinkUrl,
      });
      if ('viaLink' in result) {
        await hydrate();
        Alert.alert(
          'Check your plan',
          'If payment succeeded, your plan unlocks in a few seconds. Pull to refresh if needed.',
        );
        return;
      }
      await billingRepository.verify({
        planId,
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      });
      await hydrate();
      Alert.alert('You’re in', `${plan.name} is active. ${plan.dailyAutoApplyQuota} auto-applies per day.`);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Payment', e instanceof Error ? e.message : 'Could not complete payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen safe edges={['left', 'right', 'bottom']}>
      <FadeInView>
        <LinearGradient colors={plan.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Animated.View style={styles.heroArt}>
            <View style={styles.heroOrb} />
            <View style={styles.heroIcon}>
              <Ionicons name={iconMeta.icon} size={28} color="#fff" />
            </View>
          </Animated.View>

          {plan.popular ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>MOST POPULAR</Text>
            </View>
          ) : null}
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.tagline}>{plan.tagline}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatInr(plan.priceInr)}</Text>
            <Text style={styles.period}>{plan.periodLabel}</Text>
          </View>
          <View style={styles.quota}>
            <Text style={styles.quotaText}>{plan.dailyAutoApplyQuota} auto-apply per day</Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What’s included</Text>
          {plan.includes.map((item) => (
            <View key={item} style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.include}>{item}</Text>
            </View>
          ))}
        </View>

        {isCurrent ? <Text style={styles.current}>This is your current plan</Text> : null}

        <Pressable style={styles.payBtn} onPress={() => void onPay()} disabled={busy || isCurrent}>
          <LinearGradient colors={plan.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payInner}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>
                {isCurrent
                  ? 'Active'
                  : razorpayConfigured
                    ? `Pay ${formatInr(plan.priceInr)} with Razorpay`
                    : `Activate ${plan.name} (demo)`}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable style={styles.ghost} onPress={() => router.push('/plans' as never)}>
          <Text style={styles.ghostText}>Compare all plans</Text>
        </Pressable>
        <Text style={styles.hint}>
          {Platform.OS === 'web'
            ? 'Razorpay checkout opens on this page. GST invoice comes from Razorpay.'
            : 'On phone, Razorpay opens in a secure browser window.'}
        </Text>
      </FadeInView>
    </Screen>
  );
}
