---
phase: 03-attendance-marking
reviewed: 2026-10-07T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/components/date-strip.tsx
  - src/components/status-pill.tsx
  - src/components/note-field.tsx
  - src/app/(tabs)/attendance.tsx
status: issues_found
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
---

# Phase 03: Code Review Report

**Reviewed:** 2026-10-07T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the attendance-marking slice: `DateStrip`, `StatusPill`/`StatusPicker`,
`NoteField`, and the `AttendanceScreen` wiring them to the `attendance` DAO.
The frozen Phase 3 contracts are respected (`DateStripProps`,
`StatusPill`/`StatusPicker` props, `NoteField` collapsed/expanded pattern,
per-row `pendingIds` guard, `applyStatus` → `upsertAttendance` write-through
preserving `row.note`). No hardcoded hex colors in product components (status
colors come from the reserved `STATUS` contract), no `TouchableOpacity`, no
`toISOString` date handling (local date-key helpers used throughout), no
network/account code, and all DB values are parameterized. `load()`,
`applyStatus()`, and `saveNote()` all have `try/catch`, so the unhandled-rejection
defects from the Phase 02 review do not recur here.

Five warnings block a clean ship: a long-press on the status pill both cycles
the status *and* opens the picker (React Native fires `onPress` on release even
after `onLongPress`); a failed note save is swallowed so the editor closes as if
it succeeded; the worksite filter repeats the Phase 02 "All" key-collision bug;
date/filter changes reload with no loading indicator; and the long-press-only
picker is undiscoverable and unreachable via assistive tech. Four info items
(misleading empty-state copy, stale error banner, picker scroll position, and a
load-race edge) should be addressed alongside.

## Warnings

### WR-01: Long-press on StatusPill fires `onCycle` as well as `onOpenPicker`

**File:** `src/components/status-pill.tsx:28-42`
**Issue:** The pill sets both `onPress={onCycle}` and `onLongPress={onOpenPicker}`.
React Native does not cancel the press when a long-press is recognized —
`onPress` still fires on release after `onLongPress`. So a user who long-presses
to pick a status explicitly (e.g. unmarked → long-press → choose "Absent") first
writes an unintended `present` mark via `applyStatus`, then overwrites it with
their pick (extra write, extra re-render). Worse, if they long-press and then
dismiss the picker without choosing, the cycled status persists — a status change
the user never intended and may not notice.
**Fix:** Suppress the press when a long-press occurred, e.g. track it with a ref:
```tsx
const longFired = useRef(false);
// ...
onLongPress={() => { longFired.current = true; onOpenPicker(); }}
onPress={() => {
  if (longFired.current) { longFired.current = false; return; }
  onCycle();
}}
```
(reset the flag on picker close as well, so a stale `true` can never swallow a
later tap).

### WR-02: Failed note save closes the editor as if it succeeded

**File:** `src/components/note-field.tsx:32-62`, `src/app/(tabs)/attendance.tsx:260-291`
**Issue:** `saveNote` catches the `upsertAttendance` failure, sets the distant
list-top `saveError` banner, and returns normally — it never rethrows. `NoteField`
therefore cannot distinguish failure from success: `handleSave`/`handleClear`
proceed to `setExpanded(false)` and show the collapsed hint from the (unchanged)
`note` prop. The user tapped Save, the editor closed, and the only signal that
anything failed is a one-line banner at the top of the list, likely off-screen
below the scrolled rows. Failed writes read as successful writes.
**Fix:** rethrow after recording the banner so the editor stays open on failure:
```tsx
// attendance.tsx — saveNote catch block
} catch {
  setSaveError("Couldn't save — try again");
  throw new Error('save-note-failed');
}
```
`NoteField.handleSave` already keeps the editor open when `onSave` rejects
(`setExpanded(false)` is skipped) and resets `savingNote` in `finally`, so no
`NoteField` change is needed — just stop swallowing the error. (Also note the
inverse latency: `onPress={() => void handleSave()}` will surface an unhandled
rejection in dev once `onSave` can reject — attach `.catch(() => {})` or await
with try/catch at the call site since failure is now handled via the open editor
plus banner.)

### WR-03: Filter-chip `key` collides when a worksite is named "All"

**File:** `src/app/(tabs)/attendance.tsx:309-317`
**Issue:** `key={label === 'All' ? '__all__' : (chip.id as string)}` keys on the
display label instead of chip identity — the exact defect flagged as WR-01 in the
Phase 02 review (`workers.tsx`), repeated here. A worksite literally named "All"
gets key `'__all__'`, duplicating the "All" filter chip's key → React key
collision and incorrect reconciliation of the two chips (wrong selected state /
stale props on tap).
**Fix:** `key={chip.id ?? '__all__'}`.

