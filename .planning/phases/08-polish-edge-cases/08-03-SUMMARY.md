---
phase: 08-polish-edge-cases
plan: 03
subsystem: [ui, accessibility]
tags: [a11y, hit-slop, modal-semantics, focus-return, labels]

requires:
  - phase: 01-foundation
    provides: shared components (status-pill, date-strip, note-field, empty-state, report-row, trend-chart)
provides:
  - 44px effective targets on the remaining small controls (hitSlop, 6 sites)
  - modal semantics + web focus return on calendar/month sheets and ConfirmDialog
  - labels on empty states, report rows and the trend chart
affects: [08-04, 08-07]

tech-stack:
  added: []
  patterns:
    - "Modals: accessibilityViewIsModal on the Modal, no-hide-descendants on the scrim, focus capture/restore on web only"

key-files:
  modified:
    - src/components/status-pill.tsx
    - src/components/date-strip.tsx
    - src/components/note-field.tsx
    - src/components/calendar-sheet.tsx
    - src/components/month-sheet.tsx
    - src/components/confirm-dialog.tsx
    - src/components/empty-state.tsx
    - src/components/report-row.tsx
    - src/components/trend-chart.tsx

key-decisions:
  - "No new props: hitSlop/ripple added inside the frozen component contracts"
  - "Report rows always name the percentage in the label (D-14 — never colour alone)"

requirements-completed: [DS-07, DS-05]

duration: n/a
completed: 2026-10-18
---

# 08-03 Summary — shared component a11y hardening

**Every shared control now has a 44px target, correct modal semantics, and a label that never relies on colour.**

## Accomplishments

- hitSlop: status-pill chevron/mini-pills/close, date-strip Today/Pick a date, note-field collapsed icon (6 sites, from 0); ripple + pressed opacity on all note-field pressables; zero `TouchableOpacity`
- Modals: `accessibilityViewIsModal`, scrim `importantForAccessibility="no-hide-descendants"`, per-dialog labels, web `document.activeElement` capture + restore on close
- Labels: `EmptyState` summary role, `ReportRow` label includes name + %, `TrendChart` label names period + range endpoints

## Commit

- `07e044b` feat(08-03): shared component a11y 44px focus hardening

## Verification

- `npx tsc --noEmit` exit 0; all plan gates green

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
