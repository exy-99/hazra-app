---
status: resolved
trigger: "whenever i export the file pdf and csv , the date apper \"#######\" like this and not an actual date ."
created: 2026-11-05T00:00:00Z
updated: 2026-11-06T00:25:00Z
---

## Current Focus

hypothesis: "CONFIRMED and human-verified — the CSV hashes came from Excel coercing dashed ISO dates into too-narrow date columns, and the earlier exact-date fix was bypassed because Export still opened on CSV. A fresh Export screen now defaults to XLSX, whose cells preserve YYYY/MM/DD and their width."
test: "Completed — user fully reloaded the app, opened Export fresh, and created a new export after the XLSX default change."
expecting: "New .xlsx date cell shows 2026/10/01 with no hashes or clipping."
next_action: "None — session resolved."

## Symptoms

expected: "PDF and CSV exports show the real date in a readable date format."
actual: "The export completes, but the date appears as ####### in both PDF and CSV files."
errors: "None reported; both exports complete."
reproduction: "Create a PDF or CSV export in the app, open the generated file, and inspect the date."
started: "Always happened; no known working version."

## Eliminated

- hypothesis: "H1: The shared serializer writes hashes or corrupts the date before file I/O."
  evidence: "node scripts/verify-export.mjs passed against the real staged TypeScript module. It asserts worker CSV row 2026-10-05,present,-, register CSV rows containing 2026-10-05 through 2026-10-07, and register PDF HTML retaining those exact ISO dates. Source search found no hash-run producer."
  timestamp: 2026-11-05T10:07:06.387Z
- hypothesis: "H4a: Reusing formatDisplay (DD MMM YYYY) in CSV will make Excel choose a short date format that always fits its default width."
  evidence: "Excel displayed 1-Jan-26 and 9-Sep-26, but rendered 10 Sep 2026, 28 Sep 2026, and 31 Dec 2026 as ######## at the same untouched 8.11 width. Double-digit days make d-mmm-yy too wide."
  timestamp: 2026-11-05T10:18:26.200Z
- hypothesis: "H5: Exact visible 2026/10/02 can be preserved in the existing CSV shape with quoting or an invisible text marker and still fit Excel's untouched date column."
  evidence: "Bare and quoted slash dates became serial 46297 and displayed ########. Tab/zero-width/NBSP/text-marker variants avoided coercion but rasterized Excel output clipped the ten-character value to 2026/10/0 beside the occupied next cell; Unicode slash variants clipped too."
  timestamp: 2026-11-05T12:41:53.625Z
- hypothesis: "H6: A `sep=,` CSV directive makes Excel auto-size or otherwise preserve exact slash dates without hashes."
  evidence: "Excel consumed the directive, but the date column remained width 8.11; 2026/10/02 and 2026/10/31 were coerced to m/d/yyyy serials and both displayed ########."
  timestamp: 2026-11-05T12:43:25.537Z

## Evidence

- timestamp: 2026-11-05T10:04:55.828Z
  checked: "Debug knowledge base keyword overlap for actual='date appears as #######' and errors='none; PDF/CSV export completes'."
  found: "Matched i-want-to-change-the-schme-of on PDF export, CSV export, and date columns. That session recently changed both formats to a shared attendance matrix in src/utils/export.ts and src/app/export.tsx."
  implication: "The recent shared matrix path is the first candidate to inspect, but its prior root cause does not itself explain hashes and remains unconfirmed."
- timestamp: 2026-11-05T10:05:38.275Z
  checked: "Project skill directories, export symbol search, package manifest, and git state."
  found: "No .claude/skills or .agents/skills exist. Expo is 58.0.23 with expo-print 58.0.8. Both export formats route through src/utils/export.ts, with orchestration in src/app/export.tsx and native PDF rendering in src/utils/files.ts. src/utils/export.ts and scripts/verify-export.mjs already contain uncommitted changes."
  implication: "Investigation must trace the shared serializer first and preserve the pre-existing uncommitted work; Expo 58 docs are mandatory before changing any Expo API."
