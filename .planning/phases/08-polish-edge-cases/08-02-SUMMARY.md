---
phase: 08-polish-edge-cases
plan: 02
subsystem: [ui]
tags: [empty-states, skeletons, copy-lock, reduced-motion]

requires:
  - phase: 08-polish-edge-cases
    provides: useReducedMotion() hook (08-01)
  - phase: 03-attendance-marking
    provides: attendance/workers FlatList rows + EmptyState wiring
provides:
  - card-matched skeleton blocks on attendance/worksites/workers load
  - §7.5 copy lock across every EmptyState title/action
affects: [08-04, 08-07]

tech-stack:
  added: []
  patterns:
    - "Skeleton pulse 1 → 0.55 → 1 over 240ms, skipped under reduced motion (static 0.55)"

key-files:
  modified:
    - src/app/(tabs)/attendance.tsx
    - src/app/(tabs)/workers.tsx
    - src/app/worksites.tsx

key-decisions:
  - "Skeletons match the real card geometry so load → data has no layout shift"
  - "Empty-state copy is word-for-word §7.5, including the dead-affordance exception (attendance 'Add worker')"

requirements-completed: [DS-06]

duration: n/a
completed: 2026-10-18
---

# 08-02 Summary — card-matched skeletons + §7.5 copy lock

**Blank flashes are replaced by card-shaped skeleton blocks and every empty state now matches the §7.5 table word-for-word.**

## Accomplishments

- attendance: 4 `AttendanceRow`-card skeletons; chrome title + DateStrip stay mounted; `accessibilityLabel="Loading attendance"`
- worksites: 3 worksite-card skeletons; same pulse + reduced-motion gate; `Loading worksites`
- workers: chips row stays mounted + 4 `WorkerRow`-card skeletons; `Loading workers`
- Copy lock: worksites "No worksites yet"/"Add worksite"; workers "No workers at this worksite"/"Add worker"; attendance "No attendance marked for this date"/"Add worker"; history "No attendance recorded yet" (actionless); home "No workers yet"

## Commit

- `94f346f` feat(08-02): card-matched skeletons plus exact section 7.5 copy lock

## Verification

- `npx tsc --noEmit` exit 0; every 08-02 copy/skeleton gate green

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
