import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { Shadows } from '@/constants/theme';
import { PLAN_LIST, type PlanId } from '@/constants/plans';
import { useColors, useThemeMode } from '@/hooks/useColors';

const PLAN_ART: Record<PlanId, { icon: keyof typeof Ionicons.glyphMap }> = {
  starter: { icon: 'rocket-outline' },
  pro: { icon: 'sparkles-outline' },
  elite: { icon: 'diamond-outline' },
};

const FEATURE_BADGES = ['AI Powered', 'Fast Setup', 'Best Value'];

export default function PlansIndexScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isDark } = useThemeMode();
  const { width } = useWindowDimensions();
  const isCompact = width < 700;

  const palette = {
    pageBackground: isDark ? '#0b0c18' : '#eef0ff',
    shellBackground: isDark ? '#111827' : '#f7f6fb',
    surface: isDark ? '#1c1f36' : '#ffffff',
    surfaceAlt: isDark ? '#101827' : '#ffffff',
    cardBackground: isDark ? '#161d2b' : '#ffffff',
    border: isDark ? 'rgba(167,180,255,0.16)' : '#eceaf9',
    borderSoft: isDark ? 'rgba(167,180,255,0.12)' : '#f0edf8',
    text: isDark ? '#eef2ff' : '#171b2d',
    textSoft: isDark ? '#b9c0d9' : '#69728d',
    textMuted: isDark ? '#8a93b5' : '#606a86',
    badgeBackground: isDark ? '#1f2333' : '#f5f3ff',
    badgeBorder: isDark ? '#3a4565' : '#e6e0ff',
    badgeText: isDark ? '#e1e7ff' : '#3f4667',
    compareBackground: isDark ? '#101827' : '#fbfbfe',
    footerBackground: isDark ? '#181f2d' : '#f8f8fc',
    footerBorder: isDark ? '#2a3145' : '#eceef9',
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: {
          flex: 1,
          backgroundColor: palette.pageBackground,
        },
        shell: {
          width: '100%',
          maxWidth: 1100,
          alignSelf: 'center',
          borderRadius: 30,
          backgroundColor: palette.shellBackground,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: 'hidden',
          ...Shadows.md,
        },
        topBar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 12,
          backgroundColor: palette.surface,
          borderBottomWidth: 1,
          borderBottomColor: palette.borderSoft,
        },
        brand: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        logo: {
          width: 26,
          height: 26,
          borderRadius: 8,
          backgroundColor: '#6d5efc',
          alignItems: 'center',
          justifyContent: 'center',
        },
        logoText: {
          color: '#ffffff',
          fontWeight: '900',
          fontSize: 12,
        },
        brandText: {
          fontSize: 18,
          fontWeight: '900',
          color: palette.text,
        },
        nav: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
          justifyContent: 'center',
        },
        navItem: {
          color: palette.textSoft,
          fontSize: 13,
          fontWeight: '700',
        },
        navItemActive: {
          color: colors.primary,
          fontWeight: '800',
        },
        status: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: isDark ? '#1a2233' : '#f4f5fb',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(119,132,255,0.2)' : '#eef0fb',
        },
        statusText: {
          fontSize: 11,
          fontWeight: '800',
          color: palette.text,
        },
        hero: {
          paddingTop: 26,
          paddingBottom: 18,
          paddingHorizontal: isCompact ? 14 : 20,
          backgroundColor: palette.surface,
        },
        title: {
          textAlign: 'center',
          fontSize: isCompact ? 28 : 42,
          lineHeight: isCompact ? 34 : 50,
          fontWeight: '900',
          color: palette.text,
          letterSpacing: -1,
        },
        gradientText: {
          color: '#7d5af3',
        },
        subtitle: {
          textAlign: 'center',
          marginTop: 8,
          color: palette.textSoft,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
        },
        badgeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 18,
        },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: palette.badgeBackground,
          borderWidth: 1,
          borderColor: palette.badgeBorder,
        },
        badgeText: {
          fontSize: 11,
          fontWeight: '800',
          color: palette.badgeText,
        },
        badgeBest: {
          backgroundColor: '#fff1eb',
          borderColor: '#ffd9c4',
        },
        cardsWrapper: {
          paddingHorizontal: isCompact ? 12 : 22,
          paddingBottom: 18,
          backgroundColor: palette.surface,
        },
        cardsRow: {
          flexDirection: isCompact ? 'column' : 'row',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: isCompact ? 14 : 18,
        },
        card: {
          flex: 1,
          minWidth: 0,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(163,177,255,0.15)' : '#eaeaf4',
          backgroundColor: palette.cardBackground,
          overflow: 'hidden',
          ...Shadows.sm,
        },
        featured: {
          borderColor: '#dbe4ff',
          shadowColor: '#6d5efc',
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 6,
        },
        popularPill: {
          alignSelf: 'center',
          marginTop: 12,
          marginBottom: 8,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: isDark ? '#2a1f46' : '#f3ebff',
          borderWidth: 1,
          borderColor: isDark ? '#493771' : '#e4d8ff',
        },
        popularText: {
          color: isDark ? '#eee6ff' : '#5f4fea',
          fontSize: 11,
          fontWeight: '900',
        },
        cardContent: {
          padding: 18,
        },
        planHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: '#f3f0ff',
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardName: {
          fontSize: 26,
          fontWeight: '900',
          color: palette.text,
          letterSpacing: -0.8,
        },
        tagline: {
          marginTop: 6,
          color: palette.textMuted,
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 18,
          minHeight: 52,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          marginTop: 18,
          marginBottom: 14,
          gap: 4,
        },
        rupee: {
          fontSize: 19,
          fontWeight: '800',
          color: palette.text,
          marginBottom: 8,
        },
        price: {
          fontSize: 32,
          fontWeight: '900',
          color: palette.text,
          letterSpacing: -1,
        },
        perMonth: {
          fontSize: 11,
          color: palette.textSoft,
          fontWeight: '700',
          marginBottom: 8,
        },
        featuresList: {
          gap: 8,
          marginBottom: 18,
        },
        featureItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
        },
        featureText: {
          color: palette.textSoft,
          fontSize: 12,
          lineHeight: 18,
          fontWeight: '700',
          flexShrink: 1,
        },
        includeBox: {
          borderRadius: 12,
          backgroundColor: isDark ? '#181f33' : '#f3f5ff',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(157,170,255,0.12)' : '#e6e7f5',
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        includeLabel: {
          color: palette.textSoft,
          fontSize: 11,
          fontWeight: '800',
          marginBottom: 4,
        },
        includeText: {
          color: palette.text,
          fontSize: 12,
          lineHeight: 17,
          fontWeight: '600',
        },
        ctaAction: {
          marginTop: 18,
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(76,74,236,0.14)',
          backgroundColor: isDark ? '#0f172a' : '#eef2ff',
          ...Shadows.sm,
        },
        cta: {
          borderRadius: 14,
          minHeight: 48,
          paddingHorizontal: 18,
          paddingVertical: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        },
        ctaText: {
          color: '#ffffff',
          fontSize: 14,
          fontWeight: '900',
          letterSpacing: 0.2,
        },
        compareBox: {
          backgroundColor: palette.compareBackground,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(156,170,255,0.12)' : '#e9ebf7',
          paddingHorizontal: isCompact ? 14 : 22,
          paddingTop: 20,
          paddingBottom: 10,
        },
        compareTitle: {
          fontSize: 18,
          fontWeight: '900',
          color: palette.text,
          marginBottom: 12,
        },
        compareHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#ececf7',
          paddingBottom: 10,
        },
        compareFirstCell: {
          flex: 1.3,
          color: palette.text,
          fontSize: 12,
          fontWeight: '800',
        },
        planColumn: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.textSoft,
          fontSize: 12,
          fontWeight: '800',
        },
        compareRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 9,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(164,177,255,0.08)' : '#f1f2fb',
        },
        compareLabel: {
          flex: 1.3,
          color: palette.textSoft,
          fontSize: 12,
          fontWeight: '700',
        },
        compareValue: {
          flex: 1,
          textAlign: 'center',
          color: palette.text,
          fontSize: 12,
          fontWeight: '800',
        },
        footerPills: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 16,
          paddingBottom: 8,
        },
        footerPill: {
          flex: 1,
          minWidth: 140,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: palette.footerBackground,
          borderWidth: 1,
          borderColor: palette.footerBorder,
          borderRadius: 12,
          paddingVertical: 10,
        },
        footerText: {
          color: palette.textSoft,
          fontSize: 11,
          fontWeight: '700',
        },
      }),
    [isCompact],
  );

  const comparisonRows = [
    { label: 'Auto-applies per day', values: ['8', '25', '50'] },
    { label: 'AI cover letters', values: ['×', '✓', '✓'] },
    { label: 'Outreach tools', values: ['×', '✓', '✓'] },
    { label: 'AI resume improvement', values: ['×', '✓', '✓'] },
    { label: 'Analytics dashboard', values: ['×', '✓', '✓'] },
    { label: 'Live job refresh', values: ['×', '×', '✓'] },
    { label: 'Priority matching', values: ['×', '×', '✓'] },
    { label: 'Recruiter outreach', values: ['×', '×', '✓'] },
    { label: 'Full automation suite', values: ['×', '×', '✓'] },
  ];

  const getPlanButtonTheme = (planId: PlanId): { gradient: readonly [string, string]; shadow: string } => {
    if (planId === 'starter') {
      return {
        gradient: isDark ? (['#5f5af7', '#8d7bff'] as const) : (['#5d59f1', '#7d6bff'] as const),
        shadow: '#635ae8',
      };
    }

    if (planId === 'pro') {
      return {
        gradient: isDark ? (['#7e69ff', '#ff7a66'] as const) : (['#695af5', '#ff7e5b'] as const),
        shadow: '#7b66ff',
      };
    }

    return {
      gradient: isDark ? (['#0ea5e9', '#6d5efc'] as const) : (['#0d9df1', '#5f5ae8'] as const),
      shadow: '#4a6ef7',
    };
  };

  return (
    <Screen safe edges={['left', 'right', 'bottom']} style={styles.page} contentStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.brandText}>ApplyAI</Text>
          </View>

          <View style={styles.nav}>
            <Text style={[styles.navItem, styles.navItemActive]}>Dashboard</Text>
            <Text style={styles.navItem}>Jobs</Text>
            <Text style={styles.navItem}>Applications</Text>
            <Text style={styles.navItem}>Resume</Text>
            <Text style={styles.navItem}>Tools</Text>
            <Text style={styles.navItem}>Pricing</Text>
          </View>

          <View style={styles.status}>
            <Ionicons name="shield-checkmark" size={12} color="#4a4cdb" />
            <Text style={styles.statusText}>100% Secure</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>
            Choose a plan that fits your <Text style={styles.gradientText}>momentum</Text>
          </Text>
          <Text style={styles.subtitle}>Start with the basics or upgrade to unlock smarter AI-powered job search.</Text>

          <View style={styles.badgeRow}>
            {FEATURE_BADGES.map((label) => (
              <View key={label} style={[styles.badge, label === 'Best Value' && styles.badgeBest]}>
                <Ionicons
                  name={label === 'AI Powered' ? 'sparkles-outline' : label === 'Fast Setup' ? 'flash-outline' : 'trophy-outline'}
                  size={13}
                  color={label === 'Best Value' ? '#ff7a66' : '#5f4fea'}
                />
                <Text style={styles.badgeText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cardsWrapper}>
          <View style={styles.cardsRow}>
            {PLAN_LIST.map((plan) => {
              const isPro = plan.id === 'pro';
              const art = PLAN_ART[plan.id];
              const iconColor = plan.id === 'starter' ? '#6257f0' : plan.id === 'pro' ? '#3f7cff' : '#ff8d4a';
              const iconBg = plan.id === 'starter' ? '#f0ebff' : plan.id === 'pro' ? '#eef3ff' : '#fff3eb';

              const buttonTheme = getPlanButtonTheme(plan.id);

              return (
                <Pressable key={plan.id} onPress={() => router.push(`/plans/${plan.id}` as never)} style={[styles.card, isPro && styles.featured]}>
                  {isPro ? (
                    <View style={styles.popularPill}>
                      <Text style={styles.popularText}>★ Most Popular</Text>
                    </View>
                  ) : null}

                  <LinearGradient
                    colors={plan.id === 'starter' ? (isDark ? ['#1d2435', '#141c2d'] : ['#ffffff', '#fcfbff']) : plan.id === 'pro' ? (isDark ? ['#171d2d', '#111827'] : ['#f7faff', '#f9f9ff']) : (isDark ? ['#221b17', '#17141d'] : ['#fffaf6', '#ffffff'])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardContent}
                  >
                    <View style={styles.planHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                        <Ionicons name={art.icon} size={24} color={iconColor} />
                      </View>
                    </View>

                    <Text style={styles.cardName}>{plan.name}</Text>
                    <Text style={styles.tagline}>{plan.tagline}</Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.rupee}>₹</Text>
                      <Text style={styles.price}>{plan.priceInr.toLocaleString('en-IN')}</Text>
                      <Text style={styles.perMonth}>/ month</Text>
                    </View>

                    <View style={styles.featuresList}>
                      {plan.highlights.map((item) => (
                        <View key={item} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={16} color={iconColor} />
                          <Text style={styles.featureText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.includeBox}>
                      <Text style={styles.includeLabel}>Includes</Text>
                      <Text style={styles.includeText}>{plan.includes[0]}</Text>
                    </View>

                    <Pressable
                      onPress={() => router.push(`/plans/${plan.id}` as never)}
                      style={({ pressed }) => [
                        styles.ctaAction,
                        {
                          opacity: pressed ? 0.9 : 1,
                          transform: [{ scale: pressed ? 0.985 : 1 }],
                          shadowColor: buttonTheme.shadow,
                          shadowOpacity: pressed ? 0.18 : 0.26,
                          shadowRadius: pressed ? 8 : 12,
                          elevation: pressed ? 3 : 5,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={buttonTheme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cta}
                      >
                        <Text style={styles.ctaText}>{plan.id === 'starter' ? 'Get Starter' : plan.id === 'pro' ? 'Choose Pro' : 'Go Elite'}</Text>
                      </LinearGradient>
                    </Pressable>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.compareBox}>
          <Text style={styles.compareTitle}>Compare Plans</Text>

          <View style={styles.compareHeader}>
            <Text style={styles.compareFirstCell}>Feature</Text>
            {PLAN_LIST.map((plan) => (
              <Text key={plan.id} style={styles.planColumn}>{plan.name}</Text>
            ))}
          </View>

          {comparisonRows.map((row) => (
            <View key={row.label} style={styles.compareRow}>
              <Text style={styles.compareLabel}>{row.label}</Text>
              {row.values.map((value, index) => (
                <Text key={`${row.label}-${PLAN_LIST[index].id}`} style={styles.compareValue}>{value}</Text>
              ))}
            </View>
          ))}

          <View style={styles.footerPills}>
            <View style={styles.footerPill}>
              <Ionicons name="shield-checkmark" size={14} color="#4f5be2" />
              <Text style={styles.footerText}>Cancel anytime</Text>
            </View>
            <View style={styles.footerPill}>
              <Ionicons name="lock-closed" size={14} color="#4f5be2" />
              <Text style={styles.footerText}>Secure payments</Text>
            </View>
            <View style={styles.footerPill}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#4f5be2" />
              <Text style={styles.footerText}>24/7 support</Text>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
