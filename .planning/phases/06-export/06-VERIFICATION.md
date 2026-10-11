---
phase: 06-export
verified: 2026-10-11T12:00:00Z
status: human_needed
score: 22/22 must-haves verified
overrides_applied: 0
re_verification: true
previous_status: gaps_found
previous_score: 17/18
gaps_closed:
  - "CR-01: tap-time empty guard leaks exportLock/exporting — guard now inside try (391-394 < finally 520-523), finally releases lock on empty path"
  - "WR-08: web-PDF success card overclaim — now shows 'Opened print dialog' + Save-as-PDF caption, native/web-CSV copy untouched"
  - "WR-10: futile retry on empty data — Try-again Pressable gated on exportError !== 'No attendance to export yet'"
gaps_remaining: []
regressions: []
deferred:
  - truth: "Exported CSV/PDF open correctly on a second device after transfer (roadmap SC-3 device half)"
    addressed_in: "Phase 9"
    evidence: "Phase 9 success criterion 3: 'The production build (not Expo Go) passes an on-device test of SQLite paths, file-system access, and sharing'"
  - truth: "Per-worker and per-worksite files confirmed present in physical Downloads folder (roadmap SC-2 device half)"
    addressed_in: "Phase 9"
    evidence: "Phase 9 success criterion 3 covers file-system access on a production build"
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
---

# Phase 6: Export (CSV / PDF) Verification Report

**Phase Goal:** attendance can leave the app in a payroll-usable form and open correctly outside it (EX-01, EX-02, EX-03, NF-06).
**Verified:** 2026-10-11T12:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 06-06 (commits d50b609, 260e3c7) closing CR-01 + WR-08/WR-10

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A note containing left early, told "back tomorrow" survives CSV export with the correct column count (RFC-4180, roadmap SC-1) | ✓ VERIFIED | Unchanged; probe re-run this session → EXPORT_VERIFY_OK |
| 2 | Worker history and worksite-month registers serialize to identical RFC-4180 CSV shapes the screen can save | ✓ VERIFIED | Unchanged; builders untouched; probe asserts BOM + shapes exit 0 |
| 3 | PDF HTML generation is theme-driven with legend row and summarize() footer | ✓ VERIFIED | Unchanged; no builder modifications |
| 4 | Filenames are lowercase slug forms hazra-worker-{slug}-{yyyymmdd} and hazra-register-{siteslug}-{yyyymm} | ✓ VERIFIED | Unchanged; slug builders untouched |
| 5 | Manager opens /export directly and picks an active worker or one active worksite + one past-or-current month | ✓ VERIFIED | Unchanged; no picker modifications |
| 6 | Deep links ?workerId= and ?worksiteId=&month= preselect scope; tampered ids render not-found and never reach SQL | ✓ VERIFIED | Unchanged; load() null-boundaries intact |
| 7 | Preview card shows row-count line + up to 5 sample rows from the SAME dataset the file is built from | ✓ VERIFIED | Unchanged; same-state feed intact |
| 8 | One orange CTA exports exactly one file (double-tap safe), then a success card offers Share + Export another | ✓ VERIFIED | exportLock + finally intact on ALL paths now — CR-01 root cause removed, no qualifier needed |
| 9 | Zero rows disables the CTA with a calm no-action line; failures show destructive retry text and delete partials | ✓ VERIFIED | scopeCount===0 calm line (821-824) + ctaDisabled intact; error surface + partial cleanup intact |
| 10 | Worker profile shows an Export action below Edit that opens /export with that worker preselected | ✓ VERIFIED | Untouched; no regression |
| 11 | Reports per-worker rows offer export to /export?workerId= and worksite context offers /export?worksiteId=&month= | ✓ VERIFIED | Untouched; no regression |
| 12 | Phase-wide gates pass: tsc clean, no hardcoded hex, Pressable-only, tabular-nums on counts | ✓ VERIFIED | `npx tsc --noEmit` → exit 0 (re-run this session); probe → EXPORT_VERIFY_OK (re-run); no TODO/FIXME/console-log stubs in export.tsx |
| 13 | (06-04) On web, tapping the orange Export CTA for a worker CSV shows the success card | ✓ VERIFIED | Both web CSV branches set savedScope+savedFormat (428-429, 481-482); showSuccess gate reachable |
| 14 | (06-04) On web, tapping Share when sharing is unavailable shows an honest inline notice | ✓ VERIFIED | shareNotice state; exact unavailable string (533); cleared in resetExport (547) |
| 15 | (06-04) With PDF selected, the preview card shows the same % footer summary line the PDF file contains | ✓ VERIFIED | footerSummary render (880-890) — identical function the builders call |
| 16 | (06-05) On web, tapping Export with PDF selected opens a real print-to-PDF flow (or honest popup-blocked message) | ✓ VERIFIED | openWebPrintHtml call sites (433, 486); 'blocked' → exact popup message (435, 488) |
| 17 | (06-05) A stale loadSiteRegister resolution can never clobber fresh register rows | ✓ VERIFIED | isStale param + early returns before state writes; both callers pass local isStale |
| 18 | (06-05) Export cannot write a header-only file from an empty snapshot | ✓ VERIFIED | **CR-01 CLOSED:** `try {` at export.tsx:390, `const rows` guard at 391-394 INSIDE try, `finally` (520-523) resets `exportLock.current=false` + `setExporting(false)` on the empty-return path (returns inside try DO run finally). Exact message 'No attendance to export yet' preserved (393) |
| 19 | (06-06) Tapping Export with an empty snapshot shows 'No attendance to export yet' and leaves Export usable | ✓ VERIFIED | Guard returns inside try → finally releases; CTA not bricked; verified by code path 390-395 → 520-523 |
| 20 | (06-06) After an empty tap, the CTA is not stuck on 'Exporting' and a subsequent non-empty tap exports normally | ✓ VERIFIED | `setExporting(false)` in finally runs on empty path; `exportLock.current=false` single reset (no duplicate manual resets); ctaDisabled (569) clears |
| 21 | (06-06) On web with PDF selected, the success card no longer claims 'Saved to Downloads' | ✓ VERIFIED | Heading expression (768-770) renders 'Opened print dialog' for web+pdf; caption 'Choose Save as PDF in the print dialog to keep the file.' (772-777); fallback 'Saved to Downloads' intact for native/web-CSV |
| 22 | (06-06) The empty-data message does not offer a futile 'Try again' retry affordance | ✓ VERIFIED | Retry Pressable gated on `exportError !== 'No attendance to export yet'` (914); message Text always rendered (909-913); transient failures keep retry (915-928); no new useState |

