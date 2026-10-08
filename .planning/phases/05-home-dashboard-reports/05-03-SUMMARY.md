---
phase: 05-home-dashboard-reports
plan: 03
subsystem: ui
tags: [react-native, expo-router, reports, attendance]

# Dependency graph
requires:
  - phase: 05-02
    provides: Reports shell with (range, site) filters, single per-worker fetch, aggregate ring, list/trend anchors
  - phase: 04-03
    provides: HistoryRow memo-row precedent, object-form goToProfile push pattern
provides:
  - Memo ReportRow (name + % + 4 STATUS mini counts, accent below floor 75)
  - Frequently-absent bottom-3 callout + highest-first tappable per-worker list on Reports
affects: [05-04 trend chart, register reconciliation hand-check]

# Tech tracking
tech-stack:
  added: []
  patterns: [memo read-only Pressable rows, FlatList scrollEnabled=false inside ScrollView, tabular-nums on counts]

key-files:
  created: [src/components/report-row.tsx]
  modified: [src/app/(tabs)/reports.tsx]

key-decisions:
  - "Reused frozen summarize/sortWorkersHighestFirst/bottomThree verbatim — no parallel math"
  - "Callout hidden entirely (no header) when zero countable days — aggregate EmptyState owns that case"
  - "Anchor comment replaced by real sections; trend anchor left for 05-04"

patterns-established:
  - "ReportRow: memo Pressable row with line-1 name + % and line-2 STATUS chip Views, tabular-nums everywhere"
  - "List derivation: extend the single 05-02 load() in place, never a second fetch"

requirements-completed: [RP-02, RP-04]

# Metrics
duration: 12min
completed: 2026-10-08
---

# Phase 05 Plan 03: Per-Worker Report List Summary

**Per-worker attendance % list with Frequently-absent bottom-3 callout, both derived from the frozen summarize() dataset with object-form profile push**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-08T04:30:00Z
- **Completed:** 2026-10-08T04:42:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Memo `ReportRow`: name + % (accent below 75, `—` for null) + 4 STATUS mini counts, tappable to profile
- Bottom-3 `Frequently absent` callout fixed above the full `All workers` highest-first list
- Every number reconciles with the register by construction (same `summarize()` over the same fetched rows)
- `npx tsc --noEmit` exits 0; both plan grep gates pass

## task Commits

Each task was committed atomically:

1. **task 1: Memo ReportRow component** - `717311f` (feat)
2. **task 2: Bottom-3 callout + sorted list wired to the 05-02 dataset** - `82bf015` (feat)

## Files Created/Modified

- `src/components/report-row.tsx` - Memo per-worker row (ReportRowProps, Pressable, STATUS chips)
- `src/app/(tabs)/reports.tsx` - perWorker/sorted/lowest state, bottom-3 + All-workers sections, goToProfile

## Decisions Made

- Reused frozen `summarize()` / `sortWorkersHighestFirst` / `bottomThree` verbatim per the plan's frozen contracts — countable-only membership, name-asc tiebreaks, and null-sinking all come free from 05-02 helpers with zero screen code.
- Callout renders nothing (no header, no card) when `lowest.length === 0`; the aggregate zero-marks EmptyState already owns that case (D-12).
- Existing `StatsSkeleton` already contains 3 row blocks, so it covers list + callout on filter switch with no change needed.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written, with one gate-interpretation note (not a code change):

**1. [Note - Gate interpretation] `getAttendanceForWorker` line count is 2, call sites are 1**
- **Found during:** task 2 verification
- **Issue:** The plan's gate counts non-comment lines containing `getAttendanceForWorker` and expects exactly 1, but the 05-02 baseline already has 2 such lines: the `import` (line 20) plus the single fetch call (line 99). The literal gate fails on the untouched baseline too.
- **Fix:** No code change — verified intent instead: exactly one *call site* (excluding the import line), i.e. the 05-02 fetch extended in place with no second fetch, no new DAO calls, no new SQL.
- **Verification:** `getAttendanceForWorker` appears on 1 non-import line; `sortWorkersHighestFirst`/`bottomThree`/`Frequently absent`/`All workers`/object-form push present; `StatusPill`/`TouchableOpacity`/`toISOString`/template-literal push count 0.

---

**Total deviations:** 0 code deviations (1 verification note, no scope impact)
**Impact on plan:** None - all success criteria met as specified.

## Issues Encountered

- PowerShell expanded `${name}` inside a double-quoted `node -e` gate, failing the a11y-label check spuriously. Resolved by moving gates to a temp `.cjs` script file (deleted afterwards); both gates then passed (`REPORT-ROW-OK`, `REPORTS-LIST-OK`).
- `git status` shows untracked `.planning/phases/05-home-dashboard-reports/05-02-SUMMARY.md` from the wave-1 agent (uncommitted by that agent). Left untouched as out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Per-worker list + bottom-3 ready; 05-04 trend chart can mount at the remaining `REPORTS-TREND-ANCHOR (05-04)`.
- Roadmap criteria #3 (per-worker % over range) demonstrable; criterion #4 hand-check maps to the deterministic bottom-3 (3-worker sample).

## Self-Check: PASSED

- `src/components/report-row.tsx` FOUND; `src/app/(tabs)/reports.tsx` modifications FOUND
- Commits `717311f`, `82bf015` FOUND in `git log`

---
*Phase: 05-home-dashboard-reports*
*Completed: 2026-10-08*
