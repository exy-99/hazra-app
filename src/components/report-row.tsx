import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { STATUS } from '@/constants/status';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ATTENDANCE_PCT_FLOOR, type AttendanceSummary } from '@/utils/attendance';

export interface ReportRowProps {
  workerId: string;
  name: string;
  summary: AttendanceSummary;
  onOpen: (id: string) => void;
  onExport?: (workerId: string) => void;
}

export const ReportRow = memo(function ReportRow({
  workerId,
  name,
  summary,
  onOpen,
  onExport,
}: ReportRowProps): React.JSX.Element {
  const theme = useTheme();
  const belowFloor =
    summary.percentage !== null && summary.percentage < ATTENDANCE_PCT_FLOOR;
  const counts = [
    { key: 'present', value: summary.present },
    { key: 'absent', value: summary.absent },
    { key: 'half_day', value: summary.half_day },
    { key: 'off_day', value: summary.off_day },
  ] as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${name} profile`}
      android_ripple={{ color: theme.muted }}
      onPress={() => onOpen(workerId)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={styles.top}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.foreground }]}>
          {name}
        </Text>
        <Text
          style={[
            styles.pct,
            { color: belowFloor ? theme.accent : theme.foreground },
          ]}>
          {summary.percentage === null ? '—' : `${summary.percentage}%`}
        </Text>
      </View>
      <View style={styles.chips}>
        {counts.map((chip) => {
          const meta = STATUS[chip.key];
          return (
            <View
              key={chip.key}
              accessibilityLabel={`${chip.value} ${meta.label.toLowerCase()}`}
              style={[
                styles.chip,
                { backgroundColor: meta.tint, borderColor: meta.solid },
              ]}>
              <Text style={[styles.chipText, { color: meta.text }]}>
                {`${chip.value} ${meta.label}`}
              </Text>
            </View>
          );
        })}
      </View>
      {onExport !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Export ${name} history`}
          android_ripple={{ color: theme.muted }}
          onPress={() => onExport?.(workerId)}
          style={({ pressed }) => [
            styles.exportRow,
            { opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.exportLabel, { color: theme.primary }]}>
            Export
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    ...Type.label,
    flex: 1,
  },
  pct: {
    ...Type.h2,
    fontVariant: ['tabular-nums'],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Type.caption,
    fontVariant: ['tabular-nums'],
  },
  exportRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  exportLabel: {
    ...Type.label,
  },
});
