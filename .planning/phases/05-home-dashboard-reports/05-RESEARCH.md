# Phase 5: Home Dashboard & Reports - Research

**Researched:** 2026-10-08
**Domain:** Expo Router read-model screens (Home hero + Reports) over existing SQLite DAO + pure `summarize()` math + `react-native-svg` bar chart
**Confidence:** HIGH

## Summary

Phase 5 is a **read-only aggregation phase**: no new DAO math, no new dependencies, no new routes. Everything it needs already exists — `summarize()` (`src/utils/attendance.ts`), `AttendanceRing` (`src/components/attendance-ring.tsx`), `getAttendanceForDate` / `getAttendanceForWorker` / `getDailyCounts` (`src/db/attendance.ts`), `listWorkers` / `listWorksites`, the chip/skeleton/focus-refetch precedents from profile + attendance screens, and `react-native-svg` 15.15.5 (installed, proven by the ring). The only genuinely new UI is the **trend bar chart** (one `Rect` per day/week-bucket) and the **custom From/To picker** (DateStrip calendar-modal pattern reuse).

The key architectural insight for the planner: **one scoped data fetch serves the entire Reports screen**. `listWorkers({worksiteId})` + one `getAttendanceForWorker(id, {from, to})` per worker yields entries that can be (a) summarized per worker for the list + bottom-3, (b) re-bucketed by date for the trend chart, and (c) pooled for the range-aggregate ring — zero extra queries, exact reconciliation by construction (criterion #5). Home is even simpler: `getAttendanceForDate(today)` + `getDailyCounts(today)` in one `load()`.

**Primary recommendation:** Build Home hero first (single-scope `load()`, large ring, 4 tappable pills, one orange CTA), then Reports as filters → shared dataset → ring + bottom-3 + sorted list → SVG trend chart, keeping `(range, site)` scope and `summarize()` importable for Phase 6 Export.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Home hero (RP-01)**
- **D-01:** Home ring % reuses `summarize()` — off_day excluded, half_day = 0.5, unmarked days ignored. Ring shows "—" until the first mark of the day. One % definition across profile, home, and reports.
- **D-02:** Counts row is 4 STATUS pills (present / absent / half / off) plus a muted "N unmarked" line beneath. Matches the `getDailyCounts` shape; unmarked recedes instead of competing.
- **D-03:** Exactly one orange CTA — full-width "Mark attendance" below the pills, pushes to `/attendance`. Always visible, even when the day is fully marked.
- **D-04:** Untouched day renders ring "—" + zero pills with CTA intact. Zero workers renders a calm §7.5-style empty state with an Add worker action (never a dead CTA).
- **D-05:** Hero is large — `display`-scale numeral in the ring, today's date above via `formatDisplay`, 4-pill row beneath (design §7.1 glanceable hero, bigger than the profile's 120 ring).
- **D-06:** Home pills tap through to `/attendance` for triage (not a read-only hero). The attendance screen currently has a worksite filter but no status filter — planner reconciles the exact link target (deep-link to register at minimum; status pre-filter only if cheap).

**Reports range + worksite filters (RP-05)**
- **D-07:** Range control is 7 / 30 / 90 preset chips (profile pattern) PLUS a custom From/To picker. Presets for speed, custom for payroll-style ranges.
- **D-08:** Worksite filter is an All + per-site chip row (02-04/03-05 pattern, `radio` role) above the range control. One single scope — every stat and list on screen follows the same (range, site) pair.
- **D-09:** Range end is capped at today. Future days are never selectable (register holds past/present only, AT-02 precedent).
- **D-10:** Switching range/site keeps chips mounted and shows skeleton blocks over stats + list (profile precedent, never a spinner swap or blank flash).
- **D-11:** Default range on first open is Last 30 days (same convention as profile).
- **D-12:** A range with zero marks renders ring "—" + a calm §7.5 empty state (profile zero-days language). Stats never show `0%`/`NaN`.

