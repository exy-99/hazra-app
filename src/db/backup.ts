/**
 * Database export/import for Phase 7 backup & restore (BK-01, BK-02, BK-03).
 *
 * Reads/writes ALL rows including inactive (is_active = 0) so history
 * survives restore. Import runs inside a single SQLite transaction:
 * delete attendance → workers → worksites, then re-insert in FK order
 * worksites → workers → attendance. Rollback on any write error.
 *
 * Last-backup metadata is persisted to a small JSON file in
 * documentDirectory so the "Last backup: ..." line survives app restarts
 * ("this install") without a schema migration.
 */

import { getDb } from '@/db/index';
import { getAttendanceForWorker } from '@/db/attendance';
import { listWorkers } from '@/db/workers';
import { listWorksites } from '@/db/worksites';
import type { AttendanceEntry, Worker, Worksite } from '@/db/types';
import {
  copyBinaryFile,
  deleteFile,
  writeTextFile,
} from '@/utils/files';

/** Filename for the persisted last-backup state file (documentDirectory). */
const LAST_BACKUP_STATE_FILE = '.hazra-backup-state.json';

export interface LastBackupInfo {
  exported_at: string;
  worksites: number;
  workers: number;
  marks: number;
}

/** Read every row from all three tables, including inactive rows. */
export async function exportAllData(): Promise<{
  worksites: Worksite[];
  workers: Worker[];
  attendance: AttendanceEntry[];
}> {
  const worksites = await listWorksites(true); // includeInactive = true
  const workers = await listWorkers({ includeInactive: true });
  const attendance: AttendanceEntry[] = [];
  for (const worker of workers) {
    const rows = await getAttendanceForWorker(worker.id);
    attendance.push(...rows);
  }
  return { worksites, workers, attendance };
}

/**
 * Transactionally replace all data: delete attendance → workers → worksites,
 * then re-insert in FK order worksites → workers → attendance.
 * Rolls back on any write error.
 */
export async function importAllData(input: {
  worksites: Worksite[];
  workers: Worker[];
  attendance: AttendanceEntry[];
}): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    // Delete in dependency order (attendance references workers, workers references worksites)
    await db.runAsync('DELETE FROM attendance');
    await db.runAsync('DELETE FROM workers');
    await db.runAsync('DELETE FROM worksites');

    // Re-insert in FK order (worksites first, then workers, then attendance)
    for (const ws of input.worksites) {
      await db.runAsync(
        'INSERT INTO worksites (id, name, type, address, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [ws.id, ws.name, ws.type, ws.address ?? null, ws.created_at, ws.is_active],
      );
    }
    for (const w of input.workers) {
      await db.runAsync(
        'INSERT INTO workers (id, name, worksite_id, role, phone, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          w.id,
          w.name,
          w.worksite_id,
          w.role ?? null,
          w.phone ?? null,
          w.created_at,
          w.is_active,
        ],
      );
    }
    for (const a of input.attendance) {
      await db.runAsync(
        'INSERT INTO attendance (id, worker_id, date, status, note, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          a.id,
          a.worker_id,
          a.date,
          a.status,
          a.note ?? null,
          a.updated_at,
        ],
      );
    }
  });
}

/**
 * Persist last-backup info to a JSON file in documentDirectory. Never
 * throws on write failure (best-effort — the backup itself already
 * succeeded).
 */
export async function setLastBackupInfo(info: LastBackupInfo): Promise<void> {
  const fs = require('expo-file-system');
  const uri = `${fs.documentDirectory}${LAST_BACKUP_STATE_FILE}`;
  try {
    await fs.writeAsStringAsync(uri, JSON.stringify(info, null, 2));
  } catch {
    // Best-effort only; last-backup line falls back to "No backup yet".
  }
}

/**
 * Read last-backup info from the state file. Returns null when no backup
 * has ever been written this install (or the file is unreadable).
 */
export async function getLastBackupInfo(): Promise<LastBackupInfo | null> {
  const fs = require('expo-file-system');
  const uri = `${fs.documentDirectory}${LAST_BACKUP_STATE_FILE}`;
  try {
    const raw = await fs.readAsStringAsync(uri);
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as Record<string, unknown>).exported_at === 'string' &&
      typeof (parsed as Record<string, unknown>).worksites === 'number' &&
      typeof (parsed as Record<string, unknown>).workers === 'number' &&
      typeof (parsed as Record<string, unknown>).marks === 'number'
    ) {
      return parsed as LastBackupInfo;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write the serialized backup JSON to Downloads (via writeTextFile) and
 * record last-backup info. Returns the destination URI.
 */
export async function writeBackupFile(contents: string): Promise<string> {
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const hm = today.toISOString().slice(11, 13) + today.toISOString().slice(14, 16);
  const filename = `hazra-backup-${ymd}-${hm}.json`;
  const uri = await writeTextFile(filename, contents);
  return uri;
}
