import dayjs from 'dayjs';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { monthLabel } from '@/utils/export';

export interface MonthSheetProps {
  visible: boolean;
  selectedMonth: string | null;
  maxMonth: string;
  monthsBack?: number;
  onPick: (month: string) => void;
  onClose: () => void;
}

export function MonthSheet({
  visible,
  selectedMonth,
  maxMonth,
  monthsBack,
  onPick,
  onClose,
}: MonthSheetProps): React.JSX.Element {
  const theme = useTheme();
  const months = Array.from({ length: monthsBack ?? 12 }, (_, i) =>
    dayjs(`${maxMonth}-01`).subtract(i, 'month').format('YYYY-MM'),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close month picker"
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: theme.foreground }]}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <FlatList
            data={months}
            keyExtractor={(month) => month}
            renderItem={({ item }) => {
              const selected = item === selectedMonth;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={monthLabel(item)}
                  android_ripple={{ color: theme.muted }}
                  onPress={() => onPick(item)}
                  style={({ pressed }) => [
                    styles.pickItem,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <Text
                    style={[
                      styles.pickItemLabel,
                      { color: selected ? theme.primary : theme.foreground },
                    ]}>
                    {monthLabel(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingVertical: Spacing.two,
  },
  pickItem: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  pickItemLabel: {
    ...Type.body,
    fontVariant: ['tabular-nums'],
  },
});
