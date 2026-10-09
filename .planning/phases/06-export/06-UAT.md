---
status: complete
phase: 06-export
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-10-09T15:00:00Z
updated: 2026-10-09T15:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Export screen scope pickers
expected: Open /export directly. A scope switcher shows Worker and Worksite month. Worker scope lists active workers; Worksite scope lists one active worksite picker plus a month trigger. CSV/PDF chips default to CSV.
result: pass

### 2. Worker preview from same dataset
expected: Pick one worker with history. A preview card shows a row-count line plus up to 5 sample rows in history language. The counts match that worker's profile history for the same period.
result: pass

### 3. Worker CSV export success card
expected: With a worker picked, tap the single orange Export CTA once. Exactly one file saves, then a success card shows Saved to Downloads plus a hazra-worker-{slug}-{yyyymmdd}.csv filename, a Share file action, and an Export another action that keeps your picks.
result: issue
reported: "it saves the file but share button does not work and , it does not show sucess or failed on the screen . export another works too . and the export csv works but with issues"
severity: major

### 4. Worksite-month picker and PDF preview
expected: Switch to Worksite month scope. Pick one active worksite, tap the month trigger to open a descending month grid capped at the current month, pick a past-or-current month. Preview shows the register row count plus up to 5 date-ordered samples; PDF preview includes a 4-status legend and a % footer line.
result: issue
reported: "% footer line does not apper other than that everything works asked above"
severity: major

### 5. Register CSV and PDF land in Downloads
expected: Export the same worksite+month once as CSV and once as PDF. Both files appear in Downloads named hazra-register-{siteslug}-{yyyymm}.csv and .pdf (lowercase slugs). PDF opens with legend row plus summary footer; CSV opens with header date,worker,status,note.
result: issue
reported: "the pdf does not get exported(i dont get any pdf file ) and gives try againg error , and still does not work after trying again . the csv file gets exported but it does not contain the attendence of a worksite or individual , the naming works fine and correctly"
severity: blocker

### 6. Entry-point deep-links preselect scope
expected: From a worker profile tap Export below Edit (visible even for removed workers, Edit hidden when removed) — lands on /export with that worker preselected. From Reports, per-worker Export and the site-context Export monthly register button land preselected with worksite+current month. A tampered ?workerId=bogus or ?worksiteId=bogus renders not-found and never crashes.
result: pass

### 7. Zero-rows, failure, and double-tap discipline
expected: Pick a worker or site+month with zero attendance — the Export CTA is disabled with a calm No attendance to export yet line. Double-tapping Export quickly still produces exactly one file. If export fails, a Couldn't export — try again message appears with a retry, and no partial file is left behind.
result: pass

## Summary

total: 7
passed: 4
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "With a worker picked, tap the single orange Export CTA once. Exactly one file saves, then a success card shows Saved to Downloads plus a hazra-worker-{slug}-{yyyymmdd}.csv filename, a Share file action, and an Export another action that keeps your picks."
  status: failed
  reason: "User reported: it saves the file but share button does not work and , it does not show sucess or failed on the screen . export another works too . and the export csv works but with issues"
  severity: major
  test: 3
  artifacts: []
  missing: []
- truth: "Switch to Worksite month scope. Pick one active worksite, tap the month trigger to open a descending month grid capped at the current month, pick a past-or-current month. Preview shows the register row count plus up to 5 date-ordered samples; PDF preview includes a 4-status legend and a % footer line."
  status: failed
  reason: "User reported: % footer line does not apper other than that everything works asked above"
  severity: major
  test: 4
  artifacts: []
  missing: []
- truth: "Export the same worksite+month once as CSV and once as PDF. Both files appear in Downloads named hazra-register-{siteslug}-{yyyymm}.csv and .pdf (lowercase slugs). PDF opens with legend row plus summary footer; CSV opens with header date,worker,status,note."
  status: failed
  reason: "User reported: the pdf does not get exported(i dont get any pdf file ) and gives try againg error , and still does not work after trying again . the csv file gets exported but it does not contain the attendence of a worksite or individual , the naming works fine and correctly"
  severity: blocker
  test: 5
  artifacts: []
  missing: []