- timestamp: 2026-11-05T10:06:25.945Z
  checked: "Complete export serializer, export screen, file helpers, verifier, literal-hash search, and current diff."
  found: "No export code emits hash runs. Worker CSV writes entry.date verbatim; register CSV writes row.date verbatim. Worker PDF formats the date with formatDisplay; register PDF renders a numeric day and weekday while retaining the full ISO date only in data-date attributes. The current uncommitted diff transposes the worksite matrix from 31 date columns to date rows/worker columns and updates its verifier."
  implication: "Source inspection favors a viewer/layout explanation, but H1 must be eliminated with runtime output. The uncommitted transpose is pre-existing work and will not be overwritten or attributed to this fix."
- timestamp: 2026-11-05T10:07:06.387Z
  checked: "Runtime serializer verification via node scripts/verify-export.mjs."
  found: "EXPORT_VERIFY_OK. The real module emitted and retained exact 2026-10 ISO dates in worker CSV, register CSV, and register PDF HTML; no hash substitution occurred."
  implication: "Date corruption inside serialization is eliminated. The divergence occurs after valid output reaches the viewer/rendering layer."
- timestamp: 2026-11-05T10:09:30.072Z
  checked: "Excel COM display of a serializer-equivalent UTF-8 BOM CSV at default width and after changing only the date column width."
  found: "At default ColumnWidth 8.11, A2 had Value2=46300, NumberFormat=m/d/yyyy, but Text=########. After setting ColumnWidth=20, the same Value2 remained 46300 and Text became 10/5/2026."
  implication: "H2 is causally confirmed: Excel converts the valid ISO field to a date serial and masks it with hashes solely because CSV cannot carry column widths. Widening presentation alone reveals the intact date."
- timestamp: 2026-11-05T10:14:45.761Z
  checked: "Differential PDF reproduction: Excel ExportAsFixedFormat of the CSV versus Chrome headless printing of HTML produced by the real buildWorkerPdfHtml/buildRegisterPdfHtml functions."
  found: "Excel's PDF text contained ######## for both date rows. The real worker app PDF text contained 05 Oct 2026; the real register app PDF contained 05/Mon and 06/Tue under the October 2026 subtitle. Neither app PDF contained hashes."
  implication: "H3 is supported. Hashes in a PDF are reproducible only when the spreadsheet view is printed/exported; the app's direct PDF path renders readable date text. The shared actionable defect is CSV allowing spreadsheet date coercion."
- timestamp: 2026-11-05T10:18:26.200Z
  checked: "Phase 6 export contracts and an Excel candidate-encoding matrix."
  found: "The locked CSV contract requires simple spreadsheet-ready columns and machine-readable lowercase statuses, but does not lock a dashed date rendering; direct PDFs explicitly use formatDisplay. Excel kept apostrophes visible, while bare ISO dates became hashes. DD MMM YYYY appeared to work only for single-digit days and failed for double-digit days. Eight-digit 20261005 remained fully visible as General in the initial candidate matrix."
  implication: "Invisible-marker/apostrophe tricks either leak into data or still exceed the fixed width, and display-format dates are not stable across all days. Basic ISO YYYYMMDD is the only tested portable candidate that is unambiguous, short enough, dependency-free, and consistent with existing filename dates."
- timestamp: 2026-11-05T10:19:23.355Z
  checked: "Excel boundary probe and Excel ExportAsFixedFormat for YYYYMMDD values 20260101, 20260909, 20260910, 20260928, and 20261231."
  found: "Every cell retained NumberFormat=General and displayed its full eight-digit value at untouched ColumnWidth=8.11. The exported PDF contained every full date and no hashes."
  implication: "H4b is confirmed across single/double-digit days and month boundaries. A CSV-only basic-ISO transform directly removes the causal coercion/width mechanism."
- timestamp: 2026-11-05T10:20:17.583Z
  checked: "Pre-fix compact-date regression in scripts/verify-export.mjs."
  found: "The probe failed red at the first worker row: actual 2026-10-05,present,- versus expected 20261005,present,-. Production code had not yet been changed."
  implication: "The regression directly reproduces the causal serialization boundary and can prove the minimal fix turns red to green."
