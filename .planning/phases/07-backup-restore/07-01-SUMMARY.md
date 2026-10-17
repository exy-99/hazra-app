# 07-01 — Summary

**Phase:** 07-backup-restore
**Plan:** 01 — Pure backup serializer + validator
**Status:** Complete (2026-10-17)
**Autonomous:** true
**Wave:** 1

## What was done

Created `src/utils/backup.ts` with the pure backup payload serializer + validator:

- `BACKUP_VERSION = 1`
- `BackupPayload` interface `{ version, exported_at, worksites, workers, attendance }`
- `serializeBackup(input)` → pretty-printed UTF-8 JSON string; `exported_at` = local `YYYY-MM-DDTHH:mm:ss` (no toISOString UTC drift)
- `validateBackupPayload(raw)` → `{ ok: true, payload }` or `{ ok: false, error: 'truncated'|'missing-key'|'unknown-version'|'invalid-row', detail? }`; zero side effects (DB never touched)
- `backupCounts(payload)` → `{ worksites, workers, marks }`
- Row-level validation for worksites/workers/attendance; `status` must be one of `present`/`absent`/`half_day`/`off_day`

## Verification

- `npx tsc --noEmit` exits 0
- grep gates: `serializeBackup` (1), `validateBackupPayload` (1), `BACKUP_VERSION` (1) — all confirmed

## Threat model

- Backup file tampering → mitigated: `validateBackupPayload()` rejects before any DB write; schema + enum checks
- Information disclosure → accepted: v1 files are plain UTF-8 JSON; user controls sharing
- State file corruption → mitigated: catch-all returns null, falls back to "No backup yet"

## Files

- Created: `src/utils/backup.ts`
