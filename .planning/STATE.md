# State — Hazra Attendance

**Milestone:** v1.0 — Offline Staff Attendance Register (MVP)
**Current phase:** 1 — Foundation & Data Layer
**Status:** Planned — 8 plans ready to execute
**Last updated:** 2026-10-03

## Position

- Roadmap created: 9 phases, 41/41 requirements mapped.
- Phase 1 planned: `.planning/phases/01-foundation/01-01-PLAN.md` … `01-08-PLAN.md`.
- Plans are a conventions-conforming 8-plan split (≤3 tasks/plan, ≤3 files/task); all Phase 1 req IDs (DS-01..04, NF-01..03, NF-05) covered.
- Real codebase is still the Expo starter; no product feature implemented.

## Decisions (carry into planning)

- Use **Expo Router + TypeScript strict**, not React Navigation / JS from `build_plan.md`.
- Extend `src/constants/theme.ts`; do **not** create a parallel `src/theme`.
- SQLite via `expo-sqlite` (requires a development build; not available in Expo Go).
- `off_day` excluded from attendance-% denominator; `half_day` counts 0.5.
- Soft-delete worksites/workers via `is_active`; history preserved.
- Manual backup/restore only in v1.

## Blockers

- None.

## Next

`/gsd-execute-phase 1` — execute the 8 Phase 1 plans (start with `01-01`).

## Notes

- `build_plan.md` is retained as a planning reference only; its stack section is stale.
- The `.planning/` artifacts were bootstrapped manually because the repo had no GSD project state.
- The `gsd-planner` subagent could not be used on this provider (it crashes with a `content[].thinking` API error). The Phase 1 plan set was written directly and structurally validated (8 plans, 2–3 tasks each, ≤3 files/task, all req IDs covered). The `gsd-plan-checker` pass was not run for the same provider reason.
