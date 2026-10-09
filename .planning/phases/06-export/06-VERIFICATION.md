---
phase: 06-export
verified: 2026-10-10T12:00:00Z
status: gaps_found
score: 17/18 must-haves verified
overrides_applied: 0
re_verification: true
previous_status: human_needed
previous_score: 12/12
gaps_closed:
  - "UAT test 3 (web success card): both web CSV branches set savedScope+savedFormat — showSuccess gate reachable on web"
  - "UAT test 3 (share feedback): share-unavailable inline notice, cleared on reset"
  - "UAT test 4 (% footer): PDF preview renders footerSummary line for both scopes"
  - "UAT test 5 (web PDF): real print-to-PDF flow via openWebPrintHtml + actionable popup-blocked message"
  - "UAT test 5 (stale clobber): loadSiteRegister isStale-guarded, loading in ctaDisabled"
gaps_remaining:
  - "CR-01: tap-time empty guard leaks exportLock/exporting — one empty tap permanently disables Export"
regressions:
  - "CR-01 (introduced by 06-05 commit 8d10cc1): empty-tap early return sits before try/finally, contradicting the 06-05 summary claim it was placed inside try"
gaps:
  - truth: "Export cannot write a header-only file from an empty snapshot: the CTA stays disabled while loading and an empty tap-time snapshot surfaces an honest message instead of a file"
    status: failed
    reason: "CR-01 CONFIRMED in code: handleExport sets exportLock=true + setExporting(true) (export.tsx:385-386), then the empty guard returns at 389-392 BEFORE the try block (starts 395) whose finally (520-523) is the only place that resets the lock. One empty tap leaves exportLock=true and exporting=true forever: later taps hit `if (exportLock.current) return` (382), ctaDisabled (569, includes exporting) stays true with label stuck on Exporting. Neither resetExport (541-548) nor retry (376-379) clears either flag. The 06-05 summary claim (guard inside try) is false in the code."
    artifacts:
      - path: "src/app/export.tsx"
        issue: "empty-tap guard (388-392) returns before try (395); finally (520-523) never runs on that path — move the guard to the top of the existing try per the review fix"
    missing:
      - "Move `const rows` + empty-length early return inside the try block so finally releases exportLock/exporting"
      - "Re-run npx tsc --noEmit after the move"
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
**Verified:** 2026-10-10T12:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap-closure plans 06-04 (commits 21bfb07, d494552, e0a425c) and 06-05 (commits 47b919f, c0cab67, 8d10cc1), plus gap-closure review CR-01/WR-08–WR-12/IN-10–IN-12

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A note containing left early, told "back tomorrow" survives CSV export with the correct column count (RFC-4180, roadmap SC-1) | ✓ VERIFIED | Unchanged since prior verification; probe re-run this session → EXPORT_VERIFY_OK |
| 2 | Worker history and worksite-month registers serialize to identical RFC-4180 CSV shapes the screen can save | ✓ VERIFIED | Unchanged; builders untouched by 06-04/06-05; probe asserts BOM + shapes exit 0 |
| 3 | PDF HTML generation is theme-driven with legend row and summarize() footer | ✓ VERIFIED | Unchanged; no builder modifications in gap-closure plans |
| 4 | Filenames are lowercase slug forms hazra-worker-{slug}-{yyyymmdd} and hazra-register-{siteslug}-{yyyymm} | ✓ VERIFIED | Unchanged; slug builders untouched |
| 5 | Manager opens /export directly and picks an active worker or one active worksite + one past-or-current month | ✓ VERIFIED | Unchanged; no picker modifications |
| 6 | Deep links ?workerId= and ?worksiteId=&month= preselect scope; tampered ids render not-found and never reach SQL | ✓ VERIFIED | Unchanged; load() null-boundaries intact; isStale bails added, no DAO touched |
| 7 | Preview card shows row-count line + up to 5 sample rows from the SAME dataset the file is built from | ✓ VERIFIED | Unchanged; same-state feed intact |
| 8 | One orange CTA exports exactly one file (double-tap safe), then a success card offers Share + Export another | ✓ VERIFIED (normal path) | exportLock + finally intact on all in-try paths (returns inside try DO run finally). NOTE: CR-01 breaks this after an empty tap — captured as gap on truth 18, single root cause, not double-counted |
| 9 | Zero rows disables the CTA with a calm no-action line; failures show destructive retry text and delete partials | ✓ VERIFIED | scopeCount===0 calm line (813-816) + ctaDisabled intact; error surface + partial cleanup intact |
| 10 | Worker profile shows an Export action below Edit that opens /export with that worker preselected | ✓ VERIFIED | Untouched by gap-closure plans; no regression |
| 11 | Reports per-worker rows offer export to /export?workerId= and worksite context offers /export?worksiteId=&month= | ✓ VERIFIED | Untouched by gap-closure plans; no regression |
| 12 | Phase-wide gates pass: tsc clean, no hardcoded hex, Pressable-only, tabular-nums on counts | ✓ VERIFIED | `npx tsc --noEmit` → exit 0 (re-run this session); probe → EXPORT_VERIFY_OK (re-run); footerLine style reuses Type.caption + tabular-nums, no hex added (review confirms Pressable-only, no hardcoded hex) |
| 13 | (06-04) On web, tapping the orange Export CTA for a worker CSV shows the success card (Saved to Downloads + filename + Share + Export another) | ✓ VERIFIED | Both web CSV branches set savedScope+savedFormat before return (export.tsx:428-429 worker, 481-482 register); 4-field showSuccess gate (561-565) reachable on web; WR-07 CTA lock works identically |
| 14 | (06-04) On web, tapping Share when sharing is unavailable shows an honest inline notice instead of doing nothing | ✓ VERIFIED | shareNotice state (215); handleShare sets exact "Sharing isn't available here — your file is in Downloads." on 'unavailable' (532-534), catch stays silent; muted-caption polite live-region render (788-797); cleared in resetExport (547) |
| 15 | (06-04) With PDF format selected, the on-screen preview card shows the same % footer summary line that the PDF file contains | ✓ VERIFIED | footerSummary imported (37); pdf-only Text calls footerSummary(selectedScope==='worker'?entries:regRows) (870-883) — the identical function the file builders call; tabular-nums footerLine style (1108-1111) |
| 16 | (06-05) On web, tapping Export with PDF selected opens a real print-to-PDF flow (or an honest popup-blocked message) — never a persistent Couldn't export retry loop | ✓ VERIFIED | openWebPrintHtml sync helper (files.ts:109-122, window guard + blocked mapping); imported (49); web+pdf branches in BOTH scopes (432-445 worker, 485-498 register); 'blocked' → exact "Popup blocked — allow popups to print the PDF" (435, 488); native printHtmlToPdf path untouched (449-452, 501-505) |
| 17 | (06-05) A stale loadSiteRegister resolution can never clobber fresh register rows | ✓ VERIFIED | loadSiteRegister takes isStale param (229) with early returns after each await before ANY state write (237-239, 243-245); both callers pass local isStale (333, 351) |
| 18 | (06-05) Export cannot write a header-only file from an empty snapshot: the CTA stays disabled while loading and an empty tap-time snapshot surfaces an honest message instead of a file | ✗ FAILED | Guard exists and shows the exact message (388-392) and `loading` is in ctaDisabled (569) — but CR-01: the guard returns BEFORE try/finally, permanently leaking exportLock/exporting. See gap below. No header-only file is written, but all subsequent exports are bricked until remount |

