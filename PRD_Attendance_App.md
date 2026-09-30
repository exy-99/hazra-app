# Product Requirements Document (PRD)
## Offline Staff Attendance Register App

**Version:** 1.0 (v1 / MVP)
**Platform:** Android & iOS (React Native + Expo)
**Date:** August 31, 2026

---

## 1. Overview

A simple, fully offline mobile app that lets a manager or supervisor manually record and track daily attendance for workers across one or more worksites (office, construction site, school, farm, etc.). The app replaces paper registers or ad-hoc tracking (e.g., WhatsApp, notebooks) with a fast, structured, private tool that stays entirely on the manager's device.

## 2. Problem Statement

Small business owners, contractors, and supervisors currently track worker attendance manually — on paper registers or informal channels — which is error-prone, hard to search, and impossible to analyze over time. Existing attendance apps in the market are often overloaded with features (GPS tracking, payroll, biometric verification, selfie capture) that require employee-side apps, internet connectivity, and complex setup — overkill for a manager who just wants a simple daily register.

## 3. Goals

- Let a manager record daily attendance for each worker in a few taps
- Keep the tool fully private — all data stays on the manager's own device, no cloud, no third-party access
- Provide enough reporting (stats, export) to replace payroll handoff paperwork
- Be simple enough to use with zero training

## 4. Non-Goals (Out of Scope for v1)

- No employee-facing app, login, or self check-in
- No GPS / geofencing / location-based auto-attendance
- No biometric or selfie verification
- No payroll calculation or salary management
- No cloud sync or multi-device access
- No multi-tenant / multi-manager support (single manager, single device)
- No shift scheduling or overtime tracking

These may be considered for future versions but are explicitly excluded from v1.

## 5. Target User

- **Primary user:** A single manager/supervisor/small business owner (e.g., contractor, shop owner, factory supervisor, school administrator) who manages a small-to-medium team across one or more worksites.
- **Not a user of the app:** Workers/employees themselves — they have no interaction with the app at all.

## 6. Key User Stories

1. As a manager, I want to add a worksite so I can organize workers by location.
2. As a manager, I want to add/edit/remove workers so my roster stays current.
3. As a manager, I want to mark each worker's attendance status for a given day in a few taps.
4. As a manager, I want to correct a past attendance entry in case I made a mistake.
5. As a manager, I want to see attendance stats and trends so I can spot patterns (e.g., frequent absences).
6. As a manager, I want to export attendance records so I can hand them off for payroll.
7. As a manager, I want to back up my data so I don't lose everything if I lose or change my phone.

## 7. Features & Requirements

### 7.1 Worksite Management
- Add a worksite: name (required), type (Office / Construction / School / Farm / Other), address (optional)
- Edit worksite details
- Remove a worksite (soft-delete: hidden from active lists, historical data preserved)
- View list of all active worksites

### 7.2 Worker Management
- Add a worker: name (required), assigned worksite (required), role/designation (optional), phone number (optional)
- Edit worker details
- Remove a worker (soft-delete: hidden from active lists, historical data preserved)
- View/filter worker list by worksite

### 7.3 Attendance Marking
- Mark attendance per worker per day with one of the following statuses:
  - **Present**
  - **Absent**
  - **Half-day**
  - **Off-day / Holiday**
- Select any date (past or present) to mark or edit attendance
- Add an optional text note per attendance entry (e.g., "left early", "public holiday")
- Edit previously recorded attendance (corrections)
- Enforce one attendance record per worker per date (editing overwrites, not duplicates)

### 7.4 Worker Profile / History
- View a single worker's full attendance history
- Display individual attendance stats (e.g., attendance % over a selected period, excluding Off-day/Holiday from the calculation base — see Section 9)

### 7.5 Reports & Stats Dashboard
- Home screen quick stats: today's attendance % (Present + Half-day count vs. total workers), present/absent/half-day/off-day counts
- Attendance % per worker over a custom date range
- Worksite-level stats: attendance trends over time
- Highlight frequently absent workers
- Filter all reports by worksite and/or date range

### 7.6 Export
- Export a single worker's attendance history (CSV and/or PDF)
- Export a full worksite's attendance register for a given month (CSV and/or PDF)
- Save exported file to the device's Downloads folder

### 7.7 Backup & Restore
- Manual backup: export the entire local database to a file, saved to Downloads
- Manual restore: reload data from a previously saved backup file
- No automatic/scheduled backup in v1 — user-initiated only

### 7.8 General / Non-Functional
- App works fully offline — no internet connection required at any point
- All data stored locally on-device (SQLite)
- Single manager, single device — no authentication/login required in v1
- Clean, minimal, fast UI — usable without training or a manual

## 8. Data Model (Summary)

**Worksites** — id, name, type, address, created_at, is_active

**Workers** — id, name, worksite_id (FK), role, phone, created_at, is_active

**Attendance** — id, worker_id (FK), date, status (`present` / `absent` / `half_day` / `off_day`), note, updated_at
- Unique constraint on (worker_id, date)

## 9. Business Rules

- Attendance percentage calculations should treat **Off-day/Holiday** as excluded from the denominator (i.e., not counted as either present or absent), since it represents a day the worker wasn't expected to work — not an attendance failure.
- Half-day counts as 0.5 toward attendance percentage calculations.
- Soft-deleted worksites/workers are excluded from all active lists and new attendance entry screens, but their historical attendance records remain intact and viewable/exportable.

## 10. Technical Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo |
| Local Database | expo-sqlite |
| Navigation | React Navigation |
| Date handling | dayjs |
| File export/backup | expo-file-system, expo-sharing / expo-media-library |
| PDF generation | expo-print |

## 11. Success Metrics (for v1)

- Manager can add a worksite, add workers, and mark a full day's attendance in under 2 minutes
- Zero data loss across app updates (soft-delete + stable schema)
- Export and backup functions produce files that open correctly outside the app (CSV in Excel/Sheets, PDF viewable)

## 12. Future Considerations (Post-v1, Not Committed)

- Cloud backup/sync option (opt-in, still private per manager)
- Multiple worksites per worker
- Geofencing-based automatic attendance
- Employee-side lightweight app
- PIN/biometric app lock
- Multi-manager/multi-tenant support
- Payroll integration