**Score:** 22/22 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Exported CSV/PDF open correctly on a second device after transfer (roadmap SC-3 device half) | Phase 9 | Phase 9 SC-3: production build passes on-device test of file-system access and sharing |
| 2 | Files confirmed present in physical Downloads folder (roadmap SC-2 device half) | Phase 9 | Same Phase 9 SC-3 file-system proof |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ------- | ------ | ------- |
| `src/utils/export.ts` | 12 serializers, pure, RFC-4180 + theme PDF | ✓ VERIFIED | Untouched by 06-04/05/06 (per plan constraints); probe exit 0 this session |
| `src/utils/files.ts` | file helpers incl. web print helper | ✓ VERIFIED | Unchanged by 06-06; only export.tsx modified (git log confirms) |
| `scripts/verify-export.mjs` | Standing RFC-4180 probe | ✓ VERIFIED | EXPORT_VERIFY_OK exit 0 re-run this session |
| `src/components/month-sheet.tsx` | Month-grid picker | ✓ VERIFIED | Untouched; no regression |
| `src/app/export.tsx` | Export screen + all gap closures | ✓ VERIFIED | CR-01 guard placement confirmed in code (391 > 390, inside try); WR-08/WR-10 copy confirmed (768-777, 914); commits d50b609 + 260e3c7 on main |
| `src/app/worker/[id].tsx` | Profile Export action | ✓ VERIFIED | Untouched; no regression |
| `src/app/(tabs)/reports.tsx` | Reports deep-links | ✓ VERIFIED | Untouched; no regression |
| `src/components/report-row.tsx` | Per-row Export affordance | ✓ VERIFIED | Untouched; no regression |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| export.tsx empty guard | try/finally lock release | guard returns inside try so finally resets exportLock/exporting | WIRED | `try {` 390 → guard 391-394 → `finally` 520-523; single `exportLock.current = false` reset |
| export.tsx success card | honest web-PDF copy | Platform.OS + savedFormat conditional heading | WIRED | Lines 768-777 |
| export.tsx error surface | gated retry | exportError !== empty-string literal | WIRED | Line 914; retry Pressable 915-928 intact for transient path |
| export.tsx | success card | setSavedScope/setSavedFormat before web early-return | WIRED | Lines 428-429, 481-482, 442-443, 495-496 (unchanged) |
| export.tsx | preview card | footerSummary render when pdf | WIRED | Lines 880-890 (unchanged) |
| export.tsx | files.ts | openWebPrintHtml in web+pdf branches | WIRED | Call sites 433, 486 (unchanged) |
| export.tsx | register state | isStale-guarded state writes | WIRED | Unchanged |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| export.tsx preview + file | entries / regRows | getAttendanceForWorker (full history / month-range flat-map) | ✓ FLOWING | ✓ VERIFIED — tap-time `rows` snapshot (391) reads the same state the builders consume; no second fetch |
| export.tsx web-PDF savedUri | builder html string | buildWorkerPdfHtml / buildRegisterPdfHtml | ⚠️ STATIC (Blob URL, not a file) | WARNING (WR-08 copy now honest — card says 'Opened print dialog', no longer claims a file was saved) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| tsc clean | npx tsc --noEmit | exit 0 | ✓ PASS |
| RFC-4180 probe (real module) | node scripts/verify-export.mjs | EXPORT_VERIFY_OK exit 0 | ✓ PASS |
| CR-01 guard inside try | read export.tsx:390-395 vs finally@520 | guard (391-394) below try (390), finally resets | ✓ PASS |
| WR-08 honest copy | grep Opened print dialog + Choose Save as PDF | hits at 769, 775; fallback Saved to Downloads intact at 770 | ✓ PASS |
| WR-10 gated retry | grep exportError !== literal + Try again | gate at 914; retry Pressable intact 915-928 | ✓ PASS |
| No stubs | grep TODO/FIXME/PLACEHOLDER/return null/console.log | 0 matches | ✓ PASS |
| Commits present | git log --oneline | d50b609 + 260e3c7 on main | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| EX-01 | 06-01, 06-02, 06-03, 06-04, 06-06 | Export single worker history (CSV and/or PDF) | ✓ SATISFIED (code) | Prior wiring + web success card reachable; device open → human_needed |
| EX-02 | 06-01, 06-02, 06-03, 06-04, 06-05, 06-06 | Export full worksite monthly register (CSV and/or PDF) | ✓ SATISFIED (code) | CR-01 closed — empty-register edge no longer bricks Export; stale guard + web PDF path intact |
| EX-03 | 06-02, 06-03, 06-04, 06-05, 06-06 | Files saved to Downloads and open correctly outside app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | Honest share-unavailable notice + honest web-PDF copy; device transfer → human_needed |
| NF-06 | 06-01, 06-02, 06-05, 06-06 | Exports open/parse correctly outside the app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | Serializers unchanged, probe green; web-PDF delivery is print-dialog-mediated |

