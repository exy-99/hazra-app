---
phase: 05-home-dashboard-reports
plan: 01
subsystem: ui
tags: [react-native, expo-router, home, dashboard, attendance-ring, pressable, a11y]

# Dependency graph
requires:
  - phase: 02-roster-foundation
    provides: EmptyState action pattern and one-orange-action rule
  - phase: 04-register
    provides: DAO reads (getAttendanceForDate/getDailyCounts), STATUS chips, focus-refetch precedent
provides:
  - Home hero screen (today date + size-170 ring + 4 tappable pills + unmarked line + single orange CTA)
  - Home state branches (zero-workers Add-worker EmptyState, untouched-day ring-dash, skeleton, retry error)
affects: [05-home-dashboard-reports remaining plans, reports, register triage entry]

# Tech tracking
tech-stack:
  added: []
  patterns: [single load() with todayKey() scope + useFocusEffect refetch, read-only STATUS chip Views, MarkedRow ingestion-cast for null-filter gate]

key-files:
  created: []
  modified: [src/app/(tabs)/index.tsx]

key-decisions:
  - "MarkedRow ingestion-cast keeps the verbatim null-filter expression compiling under tsc"
  - "hasMarks ternary separates the untouched-day marks check from the hasWorkers roster check"

patterns-established:
  - "Home scope is fixed to today with no worksite/status params on pushes"
  - "Exactly one theme.accent usage per hero screen; EmptyState action is the only orange element in empty branches"

requirements-completed: [RP-01]

# Metrics
duration: 12min
completed: 2026-10-08
---

# Phase 05 Plan 01: Home Hero Summary

**Home hero showing today's date, a size-170 attendance ring (dash until first mark), four tappable status pills + unmarked line, and exactly one always-visible orange Mark-attendance CTA with zero-workers/skeleton/retry states**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-08T04:30:00Z
- **Completed:** 2026-10-08T04:42:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Rewrote `src/app/(tabs)/index.tsx` as `HomeScreen`: date line, centered `AttendanceRing value={pct} size={170}`, four read-only STATUS chip pills each wrapped in a `Pressable` pushing plain-string `/attendance`, muted `N unmarked` line, and one full-width orange `Mark attendance` CTA that stays mounted even when the day is fully marked
- Added the four states: zero-workers `No workers yet` EmptyState with `Add worker` action (CTA suppressed in that branch), untouched-day ring-dash with intact pills + CTA and no card, first-load skeleton (170 ring block + 4 count blocks + CTA block), and `Couldn't load today's attendance` retry EmptyState that never clears loaded rows
- All verification gates pass: `npx tsc --noEmit` exit 0, `HOME-HERO-OK`, `HOME-STATES-OK`, `THREAT-GATES-OK`

## task Commits

Each task was committed atomically:

1. **task 1: Home hero load + ring + date + pills + CTA** - committed as feat (see git log)
2. **task 2: Home states — zero-workers, untouched-day, loading, error** - folded into the single-file rewrite commit (same file, both tasks verified together)

_Note: single-file plan; both tasks landed in one atomic commit since Task 2 extends Task 1's file in place._

## Files Created/Modified

- `src/app/(tabs)/index.tsx` - Home hero screen (date + ring + pills + CTA + all four states); only file touched, no new files or routes

## Decisions Made

- `MarkedRow` ingestion-cast: `getAttendanceForDate` returns `status: null` rows and plain `.filter()` does not narrow the element type under tsc, so rest state is typed `MarkedRow` (`AttendanceDateRow & { status: AttendanceStatus }`) with a single ingestion-only cast. Runtime nulls are preserved and every read path (`hasWorkers`, `hasMarks`, the verbatim `summarize(rows.filter(...))` call) still handles nulls explicitly.
- `hasMarks` ternary for the ring value keeps the untouched-day marks check (`rows.some(s !== null)`) distinct from the zero-workers roster check (`rows.length > 0`), satisfying the two-distinct-branches rule with no single `rows.length === 0` branch.
- Skeleton condition is `loading && counts === null && !loadError` so refetches with settled data never flash a skeleton, and the error branch never clears loaded rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plain `.filter()` null-check did not satisfy tsc's `summarize` parameter type**
- **Found during:** task 1 (Home hero load + ring + date + pills + CTA)
- **Issue:** `summarize(rows.filter((r) => r.status !== null))` failed typecheck: `AttendanceDateRow.status` is `AttendanceStatus | null` and a boolean-callback `filter` does not narrow the element type, so `tsc` rejected the call while the plan mandates that exact verbatim expression
- **Fix:** Typed rest state as `MarkedRow` with a documented ingestion-only cast (`setRows(data as MarkedRow[])`); runtime nulls preserved, all consumers still null-filter first
- **Files modified:** src/app/(tabs)/index.tsx
- **Verification:** `npx tsc --noEmit` exits 0 and the verbatim `summarize(rows.filter((r) => r.status !== null))` string is present
- **Committed in:** task commit (part of the single-file rewrite)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-level fix only; runtime behavior, copy, and all grep gates match the plan exactly. No scope creep.

## Issues Encountered

- PowerShell has no `head`, so the `| head -30` tail on a tsc probe failed; reran bare `npx tsc --noEmit` (exit 0). Also ran the plan's `node -e` gates via a temp script file instead of inline quoting to avoid PowerShell quoting breakage; temp file deleted after the run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Home triage entry is ready: pills and CTA deep-link to plain-string `/attendance`, zero-workers routes to `/worker-form`; no invented params anywhere
- Threat posture holds: no SQL in the screen (DAO-only reads), plain-string pushes only, zero hardcoded hex, `theme.accent` used exactly once, every pill carries label text (never color alone)

## Self-Check: PASSED

- `src/app/(tabs)/index.tsx` exists and contains the hero + all four states
- `npx tsc --noEmit` exits 0; `HOME-HERO-OK`, `HOME-STATES-OK`, `THREAT-GATES-OK` all printed
- No stubs introduced (all counts come from `getDailyCounts(today)` in the same scope as rows)

---
*Phase: 05-home-dashboard-reports*
*Completed: 2026-10-08*
