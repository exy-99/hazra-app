# Phase 6: Export (CSV / PDF) - Pattern Map

**Mapped:** 2026-10-09
**Files analyzed:** 4 (2 new/modified routes+utils, 1 modified profile, implied month-sheet reuse)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/export.tsx` (replace placeholder) | route/screen | request-response (DAO → serialize → file-I/O → share) | `src/app/(tabs)/reports.tsx` | role-match |
| `src/utils/export.ts` (new, pure serializers) | utility | transform (entries → CSV string / PDF HTML) | `src/utils/attendance.ts` + `src/utils/reports.ts` | role-match |
| `src/app/worker/[id].tsx` (add Export action) | route/screen | request-response | itself (`src/app/worker/[id].tsx` lines 415-436 Edit CTA) | exact |
| `src/components/month-sheet.tsx` (new, optional — else reuse CalendarSheet) | component | request-response (modal picker) | `src/components/calendar-sheet.tsx` | exact |

## Pattern Assignments

### `src/app/export.tsx` (route/screen, request-response + file-I/O)

**Analog:** `src/app/(tabs)/reports.tsx` (full drill-down-capable screen: sibling state, single-scope `load()`, `useFocusEffect`, skeleton/error/empty states, chip pickers, memo `FlatList`)

**Imports pattern** (`reports.tsx` lines 1-39):
```typescript
import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarSheet } from '@/components/calendar-sheet';
import { EmptyState } from '@/components/empty-state';
import { STATUS } from '@/constants/status';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { getAttendanceForWorker } from '@/db/attendance';
import { listWorkers } from '@/db/workers';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { formatDisplay, todayKey } from '@/utils/dates';
import { summarize, type AttendanceSummary } from '@/utils/attendance';
```

**Screen shell pattern** (`reports.tsx` lines 178-182, 481-499; placeholder `export.tsx` lines 11-20):
```typescript
// Outer row centers content; SafeAreaView caps width. 16px gutters live on
// content children (Spacing.three), NOT on SafeAreaView (02-02 precedent).
<View style={[styles.container, { backgroundColor: theme.background }]}>
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content}>
// styles:
container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
safeArea: { flex: 1, maxWidth: MaxContentWidth },
content: { gap: Spacing.two, paddingHorizontal: Spacing.three,
  paddingVertical: Spacing.two, paddingBottom: BottomTabInset + Spacing.three },
title: { ...Type.h1 },
```

**Single-scope `load()` + focus-refetch pattern** (`reports.tsx` lines 97-149):
```typescript
async function load() {
  setLoading(true);
  setLoadError(false);
  try {
    const [active, workers] = await Promise.all([
      listWorksites(),
      listWorkers(selectedSite ? { worksiteId: selectedSite } : {}),
    ]);
    setSites(active);
    const entriesByWorker: AttendanceEntry[][] = await Promise.all(
      workers.map((w) => getAttendanceForWorker(w.id, { from, to })),
    );
    const allFlat = entriesByWorker.flat();
    setAggregate(summarize(allFlat));
    // ... derive preview counts AND file rows from this SAME dataset
  } catch {
    setLoadError(true);
  } finally {
    setLoading(false);
  }
}

useFocusEffect(
  useCallback(() => {
    void load();
  }, [selectedSite, from, to]),
);

function retry() {
  setLoading(true);
  void load();
}
```
Export adaptation: `load()` fetches pickers (active workers/sites) + the in-scope entries for the preview; the export bytes are built from that SAME in-memory dataset (D-21: preview counts and file content from the SAME DAO scope). Catch-all-inside `load()`, `void` callers.

**Route-param boundary pattern** (`worker/[id].tsx` lines 99, 111-126):
```typescript
const { id } = useLocalSearchParams<{ id: string }>();
// inside load():
const rawId = typeof id === 'string' ? id : '';
const [found, allSites] = await Promise.all([getWorker(rawId), listWorksites(true)]);
if (found === null) {
  setNotFound(true); // tampered ?workerId=/?worksiteId= renders not-found, never reaches SQL
  ...
}
```
Export adaptation: `useLocalSearchParams<{ workerId?: string; worksiteId?: string; month?: string }>()`, normalize to display strings, validate against DAO (`getWorker`/`getWorksite`), render not-found on tamper. All downstream DAO calls use `?`-bound params (see Shared Patterns).

**Chip/segmented picker pattern** (`reports.tsx` lines 189-228, 233-267; styles 512-523):
```typescript
<Pressable
  key={chip.id ?? '__all__'}
  accessibilityRole="radio"
  accessibilityState={{ selected }}
  accessibilityLabel={...}
  android_ripple={{ color: selected ? theme.onPrimary : theme.muted }}
  onPress={() => setSelectedSite(chip.id)}
  style={({ pressed }) => [
    styles.chip,
    selected
      ? { backgroundColor: theme.primary, borderColor: theme.primary }
      : { backgroundColor: theme.surface, borderColor: theme.border },
    { opacity: pressed ? 0.85 : 1 },
  ]}>
  <Text style={[styles.chipText, { color: selected ? theme.onPrimary : theme.foreground }]}>
