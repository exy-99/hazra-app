---
phase: 06-export
reviewed: 2026-10-09T08:30:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/utils/export.ts
  - src/utils/files.ts
  - scripts/verify-export.mjs
  - src/components/month-sheet.tsx
  - src/app/export.tsx
  - src/app/worker/[id].tsx
  - src/app/(tabs)/reports.tsx
  - src/components/report-row.tsx
findings:
  critical: 0
  warning: 7
  info: 9
  total: 16
status: issues_found
---

# Phase 06-export: Code Review Report

**Reviewed:** 2026-10-09T08:30:00Z
**Depth:** deep
**Files Reviewed:** 8 (7 in scope + `src/components/report-row.tsx`, pulled in via the reports.tsx `onExport` call chain)
**Status:** issues_found

## Summary

Reviewed all three Phase 6 plans end-to-end: pure serializers (`export.ts`), file helpers (`files.ts`), the standing probe (`verify-export.mjs`), the export screen + month sheet (06-02), and the three entry-point files (06-03). Cross-file tracing covered preview-state → serializer → file-helper chains, deep-link param → `getWorker`/`getWorksite` null-boundary validation, and the `ReportRow` nested-pressable contract.

The security boundaries from the threat models hold: no SQL interpolation (all DAO params stay `?`-bound), RFC-4180 quoting is correct, the formula guard keys off the original field per T-06-01, theme values aside all PDF interpolation is escaped, slug + `basenameOf` neutralize traversal, and the phase gates verify clean (one `theme.accent` in profile, zero hardcoded chrome hex outside tokens, zero `TouchableOpacity`/`toISOString`/`writeAsStringAsync` in the screen). **No critical findings.**

The warnings below are real but non-shipping-blockers in severity only by taxonomy — WR-01/WR-07 defeat the explicit "double-tap yields one file" acceptance criterion, WR-04 means the standing probe cannot catch a regression in the phase's riskiest code, and WR-03 will garble non-ASCII worker names in desktop Excel (likely Hindi names in this product's domain). Recommend fixing WR-01 through WR-05 before Phase 9 device proofs.

## Warnings

### WR-01: Double-tap guard is state-only — same-tick double press creates two files

**File:** `src/app/export.tsx:335-339`
**Issue:** The re-entry guard reads `exporting` state (`if (exporting) return; setExporting(true);`). State updates are asynchronous, so two taps landing before the re-render both see `exporting === false` and both enter the try block. Each invocation holds its own `tempUri`/`destUri` locals, so both proceed to `writeTextFile`/`copyBinaryFile` — two identical files in Downloads (and on Android SAF, a possible filename-collision throw surfacing a confusing "Couldn't export" after a success). The CTA `disabled={ctaDisabled}` (line 815) has the same async gap and does not close it. This defeats the 06-02 acceptance criterion "double-tap yields one file".
**Fix:**
```tsx
const exportLock = useRef(false);
async function handleExport(): Promise<void> {
  if (exportLock.current) return;
  exportLock.current = true;
  setExporting(true);
  ...
  } finally {
    exportLock.current = false;
    setExporting(false);
  }
}
```

### WR-02: Concurrent `load()` invocations race with no generation guard

**File:** `src/app/export.tsx:248-328`
**Issue:** Every scope/worker/site/month change fires `load()`, and rapid successive changes (picker taps, month picks) leave multiple `load()` promises in flight. Each one writes shared state (`setNotFound`, `setEntries`/`setRegRows`, `setLoading(false)`). A stale resolution can land last and leave mismatched state — e.g. a tampered-id `notFound=true` overwriting a newer valid selection's data, or vice versa (`notFound=false` with another scope's entries). There is no generation counter or `AbortController`-style guard, and the `useFocusEffect` re-run on dep change (lines 324-328) amplifies it: `setSelectedWorker(first.id)` inside `load()` changes deps and triggers a second `load()` while the first is still resolving.
**Fix:**
```tsx
const loadGen = useRef(0);
async function load() {
  const gen = ++loadGen.current;
  ...
  // after each await:
  if (gen !== loadGen.current) return;
}
```

### WR-03: CSV has no UTF-8 BOM — non-ASCII names/notes garble in desktop Excel

**File:** `src/utils/export.ts:74-99` (builders), `src/utils/files.ts:63-80` (writer)
**Issue:** Files are written as raw UTF-8 with no byte-order mark. Microsoft Excel on Windows (the stated "Opens in Excel or Sheets" consumer, `export.tsx:641-645`) does not sniff UTF-8 and renders non-ASCII bytes in the system codepage — worker names or notes in Hindi or with accented characters will mojibake. Google Sheets opens the same file correctly, so this will pass a Sheets-only check and fail in payroll Excel. For this product's domain (Indian workforce, Devanagari names likely), this is a probable user-visible defect, not a corner case.
**Fix:** Prepend the BOM once at the content origin (serializer keeps pure-string contract; writer stays byte-agnostic):
```ts
// in buildWorkerCsv / buildRegisterCsv, or in writeTextFile before writing:
const withBom = contents.startsWith('﻿') ? contents : `﻿${contents}`;
```

