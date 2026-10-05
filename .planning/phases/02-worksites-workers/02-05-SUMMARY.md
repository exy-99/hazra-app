---
phase: 02-worksites-workers
plan: 05
subsystem: ui
tags: [expo-router, react-native, form-validation, sqlite, workers]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: worker/worksite DAOs (createWorker/updateWorker/getWorker, listWorksites) and EmptyState/FormField contracts
  - phase: 02-worksites-workers/02-03
    provides: frozen FormField contract and add/edit-via-?id= form pattern (useFocusEffect prefill, not-found EmptyState, orange Save)
provides:
  - Worker add/edit form with required worksite radio selector, inline validation, and reassignment via updateWorker
  - Zero-worksites guidance routing to /worksite-form with Save disabled
affects: [02-07 worker delete, phase-3 attendance marking (worker roster source)]

# Tech tracking
tech-stack:
  added: []
  patterns: [focus-refetch form prefill, radio-row selector with accessibilityRole radio, one-orange-action-per-screen]

key-files:
  created: []
  modified: [src/app/worker-form.tsx]

key-decisions:
  - "Loading gate covers both modes (useState(true)) so add mode never flashes the zero-worksites state before listWorksites resolves"
  - "Legacy inactive worksite_id in edit mode leaves the selector unselected, so the plan's own save gate enforces T-02-15 (saving requires an active pick)"
  - "FormField touch tracking stays in onChangeText (no onBlur in frozen contract), matching the 02-03 pattern"

patterns-established:
  - "Radio-row selector: Pressable minHeight 44 + Radius.md + Spacing.two padding/gap, selected = primary border/name + caption Selected tag, accessibilityRole radio with selected state"
  - "Zero-dependency-state: body guidance text + text-only primary Pressable link, Save disabled via sites.length === 0"

requirements-completed: [WK-01, WK-02]

# Metrics
duration: 12min
completed: 2026-10-06
---

# Phase 2 Plan 05: Worker Form Summary

**Worker add/edit form with required worksite radio selector, exact inline errors, blank-to-null optionals, and reassignment through the same updateWorker call**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-06T (phase execution wave 2)
- **Completed:** 2026-10-06
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Add mode validates name + worksite, stores blank role/phone as `null`, persists via `createWorker`, returns via `router.back()`
- Edit mode prefills name/worksite/role/phone via `getWorker`, and changing the site reassigns through the same `updateWorker` call
- Zero worksites (add mode) shows guidance + "Add worksite" link to `/worksite-form`; Save is disabled, never a dead save
- Tampered `?id=` renders the "Worker not found" EmptyState (Users icon, no action), never a crash

## Task Commits

Each task was committed atomically:

1. **Task 1: Worker form fields with required worksite selector** - `65c7cbf` (feat)
2. **Task 2: Validation, save (create/update/reassign), and orange Save** - `a7fb1c1` (feat)

**Plan metadata:** _pending docs commit_ (docs: complete plan)

## Files Created/Modified

- `src/app/worker-form.tsx` - Rewritten worker add/edit form: ScrollView (handled taps, 16px gutters), 3 frozen-Contract FormFields (Name / Role / Phone phone-pad), active-only worksite radio rows, zero-sites guidance, exact error strings, single-accent full-width Save with muted disabled style

## Decisions Made

- Loading gate covers both modes (`useState(true)` initial): add mode also awaits `listWorksites()`, so the zero-worksites branch never flashes before sites resolve. (02-03 used `editId !== null` because add mode had no async load; here both modes load.)
- Legacy inactive `worksite_id` in edit mode leaves the selector unselected (no active row can match it), so the plan's verbatim `triedSubmit && !worksiteId` save gate enforces T-02-15 — saving requires picking an active site while DB history stays intact until save.
- Touch tracking stays in `onChangeText` (`setNameTouched(true)`) because the frozen FormField contract has no `onBlur` — same pattern as 02-03.
- `siteError` renders only when non-empty (FormField pattern), placed directly under the selector with `theme.destructive` + `Type.caption` + polite live region.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Worksite type import source**
- **Found during:** task 1 (Worker form fields)
- **Issue:** `Worksite` was imported from `@/db/worksites`, but that module only re-exports DAO functions — the row type lives in `@/db/types` (`tsc` error TS2459, "declares 'Worksite' locally, but it is not exported")
- **Fix:** Split import to `import type { Worksite } from '@/db/types'`
- **Files modified:** src/app/worker-form.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 65c7cbf (task 1 commit)

**2. [Rule 2 - Missing Critical] Legacy inactive worksite_id leaves selector unselected (T-02-15)**
- **Found during:** task 1 (edit-mode prefill)
- **Issue:** Plan says default selection is the current `worksite_id` in edit mode, and the threat register (T-02-15, disposition mitigate) requires that saving need an active site. Naively prefilling a soft-deleted `worksite_id` would show no selected row yet pass the `!worksiteId` save gate, persisting an assignment to an inactive site
- **Fix:** Prefill `worksiteId` with the worker's `worksite_id` only when it matches a DAO-loaded active site; otherwise initialize to `''` so no row is selected and the plan's verbatim save gate blocks with 'Choose a worksite' until an active site is picked
- **Files modified:** src/app/worker-form.tsx
- **Verification:** `tsc` exits 0; gate strings unchanged (`Choose a worksite` count still 1)
- **Committed in:** 65c7cbf (task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 threat-mitigation)
**Impact on plan:** Both required for correctness/security. No scope creep — no new files, no API changes, all grep gates pass as specified.

## Issues Encountered

- `tsc` TS2459 on the `Worksite` type import (see deviation 1) — resolved by importing from `@/db/types`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WK-01/WK-02 done: 02-06 (worksite delete + ConfirmDialog) and 02-07 (worker delete + phase gates) can build on the roster; worker-list filter (02-04) will reflect reassignments on focus via its existing refetch.
- On-device proof (form save + back-navigation on a dev build) remains Phase 9 verification debt, consistent with 02-01..02-04.

## Verification Gates (all pass)

- `npx tsc --noEmit` exits 0
- `listWorksites(` ≥ 1 (1), `Worker not found` = 1, `FormField` ≥ 3 (4)
- `Name is required` = 1, `Choose a worksite` = 1, `createWorker` ≥ 1 (2), `updateWorker` ≥ 1 (2), `theme.accent` = 1
- No `TouchableOpacity`, no hardcoded hex, no `fetch(`; phone field uses `phone-pad`; minimum type is `Type.caption` (13px)

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*

## Self-Check: PASSED

- `src/app/worker-form.tsx` exists; `.planning/phases/02-worksites-workers/02-05-SUMMARY.md` exists
- Commits `65c7cbf` and `a7fb1c1` present in `git log --all`
