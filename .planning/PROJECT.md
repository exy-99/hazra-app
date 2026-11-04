# Hazra Attendance — Project

## What This Is

A fully offline, single-manager staff attendance register for React Native + Expo. A manager records daily attendance for workers across one or more worksites, views stats/reports, exports CSV/PDF, and manually backs up/restores all local data. No network, no accounts, no employee-side app.

## Core Value

**The daily mark-attendance loop.** A manager can mark attendance for workers in the fewest taps possible, offline, and trust that the data persists and corrects in place. Everything else (reports, export, backup) supports that loop.

## Context

- **Platform:** Expo SDK 58, React Native 0.88, React 19.3, iOS + Android + web, TypeScript strict.
- **Real repo state:** the attendance product is implemented. Working screens: Home, Attendance, Workers, Reports (`(tabs)/`), plus Worksites, Worksite form, Worker form, Worker profile, Export and Backup (root Stack). Tokens live in `src/constants/theme.ts`; navigation is Expo Router (native tabs via `expo-router/native-tabs`, web tabs via `expo-router/ui`). Phases 1–7 complete; Phase 8 executed with human checkpoints pending; Phase 9 (build & ship) not started.
- **Product docs:** `PRD_Attendance_App.md` (product source of truth), `design.md` (visual contract), `build_plan.md` (planning reference), `AGENTS.md` (locked constraints).
- **CRITICAL reconciliation:** `build_plan.md` and the PRD tech-stack table describe **React Navigation + JavaScript/JSDoc + `src/theme`**. That is **stale**. The real repo uses **Expo Router + TypeScript strict**. Plans must build on Expo Router, extend `src/constants/theme.ts` (not a parallel theme), and use `@/*` aliases. See `AGENTS.md`.
- **Data:** all local, `expo-sqlite`. Adding it (native module) requires a development build, not Expo Go (per `AGENTS.md`).

## Requirements

### Active

- Offline worksite, worker, and attendance management (see `REQUIREMENTS.md`)
- Reports + attendance-% math (off_day excluded, half_day = 0.5)
- CSV/PDF export and manual JSON backup/restore
- Design-contract UI per `design.md`

### Validated in Phase 1: Foundation & Data Layer (2026-10-03)

- DS-01 (status colors), DS-03 (token-only colors), DS-04 (type scale) — frozen contracts in `src/constants/`
- NF-02 (local SQLite schema + DAOs), NF-05 (soft-delete, stable IDs, local date keys, `user_version` hook)
- NF-01/NF-03 (offline, no-auth shell) at code level; on-device boot proof deferred to Phase 9

### Validated in Phase 2: Worksites & Workers (2026-10-06)

- WS-01..WS-04, WK-01..WK-04 — full roster workflow: root Stack + `(tabs)` group nav, worksite list with live counts, worksite/worker add-edit forms (frozen `FormField` contract), worker list with worksite filter, count-aware worksite remove + history-kept worker remove (frozen `ConfirmDialog` contract, soft-delete only)
- Post-verification hardening: list-load error retry + form save re-entry guards (patterns to copy into Phase 3)
- On-device roster/restart/remove proofs deferred to Phase 9

### Validated in Phases 3–6 (2026-10-07 → 2026-10-11)

- Attendance register: date strip + calendar, status pills (cycle + inline picker), per-entry notes, worksite filter, daily counts, in-place upsert writes (AT-01..AT-05)
- Worker profile: SVG attendance ring, 7/30/90 presets, stats counts, read-only history list (PR-01/PR-02)
- Home dashboard + reports: hero ring, tappable counts, per-worker rankings, bottom-3 frequent absentees, SVG trend chart (RP-01..RP-05)
- Export: pure CSV/PDF serializers, SAF/Downloads file helpers, mobile + web PDF paths, stale-load guards, honest empty/success cards (EX-01..EX-03, NF-06)
- Phase 3 UAT 13/13; Phase 5 UAT 8/8; export UAT items live in `06-HUMAN-UAT.md` (4 pending, Phase 9)

### Validated in Phase 7: Backup & Restore (2026-10-17)

- Full Backup & Restore screen, serialize/validate + transactional import/export, Downloads write + share, restore confirm gate (BK-01..BK-03)
- 4 on-device proofs deferred to Phase 9 (`07-04-SUMMARY.md`)

### Phase 8: Polish & Edge Cases (executed 2026-10-18, checkpoints open)

- Inter font + 13px floor + reduced-motion hook, §7.5 copy lock + skeletons, component a11y/focus, 9-screen sweep, tab chrome, computational contrast gate (token bumps: light primary `#0B7A6F`, accent `#C24100`), backup screen sweep
- 08-07: brand icon/splash wired 2026-11-04; 360dp device proof + both-modes sweep + SUMMARY backfill outstanding

### Out of Scope

- Employee-facing app / self check-in — single manager only
- GPS/geofencing, biometrics/selfies — explicitly excluded in PRD §4
- Payroll/salary, cloud sync, multi-manager/multi-tenant — PRD §4
- Shift scheduling, overtime — PRD §4

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo Router (not React Navigation) | Repo already uses file-based routing + `typedRoutes`; `build_plan.md` stack is stale | Locked — trust code/config per AGENTS.md |
| Extend `src/constants/theme.ts` (not `src/theme`) | Avoid a parallel theme system; existing `useTheme()` hook consumes it | Locked |
| TypeScript strict (not JS/JSDoc) | Repo is TS strict; AGENTS.md | Locked |
| SQLite via `expo-sqlite` | PRD §10, offline requirement | Locked |
| `off_day` excluded from % denominator; half_day = 0.5 | PRD §9 business rule | Locked |
| Soft-delete worksites/workers; `is_active` flag | PRD §7, history preservation | Locked |
| Manual backup/restore only (v1) | PRD §7.7 | Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-11-04 — SDK 58 / RN 0.88 / React 19.3, brand icon + splash wired, Phase 8 checkpoints open*
