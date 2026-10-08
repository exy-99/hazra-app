---
phase: 05-home-dashboard-reports
reviewed: 2026-10-08T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/app/(tabs)/index.tsx
  - src/utils/reports.ts
  - src/components/calendar-sheet.tsx
  - src/components/date-strip.tsx
  - src/app/(tabs)/reports.tsx
  - src/components/report-row.tsx
  - src/components/trend-chart.tsx
findings:
  critical: 0
  warning: 9
  info: 8
  total: 17
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-10-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the Home dashboard hero (`src/app/(tabs)/index.tsx`), the reports
shell (`src/app/(tabs)/reports.tsx`), the reports math (`src/utils/reports.ts`),
and the three presentation components (`calendar-sheet`, `date-strip`,
`report-row`, `trend-chart`). Cross-referenced every called API against
`src/db/attendance.ts`, `src/db/workers.ts`, `src/db/worksites.ts`,
`src/db/types.ts`, `src/utils/dates.ts`, `src/utils/attendance.ts`, and
`src/constants/status.ts`.

No security vulnerabilities found: all SQLite access in the call chain is
parameterized, there are no secrets, no `eval`, and no injection surfaces in
the reviewed files. No crash-level defects reachable through current callers.

The recurring theme is **state hygiene and defensive geometry**: an unsafe
type cast that lies about nullability, a stale validation message that survives
a mode switch, an invisible skeleton block, an unclamped bar-width formula, and
several unhandled-but-currently-unreachable edge cases (future dates, malformed
range strings, oversized bucket lists). None corrupts data, but each is a real
incorrect-behavior or robustness gap that should be fixed before ship.

## Critical Issues

No critical issues found.

## Warnings

### WR-01 [WARNING]: Unsafe `as MarkedRow[]` cast defeats strict null typing

**File:** `src/app/(tabs)/index.tsx:40,82,105,107`
**Issue:** `getAttendanceForDate` returns `status: AttendanceStatus | null`
(unmarked workers), but line 82 casts the result to `MarkedRow[]` where
`status` is non-null. The cast preserves runtime nulls while telling the type
system they cannot exist, so the `row.status !== null` checks on lines 105/107
are dead code as far as the compiler is concerned, and any future reader who
trusts the type (e.g. passes `rows` directly to `summarize` without filtering)
reintroduces nulls silently — `summarize`'s `switch` simply ignores unknown
statuses, undercounting without any error.
**Fix:**
```tsx
const [rows, setRows] = useState<AttendanceDateRow[]>([]);
// ...
setRows(data);
const marked = rows.filter((r): r is MarkedRow => r.status !== null);
const hasMarks = marked.length > 0;
const pct = hasMarks ? summarize(marked).percentage : null;
```

### WR-02 [WARNING]: Stale custom-range validation error persists in preset mode

**File:** `src/app/(tabs)/reports.tsx:93-95,231-267,311-317`
**Issue:** `draftFrom`/`draftTo` are never cleared when the user taps a preset
period chip. If the user enters an invalid custom draft (e.g. From after To),
the hint "Choose From on or before To…" appears — and stays visible after
tapping "Last 7 days", even though the report correctly loads preset data.
A false validation error displayed against a valid state is incorrect UI
behavior and will confuse users into thinking the preset report failed.
**Fix:**
```tsx
onPress={() => {
  setDraftFrom(null);
  setDraftTo(null);
  setPeriod(p);
}}
```
or gate the hint on custom entry being the active concern
(`period === 'custom' || customRange !== null`).

### WR-03 [WARNING]: Skeleton stat placeholders render invisible

**File:** `src/app/(tabs)/reports.tsx:50-54,600-603`
**Issue:** `StatsSkeleton` paints the ring/row/chart placeholders with
`{ backgroundColor: muted }`, but the four `statSkeleton` views get only
`styles.statSkeleton` (flex + height, transparent background, no radius).
During loading the counts row is a blank 44px gap instead of shimmer blocks —
the skeleton is structurally incomplete.
**Fix:**
```tsx
{[0, 1, 2, 3].map((i) => (
  <View
    key={`stat-skeleton-${i}`}
    style={[styles.statSkeleton, { backgroundColor: muted }]}
  />
))}
// styles.statSkeleton: add borderRadius: Radius.md
```

### WR-04 [WARNING]: `FlatList` nested inside `ScrollView` for "All workers"

