import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Users } from 'lucide-react-native';
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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { Radius, Spacing, Type } from '@/constants/theme';
import {
  createWorker,
  deactivateWorker,
  getWorker,
  updateWorker,
} from '@/db/workers';
import type { Worksite } from '@/db/types';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';

export default function WorkerFormScreen(): JSX.Element {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editId = typeof id === 'string' && id.length > 0 ? id : null;

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [worksiteId, setWorksiteId] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [sites, setSites] = useState<Worksite[]>([]);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const loaded = await listWorksites();
        if (cancelled) {
          return;
        }
        setSites(loaded);
        if (editId === null) {
          setWorksiteId((current) =>
            current !== '' ? current : (loaded[0]?.id ?? ''),
          );
        } else {
          const worker = await getWorker(editId);
          if (cancelled) {
            return;
          }
          if (worker === null) {
            setNotFound(true);
          } else {
            setName(worker.name);
            // Legacy inactive worksite_id has no active row: leave unselected
            // so saving requires picking an active site (T-02-15).
            setWorksiteId(
              loaded.some((site) => site.id === worker.worksite_id)
                ? worker.worksite_id
                : '',
            );
            setRole(worker.role ?? '');
            setPhone(worker.phone ?? '');
          }
        }
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [editId]),
  );

  const nameError =
    (triedSubmit || nameTouched) && name.trim() === ''
      ? 'Name is required'
      : '';
  const siteError =
    triedSubmit && !worksiteId ? 'Choose a worksite' : '';
  const showZeroState = editId === null && sites.length === 0;
  const saveDisabled = sites.length === 0;

  async function handleSave(): Promise<void> {
    setTriedSubmit(true);
    const trimmedName = name.trim();
    if (trimmedName === '' || worksiteId === '') {
      return;
    }
    const roleValue = role.trim() === '' ? null : role.trim();
    const phoneValue = phone.trim() === '' ? null : phone.trim();
    if (editId !== null) {
      await updateWorker(editId, {
        name: trimmedName,
        worksite_id: worksiteId,
        role: roleValue,
        phone: phoneValue,
      });
    } else {
      await createWorker({
        name: trimmedName,
        worksite_id: worksiteId,
        role: roleValue,
        phone: phoneValue,
      });
    }
    router.back();
  }

  const saveLabel = editId !== null ? 'Save changes' : 'Add worker';

  async function handleConfirmRemove(): Promise<void> {
    if (editId === null) {
      return;
    }
    await deactivateWorker(editId);
    setConfirmVisible(false);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading worker"
            color={theme.primary}
            style={styles.loader}
          />
        ) : notFound ? (
          <View style={styles.gutter}>
            <EmptyState icon={Users} title="Worker not found" />
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
              placeholder="e.g. Ramesh Kumar"
              error={nameError}
            />
            <View>
              <Text style={[styles.siteLabel, { color: theme.foreground }]}>
                Worksite
              </Text>
              {showZeroState ? (
                <View style={styles.zeroState}>
                  <Text
                    style={[
                      styles.zeroText,
                      { color: theme.mutedForeground },
                    ]}>
                    No worksites yet — add one first
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add worksite"
                    android_ripple={{ color: theme.muted }}
                    onPress={() => router.push('/worksite-form')}
                    style={({ pressed }) => [
                      styles.zeroLink,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <Text
                      style={[
                        styles.zeroLinkLabel,
                        { color: theme.primary },
                      ]}>
                      Add worksite
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.siteList}>
                  {sites.map((site) => {
                    const selected = site.id === worksiteId;
                    return (
                      <Pressable
                        key={site.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={site.name}
                        android_ripple={{
                          color: selected ? theme.primary : theme.muted,
                        }}
                        onPress={() => setWorksiteId(site.id)}
                        style={({ pressed }) => [
                          styles.siteRow,
                          {
                            borderColor: selected
                              ? theme.primary
                              : theme.border,
                          },
                          { opacity: pressed ? 0.85 : 1 },
                        ]}>
                        <Text
                          style={[
                            styles.siteName,
                            {
                              color: selected
                                ? theme.primary
                                : theme.foreground,
                            },
                          ]}>
                          {site.name}
                        </Text>
                        {selected ? (
                          <Text
                            style={[
                              styles.selectedTag,
                              { color: theme.primary },
                            ]}>
                            Selected
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
              {siteError !== '' ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.siteError, { color: theme.destructive }]}>
                  {siteError}
                </Text>
              ) : null}
            </View>
            <FormField
              label="Role (optional)"
              value={role}
              onChangeText={setRole}
              placeholder="e.g. Mason"
            />
            <FormField
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 98765 43210"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saveLabel}
              disabled={saveDisabled}
              android_ripple={{ color: theme.onAccent }}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.save,
                saveDisabled
                  ? { backgroundColor: theme.muted }
                  : { backgroundColor: theme.accent },
                { opacity: pressed && !saveDisabled ? 0.85 : 1 },
              ]}>
              <Text
                style={[
                  styles.saveLabel,
                  {
                    color: saveDisabled
                      ? theme.mutedForeground
                      : theme.onAccent,
                  },
                ]}>
                {saveLabel}
              </Text>
            </Pressable>
            {editId !== null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove worker"
                android_ripple={{ color: theme.muted }}
                onPress={() => setConfirmVisible(true)}
                style={({ pressed }) => [
                  styles.remove,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text style={[styles.removeLabel, { color: theme.destructive }]}>
                  Remove worker
                </Text>
              </Pressable>
            ) : null}
            {editId !== null ? (
              <ConfirmDialog
                visible={confirmVisible}
                title={`Remove ${name.trim()}`}
                message={`${name.trim()} will disappear from lists, but their attendance history is kept.`}
                confirmLabel="Remove"
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmVisible(false)}
              />
            ) : null}
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
  siteLabel: {
    ...Type.label,
    marginBottom: Spacing.two,
  },
  siteList: {
    gap: Spacing.two,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    padding: Spacing.two,
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  siteName: {
    ...Type.label,
    flex: 1,
  },
  selectedTag: {
    ...Type.caption,
  },
  siteError: {
    ...Type.caption,
    marginTop: Spacing.two,
  },
  zeroState: {
    gap: Spacing.two,
  },
  zeroText: {
    ...Type.body,
  },
  zeroLink: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  zeroLinkLabel: {
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
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: Spacing.three,
  },
  removeLabel: {
    ...Type.label,
    textAlign: 'center',
  },
});
