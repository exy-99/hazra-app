# Build Plan — Offline Staff Attendance Register (Hazra Attendance)

**Goal:** Ship a fully offline, single-manager React Native + Expo app that records daily worker attendance across worksites, reports stats, exports CSV/PDF, and backs up/restores all local data — with no network dependency at any point.

**Architecture:** Expo managed app. All state lives in on-device SQLite (`expo-sqlite`) behind a small data-access layer (`src/db/*`); screens never issue SQL directly. React Navigation (bottom tabs + native-stack drill-downs) hosts screens. A theme module (`src/theme/*`) implements `design.md` tokens and is the only source of color, type, and spacing values. Pure helpers in `src/utils/*` hold date, ID, attendance-math, and CSV logic.

**Tech Stack:** `expo`, `react-native`, `expo-sqlite`, `@react-navigation/native` + `/native-stack` + `/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `dayjs`, `expo-file-system`, `expo-sharing`, `expo-print`, `expo-crypto`, `expo-font`, `@expo-google-fonts/inter`, `lucide-react-native` + `react-native-svg`, `expo-status-bar`.

**Spec:** `PRD_Attendance_App.md` (product source of truth), `design.md` (visual contract), `AGENTS.md` (locked constraints).

**Verification model:** Manual, on a real device. Every task ends with explicit tap-through steps and a commit. No test framework is introduced in v1 (per chosen scope).

---

## Current State (corrected)

This repository is **planning-only**. It contains four documents — `PRD_Attendance_App.md`, `design.md`, `build_plan.md`, `AGENTS.md` — and **no application code**: no `package.json`, no manifest, no `app.json`, no scaffold, no README, no tests.

The previous revision of this file described an `attendance-app/` scaffold as "already built" and repeatedly referred to "currently" implemented behavior. **None of that exists.** Every line that said "confirm X works", "add X to the existing scaffold", or "currently only per-worker export exists" was describing software that was never written. This rewrite starts from zero, replaces those false premises with explicit build tasks, and folds in `design.md`, which the previous plan ignored entirely.

**Phase 0 is therefore a from-scratch scaffold task, not a verification task.**

---

## Global Constraints

Copied verbatim from `AGENTS.md`; every task below inherits these.

- The product is a React Native + Expo mobile app that must work fully offline. Store all user data on-device in SQLite; **do not** add authentication, cloud services, analytics, or network-dependent flows.
- The app serves **one manager on one device**. Workers never interact with it.
- Worksites and workers use **soft deletion** so historical attendance remains available. Exclude inactive records from active lists and new attendance entry screens.
- Enforce **one attendance row per `(worker_id, date)`**; corrections update the existing row rather than creating duplicates.
- Attendance statuses are `present`, `absent`, `half_day`, `off_day`. Percentage calculations count `half_day` as `0.5` and **exclude `off_day` from the denominator**.
- Backup/restore is **manual** and must include worksites, workers, and attendance. Restore **replaces** local data; export/backup files must remain usable outside the app.
- **Keep out of v1:** GPS/geofencing, biometrics/selfies, payroll, cloud sync, employee accounts, multiple managers, shifts, overtime.

Design-side constraints from `design.md` that bind every UI task:

- Never hardcode a hex in a component — always import a token from `src/theme`.
- Four attendance statuses, four fixed colors, used nowhere else. `off_day` is the only neutral status.
- Flat design: no shadows, no gradients, no glassmorphism. Separate with 1px `border` and surface/background contrast.
- `Pressable` only — no `TouchableOpacity` in new code.
- Every status pill carries its label text; never rely on color alone.
- `h1` weight 700 for hero numbers, `tabular-nums` on every numeral that can change.
- Every list has an empty state; every data-loading screen has a skeleton (no blank flash).
- Minimum tap target 44×44px; 8px minimum gap between adjacent targets; 16px screen gutter.

---

## Open Decisions (need a human call — resolve at the owning task, not silently)

These are genuinely ambiguous in the spec. Each is called out again at the task that forces it.

1. **Home "today's attendance %" definition.** PRD §7.5 says "Present + Half-day count vs. total workers"; §9 says half-day counts 0.5 and `off_day` is excluded. Proposed: `numerator = present + 0.5 × half_day`, `denominator = active workers − workers marked off_day today`; **unmarked workers count as 0** (nudges the manager to finish the register). Confirm in Task 4.1.
2. **Removing a worksite that still has active workers.** Proposed: **block** with a message ("Reassign or remove N workers first") rather than cascade-soft-delete — cascade silently hides workers the manager may not expect to lose. Confirm in Phase 7.
3. **Worker reassignment to another worksite.** Historical attendance is unaffected (it's keyed by worker, not worksite). The attendance screen's worksite filter uses the worker's **current** worksite. Confirm in Task 2.5.
4. **Export formats.** PRD §7.6 says "CSV and/or PDF". Proposed: **CSV always** (payroll-friendly, opens in Excel/Sheets) with PDF as an optional add-on. Confirm in Phase 5.
5. **TypeScript vs JavaScript.** Proposed: **JavaScript + JSDoc** typedefs in `src/db/types.js`, matching the `design.md` snippets. Confirm in Task 0.1.

---

## Review Focus

These are the input classes and failure modes the spec implies but no task's happy path exercises. In manual-only mode, each one gets an explicit verification step on its owning task rather than an automated test.

1. **Zero-denominator percentage** — a worker whose only records are `off_day`, or who has no records at all. Expected: the percentage shows an em-dash (`—`), never `NaN`, `Infinity`, or `0%`. Owning task: **3.1**.
2. **Local-date key around midnight / timezone edges** — marking attendance at 23:58 vs 00:02, or on a device set to UTC. Expected: one row lands on the correct local calendar date; a late-night mark and an early-morning correction do **not** collide or split. Owning task: **0.5**.
3. **Rapid double-tap on the status pill** — two upserts racing for the same `(worker_id, date)`. Expected: no duplicate row, no crash, toggle advances exactly one step per press. Owning task: **2.1**.
4. **Restore from a malformed or partial backup** — truncated JSON, missing `attendance` array, or a backup from a different schema version. Expected: the app refuses and leaves existing data intact; it never half-wipes and then errors. Owning task: **Phase 6**.
5. **CSV values containing commas, quotes, or newlines** — e.g. a note like `"left early, told ""back tomorrow"""`. Expected: the file still parses to the correct number of columns when opened in Excel/Sheets. Owning task: **Phase 5**.

---

## Phase Roadmap

| Phase | Deliverable | Detail |
|---|---|---|
| **0 — Scaffold & Foundation** | Runnable Expo app, design tokens, SQLite schema + data-access layer, navigation shell | **Detailed** |
| **1 — Worksites & Workers** | Full roster management with soft delete, validation, confirmations | **Detailed** |
| **2 — Attendance Marking** | The core daily workflow: tap-to-cycle, date navigation, notes, worksite filter | **Detailed** |
| **3 — Worker Profile & History** | Per-worker history + trustworthy attendance-% math | **Detailed** |
| **4 — Home Dashboard & Reports** | Attendance ring, quick stats, date/worksite-filtered reports, "lowest attendance" | Outline |
| **5 — Export (CSV/PDF)** | Per-worker and per-worksite-month exports to Downloads | Outline |
| **6 — Backup & Restore** | Manual full-data backup file and replace-all restore | Outline |
| **7 — Polish & Edge Cases** | Styling pass, empty/loading states, worksite-removal rule, icon/splash | Outline |
| **8 — Build & Ship** | EAS production build, on-device test, distribution decision | Outline |

**Non-negotiable for the product to exist at all:** Phases 0 → 1 → 2 → 3. Phases 4–6 are the v1 value-add and may ship as a fast-follow if time is short, because the daily mark-attendance loop is what the manager actually lives in. Phase 7 gets at least a light pass before any real user touches it.

---
## Phase 0 — Scaffold & Foundation

**Goal:** a runnable app on a real device with the database initializing, the theme in place, and all screens reachable as placeholders. No feature is "verified" here — it is built here.

**Exit criteria:** app opens in Expo Go (or a dev build), the DB initializes without error, all four tabs navigate, and the theme resolves in light and dark mode.

---

### Task 0.1: Create the Expo app and install dependencies

**Files:**
- Create: `package.json`, `app.json`, `babel.config.js`, `App.js`, `assets/`, `.gitignore` (at repo root, beside the existing `.md` docs)
- Modify: `package.json` (add scripts if needed)

**Interfaces:**
- Produces: a working `npx expo start` dev loop and the full dependency set every later task imports.

- [ ] **Step 1: Scaffold around the existing docs**

The repo root is non-empty (it holds the four `.md` files), so do not scaffold into it directly. From the repo root's parent, run:

```
npx create-expo-app@latest hazra-tmp --template blank
```

Then copy `package.json`, `app.json`, `babel.config.js`, `App.js`, `assets/`, and `.gitignore` from `hazra-tmp/` into the repo root, and delete `hazra-tmp/`. Do **not** overwrite the existing `.md` files.

- [ ] **Step 2: Install the v1 dependency set**

```
npx expo install expo-sqlite @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-svg expo-file-system expo-sharing expo-print expo-crypto expo-font expo-status-bar
npm install dayjs lucide-react-native @expo-google-fonts/inter
```

- [ ] **Step 3: Boot it**

Run `npx expo start`, open in Expo Go on a real device. Expected: the default blank screen renders.

- [ ] **Step 4: Probe expo-sqlite availability**

`expo-sqlite` can be unavailable or behave differently inside Expo Go on some SDKs. Before building on it, confirm it loads: temporarily import it in `App.js`, open a throwaway in-memory DB, run `SELECT 1`, and log the result. Expected: `1` is logged and no red screen appears.

- [ ] **Step 5: Record the outcome**

If Step 4 fails inside Expo Go, add `expo-dev-client` and switch the dev loop to a development build **now**, before any DB work — every later phase depends on SQLite. Commit whichever path worked so the decision is not re-litigated later.

- [ ] **Step 6: Initialize version control and commit**

Run `git init` (the repo is not currently a git repo), verify `.gitignore` excludes `node_modules/`, `.expo/`, `dist/`, and `*.local`, then commit the scaffold.

---

### Task 0.2: Design tokens and theme

**Files:**
- Create: `src/theme/colors.js`, `src/theme/typography.js`, `src/theme/spacing.js`, `src/theme/status.js`, `src/theme/index.js`, `src/theme/ThemeProvider.js`

**Interfaces:**
- `colors.js` — exports `light` and `dark`, copied **verbatim** from `design.md` §3.
- `typography.js` — exports a `type` map: `display` (48/52, 700), `h1` (28/34, 700), `h2` (20/26, 600), `body` (16/24, 400), `label` (14/20, 600), `caption` (13/18, 500).
- `spacing.js` — exports `space = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 }` and `radius = { sm:8, md:12, lg:16, pill:999 }`.
- `status.js` — exports `STATUS` keyed by the four statuses, each `{ label, solid, tintBg, text }` using the exact hexes in `design.md` §4, plus `CYCLE = ['present','absent','half_day','off_day']`.
- `ThemeProvider.js` — exports a `ThemeProvider` and a `useTheme()` hook returning `{ colors, type, space, radius, isDark }`, where `colors` follows `useColorScheme()`.

- [ ] **Step 1:** Create `colors.js` by pasting the `light` and `dark` objects from `design.md` §3 unchanged. No reformatting, no renaming keys.
- [ ] **Step 2:** Create `typography.js`, `spacing.js`, and `status.js` exactly as specified in the Interfaces block above.
- [ ] **Step 3:** Implement `ThemeProvider.js`: call `useColorScheme()`, pick `light` or `dark`, memoize the context value, and expose `useTheme()` that throws a clear error if used outside the provider.
- [ ] **Step 4: Verify on device** — wrap `App` in `ThemeProvider`, render one sentence using `type.display` and `colors.foreground`. Toggle the device between light and dark mode and confirm the text restyles. Expected: both modes readable, no hardcoded hex anywhere in `App.js`.
- [ ] **Step 5: Commit.**

---

### Task 0.3: Database layer and schema

**Files:**
- Create: `src/db/types.js`, `src/db/index.js`, `src/db/worksites.js`, `src/db/workers.js`, `src/db/attendance.js`

**Interfaces:**
- `types.js` — JSDoc typedefs only (no runtime code): `Worksite`, `Worker`, `AttendanceEntry`, `AttendanceStatus`.
- `index.js` — exports `initDatabase(): Promise<void>` and `getDb(): SQLite.SQLiteDatabase`. `initDatabase` runs `PRAGMA foreign_keys = ON`, then `CREATE TABLE IF NOT EXISTS` for all three tables, then a `PRAGMA user_version` check that is a no-op at version 0 (the migration hook for later schema changes).
- Table shapes (exact columns, matching PRD §8):
  - `worksites(id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1)`
  - `workers(id TEXT PRIMARY KEY, name TEXT NOT NULL, worksite_id TEXT NOT NULL REFERENCES worksites(id), role TEXT, phone TEXT, created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1)`
  - `attendance(id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers(id), date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('present','absent','half_day','off_day')), note TEXT, updated_at TEXT NOT NULL, UNIQUE(worker_id, date))`
- `worksites.js` — `listWorksites()`, `getWorksite(id)`, `createWorksite({name,type,address})`, `updateWorksite(id, patch)`, `deactivateWorksite(id)`.
- `workers.js` — `listWorkers({ worksiteId, includeInactive = false })`, `getWorker(id)`, `createWorker({name,worksiteId,role,phone})`, `updateWorker(id, patch)`, `deactivateWorker(id)`.
- `attendance.js` — `upsertAttendance({workerId, date, status, note})`, `getAttendanceForDate(date, { worksiteId })`, `getAttendanceForWorker(workerId, { from, to })`, `getDailyCounts(date)`. `upsertAttendance` uses `INSERT ... ON CONFLICT(worker_id, date) DO UPDATE SET status=excluded.status, note=excluded.note, updated_at=excluded.updated_at`.

- [ ] **Step 1:** Write `types.js` typedefs so later files can reference the shapes without TypeScript.
- [ ] **Step 2:** Implement `index.js` with the three `CREATE TABLE IF NOT EXISTS` statements and the `user_version` hook. `getDb()` returns a cached singleton, opening it lazily.
- [ ] **Step 3:** Implement the three data-access modules. `deactivateWorksite`/`deactivateWorker` set `is_active = 0`; they never `DELETE`. All list functions filter `is_active = 1` unless `includeInactive` is passed.
- [ ] **Step 4: Verify on device** — from a temporary button in `App.js`, call `initDatabase()`, insert one worksite, one worker, and one attendance row, log `SELECT` results, then restart the app and log again. Expected: after restart the rows are still present, proving persistence across launches.
- [ ] **Step 5:** Call `upsertAttendance` twice for the same `(worker_id, date)` with different statuses. Expected: a `SELECT COUNT(*)` returns `1`, and the status is the second value. This is the Review Focus #3 constraint check at the DB level.
- [ ] **Step 6: Commit.**

---

### Task 0.4: Navigation shell and placeholder screens

**Files:**
- Create: `src/navigation/RootNavigator.js`, `src/screens/HomeScreen.js`, `src/screens/MarkAttendanceScreen.js`, `src/screens/WorkersScreen.js`, `src/screens/ReportsScreen.js`, `src/screens/WorksitesScreen.js`, `src/screens/WorksiteFormScreen.js`, `src/screens/WorkerFormScreen.js`, `src/screens/WorkerProfileScreen.js`, `src/screens/ExportScreen.js`, `src/screens/BackupScreen.js`
- Modify: `App.js`

**Interfaces:**
- `RootNavigator.js` — default export. A bottom-tab navigator with exactly four tabs: **Home · Attendance · Workers · Reports** (per `design.md` §8). Each tab hosts a native-stack so drill-downs (forms, profile, export, backup) push with a back arrow. Active tab icon/label uses `colors.primary`; inactive uses `colors.mutedForeground`.
- Every screen is a placeholder in this task: screen title plus a one-line "not built yet" body.

- [ ] **Step 1:** Wrap the app in `SafeAreaProvider` → `ThemeProvider` → `NavigationContainer` → `RootNavigator`.
- [ ] **Step 2:** Build the four-tab structure with Lucide icons (`Home`, `ClipboardCheck`, `Users`, `BarChart3`) and a themed tab bar. Do not exceed four tabs.
- [ ] **Step 3:** Create all eleven screen files as placeholders so later tasks only edit, never create-and-wire.
- [ ] **Step 4: Verify on device** — start the app, tap all four tabs, and push one drill-down from each. Expected: no crash, back arrow returns, active tab is teal in both light and dark mode.
- [ ] **Step 5: Commit.**

---

### Task 0.5: Shared date and ID utilities

**Files:**
- Create: `src/utils/dates.js`, `src/utils/ids.js`

**Interfaces:**
- `dates.js` — `todayKey()` → local `YYYY-MM-DD`; `toDateKey(date)`; `addDays(key, n)`; `formatDisplay(key, fmt = 'DD MMM YYYY')`; `lastNDays(n)`. All built on `dayjs` with no UTC conversion.
- `ids.js` — `newId()` returning `Crypto.randomUUID()` from `expo-crypto`.

- [ ] **Step 1:** Implement both modules. `todayKey()` must use `dayjs().format('YYYY-MM-DD')` (local), never `toISOString().slice(0,10)` — the latter is UTC and shifts the date for users behind UTC after ~midnight.
- [ ] **Step 2: Verify Review Focus #2 on device** — set the device clock to 23:58, call `todayKey()` and log it, then set the clock to 00:02 and log again. Expected: two consecutive calendar dates, matching the device's local date each time. Then set the device timezone to UTC+5:30 and repeat; the logged key must equal the local displayed date, not the UTC date.
- [ ] **Step 3: Commit.**

---
## Phase 1 — Worksites & Workers

**Goal:** the manager can fully build and maintain a roster across multiple worksites, with validation and soft delete.

**Exit criteria:** add 2 worksites and 5+ workers split across them, restart the app, and everything is still there; inactive records are invisible in active lists but their attendance history survives.

---

### Task 1.1: Worksite list screen

**Files:**
- Modify: `src/screens/WorksitesScreen.js`

**Interfaces:**
- Consumes: `listWorksites()`, `deactivateWorksite(id)` from Task 0.3; `useTheme()` from Task 0.2.
- Produces: navigation to `WorksiteForm` with route params `{ worksiteId?: string }`.

- [ ] **Step 1:** Render a `FlatList` with `keyExtractor={item => item.id}` and a memoized row component. Each row: name (`body`, 600), type and address (`caption`, muted), and a chevron. Whole row is the tap target (≥44px).
- [ ] **Step 2:** Add a full-width orange **+ Add worksite** button at the bottom (the one primary action on this screen), pushing `WorksiteForm` with no `worksiteId`.
- [ ] **Step 3:** Add `EmptyState` (§7.5 of `design.md`): "No worksites yet" with the same orange action.
- [ ] **Step 4:** Reload the list on screen focus (`useFocusEffect`) so returning from the form shows the new row immediately.
- [ ] **Step 5: Verify on device** — with an empty DB, confirm the empty state appears; add a worksite; return; confirm the row appears. Restart the app and confirm it persists.
- [ ] **Step 6: Commit.**

---

### Task 1.2: Worksite form (add / edit) with type picker and validation

**Files:**
- Modify: `src/screens/WorksiteFormScreen.js`

**Interfaces:**
- Consumes: `getWorksite(id)`, `createWorksite`, `updateWorksite` from Task 0.3.
- Produces: the type value set `['office','construction','school','farm','other']` (lowercase, matching the DB `type` column); screens elsewhere may map these to display labels.

- [ ] **Step 1:** Build the form with **visible labels above every field** (never placeholder-as-label): Name (required), Type, Address (optional).
- [ ] **Step 2:** Implement Type as a **segmented picker / chip row**, not free text — Office / Construction / School / Farm / Other. Selected chip uses `colors.primary`; unselected uses `muted`.
- [ ] **Step 3:** Inline validation: show the name-required error directly under the field in `colors.destructive` as soon as the field is touched and empty; do not validate only on submit.
- [ ] **Step 4:** Full-width orange **Save** at the bottom. On edit mode, show **Remove** as text-only in `destructive` (never a filled button).
- [ ] **Step 5: Verify on device** — save with an empty name and confirm the inline error; fill a name and type and save; reopen the worksite and confirm all fields prefill correctly; edit the name and confirm the list reflects it.
- [ ] **Step 6: Commit.**

---

### Task 1.3: Worker list with worksite filter

**Files:**
- Modify: `src/screens/WorkersScreen.js`

**Interfaces:**
- Consumes: `listWorkers({ worksiteId })`, `listWorksites()` from Task 0.3.
- Produces: navigation to `WorkerForm` with `{ workerId?: string }` and to `WorkerProfile` with `{ workerId: string }`.

- [ ] **Step 1:** Render a horizontal chip row of worksites (plus an "All" chip) that filters the list. Selected chip uses `primary`; keep it horizontally scrollable.
- [ ] **Step 2:** Render workers in a `FlatList`; each row shows name (`body`, 600), role/worksite (`caption`, muted). Row tap opens `WorkerProfile`.
- [ ] **Step 3:** Add the empty state "No workers at this worksite" with an **Add worker** action carrying the currently selected worksite into the form.
- [ ] **Step 4:** Orange **+ Add worker** primary action.
- [ ] **Step 5: Verify on device** — add workers across two worksites; switch chips and confirm filtering; confirm the empty state appears for a worksite with none.
- [ ] **Step 6: Commit.**

---

### Task 1.4: Worker form (add / edit)

**Files:**
- Modify: `src/screens/WorkerFormScreen.js`

**Interfaces:**
- Consumes: `getWorker`, `createWorker`, `updateWorker`, `listWorksites` from Task 0.3.
- Produces: worker creation that always stores a real `worksite_id`; the reassignment behavior confirmed in Open Decision #3.

- [ ] **Step 1:** Visible labels for Name (required), Worksite (required), Role (optional), Phone (optional).
- [ ] **Step 2:** Worksite as a chip/picker row of **active** worksites only. If the manager arrived from a filtered list, preselect that worksite.
- [ ] **Step 3:** Inline required-field validation for Name and Worksite. Phone is optional; if entered, trim whitespace and do not apply strict format rules (v1 does not validate phone formats).
- [ ] **Step 4:** Full-width orange **Save**; edit mode shows text-only **Remove** in `destructive`.
- [ ] **Step 5: Verify on device** — save without a worksite and confirm the inline error; save a complete worker; reopen and confirm prefill; reassign the worker to another worksite and confirm the list filter reflects the new assignment.
- [ ] **Step 6: Commit.**

---

### Task 1.5: Soft-delete confirmation and inactive exclusion

**Files:**
- Modify: `src/screens/WorksiteFormScreen.js`, `src/screens/WorkerFormScreen.js`, `src/screens/WorksitesScreen.js`, `src/screens/WorkersScreen.js`

**Interfaces:**
- Consumes: `deactivateWorksite`, `deactivateWorker`.
- Produces: the app-wide rule that `is_active = 0` records never appear in active lists or new-attendance pickers.

- [ ] **Step 1:** Add a confirmation dialog before removing a worksite or worker. Copy must make clear that history is kept: e.g. "Remove {name}? Their past attendance records will be kept, but they won't appear in new lists."
- [ ] **Step 2:** Confirm the dialog's destructive action uses `colors.destructive` and that the cancel path is the default/least-effort option.
- [ ] **Step 3:** Audit every list and picker added so far (worksites list, workers list, worker-form worksite picker) to confirm none can surface an inactive record.
- [ ] **Step 4: Verify (soft-delete history) on device** — mark attendance for a worker on two dates, remove the worker, then confirm: (a) the worker disappears from the Workers list and all pickers; (b) the worker's `WorkerProfile` still shows both attendance rows; (c) the worksite filter no longer offers the removed worker.
- [ ] **Step 5:** Remove a worksite and confirm its workers are **not** silently hidden in a way the manager can't discover — with Open Decision #2 still open, the plan's default is to allow removal only after the manager has seen how many active workers it holds.
- [ ] **Step 6: Commit.**

---

## Phase 2 — Attendance Marking

**Goal:** the single most important screen works smoothly: one tap per worker, correct date handling, optional notes, and no duplicate rows.

**Exit criteria:** mark a full day for every worker, restart, and the register is intact; correct a past date and it updates in place.

---

### Task 2.1: Attendance data access with upsert semantics

**Files:**
- Modify: `src/db/attendance.js`

**Interfaces:**
- Consumes: the `attendance` table and `upsertAttendance` from Task 0.3.
- Produces: `getAttendanceForDate(date, { worksiteId })` returning a `Map<worker_id, AttendanceEntry>` for O(1) row lookup on the marking screen, and `getDailyCounts(date)` returning `{ present, absent, half_day, off_day, unmarked }`.

- [ ] **Step 1:** Confirm `upsertAttendance` is single-statement (`ON CONFLICT DO UPDATE`) rather than read-then-write, so a double-tap cannot create two rows.
- [ ] **Step 2:** Implement `getAttendanceForDate` to join active workers with any attendance rows for that date, so unmarked workers are returned with `status: null`.
- [ ] **Step 3: Verify Review Focus #3 on device** — fire the cycle action twice in rapid succession for the same worker/date and then query `SELECT COUNT(*)`. Expected: exactly `1` row, and the status advanced exactly one step. Repeat with the app backgrounded/foregrounded mid-tap.
- [ ] **Step 4: Commit.**

---

### Task 2.2: The status cycle button

**Files:**
- Create: `src/components/StatusPill.js`
- Modify: `src/screens/MarkAttendanceScreen.js`

**Interfaces:**
- `StatusPill.js` exports two components: `StatusCycleButton` (solid fill + white text, interactive) and `StatusPill` (tinted pill + dark text, read-only for history). Both consume `STATUS`/`CYCLE` from Task 0.2.
- Produces: an `onCycle(workerId, nextStatus)` callback owned by the screen.

- [ ] **Step 1:** Implement `StatusCycleButton` as a `Pressable` with `android_ripple` and pressed-opacity `0.85`, minimum 44×44px, cycling `present → absent → half_day → off_day → present`. No modal, no confirmation.
- [ ] **Step 2:** Implement the read-only `StatusPill` using the tinted variant. Verify both variants clear 4.5:1 in light and dark mode.
- [ ] **Step 3:** On `MarkAttendanceScreen`, render the joined worker list in a `FlatList`; each row is name (`body`, 600) left, role/worksite (`caption`, muted) second line, pill right. The **whole row** is the target, not just the pill.
- [ ] **Step 4:** On cycle, call `upsertAttendance` immediately (save-on-tap) and update local row state optimistically; on error, revert and show an inline message.
- [ ] **Step 5: Verify on device** — mark every worker through all four statuses; confirm the pill color and label always agree; confirm the save indicator/error behavior; reopen the screen and confirm statuses persisted.
- [ ] **Step 6: Commit.**

---

### Task 2.3: Date strip and "Today" jump

**Files:**
- Create: `src/components/DateStrip.js`
- Modify: `src/screens/MarkAttendanceScreen.js`

**Interfaces:**
- Consumes: `todayKey`, `addDays`, `formatDisplay`, `lastNDays` from Task 0.5.
- Produces: the screen's selected `date` state as a `YYYY-MM-DD` key, defaulting to `todayKey()`.

- [ ] **Step 1:** Render a horizontally scrollable strip of recent days using `lastNDays(14)`, each chip showing weekday + day number. Selected chip uses `primary`.
- [ ] **Step 2:** Add a **Today** jump that snaps the strip to `todayKey()` and is disabled/visually distinct when already on today.
- [ ] **Step 3:** Tapping a chip reloads `getAttendanceForDate(date)` for that key.
- [ ] **Step 4:** Allow selecting a date in the future or further past than the strip — add a "pick a date" affordance so the register is not limited to the strip window.
- [ ] **Step 5: Verify on device** — mark attendance on a past date, jump to today, jump back, and confirm each date shows its own independent register (no bleed between dates).
- [ ] **Step 6: Commit.**

---

### Task 2.4: Per-entry note

**Files:**
- Modify: `src/screens/MarkAttendanceScreen.js`

**Interfaces:**
- Consumes: `upsertAttendance({ workerId, date, status, note })`.
- Produces: a note editor scoped to `(workerId, date)`.

- [ ] **Step 1:** Add a note affordance on each row (a small note icon or a long-press) that opens an inline editor or a bottom sheet (`radius.lg` top corners only) with a multiline text input.
- [ ] **Step 2:** Save writes through `upsertAttendance` so an existing status is preserved when only the note changes, and the note is cleared when emptied (store `null`, not `''`).
- [ ] **Step 3:** Show a subtle muted indicator on rows that carry a note, so the manager can see which entries are annotated without opening them.
- [ ] **Step 4: Verify on device** — add a note to a present row, reopen it, confirm the text; clear it and confirm the indicator disappears; change only the status and confirm the note survives.
- [ ] **Step 5: Commit.**

---

### Task 2.5: Worksite filter on the marking screen

**Files:**
- Modify: `src/screens/MarkAttendanceScreen.js`

**Interfaces:**
- Consumes: `listWorksites()`, `getAttendanceForDate(date, { worksiteId })`.
- Produces: filter state that does not change the selected date.

- [ ] **Step 1:** Add a worksite chip row (All + each active worksite) above the list. Selected chip uses `primary`.
- [ ] **Step 2:** Filtering reloads the register for the same date, scoped to the worksite's active workers.
- [ ] **Step 3:** Add an empty state for "no active workers at this worksite" that is distinct from "no attendance marked for this date".
- [ ] **Step 4: Verify (reassignment) on device** — with worker W in Worksite A, mark W present today; reassign W to Worksite B; return to the marking screen. Expected: W no longer appears under Worksite A, appears under Worksite B **with the same retained status**, and switching to All still shows W exactly once.
- [ ] **Step 5: Commit.**

---
## Phase 3 — Worker Profile & History

**Goal:** a trustworthy per-worker record and the attendance-% math every later report depends on.

**Exit criteria:** spot-checked math matches a hand count; history survives soft-delete; the empty state is calm.

---

### Task 3.1: Attendance math module

**Files:**
- Create: `src/utils/attendance.js`

**Interfaces:**
- `summarize(records)` → `{ present, absent, half_day, off_day, counted, pct }` where `counted = present + absent + half_day` and `pct = counted === 0 ? null : (present + 0.5 * half_day) / counted * 100`.
- `attendancePercent(records)` → `number | null`, delegating to `summarize`.

- [ ] **Step 1:** Implement the formula above. `off_day` never enters the numerator or denominator. When `counted === 0`, return `null` — never `0`, `NaN`, or `Infinity`.
- [ ] **Step 2:** Implement a display helper that renders `null` as `—` (em-dash) and otherwise one decimal place with `tabular-nums`.
- [ ] **Step 3: Verify PRD §9 by hand** — for a worker with 20 present, 5 absent, 3 half-day, 2 off-day: `counted = 28`, `pct = (20 + 1.5) / 28 × 100 = 76.79%`. Confirm the module returns `76.7857…` and the display shows `76.8%`, and that the two `off_day` rows appear in `off_day` but change neither `counted` nor `pct`.
- [ ] **Step 4: Verify Review Focus #1 on device** — a worker with only `off_day` rows and a worker with no rows at all both show `—`; a worker with only one `present` shows `100.0%`; a worker with only one `absent` shows `0.0%`.
- [ ] **Step 5: Commit.**

---

### Task 3.2: Worker profile screen

**Files:**
- Create: `src/components/AttendanceRing.js`
- Modify: `src/screens/WorkerProfileScreen.js`

**Interfaces:**
- `AttendanceRing.js` exports a flat thick-stroke ring (no gradient/glow): track `muted`, fill `secondary`, turning `accent` when `pct < 75`; center numeral in `display`.
- Consumes: `getWorker`, `getAttendanceForWorker(workerId, { from, to })`, `summarize`.

- [ ] **Step 1:** Header: worker name (`h1`), role/worksite (`caption`, muted), and a smaller `AttendanceRing` showing all-time or selected-range `pct`.
- [ ] **Step 2:** History list: date (`caption`, `tabular-nums`), read-only `StatusPill`, and note text when present. Newest first.
- [ ] **Step 3:** Add a period selector (e.g. 30 days / 90 days / all time) that recomputes the ring and the summary counts.
- [ ] **Step 4:** Empty state: "No attendance recorded yet", no action button (keep it calm per `design.md` §7.5).
- [ ] **Step 5:** Ensure `WorkerProfile` is reachable even for a worker removed from active lists (this is how history stays viewable after soft-delete).
- [ ] **Step 6: Verify on device** — open a profile, switch periods, and confirm the ring, counts, and list all move together; confirm the ring turns orange below 75%.
- [ ] **Step 7: Commit.**

---

### Task 3.3: Refresh and consistency pass

**Files:**
- Modify: `src/screens/WorkerProfileScreen.js`, `src/screens/MarkAttendanceScreen.js`, `src/screens/WorkersScreen.js`

**Interfaces:**
- Consumes: nothing new.

- [ ] **Step 1:** Add `useFocusEffect` reloads so a profile visited before new marks shows updated data on return.
- [ ] **Step 2:** Add pull-to-refresh on the profile history list.
- [ ] **Step 3:** Trigger the ring's sweep animation only when `pct` changes from its previous value; respect `AccessibilityInfo.isReduceMotionEnabled()` by skipping the sweep and keeping the state change.
- [ ] **Step 4: Verify on device** — mark new attendance in the Attendance tab, then open the profile without restarting and confirm the numbers are current; verify the sweep plays on change and is skipped with reduce-motion on.
- [ ] **Step 5: Commit.**

---

## Phase 4 — Home Dashboard & Reports (outline)

**Goal:** answer "how did today go?" and "who's been unreliable this month?" in a few taps.

**Exit criteria:** report numbers match a manual count of a small sample.

- [ ] **Task 4.1 — Home hero.** Implement `HomeScreen` with the `AttendanceRing` as the largest element, today's date, and the four-status tinted pill row with counts. **Resolve Open Decision #1 here** (the today-% definition, including how unmarked workers are treated) and document the chosen formula in a code comment.
- [ ] **Task 4.2 — Stat cards.** 2×2 fixed grid of `StatCard`s: present / absent / half-day / off-day, numeral in `h1` weight 700 tinted by its status color; tapping opens the filtered report.
- [ ] **Task 4.3 — Mark attendance CTA.** One full-width orange **Mark attendance** button on Home; this is the only orange element on the screen.
- [ ] **Task 4.4 — Reports screen.** Date-range filter + worksite filter, reusing `summarize`. Show per-worker attendance % over the range and a "lowest attendance" highlight list (frequent absences). Charts/legends must be labeled, per `design.md` §4.
- [ ] **Task 4.5 — Worksite-level trends.** Attendance trend over time per worksite, kept to a simple labeled representation rather than a heavy chart library.
- [ ] **Task 4.6 — Reconciliation.** Manually count a sample of 3 workers across a week from the Mark Attendance history and confirm the Reports figures match exactly.

---

## Phase 5 — Export (CSV/PDF) (outline)

**Goal:** attendance can leave the app in a payroll-usable form and files open correctly outside the app.

**Exit criteria:** an exported file opened in Excel/Sheets and a PDF opened in a viewer both match the in-app data.

- [ ] **Task 5.1 — CSV serializer.** Implement `src/utils/csv.js` with proper RFC-4180 escaping: fields containing comma, quote, or newline are quoted, and embedded quotes are doubled. **This is the owning task for Review Focus #5** — include the verification: export a worker whose note contains `left early, told "back tomorrow"` and open it in Excel/Sheets; confirm the row still has the correct number of columns and the note reads intact.
- [ ] **Task 5.2 — Per-worker export.** Export one worker's history (CSV, and PDF via `expo-print` per Open Decision #4).
- [ ] **Task 5.3 — Per-worksite monthly register.** Full register for a chosen worksite and month, all workers.
- [ ] **Task 5.4 — Date-range selector** on the export screen instead of full-history-only.
- [ ] **Task 5.5 — Save to Downloads** via `expo-file-system`, then `expo-sharing` to hand off.
- [ ] **Task 5.6 — Cold-open verification.** Rename/transfer the exported file and open it on a second device to prove it is not corrupted or app-locked.

---

## Phase 6 — Backup & Restore (outline)

**Goal:** the manager's only safety net works reliably, and a bad file cannot destroy good data.

**Exit criteria:** delete the app, reinstall, restore a backup, and end with identical data.

- [ ] **Task 6.1 — Backup writer.** Serialize `{ version, exported_at, worksites, workers, attendance }` to JSON (include inactive rows) and save to Downloads. Record a `lastBackupAt` value for the UI.
- [ ] **Task 6.2 — Version stamp.** Include a schema/`user_version` stamp so a future schema change can detect and reject incompatible files.
- [ ] **Task 6.3 — Restore with validation-first.** **Owning task for Review Focus #4.** Parse and validate the entire payload (required keys, row shapes, status enum values, FK references) **before** touching the DB; then restore inside a single transaction that replaces worksites, workers, and attendance. Verify: truncated JSON, a file missing the `attendance` key, and a file with an unknown `version` each produce a clear error and leave existing data completely intact.
- [ ] **Task 6.4 — Restore confirmation.** A `destructive`-colored warning that restore **replaces everything**, written so a non-technical manager understands it; cancel is the default.
- [ ] **Task 6.5 — Last-backup indicator** on the Backup screen so the manager knows if they are overdue.
- [ ] **Task 6.6 — Round-trip test on device.** Back up, clear app data, restore, and diff the worksite/worker/attendance counts and a sample of statuses.

---

## Phase 7 — Polish & Edge Cases (outline)

**Goal:** it feels finished, not prototyped.

- [ ] **Task 7.1 — Worksite-removal rule.** Implement the decision from Open Decision #2 (proposed: block removal while active workers remain; show the count). Confirm the choice explicitly.
- [ ] **Task 7.2 — Loading states.** Skeleton rows matching real row heights on every data-loading screen; no blank flashes, no centered spinners where the layout is known.
- [ ] **Task 7.3 — Empty states everywhere,** matching the copy table in `design.md` §7.5 exactly.
- [ ] **Task 7.4 — Accessibility pass.** `accessibilityLabel` on icon-only controls, visible focus rings, every status pill labeled, contrast ≥ 4.5:1 checked independently in dark mode.
- [ ] **Task 7.5 — Layout pass.** 16px gutters, 8px minimum between tap targets, safe areas respected, no shadows/gradients, `tabular-nums` on all counts and percentages, `FlatList` + `keyExtractor` + memoized rows for any list that can exceed 50 items.
- [ ] **Task 7.6 — Fonts.** Load Inter via `@expo-google-fonts/inter` + `expo-font` and confirm nothing is below 13px.
- [ ] **Task 7.7 — Icon and splash screen** wired into `app.json`.
- [ ] **Task 7.8 — Device matrix check** on a low-end Android device at 360dp width, plus iOS if available.

---

## Phase 8 — Build & Ship (outline)

**Goal:** a real installable app independent of the dev environment.

- [ ] **Task 8.1 — EAS setup.** Create/confirm an Expo Application Services account.
- [ ] **Task 8.2 — `eas.json`** with a production build profile.
- [ ] **Task 8.3 — Production build.** `eas build --platform android` (APK/AAB).
- [ ] **Task 8.4 — On-device production test.** Test the production build, not Expo Go dev mode — SQLite paths, file-system access, and sharing all behave differently in a release build.
- [ ] **Task 8.5 — Distribution decision.** Direct APK sideload (simplest, fine for a single manager) vs. Play Store listing (only if wider distribution is intended).

---

## Suggested Pacing (solo developer, part-time)

| Phase | Rough effort |
|---|---|
| 0 — Scaffold & Foundation | 1–2 days |
| 1 — Worksites & Workers | 2–3 days |
| 2 — Attendance Marking | 2–3 days |
| 3 — Worker Profile | 1–2 days |
| 4 — Reports | 1–2 days |
| 5 — Export | 1–2 days |
| 6 — Backup/Restore | 1 day |
| 7 — Polish | 2–4 days |
| 8 — Build & Ship | 0.5–1 day |

Total: roughly **2–3 weeks** part-time. Phase 0 is larger than the previous plan implied because it now includes building the scaffold, theme, DB layer, and navigation from nothing. Phases 4–6 can slip to a fast-follow without breaking the core promise.

## Priority Order If Cutting Scope

**Phases 0 → 1 → 2 → 3 are non-negotiable** — they are the actual product. Phases 4–6 (Reports, Export, Backup) are valuable but may ship as v1.1. Phase 7 gets at least a light pass before any real user touches it.
