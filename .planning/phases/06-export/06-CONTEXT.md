# Phase 6: Export (CSV / PDF) - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Attendance can leave the app in a payroll-usable form and open correctly outside it. Single drill-down route at `src/app/export.tsx` (placeholder) covering two scopes: per-worker history export (EX-01) and per-worksite monthly register (EX-02), each in CSV and/or PDF, saved to Downloads and shareable to a second device (EX-03, NF-06). No backup/restore UI — Phase 7. No new capabilities beyond EX-01..EX-03, NF-06.

</domain>

<decisions>
## Implementation Decisions

### Entry points
- **D-01:** Export is reachable from everywhere — Reports per-worker rows, worker profile, and the central export screen all lead to the single `src/app/export.tsx` drill-down route. No tab changes (4-tab max).
- **D-02:** The worker profile gains an Export action below Edit. Planner reconciles styling with the Phase 4 one-orange rule (Edit stays the orange action; Export is secondary).
- **D-03:** Deep links preselect scope — Reports rows push `?workerId=`, worksite context pushes `?worksiteId=&month=`. Params are display strings at the route boundary, bound as `?` params downstream, never interpolated (01-08 T-08-01 precedent).
- **D-04:** The export screen owns active-only worker/site pickers (memo `FlatList`, `keyExtractor` on id, `radio` role, 02-04 list language) so direct opens work without push params.

### File formats
- **D-05:** Both CSV and PDF are offered with a file-type switch; CSV is the default (payroll-usable first).
- **D-06:** CSV columns stay simple and spreadsheet-ready — worker scope: `date,status,note`; worksite-month scope: `date,worker,status,note`, sorted by date then worker name. No summary rows inside the CSV.
- **D-07:** PDF is a simple single HTML table via installed `expo-print` (`printToFileAsync`) — title line, column headers, one row per entry (date via `formatDisplay`, status label text, note or `—`), footer summary line from `summarize()`.
- **D-08:** Status values in CSV are lowercase machine keys (`present` / `absent` / `half_day` / `off_day`).

### Export scope
- **D-09:** Worker export covers full recorded history via `getAttendanceForWorker(id)` + `summarize()` — no custom range picker in v1 (keeps it payroll-simple).
- **D-10:** Worksite register covers exactly one active worksite + one month. All-sites is excluded (a register is per-site). Month picked via a month-grid sheet reusing the DateStrip calendar modal (fixed rows, sibling absolute-fill `Pressable` scrim, local date keys only, never `toISOString`); future months never selectable (05 D-09 precedent).
- **D-11:** Removed (soft-deleted) workers/sites remain exportable by deep-link id — history stays trustworthy per PRD §9. Active-only discipline applies to picker lists only.
- **D-12:** Zero countable rows → CTA disabled + calm no-action empty line (never an export of an empty file without explicit user confirm).

### Save and share flow
- **D-13:** Save to Downloads first (source of truth), then a success card offers system share sheet (`expo-sharing` `shareAsync` — the EX-03 second-device transfer path) plus muted "Export another" reset. Share-sheet dismiss changes nothing.
- **D-14:** Slug filenames, lowercase, no spaces: `hazra-worker-{slug}-{yyyymmdd}.csv|pdf` and `hazra-register-{siteslug}-{yyyymm}.csv|pdf`.
- **D-15:** Web is best-effort — file download where supported; share sheet only where `Share.isAvailable`. Researcher confirms exact SDK-57 web behavior of `expo-file-system` / `expo-sharing` / `expo-print` and the planner picks the download mechanism.
- **D-16:** Failure path is `destructive`-text "Couldn't export — try again" + "Try again" retry (CR-01/CR-02 discipline, `exporting` guard reset); partial files are deleted, never surfaced.

