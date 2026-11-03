---
status: investigating
trigger: "hey i am getting the 'couldn't export - try again' getting again while exporting pdf"
---

## Current Focus

hypothesis: CONFIRMED-LEANING — the failing build carries pre-fix JS. PDF export succeeds in another build of the same source, and the only build artifact on this machine (debug APK) predates commit 850a877 "pdf issue solved" (the Android base64/SAF fix in copyBinaryFile) by 12 minutes. Nothing in the shared JS path can throw except the print/persist I/O, which 850a877 changed.
test: Rebuild the failing target from HEAD (release/AAB/static web embeds JS; debug builds need Metro running), then re-export PDF.
expecting: PDF saves to Downloads with no error. If it still fails, the new `[export] failed <platform> <format> <error>` console line identifies the exact throwing step.
next_action: user rebuilds failing build from HEAD and retries; capture the new console.warn line if it recurs

## Symptoms

expected: PDF file downloads successfully to Downloads folder
actual: Gets 'Couldn't export - try again' error repeatedly; PDF export works fine in another build
errors: Couldn't export - try again
timeline: Started during recent UAT testing
reproduction: Tap export CTA with PDF format selected

## Evidence

- timestamp: 2026-10-20T10:00:00Z
  checked: src/app/export.tsx handleExport (381-524) + src/utils/export.ts builders (pdfShell 190-216, buildWorkerPdfHtml 224-254, buildRegisterPdfHtml 261-293)
  found: The catch at 512-519 is the ONLY producer of "Couldn't export — try again". Builders contain no throw sites: STATUS lookups fall back (`STATUS[x] ?? {...}`), escapeHtml only receives theme tokens and DB strings, footerSummary -> summarize is a total switch, formatDisplay uses dayjs.format (no throw).
  implication: The message can only come from a real I/O/native failure inside printHtmlToPdf or copyBinaryFile — or from the web print branch — not from serialization.

- timestamp: 2026-10-20T10:05:00Z
  checked: theme tokens (src/constants/theme.ts, src/hooks/use-theme.ts) consumed by PdfTheme
  found: background/surface/foreground/mutedForeground/border/primary all defined for light and dark; useTheme normalizes 'unspecified' to light.
  implication: Eliminated: undefined theme token causing escapeHtml(undefined).replace TypeError.

- timestamp: 2026-10-20T10:10:00Z
  checked: expo-print presence in the built APK (android/app/build/outputs/apk/debug/app-debug.apk -> classes8.dex)
  found: `expo.modules.print` string present in classes8.dex, as is `expo.modules.filesystem`.
  implication: Eliminated: missing native expo-print module causing UnavailabilityError on printToFileAsync.

- timestamp: 2026-10-20T10:15:00Z
  checked: node_modules/expo-file-system legacy runtime surface (src/legacy/index.ts, FileSystem.ts, FileSystem.types.ts) and native FileSystemLegacyModule.kt
  found: EncodingType is a real runtime enum (UTF8='utf8', BASE64='base64'); SAF writeAsStringAsync decodes base64 then writes via contentResolver.openOutputStream (lines 193-206, 1061-1065); createFileAsync -> createSAFFileAsync (441-456). Base64 SAF binary write path is genuinely implemented.
  implication: Eliminated: EncodingType missing at runtime, and eliminated "SAF cannot accept binary writes".

- timestamp: 2026-10-20T10:20:00Z
  checked: android APK timestamp vs git history
  found: only APK on disk = 2026-10-15 01:10:51; commit 850a877 "pdf issue solved" (which replaced copyAsync-to-content:// with the base64 SAF write in copyBinaryFile) was authored 2026-10-15 01:22:09 — i.e. 12 minutes AFTER that APK was produced. HEAD is 2026-10-20.
  implication: The available device build predates the Android PDF fix. Any build with embedded JS (release APK, or a debug APK launched without Metro on the old bundle) would still run the broken copyAsync path.

- timestamp: 2026-10-20T10:22:00Z
  checked: prior session .planning/debug/after-phase-6-i-am-phasing-an.md (same trigger, resolved 2026-10-13) and commit 850a877 diff
  found: Same failure was root-caused to copyBinaryFile using copyAsync/moveAsync into a SAF content:// Downloads uri (native toFile() only resolves file://). Fix = Android-only base64 read + StorageAccessFramework.writeAsStringAsync. Session verification was "on-device verification pending user".
  implication: The present report is most likely that fix never reaching the device, or a second build still carrying pre-fix code.

- timestamp: 2026-10-20T10:35:00Z
  checked: user statement "it works fine in other build" + build artifacts on this machine (android/app/build/outputs/apk/debug/app-debug.apk, no dist/, no release/aab, no embedded index.android.bundle)
  found: Only one artifact exists and it is a debug APK with NO embedded JS bundle (assets holds only app.config) — a debug build always runs live Metro JS, so it cannot be stale. Any build that embeds JS (release APK/AAB, `expo export` static web) would carry whatever source existed when it was produced, and the only local APK predates the 850a877 PDF fix by 12 minutes.
  implication: "Works in other build / fails in this build" is explained by the failing build being an embedded-JS artifact built before 850a877 (or from another checkout). Working build = rebuilt/current source; failing build = pre-fix bundle.

- timestamp: 2026-10-20T10:40:00Z
  checked: src/app/export.tsx catch block (512-519) after change
  found: The catch now logs `[export] failed <platform> <format> <error name: message>` via console.warn before setting the generic copy. Error copy unchanged (no copy-lock violation); tsc --noEmit exit 0.
  implication: If a freshly built app still fails, Metro/logcat will name the throwing step instead of forcing another static-guess cycle.

## Eliminated

- hypothesis: PDF serializer / builder throws on certain data (status key, note, date)
  evidence: builders have no throw sites; STATUS fallback exists; summarize is exhaustive; dayjs.format never throws.
  timestamp: 2026-10-20T10:00:00Z
- hypothesis: undefined theme token crashes escapeHtml during PDF build
  evidence: all six PdfTheme tokens exist in both schemes; useTheme normalizes 'unspecified'.
  timestamp: 2026-10-20T10:05:00Z
- hypothesis: expo-print native module missing from the build
  evidence: expo.modules.print present in classes8.dex of the debug APK.
  timestamp: 2026-10-20T10:10:00Z
- hypothesis: EncodingType not exported at runtime from expo-file-system/legacy
  evidence: it is a runtime enum in src/legacy/FileSystem.types.ts and re-exported by src/legacy/index.ts.
  timestamp: 2026-10-20T10:15:00Z
- hypothesis: old "web PDF unsupported" root cause (session export-pdf-empty-csv)
  evidence: handleExport now has web PDF branches at 432-445 and 485-498 calling openWebPrintHtml; pdf-unsupported is unreachable on web.
  timestamp: 2026-10-20T10:18:00Z

## Resolution

root_cause: 
fix: 
verification: 
files_changed:
