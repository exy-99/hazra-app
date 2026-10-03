import { getDb } from '@/db/index';
import type { Worksite } from '@/db/types';
import { newId } from '@/utils/ids';

export async function listWorksites(includeInactive = false): Promise<Worksite[]> {
  const db = getDb();
  if (includeInactive) {
    return db.getAllAsync<Worksite>(
      'SELECT * FROM worksites ORDER BY name COLLATE NOCASE',
    );
  }
  return db.getAllAsync<Worksite>(
    'SELECT * FROM worksites WHERE is_active = 1 ORDER BY name COLLATE NOCASE',
  );
}

export async function getWorksite(id: string): Promise<Worksite | null> {
  const db = getDb();
  const row = await db.getFirstAsync<Worksite>(
    'SELECT * FROM worksites WHERE id = ?',
    [id],
  );
  return row ?? null;
}

export async function createWorksite(input: {
  name: string;
  type: string;
  address?: string | null;
}): Promise<Worksite> {
  const db = getDb();
  const id = newId();
  const created_at = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO worksites (id, name, type, address, created_at, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [id, input.name, input.type, input.address ?? null, created_at],
  );
  const row = await getWorksite(id);
  if (!row) {
    throw new Error('createWorksite failed: row not found after INSERT');
  }
  return row;
}

export async function updateWorksite(
  id: string,
  input: Partial<{ name: string; type: string; address: string | null }>,
): Promise<void> {
  const sets: string[] = [];
  const params: (string | null)[] = [];
  if (input.name !== undefined) {
    sets.push('name = ?');
    params.push(input.name);
  }
  if (input.type !== undefined) {
    sets.push('type = ?');
    params.push(input.type);
  }
  if (input.address !== undefined) {
    sets.push('address = ?');
    params.push(input.address);
  }
  if (sets.length === 0) {
    return;
  }
  const db = getDb();
  await db.runAsync(`UPDATE worksites SET ${sets.join(', ')} WHERE id = ?`, [
    ...params,
    id,
  ]);
}

export async function deactivateWorksite(id: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE worksites SET is_active = 0 WHERE id = ?', [id]);
}
