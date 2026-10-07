---
status: resolved
trigger: "in the attendence section when i click to add note the top coloms takes much more space , i want that when ever i scroll the worker list the worksite colomn should collaps and when i click to add note the worksite colomn should collaps too"
created: 2026-10-07T00:00:00Z
updated: 2026-10-07T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: "CONFIRMED (static): worksite chip ScrollView is statically rendered above the FlatList with no scroll or note-open awareness — it can only shrink, never hide."
test: "Code-structure analysis + fix applied; npx tsc --noEmit clean."
expecting: "Chips hide completely on scroll (y > 8) or while any note editor is open; status counts row always stays."
next_action: "HUMAN VERIFY on device — scroll list, open Add Note, confirm chips collapse and counts stay."

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: "When scrolling the worker list OR when Add Note is open, hide the worksite filter column completely, but keep showing the 'present / absent / half / unmarked' status row."
actual: "Top columns take much more space when Add Note is clicked; worksite column shrinks on scroll but does not hide completely."
errors: "None — purely visual/layout, no console errors."
reproduction: "Open Attendance tab (src/app/(tabs)/attendance.tsx) > scroll worker list > tap Add Note on a row. Also: scroll worker list without note open."
started: "Unknown — reported 2026-10-07, no regression info given."
platform: "Attendance tab (assumed Android, same as prior session)"
scope: "Attendance tab only."

## Eliminated
<!-- APPEND only - prevents re-investigating -->

(empty)

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-10-07T00:00:00Z
  checked: "attendance.tsx header structure (title + DateStrip + chip ScrollView + CountsHeader + FlatList)"
  found: "Worksite chip ScrollView is unconditionally rendered above the FlatList; FlatList has no onScroll handler; NoteField expanded state is internal per-row with no parent visibility. Nothing can ever hide the chips — scroll only shrinks them via layout pressure, Add Note expansion (88px input + footer) stacks on top of the full header."
  implication: "Root confirmed: no collapse mechanism exists for either trigger. Fix needs scroll awareness + lifted note-open state."

## Specialist Review

- specialist_hint: react/typescript — no matching skill available in this isolated context (typescript-expert not installed); fix follows existing codebase patterns (lifted state via callback, conditional render, threshold-guarded setState), review skipped.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "Worksite filter chip ScrollView was statically rendered above the worker FlatList with no scroll or note-editor awareness, so it could never hide — scrolling only shrank it and opening Add Note stacked the editor on top of the full header."
fix: "attendance.tsx: chips conditionally render only when NOT scrolled (FlatList onScroll, y > 8 threshold-guarded) AND no note editor open (noteOpenIds set lifted via NoteField onExpandChange callback through AttendanceRow); CountsHeader status row always stays visible. note-field.tsx: added onExpandChange prop fired on expand/cancel/save/clear."
verification: "npx tsc --noEmit clean (exit 0). On-device visual confirmation PENDING by human."
files_changed: ["src/app/(tabs)/attendance.tsx", "src/components/note-field.tsx"]
