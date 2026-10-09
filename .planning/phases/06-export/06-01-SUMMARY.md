---
phase: 06-export
plan: 01
subsystem: export
tags: [csv, rfc-4180, pdf, expo-print, expo-file-system, expo-sharing, serializers]

# Dependency graph
requires:
  - phase: 04-worker-profile-history
    provides: pure summarize() + ATTENDANCE_PCT_FLOOR reused for PDF footer summaries
  - phase: 01-foundation
    provides: STATUS/CYCLE contract, formatDisplay local date keys, expo-file-system/print/sharing deps
provides:
  - Pure CSV/PDF serializers (src/utils/export.ts) with RFC-4180 quoting + slug filenames
  - Importable file write/share/delete helpers (src/utils/files.ts) for Phase 7 Backup reuse
  - Standing RFC-4180 probe self-check (scripts/verify-export.mjs)
affects: [06-export screens, 07-backup]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure serializers with zero runtime @/db imports, Downloads-first file I/O with loud throws, inline-probe verify scripts]

key-files:
  created: [src/utils/export.ts, src/utils/files.ts, scripts/verify-export.mjs]
  modified: []

key-decisions:
  - "Formula guard keys off the ORIGINAL field so quoted formula cells still get the single-quote prefix"
  - "SAF createFileAsync uses the granted directoryUri (user may pick a different folder than Downloads)"
  - "verify-export.mjs checks statically + probes inline (plain node cannot resolve @/ aliases without a build step)"

patterns-established:
  - "Pure serializer contract: entries in, strings out; type-only @/db/types import allowed (erased at compile)"
  - "File helpers throw downloads-unavailable / pdf-unsupported instead of silent fallbacks; deleteFile never throws"

requirements-completed: [EX-01, EX-02, NF-06]

# Metrics
duration: 20min
completed: 2026-10-09
---

# Phase 6 Plan 1: Export Serializers + File Helpers Summary

**RFC-4180 CSV serializers with formula-injection guard, theme-driven PDF HTML with STATUS legend + summarize() footer, and Downloads-first file write/share helpers — all gates green**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-09T06:55:00Z
- **Completed:** 2026-10-09T06:57:15Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `src/utils/export.ts`: all 12 serializer exports — RFC-4180 `escapeCsvField` (quote-wrap + doubled quotes, `= + - @` guard with length-1 `-` exemption), `buildWorkerCsv`/`buildRegisterCsv` (exact headers, lowercase keys, `-` notes, CRLF, sorted), `slugify` + slug filenames, `monthRange`/`monthLabel`, `escapeHtml`, theme-driven `buildWorkerPdfHtml`/`buildRegisterPdfHtml` (title, headers, rows, `footerSummary()` line, 4-STATUS legend), `footerSummary()` reusing `summarize()`
- `src/utils/files.ts`: all 5 helpers — `writeTextFile` (SAF Downloads on Android, `documentDirectory` elsewhere, deletes partials + throws), `printHtmlToPdf` (`pdf-unsupported` on web), `shareFile` (`isAvailableAsync` gate), `deleteFile` (never throws), `copyBinaryFile` (binary-safe `copyAsync` with `moveAsync` fallback)
- `scripts/verify-export.mjs`: prints `EXPORT_VERIFY_OK`, exit 0 — 12 exports, zero runtime `@/db` imports, headers, dash/emdash cells, raw-key CSV body, inline RFC-4180 probe (roadmap note round-trips), inline slug probe (`St Mary's Site 2` → `st-mary-s-site-2`, traversal stripped)
- `npx tsc --noEmit` exit 0; `package.json` untouched (no new dependencies)

## Task Commits

Each task was committed atomically:

1. **Task 1: pure CSV/PDF serializers in src/utils/export.ts** - `a5fe965` (feat)
2. **Task 2: importable file write/share helpers in src/utils/files.ts** - `0cf58df` (feat)
3. **Task 3: RFC-4180 probe self-check script** - `002585b` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/utils/export.ts` - Pure CSV/PDF serializers, slug, filenames, month helpers, HTML escaping (new, 288 lines)
- `src/utils/files.ts` - Importable file write/share/delete helpers for Phase 6 + 7 reuse (new, 146 lines)
- `scripts/verify-export.mjs` - Standing RFC-4180 probe + contract self-check (new, 109 lines)

## Decisions Made

- Formula-injection guard keys off the ORIGINAL field's first char (not the quoted output's), so a formula cell that also needs quoting still gets the `'` prefix outside the quotes. Rationale: quoting first would hide the `=`/`+`/`-`/`@` behind the opening `"`.
- `createFileAsync` uses the granted `permission.directoryUri` rather than the pre-permission Downloads uri. Rationale: the user may pick a different folder in the SAF picker; the granted uri is the actually-writable one.
- `verify-export.mjs` asserts statically + probes inline instead of importing `export.ts`. Rationale: plain node cannot resolve `@/` aliases or strip types-with-aliases without a build step; the plan's task 3 action prescribes the inline probe approach.
- Empty-string notes map to `-` alongside `null`. Rationale: blank→null convention means empty is missing; keeps D-18 exact under all caller inputs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Legend row colspan hardcoded to 3 breaks the 4-column register table**
- **Found during:** task 1 (PDF builders)
- **Issue:** A shared `legendRow()` emitting `colspan="3"` is correct for the worker table but leaves the worksite-month register table (4 columns) with a short legend row.
- **Fix:** `legendRow(theme, columns)` takes the column count from `headerCells.length` in `pdfShell()`.
- **Files modified:** src/utils/export.ts
- **Verification:** `npx tsc --noEmit` exit 0; both builders pass their own header arrays
- **Committed in:** a5fe965 (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for register-PDF correctness. No scope creep.

## Issues Encountered

- PowerShell mangles inline `node -e` quoting (plan acceptance one-liners fail to parse, not a code issue). Ran the identical assertions from temp `.cjs` files instead — all three acceptance triples print OK.
- `npx tsc` emits npm-notice noise on stderr that PowerShell surfaces as `RemoteException`; exit code is the real signal (`TSC_EXIT=0`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Export screens (worker scope, worksite-month scope, share flow) can build directly on `buildWorkerCsv`/`buildRegisterCsv` + `buildWorkerPdfHtml`/`buildRegisterPdfHtml` + the five file helpers; preview counts and file bytes come from the same DAO scope per D-21.
- Phase 7 Backup reuses `writeTextFile`/`shareFile`/`deleteFile` as planned — no screen-local file I/O to untangle.
- Deferred verification debt (unchanged): on-device Excel/Sheets open + second-device transfer remain Phase 9 proofs (no dev build in this environment).

---
*Phase: 06-export*
*Completed: 2026-10-09*

## Self-Check: PASSED

- FOUND: src/utils/export.ts, src/utils/files.ts, scripts/verify-export.mjs
- FOUND: a5fe965, 0cf58df, 002585b (`git log --oneline` contains all three)
- `node scripts/verify-export.mjs` → EXPORT_VERIFY_OK, exit 0; `npx tsc --noEmit` → exit 0
