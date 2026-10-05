---
phase: 02-worksites-workers
plan: 01
subsystem: ui
tags: [expo-router, native-stack, tabs-group, navigation, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: [4-tab shell with AppTabs triggers, drill-down placeholder routes, db-gated root layout]
provides:
  - "(tabs) route group hosting the 4 tab screens at unchanged URLs"
  - "Root Stack navigator with titled drill-down screens and back header"
  - "router.push-ready navigation foundation for all Phase 2 forms and lists"
affects: [02-02 worksite list, 02-03 worksite form, 02-04 worker list, 02-05 worker form, 02-06 worksite delete, 02-07 worker delete]

# Tech tracking
tech-stack:
  added: []
  patterns: [root Stack hosting URL-transparent (tabs) group, per-screen Stack titles from theme tokens]

key-files:
  created: [src/app/(tabs)/_layout.tsx]
  modified: [src/app/_layout.tsx, src/app/(tabs)/index.tsx, src/app/(tabs)/attendance.tsx, src/app/(tabs)/workers.tsx, src/app/(tabs)/reports.tsx]

key-decisions:
  - "Merged Stack into the existing expo-router import instead of a second import line"
  - "Regenerated .expo/types/router.d.ts via router-server API after a Windows watcher regen dropped the / route"
  - "On-device push/back-header check deferred to Phase 9 (no dev build in this environment)"

patterns-established:
  - "Drill-down screens push on the root Stack with theme-driven headers; tab screens stay headerless inside (tabs)"
  - "Route-group moves use git mv to preserve history"

requirements-completed: [WS-04, WK-04]

# Metrics
duration: 20min
completed: 2026-10-06
---

# Phase 2 Plan 1: Nav Foundation Summary

**Root Stack navigator hosting a URL-transparent (tabs) group, so drill-down screens push with a back header while /workers and / keep working**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-05T18:35:00Z
- **Completed:** 2026-10-05T18:55:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Moved the four tab routes into `src/app/(tabs)/` with `git mv` (history preserved), contents untouched
- Created `(tabs)/_layout.tsx` rendering `AppTabs` (web auto-resolves `app-tabs.web.tsx`)
- Root `_layout.tsx` renders a theme-driven `<Stack>`: `(tabs)` headerless plus 6 titled drill-down screens (`worksites`, `worksite-form`, `worker-form`, `worker/[id]`, `export`, `backup`)
- `initDatabase` gate, splash handling, and accent "Try again" retry behaviorally unchanged
- `npx tsc --noEmit` exits 0 after both tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Move tab routes into (tabs) group and create the group layout** - `927aed3` (feat)
2. **Task 2: Root layout renders a Stack with titled drill-down screens** - `aafd150` (feat)

## Files Created/Modified

- `src/app/(tabs)/_layout.tsx` - Tabs group layout rendering `AppTabs`
- `src/app/(tabs)/index.tsx` - Home tab route (moved, content untouched; URL still `/`)
- `src/app/(tabs)/attendance.tsx` - Attendance tab route (moved, content untouched; URL still `/attendance`)
- `src/app/(tabs)/workers.tsx` - Workers tab route (moved, content untouched; URL still `/workers`)
- `src/app/(tabs)/reports.tsx` - Reports tab route (moved, content untouched; URL still `/reports`)
- `src/app/_layout.tsx` - Root layout: db gate + `<Stack>` with 7 registered screens, zero `AppTabs` references

## Decisions Made

- Merged `Stack` into the existing `expo-router` import (`DarkTheme, DefaultTheme, Stack, ThemeProvider`) instead of adding a second import line from the same module — same binding, cleaner diff. `Type` needed no import change (already imported).
- Regenerated `.expo/types/router.d.ts` (gitignored) via the `@expo/router-server` API after the background dev server's file-watcher regen produced a corrupted declaration (see Issues Encountered). No source change; types now match the versioned-docs route semantics.
- On-device push/back-header verification deferred to Phase 9 — no development build exists in this environment (same deferral as 01-08, which was user-approved).

## Deviations from Plan

None - plan executed exactly as written. (Two plan-text errata noted below under Issues Encountered; neither changed what was built.)

## Issues Encountered

- **Windows watcher regen corrupted typed routes (environment quirk, no source impact):** the background `expo start` process regenerated `.expo/types/router.d.ts` on the `git mv` add/delete events with backslash-mixed context keys (`./(tabs)\index.tsx`), so the `/\/index$/` strip in `@expo/router-server` typegen missed and the declaration listed `/index` without `/`. This broke `tsc` on the pre-existing `href="/"` in `app-tabs.web.tsx`. Per the versioned Expo docs (`(home)/index.tsx` matches `/`), the declaration was wrong, not the routes. Fix: ran `regenerateDeclarations()` from `@expo/router-server/build/typed-routes` in node (forward-slash `requireContext`, same path as server-start generation), restoring `` `${'/(tabs)'}` | `/` ``. `tsc` exits 0. Reproducible workaround for future plans that add/delete route files on Windows: re-run that node one-liner, or restart `expo start` (modify-only edits do not trigger watcher regen — the watcher's `routeFiles.has()` backslash mismatch accidentally skips them).
- **Plan-text errata (no build impact):** Task 1's `grep -c "AppTabs" = 1` gate counts 2 against the plan's own prescribed file content (`import AppTabs` + `<AppTabs />`) — gate miscount, content matches the plan exactly. Task 2's "Add `Type` to the theme import" was already satisfied (`Spacing, Type` imported since 01-08) — no edit needed.

## Known Stubs

None introduced. The six drill-down screens remain the inert 01-08 placeholders by design (real list/form implementations land in 02-02…02-06); the Stack registration references only existing route files, so `typedRoutes` passes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `router.push('/worksites')`, `/worksite-form`, `/worker-form`, `/worker/[id]`, `/export`, `/backup` now present screens with back headers; plans 02-02…02-07 can build lists/forms directly.
- Watch for the Windows typed-routes watcher quirk whenever a future plan adds/deletes route files: if `tsc` fails on hrefs with `/index`-style entries in `.expo/types/router.d.ts`, re-run the node regen one-liner documented above.
- On-device push/back-header proof still owed in Phase 9 (deferred verification debt, alongside the 01-08 boot proofs).

---
*Phase: 02-worksites-workers*
*Completed: 2026-10-06*

## Self-Check: PASSED

- FOUND: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/attendance.tsx`, `src/app/(tabs)/workers.tsx`, `src/app/(tabs)/reports.tsx`, `src/app/_layout.tsx`
- FOUND: `927aed3`, `aafd150` in `git log`
- `npx tsc --noEmit` exits 0 (verified after each task)
