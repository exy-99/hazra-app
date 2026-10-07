# Phase 4: Worker Profile & History - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-07
**Phase:** 4-worker-profile-history
**Areas discussed:** Period selector, Profile header + ring, History list, Deleted-worker access, Profile actions, Loading + empty states, Date + number format

---

## Period selector

| Option | Description | Selected |
|--------|-------------|----------|
| Last 30 days | Meaningful % on first paint; matches Reports Phase 5 default | ✓ |
| Last 7 days | Faster to grasp for daily-wage crews; thin data though | |
| All time | Whole record; % stable but slow to reflect recent drops | |

**User's choice:** Last 30 days (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| 7 / 30 / 90 days | Covers weekly, monthly, quarterly review rhythms; All time via history scroll | ✓ |
| 7 / 30 / This month / All | Calendar-month view matches payroll thinking; needs month math | |
| 7 / 30 only | Minimal chips; less code, fewer edge cases | |

**User's choice:** 7 / 30 / 90 days (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| No custom range in v1 | Keeps Phase 4 tight; full custom range lands in Reports Phase 5 (RP-02/RP-05) | ✓ |
| Yes, from/to pickers | Two date pickers; more code + validation for little v1 gain | |

**User's choice:** No custom range in v1 (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Show — + EmptyState | Matches roadmap criterion #2 exactly; never NaN or misleading 0% | ✓ |
| Show 0% | Looks broken when a new worker has no marks yet | |

**User's choice:** Show — + EmptyState (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Ring + counts + history all follow period | One scope for everything; history scrolls within the period only | ✓ |
| Only ring + counts follow; history always full | Stats react to chips but full history always visible below | |

**User's choice:** Ring + counts + history all follow period (Recommended)
**Notes:** Asked via "More questions" follow-up; user confirmed single-scope recompute.

---

## Profile header + ring

| Option | Description | Selected |
|--------|-------------|----------|
| Row → profile, Edit inside | Profile becomes the hub; Edit lives inside as a text/outline action | ✓ |
| Row → edit form stays | Keeps current 02-04 behavior; profile reachable only via extra affordance | |

**User's choice:** Row → profile, Edit inside (Recommended)
**Notes:** Changes the 02-04 row target — planner must include the workers.tsx row-href edit.

| Option | Description | Selected |
|--------|-------------|----------|
| Name + role · site + phone | Mirrors workers-list memo rows; site resolves via worksites Map | ✓ |
| Name + site only | Less clutter; role/phone visible only in Edit form | |

**User's choice:** Name + role · site + phone (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| SVG ring + 4 counts | Satisfies roadmap criterion #3 directly; react-native-svg already installed (01-01) | ✓ |
| Plain % text, no ring | Cheaper but loses the at-a-glance read the roadmap demands | |

**User's choice:** SVG ring + 4 counts (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Ring turns accent only | Pure color signal; no extra copy to translate or clutter | ✓ |
| Accent ring + 'Needs attention' copy | Explicit callout for the unreliable-crew conversation | |

**User's choice:** Ring turns accent only (Recommended)
**Notes:** None.

---

## History list

| Option | Description | Selected |
|--------|-------------|----------|
| Date + status chip + note preview | Fast scan; reuses STATUS colors + note-field truncation pattern | ✓ |
| Date + status text only | Denser but harder to scan status at a glance | |

**User's choice:** Date + status chip + note preview (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Flat reverse-chron | Simplest FlatList; period chips already bound the range | ✓ |
| Grouped by month | Nicely scannable for long records; extra section-header code | |

**User's choice:** Flat reverse-chron (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only rows | Corrections happen in the register where the pill + pending guard live | ✓ |
| Tap row → edit that day | Row tap jumps to attendance tab on that date for correction | |

**User's choice:** Read-only rows (Recommended)
**Notes:** History is the read model; attendance tab is the write model.

| Option | Description | Selected |
|--------|-------------|----------|
| Only marked days | Unmarked days never appear; off_days show (they explain gaps) | ✓ |
| Include unmarked days too | Fills gaps but duplicates the register's unmarked concept | |

**User's choice:** Only marked days (Recommended)
**Notes:** None.

