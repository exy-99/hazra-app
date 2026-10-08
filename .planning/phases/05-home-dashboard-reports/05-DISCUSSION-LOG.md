# Phase 5: Home Dashboard & Reports - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 5-home-dashboard-reports
**Areas discussed:** Home hero layout, Reports range + filters, Per-worker % + lowest list, Row content depth, Worksite trends view, Custom picker form

---

## Home hero layout

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Home ring %: unmarked handling? | Reuse summarize / Divide by roster / You decide | ✓ Reuse summarize |
| Home counts row: unmarked placement? | 4 pills + line / 5th unmarked pill / Hide when zero | ✓ 4 pills + line |
| Home CTA behavior? | Go to register / Hide when complete / You decide | ✓ Go to register |
| Untouched day / zero roster? | Calm empty states / Hide ring until marks / You decide | ✓ Calm empty states |
| Ring size + date prominence? | Large ring + date / Reuse profile size / You decide | ✓ Large ring + date |
| Pills/ring tap-through? | Read-only hero / Pills link out / You decide | ✓ Pills link out |

**User's choice:** Consistent `summarize()` math everywhere; 4 pills + muted unmarked line; always-visible CTA → `/attendance`; pills link out to register (planner reconciles with worksite-only filter).
**Notes:** User asked for extra rounds on this area ("More questions" twice) — hero prominence and tap-through were follow-ups, not in the initial 4.

---

## Reports range + filters

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Date range control? | Presets + custom / Month picker only / You decide | ✓ Presets + custom |
| Worksite + range combination? | Chip row single scope / Apply-on-confirm / You decide | ✓ Chip row single scope |
| Future dates in custom range? | Cap at today / Allow future / You decide | ✓ Cap at today |
| Loading on filter change? | Skeletons / Spinner swap / You decide | ✓ Skeletons |
| Default range on open? | Last 30 days / This month / You decide | ✓ Last 30 days |
| Zero-mark range renders? | Calm empty / Stale + notice / You decide | ✓ Calm empty |

**User's choice:** 7/30/90 chips + From/To custom, single-scope chip row, capped at today, skeletons, 30-day default, calm empty states.
**Notes:** "This month" (export-aligned) was offered for the default and declined.

---

## Per-worker % + lowest list

| Question | Options presented | Selected |
|----------|-------------------|----------|
| List sort order? | Lowest first / Highest first / You decide | ✓ Highest first |
| Highlight rule? | Bottom 3 / All below 75% / You decide | ✓ Bottom 3 |
| Row tap target? | Open profile / Read-only rows / You decide | ✓ Open profile |
| % math strictness? | Same summarize / Unmarked = absent / You decide | ✓ Same summarize |
| Highlight placement? | Top callout / Inline badges / You decide | ✓ Top callout |
| Null-% ("—") sort position? | Bottom unranked / Treat as zero / You decide | ✓ Bottom unranked |

**User's choice:** Highest-first with a top bottom-3 callout; rows open profiles; same math; null-% sinks unranked. (Notably chose Highest first against the recommendation.)
**Notes:** Row-depth questions (counts per row, accent <75%) were split into their own area below after the user asked to explore more.

---

## Row content depth

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Row content? | % + counts / % only / You decide | ✓ % + counts |
| Low-% treatment? | Accent < 75% / Ring only / You decide | ✓ Accent < 75% |

**User's choice:** Name + % + 4 mini counts with STATUS dots; accent % text below the shared 75 floor.

---

## Worksite trends view

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Trend form? | SVG daily bars / Daily stat rows / You decide | ✓ SVG daily bars |
| Trend scope? | Active-only / Include removed / You decide | ✓ Active-only |
| Zero-mark days? | Gap bars / Zero bars / You decide | ✓ Gap bars |
| Long ranges? | Cap + weekly buckets / Unlimited daily / You decide | ✓ Cap + weekly buckets |

**User's choice:** `react-native-svg` daily bars with labeled axes/legend, active-only, muted gap bars for empty days, weekly bucketing past 31 days.

---

## Custom picker form

| Question | Options presented | Selected |
|----------|-------------------|----------|
| Picker component? | Reuse calendar modal / Native pickers / You decide | ✓ Reuse calendar modal |
| Invalid range handling? | Gate + hint / Auto-correct / You decide | ✓ Gate + hint |

**User's choice:** DateStrip calendar modal reuse; Save gated on From ≤ To ≤ today with inline destructive hint.

---

## OpenCode's Discretion

- Trend-bar taps (offered alongside Custom picker form; user selected only the picker — defaults to read-only chart).
- Exact ring diameter, bar geometry, weekly-bucket boundaries, axis ticks, skeleton shapes, §7.5 copy, lowest-3 wording and tie-at-boundary behavior.
- Home pill-link exact params (D-06 reconciliation with the attendance screen's worksite-only filter).

## Deferred Ideas

None — discussion stayed within phase scope (RP-01..RP-05).
