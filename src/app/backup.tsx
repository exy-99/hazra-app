import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Download, HardDriveDownload, Share2, TriangleAlert } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
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
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { importAllData, exportAllData, getLastBackupInfo, setLastBackupInfo, writeBackupFile } from '@/db/backup';
import type { BackupPayload } from '@/utils/backup';
import { useTheme } from '@/hooks/use-theme';
import { formatDisplay, todayKey } from '@/utils/dates';
import { serializeBackup, validateBackupPayload, backupCounts } from '@/utils/backup';
import { readPickedFile, shareFile, writeTextFile } from '@/utils/files';

/** Small folder icon (lucide-react-native has no FolderOpen; kept self-contained). */
function FolderOpenIcon({ size, color }: { size: number; color: string }) {
  const half = size * 0.5;
  const third = size * 0.33;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.folderBody,
          { width: size, height: size * 0.7, borderColor: color, borderWidth: 1.5 },
        ]}
      />
      <View
        style={[
          styles.folderTab,
          { width: half, height: third, borderColor: color, borderWidth: 1.5 },
        ]}
      />
    </View>
  );
}

export default function BackupScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    // No query params needed for the backup screen itself; kept for future deep links.
  }>();
  void params;

  // ---- UI state ----
  const [mode, setMode] = useState<'idle' | 'backing-up' | 'backup-success' | 'backup-error'>(
    'idle',
  );
  const [restoreMode, setRestoreMode] = useState<
    'idle' | 'validating' | 'confirming' | 'restore-success' | 'restore-error'
  >('idle');
  const [lastBackup, setLastBackup] = useState<{
    exported_at: string;
    worksites: number;
    workers: number;
    marks: number;
  } | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [validatedPayload, setValidatedPayload] = useState<BackupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- CR-02 re-entry guards (refs reset in finally) ----
  const backupLock = useRef(false);
  const restoreLock = useRef(false);

  // ---- Load last-backup info on focus ----
  const load = useCallback(async () => {
    const info = await getLastBackupInfo();
    setLastBackup(info);
  }, []);
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  // ---- Backup ----
  async function handleBackup(): Promise<void> {
    if (backupLock.current) {
      return;
    }
    backupLock.current = true;
    setMode('backing-up');
    setError(null);
    try {
      const data = await exportAllData();
      const contents = serializeBackup(data);
      const uri = await writeTextFile(
        `hazra-backup-${todayKey().replace(/-/g, '')}-${new Date()
          .toISOString()
          .slice(11, 16)
          .replace(':', '')}.json`,
        contents,
      );
      const counts = backupCounts({ ...data, version: 1, exported_at: '' });
      await setLastBackupInfo({
        exported_at: new Date().toISOString(),
        worksites: counts.worksites,
        workers: counts.workers,
        marks: counts.marks,
      });
      setLastBackup({
        exported_at: new Date().toISOString(),
        worksites: counts.worksites,
        workers: counts.workers,
        marks: counts.marks,
      });
      setSavedName(uri.split('/').pop() ?? uri);
      setSavedUri(uri);
      setMode('backup-success');
    } catch {
      setMode('backup-error');
      setError("Couldn't back up — try again");
    } finally {
      backupLock.current = false;
    }
  }

  function resetBackup(): void {
    setMode('idle');
    setError(null);
    setSavedName(null);
    setSavedUri(null);
  }

  // ---- Restore ----
  async function handleRestorePick(): Promise<void> {
    if (restoreLock.current) {
      return;
    }
    restoreLock.current = true;
    setRestoreMode('validating');
    setError(null);
    setValidatedPayload(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) {
        setRestoreMode('idle');
        return;
      }
      const asset = result.assets[0];
      const raw = await readPickedFile(asset.uri, asset.base64, asset.file);
      if (raw === null) {
        setRestoreMode('idle');
        setError("That file looks damaged — pick a complete backup file.");
        return;
      }
      const validation = validateBackupPayload(raw);
      if (!validation.ok) {
        setRestoreMode('idle');
        switch (validation.error) {
          case 'truncated':
            setError("That file looks damaged — pick a complete backup file.");
            break;
          case 'missing-key':
            setError("That file isn't a Hazra backup — pick a file saved by Back up now.");
            break;
          case 'unknown-version':
            setError("That backup is from a newer app version — update the app, then try again.");
            break;
          default:
            setError("That file looks damaged — pick a complete backup file.");
        }
        return;
      }
      setValidatedPayload(validation.payload);
      setRestoreMode('confirming');
    } catch {
      setRestoreMode('idle');
      setError("Couldn't restore — your current data is unchanged. Try again");
    } finally {
      restoreLock.current = false;
    }
  }

  async function handleRestoreConfirm(): Promise<void> {
    if (restoreLock.current || !validatedPayload) {
      return;
    }
    restoreLock.current = true;
    setRestoreMode('confirming');
    setError(null);
    try {
      await importAllData(validatedPayload);
      // After restore, live data equals the validated payload — set counts
      // from it rather than the stale last-backup state file.
      const counts = backupCounts(validatedPayload);
      setLastBackup({
        exported_at: validatedPayload.exported_at,
        worksites: counts.worksites,
        workers: counts.workers,
        marks: counts.marks,
      });
      setRestoreMode('restore-success');
    } catch {
      setRestoreMode('restore-error');
      setError("Couldn't restore — your current data is unchanged. Try again");
    } finally {
      restoreLock.current = false;
    }
  }

  function cancelRestore(): void {
    setRestoreMode('idle');
    setValidatedPayload(null);
    setError(null);
  }

  async function handleShare(): Promise<void> {
    if (savedUri === null) {
      return;
    }
    try {
      const result = await shareFile(savedUri);
      if (result === 'unavailable') {
        setError("Sharing isn't available here — your file is in Downloads.");
      }
    } catch {
      // Share-sheet dismiss changes nothing.
    }
  }

  const counts = lastBackup
    ? {
        worksites: lastBackup.worksites,
        workers: lastBackup.workers,
        marks: lastBackup.marks,
      }
    : { worksites: 0, workers: 0, marks: 0 };

  const hasData =
    lastBackup !== null &&
    (lastBackup.worksites > 0 || lastBackup.workers > 0 || lastBackup.marks > 0);
  const backupWriting = mode === 'backing-up';
  const backupSuccess = mode === 'backup-success';
  const backupError = mode === 'backup-error';
  const restoreValidating = restoreMode === 'validating';
  const restoreConfirming = restoreMode === 'confirming';
  const restoreSuccess = restoreMode === 'restore-success';
  const restoreError = restoreMode === 'restore-error';
  const showConfirmDialog = restoreConfirming;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {/* Screen title */}
          <Text style={[styles.title, { color: theme.foreground }]}>Backup & Restore</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Your only safety net — keep a copy outside this phone.
          </Text>

          {/* ===== Calm backup section (BK-01) ===== */}
          <View style={styles.section}>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={styles.cardHeader}>
                <Download size={20} color={theme.primary} />
                <Text style={[styles.h2, { color: theme.foreground }]}>Back up</Text>
              </View>
              <Text style={[styles.body, { color: theme.foreground }]}>
                Saves everything — worksites, workers, and all attendance marks, including removed
                ones — to one file in Downloads.
              </Text>
              {lastBackup !== null ? (
                <View style={styles.lastBackupLine}>
                  <Text style={[styles.caption, { color: theme.mutedForeground }]}>
                    Last backup:{' '}
                    {formatDisplay(lastBackup.exported_at.slice(0, 10), 'DD MMM YYYY')}
                  </Text>
                  <Text
                    style={[
                      styles.caption,
                      { color: theme.mutedForeground, fontVariant: ['tabular-nums'] },
                    ]}>
                    · {counts.worksites} worksites
                  </Text>
                  <Text
                    style={[
                      styles.caption,
                      { color: theme.mutedForeground, fontVariant: ['tabular-nums'] },
                    ]}>
                    · {counts.workers} workers
                  </Text>
                  <Text
                    style={[
                      styles.caption,
                      { color: theme.mutedForeground, fontVariant: ['tabular-nums'] },
                    ]}>
                    · {counts.marks} marks
                  </Text>
                </View>
              ) : null}

              {/* Zero-data state — replaces CTA when there is nothing to save */}
              {!hasData && !backupWriting && !backupSuccess && !backupError ? (
                <View style={styles.zeroDataWrap}>
                  <EmptyState
                    icon={HardDriveDownload}
                    title="Nothing to back up yet"
                    actionLabel="Add worksite"
                    onAction={() => void router.push('/worksite-form')}
                  />
                </View>
              ) : null}

              {/* Backup CTA — the one orange element on this screen state */}
              {hasData && !backupWriting && !backupSuccess && !backupError ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back up now"
                  android_ripple={{ color: theme.onAccent }}
                  disabled={backupWriting}
                  onPress={handleBackup}
                  style={({ pressed }) => [
                    styles.cta,
                    {
                      backgroundColor: theme.accent,
                      opacity: backupWriting ? 0.5 : pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>
                    {backupWriting ? 'Backing up…' : 'Back up now'}
                  </Text>
                </Pressable>
              ) : null}

              {/* Writing state: inline progress row */}
              {backupWriting ? (
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={[styles.caption, { color: theme.mutedForeground }]}>
                    Backing up…
                  </Text>
                </View>
              ) : null}

              {/* Success card */}
              {backupSuccess && savedName !== null ? (
                <View
                  style={[
                    styles.successCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <Download size={24} color={theme.primary} />
                  <Text style={[styles.successTitle, { color: theme.foreground }]}>
                    Saved to Downloads
                  </Text>
                  <Text style={[styles.filename, { color: theme.mutedForeground }]}>
                    {savedName}
                  </Text>
                  <Text style={[styles.countsLine, { color: theme.mutedForeground }]}>
                    {counts.worksites} worksites · {counts.workers} workers · {counts.marks} marks
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share file"
                    android_ripple={{ color: theme.primary }}
                    onPress={handleShare}
                    style={styles.shareRow}>
                    <Share2 size={16} color={theme.primary} />
                    <Text style={[styles.shareLabel, { color: theme.primary }]}>Share file</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back up again"
                    android_ripple={{ color: theme.muted }}
                    onPress={resetBackup}
                    style={styles.shareRow}>
                    <Text style={[styles.shareLabel, { color: theme.mutedForeground }]}>
                      Back up again
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Error state */}
              {backupError && error !== null ? (
                <View style={styles.errorWrap}>
                  <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                    android_ripple={{ color: theme.muted }}
                    onPress={handleBackup}
                    style={styles.retryRow}>
                    <Text style={[styles.retryLabel, { color: theme.destructive }]}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerWrap}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          {/* ===== Danger-framed restore section (BK-02 / BK-03) ===== */}
          <View style={styles.section}>
            <View
              style={[
                styles.dangerCard,
                { backgroundColor: theme.surface, borderColor: theme.destructive },
              ]}>
              <View style={styles.dangerHeader}>
                <TriangleAlert size={20} color={theme.destructive} />
                <Text style={[styles.h2, { color: theme.foreground }]}>Restore</Text>
              </View>
              <Text style={[styles.body, { color: theme.foreground }]}>
                Replaces everything on this phone with a backup file. Cancel keeps your current data
                — cancel is always the safe choice.
              </Text>
              <Text style={[styles.caption, { color: theme.mutedForeground }]}>
                Back up first if you have new marks.
              </Text>

              {/* Pick-file row */}
              {restoreMode === 'idle' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Restore from backup"
                  android_ripple={{ color: theme.muted }}
                  disabled={restoreValidating || restoreConfirming}
                  onPress={handleRestorePick}
                  style={({ pressed }) => [
                    styles.pickRow,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      opacity: (restoreValidating || restoreConfirming) ? 0.6 : pressed ? 0.85 : 1,
                    },
                  ]}>
                  <FolderOpenIcon size={18} color={theme.primary} />
                  <Text style={[styles.pickTitle, { color: theme.primary }]}>
                    Restore from backup
                  </Text>
                </Pressable>
              ) : null}

              {/* Validating skeleton over the restore card only */}
              {restoreValidating ? (
                <View style={styles.validatingWrap}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.caption, { color: theme.mutedForeground }]}>
                    Validating backup…
                  </Text>
                </View>
              ) : null}

              {/* Validation-summary card (valid pick, before confirm) */}
              {restoreConfirming && validatedPayload !== null ? (
                <View
                  style={[
                    styles.confirmCard,
                    { backgroundColor: theme.surface, borderColor: theme.destructive },
                  ]}>
                  <Text
                    style={[
                      styles.caption,
                      { color: theme.mutedForeground, fontVariant: ['tabular-nums'] },
                    ]}>
                    Backup from {formatDisplay(validatedPayload.exported_at.slice(0, 10), 'DD MMM YYYY')}
                  </Text>
                  <Text style={[styles.countsLine, { color: theme.mutedForeground }]}>
                    {validatedPayload.worksites.length} worksites · {validatedPayload.workers.length} workers · {validatedPayload.attendance.length} marks
                  </Text>
                  <Text style={[styles.caption, { color: theme.destructive }]}>
                    — replaces all current data.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Replace all data"
                    android_ripple={{ color: theme.muted }}
                    disabled={restoreLock.current}
                    onPress={handleRestoreConfirm}
                    style={({ pressed }) => [{ opacity: restoreLock.current ? 0.6 : pressed ? 0.85 : 1 }]}>
                    <Text style={[styles.destructiveText, { color: theme.destructive }]}>
                      Replace all data
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose a different file"
                    android_ripple={{ color: theme.muted }}
                    onPress={() => {
                      setRestoreMode('idle');
                      setValidatedPayload(null);
                      setError(null);
                    }}
                    style={styles.mutedTextRow}>
                    <Text style={[styles.mutedText, { color: theme.mutedForeground }]}>
                      Choose a different file
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Restore error state */}
              {restoreError && error !== null ? (
                <View style={styles.errorWrap}>
                  <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                    android_ripple={{ color: theme.muted }}
                    onPress={handleRestorePick}
                    style={styles.retryRow}>
                    <Text style={[styles.retryLabel, { color: theme.destructive }]}>Try again</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Restore success card */}
              {restoreSuccess ? (
                <View
                  style={[
                    styles.successCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <Text style={[styles.successTitle, { color: theme.foreground }]}>
                    Restore complete
                  </Text>
                  <Text style={[styles.countsLine, { color: theme.mutedForeground }]}>
                    Restored {counts.worksites} worksites · {counts.workers} workers · {counts.marks} marks
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back to safety"
                    android_ripple={{ color: theme.muted }}
                    onPress={() => {
                      setRestoreMode('idle');
                      setError(null);
                    }}
                    style={styles.shareRow}>
                    <Text style={[styles.shareLabel, { color: theme.mutedForeground }]}>
                      Back to safety
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {/* Confirm dialog for destructive restore */}
          <ConfirmDialog
            visible={showConfirmDialog}
            title="Replace all data?"
            message={
              `This erases everything currently on this phone — worksites, workers, and all attendance marks — and replaces it with the backup from ${formatDisplay(validatedPayload?.exported_at ?? '', 'DD MMM YYYY')}. Removed workers and history included in the backup come back; anything added after that backup is lost forever. This cannot be undone.`
            }
            confirmLabel="Replace all data"
            onConfirm={handleRestoreConfirm}
            onCancel={cancelRestore}
          />
        </ScrollView>
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
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
    alignItems: 'center',
  },
  title: {
    ...Type.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...Type.caption,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    gap: Spacing.three,
  },
  card: {
    width: '100%',
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.three,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  h2: {
    ...Type.h2,
  },
  body: {
    ...Type.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  caption: {
    ...Type.caption,
    textAlign: 'center',
  },
  lastBackupLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  zeroDataWrap: {
    width: '100%',
    paddingVertical: Spacing.two,
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  ctaLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  successCard: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  successTitle: {
    ...Type.h2,
    textAlign: 'center',
  },
  filename: {
    ...Type.caption,
    textAlign: 'center',
    maxWidth: '100%',
    fontVariant: ['tabular-nums'],
  },
  countsLine: {
    ...Type.caption,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  shareLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  errorText: {
    ...Type.body,
    textAlign: 'center',
    maxWidth: '100%',
  },
  retryRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  retryLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  dividerWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  divider: {
    width: '100%',
    height: 1,
  },
  dangerCard: {
    width: '100%',
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.three,
    alignItems: 'center',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pickRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  pickTitle: {
    ...Type.label,
  },
  validatingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  confirmCard: {
    width: '100%',
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  destructiveText: {
    ...Type.label,
  },
  mutedTextRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  mutedText: {
    ...Type.label,
  },
  folderBody: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1.5,
  },
  folderTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
});
