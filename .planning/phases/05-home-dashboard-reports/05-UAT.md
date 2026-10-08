---
status: complete
phase: 05-home-dashboard-reports
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-10-08
updated: 2026-10-08
---

## Current Test

[testing complete]

## Tests

### 1. Home hero glance
expected: Open Home with workers and today's marks present. Today's date shows above a large attendance ring with the %; four status pills show today's counts plus a muted "N unmarked" line below; exactly one orange "Mark attendance" CTA is visible.
result: pass

### 2. Home triage navigation
expected: Tapping any Home status pill or the "Mark attendance" CTA lands on today's register (/attendance). Zero-workers state instead shows "No workers yet" with an "Add worker" action and no dead CTA.
result: pass

### 3. Home untouched-day and error states
expected: With workers but zero marks today, the ring shows "—" with zero-count pills and the CTA intact (no empty-state card). On load failure, "Couldn't load today's attendance" appears with a "Try again" retry.
result: pass

### 4. Reports default scope and filters
expected: Reports opens on Last-30-days + All-sites with a range ring and mini counts. Site chips (All + per-site) sit above the 7/30/90 range chips; switching either recomputes every stat together with skeletons (chips stay mounted, no blank flash).
result: pass

### 5. Custom range gating
expected: Custom From/To fields open a calendar capped at today (future days never selectable). Picking From after To (or any date after today) keeps Save disabled with the "Choose From on or before To, both on or before today." hint — never auto-corrected.
result: pass

### 6. Per-worker list and Frequently-absent callout
expected: Reports shows a "Frequently absent" bottom-3 callout above the full "All workers" list (highest % first, "—" workers sunk to the bottom). Each row shows name + % (orange below 75%) + 4 mini counts; numbers match the register exactly.
result: skipped
reason: "for later"

### 7. Report row to profile
expected: Tapping a report row opens that worker's profile (/worker/[id]); corrections stay in the register (no edit affordance on the row itself).
result: pass

### 8. Trend chart with gaps and weekly buckets
expected: Reports shows a "Trends" bar chart with labeled axes + legend. Days with zero marks render as short muted gap bars (never 0% bars); a 90-day range renders ~13 weekly bars instead of 90 daily bars.
result: pass

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

[none yet]
