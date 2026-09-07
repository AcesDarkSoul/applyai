import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SHELL_FONT } from '@/components/layout/shellTheme';

export type ChartPoint = { day: string; value: number };

type Props = {
  data: ChartPoint[];
  height?: number;
  lineColor?: string;
  labelColor?: string;
  fillFrom?: string;
};

export function LineChart({
  data,
  height = 180,
  lineColor = '#6D5EFC',
  labelColor = '#8A92B0',
  fillFrom = 'rgba(109,94,252,0.28)',
}: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const { line, area, points, peak } = useMemo(() => {
    const padX = 12;
    const padTop = 28;
    const padBottom = 8;
    const max = Math.max(...data.map((d) => d.value), 1);
    const innerW = Math.max(width - padX * 2, 1);
    const innerH = height - padTop - padBottom;
    const pts = data.map((d, i) => {
      const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = padTop + innerH - (d.value / max) * innerH;
      return { ...d, x, y };
    });
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    const areaPath = pts.length
      ? `${linePath} L${pts[pts.length - 1].x} ${padTop + innerH} L${pts[0].x} ${padTop + innerH} Z`
      : '';
    const peakPt = pts.reduce((best, p) => (p.value >= best.value ? p : best), pts[0]);
    return { line: linePath, area: areaPath, points: pts, peak: peakPt };
  }, [data, height, width]);

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 ? (
        <View style={{ height }}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={fillFrom} stopOpacity="1" />
                <Stop offset="1" stopColor={fillFrom} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {area ? <Path d={area} fill="url(#chartFill)" /> : null}
            {line ? (
              <Path d={line} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {points.map((p) => (
              <Circle key={p.day} cx={p.x} cy={p.y} r={p === peak ? 6 : 4} fill="#fff" stroke={lineColor} strokeWidth={2.5} />
            ))}
          </Svg>
          {peak ? (
            <View style={[styles.tooltip, { left: Math.min(Math.max(peak.x - 54, 0), width - 110), top: Math.max(peak.y - 36, 0) }]}>
              <Text style={styles.tooltipText}>{peak.value} Applications</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.labels}>
        {data.map((d) => (
          <Text key={d.day} style={[styles.label, { color: labelColor }]}>
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 8 },
  label: { fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '700' },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#6D5EFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipText: { color: '#fff', fontFamily: SHELL_FONT, fontSize: 11, fontWeight: '800' },
});
