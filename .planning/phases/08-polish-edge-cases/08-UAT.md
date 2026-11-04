---
status: complete
phase: 08-polish-edge-cases
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md, 08-06-SUMMARY.md, 08-07-SUMMARY.md, 08-08-SUMMARY.md]
started: 2026-11-04T18:15:12Z
updated: 2026-11-04T19:10:21Z
---

## Current Test

[testing complete]

## Tests

### 1. §7.5 empty-state copy
expected: Every empty state shows the exact design.md §7.5 copy — worksites "No worksites yet"/"Add worksite"; workers "No workers at this worksite"/"Add worker"; attendance "No attendance marked for this date"/"Add worker"; history "No attendance recorded yet" (no action); home "No workers yet".
result: pass

### 2. Loading skeletons replace blank flashes
expected: Attendance shows 4 card-shaped skeleton rows with the title and date strip already mounted; Worksites shows 3; Workers keeps its filter chips and shows 4. Nothing flashes blank and there is no layout shift when real rows replace skeletons. With Reduce Motion on, skeletons stay static at 0.55 opacity.
result: pass

### 3. 44px targets, labels, modal focus
expected: Every small control (status-pill chevron, mini status pills and Close, date-strip Today and Pick a date, note icon, phone icon) responds within a ≥44×44 area. Icon-only controls announce a spoken label. Calendar/month sheets and ConfirmDialog keep screen-reader focus inside while open; on web, focus returns to the opener after close.
result: pass

### 4. Layout contract
expected: Every screen keeps 16px side gutters, at least 8px between tap targets, content clear of the tab bar, and counts/dates in tabular numerals (digits do not jitter as values change). All list screens use stable keys and memoized rows.
result: pass

### 5. Inter typography and 13px floor
expected: All app text renders in Inter, no visible text is smaller than 13px, and the app still boots with system fonts if Inter fails to load.
result: pass

### 6. One orange action per state
expected: Each screen state shows exactly one orange action — Home CTA, attendance empty-state action, worksites/workers footer CTA, form Save, profile Edit, export Export, backup Back up now. Buttons show ripple or pressed feedback and no state shows two competing orange actions.
result: pass

### 7. Both-mode contrast and focus ring
expected: In dark mode all body text, muted captions, status chips, primary and accent text stay comfortably readable (≥4.5:1, asserted by scripts/verify-contrast.mjs), and on web the keyboard focus ring is visible in both modes.
result: pass

### 8. Tab chrome
expected: Four tabs in order Home, Attendance, Workers, Reports; selected tab uses primary and unselected uses mutedForeground in both modes; on web the strip exposes tablist/tab semantics with a selected state; content never hides behind the tab bar.
result: pass

### 9. Keyboard-safe forms
expected: In Add worksite and Add worker, tapping the last field keeps the field and Save visible above the keyboard, the page scrolls instead of covering content, and Save still works with the keyboard open.
result: pass

### 10. Icon and splash wiring
expected: After a native rebuild, the launcher icon is the hazra mark, the Android adaptive icon is not cropped by the mask, and launch shows the teal #F0FDFA splash with the mark at a sensible size before the app appears.
result: pass

### 11. 360dp low-end device proof (D-24)
expected: On a real 360dp-wide low-end Android device, the splash is teal at 360dp, launcher and adaptive icons render correctly, no screen clips or overlaps, Save is reachable with the keyboard open, and slow loads show skeletons rather than blank screens.
result: pass

### 12. Both-modes 10-route sweep (D-40/D-41)
expected: Capture 10 routes in light and dark mode — Home, Attendance, Workers, Reports, Worksites, Worksite form, Worker form, Worker profile, Export, Backup — plus transient states (skeleton, empty, export success, form validation, restore warning, load error). No illegible text, broken layout, or missing contrast; evidence recorded in 08-07-SUMMARY.md.
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
