---
status: diagnosed
trigger: "Test 3 in .planning/phases/06-export/06-UAT.md — worker CSV export saves file but no success card, share dead"
created: 2026-10-09T00:00:00Z
updated: 2026-10-09T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — web CSV fast-path in handleExport() returns early without setting savedScope/savedFormat, so showSuccess can never become true on web
test: Code-path trace of handleExport web branch vs showSuccess gate + cross-test corroboration (Test 5 PDF try-again = pdf-unsupported web throw)
expecting: N/A — root cause confirmed by reading, diagnose-only mode
next_action: Return ROOT CAUSE FOUND (no fix applied per goal=find_root_cause_only)

## Symptoms

expected: Success card with Saved to Downloads + slug filename + Share file + Export another appears after export.
actual: User reported: "it saves the file but share button does not work and , it does not show sucess or failed on the screen . export another works too . and the export csv works but with issues"
errors: None reported (no error text shown on screen per user)
reproduction: Test 3 in .planning/phases/06-export/06-UAT.md — with a worker picked, tap the single orange Export CTA once (on web)
started: Discovered during UAT 2026-10-09

## Eliminated

- hypothesis: writeTextFile throws after saving (partial-write path hides card)
  evidence: User sees NO error text; the catch path sets exportError which renders unconditionally when !showSuccess (export.tsx:826). A throw would show "Couldn't export — try again". Absence of error means no throw — the success-state writes were simply never completed.
  timestamp: 2026-10-09T00:00:00Z
- hypothesis: load()/focus-refetch clears saved* state after export
  evidence: load() (export.tsx:256-358) never touches savedName/savedUri/savedScope/savedFormat; only resetExport (493-499) clears them, and it is only wired to the "Export another" button inside the success card itself.
  timestamp: 2026-10-09T00:00:00Z
- hypothesis: Native share failure hides the card
  evidence: handleShare (479-491) only reads savedUri and never mutates card state; share path cannot un-render the card. Also no dev build exists in this environment (STATE.md Deferred Verification Debt), so UAT ran on web where Sharing.isAvailableAsync() is false.
  timestamp: 2026-10-09T00:00:00Z

## Evidence

- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx handleExport worker branch, lines 401-413
  found: Web CSV fast-path calls setSavedName/setSavedUri then bare `return` at line 413, skipping setSavedScope/setSavedFormat at lines 463-464.
  implication: On web, savedScope stays null forever after a worker CSV export.
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx handleExport worksite branch, lines 438-451
  found: Identical early `return` at line 450 — same defect for worksite-month CSV on web.
  implication: Both scopes affected; matches Test 5 CSV-exports-but-card-missing behavior too.
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx showSuccess gate, lines 512-516
  found: showSuccess requires savedName !== null && savedUri !== null && savedScope === selectedScope && savedFormat === selectedFormat. With savedScope=null/savedFormat=null on web, gate is permanently false.
  implication: Success card (lines 709-753) can never render on web even though the Blob-anchor download at lines 402-410 saved the file. Exactly matches "saves the file but does not show success".
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx handleShare, lines 479-491 + src/utils/files.ts shareFile, lines 102-108
  found: shareFile returns 'unavailable' on web (Sharing.isAvailableAsync() false); handleShare swallows it with a silent `return`, zero user feedback.
  implication: Even once the card renders, Share file is visibly dead on web — matches "share button does not work". No error is shown either, matching "does not show success or failed".
- timestamp: 2026-10-09T00:00:00Z
  checked: Cross-test corroboration — 06-UAT.md Test 5 report + src/utils/files.ts printHtmlToPdf lines 88-94
  found: Test 5 user reports PDF "gives try again error" — printHtmlToPdf throws `pdf-unsupported` on web, which handleExport converts to "Couldn't export — try again" (export.tsx:472). This only happens on web.
  implication: Confirms UAT ran on web, where the early-return defect bites. Native path (lines 415-424 → 463-464) sets all four fields and would show the card.
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx ctaDisabled, line 520
  found: ctaDisabled includes showSuccess, which stays false on web, so the Export CTA never disables after a web export — repeat taps keep saving files.
  implication: Consistent with user's "export another works too" (re-tapping CTA re-saves; the real "Export another" button inside the never-rendered card is unreachable).

## Resolution

root_cause: handleExport()'s web CSV fast-paths (worker branch line 401-413, worksite branch line 438-451) set savedName/savedUri then `return` before setSavedScope/setSavedFormat (lines 463-464), so the four-field showSuccess gate (lines 512-516) is permanently false on web — file downloads via Blob anchor but the success card never renders. Secondarily, handleShare (479-491) silently swallows shareFile's 'unavailable' (files.ts:102-108, always the case on web), giving zero feedback.
fix:
verification:
files_changed: []