- timestamp: 2026-11-05T10:21:03.310Z
  checked: "Minimal production edit."
  found: "Added one private csvDate formatter that removes hyphens and routed only worker/register CSV date fields through it. Database date keys, sorting, filenames, and both PDF builders remain unchanged."
  implication: "The change targets the confirmed CSV rendering mechanism at one shared serialization boundary without changing Expo/file I/O or direct PDF behavior."
- timestamp: 2026-11-05T10:21:42.488Z
  checked: "First post-fix real-module verification run."
  found: "The new compact worker-row assertion passed, then the probe failed at its older sorting check because that check still searched the CSV output for dashed 2026-10-05/06 strings."
  implication: "Production output reached the expected compact format; the failure is a stale test needle caused by the intentional representation change, not a sorting or fix failure."
- timestamp: 2026-11-05T10:23:18.109Z
  checked: "Corrected post-fix real-module serializer probe."
  found: "node scripts/verify-export.mjs printed EXPORT_VERIFY_OK. Worker and register CSV dates are compact, sorting remains ascending, full-month endpoints are 20261001/20261031, and existing CSV/PDF security and matrix checks pass."
  implication: "The red regression is green with the minimal serializer change; continue with type and adjacent regression gates."
- timestamp: 2026-11-05T10:24:12.944Z
  checked: "Strict typecheck and adjacent standing gates."
  found: "npx tsc --noEmit exited 0; verify-date-utils printed date utils ok; verify-summarize printed summarize ok; verify-status-contract printed status contract ok. Only pre-existing Node module-type performance warnings appeared in the standalone scripts."
  implication: "The CSV-boundary change is type-safe and did not regress local date math, attendance summaries, or status contracts."
- timestamp: 2026-11-05T10:26:37.577Z
  checked: "Exact post-fix worker/register artifacts generated by the real staged serializer, opened in Excel at untouched width, then exported by Excel to PDF."
  found: "Worker CSV had 3/3 date cells as General text 20260909..20261231 at width 8.11; register CSV had 31/31 dates 20261001..20261031 at width 8.11. Both Excel PDFs had zero hash runs and retained all 3/31 eight-digit dates."
  implication: "The original CSV-to-spreadsheet-to-PDF reproduction now passes against actual fixed serializer output, including double-digit days and a full 31-day month."
- timestamp: 2026-11-05T10:27:18.616Z
  checked: "First post-fix Chrome PDF command."
  found: "No PDF was created because the PowerShell hashtable property was not expanded into the --print-to-pdf argument; Chrome produced no app output or failure evidence."
  implication: "This is an invalid verification harness invocation, not a product failure; rerun with the explicit argument string."
- timestamp: 2026-11-05T12:14:15.878Z
  checked: "Corrected headless-Chrome PDFs from post-fix HTML generated by the real worker/register app builders."
  found: "Worker PDF contained 09 Sep 2026, 10 Sep 2026, and 31 Dec 2026; register PDF contained day/weekday rows under October 2026. Both extracted texts had zero hash runs."
  implication: "Direct app PDF rendering remains readable and unchanged; the CSV-only fix removes the spreadsheet/printed-sheet hashes without regressing the separate app PDF path."
- timestamp: 2026-11-05T12:15:03.694Z
  checked: "Final diff/status/cleanup review."
  found: "git diff --check exited 0; no scripts/.tmp-debug-* directory remains. The existing uncommitted worksite-matrix transpose and unrelated cant-see-app-logo debug file remain preserved. This session's functional delta is limited to compact CSV date serialization plus matching worker/register regression assertions."
  implication: "Self-verification is complete without overwriting or claiming pre-existing user work; only real-device/mobile-viewer confirmation remains."
- timestamp: 2026-11-05T12:38:05.339Z
  checked: "Human verification checkpoint response."
  found: "The hash fix works in the user's real workflow, but the compact value 20261002 is not the desired presentation; the requested output is 2026/10/02."
  implication: "Root-cause mitigation is validated, but the fix is not accepted until slash formatting is provided without reintroducing the original hash defect."
