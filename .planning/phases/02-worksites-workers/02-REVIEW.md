---
phase: 02-worksites-workers
reviewed: 2026-10-05T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/_layout.tsx
  - src/app/(tabs)/_layout.tsx
  - src/app/(tabs)/index.tsx
  - src/app/(tabs)/attendance.tsx
  - src/app/(tabs)/workers.tsx
  - src/app/(tabs)/reports.tsx
  - src/app/worksites.tsx
  - src/app/worksite-form.tsx
  - src/app/worker-form.tsx
  - src/components/form-field.tsx
  - src/components/confirm-dialog.tsx
  - src/db/worksites.ts
status: issues_found
findings:
  critical: 2
  warning: 8
  info: 6
  total: 16
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the worksites/workers UI slice (list screens, both form screens, shared
form/dialog components, worksites DAO) plus the root Stack layout and tab
placeholders. SQL construction in `src/db/worksites.ts` was checked and is
clean (column names are hardcoded literals, all values parameterized; no
injection). No hardcoded secrets, `eval`, or dangerous APIs found.

Two data-integrity/correctness defects block shipping: list screens
fire-and-forget their DB loads so failures surface as misleading "empty"
states with unhandled rejections, and both form screens allow duplicate
submits with zero error feedback. A further eight warnings (key collision,
a11y gaps, unvalidated worksite type, stale-state reuse, an edit dead-end)
should be fixed before or immediately after this phase.

## Critical Issues

### CR-01: Unhandled async `load()` in list screens masks DB failures as "empty"

**File:** `src/app/(tabs)/workers.tsx:83-104`, `src/app/worksites.tsx:74-94`
**Issue:** `load()` has `try/finally` with no `catch`, and the `useFocusEffect`
callback invokes it as a floating promise (`load();` — return value ignored).
Any rejection (corrupt DB, disk-full insert path, `getDb()` throwing before
init) becomes an **unhandled promise rejection** (redbox/fatal in dev, noisy
warning in production) and the UI then renders the empty state —
"No worksites yet" / "No workers at this worksite" — for what is actually
an error. Failure is indistinguishable from genuinely-empty data, and there is
no retry path.
**Fix:**
```tsx
// workers.tsx / worksites.tsx
const [error, setError] = useState<string | null>(null);

async function load() {
  setError(null);
  try {
    /* ...existing fetches... */
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  } finally {
    setLoading(false);
  }
}

useFocusEffect(
  useCallback(() => {
    void load(); // or load().catch(() => {}) with in-load error state
  }, [selectedSite]),
);
// render: if (error) → error panel with retry button (cf. _layout.tsx pattern)
```

### CR-02: Form saves have no submit guard and no error handling — double-tap duplicates

**File:** `src/app/worksite-form.tsx:73-91`, `src/app/worker-form.tsx:95-119`
**Issue:** `handleSave` is `async` with no `try/catch`, no `saving` state, and
the save `Pressable` stays enabled while the write is in flight. Two rapid
taps issue two `createWorksite`/`createWorker` calls with distinct `newId()`s,
creating **duplicate rows**. On DB failure the promise rejects unhandled and
the user gets no feedback (form just sits there; `triedSubmit` validation
already passed so nothing visibly changes).
**Fix:**
```tsx
const [saving, setSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);

async function handleSave(): Promise<void> {
  if (saving) return;
  setTriedSubmit(true);
  /* ...validation... */
  setSaving(true);
  setSaveError(null);
  try {
    /* ...create/update... */
    router.back();
  } catch (e) {
    setSaveError(e instanceof Error ? e.message : String(e));
  } finally {
    setSaving(false);
  }
}
// Pressable: disabled={saving} + spinner/label swap while saving
```

## Warnings

### WR-01: Filter-chip `key` collides when a worksite is named "All"

**File:** `src/app/(tabs)/workers.tsx:144-152`
**Issue:** `key={label === 'All' ? '__all' : (chip.id as string)}` keys on the
*display label*, not the chip identity. A worksite literally named "All" gets
key `'__all'`, duplicating the "All" filter chip's key → React key collision,
incorrect reconciliation of the two chips (wrong selected state / stale props).
**Fix:** `key={chip.id ?? '__all'}`.

### WR-02: Row pressables expose a label but no button role

**File:** `src/app/(tabs)/workers.tsx:34-37`, `src/app/worksites.tsx:26-29`
**Issue:** `WorkerRow`/`WorksiteRow` set `accessibilityLabel` but no
`accessibilityRole="button"`. Screen-reader users hear text, not an actionable
control. (The sibling CTA buttons do set the role — this is an omission, not a
convention.)
**Fix:** add `accessibilityRole="button"` to both row `Pressable`s.

### WR-03: ConfirmDialog nests buttons inside a "button" backdrop

**File:** `src/components/confirm-dialog.tsx:24-55`
**Issue:** The backdrop `Pressable` carries `accessibilityRole="button"` /
"Dismis dialog" while containing the Cancel and Remove `Pressable`s. Nested
interactive elements with roles produce a broken accessibility tree (actions
announced inside another action). Functionally RN resolves taps to the
innermost pressable, so this is a11y-structure, not a tap bug — but it should
not ship as-is.
**Fix:** render the backdrop as a plain `View` with an invisible dismiss
`Pressable` *sibling* behind the card (absolute-fill), or keep the wrapping
`Pressable` but drop its `accessibilityRole`/label and mark it
`accessible={false}` so only the real buttons are exposed.

### WR-04: Worksite `type` is unvalidated end-to-end

