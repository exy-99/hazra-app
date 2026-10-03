# Hazra Attendance — Planning Conventions (read before writing any PLAN.md)

**Milestone:** v1.0 — Offline Staff Attendance Register (MVP)
**Purpose:** Every `gsd-planner` run for this milestone MUST honor these rules. They
exist so nine phases planned independently stay mutually consistent.

---

## 0. Repository truth (authoritative)

- **Stack:** Expo SDK 57 · Expo Router (file-based) · React Native 0.86 · React 19 · **TypeScript strict**.
- **DEPRECATED — do NOT follow:** `build_plan.md` and PRD §10 describe React Navigation +
  JavaScript/JSDoc + `src/theme/`. That stack is **stale**. Use Expo Router + TS strict.
- **File aliases:** `@/*` → `src/*`; `@/assets/*` → `assets/*`. Never deep relative paths.
- **Tokens:** extend `src/constants/theme.ts`. NEVER create `src/theme/`.
- **Routing:** `src/app/` is routes ONLY. Components/hooks/utils/db live outside it.
- **Tabs:** native = `src/components/app-tabs.tsx` (`expo-router/unstable-native-tabs`);
  web = `src/components/app-tabs.web.tsx` (`expo-router/ui`). A new screen needs a route
  file AND a trigger in BOTH tab files.
- **Package manager:** npm. Expo modules: `npx expo install <pkg>`. Never raw `npm install`
  for Expo/native modules.
- **Native module note:** `expo-sqlite`, `expo-file-system`, `expo-sharing`, `expo-print`
  are native → require a **development build** (`expo-dev-client`), not Expo Go.
- **No network, analytics, or account UI anywhere. Offline, single manager.**

## 1. Verification model (no test runner exists)

There is no Jest/Vitest/test directory in this repo. Every task's automated verify MUST be
one or more of:

1. `npx tsc --noEmit` (the primary gate — must exit 0).
2. `grep`/file-existence gates asserting exact strings or files.
   - Count gates MUST filter comments: `grep -v '^#' <file> | grep -c <token>`.
   - Never use a bare `== 0` gate on an unfiltered file.
3. `node -e "..."` assertions against config/JSON where useful.
4. Pure functions with defined I/O (e.g. attendance-% math, CSV escaping) MAY include an
   optional co-located self-check script under `scripts/` invoked via `node` — but this is
   optional; `tsc` + grep gates are the required baseline.

No task may use subjective verification ("looks right", "works correctly").

## 2. Granularity rules (THE POINT OF THIS REWRITE)

The user explicitly asked for **much smaller, more detailed tasks**. Enforce:

- **Plans per phase:** 4–8 (split by sub-system / screen / layer). Never fewer than 4 for a
  multi-screen phase.
- **Tasks per plan:** **2–3 maximum.** A plan with 4+ tasks is invalid.
- **Files per task:** **≤ 3 source files** (a file + its test/self-check counts as one unit
  where applicable). A task touching 4+ files MUST be split.
- **One concern per task.** "Build the worksite form" is a task; "build worksites and
  workers and navigation" is three tasks in three plans.
- **Vertical slices over horizontal layers** where possible, but the DB layer may be split
  by table/DAO because it is a shared foundation.
- Each plan targets **≤ 50% of a context window**; prefer ~30–40%.

**Split signals (must split):** >3 tasks, >3 files in a task, two unrelated subsystems in
one plan, a checkpoint mixed with implementation.

## 3. Mandatory PLAN.md shape

Filename **exactly** `{padded_phase}-{NN}-PLAN.md` (e.g. `02-03-PLAN.md`).
Location: `.planning/phases/{padded_phase}-{slug}/{padded_phase}-{NN}-PLAN.md`.
NEVER `PLAN-01.md`, `01-PLAN-01.md`, or lowercase `plan`.

Frontmatter (all required unless marked optional):

```yaml
---
phase: 02-worksites-workers
plan: 01
type: execute            # or tdd
wave: 1
depends_on: []           # plan IDs, e.g. [02-01, 02-02]
files_modified: []       # exact relative paths
autonomous: true         # false if any checkpoint task
requirements: [WS-01]    # REQUIRED — real REQ IDs, never empty
user_setup: []           # optional — human-only external setup
must_haves:
  truths: []
  artifacts: []
  key_links: []
---
```