- timestamp: 2026-11-05T12:39:53.632Z
  checked: "First exact-slash candidate probe invocation."
  found: "PowerShell rejected the harness before creating/opening any artifact because `foreach($o in@(...))` lacked required whitespace."
  implication: "No candidate behavior was measured; correct the harness syntax and rerun."
- timestamp: 2026-11-05T12:41:53.625Z
  checked: "Corrected Excel exact-slash candidate matrix plus rasterized Excel PDF."
  found: "Bare and CSV-quoted 2026/10/02 were auto-coerced to m/d/yyyy and displayed ######## at width 8.11. All tested text-preserving markers avoided hashes, but the raster showed only 2026/10/0 before the occupied next cell; fullwidth/fraction slash variants also clipped."
  implication: "The requested ten visible characters physically exceed Excel's default CSV column. CSV stores values only and cannot encode a wider column, so no safe serializer spelling can guarantee both exact 2026/10/02 and no hashes/clipping in the existing layout."
- timestamp: 2026-11-05T12:42:34.917Z
  checked: "Interactive tradeoff question attempt."
  found: "The execution environment rejected the question as non-interactive, so no user choice can be collected in this run."
  implication: "Continue autonomously: exhaust the only plausible dependency-free CSV directive, then prefer the already user-confirmed no-hash behavior over a regression."
- timestamp: 2026-11-05T12:43:25.537Z
  checked: "Excel `sep=,` directive probe with exact slash dates."
  found: "The directive was hidden as intended and rows parsed correctly, but ColumnWidth stayed 8.11; both slash dates became Excel date serials with m/d/yyyy and displayed ########."
  implication: "No standard CSV mechanism remains that can encode the required width. Exact slash display and no hashes can coexist only with manual viewer widening or a width-aware format such as XLSX."
- timestamp: 2026-11-05T12:46:21.284Z
  checked: "Decision checkpoint response."
  found: "User selected A — add XLSX export."
  implication: "Implement a width-aware spreadsheet artifact while preserving the already verified CSV and direct PDF paths."
- timestamp: 2026-11-05T12:48:01.097Z
  checked: "Official SheetJS React Native/install/write/column-width docs and Expo SDK 58 FileSystem + legacy docs; current manifest/lock."
  found: "No spreadsheet writer is installed. SheetJS says npm registry xlsx 0.18.5 is stale and its authoritative React Native build is CDN 0.20.3. It supports AOA worksheets, Base64 XLSX output, and `!cols` widths when `cellStyles:true`. Its React Native guide explicitly lists expo-file-system and Base64. Expo 58 legacy writeAsStringAsync supports Base64 for file:// and existing SAF files."
  implication: "One pure-JS dependency plus a small Base64 Downloads helper is sufficient; no native module, config plugin, or development-build change is required."
- timestamp: 2026-11-05T12:48:51.219Z
  checked: "First Expo CLI install of the authoritative remote tarball and resulting manifest diff."
  found: "The environment blocks remote tarball dependencies with npm EALLOWREMOTE. Expo CLI also left a bogus package.json key named `undefined`; package-lock and node_modules were unchanged."
  implication: "Clean the partial manifest edit and follow SheetJS's documented vendoring path, installing the same official tarball locally through Expo CLI."
- timestamp: 2026-11-05T12:51:08.754Z
  checked: "Vendored tarball inspection and unnamed local-tarball Expo install."
  found: "Official tarball verified as xlsx 0.20.3, Apache-2.0, SHA256 8DC73FC3B00203E72D176E85B50938627C7B086E607C682E8D3C22C02BB99FE8. The unnamed local install succeeded but again used dependency key/node_modules path `undefined`, so `require('xlsx')` failed. npm audit findings contain only existing Expo CLI glob/minimatch chains, not xlsx."
  implication: "The artifact is valid; only package naming is wrong. Reinstall with the explicit package alias syntax documented by SheetJS."