### CSV edge cases
- **D-17:** RFC-4180 strict quoting — every field containing `,` / `"` / newline is quote-wrapped with `"` doubled. The roadmap probe (`left early, told "back tomorrow"`) must round-trip to the correct column count in Excel/Sheets (success criterion #1).
- **D-18:** A missing note in CSV writes a `-` dash placeholder (same convention as the PDF `—` cell).

### PDF styling
- **D-19:** PDF table styling matches the app's current theme. CONFLICT NOTE: `06-UI-SPEC.md` specifies explicit light-register styling regardless of theme — this user decision overrides it; planner reconciles (e.g. theme-driven HTML generation) and researcher checks `expo-print` HTML/CSS limits.
- **D-20:** PDF includes a labeled status legend row (4 STATUS dots + labels, never color alone) plus the footer summary line (`P present · A absent · H half day · O off day · N%` from `summarize()`).

### Preview + generating states
- **D-21:** Preview card above the CTA shows the row-count line (`tabular-nums`: worker scope `"N days · P present · A absent · H half day · O off day"`; worksite scope `"N workers · M marks · {Month Year}"`) plus up to 5 sample rows (date + read-only STATUS-tint chip + note truncated `numberOfLines={1}` — 04-03 HistoryRow language, never `StatusPill`). Preview counts and file content come from the SAME DAO scope.
- **D-22:** Generating state is an inline progress row + disabled "Exporting…" CTA with an `exporting` re-entry guard (CR-02 discipline; double-tap produces exactly one file). No blocking modal. First load uses skeleton blocks matching preview-card height; scope switches skeleton the preview only, pickers stay mounted (05 D-10 precedent).

### OpenCode's Discretion
- Exact sample-row note truncation length and preview-card padding within `Radius.md` / 16px-gutter constraints.
- Exact §7.5-calibrated empty-state copy ("No attendance to export yet" family) and row-count wording details.
- Slug-generation algorithm (lowercase, no-spaces within the D-14 filename contract).
- Month-grid sheet styling within the DateStrip modal precedent.
- Web download mechanics (researcher investigates SDK-57 `expo-file-system` / `expo-sharing` web support first).
- `exportCSV` / `exportPDF` helper placement (`src/utils/export.ts` vs co-located) within the pure-serializer constraint (zero `@/db` imports, same as `summarize()`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `PRD_Attendance_App.md` §7.6 — Export scope (single-worker history, full-worksite monthly register, Downloads save)
- `PRD_Attendance_App.md` §9 — Business rules (off_day excluded, half_day = 0.5, soft-deleted history intact and viewable/exportable)
- `PRD_Attendance_App.md` §10 — Technical stack (expo-file-system, expo-sharing, expo-print)
- `PRD_Attendance_App.md` §11 — Success metrics (CSV opens in Excel/Sheets, PDF viewable)
- `.planning/REQUIREMENTS.md` — EX-01..EX-03, NF-06 (pending)
- `.planning/ROADMAP.md` — Phase 6 goal, requirements (EX-01..EX-03, NF-06), and all 3 success criteria (RFC-4180 probe, Downloads files, second-device opening)

### Design contract
- `.planning/phases/06-export/06-UI-SPEC.md` — Approved UI contract (APPROVED 2026-10-09, 5 PASS + 1 FLAG Typography advisory). Planner consumes as design context. KNOWN CONFLICTS overridden by user decisions above: PDF fixed-light styling (overridden by D-19), profile one-orange rule vs Export action (D-02 reconciliation).
- `design.md` §8 — Export/Backup row; `design.md` §4 — Status colors (STATUS tokens only for status, never color alone); `design.md` §7.5 — Empty-state copy table; `design.md` §10 — Guardrails (one orange action per view, `Pressable` only, flat no-shadow)

### Existing code (read before planning)
- `src/app/export.tsx` — Placeholder to replace (keep drill-down route registration, no tab changes)
- `src/utils/attendance.ts` — Pure `summarize()` + `ATTENDANCE_PCT_FLOOR`; zero `@/db` imports (export summaries reuse the ONE % definition)
- `src/db/attendance.ts` — `getAttendanceForWorker(id)` (worker scope), month-range attendance queries for the register (same-scope pattern, never client math)
- `src/db/worksites.ts` / `src/db/workers.ts` — Active-only list discipline; `?`-bound params, never interpolated
- `src/components/date-strip.tsx` — Calendar modal + sibling-scrim precedent (`StyleSheet.absoluteFill` spread) for the month picker
- `src/components/calendar-sheet.tsx` — Phase 5 sheet precedent (check before building a second picker)
- `src/app/(tabs)/reports.tsx` — Pushes `?workerId=` / `?worksiteId=&month=` deep links (D-03 entry points)
- `src/app/worker/[id].tsx` — Hosts the new Export action (D-02); read-only HistoryRow language for preview rows
- `src/components/empty-state.tsx` — Shared EmptyState (action only when label + onAction both provided)
- `src/utils/dates.ts` — `todayKey` / `formatDisplay` / month-key helpers (local keys only, never `toISOString`)
- `src/constants/status.ts` — Frozen STATUS/CYCLE/AttendanceStatus contract (CSV lowercase keys + PDF labels)
- `package.json` — `expo-file-system ~57.0.7`, `expo-print ~57.0.2`, `expo-sharing ~57.0.22` already installed; no new dependencies
- `.planning/phases/05-home-dashboard-reports/05-CONTEXT.md` — D-01..D-25 (summarize reuse, (range, site) scope, skeleton-over-stats, report-row language)
- `.planning/phases/04-worker-profile-history/04-CONTEXT.md` — Read-only history rows, removed-banner, profile conventions
- `.planning/phases/03-attendance-marking/03-CONTEXT.md` — Register decisions (pill cycling, DateStrip, filter + date retention)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `summarize()`: pure over caller-supplied entries — export footers/summaries reuse it with zero DAO coupling; the 76.79 hand-check vector still guards it.
- `getAttendanceForWorker(id)` + month-range attendance queries: both export scopes are caller-side loops over existing DAO calls — no new DAO expected, just callers.
- DateStrip calendar modal + sibling-scrim pattern: the month picker reuses fixed-row `FlatList` + scrim instead of native pickers (one date component app-wide).
- `EmptyState` + profile `StatsSkeleton` precedent: cover zero-marks, load-failure ("Couldn't load …" + "Try again", `void load()`), and generating states with existing contracts.
- `expo-file-system` + `expo-sharing` + `expo-print` already installed (01-01): CSV serializer is hand-rolled RFC-4180, PDF via `printToFileAsync` HTML table. No `expo-media-library` in v1.
- 04-03 HistoryRow read-only language (formatDisplay date + STATUS-tint chip + `numberOfLines={1}` note) is the preview sample-row pattern — never `StatusPill` (it carries cycle handlers).

### Established Patterns
- Single-scope fetch: preview counts and file bytes come from the SAME DAO scope in one `load()`; retention is structural (sibling state, 03-05 precedent).
- `useFocusEffect(useCallback(...))` refetch, catch-all-inside `load()` with `void` callers, polite `theme.destructive` error surfaces (CR-01/CR-02).
- `exporting` re-entry guard + "Exporting…" disabled CTA (CR-02); double-tap produces exactly one file.
- One orange CTA per screen state ("Export worker history" / "Export monthly register"); destructive text-only; `Pressable` only; 44px targets, 16px gutters on children (not `SafeAreaView`), `FlatList` + `keyExtractor` + memo rows; `tabular-nums` on every count/date/filename.
- Teal = structure, orange = actions, status colors = status only (DS-01/DS-03); Inter everywhere, nothing below 13px.
- Tampered `?workerId=` / `?worksiteId=` render not-found, never reach SQL.

### Integration Points
- `src/app/export.tsx` becomes scope switcher ("Worker" / "Worksite month") + pickers + file-type chips + preview card + CTA + success card; no tab-trigger changes (drill-down route already registered).
- `src/app/(tabs)/reports.tsx` per-worker rows and worksite context push deep links with params preselected (D-03).
- `src/app/worker/[id].tsx` gains the Export action pushing `?workerId=` (D-02).
- Phase 7 (Backup) will reuse the Downloads-save + share-sheet mechanics — keep file-writing helpers importable, not screen-local.

</code>

<specifics>
## Specific Ideas

- "Payroll-ready files saved to Downloads" — the manager's mental model is payroll handoff; CSV-first default (D-05) and simple machine-parseable columns (D-06/D-08) serve that directly.
- Strict RFC-4180 quoting (D-17) exists because real notes contain commas and quotes — the roadmap probe note is the acceptance test, not an edge case.
- Theme-matched PDF (D-19) is an explicit user override of the UI-SPEC default — downstream agents must follow D-19, not the UI-SPEC, on this point.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope (EX-01..EX-03, NF-06). Custom worker date ranges deferred by decision (D-09 full-history), not raised as a future ask.

</deferred>

---

*Phase: 06-export*
*Context gathered: 2026-10-09*