**Per-worker % list + lowest highlight (RP-02, RP-04)**
- **D-13:** List sorts highest % first (dependable roster reads top-down).
- **D-14:** "Frequently absent" = a fixed bottom-3-by-% callout above the full list (predictable layout; matches the 3-worker hand-check in roadmap criterion #4).
- **D-15:** Rows tap through to the worker profile (`/worker/[id]`). Reports is the read model; corrections stay in the register.
- **D-16:** Per-worker % uses the same `summarize()` math (D-01). Report numbers reconcile exactly with the register (criterion #5).
- **D-17:** Each row shows name + % + 4 mini counts (profile stat language with STATUS dots, `tabular-nums`). % alone is not enough — counts let the manager reconcile at a glance.
- **D-18:** Below 75% the row % text turns `accent` (same floor as the ring rule, D-19 in Phase 4). One floor app-wide.
- **D-19:** Workers with no countable days ("—") sink to the list bottom and are excluded from the bottom-3 ranking (needs countable days to rank).

**Worksite trends over time (RP-03)**
- **D-20:** One bar per day (day's `summarize()` %) drawn with installed `react-native-svg` — no new chart dependency. Labeled axes + legend per criterion #5 (never color alone).
- **D-21:** Trend aggregates active workers' marks in scope only (active-only DAO discipline; removed workers excluded).
- **D-22:** Days with zero countable marks render a muted gap bar + "—", never a 0% bar (holidays must not read as failures).
- **D-23:** Ranges longer than 31 days bucket by week (bars stay thumb-tappable at 360dp; 90 daily bars would not).

**Custom From/To picker form**
- **D-24:** From/To fields open the DateStrip-style calendar modal (fixed rows, local date keys, never `toISOString`). One date component app-wide.
- **D-25:** Invalid ranges are gated, not auto-corrected: Save disabled until From ≤ To ≤ today, with an inline `destructive` hint. No invalid range can apply.

### OpenCode's Discretion
- Trend-bar taps (offered, not selected): default to read-only chart; link to the day's register only if trivial.
- Exact large-ring diameter, bar widths/gap treatment, weekly-bucket boundary rule (Mon- vs Sun-start), and axis tick density within `tabular-nums` + labeled-legend constraints.
- Exact skeleton block shapes (lightweight, pre-Phase-8) and §7.5 empty-state copy choices (delegated, as in 03-03/03-05).
- Home pill-link exact params (D-06 reconciliation) and custom-picker sheet styling within the modal-scrim precedent (sibling absolute-fill Pressable, plan 03-01).
- "Lowest 3" copy wording and tie-at-boundary behavior (e.g. equal % for 3rd/4th place).

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope (RP-01..RP-05). Trend-bar taps default to read-only (OpenCode's discretion).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RP-01 | Today's quick stats on Home — attendance % plus present/absent/half_day/off_day counts | `getAttendanceForDate(today)` rows → `summarize()` for ring ([D-01]); `getDailyCounts(today)` for 4 pills + unmarked line ([D-02]); large `AttendanceRing size={~160-180}` ([D-05]); one orange CTA → `/attendance` ([D-03]) |
| RP-02 | Attendance % per worker over a custom date range | Per-worker loop `listWorkers({worksiteId})` + `getAttendanceForWorker(id,{from,to})` → `summarize()` each ([D-16]); sorted highest-first, nulls sink ([D-13],[D-19]); rows → `/worker/[id]` ([D-15]) |
| RP-03 | Worksite-level attendance trends over time | Same per-worker dataset re-bucketed by date → per-bucket `summarize()` → `react-native-svg` `Rect` bars ([D-20]); gap bars for zero-countable days ([D-22]); weekly buckets when range > 31 days ([D-23]) |
| RP-04 | Highlight list of frequently absent workers | Fixed bottom-3-by-% callout above list, countable-days only ([D-14],[D-19]); row % `accent` below 75 ([D-18]) |
| RP-05 | Filter all reports by worksite and/or date range | All + per-site chips above 7/30/90 presets + custom From/To ([D-07],[D-08]); end capped at today ([D-09]); default Last 30 days ([D-11]); skeleton-on-switch ([D-10]); gated custom range ([D-25]) |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- **Stack:** Expo SDK 57 · RN 0.86 · React 19 · TypeScript strict. Expo APIs change per SDK — verify against versioned docs, never training memory. (No new Expo APIs needed this phase.)
- **Package manager:** npm. New packages via `npx expo install` — **no new packages this phase** (`react-native-svg` already installed).
- **Routes only in `src/app/`**; components/hooks/utils in `src/` outside it. Path aliases `@/*` → `src/*`. No parallel `src/theme` — extend `src/constants/theme.ts`.
- **Styling:** `StyleSheet` + tokens only (no Tailwind). Tokens: `Spacing.three` = 16 gutters, `Type` scale, `Radius`, `MaxContentWidth` 800. Prefer `useTheme()` over reading `Colors`. `tabular-nums` on all numerals.
- **`typedRoutes` + React Compiler are on** — route hrefs are typechecked; avoid manual `useMemo`/`useCallback` except the frozen `useFocusEffect(useCallback(...))` refetch idiom.
- **No test runner / ESLint / CI / `eas.json`.** Verification = `npx tsc --noEmit` + node/grep gates per PLANNING-CONVENTIONS.md. Never run `npm run reset-project`.
- **Dev-build note:** `expo-sqlite` needs a development build, not Expo Go — affects on-device verification only, not code.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home hero aggregation (today's ring + counts) | API / Backend (local DAO) | — | `getAttendanceForDate` + `getDailyCounts` run SQLite on-device; screen only renders |
| Per-worker % over range | API / Backend (local DAO) | Client (pure `summarize()`) | DAO supplies entries; denominator math is pure client-side `summarize()` by frozen contract |
| Trend bucketing (daily/weekly) | Client | — | Pure date-key grouping (`addDays`, string compare on `YYYY-MM-DD`) over already-fetched entries; no SQL needed |
| Custom range validation (From ≤ To ≤ today) | Client | — | Lexicographic compare on local date keys; no backend involvement |
| Navigation (CTA, pill/row tap-throughs) | Client (Expo Router) | — | `router.push` to existing routes only; no new routes |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-svg` | 15.15.5 [VERIFIED: npm registry] | Trend bar chart (`Svg` + `Rect`); already renders `AttendanceRing` | Installed in Phase 1, proven in-repo; D-20 forbids a chart dependency |
| `expo-sqlite` | ~57.0.3 [VERIFIED: package.json] | Attendance/worker reads via frozen DAO | Existing DAO surface covers all phase reads; no new DAO required |
| `dayjs` | 1.11.23 [VERIFIED: npm registry] | Date-key math behind `addDays`/`lastNDays`/`formatDisplay` | Wrapped by frozen `src/utils/dates.ts`; screens never touch dayjs directly |
| `expo-router` | ~57.0.23 [VERIFIED: package.json] | `router.push('/attendance')`, `router.push({pathname:'/worker/[id]',params:{id}})` | Both push shapes already used in-repo (profile `goToEdit`, workers list retarget) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react-native` | ^1.51.0 [VERIFIED: package.json] | `EmptyState` icons, calendar icon for From/To fields | Same icon usage as DateStrip `CalendarDays` row |
| `react-native-reanimated` | 4.5.1 [VERIFIED: package.json] | Optional enter/exit on chip/filter changes | Only if trivially cheap; attendance screen already uses `FadeIn`/`FadeOut` — follow, don't invent |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-native-svg` Rect bars | victory-native / react-native-chart-kit / gifteds | D-20 locks installed svg; chart libs add native weight + new API surface for ~90 bars — never worth it here |
| Per-worker `getAttendanceForWorker` loop | New `getAttendanceForRange(from,to,{worksiteId})` DAO | One query vs N queries, but CONTEXT canonical refs state the loop needs no new DAO; roster is small (single-manager device, local SQLite — N+1 is microseconds). Keep the loop; optionally add the range DAO only if profiling shows a problem [ASSUMED: roster scale] |
| From-anchored 7-day chunks for weekly buckets | Calendar (Mon-start) weeks | From-anchored is simpler, deterministic, locale-free. Recommend from-anchored; planner records the choice |

**Installation:**
```bash
# No new packages — all dependencies already installed.
```

**Version verification:** `react-native-svg` 15.15.5 and `dayjs` 1.11.23 confirmed current via `npm view` 2026-10-08 [VERIFIED: npm registry]. No installs needed.

## Architecture Patterns

### System Architecture Diagram

```
Home screen                                    Reports screen
─────────────                                    ──────────────
Entry: focus / mount                             Entry: focus / mount (+ filter change)
   │                                                │
   ▼                                                ▼
todayKey() ──► load() ──┬── getAttendanceForDate(today, {})    (range, site) state ──► load()
                        └── getDailyCounts(today, {}) ──┐         │                     │
   │                                                    │         ▼                     ▼
   ▼                                                    │   listWorkers({worksiteId})   │
AttendanceRing(summarize(markedRows).pct, size≈170)     │         │                     │
   │                                                    │         ▼                     │
   ▼                                                    │   getAttendanceForWorker × N ─┘
4 tappable STATUS pills + "N unmarked"                  │         │
   │                                                    ▼         ▼
   ▼                                              perWorker = summarize() each
"Mark attendance" CTA ──► router.push('/attendance')    │
                                                        ├──► range ring = summarize(all)
                                                        ├──► bottom-3 (pct asc, countable only)
                                                        ├──► sorted list (pct desc, nulls last) ──► /worker/[id]
                                                        └──► trend = bucket by date ──► summarize/bucket ──► Svg Rect bars
```

A reader traces RP-01 top-to-bottom on the left, RP-02..RP-05 top-to-bottom on the right. Both screens share one `load()`-per-scope shape; Reports fans one dataset out to four render targets.

### Recommended Project Structure

```
src/
├── app/(tabs)/index.tsx      # Home hero (RP-01) — replace placeholder
├── app/(tabs)/reports.tsx    # Reports screen (RP-02..05) — replace placeholder
├── components/
│   ├── attendance-ring.tsx   # REUSE as-is (size prop already exists)
│   ├── empty-state.tsx       # REUSE as-is
│   ├── report-row.tsx        # NEW (maybe): per-worker memo row (name + % + 4 mini counts)
│   ├── trend-chart.tsx       # NEW (maybe): Svg bar chart (bars + axis labels + legend)
│   └── date-picker-sheet.tsx # NEW (maybe): extracted calendar sheet for From/To
└── utils/
    ├── attendance.ts         # REUSE summarize() + ATTENDANCE_PCT_FLOOR (frozen)
    ├── dates.ts              # REUSE todayKey/addDays/formatDisplay (frozen)
    └── reports.ts            # NEW (maybe): range helpers + bucketing (keep importable for Phase 6)
```

New-file placement is planner discretion; the constraint is that `(range, site)` scope helpers and any bucketing math live **outside screens** so Phase 6 Export can import them (CONTEXT integration point).

### Pattern 1: Single-scope `load()` with sibling filter state (copy 03-05 / 04-02)
**What:** `selectedSite` (null = All) + range state (`period: 7|30|90|'custom'`, `from`/`to` keys) as siblings; one `load()` fetches everything in the identical scope; `useFocusEffect(useCallback(...))` refetches on `[selectedSite, from, to]` so register corrections reflect on back. Chip press sets one axis only — retention is structural.
**When to use:** Both screens (Home scope is fixed to today; Reports scope is `(range, site)`).
**Example:**
```typescript
// Source: src/app/(tabs)/attendance.tsx (in-repo precedent, 03-05)
async function load() {
  setLoading(true);
  setLoadError(false);
  try {
    const scope = selectedSite ? { worksiteId: selectedSite } : {};
    const [active, data, daily] = await Promise.all([
      listWorksites(),
      getAttendanceForDate(selectedDate, scope),
      getDailyCounts(selectedDate, scope),
    ]);
    // ...set state
  } catch {
    setLoadError(true);
  } finally {
    setLoading(false);
  }
}
useFocusEffect(useCallback(() => { void load(); }, [selectedDate, selectedSite]));
```

### Pattern 2: One dataset → four Reports render targets (the phase's core move)
**What:** After `workers = await listWorkers(siteScope)` (active-only server-side [VERIFIED: src/db/workers.ts]) and `entriesByWorker = await Promise.all(workers.map(w => getAttendanceForWorker(w.id, {from, to})))`, derive everything client-side with `summarize()`:
- range aggregate: `summarize(allEntriesFlat)`
- per-worker: `summarize(entries)` each → sort `(pct desc, nulls last, name asc)`; bottom-3 = filter countable (`percentage !== null`) → sort `(pct asc, name asc)` → take 3
- trend: group `allEntriesFlat` by `entry.date` (plain object keyed by `YYYY-MM-DD` — lexicographic order = chronological), `summarize()` per bucket; weekly buckets when day-count > 31
**When to use:** Reports `load()`. Guarantees criterion #5 (exact reconciliation) by construction — every number comes from the same fetched rows.
```typescript
// Source: src/utils/attendance.ts + src/db/attendance.ts (in-repo, frozen contracts)
import { summarize } from '@/utils/attendance';
const perWorker = workers.map((w, i) => ({ worker: w, summary: summarize(entriesByWorker[i]) }));
const ranked = perWorker
  .filter((r) => r.summary.percentage !== null)
  .sort((a, b) => a.summary.percentage! - b.summary.percentage! || a.worker.name.localeCompare(b.worker.name));
const bottom3 = ranked.slice(0, 3); // deterministic; ties broken by name — document in plan
```

### Pattern 3: Read-only STATUS pill (never `StatusPill` for display)
**What:** `StatusPill` carries cycle handlers — read-only rows use tint/solid/text `View` chips exactly like the profile `HistoryRow` chip (04-03 precedent). Home's 4 tappable pills wrap these chip Views in a `Pressable` → `/attendance` (D-06).
**When to use:** Home counts row, Reports per-worker mini counts, bottom-3 rows.

### Pattern 4: Skeleton-over-content on filter switch (D-10, 04-02 precedent)
**What:** Keep chips mounted; on `[range, site]` change show skeleton blocks over stats + list (profile `StatsSkeleton` shape: ring-sized block + count blocks + row blocks). Never spinner-swap or blank-flash. First-load skeleton = full screen; subsequent switches = content-area skeletons with `loading && data !== null` distinction.
**When to use:** Reports filter changes. Home needs only first-load + error states (fixed today scope).

### Pattern 5: SVG bar chart with `Rect` (D-20)
**What:** Fixed-height `Svg` (e.g. 180–200) with one `Rect` per bucket: bar height = `pct/100 * plotHeight`, y origin flipped (`y = plotHeight - barHeight`). Labeled axes via RN `Text` (y-ticks 0/25/50/75/100 with `tabular-nums`; x labels sparse — first/mid/last bucket `formatDisplay(d,'D MMM')`), plus a one-line legend (teal square "Attendance %" + muted square "No marks —"). Gap buckets (zero countable): short muted `Rect` + no % label. Whole chart gets an `accessibilityLabel` summary (e.g. "Trend, 12 percent range 40 to 92") since per-bar labels at 90 bars are noise; bars ≥44px touch target only matters if tap-through is implemented (default read-only per discretion).
**When to use:** Trend section only.
**Example:**
```tsx
// Source: react-native-svg README (Rect is a first-class element) + in-repo Svg usage (attendance-ring.tsx)
import Svg, { Rect } from 'react-native-svg';
const bw = (plotWidth - gap * (n - 1)) / n;
{Summaries.map((s, i) => {
  const h = s.percentage === null ? GAP_H : (s.percentage / 100) * plotHeight;
  return <Rect key={s.key} x={i * (bw + gap)} y={plotHeight - h}
    width={bw} height={h} rx={3}
    fill={s.percentage === null ? theme.muted : theme.primary} />;
})}
```
`Rect` props (`x/y/width/height/rx/fill`) follow standard SVG semantics [CITED: https://github.com/software-mansion/react-native-svg#features — "Supports most SVG elements (Rect, Circle, Line, …)"]; exact prop-shapes mirror the in-repo `Circle` usage [VERIFIED: src/components/attendance-ring.tsx]. Bar width at 360dp: 30 daily bars ≈ 9px each — thumb-tappable floor is why D-23 buckets >31-day ranges by week (≈13 bars for 90 days) [ASSUMED: exact widths at planner discretion].

### Pattern 6: Gated custom range (D-24/D-25)
**What:** From/To fields (text rows showing `formatDisplay` or "Select") open the DateStrip calendar-modal pattern — but note the modal is currently **embedded inside `DateStrip`**, not exported. Planner chooses: (a) extract a shared `CalendarSheet({visible, onPick, maxDate})` from DateStrip and reuse in both (cleaner, touches one existing file), or (b) duplicate the fixed-row `FlatList` + sibling-scrim `Pressable` pattern in Reports (zero regression risk to the register). Either way: fixed 30-row-style `FlatList` of local keys capped at today (`key <= todayKey()` filter, 03-01 precedent), sibling absolute-fill scrim via `StyleSheet.absoluteFill` spread (NOT `absoluteFillObject` — 03-01 gotcha). Save disabled until `from <= to && to <= today` (string compare is safe on `YYYY-MM-DD`); inline `destructive` hint otherwise.
**When to use:** Custom From/To picker only. Presets set `{from: addDays(today,-(n-1)), to: today}` directly (profile precedent [VERIFIED: src/app/worker/[id].tsx]).

### Anti-Patterns to Avoid
- **Client-side attendance math:** never count statuses by hand — `summarize()` for % and `getDailyCounts` for today pills. Two % definitions = reconciliation failures (criterion #5).
- **Reusing `StatusPill` for read-only display:** it carries `onCycle`/`onPick` handlers (frozen props); a stray tap would imply editing. Use chip Views (HistoryRow pattern).
- **`toISOString()` for date keys:** local `YYYY-MM-DD` only (`todayKey`/`addDays`/`toDateKey`); UTC conversion shifts days under Asia/Kolkata (01-03 precedent).
- **Auto-correcting invalid ranges:** D-25 mandates gating (disabled Save + hint), not clamping — clamping silently applies a range the manager didn't choose.
- **New routes or tab-trigger edits:** D-06/D-15 tap-throughs target existing routes; `(tabs)/_layout.tsx` stays untouched (routes already registered).
- **Spinner-swap on filter change:** D-10 — skeleton blocks over mounted chips, never a blank flash.
- **0% bars for empty days:** D-22 — muted gap + "—"; a 0% bar reads as total failure and breaks the never-`0%` rule (D-12).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Attendance % | Custom numerator/denominator code | `summarize()` from `@/utils/attendance` | off_day exclusion + half 0.5 + round2 + null-on-empty are frozen and hand-checked (76.79 vector); a second implementation *will* drift |
| Ring rendering | Custom SVG arc math | `AttendanceRing value size` | `<75` accent rule + "—" + a11y label built in; `size` prop already supports the large hero (D-05) |
| Date keys/ranges | dayjs calls in screens, `toISOString`, locale week logic | `todayKey`/`addDays`/`formatDisplay`/`lastNDays` | Midnight/TZ verified Asia/Kolkata (01-03); string-compare safety depends on the exact `YYYY-MM-DD` shape |
| Chart library | victory / chart-kit / custom canvas | `react-native-svg` `Rect` | Installed, version-pinned, in-repo precedent; ~90 rects need no chart engine |
| Date picker | `@react-native-community/datetimepicker` or modal date libs | DateStrip calendar-modal pattern (extract or duplicate) | Native pickers vary by platform and need new deps; local-key `FlatList` pattern already handles the today-cap + scrim correctly |
| Empty/loading states | Bespoke cards | `EmptyState` + `StatsSkeleton`-shape blocks | §7.5 copy + one-orange-action rule already encoded |

**Key insight:** Phase 5 is composition, not invention. Every hard problem (%, ring, dates, skeletons, scrims, chips) was solved in Phases 1–4; the planner's job is wiring, and any plan that builds a parallel implementation of a solved problem is wrong.

## Common Pitfalls

### Pitfall 1: N+1 query volume on 90-day Reports loads
**What goes wrong:** `listWorkers` + N× `getAttendanceForWorker` + (if done naively) D× `getAttendanceForDate` for trend = 100+ queries; UI janks on low-end Android.
**Why it happens:** Treating each render target as an independent fetch instead of deriving all four from one dataset.
**How to avoid:** Pattern 2 — one per-worker loop serves ring + list + bottom-3 + trend. Never call `getAttendanceForDate` per-day for the trend.
**Warning signs:** Plan contains a DAO call inside a date loop.

### Pitfall 2: Skeleton vs empty vs error state collisions
**What goes wrong:** Zero-marks range flashes skeleton → empty → ring "—" triple-jump, or error retry wipes the chips.
**Why it happens:** Single `loading` boolean conflating first-load with filter-switch, or `loadError` clearing filter state.
**How to avoid:** Profile precedent — `loading && data===null` full skeleton; `loading && data!==null` content-area skeletons with chips mounted; `loadError` shows retry card but preserves `selectedSite`/`from`/`to` state. Zero-marks is an *empty* state (ring "—" + calm card), not an error.
**Warning signs:** `setSelectedSite(null)` or range reset inside `catch`/`finally`.

### Pitfall 3: Weekly-bucket boundary ambiguity
**What goes wrong:** 90-day trend buckets shift by a day between loads, or partial first week renders a misleading % (1 mark = 100% bar).
**Why it happens:** Calendar-week anchoring with locale-dependent week start, or bucketing from `to` backwards leaving a ragged first bucket.
**How to avoid:** From-anchored consecutive 7-day chunks (`chunk k = dates[from+7k .. from+7k+6]`, last chunk may be short — deterministic, documented in plan). Small-denominator buckets are honest by construction (same `summarize()`).
**Warning signs:** `getDay()`/`startOf('week')` anywhere in Reports code.

### Pitfall 4: Home zero-workers vs untouched-day conflation
**What goes wrong:** Zero workers shows ring "—" + dead "Mark attendance" CTA (taps to an empty register with no Add-worker path), or untouched day shows an empty-state card that hides the CTA.
**Why it happens:** One branch handling both states.
**How to avoid:** D-04 — two distinct branches: zero workers → calm §7.5 `EmptyState` with "Add worker" → `/worker-form`; untouched day → ring "—" + zero pills + CTA intact (no empty card).
**Warning signs:** `rows.length === 0` single-branch check without a worker-count distinction.

### Pitfall 5: Unmarked rows leaking into `summarize()`
**What goes wrong:** Home ring divides by unmarked or crashes on null status.
**Why it happens:** `getAttendanceForDate` returns `status: null` rows; passing them raw to `summarize()` (typed for `AttendanceStatus`) silently mis-counts via the `switch` fall-through (null matches no case — counts nothing but suggests denominator confusion).
**How to avoid:** `summarize(rows.filter(r => r.status !== null))` — explicit, typed, matches D-01 "unmarked days ignored". (TypeScript strict will flag the direct pass; the filter is the documented fix.)
**Warning signs:** `summarize(rows)` without a null filter on `AttendanceDateRow[]`.

### Pitfall 6: `router.push` param shape drift
**What goes wrong:** Reports rows push `/worker/${id}` string form while profile expects `useLocalSearchParams<{id}>` — works, until typed-routes regen flags it, or vice versa.
**Why it happens:** Two push styles in-repo (workers list uses string form, profile `goToEdit` uses object form).
**How to avoid:** Copy the object form from profile `goToEdit` (`router.push({ pathname: '/worker/[id]', params: { id } })`) — it's the most recent (04-02) and typechecks under `typedRoutes`. Home CTA: plain `router.push('/attendance')` (no params — D-06 default; status pre-filter only if cheap).
**Warning signs:** Template-literal route strings with interpolated ids.

## Code Examples

Verified patterns from in-repo sources (all [VERIFIED: codebase grep/read 2026-10-08]):

### Home `load()` scope (copy 03-05 shape, fixed today scope)
```typescript
// Sources: src/app/(tabs)/attendance.tsx (load), src/utils/dates.ts
import { getAttendanceForDate, getDailyCounts } from '@/db/attendance';
import { summarize } from '@/utils/attendance';
import { formatDisplay, todayKey } from '@/utils/dates';

const today = todayKey();
const [rows, counts] = await Promise.all([
  getAttendanceForDate(today),   // all sites — Home has no site filter (D-01..D-06)
  getDailyCounts(today),
]);
const pct = summarize(rows.filter((r) => r.status !== null)).percentage; // "—" until first mark
// Header: formatDisplay(today) above <AttendanceRing value={pct} size={170} />
```

### Reports range derivation (profile precedent)
```typescript
// Source: src/app/worker/[id].tsx (load: from/to from period)
import { addDays, todayKey } from '@/utils/dates';
const to = todayKey();                    // D-09: end capped at today
const from = addDays(to, -(period - 1));  // 7 | 30 | 90; custom sets from/to directly
const data = await getAttendanceForWorker(workerId, { from, to });
```

### Site + period chips (copy 02-04/03-05/04-02 verbatim pattern)
```tsx
// Source: src/app/(tabs)/attendance.tsx (chip row), src/app/worker/[id].tsx (period chips)
<Pressable
  key={chip.id ?? '__all__'}
  accessibilityRole="radio"
  accessibilityState={{ selected }}
  accessibilityLabel={label}
  android_ripple={{ color: selected ? theme.onPrimary : theme.muted }}
  onPress={() => setSelectedSite(chip.id)}
  style={({ pressed }) => [styles.chip,
    selected ? { backgroundColor: theme.primary, borderColor: theme.primary }
             : { backgroundColor: theme.surface, borderColor: theme.border },
    { opacity: pressed ? 0.85 : 1 }]}>
```

### Read-only status chip (copy HistoryRow, never StatusPill)
```tsx
// Source: src/app/worker/[id].tsx (HistoryRow chip)
<View style={[styles.chip, { backgroundColor: chip.tint, borderColor: chip.solid }]}>
  <Text style={[styles.chipText, { color: chip.text }]}>{chip.label}</Text>
</View>
// Row % below floor: style={{ color: theme.accent }} when pct !== null && pct < ATTENDANCE_PCT_FLOOR (D-18)
```

### One orange CTA (copy profile Edit / EmptyState action)
```tsx
// Source: src/app/worker/[id].tsx (edit button), src/components/empty-state.tsx (action)
<Pressable accessibilityRole="button" accessibilityLabel="Mark attendance"
  android_ripple={{ color: theme.onAccent }} onPress={() => router.push('/attendance')}
  style={({ pressed }) => [styles.cta, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
  <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>Mark attendance</Text>
</Pressable>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Workers-list rows → `/worker-form` (edit-first) | Rows → `/worker/[id]` profile, Edit inside | 04-03 (2026-10-08) | Reports rows (D-15) follow the new read-model convention; register corrections stay in `/attendance` |
| Stub/local marks in attendance screen | DAO-backed `getAttendanceForDate` + `pendingIds` guards | 03-03 (2026-10-07) | Reports/Home read the same DAO surface — no sync layer needed |
| Inline `ActivityIndicator` on attendance first load | Skeleton blocks (profile `StatsSkeleton`) | 04-02 (2026-10-08) | D-10 mandates skeletons for Reports switches; copy profile shapes |
| `router.back()` count gate = 1 in worksite-form | Gate is now 2 (confirm-remove added second) | 02-06 (STATE.md) | Any plan reusing that gate file must expect 2 — not this phase's files, noted for hygiene |

**Deprecated/outdated:**
- `build_plan.md` React Navigation / JS / `src/theme` stack: stale — Expo Router + TS strict only (AGENTS.md).
- DateStrip's internal 30-day `pastDates` list: capped at 30 days back — the custom From/To picker needs up to 90+ days back; extract/parametrize the window, don't reuse the 30-day constant blindly.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | N+1 per-worker loop is fast enough (single-manager roster, local SQLite, tens of workers × ≤90 days) — no new range DAO needed | Standard Stack / Pattern 2 | If rosters reach hundreds of workers, Reports load janks; mitigation = add `getAttendanceForRange` DAO later (bucketing code unchanged). LOW risk for v1 MVP. |
| A2 | From-anchored 7-day chunks recommended for weekly buckets (planner discretion per CONTEXT) | Patterns 5, Pitfall 3 | If user expects Mon-start calendar weeks, minor expectation mismatch; planner documents choice, cheap to change. |
| A3 | Tie at bottom-3 boundary broken by name asc (deterministic); exact "Frequently absent" copy at executor discretion | Pattern 2 | Cosmetic; any deterministic rule satisfies roadmap hand-check. |
| A4 | `Rect` bar-chart prop shapes mirror standard SVG + in-repo `Circle` usage; exact bar widths/gaps at executor discretion | Pattern 5 | API risk is minimal (Rect is core SVG, lib README confirms support); visual tuning is discretionary by design. |
| A5 | Home scope = all worksites (no site filter on Home per D-01..D-06 silence) | Code Examples | If user wanted a Home site filter, it's a scope addition — flag in planning if doubt remains; CONTEXT shows no such decision. |

## Open Questions

1. **Home pill tap target (D-06 reconciliation)**
   - What we know: Attendance screen has worksite filter only, no status filter; CONTEXT says deep-link to register at minimum.
   - What's unclear: Whether a status pre-filter is "cheap" (requires adding `statusFilter` state + param parsing to attendance.tsx — touches a frozen Phase 3 screen).
   - Recommendation: Default to plain `router.push('/attendance')`; pills still satisfy "triage" by landing on today's register. Only add status params if the planner can show it without destabilizing 03-05 retention gates.

2. **Calendar sheet: extract vs duplicate**
   - What we know: DateStrip's modal is embedded, hardcodes 30-day window; Reports needs From/To pickers capped at today with 90+ day reach.
   - What's unclear: Whether extracting a shared component risks regressing the register (touches `date-strip.tsx`).
   - Recommendation: Planner chooses; lean extract-with-identical-render (move modal verbatim, DateStrip becomes a thin wrapper) since duplication doubles future date-logic maintenance. Either way parametrize `daysBack` and `maxDate`.

3. **Trend-bar taps**
   - What we know: Discretionary, default read-only.
   - Recommendation: Ship read-only; revisit only if executor finds bar→register linking is a 5-line `Pressable` wrapper with no layout cost.

## Security Domain

Security enforcement ON (ASVS L1, block on high). Phase 5 adds **no write path, no new input surface reaching SQL, no network** — strictly read + navigate.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Single-manager, no login (NF-03) |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No roles; soft-delete filtering is data-correctness, enforced server-side in DAO (`is_active = 1`) |
| V5 Input Validation | Yes | Custom From/To keys: lexical `YYYY-MM-DD` compare + `to <= todayKey()` gate; keys only flow into parameterized DAO bindings (`?` placeholders — all DAO verified parameterized); tampered worker ids come from DAO-loaded rows, never user-typed |
| V6 Cryptography | No | No crypto in phase |

### Known Threat Patterns for Expo Router + expo-sqlite (read screens)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via date/worker params | Tampering | All DAO calls use `?` bindings (`getAttendanceForWorker`, `listWorkers`) — planner must forbid string-interpolated SQL; grep-gate `runAsync(\``/template SQL in new files |
| Tampered `/worker/[id]` deep-link from Reports rows | Tampering / Info disclosure | Ids come from DAO rows (not user input); profile already renders not-found for unknown ids — no new handling needed |
| Invalid-range confusion (From > To, future To) | Tampering (integrity of report) | D-25 gating: Save disabled + inline `destructive` hint; no invalid range can apply — planner must gate, not clamp |
| Hardcoded colors breaking dark-mode contrast | Info disclosure (a11y) | DS-03 gate: zero hardcoded hex in new files; STATUS + theme tokens only |

Threat-model note for planner: every `<threat_model>` threat in Phase 5 plans should dispose as **mitigate** (parameterized SQL, D-25 gating, token-only colors) — no accept/transfer expected on read-only screens.

## Sources

### Primary (HIGH confidence)
- Codebase reads 2026-10-08: `src/utils/attendance.ts`, `src/components/attendance-ring.tsx`, `src/db/attendance.ts`, `src/db/workers.ts`, `src/app/(tabs)/attendance.tsx`, `src/app/worker/[id].tsx`, `src/components/date-strip.tsx`, `src/components/empty-state.tsx`, `src/constants/status.ts`, `src/constants/theme.ts`, `src/utils/dates.ts`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/reports.tsx`, `package.json`
- npm registry 2026-10-08: `react-native-svg@15.15.5`, `dayjs@1.11.23` (current — no install needed)
- `.planning` artifacts: `05-CONTEXT.md` (D-01..D-25), `05-UI-SPEC.md` (approved 6/6), `REQUIREMENTS.md` (RP-01..RP-05), `ROADMAP.md` (Phase 5 criteria), `STATE.md` (Phases 1–4 precedents), `PLANNING-CONVENTIONS.md`, `config.json` (`nyquist_validation: false`, `security_enforcement: true`)

### Secondary (MEDIUM confidence)
- [CITED: https://github.com/software-mansion/react-native-svg#features] — Rect/Circle/Line first-class element support (bar-chart approach)

### Tertiary (LOW confidence)
- None — no unverified websearch claims used. Roster-scale performance (A1) and bar-width ergonomics (A4/A5) are marked [ASSUMED] where training knowledge fills gaps.

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — every library version verified via npm registry + package.json; zero new installs.
- Architecture: HIGH — all patterns are in-repo precedents read directly from source (03-05 load shape, 04-02 chips/skeleton/refetch, 04-03 read-only rows, DateStrip modal).
- Pitfalls: HIGH — derived from recorded phase history (STATE.md decisions, 03-01 scrim gotcha, D-22/D-25 hard rules).
- Trend chart specifics (Rect props, bar widths): MEDIUM — core API cited from official README + in-repo Svg precedent; exact dimensions are executor discretion by design.

**Suggested plan split for planner** (4 plans, conventions-conforming): 05-01 Home hero + CTA (RP-01) · 05-02 Reports shell + site/range filters + custom picker (RP-05) · 05-03 per-worker list + bottom-3 + tap-throughs (RP-02, RP-04) · 05-04 trend chart + range aggregate (RP-03). Shared `reports.ts` helpers land in whichever plan needs them first (02 or 03), imported — never duplicated — by the other.

**Research date:** 2026-10-08
**Valid until:** 2026-11-08 (stable domain — frozen in-repo contracts; only risk is Expo SDK drift, none involved here)