Body MUST contain, in order:

1. `<objective>` — what + Purpose: + Output:.
2. `<execution_context>` — the two standard @-references (execute-plan workflow + summary template).
3. `<context>` — @-references to `.planning/PROJECT.md`, `.planning/ROADMAP.md`,
   `.planning/STATE.md`, `AGENTS.md`, `design.md`, `PRD_Attendance_App.md`, plus prior
   phase SUMMARYs that are genuinely needed. Include an `<interfaces>` block with the
   exact types/exports the executor must use (extracted from the codebase or prior plans).
4. `<tasks>` — 2–3 `<task>` elements.
5. `<threat_model>` — trust boundaries table + STRIDE register (security enforcement is ON,
   ASVS L1, block on high). Every threat gets a disposition: mitigate / accept / transfer.
   Mitigations must name a specific mechanism (schema CHECK, parameterized SQL, etc.).
6. `<verification>` — overall phase checks.
7. `<success_criteria>` — measurable.
8. `<output>` — `.planning/phases/{phase}/{phase}-{NN}-SUMMARY.md`.

### Task anatomy (every task)

```xml
<task type="auto">
  <name>Task N: action-oriented name</name>
  <files>exact/paths.ts</files>
  <read_first>
    - file the executor MUST read before editing (always include the file being modified)
    - source-of-truth file (design.md §, PRD §, prior plan file)
  </read_first>
  <action>
    Concrete implementation. NEVER "align X with Y" without naming the target state.
    Include exact function signatures, SQL, hex values, route names, import paths.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    Additional grep/file gates with exact strings.
  </verify>
  <done>Measurable acceptance state.</done>
</task>
```

Use `tdd="true"` + a `<behavior>` block ONLY for pure logic with defined I/O (e.g.
`summarize()`, CSV escaping, date math). UI/CRUD/config tasks use plain `type="auto"`.

Checkpoints (`type="checkpoint:human-verify"`) are allowed ONLY for things a human must see
(boots without red screen, visual contrast, on-device build). Any plan containing one sets
`autonomous: false`.

## 4. Foundation interface contract (created in Phase 1 — use these exact names)

All later phases import from these; do NOT invent parallel modules.

```typescript
// src/constants/status.ts
export const STATUS: {
  present:  { label: 'Present';  solid: '#16A34A'; tint: '#DCFCE7'; text: '#15803D' };
  absent:   { label: 'Absent';   solid: '#DC2626'; tint: '#FEE2E2'; text: '#B91C1C' };
  half_day: { label: 'Half day'; solid: '#B45309'; tint: '#FEF3C7'; text: '#B45309' };
  off_day:  { label: 'Off day';  solid: '#64748B'; tint: '#E2E8F0'; text: '#475569' };
};
export const CYCLE: ['present', 'absent', 'half_day', 'off_day'];

// src/constants/theme.ts  (extended, starter keys preserved)
Colors.light / Colors.dark  // primary, onPrimary, secondary, accent, onAccent,
                            // background, surface, foreground, muted, mutedForeground,
                            // border, ring, destructive, onDestructive
Spacing: { half:2, one:4, two:8, three:16, four:24, five:32, six:64 }
Type:    { display:{48,52,700}, h1:{28,34,700}, h2:{20,26,600},
           body:{16,24,400}, label:{14,20,600}, caption:{13,18,500} }
Radius:  { sm:8, md:12, lg:16, pill:999 }

// src/utils/dates.ts
export function todayKey(): string;                 // LOCAL YYYY-MM-DD, never toISOString
export function toDateKey(d: Date): string;
export function addDays(key: string, n: number): string;
export function formatDisplay(key: string, fmt?: string): string;  // default 'DD MMM YYYY'
export function lastNDays(n: number): string[];     // ascending, ends today

// src/utils/ids.ts
export function newId(): string;                    // Crypto.randomUUID() from expo-crypto

// src/db/types.ts
type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'off_day';
interface Worksite { id; name; type; address; created_at; is_active }
interface Worker   { id; name; worksite_id; role; phone; created_at; is_active }
interface AttendanceEntry { id; worker_id; date; status; note; updated_at }

// src/db/index.ts
export function initDatabase(): Promise<void>;   // idempotent, PRAGMA foreign_keys=ON
export function getDb(): SQLiteDatabase;         // cached singleton

// src/db/worksites.ts
listWorksites / getWorksite / createWorksite / updateWorksite / deactivateWorksite
// src/db/workers.ts
listWorkers({worksiteId, includeInactive}) / getWorker / createWorker /
updateWorker / deactivateWorker
// src/db/attendance.ts
upsertAttendance     // single INSERT ... ON CONFLICT(worker_id,date) DO UPDATE
getAttendanceForDate(date, {worksiteId})   // unmarked workers => status null
getAttendanceForWorker(workerId, {from,to})
getDailyCounts(date) // {present,absent,half_day,off_day,unmarked}

// src/components/empty-state.tsx
export function EmptyState({ icon, title, actionLabel?, onAction? }): JSX.Element;
```

