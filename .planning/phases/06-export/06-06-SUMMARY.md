---
phase: 06-export
plan: 06
subsystem: ui
tags: [expo-router, react-native, export, copy-honesty]

# Dependency graph
requires:
  - phase: 06-export
    provides: Export screen with guarded one-file export flow (06-02..06-05)
provides:
  - Lock-safe empty export guard (returns inside try so finally resets exportLock/exporting)
  - Honest web-PDF success copy and retry-free empty error message
affects: [07-backup-restore, 09-polish-uat]

# Tech tracking
tech-stack:
  added: []
  patterns: [in-try early return so finally owns lock release; render-only copy fixes gated on existing state]

key-files:
  created: []
  modified: [src/app/export.tsx]

key-decisions:
  - "No manual lock reset before the in-try empty return — finally is the single reset path"
  - "Plan grep expectation of 2 capital-S 'Saved to Downloads' hits read as 1 fallback hit + untouched lowercase caption"

patterns-established:
  - "Lock lifecycle: every early return from a locked section sits inside try; finally is the only reset"

requirements-completed: [EX-01, EX-02, EX-03, NF-06]

# Metrics
duration: 10min
completed: 2026-10-11
---

# Phase 06 Plan 06: Export gap closure (CR-01 + WR-08/WR-10) Summary

**Empty export guard moved inside try so finally always releases the lock; web-PDF success card and empty error message made honest with render-only copy**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-11
- **Completed:** 2026-10-11
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- CR-01 closed: tapping Export with an empty snapshot shows "No attendance to export yet" and the CTA stays usable — the guard now returns from inside `try`, so `finally` resets `exportLock`/`exporting`
- WR-08 fixed: on web with PDF selected, the success card shows "Opened print dialog" + "Choose Save as PDF in the print dialog to keep the file." instead of falsely claiming "Saved to Downloads"
- WR-10 fixed: the empty-data error shows with no futile "Try again" retry button; transient failures keep theirs
- `npx tsc --noEmit` exits 0 after both tasks

## task Commits

Each task was committed atomically:

1. **task 1: Move empty guard inside try (CR-01)** - `d50b609` (fix)
2. **task 2: Honest render-only copy for web-PDF success and empty error (WR-08, WR-10)** - `260e3c7` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/app/export.tsx` - Empty guard relocated inside `try` (task 1); success-heading expression + web-PDF caption + retry gate (task 2)

## Decisions Made

- No manual `exportLock.current = false` / `setExporting(false)` before the in-try empty return — returns inside `try` run `finally`, so the single existing reset stays the only path (avoids duplicate-reset drift).
- No new state, no `handleExport` branch changes beyond the guard move, no DAO/serializer/file-helper touches — per plan constraints.

## Deviations from Plan

None - plan executed exactly as written.

Note on task 2 acceptance criterion "`grep -n "Saved to Downloads"` still returns at least 2 hits": the file contains exactly 1 capital-S hit (the `: 'Saved to Downloads'` fallback branch, intact) plus the untouched top caption `Payroll-ready files saved to Downloads.` (lowercase "saved", line 577). Native/web-CSV copy is therefore untouched; the criterion's count assumed the caption matches case-sensitively, which it does not. No code change was needed.

## Issues Encountered

- PowerShell `&&` chaining is not supported in this shell — ran verification commands as separate invocations instead. No impact on the plan.

## Stub Tracking

No stubs introduced. All render branches use existing state (`savedFormat`, `exportError`, `Platform.OS`).

## Threat Flags

None — no new network endpoints, auth paths, file-access patterns, or schema changes. Task 1 implements mitigation T-06-06-01 (lock lifecycle); T-06-06-02/T-06-06-03 accepted per plan (copy-only, utils/DAO untouched).

## Self-Check: PASSED

- `src/app/export.tsx` exists with guard below `try {` (line 391 > line 390), guard block between `try {` and `const pdfTheme` (line 396)
- Commits `d50b609` and `260e3c7` present on main
- `npx tsc --noEmit` exit 0

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Export screen lock lifecycle is now safe for empty-register taps; no remount needed for subsequent exports.
- WR-09/WR-11/WR-12 remain deferred to Phase 9 per plan.
- Ready for `/gsd-discuss-phase 7` (Backup & Restore) or remaining Phase 6 verification steps.

---
*Phase: 06-export*
*Completed: 2026-10-11*
