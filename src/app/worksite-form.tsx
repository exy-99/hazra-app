import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import type { JSX } from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { Radius, Spacing, Type } from '@/constants/theme';
import {
  createWorksite,
  getWorksite,
  updateWorksite,
  WORKSITE_TYPES,
} from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';

export default function WorksiteFormScreen(): JSX.Element {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === 'string' && id.length > 0 ? id : null;

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [type, setType] = useState<string>('Office');
  const [address, setAddress] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [loading, setLoading] = useState(editId !== null);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (editId === null) {
        return;
      }
      let cancelled = false;
      (async () => {
        const site = await getWorksite(editId);
        if (cancelled) {
          return;
        }
        if (site === null) {
          setNotFound(true);
        } else {
          setName(site.name);
          setType(site.type);
          setAddress(site.address ?? '');
        }
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [editId]),
  );

  const nameError =
    (triedSubmit || nameTouched) && name.trim() === '' ? 'Name is required' : '';

  async function handleSave(): Promise<void> {
    setTriedSubmit(true);
    const trimmedName = name.trim();
    if (trimmedName === '') {
      return;
    }
    const trimmedAddress = address.trim();
    const addressValue = trimmedAddress === '' ? null : trimmedAddress;
    if (editId !== null) {
      await updateWorksite(editId, {
        name: trimmedName,
        type,
        address: addressValue,
      });
    } else {
      await createWorksite({ name: trimmedName, type, address: addressValue });
    }
    router.back();
  }

  const saveLabel = editId !== null ? 'Save changes' : 'Add worksite';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading worksite"
            color={theme.primary}
            style={styles.loader}
          />
        ) : notFound ? (
          <View style={styles.gutter}>
            <EmptyState icon={Building2} title="Worksite not found" />
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.form}>
            <FormField
              label="Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameTouched(true);
              }}
              placeholder="e.g. Sunrise Apartments"
              error={nameError}
            />
            <View>
              <Text style={[styles.typeLabel, { color: theme.foreground }]}>
                Type
              </Text>
              <View style={styles.chipRow}>
                {WORKSITE_TYPES.map((option) => {
                  const selected = option === type;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={option}
                      android_ripple={{
                        color: selected ? theme.onPrimary : theme.muted,
                      }}
                      onPress={() => setType(option)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected
                          ? {
                              backgroundColor: theme.primary,
                              borderColor: theme.primary,
                            }
                          : {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            },
                        { opacity: pressed ? 0.85 : 1 },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: selected
                              ? theme.onPrimary
                              : theme.foreground,
                          },
                        ]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <FormField
              label="Address (optional)"
              value={address}
              onChangeText={setAddress}
              keyboardType="default"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saveLabel}
              android_ripple={{ color: theme.onAccent }}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.save,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.saveLabel, { color: theme.onAccent }]}>
                {saveLabel}
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: 800,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gutter: {
    flex: 1,
    padding: Spacing.three,
  },
  form: {
    flexGrow: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  typeLabel: {
    ...Type.label,
    marginBottom: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Type.label,
  },
  save: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  saveLabel: {
    ...Type.label,
    textAlign: 'center',
  },
});