// styles: chip: { minHeight: 44, minWidth: 96, paddingHorizontal: Spacing.three,
//   borderWidth: 1, borderRadius: Radius.pill }, chipText: { ...Type.label },
```
Export adaptation: scope switcher ("Worker"/"Worksite month") and file-type chips ("CSV"/"PDF", default CSV). Sibling state (`selectedScope` next to `selectedWorker`/`selectedSite`/`selectedMonth`/`selectedFormat`); switching scope preserves the other scope's picks structurally (03-05 retention precedent). File-type selected = `primary`-tinted surface + `foreground` text, never accent. Note: worksite picker EXCLUDES the `__all__` option (register is per-site, D-10).

**Re-entry guard + CTA pattern** (`worker-form.tsx` lines 97-132, 283-302):
```typescript
async function handleSave(): Promise<void> {
  if (saving) { return; }       // CR-02 re-entry guard — copy as `exporting`
  ...
  setSaving(true);
  setSaveError('');
  try {
    await updateWorker(...);    // export: serialize + write file + shareAsync
    router.back();              // export: show success card instead
  } catch {
    setSaveError("Couldn't save — try again");  // export: "Couldn't export — try again"
  } finally {
    setSaving(false);           // guard reset on BOTH paths (D-16)
  }
}
// CTA:
disabled={saveDisabled || saving}
{ saving ? 'Saving…' : saveLabel }   // export: "Exporting…" (CR-02 discipline)
```
Export adaptation: `exporting` boolean; CTA labels "Export worker history" / "Export monthly register"; generating state = inline progress row + disabled CTA; double-tap produces exactly one file; failure deletes partial file, never surfaces it.

**Skeleton/error/empty pattern** (`reports.tsx` lines 43-70, 335-390; `worker/[id].tsx` lines 31-54):
```typescript
function StatsSkeleton({ muted }: { muted: string }): React.JSX.Element {
  return (
    <View style={styles.statsWrap}>
      <View accessibilityLabel="Loading stats" style={[styles.ringSkeleton, { backgroundColor: muted }]} />
      <View style={styles.countsRow}>
        {[0, 1, 2, 3].map((i) => (<View key={`stat-skeleton-${i}`} style={styles.statSkeleton} />))}
      </View>
      <View style={styles.historySkeletonWrap}>
        {[0, 1, 2].map((i) => (<View key={`row-skeleton-${i}`} accessibilityLabel="Loading rows"
          style={[styles.rowSkeleton, { backgroundColor: muted }]} />))}
      </View>
    </View>
  );
}
// render order: loading && data===null → skeleton; loadError → EmptyState with retry;
// data!==null && loading → skeleton-over-preview (pickers stay mounted, 05 D-10)
{loadError ? (
  <View style={styles.emptyWrap}>
    <EmptyState icon={Users} title="Couldn't load reports" actionLabel="Try again" onAction={retry} />
  </View>
) : ...}
// rowSkeleton: { alignSelf: 'stretch', height: 72, borderRadius: Radius.md },
```
Export adaptation: first load = skeleton blocks matching preview-card height; scope switches skeleton the preview only; zero countable rows → CTA disabled + calm no-action empty line; picker-list load failure → "Couldn't load …" + "Try again" `EmptyState`.

**Memo `FlatList` + `keyExtractor` pattern** (`reports.tsx` lines 425-438; `worker/[id].tsx` lines 445-453):
```typescript
<FlatList
  data={sorted}
  keyExtractor={(item) => item.workerId}   // export: keyExtractor on id
  scrollEnabled={false}                     // nested inside ScrollView
  contentContainerStyle={styles.list}       // { gap: Spacing.two }
  renderItem={({ item }) => (<ReportRow ... />)}  // export: memo picker rows / preview rows
/>
```
Worker picker rows reuse 02-04 list language (`name` + `role · site` second line, `radio` role).

---

### `src/utils/export.ts` (utility, transform — NEW FILE)

**Analog:** `src/utils/attendance.ts` (whole file, lines 1-46) + `src/utils/reports.ts` (lines 1-30)

**Pure-serializer contract** (`attendance.ts` lines 1, 21-46):
```typescript
import type { AttendanceStatus } from '@/db/types';

