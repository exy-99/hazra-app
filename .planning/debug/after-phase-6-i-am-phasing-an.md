---
status: resolved
trigger: "after phase 6 i am phasing an issue , when ever i export pdf i am getting 'try again error ' and when ever i click try again i get the sam error"
created: 2026-10-13T00:00:00Z
updated: 2026-10-13T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: "CONFIRMED — copyBinaryFile copyAsync/moveAsync to Android SAF content:// destination always throws (native toFile() only resolves file://); fix applied via base64 SAF write."
test: "npx tsc --noEmit clean; on-device PDF export pending user verification"
expecting: "Export PDF saves to Downloads on Android; try-again loop gone"
next_action: "user verifies on Android dev build"

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: "Tapping Export PDF should produce a PDF file download/share with attendance data"
actual: "Red error card with Try again button; tapping Try again gives the same error in a loop"
errors: "Couldn't export - try again (persistent, retry does not clear)"
reproduction: "Export tab on Android > tap Export PDF (same worksite+month as CSV)"
started: "Never worked - broken since Phase 6 export was built, not a regression"
platform: "Android"
scope: "Export PDF only (CSV naming works per prior session)"

## Platform / Scope (from symptom gathering)
- Platform: Android
- Screen: Export tab (src/app/(tabs)/export.tsx presumed)
- Element: Export PDF button + error card Try again button

## Evidence
<!-- APPEND only - timestamped facts -->

- timestamp: 2026-10-13T00:00:00Z
  checked: src/app/export.tsx native PDF path (lines 446-453, 499-506) + src/utils/files.ts copyBinaryFile (lines 157-174)
  found: Android PDF = printHtmlToPdf (expo-print, file:// cache uri) then copyBinaryFile(tempUri, filename) where createDownloadsFile returns a SAF content:// uri; CSV path uses SAF-aware writeAsStringAsync and works — divergence isolated to the binary persist step
  implication: Failure is Android-PDF-specific, data-independent (matches "never worked since Phase 6")
- timestamp: 2026-10-13T00:00:00Z
  checked: node_modules/expo-file-system FileSystemLegacyModule.kt copyAsync (lines 278-337) / moveAsync (lines 247-276)
  found: from=file:// branch calls toUri.toFile() which only resolves file:// destinations — a SAF content:// dest throws; moveAsync fallback renameTo fails the same way. Both throw deterministically into handleExport catch (export.tsx:512-519) which sets generic "Couldn't export — try again"; retry is byte-identical so the loop never clears
  implication: ROOT CAUSE CONFIRMED at native level — distinct from prior web-only session (web PDF branches now exist via openWebPrintHtml, export.tsx:432-445/485-498)
- timestamp: 2026-10-13T00:00:00Z
  checked: FileSystemLegacyModule.kt writeAsStringAsync (lines 193-206) + legacy type surface
  found: Native write decodes Base64 before writing and getOutputStream supports SAF uris; EncodingType exported from expo-file-system/legacy (src/legacy/index re-exports FileSystem.types)
  implication: Base64 read + SAF writeAsStringAsync round-trip is the valid binary persist path; fix applied, npx tsc --noEmit clean

## Eliminated
<!-- APPEND only - prevents re-investigating -->

(empty)

## Resolution
<!-- Filled when root cause found -->

root_cause: "Android-only: copyBinaryFile persisted the expo-print PDF via copyAsync/moveAsync into a SAF content:// Downloads uri, whose native implementation only resolves file:// destinations (toFile() throws) — every PDF save threw into the generic try-again catch while CSV (SAF-aware text write) kept working."
fix: "src/utils/files.ts copyBinaryFile now branches on Android: reads the print artifact as base64 and writes it via StorageAccessFramework.writeAsStringAsync (base64), the documented SAF binary path; other platforms keep copy/move."
verification: "npx tsc --noEmit clean; on-device Android export verification pending user"
files_changed: "src/utils/files.ts"
