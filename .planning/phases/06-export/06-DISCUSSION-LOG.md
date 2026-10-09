# Phase 6: Export (CSV / PDF) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-09
**Phase:** 6-export
**Areas discussed:** Entry points, File formats, Export scope, Save and share flow, CSV edge cases, PDF styling, Preview card

---

## Entry points

| Question | Options | Selected |
|----------|---------|----------|
| Where should the manager start an export from? | Everywhere / One export screen / Contextual only | ✓ Everywhere |
| Profile Export action or stay read-only? | Profile button / No profile change | ✓ Profile button |
| Preselect scope from Reports push? | Deep links / Blank screen | ✓ Deep links |
| Own worker/site pickers for direct opens? | Pickers inside / Params required | ✓ Pickers inside |

**User's choice:** Export reachable from everywhere (Reports rows, worker profile, central screen); profile gains an Export action below Edit; deep-link params preselect scope; screen owns its own pickers.
**Notes:** Single drill-down route `src/app/export.tsx`; no tab changes.

---

## File formats

| Question | Options | Selected |
|----------|---------|----------|
| Which formats must v1 support? | Both, CSV first / CSV only / PDF only | ✓ Both, CSV first |
| What CSV columns? | Simple columns / Rich CSV | ✓ Simple columns |
| What should the PDF contain? | Simple table / Rich report | ✓ Simple table |
| Status values in CSV? | Lowercase keys / Display labels | ✓ Lowercase keys |

**User's choice:** Both formats, CSV default; `date,status,note` / `date,worker,status,note` sorted by date then name; single HTML table PDF; lowercase status keys.
**Notes:** Payroll-usability drives CSV-first and machine-parseable keys.

---

## Export scope

| Question | Options | Selected |
|----------|---------|----------|
| Worker export range? | Full history / Custom range | ✓ Full history |
| Worksite register coverage? | One site+month / Include All-sites | ✓ One site+month |
| Removed workers/sites exportable? | Exportable / Active only | ✓ Exportable |
| Zero marks behavior? | Blocked / Headers only | ✓ Blocked |

**User's choice:** Full-history worker export; exactly one site + one month; removed records exportable by deep-link; disabled CTA + calm line on zero marks.
**Notes:** PRD §9 history-preservation rule supports D-11.

---

## Save and share flow

| Question | Options | Selected |
|----------|---------|----------|
| After generating the file? | Save then share / Share only / Save only | ✓ Save then share |
| Filename convention? | Slug names / Custom names | ✓ Slug names |
| Web behavior? | Best effort web / Native only | ✓ Best effort web |
| Midway failure? | Retry, no partials / Keep partial | ✓ Retry, no partials |

**User's choice:** Downloads save + share-sheet success card; `hazra-worker-{slug}-{yyyymmdd}` / `hazra-register-{siteslug}-{yyyymm}`; best-effort web; retry with partial-file cleanup.
**Notes:** No `expo-media-library` in v1 (per UI-SPEC registry gate).

---

## CSV edge cases

| Question | Options | Selected |
|----------|---------|----------|
| RFC-4180 quoting strictness? | RFC-4180 strict / You decide | ✓ RFC-4180 strict |
| Missing note in CSV? | Empty field / Dash placeholder | ✓ Dash placeholder |

**User's choice:** Strict quote-wrap + doubled quotes; `-` dash for missing notes.
**Notes:** Roadmap probe note is the acceptance test.

---

## PDF styling

| Question | Options | Selected |
|----------|---------|----------|
| PDF styling fixed or themed? | Always light / Match theme | ✓ Match theme |
| Legend + summary footer? | Legend+summary / Table only | ✓ Legend+summary |

**User's choice:** PDF matches app theme; legend row + `summarize()` footer included.
**Notes:** Match-theme OVERRIDES the approved 06-UI-SPEC fixed-light default — flagged in CONTEXT.md as a planner reconciliation item.

---

## Preview card

| Question | Options | Selected |
|----------|---------|----------|
| Pre-export preview content? | Counts+samples / Counts only | ✓ Counts+samples |
| Generating state look? | Progress row / Blocking modal | ✓ Progress row |

**User's choice:** Row-count line + up to 5 sample rows; inline progress row with guarded disabled CTA.
**Notes:** Preview counts and file bytes must share one DAO scope.

---

## OpenCode's Discretion

- Sample-row truncation length, preview-card padding, skeleton shapes
- §7.5-calibrated empty-state copy and row-count wording
- Slug-generation algorithm within the D-14 filename contract
- Month-grid sheet styling within the DateStrip modal precedent
- Web download mechanics (researcher investigates first)
- `exportCSV` / `exportPDF` helper placement within the pure-serializer constraint

## Deferred Ideas

None — discussion stayed within phase scope (EX-01..EX-03, NF-06).

---

*Phase: 06-export*
*Discussion log generated: 2026-10-09*
