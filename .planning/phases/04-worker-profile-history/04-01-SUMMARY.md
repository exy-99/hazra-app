---
phase: 04-worker-profile-history
plan: 01
subsystem: attendance-math
tags: [attendance, summarize, percentage, PR-02]
requires:
  - phase: 03-attendance-marking
    provides: [getAttendanceForWorker-period-queries, date-key-helpers]
provides:
  - Pure summarize() with PRD §9 denominator rule
  - Runtime hand-check incl. the roadmap 76.79 vector
  - ATTENDANCE_PCT_FLOOR 75 for 04-02 accent rule
affects: [04-worker-profile-shell, 05-reports]
tech-stack:
  added: []
  patterns: [pure-summary-over-DAO-rows, node-type-strip-self-check]
key-files:
  created: [src/utils/attendance.ts, scripts/verify-summarize.mjs]
  modified: []
key-decisions:
  - "summarize() is pure over caller-supplied entries (zero @/db imports) so Phase 5 reports import it without DAO coupling"
  - "Percentage rounds to 2 decimals via Math.round(x*100)/100 so the hand-check reads exactly 76.79"
requirements-completed: [PR-02]
duration: ~10min
completed: 2026-10-08
---

# Phase 4 Plan 1: summarize() + Hand-Check Summary

**Frozen attendance-% math (off_day excluded, half_day = 0.5) with a runtime proof of the roadmap 76.79 vector**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-08
- **Completed:** 2026-10-08
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- `src/utils/attendance.ts`: pure `summarize()` counting the four statuses, `denominator = present + absent + half_day` (off_day excluded per PRD §9), `percentage = null` on zero denominator (per D-04, callers render "—"), round-2 decimals, plus `ATTENDANCE_PCT_FLOOR = 75` for 04-02's accent rule (per D-09).
- `scripts/verify-summarize.mjs`: node `assert/strict` hand-check via direct type-stripped import (dates precedent) — roadmap vector (20/5/3/2 → denominator 28, exactly 76.79), empty + off_day-only → null, single half_day → 50%, 1 present + 1 off_day → denominator 1 / 100%, floor === 75. Prints `summarize ok`.

## Task Commits

Each task was committed atomically:

1. **Task 1: create summarize() contract** - `1bd8018` (feat)
2. **Task 2: runtime hand-check script** - `c5c2a5c` (feat)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` exits 0.
- `node scripts/verify-summarize.mjs` prints `summarize ok` (Node MODULE_TYPELESS_PACKAGE_JSON warning only — same type-strip behavior as the dates precedent, no build step).

## Self-Check: PASSED

- FOUND: src/utils/attendance.ts (exports `summarize`, `ATTENDANCE_PCT_FLOOR`, `AttendanceSummary`)
- FOUND: scripts/verify-summarize.mjs
- FOUND: 1bd8018, c5c2a5c in git log

## Next Phase Readiness

- 04-02 consumes `summarize()` + `ATTENDANCE_PCT_FLOOR` for the profile ring/stats; period bounds stay the caller's job via `getAttendanceForWorker({ from, to })` + `lastNDays`-style windows (per D-03). No blockers.
