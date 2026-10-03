# State — Hazra Attendance

**Milestone:** v1.0 — Offline Staff Attendance Register (MVP)
**Current phase:** 1 — Foundation & Data Layer
**Status:** In progress — Phase 1 executing (Wave 2: plans 01-03, 01-04, 01-07 done; Wave 3: plans 01-05, 01-06 done; 01-08 pending)
**Last updated:** 2026-10-03

## Position

- Roadmap created: 9 phases, 41/41 requirements mapped.
- Phase 1 planned: `.planning/phases/01-foundation/01-01-PLAN.md` … `01-08-PLAN.md`.
- Plans are a conventions-conforming 8-plan split (≤3 tasks/plan, ≤3 files/task); all Phase 1 req IDs (DS-01..04, NF-01..03, NF-05) covered.
- Real codebase is still the Expo starter; no product feature implemented.
- Plan 01-01 COMPLETE (2026-10-03): v1 deps installed (expo-sqlite/crypto/file-system/sharing/print/dev-client, dayjs, lucide-react-native, react-native-svg, @expo-google-fonts/inter); `src/constants/status.ts` frozen (STATUS/CYCLE/AttendanceStatus); SUMMARY at `.planning/phases/01-foundation/01-01-SUMMARY.md`; commits 35fd5c3, 830f4b1, 020feae. DS-01 done.
- Plan 01-02 COMPLETE (2026-10-03): product theme tokens in `src/constants/theme.ts` (14 product color keys both modes, Type 48→13, Radius sm/md/lg/pill); starter keys + `ThemeColor` intact; standing self-checks `scripts/verify-theme-tokens.mjs`, `scripts/verify-theme-scale.mjs`; SUMMARY at `.planning/phases/01-foundation/01-02-SUMMARY.md`; commits 16766f4, 8fff62d, d30dbdc, dc712ac. DS-03, DS-04 done.
- Plan 01-03 COMPLETE (2026-10-03): local date-key helpers in `src/utils/dates.ts` (todayKey/toDateKey/addDays/formatDisplay/lastNDays on dayjs, no `toISOString`) + `newId()` in `src/utils/ids.ts` (expo-crypto randomUUID); midnight/TZ check verified under Asia/Kolkata; standing self-checks `scripts/verify-date-utils.mjs`, `scripts/verify-ids.mjs`; SUMMARY at `.planning/phases/01-foundation/01-03-SUMMARY.md`; commits 3713579, 304defe, e4378e9, 6ad4656. NF-05 prerequisite done.
- Plan 01-04 COMPLETE (2026-10-03): frozen SQLite contract in `src/db/types.ts` (Worksite/Worker/AttendanceEntry row types, AttendanceStatus re-exported from canonical status.ts) + `src/db/index.ts` (cached openDatabaseAsync singleton, idempotent CREATE TABLE x3 matching PRD §8, foreign_keys=ON, CHECK status whitelist, UNIQUE(worker_id,date), user_version hook); SDK-57 async names confirmed against versioned docs; SUMMARY at `.planning/phases/01-foundation/01-04-SUMMARY.md`; commits 1827a4c, 7381f1f. NF-02, NF-05 done.
- Plan 01-07 COMPLETE (2026-10-03): four-tab shell (native `src/components/app-tabs.tsx` + web `src/components/app-tabs.web.tsx`, Home/Attendance/Workers/Reports, selected=primary/unselected=mutedForeground via documented `{default,selected}` labelStyle/iconColor) + token-driven Home placeholder (`src/app/index.tsx`) + three new tab screens (`src/app/attendance.tsx|workers.tsx|reports.tsx`); `src/app/explore.tsx` deleted; standing self-check `scripts/verify-tab-shell.mjs` 20/20; SUMMARY at `.planning/phases/01-foundation/01-07-SUMMARY.md`; commits b5241e3, 15a8d2d. NF-01, NF-03 done.
- Plan 01-05 COMPLETE (2026-10-03): worksite + worker DAOs in `src/db/worksites.ts` (list/get/create/update/deactivate, soft delete, parameterized) + `src/db/workers.ts` (same plus worksiteId filter and worksite_id reassignment); `tsc` exit 0, no DELETE in either file; SUMMARY at `.planning/phases/01-foundation/01-05-SUMMARY.md`; commits 0f966d5, 8603c5d. NF-05 done.
- Plan 01-06 COMPLETE (2026-10-03): attendance DAO in `src/db/attendance.ts` (single-statement upsertAttendance via ON CONFLICT(worker_id,date), getAttendanceForDate LEFT JOIN with null-status unmarked, getAttendanceForWorker from/to history, getDailyCounts with derived unmarked and off_day separate); `tsc` exit 0; SUMMARY at `.planning/phases/01-foundation/01-06-SUMMARY.md`; commits ab78606, c64cfa9. NF-05 done.

## Decisions (carry into planning)

- Use **Expo Router + TypeScript strict**, not React Navigation / JS from `build_plan.md`.
- Extend `src/constants/theme.ts`; do **not** create a parallel `src/theme`.
- SQLite via `expo-sqlite` (requires a development build; not available in Expo Go).
- `off_day` excluded from attendance-% denominator; `half_day` counts 0.5.
- Soft-delete worksites/workers via `is_active`; history preserved.
- Manual backup/restore only in v1.
- Dev loop now needs a development build (expo-dev-client installed; Expo Go can't load sqlite/file-system/sharing/print).
- Plan grep gates run as node -e equivalents on Windows PowerShell (no grep binary); assertions identical.
- `expo-router/unstable-native-tabs` SDK-57 color API confirmed from versioned docs + installed types: `labelStyle` and `iconColor` both accept `{ default, selected }` (plan 01-07); use those keys for active/inactive tab colors, never invented ones.

## Blockers

- None.

## Next

`/gsd-execute-phase 1` — continue with `01-08` (db init + EmptyState) and remaining Phase 1 plans.

## Notes

- `build_plan.md` is retained as a planning reference only; its stack section is stale.
- The `.planning/` artifacts were bootstrapped manually because the repo had no GSD project state.
- The `gsd-planner` subagent could not be used on this provider (it crashes with a `content[].thinking` API error). The Phase 1 plan set was written directly and structurally validated (8 plans, 2–3 tasks each, ≤3 files/task, all req IDs covered). The `gsd-plan-checker` pass was not run for the same provider reason.