All four phase requirement IDs appear in PLAN frontmatter across 06-01 (EX-01/EX-02/NF-06), 06-02 (EX-01/EX-02/EX-03/NF-06), 06-03 (EX-01/EX-02/EX-03), 06-04 (EX-01/EX-02/EX-03), 06-05 (EX-02/EX-03/NF-06), 06-06 (EX-01/EX-02/EX-03/NF-06). No orphaned IDs: REQUIREMENTS.md maps exactly EX-01..03 + NF-06 to Phase 6.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TODO/FIXME/placeholder/empty-return/console-log-only stubs in scope files | — | Clean |

Prior warnings WR-09 (Blob URL leak), WR-11 (stale rows exportable after failed load), WR-12 (closure month), IN-11/IN-12 remain deferred to Phase 9 hardening per plan; WR-08 and WR-10 are now closed. Only CR-01 was a frontmatter gap and it is closed.

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

Gap-closure plan 06-06 delivered exactly what it promised. CR-01 is closed in the code — not just claimed: `try {` opens at export.tsx:390 and the `const rows` + empty-length guard sits at 391-394 inside it, so the early return runs `finally` (520-523) and releases `exportLock`/`exporting`; an empty tap now shows 'No attendance to export yet' and the CTA stays usable. WR-08 and WR-10 are closed as render-only copy using existing state: web-PDF success shows 'Opened print dialog' + Save-as-PDF caption while native/web-CSV keep 'Saved to Downloads', and the empty error shows with no retry button while transient failures keep theirs. All 18 prior truths now hold without qualifier (22/22 including the 4 new 06-06 truths), gates re-run clean (`tsc` exit 0, `EXPORT_VERIFY_OK`), only `src/app/export.tsx` touched (commits d50b609, 260e3c7), and no stubs introduced. The remaining items are device-dependent human verifications (Downloads presence, second-device open, navigation taps) deferred to on-device testing per precedent — hence `human_needed`, not `passed`.

---

_Verified: 2026-10-11T12:00:00Z (re-verification after 06-06 gap closure; CR-01 confirmed closed in code)_
_Verifier: OpenCode (gsd-verifier)_
