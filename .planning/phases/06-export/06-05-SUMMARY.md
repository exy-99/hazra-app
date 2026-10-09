# Phase 6 Plan 5: Web PDF Print Path + Stale-Guard + Empty-Tap Guard Summary

**Phase:** 06-export · **Plan:** 05 · **Date:** 2026-10-10
**Commits:** 47b919f, c0cab67, 8d10cc1
**Requirements:** EX-02, EX-03, NF-06 (UAT gap 3 blocker)

## One-liner

Web PDF exports now open a real browser print-to-PDF flow with an honest popup-blocked message, stale register loads can no longer clobber fresh rows, and an empty tap-time snapshot yields a message instead of a header-only file.

## What was built

1. **Web print helper (47b919f):** `src/utils/files.ts` gains synchronous `openWebPrintHtml(html): 'opened' | 'blocked'` — `typeof window` guard, `window.open('', '_blank')`, `document.write`/`close`/`focus`/`print`, `'blocked'` on missing window or null popup. Module docstring documents the web print path. `printHtmlToPdf` still throws `pdf-unsupported` on web (native-only contract unchanged).
2. **Web PDF branches (c0cab67):** `src/app/export.tsx` imports `openWebPrintHtml` and adds a `Platform.OS === 'web' && selectedFormat === 'pdf' && html !== null` branch in EACH scope (worker + register): `'blocked'` sets exportError to exactly `"Popup blocked — allow popups to print the PDF"` (existing Couldn't-export/Try-again surface with an actionable reason); `'opened'` creates a `text/html` Blob URL for the savedUri/showSuccess gate and sets savedName (.pdf slug), savedScope, savedFormat, then returns. Native PDF path (`printHtmlToPdf` → `copyBinaryFile`) untouched. Only builder HTML reaches `document.write` — no name/note concatenation at the call site (T-06-05-01).
3. **Stale-guard + empty protection (8d10cc1):** `loadSiteRegister` takes a fourth param `isStale: () => boolean` and returns early after each await (post-`listWorkers`, post-`Promise.all`) before ANY setRegRows/setRegWorkerCount/setSiteName; both callers pass their local `isStale` closure. `ctaDisabled` gains the `loading` term. `handleExport` snapshots `rows` after `setExportError(null)` and returns `"No attendance to export yet"` (exact) on empty — a header-only file can never be written from a raced snapshot. No DAO changes, no SQL touched.

## Verification

- `npx tsc --noEmit` exit 0 after every task.
- Temp `scripts/check-06-05.cjs` passed all 19 assertions (helper signature + window.open/print guards + web-throw preserved; import + 2 branch sites + 2 call sites + Popup-blocked em-dash + native path intact; isStale param + 2 call sites + loading in ctaDisabled + exact empty message + rows snapshot + zero DELETE/SQL; shareNotice plan-exact em-dash); temp file deleted after.
- Plan-level gates: no DAO files modified, zero SQL strings added, no hardcoded hex, Pressable only.

## Deviations from Plan

**Fixup verified as no-op (byte-checked, not eyeballed):** the plan premise said `shareNotice` carried an ASCII hyphen, but `node` codepoint check showed the dash is already U+2014 and the apostrophe U+0027 — the line already matches the plan-exact `"Sharing isn't available here — your file is in Downloads."` from 06-04. No edit made; committed with Task 2 as zero diff. No other deviations — plan executed as written.

## Decisions Made

- `'blocked'` sets `exportError` directly and returns (rather than throwing through the generic catch) so the actionable popup message survives instead of being overwritten by `"Couldn't export — try again"`.
- The web-PDF Blob URL is kept live as `savedUri` (no 1s revoke like the CSV anchor downloads) so the success-card Share attempt stays wired and yields the 06-04 honest unavailable notice on web.
- Tap-time guard placed after `setExportError(null)` inside `try` so the `finally` lock reset still runs on the early return.

## Known Stubs

None.

## Threat Flags

None beyond the plan's threat model. T-06-05-01 mitigated (only `buildWorkerPdfHtml`/`buildRegisterPdfHtml` output reaches `document.write`); T-06-05-02 mitigated (isStale guards + loading term + tap-time guard); T-06-05-03 mitigated (`'blocked'` → actionable message with Try again). No new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `src/utils/files.ts` contains `openWebPrintHtml` with exact signature — FOUND.
- `src/app/export.tsx` contains 2 web+pdf branches, 2 `openWebPrintHtml(html)` calls, isStale param + 2 call sites, loading in ctaDisabled, exact empty message — FOUND.
- Commits 47b919f, c0cab67, 8d10cc1 present in `git log` — FOUND.
- Temp `scripts/check-06-05.cjs` deleted; working tree clean.
