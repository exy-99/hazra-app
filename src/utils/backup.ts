/**
 * Pure backup payload serializer + validator for Phase 7 (BK-01, BK-02, BK-03).
 *
 * Same purity contract as `summarize()` and the export serializers: zero
 * runtime `@/db` imports — callers pass data in, functions return strings /
 * validation results. All filesystem I/O lives in `@/utils/files`.
 *
 * Payload contract:
 *   { version: 1, exported_at: <local YYYY-MM-DDTHH:mm:ss>, worksites: Worksite[],
 *     workers: Worker[], attendance: AttendanceEntry[] }
 * Inactive (is_active = 0) rows are included so history survives restore.
 */

import type { AttendanceEntry, AttendanceStatus, Worker, Worksite } from '@/db/types';
import dayjs from 'dayjs';

export const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exported_at: string;
  worksites: Worksite[];
  workers: Worker[];
  attendance: AttendanceEntry[];
}

export interface BackupValidationError {
  ok: false;
  error: 'truncated' | 'missing-key' | 'unknown-version' | 'invalid-row';
  detail?: string;
}

export interface BackupValidationSuccess {
  ok: true;
  payload: BackupPayload;
}

export type BackupValidationResult = BackupValidationSuccess | BackupValidationError;

const REQUIRED_TOP_KEYS = ['version', 'exported_at', 'worksites', 'workers', 'attendance'] as const;
const REQUIRED_WORKSITE_KEYS = ['id', 'name', 'type', 'address', 'created_at', 'is_active'] as const;
const REQUIRED_WORKER_KEYS = [
  'id',
  'name',
  'worksite_id',
  'role',
  'phone',
  'created_at',
  'is_active',
] as const;
const REQUIRED_ATTENDANCE_KEYS = [
  'id',
  'worker_id',
  'date',
  'status',
  'note',
  'updated_at',
] as const;
const VALID_STATUSES: AttendanceStatus[] = ['present', 'absent', 'half_day', 'off_day'];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasKeys(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.every((k) => k in obj);
}

function isValidWorksite(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    hasKeys(o, REQUIRED_WORKSITE_KEYS) &&
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.type === 'string' &&
    (o.address === null || typeof o.address === 'string') &&
    typeof o.created_at === 'string' &&
    (o.is_active === 0 || o.is_active === 1)
  );
}

function isValidWorker(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    hasKeys(o, REQUIRED_WORKER_KEYS) &&
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.worksite_id === 'string' &&
    (o.role === null || typeof o.role === 'string') &&
    (o.phone === null || typeof o.phone === 'string') &&
    typeof o.created_at === 'string' &&
    (o.is_active === 0 || o.is_active === 1)
  );
}

function isValidAttendance(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    hasKeys(o, REQUIRED_ATTENDANCE_KEYS) &&
    typeof o.id === 'string' &&
    typeof o.worker_id === 'string' &&
    typeof o.date === 'string' &&
    VALID_STATUSES.includes(o.status as AttendanceStatus) &&
    (o.note === null || typeof o.note === 'string') &&
    typeof o.updated_at === 'string'
  );
}

/**
 * Serialize a full backup payload to a pretty-printed UTF-8 JSON string.
 * `exported_at` is a local key (no toISOString UTC drift) so restore-time
 * display matches the device's local clock.
 */
export function serializeBackup(input: {
  worksites: Worksite[];
  workers: Worker[];
  attendance: AttendanceEntry[];
}): string {
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exported_at: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    worksites: input.worksites,
    workers: input.workers,
    attendance: input.attendance,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Validate a raw backup file string in memory before any DB write.
 *
 * Maps corruption modes to the three contract errors (BK-03 success
 * criterion #3):
 *   - truncated / not JSON → 'truncated'
 *   - missing any required top-level key → 'missing-key'
 *   - version != 1 → 'unknown-version'
 *   - malformed rows → 'invalid-row'
 *
 * Any failure returns `ok: false` with zero side effects.
 */
export function validateBackupPayload(raw: string): BackupValidationResult {
  // 1. Parse JSON — truncated / corrupt / empty
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'truncated' };
  }

  // 2. Top level must be a plain object
  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'truncated' };
  }
  const obj = parsed as Record<string, unknown>;

  // 3. Required top-level keys
  for (const key of REQUIRED_TOP_KEYS) {
    if (!(key in obj)) {
      return { ok: false, error: 'missing-key', detail: key };
    }
  }

  // 4. Version allowlist
  if (obj.version !== BACKUP_VERSION) {
    return { ok: false, error: 'unknown-version', detail: String(obj.version) };
  }

  // 5. exported_at must be a string
  if (typeof obj.exported_at !== 'string') {
    return { ok: false, error: 'invalid-row', detail: 'exported_at' };
  }

  // 6. Tables must be arrays
  if (
    !Array.isArray(obj.worksites) ||
    !Array.isArray(obj.workers) ||
    !Array.isArray(obj.attendance)
  ) {
    return { ok: false, error: 'invalid-row', detail: 'tables must be arrays' };
  }

  // 7. Row-level validation
  for (const row of obj.worksites) {
    if (!isValidWorksite(row)) {
      return { ok: false, error: 'invalid-row', detail: 'worksite' };
    }
  }
  for (const row of obj.workers) {
    if (!isValidWorker(row)) {
      return { ok: false, error: 'invalid-row', detail: 'worker' };
    }
  }
  for (const row of obj.attendance) {
    if (!isValidAttendance(row)) {
      return { ok: false, error: 'invalid-row', detail: 'attendance' };
    }
  }

  return {
    ok: true,
    payload: {
      version: obj.version as number,
      exported_at: obj.exported_at as string,
      worksites: obj.worksites as Worksite[],
      workers: obj.workers as Worker[],
      attendance: obj.attendance as AttendanceEntry[],
    },
  };
}

/**
 * Human-readable count summary from a validated payload, used for the
 * last-backup line and validation-summary card. Never client math on live
 * data — always read from the same source as the file bytes / payload.
 */
export function backupCounts(payload: BackupPayload): {
  worksites: number;
  workers: number;
  marks: number;
} {
  return {
    worksites: payload.worksites.length,
    workers: payload.workers.length,
    marks: payload.attendance.length,
  };
}
