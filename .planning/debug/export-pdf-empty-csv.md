---
status: diagnosed
trigger: "Test 5 in .planning/phases/06-export/06-UAT.md — PDF never exports (persistent try-again), CSV downloads with correct name/header but zero attendance rows"
created: 2026-10-09T00:00:00Z
updated: 2026-10-10T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (two root causes, web platform). (a) PDF: no web export path exists — printHtmlToPdf unconditionally throws `pdf-unsupported` on web and export.tsx has only web-CSV Blob branches, so every PDF tap deterministically fails. (b) CSV: header-only output iff input array empty (serializers proven lossless) — regRows/entries was [] at build time; upstream month-range flat-map yields [] when the picked month holds no stored rows for the current active roster, compounded by a WR-02 staleness gap (state writes inside loadSiteRegister precede the isStale bail).
test: Completed — code-traced both paths, grep-verified branch asymmetry, re-ran scripts/verify-export.mjs (EXPORT_VERIFY_OK)
expecting: N/A — diagnosis only (goal: find_root_cause_only)
next_action: Return ROOT CAUSE FOUND; no fix applied per diagnose-only mode

## Symptoms

expected: Both CSV and PDF land in Downloads with slug names; CSV has header date,worker,status,note plus attendance rows; PDF renders.
actual: User reported: "the pdf does not get exported(i dont get any pdf file) and gives try againg error, and still does not work after trying again. the csv file gets exported but it does not contain the attendence of a worksite or individual, the naming works fine and correctly"
errors: PDF path shows "Couldn't export — try again" persistently; CSV has correct name/header but zero attendance rows
reproduction: Test 5 in .planning/phases/06-export/06-UAT.md — export same worksite+month as CSV then PDF
started: Discovered during UAT 2026-10-09

## Eliminated

- hypothesis: SAF Downloads permission denial breaks PDF (copyBinaryFile path)
  evidence: CSV uses the same createDownloadsFile/SAF destination (writeTextFile, files.ts:63-80) and succeeds — Downloads destination is granted. SAF failure would break both formats equally.
  timestamp: 2026-10-10T00:00:00Z
- hypothesis: buildRegisterCsv/buildWorkerCsv drop rows (serializer bug)
  evidence: scripts/verify-export.mjs re-run this session prints EXPORT_VERIFY_OK against the REAL module; builders write header + every input row unconditionally (export.ts:75-100). Header-only file ⟺ empty input array, proven.
  timestamp: 2026-10-10T00:00:00Z
- hypothesis: User is on a native dev build with broken expo-print
  evidence: Three independent web-only signatures all reported — (1) share dead (shareFile returns 'unavailable' on web, files.ts:102-108; Test 3), (2) no success card AND no error after CSV save (web early-return skips setSavedScope/Format so showSuccess permanently false; Test 3 verbatim), (3) verification deferred all native proofs to Phase 9 for lack of a dev build while user demonstrably runs with working SQLite (previews pass) — only web satisfies all three.
  timestamp: 2026-10-10T00:00:00Z

## Evidence

- timestamp: 2026-10-10T00:00:00Z
  checked: src/utils/files.ts printHtmlToPdf (lines 88-94)
  found: Throws `new Error('pdf-unsupported')` when Platform.OS === 'web' — unconditional, no fallback, by design (D-16 fail-loudly)
  implication: On web, EVERY PDF export attempt throws before any file is created
- timestamp: 2026-10-10T00:00:00Z
  checked: src/app/export.tsx handleExport web branches (grep + lines 401-414, 438-451)
  found: Exactly 2 web branches, both gated `Platform.OS === 'web' && selectedFormat === 'csv'` (Blob download). Zero web branches for PDF (grep for web+pdf in proximity: false). PDF on web falls through to printHtmlToPdf → throw → catch sets "Couldn't export — try again" (line 472); retry is byte-identical → persistent failure
  implication: PDF-on-web failure is deterministic, not intermittent — retry can never succeed
