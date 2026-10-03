---
phase: 01-foundation
plan: 08
subsystem: app-shell
tags: [expo-router, expo-sqlite, expo-splash-screen, empty-state, offline-boot]

# Dependency graph
requires:
  - phase: 01-foundation plan 01-04
    provides: initDatabase()/getDb() in src/db/index.ts, idempotent CREATE TABLE x3
  - phase: 01-foundation plan 01-07
    provides: AppTabs 4-tab shell, useTheme() hook, Colors/Type/Spacing/Radius tokens, placeholder screen pattern
provides:
  - Six drill-down route placeholders (worksites, worker/[id], worksite-form, worker-form, export, backup)
  - Root layout that initializes SQLite once before tabs render, with readable init-failure screen
  - Shared flat EmptyState component (icon + title + optional accent action)
affects: [02-worksites-workers, 03-attendance-marking, 04-worker-profile-history, 05-home-dashboard-reports, 06-export, 07-backup-restore]

# Tech tracking
tech-stack:
  added: []
  patterns: [module-level initialized guard for once-only DB init, splash hide in finally with benign-double-hide catch, token-only error screen, flat card with Pressable accent action]

key-files:
  created: [src/app/worksites.tsx, src/app/worker/[id].tsx, src/app/worksite-form.tsx, src/app/worker-form.tsx, src/app/export.tsx, src/app/backup.tsx, src/components/empty-state.tsx]
  modified: [src/app/_layout.tsx]

key-decisions:
  - "hideAsync carries .catch(() => {}) because AnimatedSplashOverlay also hides the splash — a double-hide rejection must not surface as an unhandled error"
  - "EmptyState action requires BOTH actionLabel and onAction; otherwise no button renders (no dead affordance)"
  - "worker/[id] echoes the id as display text only and never interpolates it into SQL (parameterized DAOs in later phases)"

patterns-established:
  - "Drill-down placeholder: useTheme + Spacing/Type + SafeAreaView + BottomTabInset/MaxContentWidth, centered title + 'not built yet' body"
  - "EmptyState: surface bg, 1px border, Radius.md, Spacing.three padding, no shadow/elevation; 32px mutedForeground icon; accent Pressable minHeight 44 with android_ripple and pressed opacity 0.85"

requirements-completed: [DS-02, NF-01, NF-02, NF-05]

# Metrics
duration: 20min
completed: 2026-10-03
---

# Phase 1 Plan 8: Drill-Down Routes, SQLite Boot Init, and EmptyState Summary

**Six drill-down route placeholders, SQLite initialized once in the root layout with splash/error handling, and a shared flat EmptyState — all automated gates green; on-device persistence proof awaits a development build**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-03T (plan execution start)
- **Completed:** 2026-10-03
- **Tasks:** 3 (all automatable work complete)
- **Files modified:** 8 (7 created, 1 modified)

## Accomplishments

- `src/app/worksites.tsx`, `src/app/worksite-form.tsx` — "Worksites" / "Worksite" placeholders in the 01-07 `useTheme()` + `Spacing`/`Type` pattern.
- `src/app/worker/[id].tsx` — dynamic worker route reads `const { id } = useLocalSearchParams<{ id: string }>()` and renders `Worker {id}`, proving reachability; id kept as a display string only (T-08-01).
- `src/app/worker-form.tsx`, `src/app/export.tsx`, `src/app/backup.tsx` — remaining drill-down placeholders in the same pattern.
- `src/app/_layout.tsx` — `initDatabase()` runs exactly once via a module-level `initialized` guard (safe under React 19 double-invocation, T-08-02); `SplashScreen.hideAsync()` always runs in `finally`; a catch sets `dbError` and a token-colored "Couldn't start" screen replaces the tabs instead of a silent crash (T-08-04). `ThemeProvider`, `AnimatedSplashOverlay`, and `AppTabs` remain mounted.
- `src/components/empty-state.tsx` — `EmptyState({ icon, title, actionLabel, onAction })`: centered flat card (`surface`, 1px `border`, `Radius.md`, `Spacing.three`, no `shadow`/`elevation`), 32px `mutedForeground` Lucide icon, `Type.h2`/`foreground` title, optional full-width `accent`/`onAccent` `Pressable` (minHeight 44, `android_ripple`, pressed opacity 0.85, no `TouchableOpacity`).
- `npx tsc --noEmit` exits 0; all init/EmptyState gates pass; phase-wide no-hex and no-network gates pass over all 14 Phase 1 product files (DS-03, NF-01, T-08-03, T-08-05).

## Task Commits

Each task was committed atomically:

1. **Task 1: Worksites, worker profile, and worksite form route placeholders** - `6194ffc` (feat)
2. **Task 2: Worker form, export, and backup route placeholders** - `d2d2364` (feat)
3. **Task 3: Initialize SQLite in the root layout, add EmptyState, phase-wide gate** - `ebd0c15` (feat)

## Files Created/Modified

