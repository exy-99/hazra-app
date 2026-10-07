---
phase: 03-attendance-marking
plan: 03
subsystem: attendance-register-persistence
tags: [attendance, upsert, sqlite, double-tap-guard, register]
requires: [01-06-attendance-dao, 03-01-selectedDate-state, 03-02-StatusPill-contract]
provides: [DAO-backed-register, per-row-pending-guard, note-preserving-upsert]
affects: [03-04-notes, 03-05-worksite-filter]
tech-stack:
  added: []
  patterns: [DAO-backed-register, per-row-pending-set, polite-save-error-banner, focus-refetch-per-date]
key-files:
  created: []
  modified: [src/app/(tabs)/attendance.tsx]
decisions:
  - "Empty-roster copy uses exact design.md 7.5 attendance line with an Add-worker action routing to /worker-form"
  - "Rows update in place after await resolves, never a full reload on write"
  - "Pending feedback is a wrapper-View opacity, StatusPill props stay frozen"
metrics:
  duration: "~25 min"
  completed: 2026-10-07
---

# Phase 3 Plan 3: DAO-Backed Attendance Register Summary

Attendance tab loads its per-date register from SQLite and persists every tap through the single-statement upsert, with a per-row pending guard so a rapid double-tap advances exactly one step and yields exactly one row.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | DAO-backed register load + upsert writes with note preservation | c99d797 | src/app/(tabs)/attendance.tsx |
| 2 | Per-row pending guard (double-tap = one step, one row) | 6772098 | src/app/(tabs)/attendance.tsx |

## Must-Haves Verified

- Editing a previously recorded entry updates it in place — `onCycle`/`onPick` both route through `applyStatus` → `upsertAttendance` (`ON CONFLICT(worker_id,date)` in the DAO), then map-update the single row; date revisit reloads via `getAttendanceForDate(selectedDate)`.
- Exactly one row per (worker, date) under rapid double-tap — DB unique constraint plus `pendingIds` early-return; second tap of a double-press is dropped before any write.
- Statuses persist across restart — all writes go to SQLite via the DAO; no in-memory `marks` state remains (03-02 stub roster + `STUB_WORKERS` removed).
- `npx tsc --noEmit` exits 0. `upsertAttendance` x2 (≥2), `getAttendanceForDate` x2 (≥1), `DELETE` 0, `includeInactive` 0, `pendingIds` x3 (≥3), `Couldn't save` x1 (≥1), `ON CONFLICT` 0 in the screen.

## Decisions Made

- Empty-roster copy (plan left the exact §7.5 line to executor discretion): used the exact Attendance line **"No attendance marked for this date"** with action **"Add worker"** → `/worker-form`. Rationale: with zero active workers the §7.5 "Mark today" action would be a dead affordance (nothing to mark); the only useful action is adding workers. Title stays the screen's own §7.5 copy, not the Workers-screen line (no worksite filter exists yet — that lands in 03-05).
- Rows update in place after `await` resolves (state map-update, no full reload on write) so rapid marking stays fast; the failed tap is never applied, so retry is a re-tap (per plan interfaces + task 2 spec).
- Pending feedback is a wrapper `View` with `opacity: 0.6` around the pill — `StatusPillProps` stays frozen (no new props), and the drop happens at the handler level (`pendingIds.has` early-return), not just visually.
- `handleSelectDate` keeps its single-path role (sets `selectedDate` only); the `useFocusEffect(..., [selectedDate])` refetch does the reload, preserving the 03-05 contract.

## Deviations from Plan

None - plan executed exactly as written. (The §7.5 empty-copy choice was explicitly delegated to the executor in Task 1 and is recorded above as a decision, not a deviation.)

## Threat Flags

None — no new security surface beyond the plan's threat model. All four dispositions hold: writes funnel through `upsertAttendance` with `?`-bound params, zero raw SQL in the screen (T-03-07/T-03-08); write failure sets a polite banner only with rows staying interactive and `finally` always clearing pending (T-03-09); active-only filtering stays server-side in the DAO, screen passes no `includeInactive` (T-03-10).

## Known Stubs

None — the 03-02 stub roster (`STUB_WORKERS` + in-memory `marks`) was fully removed. Notes UI is 03-04's scope: status writes preserve the loaded `note` (`row.note ?? null`, never `undefined`), and clearing/saving notes is not yet wired.

## Next Phase Readiness

- `note` preservation path is in place for 03-04 (every write carries `note: row.note ?? null`); 03-04 adds note editing without touching the status cycle math.
- `handleSelectDate` remains the single date-change path; 03-05 adds `selectedSite` alongside and passes `{ worksiteId }` to the existing `getAttendanceForDate` call, never resetting `selectedDate`.
- Per-row `pendingIds` pattern is available for any 03-04 note-save affordance that needs re-entry safety.

## Self-Check: PASSED

- FOUND: src/app/(tabs)/attendance.tsx
- FOUND: c99d797, 6772098 in git log
