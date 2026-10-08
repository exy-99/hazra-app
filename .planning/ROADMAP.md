# Roadmap — Hazra Attendance

**Milestone:** v1.0 — Offline Staff Attendance Register (MVP)
**Source of truth:** `PRD_Attendance_App.md`, `design.md`, `AGENTS.md`
**Reconciled stack:** Expo SDK 57 · Expo Router · TypeScript strict · `expo-sqlite`
**Granularity:** Standard (9 phases)

> Phase numbering below is GSD-sequential (1–9). Parenthetical maps to the legacy
> `build_plan.md` numbering (0–8). `build_plan.md`'s React Navigation / JS stack is
> **stale** — see `AGENTS.md`. All work targets the real Expo Router + TS repo.

---

## Phase 1: Foundation & Data Layer
*(legacy Phase 0 — Scaffold & Foundation, minus the scaffold that already exists)*

**Goal:** the data contract and design tokens are in place and the app boots with SQLite initializing without error.
**Depends on:** none
**Requirements:** DS-01, DS-02, DS-03, DS-04, NF-01, NF-02, NF-03, NF-05
**Status:** Complete — 2026-10-03 (8/8 plans; 32/32 must-haves verified; on-device proofs deferred to Phase 9; review CR-01/CR-02 fixes applied)

**Success criteria:**
1. `npx tsc --noEmit` exits 0.
2. The app boots to the Home tab with no red screen; SQLite initializes and a throwaway row survives an app restart.
3. `src/constants/theme.ts` exposes the product color/token contract (teal/orange + 4 status colors) and `useTheme()` resolves in light and dark mode.
4. `upsertAttendance` called twice for one (worker, date) leaves exactly 1 row.
5. No hardcoded hex in any product component; no network/account code exists.

**UI hint:** yes

**Plan progress:**
- [x] 01-01 deps + status contract (DS-01) — done 2026-10-03
- [x] 01-02 theme tokens (DS-03, DS-04) — done 2026-10-03
- [x] 01-03 date/ID utils — done 2026-10-03
- [x] 01-04 db types + schema (NF-02, NF-05) — done 2026-10-03
- [x] 01-05 worksite + worker DAO — done 2026-10-03
- [x] 01-06 attendance DAO — done 2026-10-03
- [x] 01-07 4-tab shell + routes (NF-01, NF-03) — done 2026-10-03
- [x] 01-08 db init + EmptyState — done 2026-10-03 (tsc + phase-wide gates pass; on-device restart proof deferred to Phase 9 by user approval)

---

## Phase 2: Worksites & Workers
*(legacy Phase 1)*

**Goal:** the manager can fully build and maintain a roster across multiple worksites, with validation and soft delete.
**Depends on:** Phase 1
**Requirements:** WS-01, WS-02, WS-03, WS-04, WK-01, WK-02, WK-03, WK-04

**Success criteria:**
1. Manager can add 2 worksites and 5+ workers split across them; restart restores everything.
2. Worksite and worker forms show visible labels, inline required-field errors, and an orange full-width Save.
3. Removing a worker hides it from all active lists/pickers but its history remains viewable.
4. Worker list filters by worksite; reassigning a worker updates the filter immediately.
5. Removing a worksite with active workers surfaces the worker count (no silent cascade).

**UI hint:** yes

**Plans:** 7 plans

**Status:** Complete — 2026-10-06 (7/7 plans; 15/15 must-haves verified; on-device proofs deferred to Phase 9; review CR-01/CR-02 fixed post-verification)

**Plan progress:**
- [x] 02-01 nav foundation — (tabs) group + root Stack (reachability for WS-04, WK-04) — done 2026-10-06
- [x] 02-02 worksite list + counts (WS-04) — done 2026-10-05
- [x] 02-03 worksite form + FormField (WS-01, WS-02) — done 2026-10-06
- [x] 02-04 worker list + worksite filter (WK-04) — done 2026-10-06
- [x] 02-05 worker form + reassign (WK-01, WK-02) — done 2026-10-06
- [x] 02-06 worksite delete + ConfirmDialog (WS-03) — done 2026-10-06
- [x] 02-07 worker delete + phase gates (WK-03) — done 2026-10-06

---

## Phase 3: Attendance Marking
*(legacy Phase 2)*

**Goal:** the core daily workflow works smoothly — one tap per worker, correct date handling, optional notes, no duplicate rows.
**Depends on:** Phase 2
**Requirements:** AT-01, AT-02, AT-03, AT-04, AT-05, NF-04

**Success criteria:**
1. Manager can mark a full day for every active worker; statuses persist across restart.
2. Tapping a status pill cycles present → absent → half_day → off_day → present with no modal.
3. Rapid double-tap produces exactly one row and advances exactly one step.
4. Date strip + Today jump show independent registers per date; a "pick a date" affordance goes beyond the strip.
5. Notes save through upsert; changing status preserves the note; clearing stores `null`.
6. Worksite filter retains the selected date and the worker's marked status.

**UI hint:** yes

**Plans:** 5 plans

**Status:** Complete — 03-01..03-05 done 2026-10-07 (verification pending)