**Schema (exact):**

```sql
worksites(id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, address TEXT,
          created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1)
workers(id TEXT PRIMARY KEY, name TEXT NOT NULL, worksite_id TEXT NOT NULL REFERENCES worksites(id),
        role TEXT, phone TEXT, created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1)
attendance(id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers(id), date TEXT NOT NULL,
           status TEXT NOT NULL CHECK(status IN ('present','absent','half_day','off_day')),
           note TEXT, updated_at TEXT NOT NULL, UNIQUE(worker_id, date))
```

## 5. Design contract essentials (from design.md — apply to every UI task)

- Flat: **no shadows/gradients**. Separate with 1px `border` + `surface`/`background` contrast.
- **Teal = structure/nav. Orange (`accent`) = the one action per screen. Status colors = status only.**
- No hardcoded hex — import tokens. Every pill carries its label (never color alone).
- Tap targets ≥ 44×44px, ≥ 8px gaps, 16px gutters. `Pressable` only (never `TouchableOpacity`);
  ripple (Android) + opacity 0.85 (iOS). Nothing below 13px. `tabular-nums` on all numerals.
- Lists: `FlatList` + `keyExtractor` + memoized row. Every list has an empty state; every
  data-loading screen has a skeleton (no blank flash).
- Business rules: `off_day` excluded from % denominator; `half_day` = 0.5;
  soft-deleted worksites/workers excluded from active lists but history preserved.
- Attendance % formula: `pct = (present + 0.5*half_day) / (present + absent + half_day) * 100`
  → `off_day` never in numerator or denominator; zero denominator renders `—`, never NaN/Infinity.

## 6. Requirement coverage

Every REQ-ID listed for the phase in ROADMAP.md MUST appear in at least one plan's
`requirements:` frontmatter. Do not drop requirements. Do not invent requirements.
`must_haves.truths` must trace to the phase goal's success criteria.

## 7. Per-phase planned split (guidance — planner may refine, not reduce)

- **Phase 1 (01-foundation):** deps+status · theme · date/ID utils · db types/schema ·
  worksite+worker DAO · attendance DAO · 4-tab shell+routes · db-init+EmptyState.
- **Phase 2 (02-worksites-workers):** worksite list · worksite form · worksite delete ·
  worker list+filter · worker form/reassign · worker delete.
- **Phase 3 (03-attendance-marking):** date strip/Today · attendance rows+cycle pill ·
  upsert+double-tap guard · notes editor · worksite filter w/ state retention.
- **Phase 4 (04-worker-profile-history):** summarize() math (tdd) · profile screen+ring ·
  period selector+history list.
- **Phase 5 (05-home-dashboard-reports):** home hero+CTA · report filters · per-worker % ·
  lowest-attendance+trends.
- **Phase 6 (06-export):** RFC-4180 CSV serializer (tdd) · per-worker export ·
  worksite monthly register · save-to-Downloads+share.
- **Phase 7 (07-backup-restore):** backup serializer · restore validator (tdd) ·
  transactional restore+warning UI · round-trip verification.
- **Phase 8 (08-polish-edge-cases):** Inter font+type pass · empty/loading states ·
  a11y pass · layout/perf pass · icon+splash+360dp.
- **Phase 9 (09-build-ship):** eas.json profile · production build+on-device test ·
  distribution decision+release notes.

If any phase's source items cannot fit this budget at full fidelity, return
`## PHASE SPLIT RECOMMENDED` rather than silently reducing scope.

---

*This file is a planning aid only; it is not a phase artifact and requires no SUMMARY.*
