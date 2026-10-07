---
phase: 03-attendance-marking
plan: 04
subsystem: attendance-notes
tags: [attendance, notes, upsert, sqlite, inline-editor]
requires:
  - phase: 03-03-register-persistence
    provides: [DAO-backed-register, per-row-pending-guard, note-preserving-upsert]
provides:
  - Inline expandable NoteField (view → edit → save/clear)
  - Per-row note wiring through the same one-row UPSERT
  - Status↔note independence in both directions
affects: [03-05-worksite-filter]
tech-stack:
  added: []
  patterns: [inline-expandable-field, shared-pending-guard-note-writes, unmarked-defaults-present]
key-files:
  created: [src/components/note-field.tsx]
  modified: [src/app/(tabs)/attendance.tsx]
key-decisions:
  - "Row card becomes a column (topRow + NoteField) so the expanded editor stacks under name+pill"
  - "Note icon tint uses primary when a note exists, mutedForeground otherwise — no accent anywhere"
patterns-established:
  - "Inline expandable field: collapsed Pressable affordance + expanded editor with save/clear/cancel"
  - "Note saves reuse the per-row pendingIds guard; unmarked+note defaults status to present"
requirements-completed: [AT-03]
duration: ~20min
completed: 2026-10-07
---

# Phase 3 Plan 4: Per-Entry Notes Summary

**Inline expandable note editor per attendance row saving through the same one-row UPSERT, with status↔note independence and unmarked+note defaulting to present**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-07
- **Completed:** 2026-10-07
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- New `src/components/note-field.tsx` (`NoteField`): collapsed `StickyNote` icon + truncated preview (or "Add note" hint), expanded multiline `TextInput` with Save / Clear / Cancel; blank save stores `null`; zero `theme.accent`, `Pressable` only.
- Per-row wiring in `src/app/(tabs)/attendance.tsx`: `saveNote` reuses the 03-03 `pendingIds` guard, defaults unmarked→`present`, writes via `upsertAttendance`, map-updates the row in place, and reuses the same `saveError` banner.
- Status↔note independence verified structurally: both `upsertAttendance` call sites pass the full `(status, note)` pair — `applyStatus` preserves `row?.note ?? null`, `saveNote` preserves/creates status.

## Task Commits

Each task was committed atomically:

1. **Task 1: NoteField component** - `0445b10` (feat)
2. **Task 2: Per-row note wiring** - `1836c4b` (feat)

## Files Created/Modified

- `src/components/note-field.tsx` - Inline expandable note editor (view → edit → save/clear/cancel)
- `src/app/(tabs)/attendance.tsx` - Per-row `NoteField` wiring + `saveNote`; row card restructured to column layout

## Decisions Made

- Row card becomes a column (`topRow` name+pill + `NoteField` below) so the expanded 88px editor stacks under the name/pill line instead of squeezing beside it.
- Note icon tint is `theme.primary` when a note exists, `theme.mutedForeground` otherwise — preserves the one-orange rule (Save is text `primary`, Clear is text `destructive`, Cancel is muted).
- `applyStatus`'s `current` local renamed to `row` (no behavior change) so the note-preservation read is explicit at both write sites.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None — no new security surface beyond the plan's threat model. All three dispositions hold: note text binds as a `?` parameter in `upsertAttendance` with zero SQL in either file (T-03-11); both writers read-then-write the full `(status, note)` pair with explicit unmarked→present default (T-03-12); single-manager offline device, no sync (T-03-13).

## Known Stubs

None — notes are fully wired end-to-end (editor → upsert → SQLite → reload). Worksite filter is 03-05's scope.

## Next Phase Readiness

- 03-05 adds `selectedSite` alongside the frozen `selectedDate`/`handleSelectDate` path; note state rides the same rows and needs no changes.
- `pendingIds` is now shared by status and note writes; any future per-row affordance should reuse the same guard.

## Self-Check: PASSED

- FOUND: src/components/note-field.tsx
- FOUND: src/app/(tabs)/attendance.tsx
- FOUND: 0445b10, 1836c4b in git log

---
*Phase: 03-attendance-marking*
*Completed: 2026-10-07*
