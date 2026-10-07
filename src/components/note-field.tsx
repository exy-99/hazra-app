import { useState, type JSX } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StickyNote } from 'lucide-react-native';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface NoteFieldProps {
  note: string | null;
  onSave: (text: string | null) => Promise<void>;
}

export function NoteField({ note, onSave }: NoteFieldProps): JSX.Element {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(note ?? '');
  const [savingNote, setSavingNote] = useState(false);

  function expand() {
    setDraft(note ?? '');
    setExpanded(true);
  }

  function cancel() {
    setDraft(note ?? '');
    setExpanded(false);
  }

  async function handleSave() {
    if (savingNote) {
      return;
    }
    const trimmed = draft.trim();
    const value = trimmed === '' ? null : trimmed;
    setSavingNote(true);
    try {
      await onSave(value);
      setDraft(value ?? '');
      setExpanded(false);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleClear() {
    if (savingNote) {
      return;
    }
    setSavingNote(true);
    try {
      await onSave(null);
      setDraft('');
      setExpanded(false);
    } finally {
      setSavingNote(false);
    }
  }

  if (!expanded) {
    return (
      <Pressable
        accessibilityLabel={note !== null ? 'Edit note' : 'Add note'}
        accessibilityRole="button"
        onPress={expand}
        style={styles.collapsed}>
        <StickyNote
          size={20}
          color={note !== null ? theme.primary : theme.mutedForeground}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.hint,
            { color: theme.mutedForeground },
          ]}>
          {note !== null ? note : 'Add note'}
        </Text>
      </Pressable>
    );
  }

  const showClear = note !== null || draft.trim() !== '';

  return (
    <View style={styles.editor}>
      <TextInput
        accessibilityLabel="Attendance note"
        value={draft}
        onChangeText={setDraft}
        placeholder="Add a note…"
        placeholderTextColor={theme.mutedForeground}
        multiline
        autoFocus
        editable={!savingNote}
        style={[
          styles.input,
          {
            color: theme.foreground,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      />
      <View style={styles.footer}>
        <Pressable
          accessibilityLabel="Save note"
          accessibilityRole="button"
          disabled={savingNote}
          onPress={() => void handleSave()}
          style={[styles.action, savingNote ? styles.disabled : undefined]}>
          <Text style={[styles.saveText, { color: theme.primary }]}>
            {savingNote ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
        {showClear ? (
          <Pressable
            accessibilityLabel="Clear note"
            accessibilityRole="button"
            disabled={savingNote}
            onPress={() => void handleClear()}
            style={[styles.action, savingNote ? styles.disabled : undefined]}>
            <Text style={[styles.clearText, { color: theme.destructive }]}>
              Clear
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Cancel note edit"
          accessibilityRole="button"
          disabled={savingNote}
          onPress={cancel}
          style={[styles.action, savingNote ? styles.disabled : undefined]}>
          <Text style={[styles.cancelText, { color: theme.mutedForeground }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  hint: {
    ...Type.caption,
    flex: 1,
  },
  editor: {
    gap: Spacing.two,
  },
  input: {
    ...Type.body,
    minHeight: 88,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  saveText: {
    ...Type.label,
  },
  clearText: {
    ...Type.label,
  },
  cancelText: {
    ...Type.label,
  },
});
