# Phase 5: Home Dashboard & Reports - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Answer "how did today go?" (Home hero: today's ring + counts + one CTA) and "who's been unreliable this month?" (Reports: date-range + worksite filters, per-worker % over the range, lowest-attendance highlight, worksite trend over time). Home lives at `src/app/(tabs)/index.tsx` (placeholder), Reports at `src/app/(tabs)/reports.tsx` (placeholder). No export/backup UI — Phase 6. No new capabilities beyond RP-01..RP-05.

</domain>

<decisions>
## Implementation Decisions

### Home hero (RP-01)
- **D-01:** Home ring % reuses `summarize()` — off_day excluded, half_day = 0.5, unmarked days ignored. Ring shows "—" until the first mark of the day. One % definition across profile, home, and reports.
- **D-02:** Counts row is 4 STATUS pills (present / absent / half / off) plus a muted "N unmarked" line beneath. Matches the `getDailyCounts` shape; unmarked recedes instead of competing.
- **D-03:** Exactly one orange CTA — full-width "Mark attendance" below the pills, pushes to `/attendance`. Always visible, even when the day is fully marked.
- **D-04:** Untouched day renders ring "—" + zero pills with CTA intact. Zero workers renders a calm §7.5-style empty state with an Add worker action (never a dead CTA).
- **D-05:** Hero is large — `display`-scale numeral in the ring, today's date above via `formatDisplay`, 4-pill row beneath (design §7.1 glanceable hero, bigger than the profile's 120 ring).
- **D-06:** Home pills tap through to `/attendance` for triage (not a read-only hero). The attendance screen currently has a worksite filter but no status filter — planner reconciles the exact link target (deep-link to register at minimum; status pre-filter only if cheap).

### Reports range + worksite filters (RP-05)
- **D-07:** Range control is 7 / 30 / 90 preset chips (profile pattern) PLUS a custom From/To picker. Presets for speed, custom for payroll-style ranges.
- **D-08:** Worksite filter is an All + per-site chip row (02-04/03-05 pattern, `radio` role) above the range control. One single scope — every stat and list on screen follows the same (range, site) pair.
- **D-09:** Range end is capped at today. Future days are never selectable (register holds past/present only, AT-02 precedent).
- **D-10:** Switching range/site keeps chips mounted and shows skeleton blocks over stats + list (profile precedent, never a spinner swap or blank flash).
- **D-11:** Default range on first open is Last 30 days (same convention as profile).
- **D-12:** A range with zero marks renders ring "—" + a calm §7.5 empty state (profile zero-days language). Stats never show `0%`/`NaN`.

