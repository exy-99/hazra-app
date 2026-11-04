---
phase: 08-polish-edge-cases
plan: 01
subsystem: [ui, infra]
tags: [inter-font, expo-google-fonts, reduced-motion, accessibility, type-scale]

requires:
  - phase: 01-foundation
    provides: Type scale + Colors tokens in src/constants/theme.ts
provides:
  - Inter 400/500/600/700 loaded at boot and wired into every Type token
  - useReducedMotion() hook (AccessibilityInfo-backed)
  - app-wide 13px text floor
  - six dead starter components deleted
affects: [08-02, 08-04, 08-08]

tech-stack:
  added: []
  patterns:
    - "Boot gate joins dbReady with (fontsLoaded || fontError) — a font failure falls back to system fonts, never freezes"

key-files:
  created:
    - src/hooks/use-reduced-motion.ts
  modified:
    - src/app/_layout.tsx
    - src/constants/theme.ts
    - src/global.css
    - src/components/app-tabs.web.tsx
    - src/components/themed-text.tsx (deleted)
    - src/components/themed-view.tsx (deleted)
    - src/components/ui/collapsible.tsx (deleted)
    - src/components/external-link.tsx (deleted)
    - src/components/hint-row.tsx (deleted)
    - src/components/web-badge.tsx (deleted)

key-decisions:
  - "Font error falls back to system fonts (D-29) — the splash never blocks on a font failure"
  - "Inter replaces the Platform-select Fonts map; Type tokens carry fontFamily"
  - "app-tabs.web.tsx moved to direct Text/View + Type spreads, severing the last Themed* consumer"

requirements-completed: [DS-07]

duration: n/a
completed: 2026-10-18
---

# 08-01 Summary — Inter runtime, 13px floor, reduced motion

**Inter ships in-bundle with a font-failure fallback, every Type token carries the family, and the last starter components are gone.**

## Accomplishments

- `src/hooks/use-reduced-motion.ts` — `isReduceMotionEnabled` + `reduceMotionChanged` subscription with cleanup
- `_layout.tsx` boot gate: `uiReady = dbReady && (fontsLoaded || fontError)`; `hideAsync` stays in the db-init `finally`; `initialized`/`retryInit` untouched
- `theme.ts`: Inter family map replaces the Platform-select map; `fontFamily` wired into every `Type` token; sub-13px sizes removed
- `global.css`: `--font-display` leads with Inter
- Deleted `themed-text`, `themed-view`, `ui/collapsible`, `external-link`, `hint-row`, `web-badge` (zero live importers)

## Commit

- `e13428f` feat(08-01): Inter font gate, reduced-motion hook, 13px floor

## Verification

- `npx tsc --noEmit` exit 0
- Gates: `reduceMotionChanged` present, `useFonts` + `Inter_400Regular` in `_layout`, `.catch` on `hideAsync`, zero Themed* refs, zero sub-13px fontSize outside `theme.ts`, zero component hex

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-10-18*
