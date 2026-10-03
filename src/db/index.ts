import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'hazra.db';
const SCHEMA_VERSION = 1;

let db: SQLiteDatabase | null = null;
let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<void> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME);
  }
  const database = await dbPromise;
  db = database;

  await database.execAsync('PRAGMA foreign_keys = ON;');

  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS worksites(id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, address TEXT,
          created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1);`,
  );
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS workers(id TEXT PRIMARY KEY, name TEXT NOT NULL, worksite_id TEXT NOT NULL REFERENCES worksites(id),
        role TEXT, phone TEXT, created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1);`,
  );
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS attendance(id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers(id), date TEXT NOT NULL,
           status TEXT NOT NULL CHECK(status IN ('present','absent','half_day','off_day')),
           note TEXT, updated_at TEXT NOT NULL, UNIQUE(worker_id, date));`,
  );

  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion < SCHEMA_VERSION) {
    await database.execAsync('PRAGMA user_version = 1');
  }
}

export function getDb(): SQLiteDatabase {
  if (!db) {
    throw new Error(
      'Database not initialized. Call await initDatabase() first (the root layout does this on launch).',
    );
  }
  return db;
}
