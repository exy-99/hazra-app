import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CYCLE, STATUS, type AttendanceStatus } from '@/constants/status';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StatusPillProps {
  status: AttendanceStatus | null;
  onCycle: () => void;
  onPick: (s: AttendanceStatus) => void;
}

export function StatusPill({
  status,
  onCycle,
  onPick,
}: StatusPillProps): React.JSX.Element {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const entry = status === null ? null : STATUS[status];
  const backgroundColor = entry ? entry.tint : theme.surface;
  const borderColor = entry ? entry.solid : theme.border;
  const textColor = entry ? entry.text : theme.mutedForeground;
  const label = entry ? entry.label : 'Mark';

  function pick(next: AttendanceStatus) {
    onPick(next);
    setPickerOpen(false);
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          entry ? entry.label : 'Unmarked — tap to mark present'
        }
        android_ripple={{ color: entry ? entry.solid : theme.muted }}
        delayLongPress={400}
        onPress={onCycle}
        onLongPress={() => setPickerOpen(true)}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor, borderColor, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Pressable>
      {pickerOpen ? (
        <View style={styles.picker}>
          {CYCLE.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${STATUS[option].label}`}
              android_ripple={{ color: STATUS[option].solid }}
              onPress={() => pick(option)}
              style={({ pressed }) => [
                styles.miniPill,
                {
                  backgroundColor: STATUS[option].tint,
                  borderColor: STATUS[option].solid,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text
                style={[styles.miniLabel, { color: STATUS[option].text }]}>
                {STATUS[option].label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close status picker"
            android_ripple={{ color: theme.muted }}
            onPress={() => setPickerOpen(false)}
            style={({ pressed }) => [
              styles.closeRow,
              { opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={[styles.closeLabel, { color: theme.mutedForeground }]}>
              Close
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  label: {
    ...Type.label,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  miniPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  miniLabel: {
    ...Type.label,
  },
  closeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  closeLabel: {
    ...Type.label,
  },
});