### WR-04: Date/filter changes reload with no loading state

**File:** `src/app/(tabs)/attendance.tsx:172-189`
**Issue:** `load()` clears `loadError` but never sets `loading` to `true`
(`setLoading(true)` only happens in `retry()`). Tapping a new date in the strip
or switching the worksite chip re-runs the three-query `Promise.all` with stale
rows on screen and no indicator; on a slow device the list silently swaps
underneath, and a slow failure looks like the old date's data until the error
panel appears. Same pattern as Phase 02 WR-07, which evidently persists in this
screen.
**Fix:** `setLoading(true)` at the top of `load()` (or a separate `refreshing`
flag that dims the list / shows the existing `ActivityIndicator` while keeping
stale rows visible).

### WR-05: Status picker is only reachable by an undiscoverable long-press

**File:** `src/components/status-pill.tsx:28-42`
**Issue:** `StatusPicker` (direct pick of Absent / Half day / Off day) opens
exclusively via `onLongPress`. Nothing in the UI hints this: the pill's
`accessibilityLabel` is just the status label (or "Unmarked — tap to mark
present"), there is no `accessibilityHint`, and switch-control / voice-control
users have no long-press gesture to invoke it at all. Users who never discover
the gesture must cycle through up to three unwanted intermediate statuses —
each one a real `upsertAttendance` write — to reach the one they want.
**Fix:** add `accessibilityHint="Long press to choose a specific status"` to the
pill `Pressable`, and provide a tap-reachable path to the picker (e.g. a small
chevron affordance next to the pill, or open the picker on double-tap as well as
long-press) so assistive-tech users can reach it.

## Info

### IN-01: Empty-state copy describes the wrong condition

**File:** `src/app/(tabs)/attendance.tsx:368-385`
**Issue:** The `rows.length === 0` branch renders "No attendance marked for this
date". But rows come from a `LEFT JOIN` (`getAttendanceForDate`), so workers
with no mark still produce rows with `status: null` — `rows.length === 0` means
there are *no active workers in scope*, not that marking hasn't happened. Under
a site filter with zero workers the copy is actively misleading, and the "Add
worker" CTA is correct for the real condition but mismatched to the stated one.
(Precedent: Phase 02 IN-04 treated the analogous copy issue as Info.)
**Fix:** title conditional on the real condition, e.g. `selectedSite ? 'No
workers at this worksite' : 'No workers yet'`, keeping the "Add worker" action.

### IN-02: `saveError` banner survives date/filter changes

**File:** `src/app/(tabs)/attendance.tsx:140,172-204`
**Issue:** `saveError` is cleared only on the next successful write. Switching
dates or worksite filters (`handleSelectDate`, chip `onPress`, `load()`) leaves
a stale "Couldn't save — try again" banner visible against a different date's
data, implying the current view failed to save.
**Fix:** `setSaveError(null)` in `load()` (alongside the existing
`setLoadError(false)`) or in `handleSelectDate`.

### IN-03: Date-picker sheet does not scroll to the selected date

**File:** `src/components/date-strip.tsx:152-178`
**Issue:** The 30-item `FlatList` has no `initialScrollIndex` (and no
`getItemLayout` to support it), so it always opens scrolled to today. A user
correcting last week's attendance must manually scroll past ~3 weeks of rows to
reach the already-selected date.
**Fix:** add `getItemLayout` (rows are fixed `minHeight: 44`) and
`initialScrollIndex={pastDates.indexOf(selectedDate)}` with `onScrollToIndexFailed`
fallback.

### IN-04: Rapid date switches can resolve loads out of order

**File:** `src/app/(tabs)/attendance.tsx:172-195`
**Issue:** Each `load()` fires an independent three-query `Promise.all` with no
generation token or cancellation. Tapping dates A → B → A quickly can resolve in
any order; if B's queries finish last, the list shows B's rows under A's
selected strip (and `setSites`/`setCounts` likewise skew). Low impact in practice
(local SQLite is fast), but the wrong-date flash is observable on slow devices.
**Fix:** capture `const gen = selectedDate` (plus site) at the top of `load()`
and ignore results if `gen` no longer matches current selection, or serialize
through a monotonically increasing request id.

---

_Reviewed: 2026-10-07T00:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
