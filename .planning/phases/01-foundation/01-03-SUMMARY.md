---
phase: 01-foundation
plan: 03
subsystem: utils
tags: [dayjs, expo-crypto, date-keys, ids, NF-05]

# Dependency graph
requires: [01-01]
provides:
  - Local date-key helpers without UTC drift (src/utils/dates.ts)
  - Stable random ID generator (src/utils/ids.ts)
  - scripts/verify-date-utils.mjs and scripts/verify-ids.mjs standing self-checks
affects: [01-04, 01-05, 01-06, attendance-marking, history, reports]

# Tech tracking
tech-stack:
  added: []
  patterns: [dayjs local-format date keys, expo-crypto randomUUID as sole ID source, node self-check scripts under scripts/ for plans without a test runner]
key-files:
  created: [src/utils/dates.ts, src/utils/ids.ts, scripts/verify-date-utils.mjs, scripts/verify-ids.mjs]
  modified: []
key-decisions:
  - "Kept both self-check scripts in the repo as standing NF-05/T-03-02 gates (no test runner exists)"
  - "IDs self-check is text-gate only because expo-crypto is a native module and cannot be imported under plain node"
  - "Corrected the randomUUID count expectation from 1x to 2x (import + call); the plan's = 1 grep gate undercounts its own specified implementation"

patterns-established:
  - "Date keys are always local YYYY-MM-DD via dayjs().format; toISOString is forbidden in src/utils/dates.ts"
  - "PowerShell has no grep: plan grep gates are executed as node equivalents with identical assertions"

requirements-completed: [NF-05]

# Metrics
duration: ~10min
completed: 2026-10-03
---

# Phase 01 Plan 03: Date and ID Utilities Summary

**Shared local date-key helpers on dayjs plus the single expo-crypto randomUUID ID generator every DB row and screen will use**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-03T11:40:00Z
- **Completed:** 2026-10-03T11:50:00Z
- **Tasks:** 2 (each executed as TDD RED + GREEN)
- **Files modified:** 4

## Accomplishments

- `src/utils/dates.ts` exports the five frozen helpers with the exact contract signatures: `todayKey()` → `dayjs().format('YYYY-MM-DD')` (local, never UTC), `toDateKey(d)`, `addDays(key, n)` (month-boundary and negative-offset safe), `formatDisplay(key, fmt = 'DD MMM YYYY')`, `lastNDays(n)` (ascending, ends today).
- `src/utils/ids.ts` exports `newId(): string` as `return randomUUID()` from `expo-crypto` — the only ID generator for worksites, workers, and attendance rows (plans 01-05/01-06).
- `npx tsc --noEmit` exits 0; both self-check scripts print ok; all plan grep gates pass (as node equivalents: `toISOString` 0x, todayKey impl ≥1x, each date export 1x, `expo-crypto` 1x, `Math.random` 0x).
- Midnight/TZ check recorded with real evidence: under `TZ=Asia/Kolkata` (UTC+5:30), `toDateKey(03 Oct 23:58)` → `2026-10-03` and `toDateKey(04 Oct 00:02)` → `2026-10-04`, with `addDays(k1, 1) === k2` (consecutive, no UTC drift).

## Task Commits

Each task was committed atomically (TDD tasks have RED + GREEN commits):

1. **Task 1 RED: failing date utils check** - `3713579` (test)
2. **Task 1 GREEN: local date utilities** - `304defe` (feat)
3. **Task 2 RED: failing ID generator check** - `e4378e9` (test)
4. **Task 2 GREEN: stable ID generator** - `6ad4656` (feat)

_Note: both tasks are tdd="true", so each has RED (test) + GREEN (feat) commits._

## Files Created/Modified