/**
 * Summarize a worker's entries into counts + attendance %.
 * off_day is excluded from the denominator (PRD §9); half_day counts 0.5.
 * Zero countable days → percentage null (callers render "—", never NaN or 0%).
 */
export function summarize(entries: Pick<{ status: AttendanceStatus }, 'status'>[]): AttendanceSummary {
  ...
  return { present, absent, half_day, off_day, denominator, percentage };
}
```
Rules to copy: **zero `@/db` imports** (pure over caller-supplied entries — same constraint as `summarize()`; CONTEXT D-discretion). Signatures take `Pick<>`-narrowed entry types so DAO types never leak. Export helpers:
- `escapeCsvField(field: string): string` — RFC-4180: quote-wrap iff field contains `,`/`"`/newline, double `"` (D-17; probe `left early, told "back tomorrow"` must round-trip).
- `buildWorkerCsv(entries): string` — header `date,status,note`; lowercase machine keys (`present/absent/half_day/off_day`, D-08); missing note → `-` (D-18); sorted by date.
- `buildRegisterCsv(rows: {date, workerName, status, note}[]): string` — header `date,worker,status,note`; sorted by date then worker name (`ORDER BY ... COLLATE NOCASE` precedent at DAO level, `localeCompare` at JS level — see `sortWorkersHighestFirst` in `reports.ts` lines 67-75).
- `buildPdfHtml(...)` — single HTML table: title line, column headers, one row per entry (date via `formatDisplay`, status label from `STATUS[key].label`, note or `—`), footer summary from `summarize()`, legend row (4 STATUS dots + labels, D-20). **Theme-driven HTML generation** (D-19 overrides UI-SPEC fixed-light: read `useTheme()` colors at the screen and pass them in — never hardcode hex in components).

**Date/range helper pattern** (`reports.ts` lines 11-30; `dates.ts` lines 1-26):
```typescript
import { addDays, formatDisplay } from '@/utils/dates';
export function rangeForPeriod(period: 7 | 30 | 90, today: string): ReportRange {
  return { from: addDays(today, -(period - 1)), to: today };
}
export function listDatesInRange(from: string, to: string): string[] { ... }
// dates.ts: todayKey()/toDateKey()/addDays()/formatDisplay() — local keys only, NEVER toISOString
```
Export adaptation: month-range derivation via `addDays` on local `YYYY-MM` keys (e.g. month start = `${month}-01`); month label via `formatDisplay(monthStart, 'MMMM YYYY')`; filenames use `yyyymmdd`/`yyyymm` derived from the same keys. Slug helper (lowercase, no spaces, D-14): `hazra-worker-{slug}-{yyyymmdd}.csv|pdf`, `hazra-register-{siteslug}-{yyyymm}.csv|pdf`.

**File-write/share placement note:** `expo-file-system ~57.0.7` + `expo-sharing ~57.0.22` + `expo-print ~57.0.2` are already installed (`package.json` lines 14, 19, 21) — no new dependencies. Save-to-Downloads first (source of truth), then success card offers `shareAsync` (EX-03 transfer path); share-sheet dismiss changes nothing. Web is best-effort (`Sharing.isAvailable` gate). Keep file-writing helpers importable, not screen-local (Phase 7 Backup reuses them). No `expo-media-library` in v1.

---

### `src/app/worker/[id].tsx` (route/screen MODIFICATION — add Export action)

**Analog:** itself, Edit CTA block (lines 415-436) + styles (lines 624-635)

**One-orange-rule action pattern** (lines 415-436):
```typescript
{removed ? null : (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Edit worker"
    android_ripple={{ color: theme.onAccent }}
    onPress={goToEdit}   // export: router.push({ pathname: '/export', params: { workerId: id } })
    style={({ pressed }) => [
      styles.edit,
      { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
    ]}>
    <Text style={[styles.editLabel, { color: theme.onAccent }]}>Edit</Text>
  </Pressable>
)}
// styles: edit: { alignSelf: 'stretch', minHeight: 44, borderRadius: Radius.md,
//   paddingHorizontal: Spacing.three }, editLabel: { ...Type.label, textAlign: 'center' },
```
D-02 reconciliation: Edit stays the orange action; Export is **secondary** (e.g. `theme.primary`-tinted surface or text-primary row below Edit — planner picks within the one-orange rule). `goToEdit` precedent: `router.push({ pathname: '/worker-form', params: { id } })` (line 159).

---

### `src/components/month-sheet.tsx` (component, request-response — NEW, optional)

**Analog:** `src/components/calendar-sheet.tsx` (whole file, lines 1-98)

**Sheet precedent** (lines 16-71):
```typescript
export interface CalendarSheetProps {
  visible: boolean;
  selectedKey: string | null;
  maxDate: string;
  daysBack: number;
  onPick: (key: string) => void;
  onClose: () => void;
}

export function CalendarSheet({ visible, selectedKey, maxDate, daysBack, onPick, onClose }: CalendarSheetProps) {
  const theme = useTheme();
  const dates = Array.from({ length: daysBack }, (_, i) => addDays(maxDate, -i));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close date picker"
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: theme.foreground }]}
        />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <FlatList
            data={dates}
            keyExtractor={(key) => key}
            renderItem={({ item }) => {
              const selected = item === selectedKey;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={formatDisplay(item)}
                  android_ripple={{ color: theme.muted }}
                  onPress={() => onPick(item)}
                  style={({ pressed }) => [styles.pickItem, { opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={[styles.pickItemLabel,
                    { color: selected ? theme.primary : theme.foreground }]}>
                    {formatDisplay(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
// styles: backdrop: { flex: 1, justifyContent: 'flex-end' },
//   scrim: { ...StyleSheet.absoluteFill, opacity: 0.5 },   // sibling absolute-fill Pressable scrim
//   sheet: { maxHeight: '70%', borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
//     paddingVertical: Spacing.two },
//   pickItem: { justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.three },
//   pickItemLabel: { ...Type.body, fontVariant: ['tabular-nums'] },
```
Export adaptation: month-grid sheet reusing this exact modal + sibling-scrim + fixed-row `FlatList` + `radio` rows; month keys are local (`YYYY-MM`) only; future months never selectable (05 D-09 precedent — clamp list at current month like `maxDate={todayKey()}` in `date-strip.tsx` lines 131-138). Check `date-strip.tsx` (lines 36-51, 131-138) for the `CalendarSheet` wiring before building a second picker — reuse `CalendarSheet` directly if a month grid isn't strictly needed. Label: `"Month: {Month Year}"` with `CalendarDays` affordance.

**Preview sample-row pattern** (do NOT build a new component — copy HistoryRow, `worker/[id].tsx` lines 56-95):
```typescript
const HistoryRow = memo(function HistoryRow({ entry }: { entry: AttendanceEntry }) {
  const theme = useTheme();
  const chip = STATUS[entry.status];
  return (
    <View accessibilityRole="text"
      accessibilityLabel={`${formatDisplay(entry.date)}, ${chip.label}`}
      style={[styles.historyRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.historyTop}>
        <Text style={[styles.historyDate, { color: theme.foreground }]}>{formatDisplay(entry.date)}</Text>
        <View style={[styles.historyChip, { backgroundColor: chip.tint, borderColor: chip.solid }]}>
          <Text style={[styles.historyChipText, { color: chip.text }]}>{chip.label}</Text>
        </View>
      </View>
      {entry.note !== null ? (
        <Text numberOfLines={1} style={[styles.historyNote, { color: theme.mutedForeground }]}>
          {entry.note}
        </Text>
      ) : null}
    </View>
  );
});
// historyRow: { gap: Spacing.one, padding: Spacing.three, borderWidth: 1, borderRadius: Radius.md },
// historyDate: { ...Type.body, fontWeight: '600', fontVariant: ['tabular-nums'] },
// historyChip: { minHeight: 32, paddingHorizontal: Spacing.two, borderWidth: 1, borderRadius: Radius.pill },
// historyChipText / historyNote: { ...Type.caption },
```
Never `StatusPill` (it carries cycle handlers). Up to 5 rows, note truncated `numberOfLines={1}`.

---

## Shared Patterns

### Data access (`?`-bound params, active-only discipline)
**Sources:** `src/db/workers.ts` (lines 5-24), `src/db/attendance.ts` (lines 39-75), `src/db/worksites.ts` (lines 7-17)
```typescript
// workers.ts — active-only default + ? binding, name-sorted:
export async function listWorkers(opts: { worksiteId?: string; includeInactive?: boolean } = {}) {
  const conditions: string[] = [];
  const params: string[] = [];
  if (!includeInactive) { conditions.push('is_active = 1'); }
  if (worksiteId !== undefined) { conditions.push('worksite_id = ?'); params.push(worksiteId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Worker>(`SELECT * FROM workers ${where} ORDER BY name COLLATE NOCASE`, params);
}
// attendance.ts — worker scope + month-range scope (caller-side loops, no new DAO expected):
export async function getAttendanceForWorker(workerId: string, opts: { from?: string; to?: string } = {}) {
  const conditions: string[] = ['worker_id = ?'];
  const params: string[] = [workerId];
  if (opts.from !== undefined) { conditions.push('date >= ?'); params.push(opts.from); }
  if (opts.to !== undefined) { conditions.push('date <= ?'); params.push(opts.to); }
  return db.getAllAsync<AttendanceEntry>(`SELECT * FROM attendance WHERE ${conditions.join(' AND ')} ORDER BY date ASC`, params);
}
// worksites.ts:
export async function listWorksites(includeInactive = false): Promise<Worksite[]> { ... 'WHERE is_active = 1 ORDER BY name COLLATE NOCASE' }
```
**Apply to:** `src/app/export.tsx` (all DAO calls). Never interpolate ids/dates; soft-deleted rows stay reachable by direct `getWorker(id)`/`getWorksite(id)` (`SELECT * ... WHERE id = ?`, D-11) while picker lists stay active-only.

### Theming (no hardcoded hex)
**Source:** `src/hooks/use-theme.ts` (lines 9-13) + `src/constants/theme.ts` (lines 10-51, 80-102)
```typescript
export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;  // normalize 'unspecified' → 'light'
  return Colors[theme];
}
// tokens: Spacing { half:2, one:4, two:8, three:16, four:24, five:32, six:64 },
//   Type { display/h1/h2/body/label/caption }, Radius { sm:8, md:12, lg:16, pill:999 },
//   MaxContentWidth = 800, BottomTabInset; tabular-nums: fontVariant: ['tabular-nums'] on ALL counts/dates/filenames
```
**Apply to:** all new/modified files. Teal = structure, orange = single CTA, STATUS = status only (DS-01/DS-03). Inter everywhere, nothing below 13px.

### Status contract (frozen)
**Source:** `src/constants/status.ts` (lines 8-17)
```typescript
export const STATUS = {
  present: { label: 'Present', solid: '#16A34A', tint: '#DCFCE7', text: '#15803D' },
  absent: { label: 'Absent', solid: '#DC2626', tint: '#FEE2E2', text: '#B91C1C' },
  half_day: { label: 'Half day', solid: '#B45309', tint: '#FEF3C7', text: '#B45309' },
  off_day: { label: 'Off day', solid: '#64748B', tint: '#E2E8F0', text: '#475569' },
} as const;
export const CYCLE = ['present', 'absent', 'half_day', 'off_day'] as const;
export type AttendanceStatus = keyof typeof STATUS;
```
**Apply to:** CSV (lowercase keys), PDF + preview (labels + tint chips + labeled legend, never color alone).

### Empty/error surfaces
**Source:** `src/components/empty-state.tsx` (lines 8-46) — action renders ONLY when label + onAction both provided
```typescript
export function EmptyState({ icon: Icon, title, actionLabel, onAction }: {
  icon: LucideIcon; title: string; actionLabel?: string; onAction?: () => void;
}) {
  const showAction = actionLabel !== undefined && onAction !== undefined;
  ...
  <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Icon size={32} color={theme.mutedForeground} />
    <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
    {showAction ? (<Pressable ... style={{ backgroundColor: theme.accent }}><Text ...>{actionLabel}</Text></Pressable>) : null}
```
**Apply to:** export screen (load failure "Couldn't load …" + "Try again"; zero-marks calm no-action line; export failure is `destructive`-color text + "Try again", NOT an EmptyState card).

### Pressable discipline
**Sources:** `reports.tsx` / `worker/[id].tsx` passim — `Pressable` ONLY (no `TouchableOpacity`); `android_ripple` + `opacity: pressed ? 0.85 : 1`; 44px min targets; `accessibilityRole="radio"` + `accessibilityState={{ selected }}` on pickers; `hitSlop` on icon-only controls.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none — all covered) | — | — | CSV RFC-4180 serializer, `expo-print printToFileAsync` HTML, and `expo-file-system`/`expo-sharing` Downloads+share mechanics have **no in-repo precedent** (grep confirms zero `shareAsync`/`printToFile`/`documentDirectory` usage). Planner must use RESEARCH/lib docs for: exact SDK-57 `expo-file-system` write + Downloads path, `expo-print` HTML/CSS limits, `expo-sharing` web gating, web download fallback. Pure-serializer placement follows `summarize()` constraint above. |

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/utils/`, `src/db/`, `src/hooks/`, `src/constants/`, `package.json`
**Files scanned:** ~45 (`src/**/*.{ts,tsx}` glob = 44 files + package.json)
**Pattern extraction date:** 2026-10-09