- timestamp: 2026-11-05T12:53:06.969Z
  checked: "Explicitly named local-tarball Expo install and runtime smoke probe."
  found: "package.json/package-lock now record xlsx=file:vendor/xlsx-0.20.3.tgz; npm ls reports xlsx@0.20.3; both CommonJS and ESM imports expose write/read/AOA APIs. A standalone round-trip preserved text 2026/10/02 and `!cols[0].wch=12`."
  implication: "Dependency and width serialization are proven; proceed test-first against the app's real builders."
- timestamp: 2026-11-05T12:55:00.881Z
  checked: "Pre-fix real-module XLSX regression in scripts/verify-export.mjs."
  found: "The probe failed red at `missing export: buildWorkerXlsx`; no production XLSX builder or Base64 file helper exists yet."
  implication: "The new behavior is reproducibly absent and the probe can verify both worker/register workbook contents and persisted widths after implementation."
- timestamp: 2026-11-05T12:57:08.109Z
  checked: "Minimal XLSX implementation."
  found: "Added two Base64 SheetJS builders reusing sorted worker data/shared register matrix, exact YYYY/MM/DD text, and wch=12 date columns; added binary-safe Expo Base64 Downloads helper; added XLSX filename/type, web Blob download, native save, share-compatible URI, and a third XLSX format chip. Existing CSV remains compact/no-hash and PDF builders are unchanged."
  implication: "Implementation follows the confirmed boundary and preserves pre-existing matrix work; proceed with the red-to-green workbook probe."
- timestamp: 2026-11-05T13:00:40.012Z
  checked: "Post-implementation real-module export probe."
  found: "node scripts/verify-export.mjs printed EXPORT_VERIFY_OK. Both Base64 artifacts have PK signatures, exact worker/register YYYY/MM/DD cells, complete matrix rows, and persisted date-column widths >=12; all prior CSV/PDF/security checks still pass."
  implication: "The XLSX regression is green; continue with compile and cross-format checks."
- timestamp: 2026-11-05T13:24:11.860Z
  checked: "Strict TypeScript and adjacent standing checks."
  found: "npx tsc --noEmit exited 0; date utils, summarize, and status contract scripts all passed. Only their pre-existing Node module-type performance warnings appeared."
  implication: "The dependency imports, XLSX format union, Base64 helper, and UI branches are type-safe and do not regress shared date/status math."
- timestamp: 2026-11-05T13:25:37.759Z
  checked: "Actual real-builder XLSX files opened by desktop Excel and exported from Excel to PDF."
  found: "Worker workbook showed 3 exact slash dates and register workbook showed all 31 dates, both at ColumnWidth 12.1 with zero hashes. Formula-like notes remained literal text (`HasFormula=false`). Excel-generated PDFs retained 3/31 slash dates with zero hash runs."
  implication: "The user's requested presentation and original no-hash behavior are verified in real XLSX artifacts; remaining risks are Metro/platform integration and device-side save/share."
- timestamp: 2026-11-05T13:30:31.499Z
  checked: "Expo Doctor and all-platform production Metro export."
  found: "Expo Doctor passed 20/20. Android bundled 3903 modules and iOS bundled 3818 modules including the new code. Overall export failed only during web bundling because expo-sqlite/web/worker.ts could not resolve its own wa-sqlite.wasm; the import stack contains no SheetJS or changed export file."
  implication: "Native SheetJS compatibility is supported by successful bundles. Establish independent native exit-zero evidence and classify the web SQLite asset issue before final verification."
- timestamp: 2026-11-05T13:32:14.156Z
  checked: "Independent Android/iOS production exports and installed expo-sqlite files."
  found: "Android export exited 0 with a 7.7 MB Hermes bundle; iOS export exited 0 with a 7.5 MB Hermes bundle. expo-sqlite 58.0.15 does contain wa-sqlite.wasm on disk, confirming the all-platform failure is web Metro asset resolution rather than a missing install or SheetJS module error."
  implication: "Both shipping native targets bundle the XLSX implementation successfully; classify the separate web configuration issue and continue final checks."
