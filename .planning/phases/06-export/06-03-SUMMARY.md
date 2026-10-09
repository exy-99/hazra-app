---
phase: 06-export
plan: 03
subsystem: export
tags: [export, deep-links, expo-router, report-row, worker-profile, one-orange]

# Dependency graph
requires:
  - phase: 06-export
    provides: single /export drill-down with validated workerId/worksiteId/month params from 06-02
  - phase: 04-worker-profile-history
    provides: profile Edit CTA anchor + one-orange rule reconciled by D-02
  - phase: 05-home-dashboard-reports
    provides: reports screen with per-worker rows + site filter chips from 05-02/05-03
provides:
  - Secondary Export action on worker profile pushing /export?workerId= (incl. removed workers)
  - Reports per-worker Export affordances + site-context monthly-register deep-link
  - Phase-wide discipline gates green (tsc, no-hex, Pressable-only, tabular-nums, no-toISOString)
affects: [07-backup, 09-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [display-string deep-link params validated downstream, conditional Export affordance on existing rows]

key-files:
  created: []
  modified: [src/app/worker/[id].tsx, src/app/(tabs)/reports.tsx, src/components/report-row.tsx]

key-decisions:
  - "Profile Export renders unconditionally in the loaded-worker branch (Edit stays removed-gated)"
  - "Site-context export sits directly below the site chips and only when a site is selected"
  - "Nested Export Pressable inside the row card relies on inner-Pressable precedence (02-06 precedent)"

patterns-established:
  - "Deep-link pushes carry raw ids as display strings only; 06-02 validates via getWorker/getWorksite null to not-found"
  - "Row-level Export affordances render only when onExport is wired (EmptyState showAction discipline)"

requirements-completed: [EX-01, EX-02, EX-03]

# Metrics
duration: 15min
completed: 2026-10-09
---

# Phase 6 Plan 3: Export Entry Points + Phase Gates Summary

**Worker profile gains a secondary Export action and reports rows + site context deep-link into preselected /export scopes — one-orange intact, all phase gates green**

## Performance

- **Duration:** 15 min
- **Started:** 2026-10-09T08:00:00Z
- **Completed:** 2026-10-09T08:15:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `src/app/worker/[id].tsx`: `goToExport()` pushes `/export` with the raw `workerId` display string; secondary Export Pressable (surface + border + primary text, zero orange) sits directly below the byte-identical Edit CTA and renders for removed workers too (history stays exportable per D-11)
- `src/components/report-row.tsx`: optional `onExport?: (workerId: string) => void` prop with a text-only primary Export Pressable (`Export {name} history` label) rendered only when wired; row tap still opens the profile
- `src/app/(tabs)/reports.tsx`: `goToExportWorker()` passed as `onExport` to both ReportRow usages (Frequently-absent + All-workers); site-context "Export monthly register" button renders only when `selectedSite !== null`, pushing `?worksiteId=&month=` with the current `todayKey()` month
- All five phase-wide gates pass: `tsc` exit 0, no hardcoded hex in export chrome, zero `TouchableOpacity` in all five touched UI files, `tabular-nums` in export + month-sheet, zero `toISOString` in export screen/month-sheet

## Task Commits

Each task was committed atomically:

1. **Task 1: profile Export action below Edit** - `09cb7d7` (feat)
2. **Task 2: reports deep-links + phase gates** - `f2bc5b0` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/app/worker/[id].tsx` - `goToExport` + secondary Export action below Edit, `exportAction`/`exportLabel` styles (modified)
- `src/app/(tabs)/reports.tsx` - `goToExportWorker`, `onExport` on both row lists, site-context register button + styles (modified)
- `src/components/report-row.tsx` - Optional `onExport` prop + conditional text-only Export Pressable (modified)

## Decisions Made

- Profile Export renders unconditionally inside the loaded-worker branch (the branch itself guarantees `worker !== null && !notFound && !loading`), while Edit stays `removed`-gated — so removed workers get Export but never Edit. Rationale: D-11 history stays exportable without weakening the one-orange rule.
- Site-context export sits directly below the site chips ScrollView (before the period range section) and only when a site is selected; All-sites shows no button. Rationale: a register is per-site by definition (D-10), and the chips row is the worksite context.
- ReportRow nests the Export Pressable inside the profile-opening card Pressable, relying on nested-Pressable precedence (02-06 ConfirmDialog precedent) rather than restructuring the row. Rationale: row tap behavior stays byte-identical.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None - no new security-relevant surface. Both deep-link pushes carry raw ids as display strings only (T-06-09 mitigated: 06-02 validates via getWorker/getWorksite null to not-found, zero SQL in these files). The ReportRow affordance opens the same worker's scope with the worker's name in the label (T-06-10 accepted by design).

## Issues Encountered

- PowerShell has no `head` binary and mangles inline `node -e` quoting (same as 06-01/06-02): ran `npx tsc --noEmit` bare with `$LASTEXITCODE` and the plan's `node -e` assertions from temp `.cjs` files — PROFILE_OK, ORANGE_OK, LINKS_OK, PRESSABLE_OK, HEX_OK, TABULAR_OK, DATES_OK all print OK. Temp check files deleted before committing.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Export is now reachable end-to-end (EX-01/EX-02/EX-03): profile Export, reports row Export, and site-context register Export all land on the validated 06-02 screen with preselected scope; no tab changes.
- Phase 6 plans COMPLETE (3/3). Next: `/gsd-verify-work 6` then code review.
- Deferred verification debt (unchanged): on-device profile-Export tap, reports-row tap, Downloads save, Excel/Sheets probe, second-device transfer remain Phase 9 proofs (no dev build in this environment).

---
*Phase: 06-export*
*Completed: 2026-10-09*

## Self-Check: PASSED

- FOUND: src/app/worker/[id].tsx, src/app/(tabs)/reports.tsx, src/components/report-row.tsx
- FOUND: 09cb7d7, f2bc5b0 (`git log --oneline` contains both)
- `npx tsc --noEmit` → exit 0; PROFILE_OK + ORANGE_OK + LINKS_OK + PRESSABLE_OK + HEX_OK + TABULAR_OK + DATES_OK