**File:** `src/app/(tabs)/reports.tsx:425-438`
**Issue:** A vertical `FlatList` with `scrollEnabled={false}` is nested in the
outer vertical `ScrollView`, which triggers React Native's nested-
VirtualizedList warning in dev and disables virtualization entirely — every
row renders up front. The adjacent "Frequently absent" section already renders
rows with plain `.map` (lines 402-410), so this is also internally
inconsistent.
**Fix:**
```tsx
<View style={styles.list}>
  {sorted.map((item) => (
    <ReportRow key={item.workerId} workerId={item.workerId}
      name={item.name} summary={item.summary} onOpen={goToProfile} />
  ))}
</View>
```

### WR-05 [WARNING]: Concurrent `load()` calls race; stale response wins

**File:** `src/app/(tabs)/reports.tsx:97-149` (also `src/app/(tabs)/index.tsx:73-89`)
**Issue:** Switching worksite chips or periods in quick succession fires
overlapping `load()` invocations with no sequence guard. `Promise.all` order
is not completion order, so an earlier (stale `from`/`to`/`selectedSite`)
response can resolve last and overwrite fresh state — the screen shows data
for the wrong filter with no indication. Same pattern (focus reload) exists on
Home, lower frequency there.
**Fix:**
```tsx
const seq = useRef(0);
async function load() {
  const my = ++seq.current;
  // ... after awaits:
  if (seq.current !== my) return;
  setAggregate(...); /* ... */
}
```

### WR-06 [WARNING]: Trend bar width goes negative with many buckets

**File:** `src/components/trend-chart.tsx:39-42,77-85`
**Issue:** `bw = (PLOT_WIDTH - GAP * (n - 1)) / n` is unclamped. It stays
positive through current callers (max ~18 weekly buckets → ~14dp), but
`TrendChart` is an exported component accepting arbitrary `buckets`: beyond
~81 buckets `bw` is negative and `<Rect width={bw}>` renders nothing (or
throws on some SVG implementations). No guard at the trust boundary.
**Fix:**
```tsx
const bw = buckets.length === 0
  ? 0
  : Math.max(0, (PLOT_WIDTH - GAP * (buckets.length - 1)) / buckets.length);
```
and skip rendering bars when `bw <= 0`, or cap the bucket count at the call site.

### WR-07 [WARNING]: X-axis labels crowd into unreadable slivers on weekly buckets

**File:** `src/components/trend-chart.tsx:43-46,90-101`
**Issue:** `xRow` renders one `flex: 1` slot per bucket but only labels
first/middle/last, leaving the rest as empty spacers. With 13–18 weekly
buckets each slot is ~18dp wide, so a label like `1 Jan–7 Jan` wraps/clips
inside its sliver with no `numberOfLines`, and the three visible labels are
not aligned to their bars in any meaningful way.
**Fix:** Render only the three labeled ticks in an absolutely-positioned row
(or a `justifyContent: 'space-between'` row of three fixed labels), and add
`numberOfLines={1}`:
```tsx
<View style={[styles.xRow, { justifyContent: 'space-between' }]}>
  {[buckets[0], buckets[middle], buckets[buckets.length - 1]]
    .filter(Boolean).map((b) => (
    <Text key={`x-${b!.key}`} numberOfLines={1}
      style={[styles.xLabel, { color: theme.mutedForeground, flex: 0 }]}>
      {b!.label}
    </Text>
  ))}
</View>
```

### WR-08 [WARNING]: `isValidRange` accepts empty/malformed strings

**File:** `src/utils/reports.ts:15-17`
**Issue:** Pure lexicographic comparison with no format check:
`isValidRange('', '2026-10-08', '2026-10-08')` returns `true` (`'' <=
anything`). Unreachable via the current picker UI (drafts are only set from
valid `onPick` keys), but this is an exported validation boundary and its
single caller (`applyCustom` gate) trusts it absolutely. A malformed `from`
that passes validation flows into `listDatesInRange`, which then emits a
garbage `['', …]` array and `formatDisplay('')` → `"Invalid Date"` labels.
**Fix:**
```tsx
const KEY = /^\d{4}-\d{2}-\d{2}$/;
export function isValidRange(from: string, to: string, today: string): boolean {
  return KEY.test(from) && KEY.test(to) && KEY.test(today)
    && from <= to && to <= today && from <= today;
}
```

### WR-09 [WARNING]: Future `selectedDate` yields a strip with no selection