- timestamp: 2026-11-05T13:33:15.581Z
  checked: "Repo Metro state, prior debug history, and official Expo SDK 58 SQLite web setup."
  found: "The repo has no metro.config.js. Expo explicitly requires custom Metro WASM asset configuration for SQLite web. A prior resolved share-debug session recorded the same web-export blocker before XLSX work."
  implication: "Web production export is a documented pre-existing project limitation unrelated to this fix; do not broaden scope or overwrite user configuration. Native targets and pure/web-standard XLSX generation remain verifiable."
- timestamp: 2026-11-05T13:35:30.753Z
  checked: "Complete changed-code review plus strengthened export integration probe."
  found: "Worker/register generation, Base64 save/cleanup, web Blob download, format state, filenames, success/share flow, and three format chips are wired for both scopes. The probe now guards UI/helper integration, exact filenames, persisted widths, PK signatures, and formula-like notes remaining non-executable. EXPORT_VERIFY_OK and strict TypeScript both pass."
  implication: "No code-level integration gap was found; proceed to final repository hygiene and human device verification."
- timestamp: 2026-11-05T13:36:46.946Z
  checked: "Final repository gates and hygiene review."
  found: "App-assets, contrast, and tab-shell verifiers passed; xlsx resolves at 0.20.3; git diff --check exited 0; no temporary script staging directory remains. Status contains the intended XLSX files/changes plus the preserved pre-existing matrix diff and unrelated cant-see-app-logo debug file."
  implication: "Automated and desktop-Excel verification is complete without overwriting pre-existing work. Only target-device Android SAF/mobile spreadsheet/share confirmation remains."
- timestamp: 2026-11-06T00:00:00Z
  checked: "Continuation checkpoint after the prior child session became unreachable."
  found: "The user requested completion of the pending corrected direct-app PDF verification and explicitly required preservation of all pre-existing user changes."
  implication: "Resume in verification state, make no speculative production edits, and record direct PDF evidence before returning to human verification."
- timestamp: 2026-11-06T00:01:00Z
  checked: "Complete current export serializer, file helper, export screen, integration verifier, project-skill paths, and repository diff/status."
  found: "Both PDF scopes still route exclusively through buildWorkerPdfHtml/buildRegisterPdfHtml -> printHtmlToPdf -> copyBinaryFile; XLSX is an isolated sibling branch. No project-local skills or leftover PDF/debug harnesses exist. Git still contains the intended uncommitted export work plus the unrelated logo debug session, with no unexpected production changes from this continuation."
  implication: "The pending check should render both real builders and inspect the resulting PDFs; no production correction is indicated by source review."
- timestamp: 2026-11-06T00:02:00Z
  checked: "Available native and local PDF verification tools."
  found: "adb is installed but reports no connected device. Chrome and pdftotext are installed and executable."
  implication: "The native expo-print runtime cannot be exercised in this environment, but the corrected deterministic direct-builder render/text check can run locally for both PDF scopes."
- timestamp: 2026-11-06T00:04:00Z
  checked: "First continued real-builder headless-Chrome verification attempt."
  found: "The temporary Node harness successfully wrote worker.html and register.html from the real TypeScript builders, but the two direct Chrome invocations returned without creating either requested PDF, so the artifact assertion stopped before text extraction."
  implication: "This attempt provides no product failure evidence. The rendering harness must wait for or diagnose Chrome's detached process before the PDF hypothesis can be evaluated."
- timestamp: 2026-11-06T00:05:00Z
  checked: "Failed-attempt directory after Chrome's detached processes had time to finish."
  found: "Both requested worker.pdf and register.pdf appeared at the exact explicit paths alongside their real-builder HTML; Chrome profile output also shows both headless runs started."
  implication: "The prior failure was conclusively a too-early harness assertion, not PDF generation. Reuse the completed artifacts for the actual content test."