### Per-worker % list + lowest highlight (RP-02, RP-04)
- **D-13:** List sorts highest % first (dependable roster reads top-down).
- **D-14:** "Frequently absent" = a fixed bottom-3-by-% callout above the full list (predictable layout; matches the 3-worker hand-check in roadmap criterion #4).
- **D-15:** Rows tap through to the worker profile (`/worker/[id]`). Reports is the read model; corrections stay in the register.
- **D-16:** Per-worker % uses the same `summarize()` math (D-01). Report numbers reconcile exactly with the register (criterion #5).
- **D-17:** Each row shows name + % + 4 mini counts (profile stat language with STATUS dots, `tabular-nums`). % alone is not enough — counts let the manager reconcile at a glance.
- **D-18:** Below 75% the row % text turns `accent` (same floor as the ring rule, D-19 in Phase 4). One floor app-wide.
- **D-19:** Workers with no countable days ("—") sink to the list bottom and are excluded from the bottom-3 ranking (needs countable days to rank).

### Worksite trends over time (RP-03)
- **D-20:** One bar per day (day's `summarize()` %) drawn with installed `react-native-svg` — no new chart dependency. Labeled axes + legend per criterion #5 (never color alone).
- **D-21:** Trend aggregates active workers' marks in scope only (active-only DAO discipline; removed workers excluded).
- **D-22:** Days with zero countable marks render a muted gap bar + "—", never a 0% bar (holidays must not read as failures).
- **D-23:** Ranges longer than 31 days bucket by week (bars stay thumb-tappable at 360dp; 90 daily bars would not).

### Custom From/To picker form
- **D-24:** From/To fields open the DateStrip-style calendar modal (fixed rows, local date keys, never `toISOString`). One date component app-wide.
- **D-25:** Invalid ranges are gated, not auto-corrected: Save disabled until From ≤ To ≤ today, with an inline `destructive` hint. No invalid range can apply.

### OpenCode's Discretion
- Trend-bar taps (offered, not selected): default to read-only chart; link to the day's register only if trivial.
- Exact large-ring diameter, bar widths/gap treatment, weekly-bucket boundary rule (Mon- vs Sun-start), and axis tick density within `tabular-nums` + labeled-legend constraints.
- Exact skeleton block shapes (lightweight, pre-Phase-8) and §7.5 empty-state copy choices (delegated, as in 03-03/03-05).
- Home pill-link exact params (D-06 reconciliation) and custom-picker sheet styling within the modal-scrim precedent (sibling absolute-fill Pressable, plan 03-01).
- "Lowest 3" copy wording and tie-at-boundary behavior (e.g. equal % for 3rd/4th place).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `PRD_Attendance_App.md` §7.5 — Reports & Stats Dashboard scope (today stats, per-worker % over custom range, worksite trends, absent highlight, worksite/date filters)
- `PRD_Attendance_App.md` §9 — Business rules (off_day excluded, half_day = 0.5, soft-deleted history preserved)
- `.planning/REQUIREMENTS.md` — RP-01..RP-05 (pending); PR-01/PR-02 validated (profile math this phase reuses)
- `.planning/ROADMAP.md` — Phase 5 goal, requirements (RP-01..RP-05), and all 5 success criteria (ring + 4 pills, one orange CTA, range + site filters with per-worker %, 3-worker hand-check, labeled charts with exact reconciliation)

### Design contract
- `design.md` §7.1 — Attendance Ring hero (track `muted`, fill `secondary`, `accent` below 75, numeral in `display`, 4-pill row beneath)
- `design.md` §7.3 — Stat Card (2-col grid, `h1` numeral tinted by status, tapping opens the filtered report — precedent for D-06/D-15 tap-throughs)
- `design.md` §7.5 — Empty-state copy table (exact lines for empty lists)
- `design.md` §4 — Status colors (STATUS tokens only for status; tinted pill + dark text for read-only; never color alone)
- `design.md` §10 — Guardrails (one orange action per view, `Pressable` only, flat no-shadow)

### Existing code (read before planning)
- `src/app/(tabs)/index.tsx` — Home placeholder to replace (centered stub, keep tab shell untouched)
- `src/app/(tabs)/reports.tsx` — Reports placeholder to replace (same)
- `src/components/attendance-ring.tsx` — Reusable SVG ring (`value: number | null`, accent < 75 via `ATTENDANCE_PCT_FLOOR`, a11y label)
- `src/utils/attendance.ts` — Pure `summarize()` + `ATTENDANCE_PCT_FLOOR`; zero `@/db` imports (import freely, never add DAO coupling)
- `src/db/attendance.ts` — `getAttendanceForDate`, `getAttendanceForWorker({ from, to })`, `getDailyCounts` (same-scope `(date, worksiteId)` pattern)
- `src/components/date-strip.tsx` — Frozen `DateStripProps` + calendar modal (fixed 30-row `FlatList`, sibling-scrim precedent, local keys only)
- `src/app/(tabs)/attendance.tsx` — CountsHeader precedent (dots + `tabular-nums` + a11y labels), `selectedSite` sibling-state filter, focus refetch, `pendingIds` write guards
- `src/app/worker/[id].tsx` — Profile precedent (7/30/90 chips, ring + 4 counts, skeleton blocks, `void load()` retry discipline, history `FlatList` read-only rows)
- `src/constants/status.ts` — Frozen STATUS/CYCLE/AttendanceStatus contract
- `src/utils/dates.ts` — `todayKey` / `addDays` / `toDateKey` / `formatDisplay` (local keys only, never `toISOString`)
- `.planning/phases/04-worker-profile-history/04-CONTEXT.md` — D-01..D-24 (period defaults, chip pattern, ring rules, read-only history, removed-banner, skeleton loading)
- `.planning/phases/03-attendance-marking/03-CONTEXT.md` — Register decisions (pill cycling, DateStrip, note field, filter + date retention)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AttendanceRing`: takes `value: number | null` and renders % or "—" with the <75 accent rule built in — Home uses it larger, Reports reuses it for the range aggregate.
- `summarize()`: pure over caller-supplied entries — Home summarizes today's rows, Reports summarizes per-worker and per-day buckets without new math or DAO coupling.
- `getDailyCounts(date, { worksiteId })`: today's 4 pills + unmarked line come from one call in the same scope as the rows (never client math).
- `getAttendanceForWorker(workerId, { from, to })`: per-worker % over any range is a caller-side loop — no new DAO needed for RP-02/RP-04.
- `DateStrip` calendar modal: the custom From/To picker reuses its fixed-row `FlatList` + sibling-scrim pattern instead of adding native pickers.
- `EmptyState` + skeleton blocks (`StatsSkeleton` in profile): cover every loading/empty/failure state in this phase with existing contracts.

### Established Patterns
- Single-scope refetch: sibling filter state (`selectedSite` next to range state), one `load()` fetching counts + rows in the identical scope on focus/change; retention is structural.
- `useFocusEffect(useCallback(...))` refetch, catch-all-inside `load()` with `void` callers, "Couldn't load …" + "Try again" error states (CR-01, commit 4088df4).
- One orange action per screen state; destructive text-only; `Pressable` only; 44px targets, 16px gutters, `FlatList` + `keyExtractor` + memo rows; `tabular-nums` on every count/%.
- Active-only DAO filtering (`is_active = 1` server-side); tampered ids render not-found, never reach SQL.
- Teal = structure, orange = actions, status colors = status only (DS-01/DS-03).

### Integration Points
- `src/app/(tabs)/index.tsx` becomes the Home hero (ring + date + pills + unmarked line + CTA); no tab-trigger changes (route already registered).
- `src/app/(tabs)/reports.tsx` becomes filters + range aggregate + bottom-3 callout + per-worker list + trend chart; no tab-trigger changes.
- D-06/D-15 tap-throughs push to existing routes (`/attendance`, `/worker/[id]`) — no new routes in this phase.
- Phase 6 (Export) will consume the same (range, site) scope and `summarize()` math — keep both importable, not screen-local.

</code_context>

<specifics>
## Specific Ideas

- "Who's been unreliable this month?" is the manager's own framing — the bottom-3 callout is the direct answer; the full highest-first list is the audit trail behind it.
- Pills-link-out (D-06) is a new interaction: Home becomes a triage surface, not just a poster. Planner must reconcile with the attendance screen's current filter model (worksite-only) rather than inventing a status-filter param silently.
- No specific product references offered — standard register-app patterns apply (same as Phase 4).

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope (RP-01..RP-05). Trend-bar taps default to read-only (OpenCode's discretion).

</deferred>

---

*Phase: 05-home-dashboard-reports*
*Context gathered: 2026-10-08*
