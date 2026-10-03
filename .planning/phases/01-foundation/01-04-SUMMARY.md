---
phase: 01-foundation
plan: 04
subsystem: db
tags: [expo-sqlite, schema, sqlite, singleton, NF-02, NF-05]

# Dependency graph
requires: [01-01]
provides:
  - Entity row types matching the frozen schema (src/db/types.ts)
  - Idempotent SQLite schema init + cached singleton handle (src/db/index.ts)
affects: [01-05, 01-06, 01-08, attendance-marking, reports, export, backup-restore]

# Tech tracking
tech-stack:
  added: []
  patterns: [expo-sqlite async API (openDatabaseAsync/execAsync/getFirstAsync), module-level cached promise singleton, PRAGMA user_version migration hook]
key-files:
  created: [src/db/types.ts, src/db/index.ts]
  modified: []
key-decisions:
  - "initDatabase declared `export async function` (plan grep gate `export function initDatabase` is imprecise — see Deviations)"
  - "openDatabaseAsync appears 2x (import + call); plan key_links pattern requires presence only, no count gate"
  - "expo-sqlite SDK-57 async names confirmed against versioned docs: openDatabaseAsync/execAsync/getFirstAsync all exist as specified"

patterns-established:
  - "All DB access goes through getDb() after await initDatabase(); never open a second connection"
  - "Plan grep gates executed as node equivalents (PowerShell has no grep); assertions identical"

requirements-completed: [NF-02, NF-05]

# Metrics
duration: ~10min
completed: 2026-10-03
---

# Phase 01 Plan 04: DB Types + Schema Summary

**Frozen SQLite contract in place: typed Worksite/Worker/AttendanceEntry rows plus an idempotent initDatabase()/getDb() lifecycle with foreign keys, status CHECK, dedupe UNIQUE, and a user_version migration hook**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-03T12:00:00Z
- **Completed:** 2026-10-03T12:10:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/db/types.ts` exports the three row interfaces with exact schema columns: `Worksite { id, name, type, address: string | null, created_at, is_active: number }`, `Worker { id, name, worksite_id, role: string | null, phone: string | null, created_at, is_active: number }`, `AttendanceEntry { id, worker_id, date, status: AttendanceStatus, note: string | null, updated_at }`. `AttendanceStatus` is re-exported (not redefined) from canonical `src/constants/status.ts` (plan 01-01). Types only, no runtime code.
- `src/db/index.ts` exports `initDatabase(): Promise<void>` (cached `openDatabaseAsync('hazra.db')` promise, `PRAGMA foreign_keys = ON`, three `CREATE TABLE IF NOT EXISTS` statements matching PRD §8 exactly, then `PRAGMA user_version` read with persist-if-below `SCHEMA_VERSION` (1)) and `getDb(): SQLiteDatabase` (returns cached handle, throws with a clear `await initDatabase()` message otherwise; never opens a second connection).
- `npx tsc --noEmit` exits 0. All plan grep gates pass as node equivalents (UNIQUE 1x, CHECK 1x, each CREATE TABLE 1x, foreign_keys ≥1x, user_version 4x, `PRAGMA user_version = 1` 1x, getDb export 1x; initDatabase export covered via deviation note).
- expo-sqlite SDK-57 docs (`https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/`) confirm the plan's expected async names: `openDatabaseAsync(name)` → `SQLiteDatabase`, `db.execAsync(sql)` for DDL/PRAGMA, `db.getFirstAsync`/`getAllAsync`/`runAsync` for DAO work. No deviation needed — documented equivalents match.

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the entity types** - `1827a4c` (feat)
2. **Task 2: SQLite schema and init/getDb lifecycle** - `7381f1f` (feat)

## Files Created/Modified

- `src/db/types.ts` - Row/entity types matching the frozen schema; status union re-exported (T-04-01 defense-in-depth starts at schema level)
- `src/db/index.ts` - `initDatabase()` idempotent init (T-04-04, T-04-06) + `getDb()` cached singleton (T-04-04); static DDL strings only, nothing parameterized

## Decisions Made

- Declared `initDatabase` as `export async function` (required: it awaits). The plan's grep gate `export function initDatabase` cannot match any async declaration; intent (exported function named initDatabase) is satisfied and verified via the `function initDatabase` 1x node check.
- `openDatabaseAsync` legitimately appears 2x (import + call site); the plan sets no count gate for it (only a key_links presence pattern), so no conflict.
- Read `user_version` via `getFirstAsync<{ user_version: number }>('PRAGMA user_version')` with `?? 0` fallback; version write is a static `PRAGMA user_version = 1` string (never downgrades: guarded by `< SCHEMA_VERSION`).
- Concurrent `initDatabase()` calls share one `dbPromise`, so double-launch cannot open two connections.

## Deviations from Plan

### Auto-fixed Issues

None - implementation matches the plan's action blocks exactly.

### Plan-gate imprecisions (not implementation bugs)

**1. Grep gate `export function initDatabase` = 1 cannot match the specified implementation**
- **Found during:** Task 2 verification
- **Issue:** The plan's `<action>` specifies an async lifecycle (`initDatabase(): Promise<void>`, `await db.execAsync(...)`), which requires `export async function initDatabase`. The literal substring `export function initDatabase` never appears in such a declaration, so the gate undercounts its own specified source (same class of error as the 01-01 `#B45309` and 01-03 `randomUUID` count fixes). Verified instead: `function initDatabase` 1x + `export` on the same declaration + `tsc` exit 0.
- **Impact:** None on scope or behavior. Gate wording should read `function initDatabase` for future plans.