**File:** `src/app/worksite-form.tsx:36`, `src/db/worksites.ts:28-45,47-73`
**Issue:** Form state is `useState<string>` seeded `'Office'`; the DAO accepts
`type: string` with no membership check against `WORKSITE_TYPES`, and the
schema (`src/db/index.ts`) declares `type TEXT NOT NULL` with no `CHECK`
constraint. A legacy/typo value round-trips silently, and a stored value
outside `WORKSITE_TYPES` leaves *no chip selected* with no error — the user
cannot tell the record is abnormal until after saving.
**Fix:** validate at the boundary, e.g.
```ts
import { WORKSITE_TYPES } from '@/db/worksites';
const TYPES = new Set<string>(WORKSITE_TYPES);
if (!TYPES.has(type)) { /* show error, refuse save */ }
```
and/or add `CHECK(type IN (...))` to the schema with a migration.

### WR-05: Worksite form keeps stale edit state when the route instance is reused

**File:** `src/app/worksite-form.tsx:44-68`
**Issue:** When `editId === null` the focus effect returns early *without
resetting* `name`/`type`/`address`/`triedSubmit`/`notFound`. Same-screen
param changes (edit → add without remount, which React Navigation permits)
leak the previous record's values into a supposedly blank form. `notFound`
is likewise never cleared on `editId` change.
**Fix:** in the effect, handle the `null` branch explicitly:
```ts
if (editId === null) {
  setName(''); setType('Office'); setAddress('');
  setTriedSubmit(false); setNotFound(false); setLoading(false);
  return;
}
```

### WR-06: Worker edit is a dead-end when zero active worksites exist

**File:** `src/app/worker-form.tsx:92-93,190-237,260-284`
**Issue:** In edit mode with `sites.length === 0`, the site list renders
nothing (the helpful "No worksites yet — add one first" zero-state is gated
on `showZeroState = editId === null && ...`), while `saveDisabled` blocks
saving. The user can neither reassign nor save — only Remove or back out.
**Fix:** show the zero-state + "Add worksite" link in edit mode too when
`sites.length === 0` (independent of `editId`).

### WR-07: Workers filter refetch never shows loading state

**File:** `src/app/(tabs)/workers.tsx:81,83-98`
**Issue:** `loading` starts `true` and is set `false` once, never reset.
Changing the site filter or refocusing triggers `load()` with stale rows on
screen and no indicator; on slow devices the list silently swaps underneath.
**Fix:** `setLoading(true)` at the top of `load()` (or a separate
`refreshing` flag driving the existing `ActivityIndicator`/list opacity).

### WR-08: Field errors are not programmatically linked to their inputs

**File:** `src/components/form-field.tsx:24-47`
**Issue:** The error `Text` is only visually adjacent. `TextInput` gets no
invalid state and the message is not associated (`accessibilityErrorMessage` /
`accessibilityInvalid`), so screen-reader users are not told the field is in
error. The consumer (`worker-form.tsx:239-244`) hand-rolls
`accessibilityLiveRegion` for the site error instead — inconsistent handling
of the same concern.
**Fix:** pass the error to the input, e.g.
```tsx
<TextInput
  accessibilityInvalid={hasError}
  accessibilityErrorMessage={hasError ? `${label}-error` : undefined}
  …
/>
{hasError ? <Text nativeID={`${label}-error`} …>{error}</Text> : null}
```

## Info

### IN-01: Root layout component misnamed `TabLayout`

**File:** `src/app/_layout.tsx:15`
**Issue:** The default export of the *root* Stack layout is called `TabLayout`
(copy-paste from the tabs layout). Cosmetic, but it misleads stack traces and
future edits. Rename to `RootLayout`. (Also note it reads `useColorScheme`
from `react-native` directly rather than the project's normalized
`@/hooks/use-color-scheme` — behavior is equivalent here since the ternary
defaults `'unspecified'` to light, so convention-only.)

### IN-02: Hardcoded `maxWidth: 800` instead of token

**File:** `src/app/worksites.tsx:155`, `src/app/worksite-form.tsx:251`, `src/app/worker-form.tsx:325`
**Issue:** These use the literal `800` while `workers.tsx` uses the
`MaxContentWidth` token (same value today). Use the token everywhere so a
future width change lands in one place.

### IN-03: Redundant "+" in CTA labels

**File:** `src/app/(tabs)/workers.tsx:70`, `src/app/worksites.tsx:63`
**Issue:** Labels read "+ Add worker" / "+ Add worksite" alongside a `Plus`
icon — the glyph duplicates the icon. Drop the `"+"` prefix.

### IN-04: Workers empty-state copy assumes a filtered view

**File:** `src/app/(tabs)/workers.tsx:196`
**Issue:** Title "No workers at this worksite" also shows when the "All" filter
is active and the database simply has no workers. Make the copy conditional
(`selectedSite ? 'No workers at this worksite' : 'No workers yet'`).

### IN-05: `getWorksite` returns inactive rows — deactivated sites stay editable

**File:** `src/db/worksites.ts:19-26`, consumed at `src/app/worksite-form.tsx:51`
**Issue:** Editing a deactivated worksite via deep link or a stale nav stack
loads and saves normally (row stays `is_active = 0`). Either treat inactive as
not-found in the form or surface an "archived" state; current behavior silently
edits hidden records. Deliberate-product-decision territory — recorded here so
it is explicit.

### IN-06: Empty-string role renders a dangling separator

**File:** `src/app/(tabs)/workers.tsx:50`
**Issue:** `{`${worker.role ?? 'Worker'} · ${siteName}`}` handles `null` but
not `''` (possible in legacy rows predating the `'' → null` normalization in
`worker-form.tsx:101`). Renders " · Site". Normalize at read or guard:
`{worker.role?.trim() ? worker.role : 'Worker'}`.

---

_Reviewed: 2026-10-05T00:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
