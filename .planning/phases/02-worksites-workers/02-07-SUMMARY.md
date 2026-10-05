---
phase: 02-worksites-workers
plan: 07
subsystem: ui
tags: [react-native, expo-router, modal, soft-delete, destructive-confirm, phase-gates]
requires:
  - phase: 02-worksites-workers plan 02-05
    provides: Edit-mode worker-form with getWorker prefill that Remove extends
  - phase: 02-worksites-workers plan 02-06
    provides: Frozen ConfirmDialog contract imported for worker remove
provides:
  - Edit-mode Remove worker with history-kept confirmation wired to soft-delete
  - Phase-wide static gates verified (coverage, no-hex, offline, no-DELETE, Pressable-only)
affects: [phase-3 attendance lists, phase-4 worker history]

tech-stack:
  added: []
  patterns: [cancel-default destructive confirm reuse, history-kept soft-delete copy, phase-wide static gate sweep]

key-files:
  created: []
  modified: [src/app/worker-form.tsx]

key-decisions:
  - "Worker remove needs no live-count guard (unlike worksite remove): the copy is a fixed history-kept string and the dialog renders only in edit mode"
  - "Task 2 was verification-only with zero diff — all six phase gates passed on first run, so no second commit was created"

patterns-established:
  - "Destructive confirms stay text-only (theme.destructive text, never filled background) with Cancel/back/backdrop all aborting"
  - "Phase-gate sweeps run as node one-liners on Windows PowerShell (no grep binary); assertions identical to plan grep gates"

requirements-completed: [WK-03]

duration: 8min
completed: 2026-10-06
---

# Phase 2 Plan 07: Worker Remove + Phase Gates Summary

**Edit-mode text-only Remove worker with history-kept `ConfirmDialog` wired to `deactivateWorker`, plus all six phase-wide static gates verified (8/8 requirement IDs covered, zero hex/network/DELETE/TouchableOpacity)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-06 (sequential executor, main working tree)
- **Completed:** 2026-10-06
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Edit-mode-only text-only "Remove worker" below Save (`Type.label`, `theme.destructive`, `minHeight 44`, centered, `accessibilityRole button`, `accessibilityLabel="Remove worker"`, muted ripple + 0.85 pressed opacity)
- `ConfirmDialog` (frozen 02-06 contract, import only) with title `"Remove ${name.trim()}"`, exact message `"${name.trim()} will disappear from lists, but their attendance history is kept."`, `confirmLabel "Remove"`; confirm runs `await deactivateWorker(editId); router.back()`; cancel hides
- Phase gates all pass: `tsc` exit 0; all 8 WS/WK IDs present in 02-0* frontmatter `requirements:` lines (strict mapping matches plan expectation: WS-01/WS-02→02-03, WS-03→02-06, WS-04→02-01/02-02, WK-01/WK-02→02-05, WK-03→02-07, WK-04→02-01/02-04); zero hardcoded hex outside the sanctioned `rgba(0,0,0,0.4)` backdrop; zero `fetch`/`XMLHttpRequest`/`expo-network`; zero `DELETE FROM` in `src/db/*.ts` + Phase 2 UI files; zero `TouchableOpacity`; both deactivate bodies flip `is_active = 0` only

## Task Commits

Each task was committed atomically (task 2 was verification-only with no diff, so no commit):

1. **Task 1: Remove worker with history-kept confirmation (edit mode only)** - `9a57e71` (feat)
2. **Task 2: Phase-wide static gates (coverage, tokens, offline, no-DELETE)** - no diff, gates verified (no commit)

## Files Created/Modified

- `src/app/worker-form.tsx` - Added `ConfirmDialog` import, `deactivateWorker` import, `confirmVisible` state, `handleConfirmRemove`, edit-mode Remove Pressable + confirm dialog, `remove`/`removeLabel` styles

## Decisions Made

- Worker remove needs no live-count guard unlike worksite remove: the plan specifies a fixed history-kept string and there is no dependent entity to count, so `onPress` shows the dialog directly.
- Task 2 produced zero diff — all six gates passed on the first run, so per the task instructions ("Make NO functional change") no second commit was created. The single task-1 commit carries the plan's code change.

## Deviations from Plan

None - plan executed exactly as written. Task 2's "fix fallout inside `src/app/worker-form.tsx` only" branch was not needed (no fallout found).

## Issues Encountered

None. `npx tsc --noEmit` exited 0 after task 1; all task-1 grep gates passed (`deactivateWorker` x2, `attendance history is kept` x1, `Remove worker` x2, `delete from` x0). All six task-2 gates passed on first run (COVERAGE_OK strict-frontmatter, HEX_TOTAL 0, NET_TOTAL 0, DELETE_TOTAL 0, TOUCH_TOTAL 0).

## Stub Tracking

No stubs — the Remove flow is fully wired (dialog imports frozen `ConfirmDialog`; confirm calls `deactivateWorker` and navigates back). History preservation needs no code: `getWorker`/`getAttendanceForWorker` filter nothing by active state, so Phase 4 screens keep working for removed workers.

## Threat Flags

None — no new surface beyond the plan's threat model. The worker deactivation call site is the plan's single UI→delete boundary and is confirm-gated (T-02-19); `deactivateWorker` flips `is_active` only with zero `DELETE` phase-wide (T-02-20); removed-worker queryability is the specified PRD §9 behavior on a single-owner device (T-02-21, accepted).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 is now complete (7/7 plans): roster CRUD + soft-delete done; lists/pickers stay active-only; history survives removal.
- Phase 3 attendance screens inherit active-only `listWorkers` filtering — no changes needed.
- On-device proofs (2 sites + 5 workers → restart restores; remove worker → gone from lists, history intact) deferred to Phase 9 with the 01-08 deferral (no dev build in this environment).

## Self-Check: PASSED

- FOUND: `src/app/worker-form.tsx`
- FOUND: `9a57e71` (task 1 commit)

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*