- `src/utils/dates.ts` - Five local date-key helpers on dayjs; zero UTC conversion (NF-05, T-03-01)
- `src/utils/ids.ts` - `newId()` on `Crypto.randomUUID()` from expo-crypto (T-03-02)
- `scripts/verify-date-utils.mjs` - Standing NF-05 self-check: text gates (no `toISOString`, dayjs impl, five exports) plus runtime behavior assertions (format, month padding, month-boundary arithmetic, ascending `lastNDays`, display format)
- `scripts/verify-ids.mjs` - Standing T-03-02 self-check: `randomUUID` 2x (import + call), `expo-crypto` 1x, no `Math.random`/`getRandomBytes`/`Date.now`, exact `newId(): string` surface

## Decisions Made

- Kept both self-check scripts in the repo as standing gates, since no test runner exists (allowed as optional co-located self-checks per PLANNING-CONVENTIONS.md §1).
- Made the IDs self-check text-gate only: `expo-crypto` is a native module and fails to import under plain node (`expo-modules-core` type-stripping error verified during execution). Runtime behavior (non-empty unique UUIDv4 strings) rests on the expo-crypto contract plus `tsc`; on-device verification comes with the dev build in later plans.
- Plan `grep` gates were executed as `node` equivalents because the shell is PowerShell (no `grep` binary); assertions are identical.
- Corrected the `randomUUID` count expectation (see Deviations); the implementation matches the plan's specified source exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Self-check asserted `randomUUID` appears once; the specified implementation contains it twice**
- **Found during:** Task 2 GREEN (Create the stable ID generator)
- **Issue:** The RED self-check required `randomUUID` exactly once in code, but the plan's own `<action>` specifies `import { randomUUID } from 'expo-crypto';` plus `return randomUUID();` — two occurrences by construction (import + call). The implementation matched the spec; the check was wrong. (Same class of error as the 01-01 `#B45309` count fix.)
- **Fix:** Changed the gate to expect `randomUUID` 2x with a comment citing the import + call structure. The plan's `grep -c "randomUUID" = 1` gate likewise undercounts its own specified source (both occurrences sit on separate lines).
- **Files modified:** scripts/verify-ids.mjs
- **Verification:** `node scripts/verify-ids.mjs` prints `ids ok`, exit 0
- **Committed in:** 6ad4656 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (check-script bug, Rule 1)
**Impact on plan:** No scope change. Implementation matches the plan's action block exactly; only the new self-check's expectation was corrected.

## Issues Encountered

- PowerShell environment: `&&` chaining, `grep`, and `tail` are unavailable. Used `;` separators, `node` equivalents for all gates, and `Remove-Item` for temp-file cleanup. No impact on results.

## Threat Flags

None - no new security-relevant surface beyond the plan's threat model. T-03-01 mitigated (no `toISOString`/`toUTCString`/`getUTC*` in `dates.ts`, verified by gate); T-03-02 mitigated (`Crypto.randomUUID()` sole source, 122 random bits; DB primary key rejects collisions in plans 01-05/01-06); T-03-03 mitigated by construction (strict `dayjs(key, 'YYYY-MM-DD')` parsing; DAO enforcement arrives in plans 01-05/01-06).

## Known Stubs

None - no placeholders, TODOs, or unwired data sources introduced. Both modules are complete implementations of the frozen §4 interface.

## User Setup Required

None.

## Next Phase Readiness

- `todayKey`, `toDateKey`, `addDays`, `formatDisplay`, `lastNDays` are importable via `@/utils/dates` and `newId` via `@/utils/ids` for the DB layer (plans 01-04/01-05/01-06) and every screen.
- No blockers. Plan 01-04 (db types + schema) can proceed.

## Self-Check: PASSED

- FOUND: src/utils/dates.ts, src/utils/ids.ts, scripts/verify-date-utils.mjs, scripts/verify-ids.mjs
- FOUND: commits 3713579, 304defe, e4378e9, 6ad4656 (`git log --oneline`)
- `npx tsc --noEmit` exit 0; both self-checks print ok; gate counts match (toISOString 0, todayKey impl 1, each date export 1, expo-crypto 1, Math.random 0); midnight simulation consecutive under Asia/Kolkata.

---
*Phase: 01-foundation*
*Completed: 2026-10-03*
