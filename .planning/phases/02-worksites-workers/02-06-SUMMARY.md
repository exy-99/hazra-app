---
phase: 02-worksites-workers
plan: 06
subsystem: ui
tags: [react-native, expo-router, modal, soft-delete, destructive-confirm]
requires:
  - phase: 02-worksites-workers plan 02-03
    provides: Edit-mode worksite-form with getWorksite prefill that Remove extends
provides:
  - Shared ConfirmDialog with frozen cancel-default contract for 02-07 reuse
  - Edit-mode Remove worksite with live worker-count guard and soft-delete only
affects: [02-07 worker delete flow, phase-2 gates]

tech-stack:
  added: []
  patterns: [cancel-default destructive confirm (back/backdrop/Cancel abort), live-count-at-press guard, text-only destructive affordance]

key-files:
  created: [src/components/confirm-dialog.tsx]
  modified: [src/app/worksite-form.tsx]

key-decisions:
  - "ConfirmDialog backdrop Pressable wraps the card per plan contract; inner Cancel/Remove Pressables take precedence so card-body taps also abort safely"
  - "Remove-press ripple uses theme.muted since the plan specifies ripple without a color and destructive is text-only"

patterns-established:
  - "Destructive confirms are text-only (theme.destructive text, never filled background) with Cancel/back/backdrop all aborting"
  - "Guard counts are queried live at press time via listWorkers, never passed as stale props"

requirements-completed: [WS-03]

duration: 10min
completed: 2026-10-06
---

# Phase 2 Plan 06: Worksite Remove + ConfirmDialog Summary

**Shared cancel-default `ConfirmDialog` (text-only destructive) plus edit-mode Remove worksite with live worker-count message and soft-delete-only deactivation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-06 (sequential executor, main working tree)
- **Completed:** 2026-10-06
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `ConfirmDialog` frozen contract (`visible/title/message/confirmLabel/onConfirm/onCancel`) with fade Modal, `onRequestClose` cancel, backdrop-press dismiss, `Radius.lg` card, Cancel + text-only destructive confirm
- Edit-mode-only text-only "Remove worksite" below Save; press queries live `listWorkers({ worksiteId })` count and shows the exact plan-specified count-aware copy
- Confirm runs `deactivateWorksite` then `router.back()`; zero `DELETE` SQL in either file; back/backdrop/Cancel all abort with no DB write

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared ConfirmDialog component (frozen phase-wide contract)** - `40fe351` (feat)
2. **Task 2: Remove worksite with worker-count guard (edit mode only)** - `d38b8a1` (feat)

## Files Created/Modified

- `src/components/confirm-dialog.tsx` - Shared destructive confirm dialog (cancel-default); frozen contract for 02-07 reuse
- `src/app/worksite-form.tsx` - Edit-mode text-only Remove worksite wired to `deactivateWorksite` with live worker-count dialog

## Decisions Made

- Backdrop Pressable wraps the card per the plan contract; nested Cancel/Remove Pressables handle their own taps, so taps on title/message also abort — safe default preserved.
- Remove-press `android_ripple` uses `theme.muted`: the plan mandates a ripple but no color, and destructive must stay text-only, so a neutral ripple avoids implying a filled destructive surface.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npx tsc --noEmit` exited 0 on both tasks; all grep gates passed (`ConfirmDialog` x1, `onRequestClose` x1, `theme.destructive` text-only x1 per file, `deactivateWorksite` x2, `This worksite has` x1, `Remove worksite` x2, `delete from` x0). A broad `destructive`/`backgroundColor` cross-line regex initially flagged both files, but per-line inspection confirmed both `theme.destructive` usages are `Text` color only — no filled destructive background exists.

## Stub Tracking

No stubs — both files are fully wired (dialog imports `useTheme` tokens; Remove queries live counts and deactivates).

## Threat Flags

None — no new surface beyond the plan's threat model. The only deactivation call site is confirm-gated (T-02-16), no `DELETE` statement exists (T-02-17), and the roster count is shown to the on-device data owner only (T-02-18, accepted).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ConfirmDialog` contract frozen and ready for 02-07 worker remove flow (import, do not re-declare).
- Phase-wide gate in 02-07 will assert zero `DELETE` SQL — this plan introduces none.
- On-device tap-through (Remove → count copy → confirm/back) needs a development build; same Phase 9 deferral class as prior UI plans.

## Self-Check: PASSED

- FOUND: `src/components/confirm-dialog.tsx`
- FOUND: `src/app/worksite-form.tsx`
- FOUND: `40fe351` (task 1 commit)
- FOUND: `d38b8a1` (task 2 commit)

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*
