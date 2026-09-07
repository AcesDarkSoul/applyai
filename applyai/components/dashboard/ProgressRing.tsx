import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SHELL_FONT } from '@/components/layout/shellTheme';

type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  fillColor?: string;
  textColor?: string;
};

export function ProgressRing({
  percent,
  size = 86,
  stroke = 8,
  trackColor = '#E8E4FF',
  fillColor = '#6D5EFC',
  textColor = '#171D31',
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fillColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.value, { color: textColor }]}>{clamped}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  value: {
    fontFamily: SHELL_FONT,
    fontSize: 16,
    fontWeight: '800',
  },
});
