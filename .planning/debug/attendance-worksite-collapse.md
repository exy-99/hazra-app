---
status: investigating
trigger: "in the attendence section when i click to add note the top coloms takes much more space , i want that when ever i scroll the worker list the worksite colomn should collaps and when i click to add note the worksite colomn should collaps too"
created: 2026-10-07T00:00:00Z
updated: 2026-10-07T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: "TBD - gather initial evidence"
test: "TBD"
expecting: "TBD"
next_action: "gather initial evidence"

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

(empty)

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: ""
fix: ""
verification: ""
files_changed: []
