---
phase: 03-attendance-marking
plan: 02
subsystem: attendance-status-pill
tags: [status-pill, attendance, tap-cycle, long-press, pressable]
requires: [01-01-status-contract, 01-02-theme-tokens, 03-01-selectedDate-state]
provides: [StatusPill-contract, attendance-local-marks-slice]
affects: [03-03-register-persistence, 03-05-filter-retention]
tech-stack:
  added: []
  patterns: [tap-cycle-no-modal, inline-picker-expansion, token-only-colors, Pressable-ripple-085]
key-files:
  created: [src/components/status-pill.tsx]
  modified: [src/app/(tabs)/attendance.tsx]
decisions:
  - "Picker is an inline wrapping-row expansion under the pill, not a Modal — keeps the fast path modal-free and avoids a second Modal alongside the date picker"
  - "Picker close is a text-only Close affordance (mutedForeground) plus implicit close on pick; close-without-pick changes nothing"
  - "Whole-row tap is not a cycle target in this slice — only the pill cycles, so the stub rows cannot double-advance"
metrics:
  duration: "~20 min"
  completed: 2026-10-07
---

# Phase 3 Plan 2: Attendance Row Pill Summary

Tap-to-cycle status pill with long-press direct picker and neutral unmarked rendering, wired to a local-only marks slice on stub rows in the Attendance tab; persistence wiring lands in 03-03.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | StatusPill component (cycle + long-press picker) | 2ac4f02 | src/components/status-pill.tsx |
| 2 | Attendance rows with local status state (visual slice) | 9c08100 | src/app/(tabs)/attendance.tsx |

## Must-Haves Verified

- Each active worker has one status pill cycling present → absent → half_day → off_day → present with no modal — `onCycle` advances `CYCLE[(idx+1)%4]` (`null → present` first); no `Modal` anywhere in the slice (grep-verified 0).
- Long-press opens a direct 4-status picker for corrections — `onLongPress` with `delayLongPress={400}` opens an inline wrapping row of 4 mini-pills (one per `CYCLE` entry, same tint/solid/text styling); press picks + closes.
- Unmarked workers show a neutral outline pill, never a status color — `null` renders `theme.surface` bg + `theme.border` border + `theme.mutedForeground` "Mark" label; status color flows only from `STATUS`.
- `npx tsc --noEmit` exits 0. `CYCLE` x2 (≥1), `onLongPress` x1 (≥1), hardcoded hex 0, `TouchableOpacity` 0 in status-pill.tsx; `StatusPill` x2 (≥2), `keyExtractor` x1 (≥1), `getAttendanceForDate` 0 in attendance.tsx.

## Decisions Made

- Picker is an inline wrapping-row expansion rendered under the main pill (not a `Modal`): keeps criterion #2 "no modal" literal on the primary path and avoids stacking a second Modal alongside the date pick-a-date modal from 03-01.
- Picker dismissal is a text-only "Close" affordance (`mutedForeground`, `accessibilityLabel="Close status picker"`) plus implicit close on pick; closing without picking changes nothing (T-03-06 accept path).
- StatusPill resolves `STATUS[status]` once into an `entry` (null for unmarked) so TypeScript narrowing holds and every color/label read flows through one null-checked path — no invented status strings can reach styling (T-03-04).
- Row container is a plain `View`, not a nested `Pressable`: only the pill is a cycle target, so a tap can never double-advance (relevant to roadmap criterion #3, fully enforced in 03-03 with the pending-ids guard).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Hardcoded `borderRadius: 12` in row style**
- **Found during:** task 2 (self-review before commit)
- **Issue:** Row card used a literal `12` instead of the token, violating the AGENTS.md token-only rule.
- **Fix:** Imported `Radius` and used `Radius.md` (same 12 value, token-sourced).
- **Files modified:** src/app/(tabs)/attendance.tsx
- **Commit:** 9c08100 (fixed before commit; single clean commit)

## Threat Flags

None — no new security surface beyond the plan's threat model. All three dispositions hold: `onPick` typed `AttendanceStatus` + cycle indexes `CYCLE` (T-03-04 mitigate); every pill carries its text label, unmarked labeled "Mark" (T-03-05 mitigate, DS-07); picker close-without-pick changes nothing (T-03-06 accept).

## Known Stubs

- `src/app/(tabs)/attendance.tsx` renders a LOCAL-ONLY stub roster (`Demo A/B/C`) with in-memory `marks` state — intentional per plan, replaced by real DAO data (`getAttendanceForDate`) in 03-03. Date switch resets stub marks via `handleSelectDate`.
- The `ThemedText` "Register loads in 03-03" placeholder from 03-01 was removed; the stub row list is the new placeholder.

## Next Phase Readiness

- `StatusPillProps` (`status`/`onCycle`/`onPick`) is frozen here; 03-03 passes DB-backed handlers with the same shapes (`upsertAttendance` writes, `CYCLE` order unchanged).
- `selectedDate` state name still frozen; `handleSelectDate` is the single date-change path 03-05 must preserve (adds `selectedSite` alongside, never resets `selectedDate` on filter change).
- Cycle math lives in the screen (`CYCLE[(idx+1)%4]`, `null → present`); 03-03 moves it behind the per-row pending guard without changing order.

## Self-Check: PASSED

- FOUND: src/components/status-pill.tsx
- FOUND: src/app/(tabs)/attendance.tsx
- FOUND: 2ac4f02, 9c08100 in git log
