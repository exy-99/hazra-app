import type { JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon: Icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}): JSX.Element {
  const theme = useTheme();
  const showAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Icon size={32} color={theme.mutedForeground} />
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      {showAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          android_ripple={{ color: theme.onAccent }}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={[styles.actionLabel, { color: theme.onAccent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  title: {
    ...Type.h2,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  actionLabel: {
    ...Type.label,
    textAlign: 'center',
  },
});