---

**Total deviations:** 0 auto-fixed; 1 plan-gate wording note (no code change warranted)
**Impact on plan:** No scope change. All must_haves truths hold: schema matches PRD §8 exactly, FK enforced, init idempotent, user_version hook present, single cached handle.

## Issues Encountered

- PowerShell environment: `grep` unavailable; all gates executed as `node` equivalents with identical assertions (per STATE.md convention). Temp check scripts removed after use.
- Manual on-device verification from the plan (`boot once, sqlite_master query, double initDatabase()`) was NOT performed: no development build/device is available in this environment (expo-sqlite is a native module; AGENTS.md requires a dev build, and none exists yet — plan 01-08 wires init into the root layout). Idempotency holds by construction (`IF NOT EXISTS` × 3, cached promise, version guard never downgrades) and is re-verifiable when 01-08 lands.

## Threat Flags

None - no new security-relevant surface beyond the plan's threat model. Mitigations landed as specified: T-04-01 (CHECK status whitelist in DDL, 1x), T-04-02 (UNIQUE(worker_id, date), 1x; upsert semantics arrive in 01-06), T-04-03 (`PRAGMA foreign_keys = ON` + REFERENCES on both child tables), T-04-04 (cached `dbPromise`/`db` + IF NOT EXISTS idempotency), T-04-06 (`PRAGMA user_version` read + guarded persist of version 1). T-04-05 accepted per plan (offline single-device, no encryption in v1).

## Known Stubs

None - no placeholders, TODOs, or unwired data sources introduced. Both files are complete implementations of the frozen §4 interface; DAOs (01-05/01-06) consume them next.

## User Setup Required

None.

## Next Phase Readiness

- `initDatabase()`/`getDb()` importable via `@/db` for the worksite/worker DAO (01-05), attendance DAO (01-06), and root-layout wiring (01-08). Row types importable via `@/db/types`.
- No blockers. Plan 01-05 (worksite + worker DAO) can proceed.

## Self-Check: PASSED

- FOUND: src/db/types.ts, src/db/index.ts
- FOUND: commits 1827a4c, 7381f1f (`git log --oneline`)
- `npx tsc --noEmit` exit 0; gate counts match (UNIQUE 1, CHECK 1, 3× CREATE TABLE 1 each, foreign_keys ≥1, user_version ≥1, `PRAGMA user_version = 1` 1, getDb export 1, status import 1, 3 interfaces 1 each, is_active 2, literal union 0)

---
*Phase: 01-foundation*
*Completed: 2026-10-03*
