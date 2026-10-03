---
phase: 01-foundation
plan: 05
subsystem: db
tags: [expo-sqlite, dao, soft-delete, worksites, workers, NF-05]

# Dependency graph
requires: [01-03, 01-04]
provides:
  - Worksite CRUD with soft delete (src/db/worksites.ts)
  - Worker CRUD with soft delete and worksite filtering (src/db/workers.ts)
affects: [01-06, 01-08, attendance-marking, worksites-workers, reports, export, backup-restore]

# Tech tracking
tech-stack:
  added: []
  patterns: [expo-sqlite async DAO (getAllAsync/getFirstAsync/runAsync), bound-parameter queries only, soft delete via is_active=0]
key-files:
  created: [src/db/worksites.ts, src/db/workers.ts]
  modified: []
key-decisions:
  - "Empty updateWorker/updateWorksite partials are a no-op (early return) rather than emitting invalid SQL"
  - "create* returns the row via get* after INSERT and throws if the row is missing"
  - "listWorkers builds WHERE dynamically with conditions array so params stay aligned with placeholders"

patterns-established:
  - "All DAO access goes through getDb(); every value is a bound ? parameter, never interpolated"
  - "Plan grep gates executed as node equivalents (PowerShell has no grep); assertions identical"

requirements-completed: [NF-05]

# Metrics
duration: ~10min
completed: 2026-10-03
---

# Phase 01 Plan 05: Worksite + Worker DAO Summary

**Worksite and worker data-access layers in place: full CRUD with is_active soft delete, worksite filtering/reassignment, and bound-parameter queries throughout**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-03T12:15:00Z
- **Completed:** 2026-10-03T12:25:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/db/worksites.ts` exports `listWorksites(includeInactive=false)` (filters `is_active = 1` unless opt-in, ordered `name COLLATE NOCASE`), `getWorksite(id)` (first row or `null`), `createWorksite({name,type,address})` (`newId()`, ISO `created_at`, `is_active = 1`, returns the created row), `updateWorksite(id, partial)` (parameterized UPDATE of only provided fields), `deactivateWorksite(id)` (`UPDATE ... SET is_active = 0`). No `DELETE` anywhere.
- `src/db/workers.ts` exports `listWorkers({worksiteId, includeInactive} = {})` (both filters optional and composable, ordered `name COLLATE NOCASE`), `getWorker(id)` (first row or `null`), `createWorker({name, worksite_id, role, phone})` (requires `worksite_id`, `newId()`, ISO `created_at`, returns the created row), `updateWorker(id, partial)` (supports `name`, `worksite_id` reassignment, `role`, `phone`, `is_active`), `deactivateWorker(id)` (`UPDATE ... SET is_active = 0`). No `DELETE` anywhere.
- `npx tsc --noEmit` exits 0. All plan grep gates pass as node equivalents: worksites (`is_active = 0` 1x, `DELETE FROM` 0x, `newId()` 1x, both exports 1x each), workers (`is_active = 0` 1x, `DELETE FROM` 0x, `worksite_id = ?` 2x, `newId()` 1x, `listWorkers` export 1x).

## Task Commits

Each task was committed atomically:

1. **Task 1: Worksite DAO with soft delete** - `0f966d5` (feat)
2. **Task 2: Worker DAO with soft delete and worksite filter** - `8603c5d` (feat)

## Files Created/Modified

- `src/db/worksites.ts` - Worksite CRUD with soft delete (T-05-01 bound params, T-05-02 no hard delete, T-05-04 active default filter)
- `src/db/workers.ts` - Worker CRUD with worksite filter + reassignment and soft delete (T-05-01 bound params, T-05-02 no hard delete, T-05-04 active default filter)

## Decisions Made

- Empty update partials return early as a no-op instead of emitting `UPDATE ... SET WHERE` (invalid SQL); the plan's "only provided fields" contract implies at least one field, and the guard makes the edge safe.
- `create*` throws a descriptive error if the row is missing after INSERT (should be unreachable; surfaces corruption instead of returning undefined).
- `listWorkers` builds the WHERE clause from a conditions array so bound params stay positionally aligned with placeholders regardless of which filters are present.

## Deviations from Plan

### Auto-fixed Issues

None - implementation matches the plan's action blocks exactly.

---

**Total deviations:** 0 auto-fixed; 0 plan-gate wording notes
**Impact on plan:** No scope change. All must_haves truths hold: parameterized CRUD, soft delete (never hard delete), active-list default exclusion with explicit `includeInactive` opt-in, worker reassignment via `updateWorker`.

## Issues Encountered

- PowerShell environment: `grep`/`head` unavailable; all gates executed as `node` equivalents with identical assertions (per STATE.md convention).
- Manual on-device verification from the plan (create worksite + worker, deactivate, list/includeInactive checks) was NOT performed: no development build/device is available in this environment (expo-sqlite is a native module; AGENTS.md requires a dev build, and none exists yet). Behavior holds by construction (SQL reviewed: `WHERE is_active = 1` default, `UPDATE ... SET is_active = 0` deactivation, `get*` unfiltered by active flag) and is re-verifiable when 01-08 lands.

## Threat Flags

None - no new security-relevant surface beyond the plan's threat model. Mitigations landed as specified: T-05-01 (every value a bound `?` parameter, including dynamically built UPDATE lists — column names are static literals, values are params), T-05-02 (`deactivate*` does `UPDATE ... SET is_active = 0`; `DELETE FROM` count 0 in both files), T-05-03 (`worksite_id NOT NULL REFERENCES` enforced by 01-04 schema; DAOs never delete worksites), T-05-04 (active-list queries filter `is_active = 1` by default; `includeInactive` explicit opt-in).

## Known Stubs

None - no placeholders, TODOs, or unwired data sources introduced. Both files are complete implementations of the §4 DAO interface; attendance DAO (01-06) and Phase 2 screens consume them next.

## User Setup Required

None.

## Next Phase Readiness

- `listWorksites/getWorksite/createWorksite/updateWorksite/deactivateWorksite` and `listWorkers/getWorker/createWorker/updateWorker/deactivateWorker` importable via `@/db/worksites` and `@/db/workers` for the attendance DAO (01-06), db-init wiring (01-08), and Phase 2 roster screens.
- No blockers. Plan 01-06 (attendance DAO) can proceed.

## Self-Check: PASSED

- FOUND: src/db/worksites.ts, src/db/workers.ts
- FOUND: commits 0f966d5, 8603c5d (`git log --oneline`)
- `npx tsc --noEmit` exit 0; gate counts match (see Accomplishments)

---
*Phase: 01-foundation*
*Completed: 2026-10-03*
