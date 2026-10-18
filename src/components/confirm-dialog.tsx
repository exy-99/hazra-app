import type { JSX } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ConfirmDialog(props: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}): JSX.Element {
  const theme = useTheme();
  const { visible, title, message, confirmLabel, onConfirm, onCancel } = props;
  const activeElementRef = useRef<HTMLElement | null>(null);
  const wasVisible = useRef(false);

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
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
      accessibilityLabel={title}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
        importantForAccessibility="no-hide-descendants"
        onPress={onCancel}
        style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.mutedForeground }]}>
            {message}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={styles.button}>
              <Text style={[styles.cancelText, { color: theme.foreground }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={styles.button}>
              <Text style={[styles.confirmText, { color: theme.destructive }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    minWidth: 280,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    ...Type.h2,
  },
  message: {
    ...Type.body,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  button: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  cancelText: {
    ...Type.label,
  },
  confirmText: {
    ...Type.label,
  },
});
