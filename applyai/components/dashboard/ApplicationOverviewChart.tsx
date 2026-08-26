import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColors } from '@/hooks/useColors';
import { BorderRadius, FontSize, Shadows } from '@/constants/theme';

interface DataPoint {
  day: string;
  value: number;
}

const DEFAULT_DATA: DataPoint[] = [
  { day: 'Mon', value: 6 },
  { day: 'Tue', value: 12 },
  { day: 'Wed', value: 8 },
  { day: 'Thu', value: 11 },
  { day: 'Fri', value: 7 },
  { day: 'Sat', value: 13 },
  { day: 'Sun', value: 9 },
];

export function ApplicationOverviewChart({ data = DEFAULT_DATA }: { data?: DataPoint[] }) {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState<number>(1); // Default Tuesday active (value 12)
  const [chartWidth, setChartWidth] = useState<number>(360);
  const chartHeight = 160;
  const paddingLeft = 32;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const yMax = 20;
  const drawWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);
  const drawHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * drawWidth;
    const y = paddingTop + drawHeight - (d.value / yMax) * drawHeight;
    return { x, y, ...d };
  });

  // Build Catmull-Rom or Cubic Bezier smooth path string
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1X = curr.x + (next.x - curr.x) / 2;
      const cp1Y = curr.y;
      const cp2X = curr.x + (next.x - curr.x) / 2;
      const cp2Y = next.y;
      pathD += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  }

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setChartWidth(w);
  };

  const activePoint = points[activeIndex] || points[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Application Overview</Text>
        <Pressable
          style={[styles.dropdownPill, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
        >
          <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>This Week</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* SVG Chart */}
      <View style={styles.chartContainer} onLayout={handleLayout}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.chartFillGradient[0]} />
              <Stop offset="100%" stopColor={colors.chartFillGradient[1]} />
            </LinearGradient>
          </Defs>

          {/* Horizontal Grid lines */}
          {[0, 5, 10, 15, 20].map((val) => {
            const y = paddingTop + drawHeight - (val / yMax) * drawHeight;
            return (
              <React.Fragment key={val}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={colors.borderLight}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </React.Fragment>
            );
          })}

          {/* Area Fill */}
          <Path d={areaD} fill="url(#chartAreaGrad)" />

          {/* Line Curve */}
          <Path d={pathD} stroke={colors.chartLine} strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Data Circles */}
          {points.map((pt, idx) => (
            <React.Fragment key={pt.day}>
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={idx === activeIndex ? 6 : 4}
                fill={idx === activeIndex ? colors.chartLine : colors.surface}
                stroke={colors.chartLine}
                strokeWidth={idx === activeIndex ? 3 : 2}
              />
            </React.Fragment>
          ))}
        </Svg>

        {/* Y-Axis Labels */}
        <View style={styles.yAxisLabels}>
          {[20, 15, 10, 5, 0].map((val) => (
            <Text key={val} style={[styles.axisText, { color: colors.textMuted }]}>
              {val}
            </Text>
          ))}
        </View>

        {/* X-Axis Labels */}
        <View style={[styles.xAxisLabels, { left: paddingLeft, width: drawWidth }]}>
          {points.map((pt, idx) => (
            <Pressable key={pt.day} onPress={() => setActiveIndex(idx)} style={styles.xLabelTouch}>
              <Text
                style={[
                  styles.axisText,
                  {
                    color: idx === activeIndex ? colors.primary : colors.textMuted,
                    fontWeight: idx === activeIndex ? '700' : '500',
                  },
                ]}
              >
                {pt.day}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Active Tooltip Badge */}
        {activePoint && (
          <View
            style={[
              styles.tooltipBadge,
              {
                left: Math.max(10, Math.min(chartWidth - 110, activePoint.x - 45)),
                top: Math.max(0, activePoint.y - 42),
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text style={styles.tooltipValue}>{activePoint.value}</Text>
            <Text style={styles.tooltipLabel}>Applications</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  chartContainer: {
    height: 190,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 4,
    top: 14,
    height: 110,
    justifyContent: 'space-between',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabelTouch: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  axisText: {
    fontSize: 10,
  },
  tooltipBadge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  tooltipLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.9,
  },
});
