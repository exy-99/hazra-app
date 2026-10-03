---
phase: 01-foundation
plan: 02
subsystem: design-tokens
tags: [theme, design-tokens, color-contract, typography, radius, dark-mode]

# Dependency graph
requires: []
provides:
  - Product color contract in Colors.light/Colors.dark (src/constants/theme.ts)
  - Type scale (display/h1/h2/body/label/caption) and Radius scale (sm/md/lg/pill)
  - scripts/verify-theme-tokens.mjs and scripts/verify-theme-scale.mjs standing self-checks
affects: [01-03, 01-04, 01-05, 01-06, 01-07, 01-08, all-ui-phases]

# Tech tracking
tech-stack:
  added: []
  patterns: [single token file as sole color source, node self-check scripts under scripts/ for plans without a test runner]
key-files:
  created: [scripts/verify-theme-tokens.mjs, scripts/verify-theme-scale.mjs]
  modified: [src/constants/theme.ts]
key-decisions:
  - "Overwrote starter text/background values with product foreground/background hexes (intended; starter Home is replaced in plan 01-07)"
  - "Kept both self-check scripts in the repo as standing DS-03/DS-04 gates (no test runner exists)"

patterns-established:
  - "Product tokens extend src/constants/theme.ts in place; starter keys preserved so existing consumers keep compiling"
  - "PowerShell has no grep: plan grep gates are executed as node -e equivalents with identical assertions"

requirements-completed: [DS-03, DS-04]

# Metrics
duration: ~2min
completed: 2026-10-03
---

# Phase 01 Plan 02: Product Theme Tokens Summary

**Extended `src/constants/theme.ts` with the full design.md product color contract (light + dark), the six-step Type scale, and the four-step Radius scale — starter keys and `ThemeColor` intact**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-10-03T11:37:45Z
- **Completed:** 2026-10-03T11:39:15Z
- **Tasks:** 2 (each executed as TDD RED + GREEN)
- **Files modified:** 3

## Accomplishments

- `Colors.light` / `Colors.dark` expose all 14 product keys (`primary`, `onPrimary`, `secondary`, `accent`, `onAccent`, `background`, `surface`, `foreground`, `muted`, `mutedForeground`, `border`, `ring`, `destructive`, `onDestructive`) with the exact design.md §3 hexes; light/dark shape parity is 18 vs 18 keys.
- Starter keys `text`, `backgroundElement`, `backgroundSelected`, `textSecondary` preserved; `text`/`background` values overwritten to product `foreground`/`background` (`#134E4A`/`#F0FDFA` light, `#E6FFFA`/`#0B1F1D` dark) as the plan directs. Existing consumers (`useTheme()`, `app-tabs.tsx`, `app-tabs.web.tsx`) use only preserved keys and keep compiling.
- `Type` matches design.md §5 (display 48 → caption 13, nothing below 13px); `Radius` matches design.md §6 (`sm: 8, md: 12, lg: 16, pill: 999`). No `src/theme/` parallel system created.
- `npx tsc --noEmit` exits 0; both self-check scripts print ok.

## Task Commits

Each task was committed atomically (TDD tasks have RED + GREEN commits):

1. **Task 1 RED: failing theme token check** - `16766f4` (test)
2. **Task 1 GREEN: product color tokens** - `8fff62d` (feat)
3. **Task 2 RED: failing type/radius scale check** - `d30dbdc` (test)
4. **Task 2 GREEN: Type and Radius scales** - `dc712ac` (feat)

_Note: both tasks are tdd="true", so each has RED (test) + GREEN (feat) commits._

## Files Created/Modified

- `src/constants/theme.ts` - Product color contract both modes + `Type` + `Radius`; starter keys, `Spacing`, `Fonts`, `BottomTabInset`, `MaxContentWidth`, `ThemeColor` intact (DS-03, DS-04)
- `scripts/verify-theme-tokens.mjs` - Standing DS-03 self-check: exact primary/accent/destructive hexes, starter-key preservation, light/dark shape parity (run with node)
- `scripts/verify-theme-scale.mjs` - Standing DS-04 self-check: Type sizes (min 13px), Radius values, no `src/theme/`, Task 1 tokens undisturbed (run with node)

## Decisions Made

- Overwrote starter `text`/`background` with product `foreground`/`background` values per the plan's interfaces note (the starter Home screen is replaced in plan 01-07, so no compatibility concern).
- Kept both self-check scripts in the repo as standing DS-03/DS-04 gates, since no test runner exists (allowed as optional co-located self-checks per PLANNING-CONVENTIONS.md §1).
- Plan `grep` gates were executed as `node -e` equivalents because the shell is PowerShell (no `grep` binary); assertions are identical (counts match the plan: `export const Type` ×1, `export const Radius` ×1, `fontSize: 13` ≥1).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- PowerShell environment: `&&` chaining and `grep` are unavailable. Used `;` separators and `node -e` equivalents for all gates. No impact on results.

## Threat Flags

None - no new security-relevant surface. This plan adds constant data only, matching the plan's threat model (T-02-01 accepted; T-02-02 mitigation deferred to the plan 01-08 scoped grep asserting no `#RRGGBB` literals in product files).

## Known Stubs

None - no placeholders, TODOs, or unwired data sources introduced.

## User Setup Required

None.

## Next Phase Readiness

- `Colors`, `Type`, `Radius`, `Spacing` are importable via `@/constants/theme` for all later Phase 1 plans and UI phases; `useTheme()` resolves the product contract in both modes.
- Dark-mode toggle verification is recorded for Phase 2, once screens consume the tokens (per plan verification note).
- No blockers. Next Phase 1 plans can proceed.

## Self-Check: PASSED

- FOUND: src/constants/theme.ts, scripts/verify-theme-tokens.mjs, scripts/verify-theme-scale.mjs
- FOUND: commits 16766f4, 8fff62d, d30dbdc, dc712ac (`git log --oneline`)
- `npx tsc --noEmit` exit 0; token/scale self-checks print ok; `node -e` gate counts match plan expectations; values match design.md §3/§5/§6 by inspection (exact copy of interfaces block).

---
*Phase: 01-foundation*
*Completed: 2026-10-03*
