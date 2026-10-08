import { getDb } from '@/db/index';
import type { Worker } from '@/db/types';
import { newId } from '@/utils/ids';

export async function listWorkers(
  opts: { worksiteId?: string; includeInactive?: boolean } = {},
): Promise<Worker[]> {
  const db = getDb();
  const { worksiteId, includeInactive = false } = opts;
  const conditions: string[] = [];
  const params: string[] = [];
  if (!includeInactive) {
    conditions.push('is_active = 1');
  }
  if (worksiteId !== undefined) {
    conditions.push('worksite_id = ?');
    params.push(worksiteId);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Worker>(
    `SELECT * FROM workers ${where} ORDER BY name COLLATE NOCASE`,
    params,
  );
}

export async function getWorker(id: string): Promise<Worker | null> {
  const db = getDb();
  const row = await db.getFirstAsync<Worker>(
    'SELECT * FROM workers WHERE id = ?',
    [id],
  );
  return row ?? null;
}

export async function createWorker(input: {
  name: string;
  worksite_id: string;
  role?: string | null;
  phone?: string | null;
}): Promise<Worker> {
  const db = getDb();
  const id = newId();
  const created_at = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO workers (id, name, worksite_id, role, phone, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, input.name, input.worksite_id, input.role ?? null, input.phone ?? null, created_at],
  );
  const row = await getWorker(id);
  if (!row) {
    throw new Error('createWorker failed: row not found after INSERT');
  }
  return row;
}

export async function updateWorker(
  id: string,
  input: Partial<{
    name: string;
    worksite_id: string;
    role: string | null;
    phone: string | null;
    is_active: number;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (input.name !== undefined) {
    sets.push('name = ?');
    params.push(input.name);
  }
  if (input.worksite_id !== undefined) {
    sets.push('worksite_id = ?');
    params.push(input.worksite_id);
  }
  if (input.role !== undefined) {
    sets.push('role = ?');
    params.push(input.role);
  }
  if (input.phone !== undefined) {
    sets.push('phone = ?');
    params.push(input.phone);
  }
  if (input.is_active !== undefined) {
    sets.push('is_active = ?');
    params.push(input.is_active);
  }
  if (sets.length === 0) {
    return;
  }
  const db = getDb();
  await db.runAsync(`UPDATE workers SET ${sets.join(', ')} WHERE id = ?`, [
    ...params,
    id,
  ]);
}

export async function deactivateWorker(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE workers SET is_active = 0 WHERE id = ?', [id]);
}

/**
 * Permanently delete a worker and all of their attendance history.
 * Destructive and irreversible — intended for workers already removed via
 * deactivateWorker(); the UI only exposes it on inactive (is_active = 0)
 * workers. Attendance rows are deleted first because the FK has no cascade.
 */
export async function deleteWorker(id: string): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM attendance WHERE worker_id = ?', [id]);
    await db.runAsync('DELETE FROM workers WHERE id = ?', [id]);
  });
}