- timestamp: 2026-10-10T00:00:00Z
  checked: src/app/export.tsx web CSV early-returns (lines 411-413, 448-450) vs setSavedScope/setSavedFormat (lines 463-464) and showSuccess (lines 512-516)
  found: Web CSV path returns BEFORE setting savedScope/savedFormat, so showSuccess stays false forever on web — success card never renders, CTA never locks (WR-07 dead on web: every tap re-downloads, Downloads accumulates duplicates). Matches Test 3 verbatim ("saves file but does not show success or failed", "share button does not work" via shareFile 'unavailable' on web)
  implication: Platform triangulated as web; also explains duplicate-download confusion risk for (b)
- timestamp: 2026-10-10T00:00:00Z
  checked: src/utils/export.ts builders (lines 75-100) + probe re-run (EXPORT_VERIFY_OK)
  found: buildWorkerCsv/buildRegisterCsv sort a copy and write header + one line per input row unconditionally; probe asserts real-module output shapes. Empty file ⟺ empty input array — no row-dropping code path exists
  implication: CSV emptiness is an upstream data problem (state/DAO), never a serialization problem
- timestamp: 2026-10-10T00:00:00Z
  checked: src/app/export.tsx loadSiteRegister (lines 222-254) + load() staleness guards (lines 324, 342)
  found: (i) Register rows = flat-map of per-worker getAttendanceForWorker(w.id, {from, to}) over monthRange(selectedMonth) — yields [] when the picked month has no STORED rows for CURRENT active-roster members (unmarked days leave no rows unlike getAttendanceForDate's LEFT JOIN; reassigned/deactivated workers excluded by active-only listWorkers filter at 228-232, includeInactive only when the site itself is inactive). (ii) WR-02 gap: setRegRows/setRegWorkerCount inside loadSiteRegister (251-252) execute BEFORE the caller's isStale() bail (324/342) — a superseded site/month load landing last clobbers fresh rows with stale (possibly empty) data. Worker scope uses unscoped full-history getAttendanceForWorker (281/302) — the same DAO the passing Test-2 preview reads — so worker-CSV-empty implies a different/stale selection or stale downloaded file, not DAO failure
  implication: Ranked triggers for empty input: picked-month-has-no-stored-rows (B1), ex-member exclusion (B2), stale-overwrite race (B4), web duplicate-file confusion (B3)

## Resolution

root_cause: Two distinct causes on web (Platform.OS === 'web'): (A) PDF export has no web implementation — src/utils/files.ts printHtmlToPdf (lines 88-94) throws `pdf-unsupported` on web and src/app/export.tsx provides web Blob-download branches ONLY for CSV (lines 401-414, 438-451; zero PDF web branches, grep-verified), so every PDF tap deterministically throws into the catch that sets "Couldn't export — try again" (line 472); retry re-executes the identical throwing path, hence persistence. (B) CSV header-only output means regRows/entries was [] at build time — serializers losslessly write every input row (export.ts:75-100, EXPORT_VERIFY_OK re-run), and preview/file share one state object with no refetch in handleExport, so the loss is upstream: loadSiteRegister's month-range flat-map (export.tsx:222-243) legitimately yields [] when the picked month holds no stored attendance rows for the currently-active roster (unmarked days store nothing; reassigned/deactivated members are filtered out at 228-232), compounded by the WR-02 staleness gap where setRegRows (251) runs before the isStale() bail (324/342) letting a superseded load clobber fresh rows; on web the dead WR-07 lock (showSuccess never true via early-returns 411-413/448-450) additionally lets duplicate downloads accumulate, inviting opening a stale copy.
fix: NONE (diagnose-only mode — no code changed)
verification: Mechanism-level: grep-confirmed branch asymmetry (2 web-CSV, 0 web-PDF) + pdf-unsupported throw; probe re-run EXPORT_VERIFY_OK; three independent web-signature matches (dead share, missing success card, PDF-always-fails/CSV-downloads). On-device/file-level verification deferred — requires human on web build.
files_changed: []
