---
phase: 08-polish-edge-cases
plan: 05
subsystem: [ui, navigation]
tags: [native-tabs, web-tabs, tablist, focus-visible, safe-area, android-resize]

requires:
  - phase: 01-foundation
    provides: 4-tab shell (NativeTabs + expo-router/ui)
  - phase: 08-polish-edge-cases
    provides: token contrast bump (08-06 later re-asserts ring lockstep)
provides:
  - DS-09 tab chrome audit + extended standing gate (25 checks)
  - web tablist/tab semantics
  - android.softwareKeyboardLayoutMode = resize
  - global.css :focus-visible ring in token literals
  - BottomTabInset on the four long scroll screens
affects: [08-06, 08-07]

tech-stack:
  added: []
  patterns:
    - "Tab colour contract stays {default, selected} on labelStyle/iconColor — never invent keys"

key-files:
  modified:
    - src/components/app-tabs.tsx (audited)
    - src/components/app-tabs.web.tsx
    - app.json
    - src/global.css
    - scripts/verify-tab-shell.mjs
    - src/app/(tabs)/attendance.tsx
    - src/app/(tabs)/workers.tsx
    - src/app/worksites.tsx
    - src/app/worker/[id].tsx

key-decisions:
  - "Android keyboard fix is the resize layout mode — forms keep iOS-only KeyboardAvoidingView padding"
  - "Focus ring lives in global.css as exact Colors.ring literals (08-06 asserts lockstep)"

requirements-completed: [DS-09, DS-05]

duration: n/a
completed: 2026-10-18
---

# 08-05 Summary — tab chrome, Android resize, web focus ring

**The 4-tab shell is audited and gate-locked, Android now resizes for the keyboard, and web focus is visible in both schemes.**

## Accomplishments

- Native: 4 triggers (index/attendance/workers/reports) with `{default, selected}` colours from tokens
- Web: `tablist` container, `tab` + label + selected state per trigger; `verify-tab-shell.mjs` extended to 25 checks
- `app.json`: `android.softwareKeyboardLayoutMode: "resize"`
- `global.css`: `:focus-visible` 2px ring `#0D9488` light / `#2DD4BF` dark, lockstep with `Colors.ring`
- `BottomTabInset` added to attendance/workers/worksites/worker-profile scroll content; root Stack contract untouched

## Commit

- `4550d6f` feat(08-05): DS-09 tab chrome + Android resize + web focus ring

## Verification

- `npx tsc --noEmit` exit 0; `node scripts/verify-tab-shell.mjs` 25/25

## Note

Tab icons remain the stock `tabIcons/*.png` placeholders (`explore.png` reused for Attendance/Workers/Reports). DS-09 covers chrome/tint, not icon art — recorded as Phase 9 cosmetic debt.

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
