import { getDb } from '@/db/index';
import type { AttendanceEntry, AttendanceStatus } from '@/db/types';
import { newId } from '@/utils/ids';

export async function upsertAttendance(input: {
  workerId: string;
  date: string;
  status: AttendanceStatus;
  note?: string | null;
}): Promise<void> {
  const db = getDb();
  const id = newId();
  const updated_at = new Date().toISOString();
  const note = input.note ?? null;
  await db.runAsync(
    'INSERT INTO attendance (id, worker_id, date, status, note, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(worker_id, date) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at',
    [id, input.workerId, input.date, input.status, note, updated_at],
  );
}

export interface AttendanceDateRow {
  worker_id: string;
  name: string;
  role: string | null;
  worksite_id: string;
  status: AttendanceStatus | null;
  note: string | null;
  entry_id: string | null;
}

export interface DailyCounts {
  present: number;
  absent: number;
  half_day: number;
  off_day: number;
  unmarked: number;
}

export async function getAttendanceForDate(
  date: string,
  opts: { worksiteId?: string } = {},
): Promise<AttendanceDateRow[]> {
  const db = getDb();
  const params: string[] = [date];
  let worksiteFilter = '';
  if (opts.worksiteId !== undefined) {
    worksiteFilter = ' AND w.worksite_id = ?';
    params.push(opts.worksiteId);
  }
  return db.getAllAsync<AttendanceDateRow>(
    `SELECT w.id AS worker_id, w.name, w.role, w.worksite_id, a.id AS entry_id, a.status, a.note FROM workers w LEFT JOIN attendance a ON a.worker_id = w.id AND a.date = ? WHERE w.is_active = 1${worksiteFilter} ORDER BY w.name COLLATE NOCASE`,
    params,
  );
}

export async function getAttendanceForWorker(
  workerId: string,
  opts: { from?: string; to?: string } = {},
): Promise<AttendanceEntry[]> {
  const db = getDb();
  const conditions: string[] = ['worker_id = ?'];
  const params: string[] = [workerId];
  if (opts.from !== undefined) {
    conditions.push('date >= ?');
    params.push(opts.from);
  }
  if (opts.to !== undefined) {
    conditions.push('date <= ?');
    params.push(opts.to);
  }
  return db.getAllAsync<AttendanceEntry>(
    `SELECT * FROM attendance WHERE ${conditions.join(' AND ')} ORDER BY date ASC`,
    params,
  );
}

export async function getDailyCounts(
  date: string,
  opts: { worksiteId?: string } = {},
): Promise<DailyCounts> {
  const db = getDb();
  const countParams: string[] = [];
  let worksiteFilter = '';
  if (opts.worksiteId !== undefined) {
    worksiteFilter = ' AND w.worksite_id = ?';
    countParams.push(opts.worksiteId);
  }
  const activeRow = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM workers w WHERE w.is_active = 1${worksiteFilter}`,
    countParams,
  );
  const activeCount = activeRow?.n ?? 0;

  const statusParams: string[] = [date];
  if (opts.worksiteId !== undefined) {
    statusParams.push(opts.worksiteId);
  }
  const rows = await db.getAllAsync<{ status: AttendanceStatus; n: number }>(
    `SELECT status, COUNT(*) AS n FROM attendance a JOIN workers w ON w.id = a.worker_id WHERE a.date = ? AND w.is_active = 1${worksiteFilter} GROUP BY status`,
    statusParams,
  );
  const counts: DailyCounts = {
    present: 0,
    absent: 0,
    half_day: 0,
    off_day: 0,
    unmarked: 0,
  };
  for (const row of rows) {
    if (row.status in counts) {
      counts[row.status as keyof Omit<DailyCounts, 'unmarked'>] = row.n;
    }
  }
  const marked =
    counts.present + counts.absent + counts.half_day + counts.off_day;
  counts.unmarked = Math.max(0, activeCount - marked);
  return counts;
}
