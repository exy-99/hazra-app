---
phase: 01-foundation
plan: 06
subsystem: database
tags: [expo-sqlite, typescript, dao, attendance, upsert]

# Dependency graph
requires:
  - phase: 01-foundation plan 01-04
    provides: getDb() singleton, AttendanceEntry/AttendanceStatus types, attendance table with UNIQUE(worker_id,date)
  - phase: 01-foundation plan 01-03
    provides: newId() from expo-crypto randomUUID
provides:
  - Attendance DAO in src/db/attendance.ts (upsertAttendance, getAttendanceForDate, getAttendanceForWorker, getDailyCounts)
  - AttendanceDateRow and DailyCounts interfaces per PLANNING-CONVENTIONS.md §4
affects: [03-attendance-marking, 04-worker-profile-history, 05-home-dashboard-reports, 06-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-statement ON CONFLICT upsert, LEFT JOIN date view with null status for unmarked, grouped counts with derived unmarked]

key-files:
  created: [src/db/attendance.ts]
  modified: []

key-decisions:
  - "getDailyCounts derives unmarked as active-count minus marked sum (never stored, never negative via Math.max)"
  - "History query keeps inactive workers reachable via getAttendanceForWorker (no is_active filter there)"

patterns-established:
  - "DAO param binding: every value bound as ? parameter, never interpolated"
  - "Read scoping: date/count views filter w.is_active = 1; history does not"

requirements-completed: [NF-05]

# Metrics
duration: 10min
completed: 2026-10-03
---

# Phase 1 Plan 6: Attendance DAO Summary

**Single-statement attendance upsert plus date-view, range-history, and daily-count reads in `src/db/attendance.ts`**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-03T (plan execution start)
- **Completed:** 2026-10-03
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- `upsertAttendance` runs one parameterized `INSERT ... ON CONFLICT(worker_id, date) DO UPDATE` — second call for the same (worker, date) updates status/note/updated_at in place, never duplicates (AT-05 / NF-05).
- `getAttendanceForDate` returns every active worker with `status: null` / `entry_id: null` when unmarked, ordered by name (NOCASE), with optional worksite scope.
- `getAttendanceForWorker` reads a worker's entries over an optional from/to range ordered by date ASC (history survives soft-delete).
- `getDailyCounts` returns `{present, absent, half_day, off_day, unmarked}` with `off_day` kept separate from `absent` and `unmarked` derived from the active-worker count.
- `npx tsc --noEmit` exits 0; all plan grep gates pass.

## Task Commits

Each task was committed atomically:

1. **Task 1: Single-statement attendance upsert** - `ab78606` (feat)
2. **Task 2: Attendance read queries for date, worker history, and daily counts** - `c64cfa9` (feat)

**Plan metadata:** `1738b73` (docs: complete plan)

## Files Created/Modified

- `src/db/attendance.ts` - Attendance DAO: `upsertAttendance`, `AttendanceDateRow`, `DailyCounts`, `getAttendanceForDate`, `getAttendanceForWorker`, `getDailyCounts`

## Decisions Made

- `getDailyCounts` computes `unmarked = max(0, activeCount - markedSum)` where `markedSum` includes `off_day` (an off_day mark means the worker was accounted for, so they are not unmarked). Missing status keys default to 0.
- `getAttendanceForWorker` intentionally has no `is_active` filter so a deactivated worker's history stays reachable (matches threat mitigation T-06-05 and PRD history-preservation rule).
- `getDailyCounts` ignores rows with unexpected status values (`if (row.status in counts)`) rather than throwing — the schema CHECK is the hard guard; the DAO stays total.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. PowerShell has no `grep`/`head` binaries, so grep gates were run as `node -e` equivalents with identical assertions (per the STATE.md convention from prior plans).

## Manual Verification (recorded per plan §verification steps 3–4)

Not executed on-device: `expo-sqlite` is a native module and requires a development build (per AGENTS.md); there is no test runner in this repo. Correctness is established statically:

- Uniqueness: the schema backing this DAO (`src/db/index.ts`, plan 01-04) declares `UNIQUE(worker_id, date)`, and the upsert's `ON CONFLICT(worker_id, date) DO UPDATE` targets exactly that constraint — a second call for one (worker, date) must update the single row (`SELECT COUNT(*)` = 1, status = second value) by SQLite semantics, with no SELECT-then-write race window.
- Counts math: `getDailyCounts` groups by status and derives `unmarked` from the active-worker count in the same scope, so a date with 2 present + 1 absent + 1 off_day + 1 unmarked among 5 active workers yields `{present:2, absent:1, half_day:0, off_day:1, unmarked:1}` by construction.
- On-device double-tap and counts verification should be done once the Phase 1 app boots in a development build (plan 01-08 / Phase 3).

## Threat Flags

None - no new security surface beyond the plan's threat model. All values bound as `?` parameters (T-06-02); status comes from the TS union, never built dynamically (T-06-03); `updated_at` rewritten on every upsert (T-06-04); date/count views filter `w.is_active = 1` (T-06-05).

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Attendance DAO completes the DB layer (worksites + workers + attendance). Remaining Phase 1 work: plan 01-08 (db init + EmptyState).
- Phase 3 (attendance marking) can build directly on `upsertAttendance` / `getAttendanceForDate` / `getDailyCounts` with the exact signatures in PLANNING-CONVENTIONS.md §4.

---
*Phase: 01-foundation*
*Completed: 2026-10-03*

## Self-Check: PASSED

- FOUND: src/db/attendance.ts
- FOUND: ab78606 (task 1 commit)
- FOUND: c64cfa9 (task 2 commit)
- `npx tsc --noEmit` exits 0
