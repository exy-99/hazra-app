---
phase: 03-attendance-marking
plan: 05
subsystem: attendance-filter-counts
tags: [attendance, worksite-filter, daily-counts, retention, phase-gates]
requires:
  - phase: 03-03-register-persistence
    provides: [DAO-backed-register, per-row-pending-guard, note-preserving-upsert]
  - phase: 03-04-notes
    provides: [inline-note-editor, status-note-independence]
  - phase: 02-04-worker-list
    provides: [chip-row-pattern, active-only-discipline]
provides:
  - Worksite filter chips with date+status retention
  - Daily counts header scoped identically to visible rows
  - Phase 3 quality gates (hex/network/delete/touch/tsc)
affects: [04-worker-profile]
tech-stack:
  added: []
  patterns: [sibling-filter-state, single-load-rows-plus-counts, zero-sites-setup-empty-state]
key-files:
  created: []
  modified: [src/app/(tabs)/attendance.tsx]
key-decisions:
  - "Zero-sites empty state reuses the exact Worksites 7.5 copy rather than the Attendance line"
  - "Counts header renders only in the non-empty branch so it can never dangle over an empty list"
patterns-established:
  - "Sibling filter state: selectedSite alongside selectedDate, chip press touches only its own setter"
  - "Rows + counts share one load() with identical (date, worksiteId) scope"
requirements-completed: [AT-01, AT-02, AT-03, AT-04, AT-05, NF-04]
duration: ~30min
completed: 2026-10-07
---

# Phase 3 Plan 5: Worksite Filter + Daily Counts Summary

**Worksite filter chips with full date+status retention and a 5-stat daily counts header sharing the rows' exact query scope, plus the Phase 3 phase-wide quality gates**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-10-07
- **Completed:** 2026-10-07
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Worksite filter chips (`All` + active sites) in a horizontal `ScrollView` under the `DateStrip`, mirroring the 02-04 worker-list pattern (`__all__` key, `radio` role, pill/44px/selected-`primary` styling). Chip press calls only `setSelectedSite`; `selectedDate` and all saved marks survive every filter switch.
- `load()` is a single refresh path: `Promise.all([listWorksites(), getAttendanceForDate(date, scope), getDailyCounts(date, scope)])` with identical `(date, worksiteId)` scope, refetched on focus via `useFocusEffect(..., [selectedDate, selectedSite])`.
- `CountsHeader`: single row of 5 mini-stats (Present / Absent / Half / Off / Unmarked), each with an 8px status-color dot (muted dot for Unmarked), `tabular-nums` value, and a per-stat `accessibilityLabel` ("3 present" etc.).
- Loading keeps `DateStrip` + chips mounted with the `ActivityIndicator` only in the list region (no blank flash, no layout jump).
- Zero-sites edge renders the exact design.md §7.5 Worksites line "No worksites yet" with an "Add worksite" action → `/worksite-form`; non-empty-sites roster keeps the 03-03 "No attendance marked for this date" + "Add worker" state.

## Task Commits

Each task was committed atomically:

1. **Task 1: Worksite filter chips with date+status retention** - `0b45634` (feat)
2. **Task 2: Daily counts header + empty/loading polish + phase gates** - `73f6158` (feat)

## Files Created/Modified

- `src/app/(tabs)/attendance.tsx` - `selectedSite`/`sites` state, chips row, scoped `load()` (rows + counts), `CountsHeader`, split empty states; no new files per plan output spec.

## Decisions Made

- Zero-sites empty state reuses the exact Worksites §7.5 copy ("No worksites yet" + "Add worksite" → `/worksite-form`) instead of the Attendance line: with zero worksites the roster is structurally empty and "Add worker" would dead-end at the worker-form zero-sites guard, so the only useful action is worksite setup (plan delegated exact copy to the executor; both strings are verbatim §7.5).
- `CountsHeader` renders only inside the non-empty `listWrap` branch (never over an empty list or error state), directly satisfying T-03-17.
- Stat labels use the plan-sanctioned short forms (Half / Off) with full words in `accessibilityLabel`s; value uses `Type.caption` + 700 weight + `tabular-nums`.

## Deviations from Plan

None - plan executed exactly as written. (The §7.5 empty-copy choice for the zero-sites edge was explicitly delegated to the executor and is recorded above as a decision, not a deviation.)

## Phase-Wide Gate Outputs (recorded per Task 2)

- `npx tsc --noEmit` → exit 0
- `getDailyCounts` hits: 2 (≥1) · `Unmarked` hits: 1 (≥1) · `listWorksites` hits: 2 (≥1)
- `setSelectedDate` hits: 2 (≤3 — declaration + `handleSelectDate` only; chips never touch it)
- `setSelectedSite` hits: 2 (declaration + chip `onPress` only; date path never touches it)
- `TouchableOpacity`: 0 · `fetch(`: 0 · `DELETE`: 0 · `includeInactive`: 0 · hardcoded hex: none

## Threat Flags

None — no new security surface beyond the plan's threat model. All four dispositions hold: retention is structural (sibling state, verified 2/2 setter hits with no cross-reset path, T-03-14); filtering is server-side via the bound `w.worksite_id = ?` param, never client-side hiding (T-03-15); rows + counts share one `load()` with identical scope, no independent count state (T-03-16); zero-sites renders a setup-driving empty state with no dangling counts header (T-03-17).

## Known Stubs

None — filter, counts, and both empty states are fully wired end-to-end (DAO → state → UI). No placeholder copy, no mock data, no TODOs in the modified file.

## Requirement Trace (AT-01..05 + NF-04 across 03-01..03-05, zero orphans)

- AT-01 (status pill per worker) — 03-02 visual slice, 03-03 DB wiring, 03-05 unchanged
- AT-02 (date selection, independent registers) — 03-01 DateStrip + `selectedDate`, 03-05 retention verified
- AT-03 (optional note per entry) — 03-04 NoteField, 03-05 untouched (notes ride the same rows)
- AT-04 (edit in place via upsert) — 03-03 `applyStatus`, preserved in 03-05
- AT-05 (exactly one row per worker+date) — 03-03 upsert + pending guard, preserved in 03-05
- NF-04 (zero-training fast: one tap, no modal) — 03-02 tap-cycle primary path, 03-05 chips/counts add no taps to the mark loop

## Next Phase Readiness

- Phase 3 register is complete (03-01..03-05): date strip, pill, persistence, notes, filter, counts.
- Phase 4 (worker profile/history) can reuse `getAttendanceForWorker` + `getDailyCounts` patterns; the attendance screen needs no further changes.

## Self-Check: PASSED

- FOUND: src/app/(tabs)/attendance.tsx
- FOUND: 0b45634, 73f6158 in git log
