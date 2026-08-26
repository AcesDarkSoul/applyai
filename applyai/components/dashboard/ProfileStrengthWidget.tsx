import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize } from '@/constants/theme';

export function ProfileStrengthWidget({
  percentage = 85,
  onImprovePress,
  fullWidth = false,
}: {
  percentage?: number;
  onImprovePress?: () => void;
  fullWidth?: boolean;
}) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const radius = 28;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (isMobile || fullWidth) {
    return (
      <View
        style={[
          styles.mobileCard,
          {
            backgroundColor: colors.heroInnerCardBg,
            borderColor: colors.heroInnerCardBorder,
          },
        ]}
      >
        <View style={styles.mobileLeftRow}>
          <View style={styles.mobileGaugeWrapper}>
            <Svg width={66} height={66} viewBox="0 0 66 66">
              <Circle
                cx="33"
                cy="33"
                r={26}
                stroke={colors.border}
                strokeWidth={ strokeWidth }
                fill="none"
              />
              <Circle
                cx="33"
                cy="33"
                r={26}
                stroke={colors.primary}
                strokeWidth={ strokeWidth }
                fill="none"
                strokeDasharray={`${2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                strokeDashoffset={2 * Math.PI * 26 - (percentage / 100) * 2 * Math.PI * 26}
                strokeLinecap="round"
                transform="rotate(-90 33 33)"
              />
            </Svg>
            <View style={styles.gaugeTextContainer}>
              <Text style={[styles.gaugeTextMobile, { color: colors.text }]}>{percentage}%</Text>
            </View>
          </View>

          <View style={styles.mobileTextCol}>
            <Text numberOfLines={1} style={[styles.titleMobile, { color: colors.text }]}>
              Profile Strength
            </Text>
            <Text numberOfLines={1} style={[styles.subtextMobile, { color: colors.textSecondary }]}>
              Great! Keep it up.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onImprovePress}
          style={({ pressed }) => [
            styles.mobileButton,
            { backgroundColor: colors.primaryTint },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text numberOfLines={1} style={[styles.buttonText, { color: colors.primary }]}>
            Improve Profile
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.heroInnerCardBg,
          borderColor: colors.heroInnerCardBorder,
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
        Profile Strength
      </Text>

      {/* SVG Circular Ring Gauge */}
      <View style={styles.gaugeWrapper}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle
            cx="40"
            cy="40"
            r={32}
            stroke={colors.border}
            strokeWidth={7}
            fill="none"
          />
          <Circle
            cx="40"
            cy="40"
            r={32}
            stroke={colors.primary}
            strokeWidth={7}
            fill="none"
            strokeDasharray={`${2 * Math.PI * 32} ${2 * Math.PI * 32}`}
            strokeDashoffset={2 * Math.PI * 32 - (percentage / 100) * 2 * Math.PI * 32}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
          />
        </Svg>
        <View style={styles.gaugeTextContainer}>
          <Text style={[styles.gaugeText, { color: colors.text }]}>{percentage}%</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={[styles.subtext, { color: colors.textSecondary }]}>
        Great! Keep it up.
      </Text>

      <Pressable
        onPress={onImprovePress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primaryTint },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text numberOfLines={1} style={[styles.buttonText, { color: colors.primary }]}>
          Improve Profile
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: 170,
    minWidth: 170,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mobileCard: {
    width: '100%',
    minWidth: '100%',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mobileLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  mobileGaugeWrapper: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileTextCol: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleMobile: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtextMobile: {
    fontSize: 11,
  },
  gaugeWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  gaugeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  gaugeTextMobile: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  mobileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
