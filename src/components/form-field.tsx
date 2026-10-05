import type { JSX } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FormField(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}): JSX.Element {
  const { label, value, onChangeText, placeholder, error, keyboardType, autoCapitalize } =
    props;
  const theme = useTheme();
  const hasError = error !== undefined && error !== '';

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[
          styles.input,
          {
            color: theme.foreground,
            backgroundColor: theme.surface,
            borderColor: hasError ? theme.destructive : theme.border,
          },
        ]}
      />
      {hasError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: theme.destructive }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  label: {
    ...Type.label,
  },
  input: {
    ...Type.body,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  error: {
    ...Type.caption,
  },
});