- timestamp: 2026-11-06T00:06:00Z
  checked: "First text extraction from both completed direct-builder PDFs."
  found: "Both artifacts passed size and %PDF header checks. Every exact worker date assertion passed; register text contains October 2026 and the first/last day plus weekdays. The run stopped only because the regex required `31` immediately before `Sat`, while pdftotext placed the H/Month end worker-cell text between those two strings in reading order. No hash failure was observed."
  implication: "PDF content supports the hypothesis; correct the extraction-order assertion without changing the generated artifacts or production code."
- timestamp: 2026-11-06T00:07:00Z
  checked: "Corrected automated direct-app PDF artifact assertions."
  found: "DIRECT_APP_PDF_VERIFY_OK. worker.pdf is 46,701 bytes and contains 09 Sep 2026, 10 Sep 2026, and 31 Dec 2026. register.pdf is 87,995 bytes, contains October 2026 and all 31 day lines with the correct 01/Thu and 31/Sat boundaries. Both have valid PDF headers and extracted hash-run count is zero."
  implication: "The app's real PDF serializer/render path remains readable after XLSX integration. A visual PDF pass is the final independent check before cleanup and returning to device verification."
- timestamp: 2026-11-06T00:08:00Z
  checked: "Visual inspection of every page in worker.pdf and register.pdf."
  found: "The worker PDF visibly shows all three full dates (including double-digit day/month boundaries) without clipping or hashes. The two-page register visibly shows DATE rows 01/Thu through 31/Sat, including the final marked row and note, with no hash glyphs or clipped date labels."
  implication: "Direct-app PDF verification is complete through independent text and visual evidence. Only cleanup/regression gates and real-device XLSX save/open/share confirmation remain."
- timestamp: 2026-11-06T00:09:00Z
  checked: "Continuation cleanup and regression gates."
  found: "The temporary direct-PDF harness and approved-temp artifacts were removed. node scripts/verify-export.mjs printed EXPORT_VERIFY_OK, npx tsc --noEmit exited 0, and git diff --check exited 0. A parallel git-status snapshot briefly saw the verifier's own .tmp-verify-export directory while that verifier was still running."
  implication: "Behavior and types remain green; take one serialized post-verifier status snapshot to prove final hygiene rather than treating the expected transient staging directory as residue."
- timestamp: 2026-11-06T00:10:00Z
  checked: "Serialized final repository hygiene inspection."
  found: "No scripts/.tmp-* path remains and git diff --check is clean. Final status contains exactly the intended export/XLSX changes and vendor artifact plus this session and the preserved unrelated cant-see-app-logo debug file; no pre-existing user change was overwritten."
  implication: "Self-verification, cleanup, and preservation checks are complete. Human target-device save/open/share verification is the only remaining resolution gate."
- timestamp: 2026-11-06T00:11:00Z
  checked: "Human verification checkpoint response after XLSX/direct-PDF implementation."
  found: "The user reports that the date still appears like 20261001. They did not identify the selected format, filename extension, export scope, or viewer in this response."
  implication: "The fix is not human-verified. Reopen investigation and distinguish the intentionally compact CSV output from the exact-slash XLSX path, stale deployment, and incorrect artifact wiring before making another change."
- timestamp: 2026-11-06T00:12:00Z
  checked: "Complete current export screen, serializers, file helpers, verifier, source search, and live diff after the failed checkpoint."
  found: "The screen initializes `selectedFormat` to `csv`. That branch calls `csvDate`, which turns 2026-10-01 into 20261001. XLSX is an opt-in sibling chip and its builders turn the same key into the string 2026/10/01 with a persisted width of 12. Worker/register branches, extensions, MIME type, Base64 write, and saved-format state all map consistently. Compact digits also intentionally appear in generated filenames."
  implication: "No XLSX serializer/wiring defect is visible. The user's exact value can be produced by the still-default CSV branch or filename, so the failing artifact identity is now the decisive missing observation; production code must not be changed until that is distinguished from a stale bundle or XLSX viewer issue."
- timestamp: 2026-11-06T00:13:00Z
  checked: "Attempt to collect the failing file extension/location through the interactive question tool."
  found: "The environment rejected the question as non-interactive, so the missing device observation cannot be collected in this run."
  implication: "Proceed with the smallest directly reproducible default-workflow defect: test the current one-tap CSV default before changing it. Keep stale deployment and filename-only interpretation documented as blind spots."
