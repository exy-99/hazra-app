import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CalendarSheet } from '@/components/calendar-sheet';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDisplay, lastNDays, todayKey } from '@/utils/dates';

export interface DateStripProps {
  selectedDate: string;
  onSelectDate: (key: string) => void;
}

function stripFor(selectedDate: string): string[] {
  const today = todayKey();
  if (selectedDate >= today) {
    return lastNDays(7);
  }
  const centered = [-3, -2, -1, 0, 1, 2, 3]
    .map((offset) => addDays(selectedDate, offset))
    .filter((key) => key <= today);
  const filled = [...centered];
  while (filled.length < 7) {
    filled.unshift(addDays(filled[0], -1));
  }
  return filled;
}

export function DateStrip({ selectedDate, onSelectDate }: DateStripProps): React.JSX.Element {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const today = todayKey();
  const isToday = selectedDate === today;
  const strip = stripFor(selectedDate);

  function closePicker() {
    setPickerOpen(false);
  }

  function pickDate(key: string) {
    onSelectDate(key);
    setPickerOpen(false);
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text
          style={[styles.selectedLabel, { color: theme.foreground }]}>
          {formatDisplay(selectedDate)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jump to today"
          android_ripple={{ color: theme.muted }}
          disabled={isToday}
          onPress={() => onSelectDate(todayKey())}
          style={({ pressed }) => [
            styles.todayButton,
            { opacity: pressed && !isToday ? 0.85 : 1 },
          ]}>
          <Text
            style={[
              styles.todayLabel,
              { color: isToday ? theme.mutedForeground : theme.primary },
            ]}>
            Today
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}>
        {strip.map((key) => {
          const selected = key === selectedDate;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={formatDisplay(key)}
              android_ripple={{ color: selected ? theme.onPrimary : theme.muted }}
              onPress={() => onSelectDate(key)}
              style={({ pressed }) => [
                styles.cell,
                selected
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text
                style={[
                  styles.weekday,
                  { color: selected ? theme.onPrimary : theme.mutedForeground },
                ]}>
                {formatDisplay(key, 'dd')}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: selected ? theme.onPrimary : theme.foreground },
                ]}>
                {formatDisplay(key, 'D')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pick a date"
        android_ripple={{ color: theme.muted }}
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [
          styles.pickRow,
          { opacity: pressed ? 0.85 : 1 },
        ]}>
        <CalendarDays size={18} color={theme.primary} />
        <Text style={[styles.pickLabel, { color: theme.primary }]}>
          Pick a date
        </Text>
      </Pressable>
      <CalendarSheet
        visible={pickerOpen}
        selectedKey={selectedDate}
        maxDate={today}
        daysBack={30}
        onPick={pickDate}
        onClose={closePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  selectedLabel: {
    ...Type.h2,
    fontVariant: ['tabular-nums'],
  },
  todayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  todayLabel: {
    ...Type.label,
  },
  stripContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  weekday: {
    ...Type.caption,
  },
  dayNumber: {
    ...Type.label,
    fontVariant: ['tabular-nums'],
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  pickLabel: {
    ...Type.label,
  },
});
