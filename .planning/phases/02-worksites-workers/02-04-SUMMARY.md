---
phase: 02-worksites-workers
plan: 04
subsystem: ui
tags: [expo-router, react-native, sqlite, workers, filter-chips, flatlist]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: worker/worksite DAOs (listWorkers filter, listWorksites), EmptyState, theme tokens
  - phase: 02-worksites-workers/02-01
    provides: (tabs) group path for the workers screen
provides:
  - Filterable worker list tab with worksite chips and focus refetch
  - Add/edit navigation to /worker-form and entry point to /worksites
affects: [02-05 worker form, 02-07 worker delete, attendance marking phase]

# Tech tracking
tech-stack:
  added: []
  patterns: [useFocusEffect refetch-on-focus, active-only list queries with include-inactive name map, one-orange-action-per-screen-state]

key-files:
  created: []
  modified: [src/app/(tabs)/workers.tsx]

key-decisions:
  - "Worker-list CTA follows the 02-02 one-orange rule: footer CTA only in the non-empty branch"
  - "Site names resolve via listWorksites(true) Map (display-only); chips and rows stay active-only"

patterns-established:
  - "Filter-chip styling mirrors 02-03 type chips (pill, 44px, selected primary/onPrimary)"
  - "Windows watcher regen workaround re-applied (regenerateDeclarations via temp script)"

requirements-completed: [WK-04]

# Metrics
duration: 20min
completed: 2026-10-06
---

# Phase 2 Plan 4: Worker List + Worksite Filter Summary

**Workers tab with All/per-worksite filter chips, focus refetch for instant reassignment visibility, role · site rows, and a single orange Add worker CTA**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-06 (execution session)
- **Completed:** 2026-10-06
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Worker list filters by worksite via All + per-site chips; switching filter refetches through `listWorkers({ worksiteId })`
- Returning from the worker form always shows fresh data via `useFocusEffect` refetch, so reassignments appear immediately
- Rows show `name` plus `role · site` (site names from an include-inactive lookup Map, `'—'` fallback); empty filter shows the exact design §7.5 copy with an Add worker action
- Single orange element on screen: full-width `+ Add worker` CTA in the non-empty branch; text-only primary "Worksites" entry routes to `/worksites`; rows route to `/worker-form?id=…`

## Task Commits

Each task was committed atomically:

1. **Task 1: Worker list data, worksite filter chips, and immediate refresh** - `889526c` (feat)
2. **Task 2: Add/edit navigation and the single orange CTA** - `0ae3fa0` (feat)

**Plan metadata:** pending final docs commit (see below)

## Files Created/Modified

- `src/app/(tabs)/workers.tsx` - Workers tab: header + Worksites entry, filter chips, FlatList with memo rows, loading/empty states, orange Add CTA footer

## Decisions Made

- Worker-list CTA follows the 02-02 one-orange-per-screen-state rule: the footer CTA renders only in the non-empty branch because the empty state carries its own accent action — keeps exactly one `theme.accent` usage in the file.
- Site-name resolution uses `listWorksites(true)` purely for the display Map (legacy assignments to deactivated sites still label correctly); chips come from active-only `listWorkers`/`listWorksites()` defaults, per threat disposition T-02-10.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Windows typed-routes watcher quirk recurred twice (environment, no source impact):** the background `expo start` process regenerated the gitignored `.expo/types/router.d.ts` during both task edits with the backslash-key corruption documented in 02-01/02-02/02-03, dropping `/` and breaking `tsc` on the pre-existing `href="/"` in `app-tabs.web.tsx`. Fix (same as prior plans): ran `regenerateDeclarations()` from `@expo/router-server/build/typed-routes` in node with `EXPO_ROUTER_APP_ROOT` set to the forward-slash `src/app` path (script kept outside the repo at the temp dir). `tsc` exits 0 after each regen. Not a deviation — no source change, no commit; documented here for the next executor.
- **Pre-existing `tsc` failure verified before any task commit:** stashed the Task 1 edit and confirmed the `app-tabs.web.tsx` error exists on clean HEAD, proving it was environmental and not introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WK-04 roster surface complete; ready for 02-05 (worker form + reassign writer-side, which these `/worker-form` links target).
- No blockers. On-device filter/reassign visual proof needs a development build (deferred to Phase 9, same as prior UI plans).

## Self-Check: PASSED

- File exists: `src/app/(tabs)/workers.tsx` — FOUND
- Commit `889526c` — FOUND (`git rev-parse --short HEAD~1`)
- Commit `0ae3fa0` — FOUND (`git rev-parse --short HEAD`)
- No unintended file deletions in either commit (diff-filter=D empty)
- `npx tsc --noEmit` exits 0 (after documented watcher-regen workaround)

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*