- timestamp: 2026-11-06T00:14:00Z
  checked: "Focused regression setup for the unchanged one-tap workflow."
  found: "Added one verifier assertion requiring the screen's initial ExportExtension to be XLSX; production remains unchanged and still initializes CSV."
  implication: "A red run will directly demonstrate that the previous exact-date fix exists but is not on the default export path."
- timestamp: 2026-11-06T00:15:00Z
  checked: "Pre-fix default-format regression run via node scripts/verify-export.mjs."
  found: "The probe failed red exactly at `XLSX must be the default so one-tap exports keep YYYY/MM/DD dates`; actual source contains `useState<ExportExtension>('csv')`."
  implication: "The normal no-extra-selection workflow demonstrably bypasses the exact-date XLSX fix and emits the user's reported compact CSV value. The one-line initializer is the minimal causal correction."
- timestamp: 2026-11-06T00:16:00Z
  checked: "Minimal production correction."
  found: "Changed only the Export screen's selectedFormat initializer from `csv` to `xlsx`; serializer logic, explicit CSV/PDF choices, save/share helpers, and existing user work were untouched."
  implication: "A freshly mounted screen now routes an unchanged one-tap export through the already verified width-aware slash-date workbook path."
- timestamp: 2026-11-06T00:17:00Z
  checked: "Post-fix complete export verifier."
  found: "node scripts/verify-export.mjs printed EXPORT_VERIFY_OK. The new default-path assertion and all existing real-module CSV, XLSX, width, filename, formula-safety, matrix, and PDF checks passed."
  implication: "The focused regression turned red to green from the one-line production change without regressing explicit CSV, XLSX artifacts, or PDFs."
- timestamp: 2026-11-06T00:18:00Z
  checked: "Strict TypeScript and adjacent date/status regressions."
  found: "npx tsc --noEmit exited 0; verify-date-utils printed date utils ok; verify-summarize printed summarize ok; verify-status-contract printed status contract ok. Only the known standalone-script module-type performance warnings appeared."
  implication: "The default-format correction is type-safe and leaves shared date math, attendance summaries, and status contracts intact."
- timestamp: 2026-11-06T00:19:00Z
  checked: "Serialized final diff, status, and temporary-file hygiene inspection."
  found: "git diff --check exited 0; no scripts/.tmp-* directory remains. The follow-up production delta is the one-line XLSX initializer, paired with its verifier assertion; the cumulative intended export/XLSX work and unrelated cant-see-app-logo debug file remain preserved."
  implication: "Self-verification and repository hygiene are complete. A fresh target-app reload/open check is required because Fast Refresh or an already-mounted Export screen can preserve the previous CSV state."

## Resolution

root_cause: "The original hashes come from Excel auto-coercing CSV dates into date serials that do not fit its fixed default CSV column width. The first correction added a width-aware exact-slash XLSX path but left the screen default on compact-date CSV, so the user's unchanged one-tap workflow still produced 20261001 and bypassed the intended presentation fix."
fix: "Keep verified no-hash CSV dates as YYYYMMDD and the width-aware XLSX exact YYYY/MM/DD path; make XLSX the initial format so the normal one-tap workflow uses the artifact that can preserve both date presentation and width."
verification: "The follow-up default-path regression failed red with CSV initial state and passed green after changing only the initializer to XLSX. The complete export verifier prints EXPORT_VERIFY_OK, including exact slash-date XLSX cells, persisted widths, explicit compact CSV, matrix, formula-safety, filename, and PDF checks. Strict TypeScript plus date, summary, and status checks pass; git diff is clean and no temp artifacts remain. HUMAN VERIFIED 2026-11-06: after a full app reload and a fresh export, the user confirmed the date displays correctly with no hashes."
files_changed: [src/app/export.tsx, src/utils/export.ts, src/utils/files.ts, scripts/verify-export.mjs, package.json, package-lock.json, vendor/xlsx-0.20.3.tgz]
