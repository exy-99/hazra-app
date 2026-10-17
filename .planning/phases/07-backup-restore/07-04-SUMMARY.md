# 07-04 — Summary

**Phase:** 07-backup-restore
**Plan:** 04 — Backup & Restore screen UI
**Status:** Complete (2026-10-17)
**Autonomous:** true
**Wave:** 1

## What was done

Replaced the `src/app/backup.tsx` placeholder with the full Backup & Restore screen per the approved 07-UI-SPEC.md:

- Screen title "Backup & Restore" (h1) + muted subtitle caption
- Calm backup section (BK-01): card + Download icon (primary) + body + last-backup line + counts preview
- One orange CTA "Back up now" → exportAllData → serializeBackup → writeBackupFile → setLastBackupInfo → success card
- Writing state: ActivityIndicator + "Backing up…"; CTA disabled; `backupLock` ref guard (CR-02); finally-only reset
- Success card: "Saved to Downloads" + filename + counts + "Share file" → shareFile + muted "Back up again"
- Error: destructive "Couldn't back up — try again" + "Try again" retry (CR-01)
- Zero-data state: EmptyState "Nothing to back up yet" + "Add worksite" → /worksite-form; CTA hidden
- Divider: 24px gap + 1px hairline border; no accent crosses
- Danger restore section (BK-02/BK-03): card + TriangleAlert icon (destructive) + "Restore" h2 + warning body
- "Restore from backup" pick-file row → DocumentPicker.getDocumentAsync({type: 'application/json'})
- Validate-before-touch: readPickedFile → validateBackupPayload → mapped error + "Choose a different file"; DB never touched
- Validation-summary card: counts + text-only destructive "Replace all data" → ConfirmDialog + "Choose a different file"
- ConfirmDialog: exact copy with formatDisplay date; confirmLabel "Replace all data"; cancel default
- Restore confirm → importAllData transaction → "Restore complete" card; write failure → "Couldn't restore — your current data is unchanged"
- tabular-nums on counts/dates/filenames; Pressable-only; ripple + opacity 0.85; 44px targets; accessibilityLabel on icon controls; useFocusEffect refetch

## Verification

- `npx tsc --noEmit` exits 0
- grep gates: "Back up now" (1), "Restore from backup" (1), "Replace all data" (2), "validateBackupPayload" (1), "importAllData" (1), "expo-document-picker" (1), "TouchableOpacity" (0), "export default function BackupScreen" (1) — all confirmed

## Threat model

- Accidental data destruction → mitigated: text-only destructive confirm; cancel default aborts all writes
- DB write before validation → mitigated: validateBackupPayload() in memory first
- Partial file on failure → mitigated: writeTextFile deletes partials
- Double-tap duplicate files → mitigated: backupLock ref + CTA disabled

## Files

- Modified: `src/app/backup.tsx` (replaced placeholder)
