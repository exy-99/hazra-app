import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDisplay } from '@/utils/dates';

export interface CalendarSheetProps {
  visible: boolean;
  selectedKey: string | null;
  maxDate: string;
  daysBack: number;
  onPick: (key: string) => void;
  onClose: () => void;
}

export function CalendarSheet({
  visible,
  selectedKey,
  maxDate,
  daysBack,
  onPick,
  onClose,
}: CalendarSheetProps): React.JSX.Element {
  const theme = useTheme();
  const dates = Array.from({ length: daysBack }, (_, i) => addDays(maxDate, -i));
  const activeElementRef = useRef<HTMLElement | null>(null);
  const wasVisible = useRef(false);

  // Web-only: return focus to the element that triggered the modal when it closes.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (visible && !wasVisible.current) {
      activeElementRef.current = document.activeElement as HTMLElement | null;
    }
    if (!visible && wasVisible.current) {
      activeElementRef.current?.focus?.();
      activeElementRef.current = null;
    }
    wasVisible.current = visible;
    return () => {
      activeElementRef.current?.focus?.();
      activeElementRef.current = null;
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="Choose a date">
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close date picker"
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: theme.foreground }]}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <FlatList
            data={dates}
            keyExtractor={(key) => key}
            renderItem={({ item }) => {
              const selected = item === selectedKey;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={formatDisplay(item)}
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
                    {formatDisplay(item)}
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
