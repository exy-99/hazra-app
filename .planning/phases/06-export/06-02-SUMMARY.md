---
phase: 06-export
plan: 02
subsystem: export
tags: [export-screen, month-picker, csv, pdf, expo-sharing, preview, downloads]

# Dependency graph
requires:
  - phase: 06-export
    provides: pure serializers + file helpers from 06-01 (src/utils/export.ts, src/utils/files.ts)
  - phase: 04-worker-profile-history
    provides: HistoryRow read-only language + summarize() reused for preview counts
  - phase: 05-home-dashboard-reports
    provides: single-scope load() + chip/radio picker + skeleton/retry patterns from reports.tsx
provides:
  - Single export drill-down screen (src/app/export.tsx) with scope pickers, preview, guarded export, success card
  - Month-grid picker (src/components/month-sheet.tsx) reusing the CalendarSheet modal precedent
affects: [06-03 entry points (deep-link params consumed here), 07-backup]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-scope export load with sibling retention state, per-scope success card, binary-safe PDF save, web Blob download branch]

key-files:
  created: [src/components/month-sheet.tsx]
  modified: [src/app/export.tsx]

key-decisions:
  - "Register rows are site-scoped via listWorkers({ worksiteId }) with includeInactive only when the site itself is inactive"
  - "Success card is per-scope/per-format (savedScope/savedFormat) so switching scope never shows another scope's card"
  - "Web CSV downloads via Blob object-URL anchor; web PDF surfaces the standard retry through the helper's pdf-unsupported throw"

patterns-established:
  - "Export preview counts and file bytes derive from the SAME in-memory state (no second fetch, no client re-scope)"
  - "normalizeMonth() clamps ?month= to YYYY-MM at-or-before the current month; future months impossible by construction"

requirements-completed: [EX-01, EX-02, EX-03, NF-06]

# Metrics
duration: 30min
completed: 2026-10-09
---

# Phase 6 Plan 2: Export Screen + Month Sheet Summary

**Single /export drill-down covering worker-history and worksite-month register export — scope pickers, same-scope preview, guarded one-file export with binary-safe PDF, success/share card, and web CSV download — all gates green**

## Performance

- **Duration:** 30 min
- **Started:** 2026-10-09T07:10:00Z
- **Completed:** 2026-10-09T07:40:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- `src/components/month-sheet.tsx` (new): `MonthSheet` + `MonthSheetProps` mirroring the CalendarSheet modal + sibling-scrim + radio-row precedent; descending YYYY-MM list from `dayjs(maxMonth).subtract(i, 'month')`, labels via `monthLabel()`, tokens only, Pressable only
- `src/app/export.tsx` (rewritten): scope switcher (Worker / Worksite month, deep-link init), active-only memo `FlatList` pickers with `keyExtractor` on id, month trigger + `MonthSheet` (maxMonth = current month, 12 back), CSV/PDF chips defaulting CSV, preview card (tabular-nums row-count line via `summarize()`, up to 5 HistoryRow-language sample rows, 4-dot STATUS legend on PDF), zero-rows CTA disable + calm line, skeleton/error/not-found states, `exporting` re-entry guard, CSV via `writeTextFile`, PDF via `printHtmlToPdf` + `copyBinaryFile` + best-effort temp delete, partials deleted on failure with destructive retry text, success card (Saved to Downloads + slug filename + Share file + Export another), `resetExport()` preserving picks
- Web best-effort: `Platform.OS === 'web'` CSV branch downloads via Blob object-URL anchor named exactly the slug filename with `revokeObjectURL` cleanup; `shareFile` `'unavailable'` stays on the success card with no state change; web PDF reaches the helper's catchable `pdf-unsupported` throw
- `npx tsc --noEmit` exit 0; NATIVE_OK + DISCIPLINE_OK + SCREEN_OK + WEB_OK + REGRESS_OK all print OK

## Task Commits

Each task was committed atomically:

1. **Task 1: month-grid sheet component** - `ed5f7c3` (feat)
2. **Task 2: export screen state, load, pickers, preview, native export, success card** - `67b8806` (feat)
3. **Task 3: web CSV download branch + share-unavailable handling** - `1b4f6f0` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/components/month-sheet.tsx` - Month-grid picker reusing CalendarSheet modal precedent (new, 101 lines)
- `src/app/export.tsx` - Single export drill-down: scope switcher, pickers, preview, CTA, success card (rewritten, ~1000 lines)

## Decisions Made

- Register worker list is site-scoped (`listWorkers({ worksiteId: siteId })`), not all-workers: a monthly register is per-site by definition (EX-02). `includeInactive: true` is added only when the deep-linked site itself is inactive, so removed workers of a removed site stay exportable (D-11). Rationale: plan STEP 2 names the active/inactive axis but a cross-site register would be wrong data.
- Success card is keyed per scope+format (`savedScope`/`savedFormat` alongside `savedName`/`savedUri`): switching scope shows that scope's preview instead of another scope's card, and switching back reveals the card untouched. Rationale: reconciles plan STEP 5 (single success card) with the UI-SPEC interaction contract (each scope owns its own preview/success state).
- Worker samples show the newest 5 (last-5 reversed, matching the profile history order); register samples show the first 5 of date-then-name order. Rationale: history reads newest-first; register reads chronologically.
- `handleShare` captures the `shareFile` result explicitly and returns on `'unavailable'` with no state change (dismiss changes nothing per D-13). Rationale: makes the D-15 web contract visible at the call site instead of relying on an ignored promise.

## Deviations from Plan

None - plan executed exactly as written. (Two judgment calls above are documented under Decisions Made; both stay within plan constraints and add no new files or deps.)

## Issues Encountered

- PowerShell has no `head` binary and mangles inline `node -e` quoting (same as 06-01): ran `npx tsc --noEmit` bare with `$LASTEXITCODE` and the plan's `node -e` assertions from temp `.cjs` files — all print OK.
- `npx tsc` emits npm-notice noise on stdout; the exit code is the real signal (`TSC_EXIT=0`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 06-03 entry points (Reports rows + worker-profile Export action pushing `?workerId=` / `?worksiteId=&month=`) can land directly: this screen already normalizes, validates, and clamps all three params with tampered-id not-found boundaries.
- On-device proofs remain Phase 9 debt (no dev build): Downloads save, Excel/Sheets column-count probe, second-device share transfer, PDF viewer open.
- Threat register T-06-05..T-06-08 mitigations are implemented in the screen: display-string params + getWorker/getWorksite null → not-found (zero SQL interpolation), file bytes from preview state only, month regex + clamp, `exporting` guard reset in `finally`, partials deleted via `deleteFile`.

---

*Phase: 06-export*
*Completed: 2026-10-09*

## Self-Check: PASSED

- FOUND: src/components/month-sheet.tsx, src/app/export.tsx
- FOUND: ed5f7c3, 67b8806, 1b4f6f0 (`git log --oneline` contains all three)
- `npx tsc --noEmit` → exit 0; check scripts → NATIVE_OK, DISCIPLINE_OK, SCREEN_OK, WEB_OK, REGRESS_OK