### WR-04: Standing probe never executes the implementation; formula guard has zero coverage

**File:** `scripts/verify-export.mjs:69-102`
**Issue:** Two compounding gaps. (a) The RFC-4180 "probe" (lines 72-91) and the slug "probe" (lines 96-102) test inline re-implementations of the rules, not `escapeCsvField`/`slugify` themselves. If the implementation regresses (quoting removed, guard deleted), the script still prints `EXPORT_VERIFY_OK` — the only behavioral check is a substring test for a quote-doubling pattern (line 93). (b) The highest-risk security control in the phase — the T-06-01 formula-injection `'` prefix, including the length-1 `-` exemption interaction — has no assertion at all: nothing checks the implementation contains the guard, and nothing probes that `=SUM(...)` input comes back prefixed while a bare `-` placeholder stays exact. Same for `escapeHtml` correctness, `monthRange` end-of-month math, and `footerSummary` parity with `summarize()`.
**Fix:** At minimum, add static assertions that fail if the guard is removed, e.g. assert the implementation contains the `field.length > 1` check and the `'= + - @'` first-char set; better, compile the real module (esbuild is already in the Expo toolchain) or extract the pure functions into a dependency-free fixture the script can import.

### WR-05: PDF builders throw on unknown status; CSV path degrades gracefully

**File:** `src/utils/export.ts:231`, `src/utils/export.ts:268`
**Issue:** `const chip = STATUS[entry.status]` is an unchecked index. If a row ever carries a status outside the `CYCLE` set (DB written by a future migration, manual edit, corrupt row), `chip` is `undefined` and `chip.solid` throws `TypeError` inside `handleExport`'s try block — the user gets "Couldn't export — try again" with no recovery, and the retry will fail identically (deterministic failure masquerading as transient). The CSV builders are immune (they write the raw key). Asymmetry: the same dataset exports fine as CSV but hard-fails as PDF with a misleading error.
**Fix:**
```ts
const chip = STATUS[entry.status] ?? { label: entry.status, solid: '#808080' };
```
or validate rows at `load()` time and surface a data error instead of an export error.

### WR-06: Nested Pressable in ReportRow double-fires on web

**File:** `src/components/report-row.tsx:78-92` (inner), nested inside `src/components/report-row.tsx:35-47` (outer)
**Issue:** The Export affordance is a `Pressable` nested inside the profile-opening card `Pressable`. On native the responder system grants the press to the innermost view, so only `onExport` fires. On web, `react-native-web` renders plain nested `<div>`s and the click event bubbles — the outer `onOpen(workerId)` fires too, pushing both `/export` and `/worker/[id]` (last push wins, so the Export tap can land the user on the profile instead of export). AGENTS.md targets web as a first-class platform, and the 06-03 summary's "nested-Pressable precedence" precedent does not hold for DOM bubbling. Nested interactive elements are also an a11y violation on web.
**Fix:** Restructure so the Export button is a sibling of the card pressable (not a child), or stop propagation at the inner handler:
```tsx
onPress={(e) => { e.stopPropagation?.(); onExport?.(workerId); }}
```
and verify the tap target on web before Phase 9.

### WR-07: CTA stays live under the success card — repeat tap writes a duplicate file

**File:** `src/app/export.tsx:668-712` (success card), `src/app/export.tsx:810-829` (CTA)
**Issue:** After success, the card replaces only the *preview* card; the orange Export CTA remains enabled below it. Tapping it again re-runs the full export with identical inputs and writes a second identical file to Downloads (filenames are deterministic per day: `workerFilename(workerName, todayKey(), …)`), with no "already exported" indication. On Android SAF this second `createFileAsync` against an existing display name may throw or silently suffix-rename, contradicting the card's "displayed name IS the real destination basename" invariant. At minimum the CTA should disable once `showSuccess` is true for the current scope+format.
**Fix:**
```tsx
const ctaDisabled = exporting || scopeCount === 0 || showSuccess;
```

## Info

### IN-01: `registerFilename` strips only the first hyphen

**File:** `src/utils/export.ts:118`
**Issue:** `month.replace('-', '')` removes only the first `-`, while `workerFilename` (line 112) uses the global `/-/g`. For validated `YYYY-MM` input both are equivalent, but the pure function silently keeps hyphens on any other shape (e.g. `2026-10-05` → `202610-05`), and the inconsistency invites copy-paste error.
**Fix:** `month.replace(/-/g, '')` to match `workerFilename`.

### IN-02: `basenameOf` strips `/` but not `\` separators

