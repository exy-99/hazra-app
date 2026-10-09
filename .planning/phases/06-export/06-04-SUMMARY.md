# Phase 6 Plan 4: Web Success Card + Share Feedback + Preview Footer Summary

**Phase:** 06-export · **Plan:** 04 · **Date:** 2026-10-10
**Commits:** 21bfb07, d494552, e0a425c
**Requirements:** EX-01, EX-02, EX-03 (UAT gaps 1–2)

## One-liner

Web CSV exports now reach the success card, unavailable Share shows an honest inline notice, and the PDF preview renders the same footerSummary % line as the built file.

## What was built

`src/app/export.tsx` only (no changes to `src/utils/export.ts` or `src/utils/files.ts`):

1. **Web success state (21bfb07):** Both web Blob-download branches (worker CSV, register CSV) now call `setSavedScope(selectedScope)` + `setSavedFormat(selectedFormat)` alongside the existing `setSavedName`/`setSavedUri` before the early `return`. The four-field `showSuccess` gate is reachable on web, so the success card (Saved to Downloads + filename + Share + Export another) and the WR-07 CTA lock behave identically on web and native. Native `writeTextFile` path and `finally` untouched.
2. **Share feedback (d494552):** New `shareNotice` state (`string | null`, init null). `handleShare` sets it to exactly `"Sharing isn't available here — your file is in Downloads."` when `shareFile` resolves `'unavailable'`; catch block stays silent (dismiss changes nothing). Rendered as muted-caption centered `Text` with `accessibilityLiveRegion="polite"` inside the success card below the Share row; cleared in `resetExport`. No new accent color (muted only), Pressable only, no hardcoded hex.
3. **Preview footer (e0a425c):** `footerSummary` added to the existing `@/utils/export` import. Preview card renders a pdf-only `Text` with `footerSummary(selectedScope === 'worker' ? entries : regRows)` — the identical function the file builders call — styled `Type.caption` + `tabular-nums` in `theme.mutedForeground` with a matching `accessibilityLabel`. Preview can never drift from profile/reports math.

## Verification

- `npx tsc --noEmit` exit 0 after every task.
- Temp `scripts/check-06-04.cjs` passed all 13 assertions (setSavedScope/Format ≥3 incl. both web branches, exact notice once + cleared in resetExport, zero TouchableOpacity, footerSummary import + non-import call site + tabular-nums, zero toISOString, zero hardcoded hex); temp file deleted after.
- Plan-level gates: no hardcoded hex added, Pressable only, `toISOString` count 0.

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

- Reused inline `footerSummary(...)` calls for both `accessibilityLabel` and children (pure, cheap) rather than introducing a derived const, matching the plan literally.
- New `shareNotice`/`footerLine` styles extend `Type.caption` (footer adds `tabular-nums`); notice uses `theme.mutedForeground` to preserve the one-orange rule.

## Known Stubs

None.

## Threat Flags

None. T-06-04-01: filename still rendered as text only, slug builders untouched. T-06-04-02: unavailable path returns a notice with no retry loop; share touches no state.

## Self-Check: PASSED

- `src/app/export.tsx` contains setSavedScope ×5, exact share notice, footerSummary import + call sites — FOUND.
- Commits 21bfb07, d494552, e0a425c present in `git log` — FOUND.
- Temp `scripts/check-06-04.cjs` deleted; working tree clean.
