# Phase 3 — Attendance Marking (CONTEXT)

**Date:** 2026-10-06
**Source:** `/gsd-discuss-phase 3` answers + ROADMAP Phase 3 + plan-phase gate inputs

This file unblocks `/gsd-plan-phase 3`. The `gsd-planner` run stopped at two gates
(no `03-CONTEXT.md`, no `UI-SPEC.md`). No `UI-SPEC.md` exists for any prior phase
either (Phase 1/2 planned + executed without one), so planning proceeds with this
CONTEXT as the design input, following the Phase 1/2 direct-write precedent
recorded in STATE.md.

## Decisions (user-answered 2026-10-06)

1. **Status change UX — Tap + long-press picker.**
   Roadmap criterion #2 (tap cycles present → absent → half_day → off_day → present,
   no modal) is the primary path. Long-press opens a direct status picker (4 options)
   for corrections. Both paths write through the same `upsertAttendance` call.
2. **Date strip — 7-day strip + calendar.**
   7-day scrollable strip centered/ending on selected date + "Today" jump button +
   calendar-icon affordance for any past/present date (no future dates — AT-02 is
   past-or-present). Date keys are local `YYYY-MM-DD` via `src/utils/dates.ts`
   (`todayKey`, `addDays`, `toDateKey`, `formatDisplay`); never `toISOString`.
3. **Notes — inline expandable field.**
   Tap note icon in the row expands an inline `TextInput` in place (no bottom sheet).
   Save via `upsertAttendance` preserving status; clearing stores `null` (never `''`).
   Status change must preserve the existing note.
4. **Filter + date retention — retain both.**
   Switching the worksite filter keeps `selectedDate` AND all marked statuses.
   Implementation: date + filter are independent state; refetch via
   `getAttendanceForDate(date, { worksiteId })` on either change; no state reset
   on filter change.

## Carry-over patterns (must copy)

- `loadError` → `"Couldn't load …"` EmptyState + "Try again" retry, `void load()`
  discipline (commit 4088df4, CR-01).
- `saving` re-entry guard + try/catch `"Couldn't save — try again"` (commit 4088df4, CR-02).
  For attendance: per-row `pendingWorkerIds` set guards double-tap (criterion #3).
- `useFocusEffect(useCallback(...))` refetch on focus (plans 02-02/02-04).
- One orange action per screen; status colors ONLY for status (DS-01/DS-03).
- `FlatList` + `keyExtractor` + `memo` rows; `Pressable` only; 44px targets, 16px gutters.
- Active-only lists (`is_active = 1` via DAO); tampered ids never reach SQL.

## Scope (AT-01..05, NF-04)

- AT-01: pill per worker (present/absent/half_day/off_day), unmarked = neutral outline.
- AT-02: any past/present date selectable; independent register per date.
- AT-03: optional note per entry (see above).
- AT-04: edit in place (cycle/picker/note all overwrite via upsert).
- AT-05: exactly one row per (worker, date) — single-statement UPSERT, double-tap safe.
- NF-04: zero-training fast UI — one tap per worker, no modal on primary path.
