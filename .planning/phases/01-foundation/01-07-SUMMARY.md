---
phase: 01-foundation
plan: 07
subsystem: navigation
tags: [expo-router, native-tabs, tab-bar, offline-shell, NF-01, NF-03]

# Dependency graph
requires: [01-02]
provides:
  - Native 4-tab bar Home/Attendance/Workers/Reports (src/components/app-tabs.tsx)
  - Web 4-tab bar mirroring native (src/components/app-tabs.web.tsx)
  - Four tab route screens incl. token-driven Home placeholder (src/app/)
affects: [01-08, attendance-marking, workers, reports, export]

# Tech tracking
tech-stack:
  added: []
  patterns: [expo-router file-based tab routes, native/web platform-split tab components, token-driven placeholder screens (useTheme + Type + Spacing)]
key-files:
  created: [src/app/attendance.tsx, src/app/workers.tsx, src/app/reports.tsx, scripts/verify-tab-shell.mjs]
  modified: [src/components/app-tabs.tsx, src/components/app-tabs.web.tsx, src/app/index.tsx]
key-decisions:
  - "labelStyle uses the documented { default, selected } shape ({ mutedForeground, primary }); iconColor set the same way — both keys verified against SDK-57 docs AND installed types.d.ts"
  - "Web TabButton active/inactive colors switched to primary/mutedForeground via existing themeColor mechanism (design.md §8)"
  - "explore.png reused as temporary placeholder icon with Phase-8 replacement comment; no new icon API invented"
  - "explore.tsx deletion rode with the Task 1 commit (staged by git rm before the split); Task 2 commit holds the three new screens + self-check script"

patterns-established:
  - "Plan grep gates executed as node equivalents via a co-located script (PowerShell has no grep); assertions identical"
  - "No hardcoded hex anywhere in touched files — all color through Colors tokens / themeColor"

requirements-completed: [NF-01, NF-03]

# Metrics
duration: ~25min
completed: 2026-10-03
---

# Phase 01 Plan 07: Four-Tab Shell + Route Screens Summary

**Starter two-tab shell replaced with the product's four-tab navigation (Home/Attendance/Workers/Reports) on native and web, three new tab route screens created, explore.tsx removed — fully offline, no account/network UI**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-10-03T17:19:48Z
- **Tasks:** 2
- **Files modified:** 7 (3 created routes, 3 modified, 1 deleted, 1 created script)

## Accomplishments

- `src/components/app-tabs.tsx` now declares exactly four `<NativeTabs.Trigger>` in order (`index`, `attendance`, `workers`, `reports`). Selected label/icon = `colors.primary`, unselected = `colors.mutedForeground`, using the documented `{ default, selected }` shapes for both `labelStyle` and `iconColor` (verified against `https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/` and the installed `expo-router/build/native-tabs/types.d.ts` — no invented keys). `backgroundColor`/`indicatorColor` props kept. Home keeps `home.png`; the other three reuse `explore.png` with a comment that Phase 8 (DS-05..09) replaces the icon set.
- `src/components/app-tabs.web.tsx` now declares four `<TabTrigger>` (`home` `/`, `attendance` `/attendance`, `workers` `/workers`, `reports` `/reports`). `CustomTabList` brands "Hazra Attendance"; the "Expo Starter" text, Docs `ExternalLink`, and now-unused imports (`ExternalLink`, `SymbolView`, `useColorScheme`, `Colors`) removed. `TabButton` active/inactive text uses `themeColor` `primary`/`mutedForeground`.
- `src/app/index.tsx` is a `useTheme()`-driven Home placeholder ("Home" in `Type.h1`, "Dashboard coming soon" in `Type.body`/`mutedForeground`, `Spacing` layout, safe area + bottom-tab inset). All starter content (`AnimatedIcon`, `HintRow`, `WebBadge`, `expo-device` hint logic) removed.
- `src/app/attendance.tsx`, `src/app/workers.tsx`, `src/app/reports.tsx` created with the same placeholder pattern (title + one-line "not built yet" body, `useTheme`, `Spacing`/`Type`, safe area). No data access, no `fetch(`, no network/account UI. `src/app/explore.tsx` deleted — no dangling route.
- `npx tsc --noEmit` exits 0 (typed-route hrefs resolve once the new route files exist — the interim failure before Task 2 is expected ordering, not a bug). Standing self-check `scripts/verify-tab-shell.mjs` passes 20/20 (tab names, brand/docs removal, file existence, `useTheme` presence, zero `fetch(`, zero hardcoded hex).

## Task Commits

Each task was committed atomically:

1. **Task 1: Four-tab shell and Home tab** - `b5241e3` (feat; also carries the staged `explore.tsx` deletion — see Deviations)
2. **Task 2: Attendance, Workers, and Reports tab screens** - `15a8d2d` (feat; three new screens + verify script)

## Files Created/Modified

- `src/components/app-tabs.tsx` - Native 4-tab bar (T-07-02 native half; T-07-03 static Home, no blank nav)
- `src/components/app-tabs.web.tsx` - Web 4-tab bar mirroring native (T-07-02 web half); brand/docs chrome removed (T-07-01)
- `src/app/index.tsx` - Token-driven Home placeholder (T-07-03)
- `src/app/attendance.tsx` / `src/app/workers.tsx` / `src/app/reports.tsx` - Placeholder tab screens, no data calls (T-07-01)
- `src/app/explore.tsx` - Deleted (dangling route removed)
- `scripts/verify-tab-shell.mjs` - Standing self-check for all plan grep/file gates + hex/fetch guards

