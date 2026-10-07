---
status: testing
phase: 03-attendance-marking
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-10-07T13:58:00+05:30
updated: 2026-10-07T13:58:00+05:30
---

## Current Test

number: 1
name: Date strip selects independent daily registers
expected: |
  Attendance tab shows a 7-day strip. Tapping a past date loads that date's own register — marks made on one date do not appear on another date.
awaiting: user response

## Tests

### 1. Date strip selects independent daily registers
expected: Attendance tab shows a 7-day strip. Tapping a past date loads that date's own register — marks made on one date do not appear on another date.
result: [pending]

### 2. Today jump returns to current date
expected: Tapping the "Today" affordance jumps the strip and register back to today's date. At today, Today appears disabled/muted.
result: [pending]

### 3. Pick-a-date reaches older dates, no future dates
expected: "Pick a date" opens a sheet listing the past 30 days. Tapping a row jumps to that date. No future date appears anywhere (strip or sheet). Sheet closes via scrim tap or system back.
result: [pending]

### 4. Tap pill cycles status with no modal
expected: Each worker row has one status pill. Tapping it cycles present → absent → half_day → off_day → present with no popup/modal. First tap on an unmarked worker marks present.
result: [pending]

### 5. Long-press opens direct 4-status picker
expected: Long-pressing a pill (≈400ms) opens an inline 4-option picker (one per status). Tapping an option applies it and closes the picker. Closing without picking changes nothing.
result: [pending]

### 6. Unmarked workers show neutral pill
expected: Workers with no entry for the date show a neutral outline pill labeled "Mark" — never a status color. Status color appears only after marking.
result: [pending]

### 7. Edits update in place and survive restart
expected: Changing an already-marked entry updates it in place (no duplicate row). Close and reopen the app (or revisit the date) — all marks for the date are still there.
result: [pending]

### 8. Rapid double-tap advances exactly one step
expected: Double-tapping a pill quickly advances only one step in the cycle and never creates a duplicate row for the worker+date.
result: [pending]

### 9. Per-entry notes add, edit, and clear
expected: Each row has a note affordance ("Add note" hint or truncated preview with note icon). Tapping expands an editor with Save / Clear / Cancel. Saving stores the text, Clear removes it, Cancel discards changes. Blank save clears the note.
result: [pending]

### 10. Status and note are independent
expected: Changing status keeps the existing note; saving/clearing a note keeps the existing status. Adding a note to an unmarked worker defaults its status to present.
result: [pending]

### 11. Worksite filter chips retain date and marks
expected: A horizontal chip row under the date strip shows All + each active worksite. Switching chips filters the roster; switching back restores everything. Selected date and all saved marks survive every filter switch.
result: [pending]

### 12. Daily counts header matches visible rows
expected: Above the list, a single row shows 5 stats: Present / Absent / Half / Off / Unmarked with counts matching the currently visible (date + filter) rows. Counts update immediately after marking.
result: [pending]

### 13. Empty states guide next action
expected: With workers but no marks for the date: "No attendance marked for this date" with an "Add worker" action. With zero worksites: "No worksites yet" with an "Add worksite" action and no dangling counts header.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps

[none yet]