**Score:** 17/18 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Exported CSV/PDF open correctly on a second device after transfer (roadmap SC-3 device half) | Phase 9 | Phase 9 SC-3: production build passes on-device test of file-system access and sharing |
| 2 | Files confirmed present in physical Downloads folder (roadmap SC-2 device half) | Phase 9 | Same Phase 9 SC-3 file-system proof |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/utils/export.ts` | 12 serializers, pure, RFC-4180 + theme PDF | ✓ VERIFIED | Untouched by 06-04/06-05 (per plan constraints); probe exit 0 this session |
| `src/utils/files.ts` | file helpers incl. web print helper | ✓ VERIFIED | openWebPrintHtml present with exact `'opened' \| 'blocked'` signature (109); window guard + window.open + w.print(); printHtmlToPdf web-throw preserved (91-94); docstring documents web path (18-19) |
| `scripts/verify-export.mjs` | Standing RFC-4180 probe | ✓ VERIFIED | EXPORT_VERIFY_OK exit 0 re-run this session |
| `src/components/month-sheet.tsx` | Month-grid picker | ✓ VERIFIED | Untouched; no regression |
| `src/app/export.tsx` | Export screen + all gap closures | ✗ BLOCKER (CR-01) | All 06-04/06-05 features present and wired (see truths 13-17), but the empty-tap guard placement (388-392 before try at 395) leaks the export lock — one-line move required |
| `src/app/worker/[id].tsx` | Profile Export action | ✓ VERIFIED | Untouched; no regression |
| `src/app/(tabs)/reports.tsx` | Reports deep-links | ✓ VERIFIED | Untouched; no regression |
| `src/components/report-row.tsx` | Per-row Export affordance | ✓ VERIFIED | Untouched; no regression |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| export.tsx | success card | setSavedScope/setSavedFormat before web early-return | WIRED | Lines 428-429, 481-482 (CSV) + 442-443, 495-496 (PDF web) |
| export.tsx | preview card | footerSummary render when pdf | WIRED | Lines 870-883 |
| export.tsx | files.ts | openWebPrintHtml in web+pdf branches | WIRED | Import 49; call sites 433, 486 |
| export.tsx | register state | isStale-guarded setRegRows/setRegWorkerCount/setSiteName | WIRED | Guards 237, 243 precede writes 261-263; callers 333, 351 |
| files.ts | browser print | window.open + w.print | WIRED | files.ts:113-121 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| export.tsx preview + file | entries / regRows | getAttendanceForWorker (full history / month-range flat-map) | ✓ FLOWING | ✓ VERIFIED — tap-time `rows` snapshot (388) reads the same state the builders consume; no second fetch |
| export.tsx web-PDF savedUri | builder html string | buildWorkerPdfHtml / buildRegisterPdfHtml | ⚠️ STATIC (Blob URL, not a file) | WARNING (WR-08) — success card claims "Saved to Downloads" for an in-memory Blob URL; see warnings below |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| tsc clean | npx tsc --noEmit | exit 0 | ✓ PASS |
| RFC-4180 probe (real module) | node scripts/verify-export.mjs | EXPORT_VERIFY_OK exit 0 | ✓ PASS |
| 06-04 setters present | grep setSavedScope/setSavedFormat | 5+ sites incl. both web CSV branches | ✓ PASS |
| 06-05 web-PDF branches | grep openWebPrintHtml + Popup blocked | import + 2 call sites + 2 blocked strings | ✓ PASS |
| 06-05 stale guard | grep isStale in loadSiteRegister + callers | param + 2 internal guards + 2 call sites | ✓ PASS |
| CR-01 lock leak | read export.tsx:381-395 vs try@395/finally@520 | guard return (391) precedes try — leak CONFIRMED | ✗ FAIL (BLOCKER) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| EX-01 | 06-01, 06-02, 06-03, 06-04 | Export single worker history (CSV and/or PDF) | ✓ SATISFIED (code) | Prior wiring + web success card now reachable; device open → human_needed |
| EX-02 | 06-01, 06-02, 06-03, 06-04, 06-05 | Export full worksite monthly register (CSV and/or PDF) | ✓ SATISFIED (code) / ✗ BLOCKED (empty-register edge) | Web PDF path + stale guard present; but CR-01 bricks Export after one empty tap — a worksite-month with no marks is exactly the trigger |
| EX-03 | 06-02, 06-03, 06-04, 06-05 | Files saved to Downloads and open correctly outside app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | honest share-unavailable notice added; WR-08 overclaim on web-PDF noted as warning |
| NF-06 | 06-01, 06-02, 06-05 | Exports open/parse correctly outside the app | ✓ SATISFIED (code) / ? NEEDS HUMAN (device) | Serializers unchanged, probe green; web-PDF delivery is print-dialog-mediated (user must pick Save as PDF) |

All four phase requirement IDs (EX-01, EX-02, EX-03, NF-06) appear in PLAN frontmatter (06-04: EX-01/EX-02/EX-03; 06-05: EX-02/EX-03/NF-06; combined with 06-01..03 coverage all four are claimed and accounted for above). No orphaned IDs: REQUIREMENTS.md maps exactly EX-01..03 + NF-06 to Phase 6.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| export.tsx:388-392 | CR-01 empty-guard before try | 🛑 Blocker | One empty tap permanently disables Export until remount |
| export.tsx:432-444, 485-497 → 768 | WR-08 web-PDF "Saved to Downloads" overclaim | ⚠️ Warning | No file written on web-PDF; card overstates. Fix: printOnly copy branch |
| export.tsx:438-439, 491-492 | WR-09 Blob URL leak (no revokeObjectURL on PDF path) | ⚠️ Warning | Each PDF export pins HTML in memory for tab lifetime |
| export.tsx:389-391 + 899-923 | WR-10 empty message shares Try-again surface | ⚠️ Warning | Futile retry loop on empty data (after CR-01 fix makes it tappable) |
| export.tsx:381-392, 358-362, 569 | WR-11 stale rows exportable after failed load | ⚠️ Warning | loadError/notFound not in ctaDisabled; catch leaves stale rows |
| export.tsx:225-231 | WR-12 loadSiteRegister reads selectedMonth from closure | ⚠️ Warning | Month should be an explicit param; correctness rests solely on isStale |
| files.ts:113 | IN-11 window.open without noopener | ℹ️ Info | Negligible (app-controlled about:blank + builder HTML) |
| files.ts:109-122 | IN-12 print() throw + unguarded DOM globals | ℹ️ Info | print() throw surfaces as generic failure, losing actionable copy |

No TODO/FIXME/placeholder/empty-return/console-log-only stubs found in scope files. WR-08–WR-12/IN-10–IN-12 are documented here for planner bundling; only CR-01 is a frontmatter gap (BLOCKER). Recommend the gap-closure plan fix CR-01 (one-line move) and bundle WR-08/WR-10 copy fixes if cheap, deferring WR-09/WR-11/WR-12 to Phase 9 hardening unless trivial.

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

Gap-closure plans 06-04 and 06-05 delivered: UAT tests 3 (web success card + share notice), 4 (% footer), and 5 (web PDF flow, stale guard, empty guard) all verify at code level — 5 of 6 new must-haves pass, all 12 original must-haves hold with no regressions on their normal paths, and gates re-run clean (`tsc` exit 0, `EXPORT_VERIFY_OK`). But 06-05 introduced one critical defect: the tap-time empty guard returns before the `try`/`finally` that releases the export lock, so a single empty export (e.g. a worksite-month with no marks — exactly UAT test 5's scenario) permanently disables the Export CTA until the screen remounts, directly contradicting the 06-05 summary's "inside try" claim. This is a one-line fix (move the guard to the top of the existing `try`) followed by `tsc`. The remaining review findings (WR-08 PDF copy overclaim, WR-09 Blob-URL leak, WR-10 futile retry, WR-11 stale-after-failed-load, WR-12 closure month, IN-11/IN-12) are warnings/info documented above, not shipping blockers. Device-dependent halves remain human_needed, deferred to Phase 9 per precedent.

---

_Verified: 2026-10-10T12:00:00Z (re-verification after 06-04/06-05 gap closure; CR-01 confirmed in code)_
_Verifier: OpenCode (gsd-verifier)_
