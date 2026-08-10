import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInputProps,
  PressableProps,
  ViewStyle,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, Spacing, Shadows } from '@/constants/theme';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export function Button({
  title,
  loading,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  icon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary' || variant === 'yellow') {
    const gradientColors = variant === 'yellow' ? Colors.gradientYellow : Colors.gradient;
    return (
      <Pressable
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.buttonBase,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
          style as ViewStyle,
        ]}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizeStyles[size]]}
        >
          {loading ? (
            <ActivityIndicator color={variant === 'yellow' ? Colors.text : Colors.white} />
          ) : (
            <Text style={[styles.buttonText, sizeTextStyles[size], variant === 'yellow' && { color: Colors.text }]}>
              {icon ? `${icon} ` : ''}{title}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyles = {
    secondary: { bg: Colors.secondary, text: Colors.text, border: 'transparent' },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
    ghost: { bg: 'transparent', text: Colors.textSecondary, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        sizeStyles[size],
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} />
      ) : (
        <Text style={[styles.buttonText, sizeTextStyles[size], { color: variantStyles.text }]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Ionicons name (e.g. mail-outline) or legacy emoji string */
  icon?: keyof typeof Ionicons.glyphMap | (string & {});
  /** When true with secureTextEntry, shows an eye toggle */
  showPasswordToggle?: boolean;
}

function isIoniconName(icon: string): icon is keyof typeof Ionicons.glyphMap {
  return /^[a-z0-9-]+$/.test(icon);
}

export function Input({
  label,
  error,
  style,
  icon,
  secureTextEntry,
  showPasswordToggle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;
  const toggle = showPasswordToggle ?? isPassword;

  return (
    <View style={styles.inputContainer}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {icon ? (
          isIoniconName(icon) ? (
            <Ionicons
              name={icon}
              size={18}
              color={focused ? Colors.primary : Colors.textMuted}
              style={styles.inputIconGlyph}
            />
          ) : (
            <Text style={styles.inputIconEmoji}>{icon}</Text>
          )
        ) : null}
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            toggle && isPassword ? styles.inputWithToggle : null,
            style,
          ]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !visible}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {toggle && isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            style={styles.inputToggle}
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'elevated' }: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && Shadows.card,
    variant === 'outlined' && styles.cardOutlined,
    style,
  ];

  const content = <View style={cardStyle}>{children}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
}

export function Badge({ text, color = Colors.textOnPrimary, backgroundColor = Colors.primary }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

interface MatchScoreBarProps {
  label: string;
  score: number;
}

export function MatchScoreBar({ label, score }: MatchScoreBarProps) {
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.secondary : Colors.danger;

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreValue, { color }]}>{score}%</Text>
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

interface PlatformBadgeProps {
  platform: string;
  color: string;
  icon: string;
}

export function PlatformBadge({ platform, color, icon }: PlatformBadgeProps) {
  return (
    <View style={[styles.platformBadge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={styles.platformIcon}>{icon}</Text>
      <Text style={[styles.platformText, { color }]}>{platform}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024 && width < 1440;
  const isWide = width >= 1440;

  const maxContentWidth = isMobile
    ? Math.min(width - 32, 520)
    : isTablet
      ? Math.min(width - 48, 720)
      : isDesktop
        ? Math.min(width - 64, 960)
        : 1200;

  const horizontalPadding = isMobile ? Spacing.md : isTablet ? Spacing.lg : Spacing.xl;
  const bottomPadding = Platform.OS === 'ios' ? Spacing.xxl : Spacing.xl;
  const columns = isWide ? 3 : isDesktop ? 3 : isTablet ? 2 : 1;
  const gap = isMobile ? Spacing.sm : Spacing.md;
  const heroHeight = isMobile ? 180 : isTablet ? 200 : 220;
  const fontScale = isMobile ? 1 : isTablet ? 1.05 : 1.1;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    maxContentWidth,
    horizontalPadding,
    bottomPadding,
    columns,
    gap,
    heroHeight,
    fontScale,
  };
}

const sizeStyles = {
  sm: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, minHeight: 40 },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, minHeight: 48 },
  lg: { paddingVertical: Spacing.md + 6, paddingHorizontal: Spacing.xl, minHeight: 54 },
};

const sizeTextStyles = {
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.md },
  lg: { fontSize: FontSize.lg },
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minHeight: 48,
    ...Shadows.sm,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  inputContainer: { marginBottom: Spacing.md },
  label: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  inputWrapperError: { borderColor: Colors.danger },
  inputIconGlyph: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  inputIconEmoji: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  inputWithIcon: { paddingLeft: Spacing.xl + Spacing.sm },
  inputWithToggle: { paddingRight: Spacing.xl + Spacing.sm },
  inputToggle: {
    position: 'absolute',
    right: Spacing.md,
    padding: 4,
    zIndex: 1,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.xs, marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardOutlined: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  scoreLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, width: 90 },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: BorderRadius.full },
  scoreValue: { fontSize: FontSize.sm, fontWeight: '700', width: 40, textAlign: 'right' },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderTopWidth: 4,
    flex: 1,
    minWidth: 130,
    ...Shadows.card,
  },
  statIcon: { fontSize: 28, marginBottom: Spacing.xs },
  statValue: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800' },
  statTitle: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2, fontWeight: '500' },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  platformIcon: { fontSize: 14 },
  platformText: { fontSize: FontSize.xs, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  sectionAction: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});
