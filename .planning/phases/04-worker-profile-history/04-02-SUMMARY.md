---
phase: 04-worker-profile-history
plan: 02
subsystem: ui
tags: [expo-router, react-native-svg, profile, attendance-ring, skeleton]

# Dependency graph
requires:
  - phase: 04-worker-profile-history
    provides: 04-01 summarize() + ATTENDANCE_PCT_FLOOR contract in src/utils/attendance.ts
provides:
  - SVG AttendanceRing component (react-native-svg, accent below 75, em-dash on null)
  - Worker profile screen core (header, 7/30/90 chips, ring + 4 counts, Edit, skeleton/retry/not-found/removed states)
affects: [04-worker-profile-history plan 03 (history list), reports-consumers-of-summarize]

# Tech tracking
tech-stack:
  added: []
  patterns: [period-chip-radio-row, skeleton-blocks-instead-of-spinner, removed-banner-readonly-record]

key-files:
  created: [src/components/attendance-ring.tsx]
  modified: [src/app/worker/[id].tsx]

key-decisions:
  - "Removed banner copy is the single word Removed (muted bg, destructive text)"
  - "Stats-region empty state reuses the exact 7.5 Worker-history line with Users icon, no action"
  - "First-load skeleton keeps chips mounted and adds a name-line block above ring/counts skeletons"

patterns-established:
  - "Period chips: 7/30/90 radio Pressables, 44px pill, selected-primary, keys period-{n}"
  - "Profile load(): catch-all inside, void callers, focus refetch on [id, period]"
  - "Removed record: muted banner + full stats visible, Edit hidden, no other actions"

requirements-completed: [PR-02]

# Metrics
duration: 20min
completed: 2026-10-08
---

# Phase 4 Plan 2: Profile Screen Core Summary

**Worker profile with SVG attendance ring + 4 counts over 7/30/90-day periods, tap-to-call header, single orange Edit, and skeleton/retry/not-found/Removed states**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-08T04:00:00Z
- **Completed:** 2026-10-08T04:20:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- SVG ring rendering `%` or `—` with accent-only signal below the 75 floor and an a11y label (never color alone)
- Profile screen replacing the placeholder: header (name, `role · site`, tap-to-call phone), period chips, ring + 4 STATUS-dot counts, single orange Edit below stats
- Period chips (7/30/90, default 30) refetch ring + counts together via one `load()` on `[id, period]` focus scope
- Trust states: skeleton blocks while loading (header + chips stay mounted), retry on load failure, no-action not-found on tampered id, Removed banner + full record with Edit hidden
- All five phase gates pass on both files (hex/TOUCH/UTC/DELETE/network all 0); `tsc` exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: attendance ring component** - `65508b6` (feat)
2. **Task 2: profile screen — load, header, chips, ring, stats, actions, states** - `d3211c5` (feat)
3. **Task 3: phase gates for new files** - verification-only, zero hits, no diff (no commit)

## Files Created/Modified

- `src/components/attendance-ring.tsx` - SVG ring (react-native-svg track + dasharray progress), center `%`/`—` label in tabular-nums, a11y percentage label
- `src/app/worker/[id].tsx` - Rewritten profile: `getWorker` + display-only site Map + period-scoped `getAttendanceForWorker` + `summarize()`, chips/ring/counts/Edit/skeleton/retry/not-found/removed

## Decisions Made

- Removed banner copy is the single word "Removed" (muted bg, destructive text, `accessibilityLabel="Removed worker"`) — plan delegated exact copy to the executor; one word matches the frozen-record tone and cannot be mistaken for a STATUS fill.
- Stats-region empty state (zero countable days) reuses the exact §7.5 Worker-history line "No attendance recorded yet" as a calm no-action EmptyState with the Users icon — same icon family as the screen's other states; 04-03 will add the history list below this block.
- First-load skeleton keeps the chips row mounted (interactive immediately) and adds a name-line block above the ring/counts skeletons; refetch-on-period-change keeps the loaded header mounted and skeletons only the stats region.
- Chip keys are `period-{n}` (the `__all__`-style stable-key discipline; there is no All chip in this row).

## Deviations from Plan

None - plan executed exactly as written. (The §7.5 empty-copy choice, Removed banner copy, and skeleton shapes were explicitly delegated to the executor in CONTEXT.md OpenCode's Discretion and are recorded above as decisions, not deviations.)

## Issues Encountered

None. `react-native-svg` had no in-repo usage precedent but the public Circle/Svg API typechecked cleanly on first pass; `tsc` exit 0 after both implementation tasks with no fix cycles.

## Threat Flags

None — no new security surface beyond the plan's threat model. All three dispositions hold: raw route param reaches SQL only through the DAO's `?` binding (T-04-03, tampered id renders not-found, verified by code path); `tel:` hands an already-visible number to the OS dialer on explicit tap (T-04-04, accepted); the Removed banner derives from DAO `is_active`, never from the param (T-04-05).

## Known Stubs

None — header, chips, ring, counts, Edit, and all states are fully wired end-to-end (DAO → state → UI). No placeholder copy, no mock data, no TODOs. The history list below the stats block is plan 04-03's scope, not a stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Profile shell is ready for 04-03: history section goes BELOW the stats/Edit block using the already-loaded period `entries` (reversed newest-first); extend the skeleton block count for the history region, do not add a spinner.
- Workers-list row retarget (→ profile, `View {name} profile` label) lands in 04-03 — rows still point at `/worker-form` until then.

## Self-Check: PASSED

- FOUND: src/components/attendance-ring.tsx
- FOUND: src/app/worker/[id].tsx
- FOUND: 65508b6 (task 1 commit)
- FOUND: d3211c5 (task 2 commit)

---
*Phase: 04-worker-profile-history*
*Completed: 2026-10-08*
