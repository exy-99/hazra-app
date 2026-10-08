# Phase 5: Home Dashboard & Reports - Pattern Map

**Mapped:** 2026-10-08
**Files analyzed:** 5 (2 modified screens + 3 new components/utils)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/(tabs)/index.tsx` (modify: replace placeholder) | route/screen | request-response (read-only aggregate) | `src/app/worker/[id].tsx` | exact |
| `src/app/(tabs)/reports.tsx` (modify: replace placeholder) | route/screen | request-response (read-only aggregate) | `src/app/(tabs)/attendance.tsx` + `src/app/worker/[id].tsx` | exact |
| `src/components/report-row.tsx` (NEW, maybe) | component | transform (render) | `src/app/worker/[id].tsx` HistoryRow (lines 56-95) | exact |
| `src/components/trend-chart.tsx` (NEW, maybe) | component | transform (render) | `src/components/attendance-ring.tsx` | role-match |
| `src/utils/reports.ts` (NEW, maybe) | utility | transform (bucketing/range) | `src/utils/attendance.ts` + `src/utils/dates.ts` | role-match |

## Pattern Assignments

### `src/app/(tabs)/index.tsx` (route/screen, request-response read aggregate)

**Analog:** `src/app/worker/[id].tsx` (profile: ring + counts + skeleton + focus refetch + one orange CTA)

**Imports pattern** (profile lines 1-26):
```typescript
import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceRing } from '@/components/attendance-ring';
import { EmptyState } from '@/components/empty-state';
import { STATUS } from '@/constants/status';
import { MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { getAttendanceForDate, getDailyCounts } from '@/db/attendance';
import { useTheme } from '@/hooks/use-theme';
import { formatDisplay, todayKey } from '@/utils/dates';
import { summarize } from '@/utils/attendance';
```

**Core load pattern** (profile lines 111-148; Home fixes scope to today — copy shape verbatim):
```typescript
// Profile load() + focus refetch — Home copies with today scope:
// const today = todayKey();
// const [rows, daily] = await Promise.all([
//   getAttendanceForDate(today),
//   getDailyCounts(today),
// ]);
async function load() {
  setLoading(true);
  setLoadError(false);
  try {
    // ... DAO calls in identical scope ...
  } catch {
    setLoadError(true);   // never reset filter state in catch/finally
  } finally {
    setLoading(false);
  }
}
useFocusEffect(useCallback(() => { void load(); }, [/* scope deps */]));
function retry() { setLoading(true); void load(); }
```

**Ring + counts render** (profile lines 374-406):
```tsx
// Home: <AttendanceRing value={pct} size={170} /> (size prop exists — attendance-ring.tsx lines 11-17)
// date above via formatDisplay(todayKey()); counts from getDailyCounts in SAME scope (never client math)
<AttendanceRing value={summary.percentage} />
<View style={styles.countsRow}>
  {stats.map((stat) => (
    <View key={stat.key} style={styles.stat}
      accessibilityLabel={`${stat.value} ${stat.label.toLowerCase()}`}>
      <View style={styles.statTop}>
        <View style={[styles.dot, { backgroundColor: stat.color }]} />
        <Text style={[styles.statValue, { color: theme.foreground }]}>{stat.value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>{stat.label}</Text>
    </View>
  ))}
</View>
```

**Null-filter before summarize** (Pitfall 5 — `getAttendanceForDate` returns `status: null` rows):
```typescript
const pct = summarize(rows.filter((r) => r.status !== null)).percentage; // "—" until first mark
```

**One orange CTA** (profile lines 416-436):
```tsx
<Pressable accessibilityRole="button" accessibilityLabel="Mark attendance"
  android_ripple={{ color: theme.onAccent }} onPress={() => router.push('/attendance')}
  style={({ pressed }) => [styles.cta,
    { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}>
  <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>Mark attendance</Text>
</Pressable>
```

**Screen shell** (placeholder files `src/app/(tabs)/index.tsx` lines 23-37 — keep, swap centered content for ScrollView):
```typescript
container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
safeArea: { flex: 1, maxWidth: MaxContentWidth },
// 16px gutters on children (Spacing.three), NOT on SafeAreaView padding (02-02 precedent)
```

---

### `src/app/(tabs)/reports.tsx` (route/screen, request-response read aggregate)

**Analog:** `src/app/(tabs)/attendance.tsx` (lines 130-201: sibling filter state + single-scope load) + `src/app/worker/[id].tsx` (period chips, skeleton, error states)

**Imports pattern** — union of attendance.tsx lines 1-36 and profile range derivation:
```typescript
import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceRing } from '@/components/attendance-ring';
import { EmptyState } from '@/components/empty-state';
import { STATUS } from '@/constants/status';
import { MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { getAttendanceForWorker } from '@/db/attendance';
import { listWorkers } from '@/db/workers';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDisplay, todayKey } from '@/utils/dates';
import { ATTENDANCE_PCT_FLOOR, summarize } from '@/utils/attendance';
```

**Single-scope load with sibling filter state** (attendance.tsx lines 172-196 — copy verbatim shape):
```typescript
// Reports: selectedSite (null = All) + period/from/to siblings; ONE load() in identical scope
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
    setSites(active); setRows(data); setCounts(daily);
  } catch {
    setLoadError(true);
  } finally {
    setLoading(false);
  }
}
useFocusEffect(useCallback(() => { void load(); }, [selectedDate, selectedSite]));
```

**Reports one-dataset fan-out** (new logic, frozen contracts — `src/db/workers.ts` lines 5-24, `src/db/attendance.ts` lines 56-75):
```typescript
// listWorkers({ worksiteId }) is active-only server-side (is_active = 1); no new DAO needed
const workers = await listWorkers(selectedSite ? { worksiteId: selectedSite } : {});
const entriesByWorker = await Promise.all(
  workers.map((w) => getAttendanceForWorker(w.id, { from, to })),
);
const perWorker = workers.map((w, i) => ({ worker: w, summary: summarize(entriesByWorker[i]) }));
// Range aggregate: summarize(allEntriesFlat) — exact reconciliation by construction
// Sorted highest-first, nulls sink (D-13/D-19):
const sorted = [...perWorker].sort(
  (a, b) => (b.summary.percentage ?? -1) - (a.summary.percentage ?? -1)
    || a.worker.name.localeCompare(b.worker.name));
// Bottom-3: countable only, pct asc, name tiebreak (D-14/D-19):
const bottom3 = perWorker
  .filter((r) => r.summary.percentage !== null)
  .sort((a, b) => a.summary.percentage! - b.summary.percentage! || a.worker.name.localeCompare(b.worker.name))
  .slice(0, 3);
```

**Range derivation** (profile lines 133-135):
```typescript
const to = todayKey();                    // D-09: end capped at today
const from = addDays(to, -(period - 1));  // 7 | 30 | 90; custom sets from/to directly
const data = await getAttendanceForWorker(workerId, { from, to });
```

**Site + period chips** (attendance.tsx lines 311-351; profile lines 196-230):
```tsx
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
  <Text style={[styles.chipText,
    { color: selected ? theme.onPrimary : theme.foreground }]}>{label}</Text>
</Pressable>
```

**Skeleton-on-switch** (profile lines 31-54 `StatsSkeleton` + lines 370-371 content-area branch):
```tsx
// First load: full skeleton. Filter switch: chips stay mounted, skeletons over stats+list.
// loading && data===null → full skeleton; loading && data!==null → content skeletons.
function StatsSkeleton({ muted }: { muted: string }): React.JSX.Element {
  return (
    <View style={styles.statsWrap}>
      <View accessibilityLabel="Loading stats"
        style={[styles.ringSkeleton, { backgroundColor: muted }]} />
      {/* + count blocks + row blocks; ringSkeleton 120→170 for Home hero */}
    </View>
  );
}
```

**Row tap-through object form** (profile line 159 — most recent, typedRoutes-safe):
```typescript
router.push({ pathname: '/worker/[id]', params: { id } });
// Home CTA: plain router.push('/attendance') — no params (D-06 default)
```

**Error / empty branches** (attendance.tsx lines 361-387; profile lines 237-254):
```tsx
{loadError ? (
  <EmptyState icon={Users} title="Couldn't load worker" actionLabel="Try again" onAction={retry} />
) : /* zero-marks → ring "—" + calm EmptyState (never 0%/NaN), NOT an error */}
```

---

### `src/components/report-row.tsx` NEW (component, transform/render)

**Analog:** `src/app/worker/[id].tsx` HistoryRow (lines 56-95)

**Read-only chip pattern** (lines 76-84 — NEVER `StatusPill`, it carries cycle handlers):
```tsx
const chip = STATUS[entry.status];
<View style={[styles.historyChip, { backgroundColor: chip.tint, borderColor: chip.solid }]}>
  <Text style={[styles.historyChipText, { color: chip.text }]}>{chip.label}</Text>
</View>
```

**Row shell + memo + FlatList usage** (lines 56-60, 445-454):
```tsx
const ReportRow = memo(function ReportRow({ /* worker, summary */ }): React.JSX.Element { /* ... */ });
// Parent: <FlatList data={sorted} keyExtractor={(item) => item.worker.id}
//   scrollEnabled={false} contentContainerStyle={styles.historyList}
//   renderItem={({ item }) => <ReportRow ... />} />
```

**Below-floor % text** (D-18 — accent below 75, one floor app-wide):
```tsx
import { ATTENDANCE_PCT_FLOOR } from '@/utils/attendance';
// style={{ color: pct !== null && pct < ATTENDANCE_PCT_FLOOR ? theme.accent : theme.foreground }}
// + fontVariant: ['tabular-nums'] on every count/% (profile lines 565-569)
```

---

### `src/components/trend-chart.tsx` NEW (component, transform/render)

**Analog:** `src/components/attendance-ring.tsx` (lines 1-66 — installed `react-native-svg` precedent)

**Svg import + theme pattern** (lines 1-17):
```tsx
import Svg, { Rect } from 'react-native-svg';  // Rect is first-class (lib README); mirrors in-repo Circle usage
import { useTheme } from '@/hooks/use-theme';
// theme.primary = bars, theme.muted = gap bars, theme.accent reserved (never for bars)
```

**Bar geometry** (ring lines 20-26 show radius/fraction math precedent; chart per RESEARCH Pattern 5):
```tsx
const bw = (plotWidth - gap * (n - 1)) / n;
{Summaries.map((s, i) => {
  const h = s.percentage === null ? GAP_H : (s.percentage / 100) * plotHeight;
  return <Rect key={s.key} x={i * (bw + gap)} y={plotHeight - h}
    width={bw} height={h} rx={3}
    fill={s.percentage === null ? theme.muted : theme.primary} />;
})}
// Axes via RN Text (y-ticks 0/25/50/75/100, tabular-nums; x sparse first/mid/last
// formatDisplay(d,'D MMM')) + one-line legend; whole chart gets accessibilityLabel summary.
// Gap buckets (zero countable): short muted Rect + no % label (D-22 — never a 0% bar).
// Weekly buckets when day-count > 31: from-anchored 7-day chunks (never getDay/startOf('week')).
```

---

### `src/utils/reports.ts` NEW (utility, transform)

**Analog:** `src/utils/attendance.ts` (lines 1-46) + `src/utils/dates.ts` (lines 1-26)

**Pure-function contract** (attendance.ts lines 21-46 — zero `@/db` imports, frozen):
```typescript
import type { AttendanceStatus } from '@/db/types';
// summarize(entries: Pick<{ status: AttendanceStatus }, 'status'>[]): AttendanceSummary
// off_day excluded, half_day 0.5, denominator===0 → percentage null (render "—")
// reports.ts MUST be equally pure: (range, site) helpers + bucketing over caller-supplied
// entries only — importable by screens AND Phase 6 Export, never screen-local.
```

**Date-key helpers** (dates.ts — screens never touch dayjs directly):
```typescript
import { addDays, formatDisplay, lastNDays, todayKey } from '@/utils/dates';
// todayKey(): 'YYYY-MM-DD' local (never toISOString — Asia/Kolkata shift, 01-03 precedent)
// Range validation: string compare is safe on YYYY-MM-DD:
//   valid = from <= to && to <= todayKey()  → else Save disabled + destructive hint (D-25, gate not clamp)
```

---

## Shared Patterns

### Screen shell + theme
**Source:** `src/app/(tabs)/index.tsx` lines 23-37; `src/hooks/use-theme.ts` lines 9-13
```typescript
import { MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';  // prefer over reading Colors; normalizes 'unspecified'→'light'
container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
safeArea: { flex: 1, maxWidth: MaxContentWidth },
// 16px gutters (Spacing.three) on children, MaxContentWidth 800 centered
```
**Apply to:** both modified screens.

### Loading / error discipline (CR-01)
**Source:** `src/app/(tabs)/attendance.tsx` lines 172-201; `src/app/worker/[id].tsx` lines 144-153
```typescript
async function load() { setLoading(true); setLoadError(false);
  try { /* ... */ } catch { setLoadError(true); } finally { setLoading(false); } }
useFocusEffect(useCallback(() => { void load(); }, [/* scope deps */]));
// "Couldn't load …" + "Try again" EmptyState; void callers; never reset filters in catch/finally
```
**Apply to:** both screens (Reports: `[selectedSite, from, to]` deps; Home: fixed today scope).

### Empty states (one orange action)
**Source:** `src/components/empty-state.tsx` lines 8-45
```tsx
<EmptyState icon={Users} title="No attendance marked for this date"
  actionLabel="Add worker" onAction={goToAdd} />
// action = full-width accent button (theme.accent/theme.onAccent); omit action → calm read-only card
// D-04: zero workers → EmptyState + "Add worker" → '/worker-form'; untouched day → ring "—" + CTA, no card
```
**Apply to:** Home zero-workers, Reports zero-marks range.

### Calendar modal (custom From/To picker)
**Source:** `src/components/date-strip.tsx` lines 138-182 + styles 238-251
```tsx
<Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={closePicker}>
  <View style={styles.backdrop}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close date picker"
      onPress={closePicker} style={[styles.scrim, { backgroundColor: theme.foreground }]} />
    <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
      <FlatList data={pastDates} keyExtractor={(key) => key} renderItem={/* radio rows, tabular-nums */} />
    </View>
  </View>
</Modal>
scrim: { ...StyleSheet.absoluteFill, opacity: 0.5 },  // spread form, NOT absoluteFillObject (03-01 gotcha)
sheet: { maxHeight: '70%', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, paddingVertical: Spacing.two },
// REUSE window must reach 90+ days back (DateStrip hardcodes 30 — parametrize daysBack + maxDate=todayKey)
```
**Apply to:** custom From/To picker (extract shared `CalendarSheet` vs duplicate — planner choice; DateStrip becomes thin wrapper if extracted).

### Status colors + typography tokens
**Source:** `src/constants/status.ts` lines 8-17; profile styles lines 565-572
```typescript
STATUS.present.solid/tint/text // status ONLY, never chrome; teal=structure, orange=actions (DS-01/DS-03)
// EVERY count/%/date: fontVariant: ['tabular-nums']; Type.h1/h2/label/caption; nothing below 13px
// Zero hardcoded hex in new files (DS-03 grep gate)
```

### DAO parameterized scope pattern
**Source:** `src/db/attendance.ts` lines 39-54, 77-118; `src/db/workers.ts` lines 5-24
```typescript
// Same-scope (date, worksiteId) / (worksiteId) opts; `?` bindings only — forbid string-interpolated SQL
// getDailyCounts: activeCount server-side (is_active = 1), unmarked = active − marked
// listWorkers defaults includeInactive=false (active-only discipline, D-21)
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/date-picker-sheet.tsx` (if extracted as separate file) | component | request-response | DateStrip modal is embedded, not exported — extraction shape has no standalone analog; copy `date-strip.tsx` lines 138-182 verbatim as the starting point |
| Trend weekly-bucket boundary rule | utility logic | transform | No bucketing code exists in-repo; from-anchored 7-day chunks recommended (RESEARCH A2), planner documents choice |

## Metadata

**Analog search scope:** `src/app/(tabs)/`, `src/app/worker/`, `src/components/`, `src/utils/`, `src/db/`, `src/constants/`, `src/hooks/`
**Files scanned:** 12 (index, reports, attendance, worker/[id], attendance-ring, date-strip, empty-state, utils/attendance, utils/dates, db/attendance, db/workers, constants/status, hooks/use-theme)
**Pattern extraction date:** 2026-10-08
