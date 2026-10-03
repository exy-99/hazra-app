# Hazra Attendance — Project

## What This Is

A fully offline, single-manager staff attendance register for React Native + Expo. A manager records daily attendance for workers across one or more worksites, views stats/reports, exports CSV/PDF, and manually backs up/restores all local data. No network, no accounts, no employee-side app.

## Core Value

**The daily mark-attendance loop.** A manager can mark attendance for workers in the fewest taps possible, offline, and trust that the data persists and corrects in place. Everything else (reports, export, backup) supports that loop.

## Context

- **Platform:** Expo SDK 57, React Native 0.86, React 19, iOS + Android + web, TypeScript strict.
- **Real repo state:** the stock Expo starter. `src/app/index.tsx` and `src/app/explore.tsx` are the only screens; tokens live in `src/constants/theme.ts`; navigation is Expo Router (native tabs via `expo-router/unstable-native-tabs`, web tabs via `expo-router/ui`).
- **Product docs:** `PRD_Attendance_App.md` (product source of truth), `design.md` (visual contract), `build_plan.md` (planning reference), `AGENTS.md` (locked constraints).
- **CRITICAL reconciliation:** `build_plan.md` and the PRD tech-stack table describe **React Navigation + JavaScript/JSDoc + `src/theme`**. That is **stale**. The real repo uses **Expo Router + TypeScript strict**. Plans must build on Expo Router, extend `src/constants/theme.ts` (not a parallel theme), and use `@/*` aliases. See `AGENTS.md`.
- **Data:** all local, `expo-sqlite`. Adding it (native module) requires a development build, not Expo Go (per `AGENTS.md`).

## Requirements

### Active

- Offline worksite, worker, and attendance management (see `REQUIREMENTS.md`)
- Reports + attendance-% math (off_day excluded, half_day = 0.5)
- CSV/PDF export and manual JSON backup/restore
- Design-contract UI per `design.md`

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
*Last updated: 2026-10-02 after project initialization*
