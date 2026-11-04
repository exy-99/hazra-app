---
phase: 08-polish-edge-cases
plan: 06
subsystem: [ui, design-system]
tags: [wcag, contrast, tokens, both-modes]

requires:
  - phase: 01-foundation
    provides: Colors + STATUS token contracts
provides:
  - scripts/verify-contrast.mjs — WCAG 2.x ratio engine, 20 product + 4 transient pairs, both modes
  - token bumps with ≥0.5 headroom on light primary/accent/mutedForeground
affects: [08-07, 09-build-ship]

tech-stack:
  added: []
  patterns:
    - "Contrast is computed, not eyeballed: every text-bearing pair is asserted at ≥4.5:1 in both modes"

key-files:
  created:
    - scripts/verify-contrast.mjs
  modified:
    - src/constants/theme.ts
    - scripts/verify-theme-tokens.mjs

key-decisions:
  - "Light primary #0D9488 → #0B7A6F (3.74 → 5.21), accent #EA580C → #C24100 (3.56 → 5.19), mutedForeground #5F7472 → #556968 (4.33 → 5.08)"
  - "Frozen STATUS pairs that fail (11) and the intentionally-subtle skeleton pairs were escalated, NOT bumped — DS-01 stays frozen"

requirements-completed: [DS-07]

duration: n/a
completed: 2026-10-18
---

# 08-06 Summary — computational contrast gate

**Contrast is now a build gate: 24 pairs computed in both modes, with three light tokens nudged until every critical pair clears 4.5:1.**

## Accomplishments

- `scripts/verify-contrast.mjs`: WCAG 2.x engine over `Colors` + `STATUS`; 20 product + 4 transient pairs (skeleton, success, share notice, validation); asserts ≥4.5:1 and the `global.css` outline ↔ `Colors.ring` lockstep
- Token bumps: light primary `#0B7A6F`, accent `#C24100`, mutedForeground `#556968`
- `verify-theme-tokens.mjs` expected hexes updated
- Escalations (not bumped): 11 frozen STATUS-pair failures + skeleton muted/surface (1.15–1.37:1, intentionally subtle)

## Commit

- `bedcc39` feat(08-06): computational contrast gate, both modes

## Verification

- `verify-contrast.mjs` CONTRAST_OK (exit 0)
- `verify-theme-tokens.mjs` ok; `verify-theme-scale.mjs` ok
- `npx tsc --noEmit` exit 0

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