## Decisions Made

- Used the documented `labelStyle={{ default: ..., selected: ... }}` key for the inactive label color (`mutedForeground`): the SDK-57 docs and installed `types.d.ts` both define the `default` key, so the plan's fallback ("leave at platform default") did not trigger.
- Additionally set `iconColor={{ default: mutedForeground, selected: primary }}` (same documented union type) so inactive icons also meet design.md §8 (active = `primary`, inactive = `mutedForeground`). Minor plan extension, same documented API — recorded as a deviation for transparency.
- Web `TabButton` inactive color is `mutedForeground` (not the prior `textSecondary`) per design.md §8, via the existing `themeColor` mechanism — no new styling API.
- Placeholder icon reuse (`explore.png`) carries an explicit Phase-8 replacement comment per the plan; no new icon API invented.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Typed-route hrefs failed tsc until the new route files existed**
- **Found during:** Task 1 verification
- **Issue:** `href="/attendance"` (etc.) in `app-tabs.web.tsx` is typechecked against generated typed routes; with `attendance.tsx`/`workers.tsx`/`reports.tsx` not yet created, `tsc` errored TS2322. This is task-ordering, not a code bug — Task 2 creates exactly those files.
- **Fix:** Created Task 2 route files, re-ran `tsc` — exits 0. No code change to Task 1 output.
- **Commit:** 15a8d2d

**2. [Rule 2 - Missing critical] `explore.tsx` deletion staged into the Task 1 commit**
- **Found during:** Task 1 commit
- **Issue:** `git rm src/app/explore.tsx` (a Task 2 action) was staged before the per-task commit split, so the deletion landed in `b5241e3` (Task 1) instead of `15a8d2d` (Task 2). Content-wise the deletion is exactly what the plan specifies; only the commit boundary is blurred.
- **Fix:** None warranted (history rewrite for a boundary nit would violate proportionality). Documented here; Task 2 commit holds the three new screens + self-check.
- **Commit:** b5241e3

**3. [Rule 2 - Missing critical] Native `iconColor` set to mutedForeground/primary**
- **Found during:** Task 1 implementation
- **Issue:** The plan's `<action>` specified the selected/unselected label colors but said nothing about icon tint; without it, inactive icons would render in the platform default rather than `mutedForeground`, weakening design.md §8 (active = primary, inactive = mutedForeground) which the manual on-device check verifies.
- **Fix:** Set `iconColor={{ default: colors.mutedForeground, selected: colors.primary }}` using the documented union type from the SDK-57 native-tabs page (confirmed in installed `types.d.ts`). No invented API.
- **Files modified:** src/components/app-tabs.tsx
- **Commit:** b5241e3

---

**Total deviations:** 3 auto-fixed (1 ordering, 1 commit-boundary note, 1 small documented extension)
**Impact on plan:** No scope change. All must_haves truths hold: exactly four tabs on native and web with matching route names, no account/login/sync/network UI, Home renders a static token-driven placeholder.

## Issues Encountered

- PowerShell environment: `&&` chaining and `grep`/`/dev/null` Unix idioms fail; gates executed via `node scripts/verify-tab-shell.mjs` with identical assertions (per STATE.md convention). The first inline `node -e` attempt failed on quoting — rewritten as a script file following the `verify-theme-tokens.mjs` ESM (`import`) pattern after an initial CJS `require` misstep.
- Manual on-device verification from the plan (open on Home, four tabs navigate, active = primary, airplane-mode launch) was NOT performed: no device/development build is available in this environment. Static guarantees hold (`tsc` 0, 20/20 gates, no `fetch(`, both tab files name the same four routes). Re-verify on device when a dev build exists.

## Threat Flags

None - no new security-relevant surface beyond the plan's threat model. Mitigations landed as specified: T-07-01 (no data calls in placeholders, `fetch(` grep gate 0, no login/sync UI, docs/brand chrome removed), T-07-02 (both tab files name the same four routes; gates assert each 1x), T-07-03 (static Home placeholder; `tsc` + route-existence gates pass), T-07-04 accepted per plan (no dynamic route params).

## Known Stubs

- `explore.png` reused as the Attendance/Workers/Reports tab icon (temporary placeholder, commented in `src/components/app-tabs.tsx`); Phase 8 (DS-05..09) replaces the icon set. Intentional per plan, tracked for the icon pass.
- Home/Attendance/Workers/Reports screens are static placeholders ("coming soon" / "not built yet"); Phases 2/3/5 fill them in. Intentional per plan — the shared `EmptyState` arrives in plan 01-08.

## User Setup Required

None.

## Next Phase Readiness

- Four tab routes (`/`, `/attendance`, `/workers`, `/reports`) exist and are wired on native + web; feature phases push drill-downs on top of this shell.
- No blockers. Plan 01-08 (shared EmptyState + root wiring) can proceed.

## Self-Check: PASSED

- FOUND: src/components/app-tabs.tsx, src/components/app-tabs.web.tsx, src/app/index.tsx, src/app/attendance.tsx, src/app/workers.tsx, src/app/reports.tsx, scripts/verify-tab-shell.mjs; explore.tsx absent
- FOUND: commits b5241e3, 15a8d2d (`git log --oneline`)
- `npx tsc --noEmit` exit 0; `node scripts/verify-tab-shell.mjs` 20/20 PASS; post-commit deletion check shows only the planned explore.tsx removal

---
*Phase: 01-foundation*
*Completed: 2026-10-03*
