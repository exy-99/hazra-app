# Phase 4: Worker Profile & History - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

## Phase Boundary

A trustworthy per-worker record: full attendance history plus the attendance-% math (off_day excluded, half_day = 0.5) every later report depends on. Profile lives at `src/app/worker/[id].tsx` (currently a placeholder). Roster CRUD stays in Phase 2 screens; reports/export stay in later phases.

## Implementation Decisions

### Period selector
- **D-01:** Default period on open is **Last 30 days**.
- **D-02:** Preset chips are **7 / 30 / 90 days** (no This-month, no All preset). Reuse the 02-04/03-05 chip-row pattern (`__all__`-style keys, `radio` role, pill/44px/selected-`primary` styling).
- **D-03:** **No custom from/to range in v1** — deferred to Reports Phase 5 (RP-02/RP-05). Keeps Phase 4 to three fixed windows computed via `getAttendanceForWorker({ from, to })` + `lastNDays`-style bounds.
- **D-04:** Zero countable days in the period (no entries, or only off_days) renders ring as **"—" + EmptyState** — never `0%`, `NaN`, or `Infinity` (roadmap criterion #2).
- **D-05:** Ring + counts + history **all follow the selected period** (single scope). Switching chips refetches/recomputes everything together; there is no "full history below filtered stats" split.

### Profile header + ring
- **D-06:** Workers-list row tap navigates to the **profile** (`/worker/:id`); the **Edit entry point moves inside the profile** (row no longer opens `/worker-form` directly). Edit the 02-04 row target accordingly.
- **D-07:** Header shows **name + `role · site` + phone** (site resolves via the worksites Map display pattern from 02-04; `'—'` fallback discipline).
- **D-08:** Stats block is an **SVG ring (react-native-svg, already installed) + 4 counts** (present / absent / half / off) with per-stat labels. Unmarked days are NOT a stat here (history shows only marked days, D-12).
- **D-09:** Below 75% the ring turns **`accent` color only** — no "Needs attention" copy, no extra callout.

### History list
- **D-10:** Each row shows **date + status chip + note preview** (STATUS token colors, note-field truncation pattern from 03-04).
- **D-11:** **Flat reverse-chronological `FlatList`** (newest first) — no month section headers. `keyExtractor` + memo rows per standing list discipline.
- **D-12:** History shows **only days with a saved mark** (off_day marks included — they explain gaps). Unmarked days never appear as rows.
- **D-13:** History rows are **read-only** — no tap-to-edit. Corrections happen in the Attendance register where the pill + pending guard live.

### Deleted-worker access
- **D-14:** Removed workers get **no entry/toggle in any list** — profile reachable by **deep-link only** (`/worker/:id` survives soft-delete).
- **D-15:** Removed profile shows a **"Removed" banner + full read-only record** (stats + history still computed and visible — the audit trail stays trustworthy).
- **D-16:** **Edit + Remove actions hidden** on a removed profile. The record is frozen; re-adding is a new worker row (history stays with the old id). No re-activate flow in v1.
- **D-17:** Profile loads the worker **directly by id via DAO with a `?`-bound param** (never interpolated). Tampered/unknown `?id=` renders the 02-03-precedent **"not found" EmptyState** (no action).

### Profile actions
- **D-18:** Single **orange Edit action below the stats** (one-orange rule; never competes with the ring). Header carries no edit icon button.
- **D-19:** Phone number is **tap-to-call** (`tel:` link on the phone row).

### Loading + empty states
- **D-20:** Loading uses **skeleton blocks** (explicit user choice over the 03-05 spinner-in-content pattern). Header + chips stay mounted; skeletons cover the ring/counts/history region. Keep it lightweight — full DS-06 polish is Phase 8.
- **D-21:** DAO load failure renders **"Couldn't load …" EmptyState + "Try again" retry** with `void load()` discipline (CR-01 pattern from commit 4088df4). `load()` never rejects.
- **D-22:** Empty history (no marks in period) uses the design.md §7.5 line, ring shows "—" (D-04).

### Date + number format
- **D-23:** History dates via **`formatDisplay` (DD MMM YYYY)** from `src/utils/dates.ts` everywhere. Local date keys only; never `toISOString`.
- **D-24:** Counts + % use **`tabular-nums`** (03-05 CountsHeader precedent) so recompute doesn't jitter layout.

### OpenCode's Discretion
- Exact skeleton block shapes/shimmer treatment (lightweight, pre-Phase-8).
- Note-preview truncation length in history rows.
- Exact §7.5 empty-history copy choice (delegated, as in 03-03/03-05).
- `summarize()` home (new `src/utils/attendance.ts` vs co-located), exact return shape, and TDD test file placement — must satisfy the hand-check: 20 present + 5 absent + 3 half_day + 2 off_day → 76.79% (off_day excluded, half_day = 0.5).
- Period-chip selected/unselected styling details within the frozen chip pattern.
- "Removed" banner exact copy + placement (muted/destructive tint choice).

## Specific Ideas

- No specific product references offered — standard register-app patterns apply.
- "Corrections happen in the register" — user sees history as the trustworthy read model, attendance tab as the write model.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `PRD_Attendance_App.md` §7.4 — Worker Profile / History scope (full history + % stats)
- `PRD_Attendance_App.md` §9 — Business rules (off_day excluded from denominator, half_day = 0.5, soft-deleted history preserved)
- `.planning/REQUIREMENTS.md` — PR-01, PR-02 (pending); RP-02/RP-05 explicitly out (custom ranges live in Phase 5)
- `.planning/ROADMAP.md` — Phase 4 goal, requirements (PR-01, PR-02), and all 4 success criteria (incl. the 76.79 hand-check and <75% accent rule)

### Design contract
- `design.md` §7.5 — Empty-state copy table (exact lines for empty history / not-found states)
- `design.md` — Status colors (STATUS tokens only for status), one-orange-action rule, 16px gutters, `tabular-nums`

### Existing code (read before planning)
- `src/app/worker/[id].tsx` — Placeholder profile to replace (route param stays display string at boundary)
- `src/db/attendance.ts` — `getAttendanceForWorker(workerId, { from, to })` (period queries), `getDailyCounts` (same-scope pattern)
- `src/db/workers.ts` — Worker lookup by id (bind `?`, never interpolate); active-only list discipline
- `src/utils/dates.ts` — `todayKey` / `addDays` / `toDateKey` / `formatDisplay` / `lastNDays` (local keys only)
- `src/constants/status.ts` — Frozen STATUS/CYCLE/AttendanceStatus contract
- `src/components/empty-state.tsx` — Shared flat EmptyState (action only when label + onAction both provided)
- `src/app/(tabs)/workers.tsx` — Row target to change (→ profile), memo rows, focus refetch, loadError retry pattern
- `src/app/(tabs)/attendance.tsx` — CountsHeader precedent (dots + tabular-nums + a11y labels), `useFocusEffect` refetch discipline

## Existing Code Insights

### Reusable Assets
- `getAttendanceForWorker` + date utils: period windows are pure `(from, to)` bounds — no new DAO needed, just callers.
- `EmptyState`: covers not-found (tampered id), empty history, and load-failure states with the existing contract.
- STATUS tokens + `tabular-nums`: history chips and counts inherit the register's visual language.
- `react-native-svg`: already installed (01-01) — ring needs no new dependency.

### Established Patterns
- Focus refetch (`useFocusEffect` + `useCallback`), `void load()` with catch-all inside, polite `theme.destructive` error surfaces (CR-01/CR-02, commit 4088df4).
- One orange action per screen state; destructive confirms text-only; `Pressable` only, no `TouchableOpacity`.
- Active-only DAO filtering (`is_active = 1` server-side); tampered ids render not-found, never reach SQL.
- 44px targets, 16px gutters, `FlatList` + `keyExtractor` + memo rows.

### Integration Points
- `src/app/(tabs)/workers.tsx` row `href` changes from `/worker-form?id=` to `/worker/:id`; profile hosts the Edit link to `/worker-form?id=`.
- `src/app/worker/[id].tsx` becomes the only new-shape screen; no tab-trigger changes (drill-down route already registered).
- Phase 5 (Home/Reports) will consume `summarize()` — keep it pure and importable, not screen-local.

## Deferred Ideas

- Custom date-range picker (from/to) — Phase 5 Reports (RP-02/RP-05).
- Re-activate removed worker flow — no phase assigned (new-worker-row is the v1 path).
- Show-removed toggle in workers list — rejected for v1 (deep-link only, D-14).
- Tap-history-row-to-edit-that-day — rejected (read-only history, D-13).

---

*Phase: 04-worker-profile-history*
*Context gathered: 2026-10-07*
