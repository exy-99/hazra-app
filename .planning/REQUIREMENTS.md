# Requirements — Hazra Attendance (v1 / MVP)

**Scope:** v1 MVP from `PRD_Attendance_App.md`. All requirements are user-centric and testable. Traceability to phases is filled by `ROADMAP.md`.

## v1 Requirements

### Worksites (WS)

- [ ] **WS-01**: Manager can add a worksite with name (required), type (Office/Construction/School/Farm/Other), and optional address.
- [ ] **WS-02**: Manager can edit an existing worksite's details.
- [ ] **WS-03**: Manager can remove a worksite via soft-delete — it disappears from active lists but historical attendance is preserved.
- [ ] **WS-04**: Manager can view the list of all active worksites.

### Workers (WK)

- [ ] **WK-01**: Manager can add a worker with name (required), assigned worksite (required), optional role and phone.
- [ ] **WK-02**: Manager can edit an existing worker's details, including reassignment to another worksite.
- [ ] **WK-03**: Manager can remove a worker via soft-delete — hidden from active lists, history preserved.
- [ ] **WK-04**: Manager can view and filter the worker list by worksite.

### Attendance (AT)

- [ ] **AT-01**: Manager can mark each worker's attendance with present / absent / half_day / off_day.
- [ ] **AT-02**: Manager can select any past or present date to mark or edit attendance.
- [ ] **AT-03**: Manager can attach an optional text note to any attendance entry.
- [ ] **AT-04**: Manager can edit a previously recorded attendance entry (corrections update in place).
- [ ] **AT-05**: The app enforces one attendance record per (worker, date); edits overwrite, never duplicate.

### Worker Profile / History (PR)

- [ ] **PR-01**: Manager can view a single worker's full attendance history.
- [ ] **PR-02**: Manager can see an individual attendance % over a selected period (off_day excluded from denominator, half_day counted as 0.5).

### Reports (RP)

- [ ] **RP-01**: Manager sees today's quick stats on Home — attendance % plus present/absent/half_day/off_day counts.
- [ ] **RP-02**: Manager can view attendance % per worker over a custom date range.
- [ ] **RP-03**: Manager can view worksite-level attendance trends over time.
- [ ] **RP-04**: Manager can see a highlight list of frequently absent workers.
- [ ] **RP-05**: Manager can filter all reports by worksite and/or date range.

### Export (EX)

- [ ] **EX-01**: Manager can export a single worker's attendance history (CSV and/or PDF).
- [ ] **EX-02**: Manager can export a full worksite's attendance register for a chosen month (CSV and/or PDF).
- [ ] **EX-03**: Exported files are saved to the device Downloads folder and open correctly outside the app.

### Backup & Restore (BK)

- [ ] **BK-01**: Manager can manually back up the entire local database to a file in Downloads.
- [ ] **BK-02**: Manager can manually restore data from a previously saved backup file.
- [ ] **BK-03**: Backup includes worksites, workers, and attendance (including soft-deleted rows); restore replaces local data.

### Platform / Non-Functional (NF)

- [ ] **NF-01**: The app works fully offline — no internet connection required at any point.
- [ ] **NF-02**: All data is stored locally on-device (SQLite).
- [ ] **NF-03**: Single manager, single device — no authentication/login.
- [ ] **NF-04**: Clean, minimal, fast UI usable with zero training.
- [ ] **NF-05**: Zero data loss across app updates (soft-delete + stable schema with a `user_version` migration hook).
- [ ] **NF-06**: Exports (CSV/PDF) and backups open/parse correctly outside the app.

### Design System Contract (DS)

- [x] **DS-01**: Four attendance statuses with four fixed colors, used nowhere else; `off_day` is the only neutral status. (done 2026-10-03 in 01-01: `src/constants/status.ts`)
- [ ] **DS-02**: Flat design — no shadows, gradients, glassmorphism; separate with 1px borders and surface/background contrast.
- [ ] **DS-03**: No hardcoded hex in components — always import a token; teal = structure, orange = actions, status colors = status only.
- [ ] **DS-04**: Inter typography with the defined scale (display/h1/h2/body/label/caption); nothing below 13px; `tabular-nums` on numerals.
- [ ] **DS-05**: All tap targets ≥ 44×44px with ≥ 8px gaps and 16px screen gutters.
- [ ] **DS-06**: Every list has an empty state; every data-loading screen has a skeleton (no blank flash).
- [ ] **DS-07**: Accessibility — every status pill labeled (never color alone), contrast ≥ 4.5:1 in both modes, reduced-motion respected.
- [ ] **DS-08**: Press feedback (ripple + opacity) on every pressable; `Pressable` only, no new `TouchableOpacity`; 150–300ms transitions.
- [ ] **DS-09**: Bottom tab bar with ≤ 4 tabs (Home · Attendance · Workers · Reports); active = primary, inactive = mutedForeground.

### Release (REL)

- [ ] **REL-01**: The app installs and runs as a production build independent of the dev environment (SQLite paths, filesystem, sharing verified in a release build).

## v2 / Deferred

- Cloud backup/sync (opt-in, still private)
- Multiple worksites per worker
- Geofencing auto-attendance
- Employee-side app
- PIN/biometric app lock
- Multi-manager / multi-tenant
- Payroll integration
- Automatic/scheduled backup

## Out of Scope (v1, explicit)

- Employee login or self check-in — single manager device (PRD §4)
- GPS/geofencing — PRD §4
- Biometrics/selfie verification — PRD §4
- Payroll calculation — PRD §4
- Cloud sync / multi-device — PRD §4
- Shift scheduling / overtime — PRD §4

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WS-01..04, WK-01..04 | Phase 2 | Pending |
| AT-01..05, NF-04 | Phase 3 | Pending |
| PR-01..02 | Phase 4 | Pending |
| RP-01..05 | Phase 5 | Pending |
| EX-01..03, NF-06 | Phase 6 | Pending |
| BK-01..03 | Phase 7 | Pending |
| DS-01..04, NF-01..03, NF-05 | Phase 1 | Pending |
| DS-05..09 | Phase 8 | Pending |
| REL-01 | Phase 9 | Pending |