---

## Deleted-worker access

| Option | Description | Selected |
|--------|-------------|----------|
| No list entry; deep-link only | No list clutter; record reachable from export/history flows + direct URL | ✓ |
| Show-removed toggle in workers list | Discoverable but risks cluttering the active roster | |

**User's choice:** No list entry; deep-link only (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Banner + full read-only record | History stays trustworthy; status is visible but not editable | ✓ |
| Hide stats, history only | Avoids confusion but weakens the audit trail | |

**User's choice:** Banner + full read-only record (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Edit + Remove hidden | Record is frozen; re-adding is a new worker (history stays with old id) | ✓ |
| Allow re-activate | Allows fixing a mistaken remove without a new row | |

**User's choice:** Edit + Remove hidden (Recommended)
**Notes:** No re-activate flow in v1.

| Option | Description | Selected |
|--------|-------------|----------|
| DAO lookup by id, bound param | DAO already filters is_active=1; profile passes id bound as ? param — wait, profile must ALSO resolve inactive rows; planner to confirm lookup bypasses the active-only filter for direct id fetch | ✓ |
| Screen-level active check too | Extra safety but duplicates DAO filtering | |

**User's choice:** DAO lookup by id, bound param (Recommended)
**Notes:** OpenCode flag: `listWorkers`/`getWorker` filter `is_active = 1` — D-14/D-15 (deep-link to removed profile) requires the profile's direct-id fetch to resolve inactive rows. Planner must verify the DAO path (dedicated lookup or `includeInactive`-style flag) — tampered-id → not-found EmptyState still applies.

---

## Profile actions

| Option | Description | Selected |
|--------|-------------|----------|
| Single orange Edit below stats | Consistent with 02-02/02-04 one-orange rule; Edit never competes with stats | ✓ |
| Header icon button | Faster access but header space is tight on small screens | |

**User's choice:** Single orange Edit below stats (Recommended)
**Notes:** Extra area from "Explore more" round.

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text, no tap | Avoids accidental dials on a manager tool; number stays visible | |
| Tap-to-call | One tap to call the worker; tel: link on the phone row | ✓ |

**User's choice:** Tap-to-call
**Notes:** User overrode the recommendation (plain text). Planner note: `tel:` link via standard linking; accidental-tap risk accepted by user.

---

## Loading + empty states

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner in content | Matches 03-05: chrome stays mounted, spinner only in the stats/history region | |
| Skeleton blocks | Full Phase 8 polish; heavier for this phase | ✓ |

**User's choice:** Skeleton blocks
**Notes:** User overrode the recommendation (spinner). Recorded as lightweight skeletons — full DS-06 polish stays Phase 8.

| Option | Description | Selected |
|--------|-------------|----------|
| Couldn't-load EmptyState + Try again | Copy the 02-06/02-07 discipline: never reject, retry by refocus/re-tap | ✓ |
| Inline error text only | Lighter but manager can't recover without leaving | |

**User's choice:** Couldn't-load EmptyState + Try again (Recommended)
**Notes:** None.

---

## Date + number format

| Option | Description | Selected |
|--------|-------------|----------|
| formatDisplay everywhere | Consistent with DateStrip + attendance rows; local keys only, never toISOString | ✓ |
| Relative labels (Today…) | Relative labels feel chatty but complicate tests + sorting | |

**User's choice:** formatDisplay everywhere (Recommended)
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| tabular-nums everywhere | Matches CountsHeader + worker rows; prevents layout jitter on recompute | ✓ |
| Default numerals | Fewer style props but counts shift width as they change | |

**User's choice:** tabular-nums everywhere (Recommended)
**Notes:** None.

---

## OpenCode's Discretion

- Skeleton block exact shapes/shimmer; note-preview truncation length; exact §7.5 empty-history copy.
- `summarize()` home, return shape, TDD test placement (hand-check 76.79 locked).
- Period-chip styling details; "Removed" banner copy + placement.

## Deferred Ideas

- Custom date-range picker — Phase 5 Reports (RP-02/RP-05).
- Re-activate removed worker; show-removed toggle (rejected for v1).
- Tap-history-row-to-edit (rejected — read-only history).
