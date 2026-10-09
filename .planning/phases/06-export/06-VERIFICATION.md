---
phase: 06-export
verified: 2026-10-09T13:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "Worker export → Downloads → Excel/Sheets column-count probe"
    expected: "Export a worker with note `left early, told \"back tomorrow\"` as CSV; file lands in Downloads and opens in Excel AND Sheets with the note in a single cell and correct column count"
    why_human: "No dev build in this environment (Expo Go cannot load expo-sqlite/expo-file-system native modules); RFC-4180 correctness is proven at code level only"
  - test: "Worksite-month register export → Downloads (CSV + PDF)"
    expected: "Export a worksite + month as CSV and as PDF; both files land in Downloads with slug names hazra-register-{site}-{yyyymm}.csv|pdf"
    why_human: "SAF Downloads write and expo-print PDF rendering require a native build"
  - test: "Second-device transfer + open (EX-03 / roadmap SC-3)"
    expected: "Share file via system share sheet to a second device; CSV parses and PDF renders correctly there"
    why_human: "Share-sheet transfer and external-app opening are on-device behaviors; deferred verification debt to Phase 9 by prior-phase precedent"
  - test: "Entry-point navigation (profile Export, reports row Export, site-context register Export)"
    expected: "Profile Export pushes /export?workerId= preselected; reports rows push worker scope; site context pushes ?worksiteId=&month=; tampered ids render not-found"
    why_human: "Navigation taps require a running app; code wiring verified statically"
deferred:
  - truth: "Exported CSV/PDF open correctly on a second device after transfer (roadmap SC-3 device half)"
    addressed_in: "Phase 9"
    evidence: "Phase 9 success criterion 3: 'The production build (not Expo Go) passes an on-device test of SQLite paths, file-system access, and sharing'"
  - truth: "Per-worker and per-worksite files confirmed present in physical Downloads folder (roadmap SC-2 device half)"
    addressed_in: "Phase 9"
    evidence: "Phase 9 success criterion 3 covers file-system access on a production build"
---

# Phase 6: Export (CSV / PDF) Verification Report

**Phase Goal:** attendance can leave the app in a payroll-usable form and open correctly outside it.
**Verified:** 2026-10-09T13:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A note containing left early, told "back tomorrow" survives CSV export with the correct column count (RFC-4180, roadmap SC-1) | ✓ VERIFIED | `escapeCsvField` (export.ts:41-51) quote-wraps on `,`/`"`/newline with `"` doubled; probe note contains `,` + `"` → `"left early, told ""back tomorrow"""`; minimal parser round-trips in `verify-export.mjs` → EXPORT_VERIFY_OK; device-side Excel/Sheets open → human_needed |
| 2 | Worker history and worksite-month registers serialize to identical RFC-4180 CSV shapes the screen can save | ✓ VERIFIED | `buildWorkerCsv` header `date,status,note` + `buildRegisterCsv` header `date,worker,status,note`, lowercase raw keys, `-` note rule, CRLF, sorted copies (export.ts:74-99); screen calls both at export time (export.tsx:355,391) |
| 3 | PDF HTML generation is theme-driven with legend row and summarize() footer | ✓ VERIFIED | `PdfTheme` (export.ts:156-163), no chrome hex in builders, 4-STATUS `legendRow` (export.ts:181-187), `footerSummary` reuses `summarize()` (export.ts:169-172), both builders wired in screen (export.tsx:358,394) |
| 4 | Filenames are lowercase slug forms hazra-worker-{slug}-{yyyymmdd} and hazra-register-{siteslug}-{yyyymm} | ✓ VERIFIED | `slugify` allowlist + `workerFilename`/`registerFilename` (export.ts:106-118); screen uses both (export.tsx:353,389); traversal `../../etc` → harmless slug per probe |
| 5 | Manager opens /export directly and picks an active worker or one active worksite + one past-or-current month | ✓ VERIFIED | Scope switcher + active-only `listWorkers({})`/`listWorksites()` pickers (export.tsx:253-254) + `MonthSheet` descending from current-month maxMonth (month-sheet.tsx:26-28) |
| 6 | Deep links ?workerId= and ?worksiteId=&month= preselect scope; tampered ids render not-found and never reach SQL | ✓ VERIFIED | `useLocalSearchParams` init (export.tsx:177-192), `getWorker`/`getWorksite` null → `notFound` render (export.tsx:276,305,657); all DAO params stay `?`-bound downstream |
| 7 | Preview card shows row-count line + up to 5 sample rows from the SAME dataset the file is built from | ✓ VERIFIED | Preview counts via `summarize()` on `entries`/`regRows` state; file bytes built from same state (export.tsx:352-420); sample rows in HistoryRow read-only language; per-scope success card (`savedScope`) |
| 8 | One orange CTA exports exactly one file (double-tap safe), then a success card offers Share + Export another | ✓ VERIFIED | `exporting` re-entry guard + disabled "Exporting…" CTA, "Saved to Downloads" + slug filename + Share file (`shareFile`) + Export another (`resetExport` preserving picks); KNOWN WEAKNESS: state-only guard leaves a same-tick double-tap gap (REVIEW WR-01) and CTA stays live under success card (WR-07) — flagged advisory, not blocking |
| 9 | Zero rows disables the CTA with a calm no-action line; failures show destructive retry text and delete partials | ✓ VERIFIED | "No attendance to export yet" zero-rows disable (export.tsx:715), "Couldn't export — try again" + Try again retry, `deleteFile` partial cleanup on catch (export.tsx:430-433) |
| 10 | Worker profile shows an Export action below Edit that opens /export with that worker preselected | ✓ VERIFIED | `goToExport` pushes `/export` + `workerId` ([id].tsx:162-166); secondary Export Pressable below byte-identical Edit, renders incl. removed workers; single `theme.accent` (one-orange intact) |
| 11 | Reports per-worker rows offer export to /export?workerId= and worksite context offers /export?worksiteId=&month= | ✓ VERIFIED | `goToExportWorker` + `onExport` on BOTH ReportRow usages (reports.tsx:155,436,464); site-context "Export monthly register" pushes `worksiteId + todayKey()` month (reports.tsx:236-252); `onExport` prop conditional in row (report-row.tsx:14,78-83) |
| 12 | Phase-wide gates pass: tsc clean, no hardcoded hex, Pressable-only, tabular-nums on counts | ✓ VERIFIED | `npx tsc --noEmit` → exit 0 (re-run); zero TouchableOpacity/toISOString/writeAsStringAsync in export screen; zero hex in export.tsx/month-sheet.tsx; `tabular-nums` on counts/dates/filenames; zero `cacheDirectory` in files.ts |

