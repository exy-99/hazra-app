import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ATTENDANCE_PCT_FLOOR } from '@/utils/attendance';

const RING_SIZE = 120;
const STROKE_WIDTH = 12;

export function AttendanceRing({
  value,
  size = RING_SIZE,
}: {
  value: number | null;
  size?: number;
}): React.JSX.Element {
  const theme = useTheme();

  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = value === null ? 0 : value / 100;
  const progressColor =
    value !== null && value < ATTENDANCE_PCT_FLOOR
      ? theme.accent
      : theme.primary;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityRole="text"
      accessibilityLabel={
        value === null ? 'No attendance' : `Attendance ${value} percent`
      }>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.muted}
          strokeWidth={STROKE_WIDTH}
        />
        {value === null ? null : (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${fraction * circumference} ${circumference}`}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={[styles.label, { color: theme.foreground }]}>
          {value === null ? '—' : `${value}%`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Type.h1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
