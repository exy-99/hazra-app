---
phase: 02-worksites-workers
plan: 03
subsystem: ui
tags: [expo-router, worksites, form-field, validation, sqlite, empty-state]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: [worksite DAO (create/update/get, parameterized), shared EmptyState, drill-down worksite-form route]
  - phase: 02-worksites-workers
    provides: [(tabs) group + root Stack from 02-01, add/edit route contract (blank vs ?id=) from 02-02]
provides:
  - "Shared FormField labeled input with inline destructive error (frozen phase-wide contract)"
  - "Worksite add/edit form with 5-chip type picker, Name-required validation, orange Save"
  - "WORKSITE_TYPES frozen tuple exported from src/db/worksites.ts"
affects: [02-05 worker form (reuses FormField contract), 02-06 worksite delete]

# Tech tracking
tech-stack:
  added: []
  patterns: [frozen FormField prop contract shared across forms, focus-refetch for edit prefill, touched-or-submit validation gating]

key-files:
  created: [src/components/form-field.tsx]
  modified: [src/app/worksite-form.tsx, src/db/worksites.ts]

key-decisions:
  - "WORKSITE_TYPES lives in src/db/worksites.ts per the plan interface contract (added as Rule 3 deviation — the export did not exist)"
  - "nameTouched flips on first keystroke so the inline error also appears for touch-then-clear, without adding props to the frozen FormField contract"
  - "Edit prefill uses useFocusEffect (not just mount) so stale rows refresh when returning to the form"

patterns-established:
  - "Forms validate with (triedSubmit || fieldTouched) gating and the exact plan-specified error string, passed as FormField error"
  - "Tampered ?id= resolves via getWorksite and renders a no-action 'not found' EmptyState — the raw param never reaches SQL or UI text"

requirements-completed: [WS-01, WS-02]

# Metrics
duration: 25min
completed: 2026-10-06
---

# Phase 2 Plan 3: Worksite Form Summary

**Shared FormField input (label + controlled input + polite inline error) and the worksite add/edit form with a 5-chip type picker, exact-string Name validation, and a full-width orange Save**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-10-06T00:36:00Z
- **Completed:** 2026-10-06T01:01:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src/components/form-field.tsx` with the exact frozen prop contract (`label/value/onChangeText/placeholder/error/keyboardType/autoCapitalize`): `Type.label` foreground label, controlled `TextInput` (44px, `Spacing.three` padding, `Radius.md`, `theme.surface`, destructive-vs-border edge), and a `theme.destructive` `Type.caption` error with `accessibilityLiveRegion="polite"`
- Rewrote `src/app/worksite-form.tsx` from the 01-08 placeholder into a real add/edit form: `?id=` edit detection, `getWorksite` prefill on focus, `Building2` "Worksite not found" EmptyState (no action) on null, `Type`-labeled 5-chip `WORKSITE_TYPES` radio picker defaulting to Office, exact `'Name is required'` inline gating, blank address stored as `null`, single orange Save ("Add worksite" / "Save changes") ending in `router.back()`, all inside a `keyboardShouldPersistTaps="handled"` ScrollView with 16px gutters
- `npx tsc --noEmit` exits 0; all plan grep gates pass (`Name is required` = 1, create/update/get wired, `Worksite not found` = 1, `router.back()` = 1); no `TouchableOpacity`, no hardcoded hex, no `fetch(` in either file

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared FormField component (frozen phase-wide contract)** - `894196a` (feat)
2. **Task 2: Worksite add/edit form with type chips, validation, and orange Save** - `f8baccf` (feat)

## Files Created/Modified

- `src/components/form-field.tsx` - Shared labeled input with inline destructive error (created, Task 1)
- `src/app/worksite-form.tsx` - Worksite add/edit form: type chips, validation, orange Save (rewritten, Task 2)
- `src/db/worksites.ts` - Added the frozen `WORKSITE_TYPES` tuple export (Rule 3 deviation, committed with Task 2)

## Decisions Made

- `WORKSITE_TYPES` placed in `src/db/worksites.ts` exactly where the plan's `<interfaces>` contract declares it, so the worker form (02-05) and any later consumer import the tuple from the data layer rather than duplicating a literal in the screen.
- `nameTouched` is set on first `onChangeText` rather than via an `onBlur` prop: the frozen `FormField` contract has no `onBlur`, so touch tracking lives in the screen's change handler. The error still only appears when the field is empty, matching "touched-and-invalid".
- Edit loading uses the established `useFocusEffect(useCallback(...))` pattern (with a cancellation flag) instead of mount-only `useEffect`, so the prefill re-resolves if the user leaves and returns to the form; a themed `ActivityIndicator` covers the load and `notFound` renders the EmptyState.
- Threats T-02-07/T-02-08 mitigated by construction: `editId` flows only into parameterized `getWorksite`/`updateWorksite` and never into rendered text; `type` comes from the fixed tuple, never free text. T-02-09 accepted per plan (single-user offline app).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `WORKSITE_TYPES` export to `src/db/worksites.ts`**
- **Found during:** task 2 (worksite add/edit form)
- **Issue:** The plan's `<interfaces>` contract declares `WORKSITE_TYPES` in `src/db/worksites.ts` and Task 2 builds the chip picker on it, but no file in the repo defined it (`WORKSITE_TYPES` grep found zero matches) — the form could not honor the frozen 5-type tuple without it.
- **Fix:** Added `export const WORKSITE_TYPES = ['Office', 'Construction', 'School', 'Farm', 'Other'] as const;` to `src/db/worksites.ts` (one line, no DAO behavior change); the form imports the tuple instead of declaring a local copy.
- **Files modified:** src/db/worksites.ts
- **Verification:** `npx tsc --noEmit` exits 0; chip row renders all 5 options from the import.
- **Committed in:** f8baccf (part of the Task 2 atomic commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The addition fulfills the plan's own interface contract; no scope creep, no behavior change to existing DAO functions.

## Issues Encountered

- **Windows typed-routes watcher quirk recurred twice (environment, no source impact):** the background `expo start` process regenerated the gitignored `.expo/types/router.d.ts` during both task edits with the backslash-key corruption documented in 02-01/02-02, dropping `/` and breaking `tsc` on the pre-existing `href="/"` in `app-tabs.web.tsx`. Fix (same as 02-01/02-02): ran `regenerateDeclarations()` from `@expo/router-server/build/typed-routes` in node with `EXPO_ROUTER_APP_ROOT` pointed at the absolute `src/app` path (forward-slash context, same as server-start generation). `tsc` exits 0 after each regen. Expect to repeat on ANY source edit while the watcher runs.

## Known Stubs

None. All rendered data is live from SQLite; `useState('')` initials are controlled-input state (not UI stubs), and the Name `placeholder` is an intentional hint alongside the visible label per plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The frozen `FormField` contract is ready for 02-05 (worker form) to import — do not re-declare or extend its props.
- The `/worksite-form` add/edit contract from 02-02 is now honored: blank pushes create, `?id=` pushes prefill and update, tampered ids show "Worksite not found".
- On-device save/prefill proof still requires a development build (deferred to Phase 9 with the other device proofs).

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*

## Self-Check: PASSED

- FOUND: `src/components/form-field.tsx`
- FOUND: `src/app/worksite-form.tsx`
- FOUND: `894196a`, `f8baccf` in `git log`
- `npx tsc --noEmit` exits 0 (verified after each task, post-regen)