**Score:** 12/12 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Exported CSV/PDF open correctly on a second device after transfer (roadmap SC-3 device half) | Phase 9 | Phase 9 SC-3: production build passes on-device test of file-system access and sharing |
| 2 | Files confirmed present in physical Downloads folder (roadmap SC-2 device half) | Phase 9 | Same Phase 9 SC-3 file-system proof |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/utils/export.ts` | 12 serializers, pure, RFC-4180 + theme PDF | ✓ VERIFIED | All 12 exports present; zero runtime `@/db` imports (type-only); headers exact; substantive 288 lines, wired (imported by export.tsx + month-sheet) |
| `src/utils/files.ts` | 5 file helpers, Downloads-first | ✓ VERIFIED | All 5 exports present; SAF Downloads on Android, documentDirectory elsewhere; throws loudly, no cacheDirectory; wired by export.tsx |
| `scripts/verify-export.mjs` | Standing RFC-4180 probe | ✓ VERIFIED | Prints EXPORT_VERIFY_OK exit 0 (re-run); KNOWN GAP (REVIEW WR-04): probes re-implement rules inline rather than executing implementation — advisory |
| `src/components/month-sheet.tsx` | Month-grid picker | ✓ VERIFIED | MonthSheet + props present; sibling-scrim modal; radio rows; wired by export.tsx |
| `src/app/export.tsx` | Export drill-down screen | ✓ VERIFIED | Rewritten ~1000 lines; all builders/helpers/filenames wired; web Blob CSV branch + revokeObjectURL; share-unavailable stays on card |
| `src/app/worker/[id].tsx` | Profile Export action | ✓ VERIFIED | goToExport + secondary action; one-orange intact |
| `src/app/(tabs)/reports.tsx` | Reports deep-links | ✓ VERIFIED | Worker + site-context pushes present |
| `src/components/report-row.tsx` | Per-row Export affordance | ✓ VERIFIED | Optional onExport, conditional render; KNOWN ISSUE (REVIEW WR-06): nested Pressable bubbles on web — verify tap target on device in Phase 9 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| export.ts | summarize() | footerSummary import | WIRED | export.ts:5,170 — single % definition reused |
| files.ts | expo-sharing | shareAsync + isAvailableAsync gate | WIRED | files.ts:102-108 |
| export.tsx | export.ts serializers | buildWorkerCsv/buildRegisterCsv/build*PdfHtml at export time | WIRED | export.tsx:33-40,355,358,391,394 |
| export.tsx | files.ts | success-card Share via shareFile | WIRED | export.tsx:446 |
| export.tsx | DAO | getAttendanceForWorker + listWorkers/listWorksites ?-bound | WIRED | export.tsx:220,226,253-254,268,283 |
| worker/[id].tsx | /export?workerId= | router.push display-string id | WIRED | [id].tsx:166 |
| reports.tsx | /export deep-links | goToExportWorker + site-context push | WIRED | reports.tsx:155-157,242 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| export.tsx preview + file | entries / regRows | getAttendanceForWorker (full history / month-range flat-map) | ✓ FLOWING | ✓ VERIFIED — SAME state feeds preview counts and file bytes (no second fetch) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| tsc clean | npx tsc --noEmit | exit 0 | ✓ PASS |
| RFC-4180 probe | node scripts/verify-export.mjs | EXPORT_VERIFY_OK exit 0 | ✓ PASS |
| Export wiring | grep builders/helpers/filenames/share/CTA strings in export.tsx | 42 matches, all present | ✓ PASS |
| Discipline gates | grep banned patterns (TouchableOpacity/StatusPill/toISOString/screen-level writeAsStringAsync/cacheDirectory/hex) | zero matches | ✓ PASS |
| Entry points | grep goToExport/goToExportWorker/onExport/worksiteId push | present in all 3 files | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| EX-01 | 06-01, 06-02, 06-03 | Export single worker history (CSV and/or PDF) | ✓ SATISFIED (code) | buildWorkerCsv/buildWorkerPdfHtml + screen worker scope + profile/reports entry points; device open → human_needed |
| EX-02 | 06-01, 06-02, 06-03 | Export full worksite monthly register (CSV and/or PDF) | ✓ SATISFIED (code) | buildRegisterCsv/buildRegisterPdfHtml + screen worksite scope + site-context entry; device open → human_needed |
| EX-03 | 06-02, 06-03 | Files saved to Downloads and open correctly outside app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | writeTextFile Downloads-first + copyBinaryFile + shareFile wired; physical save + external open → human_needed (Phase 9) |
| NF-06 | 06-01, 06-02 | Exports open/parse correctly outside the app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | RFC-4180 serializers + theme PDF verified statically; Excel/Sheets/device proof → human_needed (Phase 9) |

All four phase requirement IDs (EX-01, EX-02, EX-03, NF-06) appear in PLAN frontmatter (06-01: EX-01/EX-02/NF-06; 06-02: all four; 06-03: EX-01/EX-02/EX-03) and are accounted for above. No orphaned IDs: REQUIREMENTS.md maps exactly EX-01..03 + NF-06 to Phase 6.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| export.tsx:335-339 | state-only double-tap guard (REVIEW WR-01) | ⚠️ Warning | Same-tick double press can write two files; defeats "double-tap yields one file" in the strictest sense — recommend `useRef` lock before Phase 9 |
| export.tsx:810-829 | CTA live under success card (REVIEW WR-07) | ⚠️ Warning | Repeat tap writes duplicate deterministic file — recommend disabling CTA when success card shows |
| report-row.tsx:78-92 | nested Pressable (REVIEW WR-06) | ⚠️ Warning | Click bubbles on web: Export tap may also fire profile open — needs device/web check in Phase 9 |
| export.ts builders/files.ts writer | no UTF-8 BOM (REVIEW WR-03) | ⚠️ Warning | Hindi/non-ASCII names may garble in desktop Excel (Sheets unaffected) — probable domain-visible defect, recommend BOM before Phase 9 |
| verify-export.mjs | inline re-implementation probe (REVIEW WR-04) | ℹ️ Info | Script passes on rule copies, not the implementation; formula guard has zero direct assertion — recommend hardening |
| export.ts:231,268 | unchecked STATUS index in PDF builders (REVIEW WR-05) | ℹ️ Info | Unknown status hard-fails PDF with misleading retry text while CSV succeeds — recommend fallback chip |

No blocker anti-patterns. No TODO/FIXME/placeholder/empty-return/console-log-only stubs found in scope files.

### Human Verification Required

### 1. Worker export → Downloads → Excel/Sheets column-count probe

**Test:** Export a worker with note `left early, told "back tomorrow"` as CSV; open in Excel AND Sheets
**Expected:** Note lands in a single cell; column count correct in both apps
**Why human:** No dev build here; code-level RFC-4180 correctness verified, device rendering unproven

### 2. Worksite-month register export → Downloads (CSV + PDF)

**Test:** Export a worksite + month as CSV and PDF from a production build
**Expected:** Both files land in Downloads with slug names; register sorted date-then-name
**Why human:** SAF Downloads write + expo-print rendering need native build

### 3. Second-device transfer + open (EX-03)

**Test:** Share file via system share sheet to a second device; open there
**Expected:** CSV parses, PDF renders correctly off-device
**Why human:** Share-sheet + external-app behavior is on-device only (Phase 9 debt)

### 4. Entry-point navigation

**Test:** Tap profile Export, reports row Export, site-context register Export; try tampered ?workerId=
**Expected:** Preselected scopes land correctly; tampered id renders not-found, never crashes
**Why human:** Navigation requires a running app; wiring verified statically

### Gaps Summary

No blocking gaps. All 12 must-haves verify at code level: serializers are RFC-4180-correct with formula guard and slug traversal protection, PDF HTML is theme-driven with legend + single-source footer, the export screen wires preview-state → serializers → Downloads-first file helpers → share sheet with web best-effort, and all three entry points deep-link with validated display-string params. The goal's device-dependent halves (physical Downloads presence, Excel/Sheets rendering, second-device opening) cannot be proven in this Expo-Go-only environment and are recorded as human_needed + deferred to Phase 9 — identical to prior phases' precedent. Review warnings WR-01/WR-03/WR-06/WR-07 are carried as advisory fix-before-Phase-9 items; none defeats the phase goal at the code level.

---

_Verified: 2026-10-09T13:00:00Z_
_Verifier: OpenCode (gsd-verifier)_
