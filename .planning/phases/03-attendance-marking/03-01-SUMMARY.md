---
phase: 03-attendance-marking
plan: 01
subsystem: attendance-date-navigation
tags: [date-strip, attendance, expo-router, pressable, modal]
requires: [01-03-date-utils, 01-02-theme-tokens]
provides: [DateStrip-contract, attendance-selectedDate-state]
affects: [03-03-register-list, 03-05-filter-retention]
tech-stack:
  added: []
  patterns: [local-date-key-only, Pressable-ripple-085, radio-a11y-cells, token-only-colors]
key-files:
  created: [src/components/date-strip.tsx]
  modified: [src/app/(tabs)/attendance.tsx]
decisions:
  - "Strip backfills to 7 cells when clamping cuts future days off the recentered window"
  - "Modal scrim is a sibling absolute-fill Pressable so the sheet stays undimmed"
metrics:
  duration: "~15 min"
  completed: 2026-10-07
---

# Phase 3 Plan 1: Date Navigation Foundation Summary

Date-navigation foundation for the Attendance tab: reusable DateStrip (7-day strip + Today jump + 30-day pick-a-date modal) with selected-date state hosted in attendance.tsx; all date math via local-key helpers, future dates structurally unreachable.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | DateStrip component (7-day strip + Today + pick-a-date modal) | 6288a79 | src/components/date-strip.tsx |
| 2 | Host selectedDate in attendance.tsx | 34ef45a | src/app/(tabs)/attendance.tsx |

## Must-Haves Verified

- Manager can select any past or present date; each date shows its own independent register — `selectedDate` state owned by attendance.tsx, passed as opaque `YYYY-MM-DD` key (register wiring lands in 03-03/03-05).
- 7-day strip plus Today jump plus calendar affordance reaches dates beyond the strip — strip + text-only primary "Today" (disabled + muted at today) + `CalendarDays` "Pick a date" modal with 30 past-date rows.
- Future dates are not selectable — strip arrays derive from `todayKey()`/`addDays` with `key <= todayKey()` clamp; modal lists `addDays(today, -i)` only, so no future key exists to press (T-03-01).
- `npx tsc --noEmit` exits 0. `addDays` x4 (≥2), `toISOString` 0, `Today` x5 (≥1), `TouchableOpacity` 0, hardcoded hex 0 in both files.

## Decisions Made

- Strip recentering backfills to 7 cells: when clamping removes future days from the ±3 window around a recent past date, earlier days are prepended so the strip always renders 7 cells (plan's "renders 7 cells" done-criterion holds for any selection).
- Modal scrim is a sibling absolute-fill `Pressable` (theme.foreground at 0.5 opacity) rather than a wrapping backdrop, so the sheet itself stays undimmed; `onRequestClose` + scrim press both close.
- Weekday initial + day number both render via `formatDisplay(key, 'dd'/'D')` — no dayjs import, no `new Date(key)` arithmetic in the component.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `StyleSheet.absoluteFillObject` does not exist in RN types**
- **Found during:** task 1 (tsc failed with TS2551)
- **Fix:** spread `StyleSheet.absoluteFill` instead for the modal scrim style
- **Files modified:** src/components/date-strip.tsx
- **Commit:** 6288a79 (fixed before commit; single clean commit)

**2. [Rule 1 - Bug] Backdrop opacity dimmed the sheet along with the scrim**
- **Found during:** task 1 (review of first Modal draft — opacity on the wrapping backdrop Pressable would dim the picker sheet too)
- **Fix:** restructured to `View > (scrim Pressable + sheet View)` so only the scrim carries opacity
- **Files modified:** src/components/date-strip.tsx
- **Commit:** 6288a79 (fixed before commit; single clean commit)

## Threat Flags

None — no new security surface beyond the plan's threat model. All three mitigations are implemented: no future keys render (T-03-01), zero `toISOString` (T-03-02, grep-gated), fixed 30-row `FlatList` with `keyExtractor` (T-03-03).

## Known Stubs

- `src/app/(tabs)/attendance.tsx` renders `ThemedText` "Register loads in 03-03" — intentional placeholder per plan, removed in 03-03 when the register list wires to `selectedDate`. No data stub (no DAO calls in this plan by design).

## Next Phase Readiness

- `DateStripProps` (`selectedDate`/`onSelectDate`) is frozen; 03-05 reuses it as-is.
- `selectedDate` state name is frozen; 03-05 adds `selectedSite` alongside and must never reset it on filter change.
- Register list (03-03) consumes `selectedDate` via `getAttendanceForDate(date, { worksiteId })`.

## Self-Check: PASSED

- FOUND: src/components/date-strip.tsx
- FOUND: src/app/(tabs)/attendance.tsx
- FOUND: 6288a79, 34ef45a in git log
