---
phase: 03-attendance-marking
status: all_fixed
findings_in_scope: 5
fixed: 5
skipped: 0
iteration: 1
review_path: .planning/phases/03-attendance-marking/03-REVIEW.md
fixed_at: 2026-10-07T13:20:06Z
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-10-07T13:20:06Z
**Source review:** .planning/phases/03-attendance-marking/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (critical + warning): 5
- Fixed: 5
- Skipped (in scope): 0
- Info findings out of scope (not attempted): 4

All fixes verified with `npx tsc --noEmit` (exit 0) before each atomic commit.
Frozen Phase 3 contracts preserved (DateStripProps, StatusPillProps,
StatusPickerProps, NoteField collapsed/expanded pattern). Pressable only, no
hardcoded hex, no TouchableOpacity introduced.

## Fixed Issues

### WR-01: Long-press on StatusPill fires `onCycle` as well as `onOpenPicker`

**Status:** fixed
**Files modified:** `src/components/status-pill.tsx`
**Commit:** 5c70915 (`fix(03): WR-01 suppress StatusPill onCycle after long-press`)
**Applied fix:** Added a `longFired` ref in `StatusPill`. `onLongPress` sets the
flag and calls `onOpenPicker`; `onPress` consumes the flag (resets to `false`
and returns) instead of calling `onCycle` when a long-press just fired. Props
unchanged. Recommend manual UAT: long-press then dismiss picker — no status
change should persist.

### WR-02: Failed note save closes the editor as if it succeeded

**Status:** fixed
**Files modified:** `src/app/(tabs)/attendance.tsx`, `src/components/note-field.tsx`
**Commit:** 71b8c41 (`fix(03): WR-02 keep note editor open on failed save`)
**Applied fix:** `saveNote` in `attendance.tsx` now rethrows
(`throw new Error('save-note-failed')`) after setting the `saveError` banner,
so `NoteField.handleSave`/`handleClear` skip `setExpanded(false)` and the
editor stays open on failure. `NoteField` save/clear press handlers now attach
`.catch(() => {})` so the now-possible rejection does not surface as an
unhandled rejection in dev (failure is already signalled via the open editor
plus banner). Recommend manual UAT: force a save failure, confirm editor stays
open with draft intact.

### WR-03: Filter-chip `key` collides when a worksite is named "All"

**Status:** fixed
**Files modified:** `src/app/(tabs)/attendance.tsx`
**Commit:** 91faed1 (`fix(03): WR-03 key filter chips by id not label`)
**Applied fix:** Chip key changed from
`key={label === 'All' ? '__all__' : (chip.id as string)}` to
`key={chip.id ?? '__all__'}` so identity (not display label) keys the chips.
A worksite named "All" now keeps its own id key instead of colliding with the
"All" filter chip.

### WR-04: Date/filter changes reload with no loading state

**Status:** fixed
**Files modified:** `src/app/(tabs)/attendance.tsx`
**Commit:** 0e00904 (`fix(03): WR-04 show loading indicator on date-filter reload`)
**Applied fix:** Added `setLoading(true)` at the top of `load()` (alongside the
existing `setLoadError(false)`), so date-strip and worksite-filter changes show
the existing `ActivityIndicator` instead of silently swapping stale rows. The
redundant `setLoading(true)` in `retry()` is now harmless.

### WR-05: Status picker is only reachable by an undiscoverable long-press

**Status:** fixed
**Files modified:** `src/components/status-pill.tsx`
**Commit:** db33abe (`fix(03): WR-05 add tap-reachable status picker affordance`)
**Applied fix:** Added `accessibilityHint="Long press to choose a specific
status"` to the pill, plus a tap-reachable chevron `Pressable`
(`accessibilityLabel="Choose a specific status"`,
`accessibilityHint="Opens the list of statuses"`) calling the existing
`onOpenPicker` — reachable by tap, switch control, and voice control. Uses
`ChevronDown` from `lucide-react-native` with `theme.mutedForeground` (no
hardcoded colors) and token spacing (`Spacing.one`). Props unchanged.
Recommend manual UAT with screen reader / switch control.

## Skipped Issues (out of scope — Info, not attempted per fix_scope)

Fix scope for this run is critical + warning only. The following Info findings
were intentionally left untouched:

### IN-01: Empty-state copy describes the wrong condition

**Status:** skipped (out of scope)
**File:** `src/app/(tabs)/attendance.tsx:368-385`
**Reason:** Info severity, outside `critical_warning` fix scope.
**Original issue:** `rows.length === 0` copy says "No attendance marked for this
date" when the real condition is no active workers in scope.

### IN-02: `saveError` banner survives date/filter changes

**Status:** skipped (out of scope)
**File:** `src/app/(tabs)/attendance.tsx:140,172-204`
**Reason:** Info severity, outside `critical_warning` fix scope.
**Original issue:** Stale save-error banner persists across date/filter changes.

### IN-03: Date-picker sheet does not scroll to the selected date

**Status:** skipped (out of scope)
**File:** `src/components/date-strip.tsx:152-178`
**Reason:** Info severity, outside `critical_warning` fix scope.
**Original issue:** 30-item picker FlatList always opens scrolled to today.

### IN-04: Rapid date switches can resolve loads out of order

**Status:** skipped (out of scope)
**File:** `src/app/(tabs)/attendance.tsx:172-195`
**Reason:** Info severity, outside `critical_warning` fix scope.
**Original issue:** Concurrent `load()` calls have no generation token, so
late-resolving queries can show wrong-date rows.

---

_Note: isolated git worktree setup was not possible — `main` is already checked
out in the repo root, so `git worktree add` refused a second checkout of the
same branch. Fixes were applied directly in the repo root with a clean starting
tree and committed atomically; `git status` is clean apart from this uncommitted
report file (orchestrator commits the report)._

_Fixed: 2026-10-07T13:20:06Z_
_Fixer: OpenCode (gsd-code-fixer)_
_Iteration: 1_
