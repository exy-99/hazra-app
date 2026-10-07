import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CYCLE, STATUS, type AttendanceStatus } from '@/constants/status';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StatusPillProps {
  status: AttendanceStatus | null;
  onCycle: () => void;
  onOpenPicker: () => void;
}

export function StatusPill({
  status,
  onCycle,
  onOpenPicker,
}: StatusPillProps): React.JSX.Element {
  const theme = useTheme();

  const entry = status === null ? null : STATUS[status];
  const backgroundColor = entry ? entry.tint : theme.surface;
  const borderColor = entry ? entry.solid : theme.border;
  const textColor = entry ? entry.text : theme.mutedForeground;
  const label = entry ? entry.label : 'Mark';
  const longFired = useRef(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          entry ? entry.label : 'Unmarked — tap to mark present'
        }
        android_ripple={{ color: entry ? entry.solid : theme.muted }}
        delayLongPress={400}
        onPress={() => {
          if (longFired.current) {
            longFired.current = false;
            return;
          }
          onCycle();
        }}
        onLongPress={() => {
          longFired.current = true;
          onOpenPicker();
        }}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor, borderColor, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

export interface StatusPickerProps {
  onPick: (s: AttendanceStatus) => void;
  onClose: () => void;
}

export function StatusPicker({
  onPick,
  onClose,
}: StatusPickerProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.picker}>
      {CYCLE.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${STATUS[option].label}`}
          android_ripple={{ color: STATUS[option].solid }}
          onPress={() => onPick(option)}
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
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeRow,
          { opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.closeLabel, { color: theme.mutedForeground }]}>
          Close
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
  },
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
