---
phase: 02-worksites-workers
plan: 02
subsystem: ui
tags: [expo-router, worksites, flatlist, empty-state, navigation, sqlite]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: [worksite/worker DAOs with active-only defaults, shared EmptyState, drill-down worksites route]
  - phase: 02-worksites-workers
    provides: [(tabs) group + root Stack from 02-01 so /worksite-form push targets exist]
provides:
  - "Active worksite list with live per-site worker counts at the worksites route"
  - "Add/edit navigation contract to /worksite-form (blank vs ?id=) for 02-03 to honor"
affects: [02-03 worksite form, 02-06 worksite delete]

# Tech tracking
tech-stack:
  added: []
  patterns: [useFocusEffect refetch-on-focus for list screens, memo row + keyExtractor FlatList, single-accent CTA footer]

key-files:
  modified: [src/app/worksites.tsx]

key-decisions:
  - "CTA renders only in the non-empty branch so each state shows exactly one orange action"
  - "Gutters live on title/list/footer individually (16px each) instead of SafeAreaView padding to avoid doubled footer insets"
  - "Re-ran the 02-01 router-server regen after the Windows watcher dropped / again (gitignored type file, no source impact)"

patterns-established:
  - "List screens refetch on every focus via useFocusEffect(useCallback(...)) so form saves reflect immediately"
  - "Worker counts stay derived live via listWorkers({ worksiteId }) — no cached/duplicated count state"

requirements-completed: [WS-04]

# Metrics
duration: 12min
completed: 2026-10-05
---

# Phase 2 Plan 2: Worksites List Summary

**Active worksite cards with live worker counts, design §7.5 empty state, and add/edit pushes to /worksite-form**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-05T18:52:00Z
- **Completed:** 2026-10-05T19:04:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Rewrote `src/app/worksites.tsx` from the 01-08 placeholder into a real list screen: `listWorksites()` (default active-only) plus per-site `listWorkers({ worksiteId })` counts, refetched on every focus
- Bordered `FlatList` cards (`memo` row, `keyExtractor`, 44px targets, ripple + 0.85 pressed feedback) showing name, `type · address`, and tabular-nums worker counts
- Zero-site state renders the exact §7.5 `EmptyState` (`Building2`, "No worksites yet", orange "Add worksite"); first load shows a themed `ActivityIndicator`, never a blank flash
- Row tap pushes `/worksite-form` with the `id` param; the single orange full-width "+ Add worksite" CTA (Plus icon, `theme.accent`/`onAccent`) and the empty-state action push a blank `/worksite-form`
- `npx tsc --noEmit` exits 0; all plan grep gates pass (active-only query, no `includeInactive`, no `fetch(`, no hardcoded hex, no `TouchableOpacity`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Worksite list data loading, cards, and empty state** - `c603dd3` (feat)
2. **Task 2: Add/edit navigation and the primary add action** - `941efdd` (feat)

## Files Created/Modified

- `src/app/worksites.tsx` - Active worksite list with live counts, empty state, and add/edit navigation (rewritten, both tasks)

## Decisions Made

- CTA renders only in the non-empty branch: the empty state already carries its own orange "Add worksite" action, so rendering the footer CTA there too would put two orange elements on screen and violate the one-action-per-screen rule. Each state now shows exactly one orange action.
- Moved the 16px gutters off `SafeAreaView` onto the title (`paddingHorizontal`), list content (`paddingHorizontal`), empty wrapper, and footer (`padding`) individually, so the footer's `Spacing.three` padding does not stack with container padding into a 32px inset.
- Threat T-02-04 (soft-deleted sites leaking into the list) is mitigated by construction: the screen calls `listWorksites()` with no arguments, keeping the DAO's active-only default; the `includeInactive == 0` grep gate asserts it.

## Deviations from Plan

None - plan executed exactly as written. (One environment-quirk recurrence handled below under Issues Encountered; no source change beyond the plan.)

## Issues Encountered

- **Windows typed-routes watcher quirk recurred (environment, no source impact):** the background `expo start` process regenerated the gitignored `.expo/types/router.d.ts` during both task edits with the backslash-key corruption documented in 02-01, dropping `/` and breaking `tsc` on the pre-existing `href="/"` in `app-tabs.web.tsx`. Fix (same as 02-01): re-ran `regenerateDeclarations()` from `@expo/router-server/build/typed-routes` in node with a forward-slash `requireContext` over `src/app` (script kept outside the repo at the temp dir). `tsc` exits 0 after each regen. Future route-file edits on Windows should expect to repeat this one-liner.

## Known Stubs

None. All rendered data is live from SQLite; the count defaults to `0` only when a site genuinely has no workers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `/worksite-form` route contract this screen links to (blank = add, `?id=` = edit) is ready for 02-03 to implement; per threat T-02-05, 02-03 must validate the `id` via `getWorksite` and show "not found" on null.
- 02-06 (worksite delete) can rely on the per-site worker counts already visible here for its delete-guard copy.

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-05*

## Self-Check: PASSED

- FOUND: `src/app/worksites.tsx`
- FOUND: `c603dd3`, `941efdd` in `git log`
- `npx tsc --noEmit` exits 0 (verified after each task, post-regen)
