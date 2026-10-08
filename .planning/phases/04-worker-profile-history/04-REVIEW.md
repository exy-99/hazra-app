---
phase: 04-worker-profile-history
reviewed: 2026-10-08T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/utils/attendance.ts
  - scripts/verify-summarize.mjs
  - src/components/attendance-ring.tsx
  - src/app/worker/[id].tsx
  - src/app/(tabs)/workers.tsx
findings:
  critical: 0
  warning: 8
  info: 7
  total: 15
status: needs-fixes
---

# Phase 04: Code Review Report

**Reviewed:** 2026-10-08
**Depth:** standard
**Files Reviewed:** 5
**Status:** needs-fixes

## Summary

Reviewed all five files from plans 04-01 (attendance math + hand-check),
04-02 (attendance ring + profile shell), and 04-03 (history list + row
retarget). The `summarize()` math is correct (hand-check vector verified by
reading: 21.5/28*100 rounds to exactly 76.79; null-on-zero-denominator holds),
DAO usage binds the route param correctly (no interpolation), and navigation
retarget is a clean one-hunk change.

No BLOCKER-level defects (no injection, no secrets, no crash on any realistic
path). However there are 8 WARNINGs that degrade correctness/robustness, led
by invisible stat skeletons (missing background), a period-switch load race
with no sequence guard, a stale-worker header flash on id change, an
unsanitized `tel:` URI with swallowed rejection, and an unguarded
`STATUS[entry.status]` lookup that crashes on corrupt rows. None of the five
files was modified by this review.

## Warnings

### WR-01: [WARNING] Stat skeleton blocks have no background — invisible during load

**File:** `src/app/worker/[id].tsx:38-40` (style `src/app/worker/[id].tsx:584-587`)
**Issue:** The four count skeletons render `<View style={styles.statSkeleton} />`
with no `backgroundColor`. `statSkeleton` defines only `flex: 1; height: 44` —
unlike `ringSkeleton`, `historySkeleton`, and `nameSkeleton`, which all receive
`{ backgroundColor: muted }`. The counts region therefore shows blank space
instead of skeleton blocks while loading, defeating the D-20 skeleton discipline
for that region.
**Fix:**
```tsx
<View key={`stat-skeleton-${i}`} style={[styles.statSkeleton, { backgroundColor: muted }]} />
```
and add `borderRadius: Radius.md` to `statSkeleton` to match the other blocks.

### WR-02: [WARNING] Concurrent period-switch loads race — stale entries can win

**File:** `src/app/worker/[id].tsx:108-145`
**Issue:** Every chip tap fires `load()` with no cancellation or sequence guard.
Tapping 7 → 30 → 90 quickly launches three overlapping DAO reads; a slower
earlier `getAttendanceForWorker` can resolve last and overwrite `entries` for
the wrong period, while interleaved `setLoading(true)/false` calls can clear
the loading state prematurely. The chips stay mounted and interactive during
load, so this is reachable in normal use, not just in theory.
**Fix:**
```tsx
const loadSeq = useRef(0);
async function load() {
  const seq = ++loadSeq.current;
  setLoading(true);
  // ...after each await:
  if (seq !== loadSeq.current) return;
  // ...guard every setState, or check once before setEntries/setLoading
}
```

### WR-03: [WARNING] Stale worker header flashes when navigating between profiles

**File:** `src/app/worker/[id].tsx:177, 257-262`
**Issue:** The first-load skeleton branch requires `worker === null`. When the
screen is reused for a different `id` (deep link, back-forward), the old
`worker` object is still set while the new one loads, so the loaded branch
renders the *previous* worker's name/role/site during the fetch. Showing the
wrong person's identity, even briefly, is a trust-relevant stale-data flash.
`siteName` is likewise never reset on the not-found path.
**Fix:** Reset identity state at the top of `load()` when `id` changes (or key
the screen by route param):
```tsx
// in load(), before fetching:
setWorker(null);
setSiteName('—');
setEntries([]);
```
and/or gate the loaded branch on `worker.id === rawId`.

### WR-04: [WARNING] `tel:` URI built from unsanitized phone; dialer failure swallowed silently

**File:** `src/app/worker/[id].tsx:159-163`
**Issue:** `Linking.openURL(`tel:${worker.phone}`)` passes the stored string
verbatim. Real-world numbers with spaces, dashes, or parentheses
(e.g. `"98765 43210"`) can produce a malformed URI that fails on some
platforms, and the `void`-ed promise swallows the rejection — on devices with
no dialer (tablet/web) the tap silently does nothing with no feedback. No
`Linking.canOpenURL` guard.
**Fix:**
```tsx
async function callPhone() {
  const digits = (worker?.phone ?? '').replace(/[^\d+]/g, '');
  if (!digits) return;
  const url = `tel:${digits}`;
  if (await Linking.canOpenURL(url)) await Linking.openURL(url);
}
```

### WR-05: [WARNING] Unguarded `STATUS[entry.status]` crashes on unexpected status values

**File:** `src/app/worker/[id].tsx:61, 75-83`
**Issue:** `const chip = STATUS[entry.status]` assumes every stored row carries
one of the four known statuses. A corrupt/legacy row (e.g. from a future
migration or manual DB edit) makes `chip` undefined and `chip.label` throws
inside render, blanking the whole profile. Storage content is a trust boundary
worth one line of defense.
**Fix:**
```tsx
const chip = STATUS[entry.status as AttendanceStatus] ?? STATUS.present;
// or filter unknown-status rows out of entries after fetch
```

