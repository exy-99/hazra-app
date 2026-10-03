import { getDb } from '@/db/index';
import type { AttendanceStatus } from '@/db/types';
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
