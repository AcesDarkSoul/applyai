import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg';
import { Font } from '@/constants/fonts';

export type ChartPoint = { day: string; value: number };

type Props = {
  data: ChartPoint[];
  isDark: boolean;
};

export function WeekLineChart({ data, isDark }: Props) {
  const [width, setWidth] = useState(0);
  const height = 190;
  const pad = { l: 30, r: 12, t: 28, b: 32 };
  const yMax = Math.max(20, Math.ceil(Math.max(...data.map((d) => d.value), 1) / 5) * 5);
  const ticks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  const innerW = Math.max(0, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;

  const points = useMemo(() => {
    if (!innerW) return [];
    return data.map((d, i) => {
      const x = pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = pad.t + innerH - (d.value / yMax) * innerH;
      return { ...d, x, y };
    });
  }, [data, innerW, innerH, pad.l, pad.t, yMax]);

  const peak = points.reduce((best, p) => (p.value >= best.value ? p : best), points[0] || { value: 0, x: 0, y: 0, day: '' });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${pad.t + innerH} L ${points[0].x} ${pad.t + innerH} Z`
    : '';

  const axis = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,34,70,0.08)';
  const label = isDark ? '#8b93b3' : '#8a90a8';
  const lineColor = '#6d5efc';

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#6d5efc" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#6d5efc" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((t) => {
            const y = pad.t + innerH - (t / yMax) * innerH;
            return (
              <Line
                key={t}
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke={axis}
                strokeWidth={1}
              />
            );
          })}
          {area ? <Path d={area} fill="url(#areaFill)" /> : null}
          {line ? <Path d={line} fill="none" stroke={lineColor} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /> : null}
          {points.map((p) => (
            <Circle key={p.day} cx={p.x} cy={p.y} r={5} fill="#fff" stroke={lineColor} strokeWidth={3} />
          ))}
        </Svg>
      ) : null}

      {ticks.map((t) => {
        const y = pad.t + innerH - (t / yMax) * innerH;
        return (
          <Text key={t} style={[styles.yLabel, { color: label, top: y - 8 }]}>
            {t}
          </Text>
        );
      })}

      {points.map((p) => (
        <Text key={p.day} style={[styles.xLabel, { color: label, left: p.x - 14, top: height - 22 }]}>
          {p.day}
        </Text>
      ))}

      {peak && peak.value > 0 ? (
        <View style={[styles.tooltip, { left: Math.min(Math.max(peak.x - 54, 8), width - 118), top: peak.y - 38 }]}>
          <Text style={styles.tooltipText}>{peak.value} Applications</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 190, position: 'relative' },
  yLabel: {
    position: 'absolute',
    left: 0,
    width: 26,
    fontSize: 10,
    fontFamily: Font.medium,
    textAlign: 'right',
  },
  xLabel: {
    position: 'absolute',
    width: 28,
    fontSize: 10,
    fontFamily: Font.semibold,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#6d5efc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Font.bold,
  },
});