**Plan progress:**
- [x] 03-01 date strip + selectedDate host (AT-02 date-selection) — done 2026-10-07
- [x] 03-02 status pill + local marks slice (AT-01 visual) — done 2026-10-07
- [x] 03-03 DAO-backed register + pending guard (AT-04, AT-05) — done 2026-10-07
- [x] 03-04 per-entry notes via upsert (AT-03) — done 2026-10-07
- [x] 03-05 worksite filter + counts header (AT-01..05, NF-04 retention/counts) — done 2026-10-07

---

## Phase 4: Worker Profile & History
*(legacy Phase 3)*

**Goal:** a trustworthy per-worker record and the attendance-% math every later report depends on.
**Depends on:** Phase 3
**Requirements:** PR-01, PR-02

**Success criteria:**
1. `summarize()` matches PRD §9 by hand: 20 present, 5 absent, 3 half_day, 2 off_day → pct 76.79 (off_day excluded).
2. Zero-denominator cases render `—`, never `NaN`, `Infinity`, or `0%`.
3. Profile shows a period selector that recomputes ring + counts together; ring turns `accent` below 75%.
4. History survives soft-delete — a removed worker's profile is still reachable.

**UI hint:** yes

**Plans:** 3 plans

**Plan progress:**
- [x] 04-01 summarize() + hand-check (PR-02 math) — done 2026-10-08
- [x] 04-02 profile shell — header, chips, ring, stats, states (PR-02 UI) — done 2026-10-08
- [x] 04-03 history list + row retarget (PR-01) — done 2026-10-08

---

## Phase 5: Home Dashboard & Reports
*(legacy Phase 4)*

**Goal:** answer "how did today go?" and "who's been unreliable this month?" in a few taps.
**Depends on:** Phase 4
**Requirements:** RP-01, RP-02, RP-03, RP-04, RP-05

**Success criteria:**
1. Home hero shows the attendance ring, today's date, and the four-status pill row with counts.
2. Home has exactly one orange CTA (Mark attendance).
3. Reports support date-range + worksite filters and show per-worker % over the range.
4. "Lowest attendance" highlight list matches a manual count of a 3-worker sample.
5. Charts/legends are labeled; report numbers reconcile exactly with the register.

**UI hint:** yes

---

## Phase 6: Export (CSV / PDF)
*(legacy Phase 5)*

**Goal:** attendance can leave the app in a payroll-usable form and open correctly outside it.
**Depends on:** Phase 5
**Requirements:** EX-01, EX-02, EX-03, NF-06

**Success criteria:**
1. CSV serializer is RFC-4180 correct — a note containing `left early, told "back tomorrow"` still parses to the right column count in Excel/Sheets.
2. Per-worker export and per-worksite monthly register both produce files in Downloads.
3. Exported CSV/PDF open correctly on a second device after transfer.

**UI hint:** yes

---

## Phase 7: Backup & Restore
*(legacy Phase 6)*

**Goal:** the manager's only safety net works reliably, and a bad file cannot destroy good data.
**Depends on:** Phase 6
**Requirements:** BK-01, BK-02, BK-03

**Success criteria:**
1. Backup writes `{ version, exported_at, worksites, workers, attendance }` including inactive rows.
2. Restore validates the entire payload before touching the DB, then replaces all data in one transaction.
3. Truncated JSON, a missing `attendance` key, and an unknown `version` each error cleanly and leave existing data intact.
4. A destructive-colored warning precedes restore; cancel is the default.
5. Round-trip test (backup → clear → restore) reproduces counts and a sample of statuses.

**UI hint:** yes

---

## Phase 8: Polish & Edge Cases
*(legacy Phase 7)*

**Goal:** it feels finished, not prototyped.
**Depends on:** Phase 7
**Requirements:** DS-05, DS-06, DS-07, DS-08, DS-09

**Success criteria:**
1. Empty states match the `design.md` §7.5 copy table exactly; loading skeletons replace blank flashes.
2. A11y pass: icon-only controls have `accessibilityLabel`, focus rings visible, contrast ≥ 4.5:1 checked independently in dark mode.
3. Layout pass: 16px gutters, ≥8px tap gaps, safe areas respected, `tabular-nums` on all counts, `FlatList` + `keyExtractor` + memoized rows.
4. Inter loaded via `@expo-google-fonts/inter`; nothing below 13px.
5. Icon + splash wired into `app.json`; verified at 360dp width on low-end Android.

**UI hint:** yes

---

## Phase 9: Build & Ship
*(legacy Phase 8)*

**Goal:** a real installable app independent of the dev environment.
**Depends on:** Phase 8
**Requirements:** REL-01

**Success criteria:**
1. `eas.json` has a production build profile.
2. `eas build --platform android` produces an installable artifact.
3. The production build (not Expo Go) passes an on-device test of SQLite paths, file-system access, and sharing.
4. Distribution decision recorded (sideload APK vs. Play Store).

**UI hint:** no

---

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| DS-01..04, NF-01..03, NF-05 | 1 |
| WS-01..04, WK-01..04 | 2 |
| AT-01..05, NF-04 | 3 |
| PR-01..02 | 4 |
| RP-01..05 | 5 |
| EX-01..03, NF-06 | 6 |
| BK-01..03 | 7 |
| DS-05..09 | 8 |
| REL-01 | 9 |

**Coverage:** 41 / 41 v1 requirements mapped. 9 / 9 phases planned.