**File:** `src/utils/files.ts:20-22`
**Issue:** `filename.split('/').pop()` leaves Windows-style `..\` components intact. No live traversal (SAF display names cannot traverse, and slug filenames never contain separators), but the T-06-02 "never trust slash input" comment overclaims.
**Fix:** `filename.split(/[/\\]/).pop() ?? filename`.

### IN-03: `normalizeMonth` accepts impossible months; `monthRange` yields `Invalid Date`

**File:** `src/app/export.tsx:57-62`, `src/utils/export.ts:124-128`
**Issue:** The regex `^\d{4}-\d{2}$` plus lexicographic clamp admits values like `2026-00`, which pass the clamp and reach `monthRange` → `dayjs('2026-00-01').endOf('month').format(...)` → `to: 'Invalid Date'`. The DAO then queries a garbage range with bound params (no injection — verified `?`-bound call sites), almost certainly returning zero rows and the calm "No attendance" line. Benign outcome, but a tampered `?month=` produces a confusing empty state instead of falling back to the current month.
**Fix:** Tighten the regex to `/^\d{4}-(0[1-9]|1[0-2])$/` in `normalizeMonth`.

### IN-04: PDF theme/STATUS colors interpolated raw despite "every value escaped" claim

**File:** `src/utils/export.ts:198-214`
**Issue:** `pdfShell` escapes `foreground`/`mutedForeground` but interpolates `theme.background`, `theme.surface`, `theme.border`, `theme.primary`, and `STATUS[key].solid` raw into `style` attributes. No live vulnerability (all sources are developer-controlled constants in `theme.ts`/`status.ts`, never user input), but the module docstring (lines 135-137: "Applied to EVERY interpolated value") is inaccurate and a future theme-from-remote change would inherit an XSS hole in the `style` context that `escapeHtml` does not cover anyway (no `;`/`:`/`(`/`)` escaping).
**Fix:** Either escape uniformly for accuracy, or narrow the docstring to "all user-derived values" and add an assertion that `PdfTheme` fields match a color pattern.

### IN-05: Formula guard omits leading Tab/CR from the OWASP set

**File:** `src/utils/export.ts:41-51`
**Issue:** The guard covers `= + - @` but not a leading Tab (`\t`) or CR (`\r`), which the OWASP CSV-injection guidance also lists. Modern Excel does not evaluate tab/CR-prefixed cells as formulas, so exploitability is negligible — noted for completeness of the T-06-01 rationale.
**Fix:** No change required; optionally document why Tab/CR are excluded.

### IN-06: Wrong empty-state copy on the global export worker picker

**File:** `src/app/export.tsx:536`
**Issue:** When the workspace has no workers, the export screen (a global, cross-site picker) shows "No workers at this worksite" — "this worksite" refers to nothing on this screen and will confuse managers. Should read "No workers yet".
**Fix:** `title="No workers yet"`.

### IN-07: `MonthSheet` crashes on negative `monthsBack`

**File:** `src/components/month-sheet.tsx:26-28`
**Issue:** `Array.from({ length: monthsBack ?? 12 })` throws `RangeError: Invalid array length` for negative values. The only caller passes the literal `12`, so this is latent, but the prop is public API with no clamp.
**Fix:** `Math.max(0, Math.floor(monthsBack ?? 12))`.

### IN-08: "Saved to Downloads" overclaims on iOS

**File:** `src/app/export.tsx:678`, `src/utils/files.ts:50-55`
**Issue:** On non-Android the file lands in `documentDirectory` (app-private Documents, visible in the Files app), not a shared Downloads folder, which iOS does not expose the same way. The success heading unconditionally says "Saved to Downloads". Minor copy accuracy issue for iOS users looking for the file.
**Fix:** Platform-gated heading (`Platform.OS === 'android' ? 'Saved to Downloads' : 'File saved'`) or keep as-is deliberately and note the decision.

### IN-09: Android SAF partial cleanup may silently no-op

**File:** `src/utils/files.ts:74-77`, `src/utils/files.ts:114-120`
**Issue:** Failure cleanup calls `FileSystem.deleteAsync` on URIs returned by `StorageAccessFramework.createFileAsync` (`content://` URIs). `deleteFile` is catch-all-silent by design (D-16), so if legacy `deleteAsync` does not support SAF content URIs, partial files are orphaned invisibly and the "partials deleted" guarantee quietly fails on Android. The flow never breaks — this only affects orphaned-partial hygiene.
**Fix:** Verify `deleteAsync` against a SAF `content://` URI on a dev build (Phase 9 debt list is the right home); if unsupported, route Android cleanup through the SAF delete path and add a debug log.

---

_Verified clean (no finding): `?workerId=`/`?worksiteId=` params stay display strings into `?`-bound DAO calls with null → not-found boundaries (T-06-05/T-06-09 hold); CSV quoting + guard ordering correct; `slugify` allowlist + `basenameOf` compose against traversal; PDF note/name/date/label/summary escaping confirmed at every interpolation site; one-orange intact (single `theme.accent` in profile); no banned patterns in scope files; `tsc` clean._

_Reviewed: 2026-10-09T08:30:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: deep_
