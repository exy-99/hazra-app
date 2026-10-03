---
phase: 01-foundation
reviewed: 2026-10-03T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - src/constants/status.ts
  - src/constants/theme.ts
  - src/utils/dates.ts
  - src/utils/ids.ts
  - src/db/types.ts
  - src/db/index.ts
  - src/db/worksites.ts
  - src/db/workers.ts
  - src/db/attendance.ts
  - src/components/app-tabs.tsx
  - src/components/app-tabs.web.tsx
  - src/app/index.tsx
  - src/app/attendance.tsx
  - src/app/workers.tsx
  - src/app/reports.tsx
  - src/app/worksites.tsx
  - src/app/worker/[id].tsx
  - src/app/worksite-form.tsx
  - src/app/worker-form.tsx
  - src/app/export.tsx
  - src/app/backup.tsx
  - src/app/_layout.tsx
  - src/components/empty-state.tsx
findings:
  critical: 2
  warning: 9
  info: 4
  total: 15
status: issues-found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues-found

## Summary

Reviewed the foundation layer (constants, date/id utils, expo-sqlite DB layer,
native + web tab shells, 10 route placeholders, root layout, empty-state) at
standard depth with cross-file tracing (status CHECK constraint vs `STATUS`
keys, param ordering in JOIN queries, route-name vs tab-trigger names).

Good news verified by tracing: all dynamic SQL values use parameterized (`?`)
bindings (update-builders only interpolate allowlisted column-name constants),
and `STATUS` keys exactly match the `CHECK(status IN
('present','absent','half_day','off_day'))` constraint. No hardcoded secrets,
no `eval`/`innerHTML`, no string-interpolated user input in SQL.

Two crash-grade defects block shipping: the root layout mounts the tab tree
before `initDatabase()` resolves (any DB query on mount throws via `getDb()`),
and the native tab shell indexes `Colors[scheme]` with a nullable scheme. Nine
warnings (date-parsing without `customParseFormat`, poisoned DB promise, unsafe
route param, web trigger-name mismatch, module-level init flag, missing input
validation, orphan routes, aliased `require`) and four info items follow.

## Critical Issues

### CR-01: Tabs mount before the database is initialized — `getDb()` throws on launch

**File:** `src/app/_layout.tsx:21-47` (trigger), `src/db/index.ts:41-47` (throw site)
**Issue:** `TabLayout` renders `<AppTabs />` unconditionally on first render
while `initDatabase()` is still in flight. There is no `ready`/`pending` gate —
`dbError ? error : <AppTabs />` only branches on failure, never on "still
loading". Any screen that queries the DB in a mount effect calls `getDb()`,
which throws `Database not initialized` because module-level `db` is still
`null`. The splash is hidden only after init, but the React tree (and its
effects) mounts immediately underneath, so this is a launch race, not a hidden
corner. Every DB function (`listWorksites`, `listWorkers`,
`getAttendanceForDate`, …) propagates the throw with no caller-side catch.
**Fix:**
```tsx
const [ready, setReady] = useState(false);
// in the effect finally: setReady(true) (setDbError on failure)
// render:
if (!ready) return null; // splash stays visible until hideAsync
if (dbError) return <ErrorScreen message={dbError} onRetry={retryInit} />;
return <AppTabs />;
```

### CR-02: Nullable color scheme indexes `Colors` — crash when scheme is `null`

**File:** `src/components/app-tabs.tsx:7-8`
**Issue:** `useColorScheme()` from `react-native` returns
`'light' | 'dark' | 'unspecified' | null` (null on first render on some
Android builds). The code only normalizes `'unspecified'`:
`Colors[scheme === 'unspecified' ? 'light' : scheme]`. When `scheme` is `null`,
this evaluates `Colors[null]` → `undefined`, and `colors.background` on line 12
throws `TypeError: Cannot read properties of undefined`. Per `AGENTS.md` the
codebase normalizes to `'light'` and prefers the `useTheme()` hook.
**Fix:**
```tsx
import { useTheme } from '@/hooks/use-theme';
// ...
const theme = useTheme();
// use theme.background, theme.primary, theme.mutedForeground directly
// or at minimum: const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
```

## Warnings

### WR-01: `dayjs(key, 'YYYY-MM-DD')` used without the `customParseFormat` plugin

**File:** `src/utils/dates.ts:15,20`
**Issue:** `dayjs` core ignores the format-string argument without the
`customParseFormat` plugin. `addDays` and `formatDisplay` therefore rely on
lenient native parsing: valid `YYYY-MM-DD` keys happen to work (ISO), but
invalid keys (`'2026-13-40'`, `'not-a-date'`) silently produce `Invalid Date`
objects whose `.format()` returns the literal string `"Invalid Date"` — which
callers will render or pass to SQL `WHERE date = ?` (yielding empty result
sets with no error). `lastNDays` with non-positive `n` silently returns `[]`.
**Fix:**
```ts
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
dayjs.extend(customParseFormat);
// and validate: if (!dayjs(key, 'YYYY-MM-DD', true).isValid()) throw new Error(...)
```

