---
status: investigating
trigger: "Test 4 in .planning/phases/06-export/06-UAT.md — % footer line does not appear in PDF preview"
created: 2026-10-09T00:00:00Z
updated: 2026-10-09T00:00:00Z
---

## Current Focus

hypothesis: Preview card in src/app/export.tsx renders the 4-status legend when format=pdf but never calls footerSummary() nor renders a % summary line — only the file builders do
test: Read src/utils/export.ts footerSummary + pdfShell and src/app/export.tsx preview card JSX
expecting: Confirm preview JSX has legend block but no footerSummary call / summary Text
next_action: Return ROOT CAUSE FOUND (goal is find_root_cause_only, no fix)

## Symptoms

expected: PDF preview includes a 4-status legend and a % footerSummary line.
actual: User reported: "% footer line does not apper other than that everything works asked above"
errors: None reported
reproduction: Test 4 in .planning/phases/06-export/06-UAT.md — Switch to Worksite month scope, pick worksite + month, set format PDF, observe preview card
started: Discovered during UAT 2026-10-09

## Eliminated

- hypothesis: footerSummary() itself is broken / returns wrong string
  evidence: src/utils/export.ts:170-173 correctly reuses summarize() and formats "present · absent · half day · off day · %" (or — when percentage null); both PDF builders pass sorted rows into it (buildWorkerPdfHtml:251, buildRegisterPdfHtml:290) and pdfShell:213 renders args.summary escaped in a <p>. Function is sound.
  timestamp: 2026-10-09T00:00:00Z

## Evidence

- timestamp: 2026-10-09T00:00:00Z
  checked: src/utils/export.ts footerSummary + consumers
  found: footerSummary defined at 170-173; only two callers in repo — buildWorkerPdfHtml:251 (summary: footerSummary(sorted)) and buildRegisterPdfHtml:290 (summary: footerSummary(sorted)); pdfShell:212-213 renders legendRow + summary <p> into file HTML
  implication: File-output path includes the % footer; any missing footer must be on the on-screen preview path, not the serializer
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx preview card JSX (759-811)
  found: Preview card renders countLine (764-766) + up-to-5 sample rows (767-786) + conditional legend block gated on selectedFormat==='pdf' (787-810, CYCLE map with STATUS solid dots). No footerSummary() call anywhere in export.tsx; no summary/% <Text> element in the preview card.
  implication: PDF preview can show the 4-status legend but structurally cannot show the % footer line — the call was never wired into the preview UI
- timestamp: 2026-10-09T00:00:00Z
  checked: src/app/export.tsx countLine + summary values (501-507)
  found: Worker countLine (506) is "days · present · absent · half · off" with no %; register countLine (507) is "workers · marks · MonthLabel" with no % and no summarize() over regRows (line 502 summarizes only worker `entries`)
  implication: Even the count line is not a substitute for the footer — the % value is computed nowhere on the preview path for register scope

## Resolution

root_cause: The on-screen PDF preview card in src/app/export.tsx:759-811 renders the 4-status legend when selectedFormat==='pdf' (787-810) but never calls footerSummary() and never renders a summary/% line. footerSummary() (src/utils/export.ts:170-173) is only invoked by the file builders buildWorkerPdfHtml:251 and buildRegisterPdfHtml:290 for the saved PDF HTML (rendered by pdfShell:213) — so the saved file has the footer while the preview the user checks (Test 4) structurally omits it.
fix:
verification:
files_changed: []
