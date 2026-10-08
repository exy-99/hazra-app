---
status: partial
phase: 02-worksites-workers
source: [02-VERIFICATION.md]
started: 2026-10-06T00:00:00Z
updated: 2026-10-06T00:00:00Z
---

## Current Test

[awaiting human testing — no dev build in this environment; deferred to Phase 9 per the Phase 1 01-08 deferral precedent]

## Tests

### 1. Roster build + restart persistence
expected: Both worksites and all workers restore with correct site assignments and counts (add 2 worksites and 5+ workers split across them, then restart the app)
result: [pending]

### 2. Worker remove flow
expected: Worker hidden from Workers tab and any picker, but its attendance history remains viewable
result: [pending]

### 3. Worksite remove with worker count
expected: Confirmation states the live active-worker count; confirming hides the site, workers and history are kept
result: [pending]

### 4. Drill-down push/back-header navigation
expected: router.push to /worksites, /worksite-form, /worker-form presents a screen with an always-visible back arrow; tab URLs unchanged
result: [pending]

### 5. Permanent delete of a removed worker
expected: Removed-profile "Delete permanently" (confirm-gated) deletes the worker row and all its attendance rows; profile no longer resolves and history is gone. Covered by commit 05b0d56; verify on-device in Phase 9
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