### WR-02: Failed `initDatabase()` permanently poisons the module — no retry possible

**File:** `src/db/index.ts:9-14,32-38`
**Issue:** `dbPromise` is assigned once and never reset. If `openDatabaseAsync`
rejects (locked/corrupt DB, full disk), the rejected promise is cached forever;
every later `initDatabase()` call re-awaits the same rejection. Combined with
CR-01/WR-06 (no retry UI, module-level `initialized` flag), a transient failure
is a permanent dead-end requiring app reinstall. The three `CREATE TABLE`
statements also run outside a transaction, so a mid-init crash can leave a
partial schema with `user_version` never set.
**Fix:**
```ts
export async function initDatabase(): Promise<void> {
  if (!dbPromise) {
    try {
      dbPromise = openDatabaseAsync(DATABASE_NAME);
      const database = await dbPromise;
      db = database;
      // ... schema ...
    } catch (e) { dbPromise = null; db = null; throw e; }
  } else { await dbPromise; }
}
```

### WR-03: Unsafe route param — `id` assumed `string`, rendered unvalidated

**File:** `src/app/worker/[id].tsx:11,18`
**Issue:** `useLocalSearchParams()` returns `string | string[] | undefined` at
runtime; the generic `<{ id: string }>` only silences the compiler. A
deep-link/array param (`string[]`) renders comma-joined garbage in
`Worker {id}`, and `undefined` renders `Worker undefined`. Forwarded to a future
`getWorker(id)` call, an array `id` breaks the `?` binding (expo-sqlite expects
a scalar). No not-found/invalid handling exists.
**Fix:**
```tsx
const { id } = useLocalSearchParams<{ id?: string | string[] }>();
const workerId = Array.isArray(id) ? id[0] : id;
if (!workerId) return <EmptyState icon={UserX} title="Worker not found" />;
```

### WR-04: Web tab trigger `name="home"` does not match any route

**File:** `src/components/app-tabs.web.tsx:22-24`
**Issue:** The route file is `src/app/index.tsx`, whose segment name is
`index` (native shell correctly uses `name="index"` in `app-tabs.tsx:19`). The
web shell declares `name="home" href="/"`. With `typedRoutes` enabled in
`app.json`, `name` must be a valid route segment; `href` may mask the breakage
for taps, but focused-state tracking and typechecked routing disagree between
platforms — the exact class of native/web split bug `AGENTS.md` warns about.
**Fix:**
```tsx
<TabTrigger name="index" href="/" asChild>
```

### WR-05: `TabButton` leaks `isFocused` to `Pressable` and returns `false` as style

**File:** `src/components/app-tabs.web.tsx:40-52`
**Issue:** Two defects: (a) `{...props}` spreads `isFocused` (part of
`TabTriggerSlotProps`) onto `Pressable`, which forwards the unknown prop to the
underlying DOM node on web (React `isFocused=""` warning / invalid attribute).
(b) `style={({ pressed }) => pressed && styles.pressed}` returns `false` when
unpressed; while RN tolerates falsy styles, under TS strict the function type
is `(state) => StyleProp<ViewStyle>` and bare `false` is fragile across RN-web
versions.
**Fix:**
```tsx
export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { isFocused: _omit, ...pressableProps } = props as typeof props & { isFocused?: boolean };
  return (
    <Pressable {...pressableProps} style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
```

### WR-06: Module-level `initialized` flag survives reload and blocks retry

**File:** `src/app/_layout.tsx:14,21-33,38-47`
**Issue:** `let initialized = false` at module scope persists across Fast
Refresh/HMR re-evaluations: after a reload the effect early-returns and
`initDatabase()` never re-runs in the fresh JS context. On the error path there
is no retry affordance — the `dbError` screen shows a message with no button,
so a transient failure strands the user. `SplashScreen.preventAutoHideAsync()`
(line 12) also floats an unhandled promise rejection if called when a splash
is already prevented.
**Fix:** Use a `useRef` guard inside the component (or React strict-effect
safe init), add a Retry button that resets state and re-runs init, and
`SplashScreen.preventAutoHideAsync().catch(() => {})`.

### WR-07: No input validation at the DB boundary — empty names, bad FK, bad enum

