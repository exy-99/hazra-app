---
phase: 05-home-dashboard-reports
plan: 02
subsystem: ui
tags: [expo-router, reports, attendance-ring, calendar-sheet, sqlite-read]

# Dependency graph
requires:
  - phase: 02-app-shell
    provides: Tab group routes and MaxContentWidth/BottomTabInset shell shape
  - phase: 03-attendance-marking
    provides: DateStrip modal precedent, chip radio pattern, parameterized DAO reads
  - phase: 04-worker-profiles
    provides: AttendanceRing, StatsSkeleton shape, period-chip and void-load discipline
provides:
  - Pure range/bucket/sort helpers in src/utils/reports.ts importable by Phase 6 Export
  - Shared CalendarSheet (parametrized daysBack + maxDate) reused by DateStrip and Reports
  - Reports shell with single (range, site) scope, aggregate ring, and 05-03/05-04 anchors
affects: [05-03-per-worker-list, 05-04-trend-chart, 06-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-scope load keyed on siblings selectedSite+from+to, gated-not-clamped custom ranges, skeleton-on-switch with chips mounted]

key-files:
  created: [src/utils/reports.ts, src/components/calendar-sheet.tsx]
  modified: [src/components/date-strip.tsx, src/app/(tabs)/reports.tsx]

key-decisions:
  - "DateStrip refactor deletes modal internals and pastThirtyDays; 30-day constant moves to daysBack={30} call site"
  - "Custom-range hint renders only after a draft is touched, so first open shows no error noise"
  - "Pre-existing tsc error in parallel wave's uncommitted index.tsx left untouched (out of scope)"

patterns-established:
  - "Reports helpers stay pure (zero @/db imports) so Phase 6 Export imports them directly"
  - "Weekly buckets are from-anchored 7-day chunks, never locale week starts"
  - "Filter state is never reset inside catch blocks; retry preserves scope"

requirements-completed: [RP-05]

# Metrics
duration: 25min
completed: 2026-10-08
---

# Phase 05 Plan 02: Reports Foundation Summary

**Pure range/bucket/sort helpers plus shared CalendarSheet, and a Reports shell with All+per-site chips, 7/30/90 + gated custom ranges, one single-scope load, and the range-aggregate ring**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-10-08T07:20:00Z
- **Completed:** 2026-10-08T07:45:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `src/utils/reports.ts`: all 6 functions + 3 types, pure over caller-supplied data (zero `@/db` imports), from-anchored weekly buckets
- `src/components/calendar-sheet.tsx`: shared sheet parametrized by `daysBack` + `maxDate`, future keys ungeneratable by construction
- `src/components/date-strip.tsx`: thin wrapper over `CalendarSheet` with frozen `DateStripProps`, identical strip render
- `src/app/(tabs)/reports.tsx`: Last-30-days + All-sites default scope, site chips above range control, gated custom From/To (Save disabled + destructive hint), skeleton discipline, anchors for 05-03/05-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure reports helpers in src/utils/reports.ts** - `ccd9512` (feat)
2. **Task 2: Extract shared CalendarSheet, DateStrip becomes thin wrapper** - `fa63a99` (refactor)
3. **Task 3: Reports shell — filters, single-scope load, range aggregate ring** - `c7907bf` (feat)

## Files Created/Modified

- `src/utils/reports.ts` - rangeForPeriod/isValidRange/listDatesInRange/bucketDates/sortWorkersHighestFirst/bottomThree + ReportPeriod/DateBucket/PerWorkerStat
- `src/components/calendar-sheet.tsx` - CalendarSheet with CalendarSheetProps (visible/selectedKey/maxDate/daysBack/onPick/onClose)
- `src/components/date-strip.tsx` - Wrapper rendering CalendarSheet daysBack={30}; modal internals and pastThirtyDays removed
- `src/app/(tabs)/reports.tsx` - ReportsScreen: site chips, preset + custom range control, single-scope load, aggregate ring + mini counts, skeletons, error/zero states

## Decisions Made

- DateStrip refactor deletes the modal internals and `pastThirtyDays` entirely; the 30-day constant moves to the `daysBack={30}` call site while Reports passes `daysBack={120}`.
- Custom-range destructive hint renders only after a draft is touched (`customTouched && !customValid`), so first open shows no error noise while every invalid state still gates Save.
- Per-worker list and trend sections deferred to 05-03/05-04 via `REPORTS-LIST-ANCHOR` / `REPORTS-TREND-ANCHOR` comments with no placeholder UI.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx tsc --noEmit` reports one error in `src/app/(tabs)/index.tsx:100` (`summarize(rows.filter(...))` — nullable status not narrowed). That file is uncommitted work from a parallel wave (dirty in the working tree before this plan started, outside this plan's `files_modified`). Left untouched per scope boundary; all four files from this plan typecheck clean and every plan grep-gate passes. Logged for the owning wave to resolve.
- PowerShell has no `head` binary, so plan-style piped verification was split into separate `npx tsc --noEmit` + `node` gate runs with identical assertions.

## Stub Tracking

No stubs. All four files fully wired: helpers implement real logic, CalendarSheet generates real date lists from `maxDate`/`daysBack`, and the Reports shell loads live DAO data. The two anchor comments are intentional insertion points for plans 05-03/05-04, not placeholder UI.

## Threat Flags

None beyond the plan's threat model, all mitigated and grep-verified: zero `@/db` imports in `reports.ts` (T-05-02-SQL), `isValidRange` gating with disabled Save + destructive hint (T-05-02-RANGE), `daysBack` window + `maxDate={todayKey()}` caps (T-05-02-SHEET), theme/STATUS tokens only with radio roles (T-05-02-COLOR). No new SQL, no new routes, no schema changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 05-03 (per-worker list + bottom-3) and 05-04 (trend chart) can mount at their anchors and reuse the established `(range, site)` scope, `entriesByWorker` dataset shape, and `sortWorkersHighestFirst`/`bottomThree`/`bucketDates` helpers.
- Watch item: parallel wave's uncommitted `index.tsx` tsc error should be resolved by its owner before any phase-wide typecheck gate is asserted.

## Self-Check: PASSED

- FOUND: src/utils/reports.ts, src/components/calendar-sheet.tsx, src/components/date-strip.tsx, src/app/(tabs)/reports.tsx
- FOUND: ccd9512, fa63a99, c7907bf
- Gates: REPORTS-HELPERS-OK, CALENDAR-SHEET-OK, REPORTS-SHELL-OK all printed

---
*Phase: 05-home-dashboard-reports*
*Completed: 2026-10-08*