**File:** `src/components/date-strip.tsx:21-34`
**Issue:** If `selectedDate >= today` (clock skew, timezone edge, or a parent
passing tomorrow), `stripFor` returns `lastNDays(7)` ending today — which does
not contain `selectedDate`. The header shows the future date while no cell is
highlighted and the Today button is enabled-but-already-looks-active; the
component's two halves contradict each other.
**Fix:** Clamp at the top of `stripFor`:
```tsx
function stripFor(selectedDate: string): string[] {
  const today = todayKey();
  if (selectedDate > today) return lastNDays(7); // selection handled by caller clamping
  ...
}
```
and preferably clamp `selectedDate` to `today` in the parent so header and
strip agree.

## Info

### IN-01 [INFO]: 60px dead space between bar baseline and x-labels

**File:** `src/components/trend-chart.tsx:19-24,69-88`
**Issue:** Bars are plotted against `PLOT_HEIGHT` (140) inside an `Svg` of
`CHART_HEIGHT` (200), so bar bottoms sit at y=140 with 60px of empty SVG below
them before the x-labels. The y-ticks (140 tall) align with the bars, but the
labels float 60px under the baseline. Likely `Svg height` should be
`PLOT_HEIGHT`, or bars should scale to `CHART_HEIGHT`.
**Fix:** Use `height={PLOT_HEIGHT}` on the `Svg`, or define a single chart
height constant.

### IN-02 [INFO]: `PILL_KEYS` duplicates the shared `CYCLE` constant

**File:** `src/app/(tabs)/index.tsx:34`
**Issue:** `const PILL_KEYS = ['present', 'absent', 'half_day', 'off_day']` is
byte-identical to `CYCLE` in `@/constants/status.ts`, whose header comment
explicitly says all phases must import from there so parallel definitions never
appear. Same order, same values — import `CYCLE` instead.

### IN-03 [INFO]: Redundant `setLoading(true)` in `retry()`

**File:** `src/app/(tabs)/index.tsx:97-100`, `src/app/(tabs)/reports.tsx:155-158`
**Issue:** `retry()` sets `setLoading(true)` and then `load()` sets it again
as its first statement. Harmless but the double-set suggests the two paths can
drift; just `void load()`.
**Fix:** `function retry() { void load(); }`

### IN-04 [INFO]: `todayKey()` called twice per `DateStrip` render

**File:** `src/components/date-strip.tsx:22,39`
**Issue:** `stripFor` calls `todayKey()` internally and the component calls it
again for `isToday`. A midnight rollover between the two calls (vanishingly
rare, but real on a device left on the screen overnight) makes header/strip
disagree. Compute once and pass down.
**Fix:** `const today = todayKey(); const strip = stripFor(selectedDate, today);`

### IN-05 [INFO]: Unreachable custom-range fallback documents a state that cannot occur

**File:** `src/app/(tabs)/reports.tsx:91-92`
**Issue:** `customRange?.from ?? rangeForPeriod(30, today).from` only matters
when `period === 'custom'` with null `customRange`, but the only transition to
`'custom'` (`applyCustom`) sets both atomically. Defensive default is harmless;
consider an explicit invariant or a comment so future editors don't rely on it.

### IN-06 [INFO]: Redundant `?? 0` in `bottomThree` comparator

**File:** `src/utils/reports.ts:80-81`
**Issue:** After `.filter((row) => row.summary.percentage !== null)`,
`percentage` is non-null, so `?? 0` in the comparator can never fire (unlike
`sortWorkersHighestFirst`, where `?? -1` is load-bearing). Harmless; remove for
clarity or keep for symmetry with a comment.

### IN-07 [INFO]: Explicit `memo` on `ReportRow` is redundant under React Compiler

**File:** `src/components/report-row.tsx:16`
**Issue:** `app.json` enables `reactCompiler`, and AGENTS.md directs authors to
avoid manual memoization. Explicit `memo` is still respected and harmless, but
it adds a second memoization story to maintain. Either keep deliberately with
a comment or drop it.

### IN-08 [INFO]: Minor accessibility inconsistencies

**File:** `src/components/report-row.tsx:62-65`, `src/app/(tabs)/reports.tsx:415`
**Issue:** (a) The status-chip `accessibilityLabel`s sit on a plain `View`
with no `accessibilityRole`, so some screen readers ignore them — move the
label to the pressable card or add `accessibilityRole="text"`. (b) The "All
workers" header (line 415) lacks `accessibilityRole="header"` while
"Frequently absent" and "Trends" have it.

---

_Reviewed: 2026-10-08T00:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
