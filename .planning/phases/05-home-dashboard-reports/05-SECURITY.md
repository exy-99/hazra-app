---
phase: 05
slug: home-dashboard-reports
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-08
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| SQLite DAO → Home screen | `getAttendanceForDate`/`getDailyCounts` return today's rows/counts; screen renders only, never writes | Today's rows/counts (attendance data) |
| Screen → Expo Router | `router.push('/attendance')` and `router.push('/worker-form')` string pushes to existing routes | Route strings (no params) |
| SQLite DAO → Reports screen | `listWorksites`/`listWorkers`/`getAttendanceForWorker` reads; screen renders only, no writes, no new SQL | Worksite/worker/attendance rows |
| User date picks → DAO range args | From/To keys flow only into parameterized `{from, to}` bindings after `isValidRange` gating | `YYYY-MM-DD` date keys (non-sensitive) |
| DAO rows → list derivation | `perWorker` built only from DAO-loaded workers/entries; `summarize()` is pure client math | Per-worker summaries |
| List rows → `/worker/[id]` | Ids come from DAO rows (not user input); profile already renders not-found for unknown ids | Worker id strings |
| DAO dataset → trend buckets | Buckets group already-fetched in-scope entries by date key; `summarize()` per bucket is pure math | Per-bucket percentages |
| Chart → user | Read-only render; no navigation, no input, no writes | Rendered percentages (read-only) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-01-HOME | Tampering | index.tsx DAO reads | mitigate | No new SQL in this file — reads go only through frozen parameterized DAO (`?` bindings in `src/db/attendance.ts`); grep-gate forbids template-literal SQL here | closed |
| T-05-01-NAV | Tampering | CTA/pill pushes | mitigate | Plain string routes only (`/attendance`, `/worker-form`); no params interpolated, so no tampered-id surface | closed |
| T-05-01-COLOR | Info disclosure (a11y) | pills/ring | mitigate | STATUS + theme tokens only (zero hardcoded hex); every pill carries label text, never color alone | closed |
| T-05-02-SQL | Tampering | reports.tsx + reports.ts | mitigate | Zero new SQL — all reads via frozen parameterized DAO (`?` bindings); reports.ts has zero `@/db` imports; no string-interpolated SQL in new files | closed |
| T-05-02-RANGE | Tampering (report integrity) | custom From/To picker | mitigate | `isValidRange(from,to,today)` (lexicographic `YYYY-MM-DD` compare + today cap) disables Save + shows inline `destructive` hint; no invalid range can apply — gate, never clamp | closed |
| T-05-02-SHEET | Tampering | CalendarSheet | mitigate | `daysBack` window + `maxDate={todayKey()}` cap generation-side; future keys can never be produced, not just rejected | closed |
| T-05-02-COLOR | Info disclosure (a11y) | chips/ring/counts | mitigate | Theme + STATUS tokens only (zero-hex gate); radio roles + labels, never color alone | closed |
| T-05-03-IDS | Tampering / Info disclosure | goToProfile push | mitigate | Object-form push with DAO-sourced `id` bound as router param (never interpolated SQL — profile binds it as `?`); tampered deep-links render the existing not-found EmptyState | closed |
| T-05-03-MATH | Tampering (report integrity) | per-worker derivation | mitigate | Single `summarize()` definition reused (no parallel math); numbers reconcile by construction | closed |
| T-05-03-COLOR | Info disclosure (a11y) | row % + mini chips | mitigate | `accent`-below-75 is text color paired with the numeric % (never color alone); STATUS chips carry label text; zero-hex gate | closed |
| T-05-04-SQL | Tampering | trend derivation | mitigate | Zero new queries — grouping is client-side over the parameterized 05-02 fetch; no per-day `getAttendanceForDate` loops, no template SQL | closed |
| T-05-04-GAP | Tampering (report integrity) | gap rendering | mitigate | Zero-countable → `summarize()` null → muted `GAP_H` bar + no label; holidays can never render as 0% failure bars | closed |
| T-05-04-BUCKET | Tampering (report integrity) | weekly bucketing | mitigate | From-anchored 7-day chunks in pure `bucketDates` (no locale week APIs); deterministic across loads | closed |
| T-05-04-COLOR | Info disclosure (a11y) | bars/axes/legend | mitigate | Labeled axes + text legend + chart-level `accessibilityLabel` summary (never color alone); zero-hex gate | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-05-01-HOME | `src/app/(tabs)/index.tsx` — zero `SELECT`/`INSERT`/`DELETE` hits; reads only via `getAttendanceForDate(today)` + `getDailyCounts(today)` (`:78-81`); DAO binds as `?` params (`src/db/attendance.ts:16-17`, `:50-53`, `:98-100`) |
| T-05-01-NAV | `src/app/(tabs)/index.tsx:133` (`router.push('/worker-form')` plain string); `:156`, `:187` (`router.push('/attendance')` plain strings, CTA + pill); zero template-literal `/worker/${` or `` `/attendance` `` pushes |
| T-05-01-COLOR | `src/app/(tabs)/index.tsx:191` (single `theme.accent` usage); zero hardcoded hex; pills carry `accessibilityLabel` (`:154`) + `chip.label` text (`:172-174`); ring label free from `AttendanceRing` (`src/components/attendance-ring.tsx:32-34`) |
| T-05-02-SQL | `src/utils/reports.ts` — `@/db` 0 hits (imports only `@/utils/attendance` type + `@/utils/dates`); DAO range args bind as `?` (`src/db/attendance.ts:61-74`); zero `SELECT`/`INSERT` in `reports.tsx`/`reports.ts` |
| T-05-02-RANGE | `src/utils/reports.ts:15-17` (`isValidRange`: `from <= to && to <= today && from <= today`); `src/app/(tabs)/reports.tsx:94-95` (`customValid` gate); `:311-317` (destructive hint `Choose From on or before To, both on or before today.`); `:318-333` (`disabled={!customValid}` + reduced opacity Save) |
| T-05-02-SHEET | `src/components/calendar-sheet.tsx:25` (`addDays(maxDate, -i)` generation-side window); `src/app/(tabs)/reports.tsx:457-458`, `:466-469` (`maxDate={todayKey()} daysBack={120}` on both From/To sheets); list keys are `YYYY-MM-DD` strings only, never `toISOString` |
| T-05-02-COLOR | `src/app/(tabs)/reports.tsx:196`, `:236-237` (`accessibilityRole="radio"` + `accessibilityState={{ selected }}`); `:198`, `:238` (`accessibilityLabel` on every chip); zero hardcoded hex; colors from `theme`/`STATUS` only |
| T-05-03-IDS | `src/app/(tabs)/reports.tsx:151-153` (`router.push({ pathname: '/worker/[id]', params: { id } })` object form, id from DAO-loaded `workers` rows); zero `/worker/${` template pushes; profile binds id as `?` (`src/db/workers.ts:28-31`) |
| T-05-03-MATH | `src/app/(tabs)/reports.tsx:110` (`summarize(allFlat)` aggregate), `:114` (`summarize(entriesByWorker[i])` per-worker), `:134` (`summarize(dayEntries)` per-bucket) — one frozen definition, no parallel math |
| T-05-03-COLOR | `src/components/report-row.tsx:23-24` (`ATTENDANCE_PCT_FLOOR` compare), `:53` (`belowFloor ? theme.accent : theme.foreground` paired with numeric %), `:55` (`—` for null, never `0%`); `:63-71` (mini chips with `accessibilityLabel` + `meta.label` text); zero hex |
| T-05-04-SQL | `src/app/(tabs)/reports.tsx:107` (single `getAttendanceForWorker` call site, line `:21` is the import); `getAttendanceForDate` 0 hits in `reports.tsx`; trend groups already-fetched `allFlat` client-side (`:120-136`) |
| T-05-04-GAP | `src/components/trend-chart.tsx:17` (`GAP_H = 8`); `:73-75` (null → `GAP_H` height, no % label); `:84` (`countable ? theme.primary : theme.muted`); zero-countable buckets yield `percentage: null` by `summarize()` (`reports.tsx:134`) |
| T-05-04-BUCKET | `src/utils/reports.ts:38` (from-anchored comment verbatim); `:48-57` (consecutive 7-day chunks, `key = first`); `getDay(`/`startOf(` 0 hits in `reports.tsx`, `trend-chart.tsx`, `reports.ts` |
| T-05-04-COLOR | `src/components/trend-chart.tsx:34-37` (chart-level `accessibilityLabel`: `No trend data` / `Trend, N bars, range min% to max%`); `:56-67` (y-ticks `0/25/50/75/100` + `tabular-nums`); `:90-101` (sparse x labels); `:102-113` (legend `Attendance %` + `No marks —`); zero hex; `Pressable`/`onPress` 0 (read-only bare `Rect`s) |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| — | — | No `accept`-disposition threats in Phase 05 threat models; all 14 threats mitigate with implementation evidence above. | — | — |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-08 | 14 | 14 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-08