**File:** `src/db/worksites.ts:26-43`, `src/db/workers.ts:35-53`,
`src/db/attendance.ts:5-19`, `src/db/workers.ts:83-86`
**Issue:** `createWorksite`/`createWorker` accept `''`/whitespace names (NOT
NULL passes, junk rows persist); `createWorker` never checks `worksite_id`
points at an existing active worksite (raw FK `SQLiteConstraintException`
bubbles to UI); `upsertAttendance` never validates `status` against `STATUS`
keys or `date` against `YYYY-MM-DD` (raw CHECK-constraint throw instead of a
typed error); `updateWorker` accepts any `is_active` number (e.g. `5`), while
every read filters `is_active = 1`, silently hiding the row.
**Fix:**
```ts
import { STATUS } from '@/constants/status';
if (!input.name.trim()) throw new Error('name is required');
if (!(input.status in STATUS)) throw new Error(`invalid status: ${input.status}`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error(`invalid date: ${input.date}`);
// createWorker: const ws = await getWorksite(input.worksite_id); if (!ws?.is_active) throw ...
// updateWorker: if (input.is_active !== undefined && input.is_active !== 0 && input.is_active !== 1) throw ...
```

### WR-08: Five routes have no navigation host — forms/detail/worksites unreachable

**File:** `src/app/_layout.tsx:35-49`, `src/components/app-tabs.tsx:19-55`,
`src/components/app-tabs.web.tsx:22-33`
**Issue:** `worksites.tsx`, `export.tsx`, `backup.tsx`, `worksite-form.tsx`,
`worker-form.tsx`, `worker/[id].tsx` are all Expo Router routes, but the root
layout renders only `NativeTabs` (native) / `Tabs` (web) with triggers for
`index|attendance|workers|reports`. There is no `Stack` for modal/pushed
screens, so `router.push('/worksite-form')` etc. has no stack host on native —
form/detail screens are unreachable (blank screen or navigation error). The
`worksites` list route itself has no tab trigger on either platform.
**Fix:** Wrap tabs in a root `Stack` (`<Stack><Stack.Screen name="(tabs)" …
/><Stack.Screen name="worksite-form" …/>…</Stack>`) or move tabs into an
`(tabs)/` group; add the missing `worksites` trigger.

### WR-09: Aliased `require('@/assets/…')` for tab icons may not resolve in Metro

**File:** `src/components/app-tabs.tsx:22,32,42,52`
**Issue:** `@/*` is a TS/babel path alias that works for static `import`, but
bare `require('@/assets/images/tabIcons/home.png')` inside JSX relies on Metro
resolving the alias at bundle time — Metro historically requires relative
paths in `require()` for asset bundling (aliased requires silently bundle as
unresolved or fail the release bundle while passing in dev). Three of four
icons also reuse the `explore.png` placeholder (acknowledged in comments, but
three identical tab glyphs ship to users in the meantime).
**Fix:**
```ts
src={require('../../assets/images/tabIcons/home.png')}
// or top-level: import homeIcon from '@/assets/images/tabIcons/home.png';
```

## Info

### IN-01: Eight placeholder screens are byte-identical copy-paste

**File:** `src/app/index.tsx`, `src/app/attendance.tsx`, `src/app/workers.tsx`,
`src/app/reports.tsx`, `src/app/worksites.tsx`, `src/app/worker-form.tsx`,
`src/app/worksite-form.tsx`, `src/app/export.tsx`, `src/app/backup.tsx`
**Issue:** All nine screens duplicate the same 46-line `View > SafeAreaView >
ThemedText` scaffold with only title/body strings differing. Expected for
phase-01 stubs, but the duplication guarantees future drift (one screen gets a
fix, eight don't).
**Fix:** Extract a `PlaceholderScreen({ title, body })` component and render it
from each route until real UI lands.

### IN-02: `row.status in counts` uses prototype-chain `in` on unconstrained input

**File:** `src/db/attendance.ts:109-113`
**Issue:** `in` returns true for inherited properties (`'toString' in counts`
is true). The `CHECK` constraint makes a hostile `status` value unreachable
today, but the guard pattern is wrong by construction; a future fifth status
would also be silently dropped rather than surfaced.
**Fix:**
```ts
if (row.status === 'present' || row.status === 'absent' || row.status === 'half_day' || row.status === 'off_day') {
  counts[row.status] = row.n;
}
```

### IN-03: `EmptyState` shows an empty button for `actionLabel=""`

**File:** `src/components/empty-state.tsx:20`
**Issue:** `showAction = actionLabel !== undefined && onAction !== undefined`
treats `actionLabel=""` as "show", rendering a 44pt accent button with no text.
**Fix:** `const showAction = Boolean(actionLabel) && onAction !== undefined;`

### IN-04: `EmptyState` ripple and accessibility nits

**File:** `src/components/empty-state.tsx:32-40`
**Issue:** `android_ripple={{ color: theme.onAccent }}` uses the on-accent
(white) color on the accent background, making the ripple nearly invisible;
use a darker/contrasting ripple. The `Pressable` sets
`accessibilityRole="button"` but no `accessibilityLabel`, so screen readers
announce only the visible label without context.
**Fix:** `android_ripple={{ color: 'rgba(0,0,0,0.2)' }}` and add
`accessibilityLabel={actionLabel}`.

---

_Reviewed: 2026-10-03T00:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
