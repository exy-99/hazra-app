---
status: partial
phase: 06-export
source: [06-VERIFICATION.md]
started: 2026-10-09
updated: 2026-10-09
---

## Current Test

[awaiting human testing — requires a development build; deferred to Phase 9 per verification report]

## Tests

### 1. Worker export opens correctly in Excel/Sheets
expected: Export a worker whose note contains `left early, told "back tomorrow"`; the CSV opens in Excel and Google Sheets with the correct column count (RFC-4180 probe)
result: [pending]

### 2. Worksite-month register lands in Downloads (CSV + PDF)
expected: Pick one active worksite + one past-or-current month; both `hazra-register-{siteslug}-{yyyymm}.csv` and `.pdf` appear in Downloads with lowercase slug names
result: [pending]

### 3. Second-device transfer + open (EX-03)
expected: Share an exported file to a second device; CSV parses correctly and PDF renders with legend row + summarize() footer
result: [pending]

### 4. Entry-point navigation preselects scope
expected: Profile Export action and reports/site-context deep-links open `/export` with scope preselected; tampered `?workerId=` / `?worksiteId=` render not-found and never reach SQL
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