### WR-06: [WARNING] Empty-string notes render a blank note line

**File:** `src/app/worker/[id].tsx:85-91`
**Issue:** The preview renders whenever `entry.note !== null`, but the
"blanks coerce to null" guarantee lives in the write path, not the schema
(`note: string | null`). Any legacy or externally-written `''` row renders an
empty single-line `Text` that still occupies layout space — a phantom blank
line under the date/chip row.
**Fix:**
```tsx
{entry.note ? (
  <Text numberOfLines={1} ...>{entry.note}</Text>
) : null}
```

### WR-07: [WARNING] Empty-string role renders a dangling `" · site"` meta line

**File:** `src/app/worker/[id].tsx:260-262`
**Issue:** `worker.role ?? 'Worker'` only falls back on `null`. An empty-string
role (possible if a form ever persists `''`) renders `" · Kirti Nagar"`.
Same class of issue exists in `workers.tsx:56`.
**Fix:** `{`${worker.role || 'Worker'} · ${siteName}`}`

### WR-08: [WARNING] Stats empty-state copy is false when off-day marks exist

**File:** `src/app/worker/[id].tsx:357-364`
**Issue:** The narrowed condition (`percentage === null && entries.length > 0`)
correctly targets the off_day-only case, but the card title still reads "No
attendance recorded yet" while the history section below lists the off-day
marks. The copy contradicts visible records; for off-day-only periods the
truthful statement is "no countable days", not "no records".
**Fix:** Use a distinct title for the off-day-only case, e.g.
`title="No countable days yet"` when `entries.length > 0`, keeping the §7.5
line for the genuinely empty history.

## Info

### IN-01: [INFO] `summarize` entry type is detached from `AttendanceEntry`

**File:** `src/utils/attendance.ts:21`
**Issue:** Signature is `Pick<{ status: AttendanceStatus }, 'status'>[]` — a
Pick over an anonymous inline type rather than the plan-specified
`Pick<AttendanceEntry, 'status'>`. Functionally identical today, but it drops
the documented link to the DAO row shape, so future `AttendanceEntry` changes
won't propagate. Also no `default:` arm in the switch: unknown statuses are
silently dropped (consistent with the typed union, but a `default: break` with
a comment would make the intent explicit).
**Fix:** `export function summarize(entries: Pick<AttendanceEntry, 'status'>[])`
with `import type { AttendanceEntry, AttendanceStatus } from '@/db/types';`

### IN-02: [INFO] Verify-script comment numbering skips from 3 to 5

**File:** `scripts/verify-summarize.mjs:39-44`
**Issue:** Section comments read `// 3.` then `// 5.` — there is no `// 4.`
Renumber so future readers don't hunt for a missing assertion.

### IN-03: [INFO] Period-chip row JSX is duplicated in two branches

**File:** `src/app/worker/[id].tsx:179-215` vs `src/app/worker/[id].tsx:279-319`
**Issue:** The identical 7/30/90 chip row is copy-pasted into the skeleton-first-load
branch and the loaded branch. Any future chip change (label, a11y, styling) must
be made twice; divergence risk.
**Fix:** Extract a `PeriodChips({ period, onChange })` component used by both branches.

### IN-04: [INFO] `formatDisplay` computed twice per history row

**File:** `src/app/worker/[id].tsx:66, 73`
**Issue:** `formatDisplay(entry.date)` is called once for the accessibility label
and once for the visible text. Trivial waste per row; hoist to a local.
**Fix:** `const displayDate = formatDisplay(entry.date);` at the top of `HistoryRow`.

### IN-05: [INFO] Workers-list rows lack an accessibility role

**File:** `src/app/(tabs)/workers.tsx:39-50`
**Issue:** `WorkerRow`'s `Pressable` has an `accessibilityLabel` but no
`accessibilityRole="button"`, so screen readers may not announce rows as
actionable. (Adjacent to the retarget, pre-existing — the plan only asked for
the label change.)
**Fix:** Add `accessibilityRole="button"` to the row `Pressable`.

### IN-06: [INFO] Load failures are swallowed with no logging

**File:** `src/app/worker/[id].tsx:134-136`, `src/app/(tabs)/workers.tsx:119-121`
**Issue:** Both `catch` blocks set error state and discard the error object.
No `console.warn`/error reporting means field diagnosis of SQLite failures is
blind.
**Fix:** `catch (e) { console.warn('[worker-profile] load failed', e); setLoadError(true); }`

### IN-07: [INFO] `AttendanceRing` does not clamp out-of-range input

**File:** `src/components/attendance-ring.tsx:20-23`
**Issue:** `size <= 0` yields a negative radius; a `value` outside 0–100
(impossible via `summarize` today, but the component is public) overflows the
dash fraction. One-line guards would make the component robust to reuse.
**Fix:**
```tsx
const safeSize = Math.max(size, 1);
const fraction = value === null ? 0 : Math.min(Math.max(value, 0), 100) / 100;
```

---

_Reviewed: 2026-10-08_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
