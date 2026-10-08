import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BucketSummary {
  key: string;
  label: string;
  percentage: number | null;
}

export interface TrendChartProps {
  buckets: BucketSummary[];
}

export const GAP_H = 8;

const CHART_HEIGHT = 200;
const PLOT_HEIGHT = 140;
// 360dp-safe after 16px gutters: plot area is a fixed 320-wide coordinate
// space; Svg stretches via width="100%" while Rect geometry stays in plot units.
const PLOT_WIDTH = 320;
const GAP = 4;

const Y_TICKS = [0, 25, 50, 75, 100];

export function TrendChart({ buckets }: TrendChartProps): React.JSX.Element {
  const theme = useTheme();

  const values = buckets
    .map((b) => b.percentage)
    .filter((v): v is number => v !== null);
  const accessibilityLabel =
    values.length === 0
      ? 'No trend data'
      : `Trend, ${buckets.length} bars, range ${Math.min(...values)}% to ${Math.max(...values)}%`;

  const bw =
    buckets.length === 0
      ? 0
      : (PLOT_WIDTH - GAP * (buckets.length - 1)) / buckets.length;
  const middle = Math.floor(buckets.length / 2);
  const showX = (i: number): boolean =>
    buckets.length > 0 &&
    (i === 0 || i === middle || i === buckets.length - 1);

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={styles.wrap}>
      <Text style={[styles.title, { color: theme.foreground }]}>Trend</Text>
      <View style={styles.chartRow}>
        <View style={styles.yAxis}>
          {Y_TICKS.slice()
            .reverse()
            .map((tick) => (
              <Text
                key={`y-${tick}`}
                style={[
                  styles.tick,
                  { color: theme.mutedForeground },
                ]}>
                {tick}
              </Text>
            ))}
        </View>
        <Svg height={CHART_HEIGHT} width="100%">
          {buckets.map((bucket, i) => {
            const pct = bucket.percentage;
            const countable = pct !== null;
            const height = countable
              ? (pct / 100) * PLOT_HEIGHT
              : GAP_H;
            return (
              <Rect
                key={bucket.key}
                x={i * (bw + GAP)}
                y={PLOT_HEIGHT - height}
                width={bw}
                height={height}
                rx={3}
                fill={countable ? theme.primary : theme.muted}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.xRow}>
        {buckets.map((bucket, i) => (
          <Text
            key={`x-${bucket.key}`}
            style={[
              styles.xLabel,
              { color: theme.mutedForeground },
            ]}>
            {showX(i) ? bucket.label : ''}
          </Text>
        ))}
      </View>
      <View style={styles.legendRow}>
        <View
          style={[styles.swatch, { backgroundColor: theme.primary }]}
        />
        <Text style={[styles.legend, { color: theme.mutedForeground }]}>
          Attendance %
        </Text>
        <View style={[styles.swatch, { backgroundColor: theme.muted }]} />
        <Text style={[styles.legend, { color: theme.mutedForeground }]}>
          No marks —
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  title: {
    ...Type.h2,
  },
  chartRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  yAxis: {
    justifyContent: 'space-between',
    height: PLOT_HEIGHT,
  },
  tick: {
    ...Type.caption,
    fontVariant: ['tabular-nums'],
  },
  xRow: {
    flexDirection: 'row',
  },
  xLabel: {
    ...Type.caption,
    flex: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legend: {
    ...Type.caption,
  },
});