- `src/app/worksites.tsx` - "Worksites" placeholder route (created)
- `src/app/worker/[id].tsx` - dynamic worker route, reads and echoes `id` via `useLocalSearchParams` (created)
- `src/app/worksite-form.tsx` - "Worksite" placeholder route (created)
- `src/app/worker-form.tsx` - "Worker" placeholder route (created)
- `src/app/export.tsx` - "Export" placeholder route (created)
- `src/app/backup.tsx` - "Backup" placeholder route (created)
- `src/app/_layout.tsx` - once-only `initDatabase`, splash hide in `finally`, `dbError` screen (modified)
- `src/components/empty-state.tsx` - shared flat `EmptyState` (created)

## Decisions Made

- `SplashScreen.hideAsync()` in `_layout.tsx` carries `.catch(() => {})` because the starter `AnimatedSplashOverlay` also calls `hideAsync` on layout — a second hide must not raise an unhandled rejection. The plan's grep gate (`SplashScreen.hideAsync`) still matches.
- `EmptyState` renders the action button only when both `actionLabel` and `onAction` are provided, so later phases can never ship a dead button.
- `useLocalSearchParams<{ id: string }>()` types the param as a string at the boundary; Phase 4 DAOs must receive it as a bound parameter, never string-interpolated (threat T-08-01).

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written, with two noted gate readings below (not code deviations).

### Gate readings

**1. Task 1 `useLocalSearchParams` count reads 2, not 1**
- **Found during:** task 1 verification
- **Issue:** the plan gate expects `grep -c "useLocalSearchParams"` = 1, but any correct implementation matches two lines: the `expo-router` import and the call site.
- **Resolution:** both lines verified present and correct (import + `useLocalSearchParams<{ id: string }>` call, id echoed in JSX); treated the gate intent (route reads its id) as satisfied.

**2. PowerShell has no `grep`/`head` binaries**
- **Found during:** all task verifications
- **Issue:** plan gates are written as shell `grep`/`test` one-liners.
- **Resolution:** ran all gates as `node -e` equivalents with identical assertions (per the STATE.md convention from prior plans). All pass.

## Issues Encountered

None blocking. `npx tsc --noEmit` exits 0 after every task.

## Manual Verification (NOT executed — requires a development build)

Per the plan (`autonomous: false`), the final acceptance needs an on-device development build, which does not exist in this environment (`expo-sqlite` is a native module; Expo Go cannot run it):

- **Dev-only persistence proof (Task 3):** in a development build (`npx expo run:android` / `npx expo run:ios` or `eas build --profile development`), after `initDatabase()` resolves, insert a worksite named `__boot_probe__` and log `SELECT COUNT(*) FROM worksites WHERE name='__boot_probe__'` — expected `1` on first launch, `1` again after a full close + relaunch (row survived restart). Remove the probe afterwards and re-run `npx tsc --noEmit` (expected exit 0). **No counts recorded — proof pending.**
- **Airplane-mode boot:** launch the development build with no connectivity; expected: boots to Home with no red screen. **Not run — pending.**
- Correctness established statically: `initDatabase` is idempotent (`CREATE TABLE IF NOT EXISTS` + singleton promise in `src/db/index.ts`) and additionally guarded once-only at the call site; failure path renders text instead of crashing; splash hides in `finally` on every path.

## Threat Flags

None - no new security surface beyond the plan's threat model. `id` stays a display string (T-08-01); once-only init via module guard + idempotent schema (T-08-02); phase-wide grep gates confirm no `fetch(`/`axios`/`XMLHttpRequest` (T-08-03) and no `#RRGGBB` literals (T-08-05) in the 14 Phase 1 product files; init rejection renders a readable error with splash always hidden (T-08-04).

## Known Stubs

Six intentional placeholder routes (`worksites`, `worker/[id]`, `worksite-form`, `worker-form`, `export`, `backup`) render title + "not built yet" copy. They are the plan's required output — later phases fill them in (Phase 2: worksite/worker forms + lists; Phase 4: worker profile; Phase 6: export; Phase 7: backup).

## User Setup Required

Development build required for the on-device boot/restart check (per plan `user_setup`): `npx expo run:android` or `npx expo run:ios`, or `eas build --profile development`. Expo Go cannot run this plan's final acceptance.

## Next Phase Readiness

- Phase 1 automated work is complete up to plan 01-08: boot init, all route shells, EmptyState, DAOs, tokens, and utils are in place. Remaining Phase 1 acceptance is the on-device persistence proof + airplane-mode boot above.
- Phase 2 (worksites & workers) can fill in `worksites.tsx`, `worksite-form.tsx`, `worker-form.tsx` and the workers list directly, using `EmptyState` for empty lists and the plan 01-05 DAOs.

---
*Phase: 01-foundation*
*Completed: 2026-10-03*

## Self-Check: PASSED

- FOUND: src/app/worksites.tsx
- FOUND: src/app/worker/[id].tsx
- FOUND: src/app/worksite-form.tsx
- FOUND: src/app/worker-form.tsx
- FOUND: src/app/export.tsx
- FOUND: src/app/backup.tsx
- FOUND: src/components/empty-state.tsx
- FOUND: 6194ffc (task 1 commit)
- FOUND: d2d2364 (task 2 commit)
- FOUND: ebd0c15 (task 3 commit)
- `npx tsc --noEmit` exits 0
