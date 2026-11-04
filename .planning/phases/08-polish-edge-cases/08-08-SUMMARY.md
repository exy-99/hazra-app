---
phase: 08-polish-edge-cases
plan: 08
subsystem: [ui, cleanup]
tags: [dead-code, backup-screen, presentation-sweep, gates]

requires:
  - phase: 08-polish-edge-cases
    provides: app-tabs.web.tsx decoupling (08-01) — precondition for deleting Themed*
  - phase: 07-backup-restore
    provides: the Backup & Restore screen swept here
provides:
  - six dead starter components deleted with zero live importers
  - app-wide 13px + zero-component-hex gates green
  - Backup screen presentation sweep with behavior byte-identical
affects: [08-04, 08-07]

tech-stack:
  added: []
  patterns:
    - "Behavior red-lines: validate-before-import, single-transaction import, ConfirmDialog gate stay byte-identical during presentation sweeps"

key-files:
  modified:
    - src/components/themed-text.tsx (deleted — landed in 08-01's commit)
    - src/components/themed-view.tsx (deleted — 08-01)
    - src/components/ui/collapsible.tsx (deleted — 08-01)
    - src/components/external-link.tsx (deleted — 08-01)
    - src/components/hint-row.tsx (deleted — 08-01)
    - src/components/web-badge.tsx (deleted — 08-01)
    - src/app/backup.tsx

key-decisions:
  - "Task 1 was folded into 08-01's commit because the deleted `themed-text` referenced the removed Fonts.mono and blocked tsc"
  - "No skeleton on Backup: getLastBackupInfo() is local SQLite and resolves before first paint — D-02 rationale recorded instead of a fake loading state"

requirements-completed: [DS-04, DS-08]

duration: n/a
completed: 2026-10-18
---

# 08-08 Summary — dead starter cleanup + backup screen sweep

**The last six starter components are gone and the Phase 7 Backup screen now matches the presentation contract without changing a single behavior.**

## Accomplishments

- Deleted `themed-text`, `themed-view`, `ui/collapsible`, `external-link`, `hint-row`, `web-badge` — zero live importers (task 1, inside `e13428f`)
- App-wide gates: no sub-13px `fontSize`, zero non-token text hex (exceptions by name only)
- `backup.tsx` sweep: hitSlop on "Replace all data", pressed opacity + ripple on all 9 Pressables, `tabular-nums` dates, polite live regions on error + count confirmations, one accent (`Back up now`) per state
- Behavior untouched: `validateBackupPayload` / `importAllData` call sites identical

## Commits

- `e13428f` feat(08-01): contains the six deletions (task 1)
- `4199c77` feat(08-08): backup screen presentation sweep (task 2)

## Verification

- `npx tsc --noEmit` exit 0; app-wide text gates pass; zero `TouchableOpacity`, zero hex, zero non-text `theme.destructive`

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
