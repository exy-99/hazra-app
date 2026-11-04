---
phase: 08-polish-edge-cases
plan: 07
subsystem: [ui, infra]
tags: [expo-config, app-icons, adaptive-icon, splash-screen, assets]

# Dependency graph
requires:
  - phase: 08-polish-edge-cases
    provides: 08-06 token bump (light primary #0B7A6F, background #F0FDFA) — splash/adaptive colour target
  - phase: 08-polish-edge-cases
    provides: 08-01/08-04/08-05 screen + tab chrome, the routes swept by task 3
provides:
  - app.json icon/adaptive/splash wiring against the hazra brand set
  - scripts/verify-app-assets.mjs standing config gate
  - deletion of the stock Expo art (expo.icon dir, expo-logo, logo-glow, react-logo*, badges, tutorial, android-icon-*)
  - AnimatedSplashOverlay repointed to splash-icon.png on the teal token
affects: [09-build-ship]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expo config gate: JSON.parse app.json, assert every wired path exists + token literal + untouched keys"
    - "Android adaptive icon safe zone: ink ≤660×660 centred on a 1024 canvas"

key-files:
  created:
    - scripts/verify-app-assets.mjs
  modified:
    - app.json
    - src/components/animated-icon.tsx
    - src/components/animated-icon.web.tsx
    - assets/images/adaptive-icon.png

key-decisions:
  - "ios.icon/expo.icon → assets/images/icon.png; the stock assets/expo.icon directory is deleted"
  - "Android adaptive icon = #F0FDFA + foreground only (backgroundImage/monochromeImage removed, per user instruction)"
  - "Splash = #F0FDFA + splash-icon.png at imageWidth 180 (D-34)"
  - "Web favicon file regenerated (48×48) accepted as a D-35 scope extension; the web.favicon KEY is untouched"
  - "AnimatedSplashOverlay renders splash-icon.png on Colors.light.background — no stock Expo logo/glow remains"

patterns-established:
  - "Config gates must assert both the new wiring and the keys that must not move"

requirements-completed: [DS-05]

# Metrics
duration: ~35min
completed: 2026-11-04
---

# Phase 8: 08-07 Summary — icon/splash wiring

**User brand icons and splash are wired into `app.json` with a config gate, the stock Expo art is gone, and the adaptive icon is mask-safe — the two human checkpoints remain.**

## Performance

- **Duration:** ~35 min (autonomous portion) + human checkpoint pass
- **Completed:** 2026-11-04 (wiring); both human checkpoints PASSED 2026-11-04
- **Tasks:** 3 of 3 (task 2 and task 3 were `checkpoint:human-verify`, confirmed pass by user)
- **Files modified:** 13 (2 created/modified code + config, 1 re-encoded, 10 deleted)

## Accomplishments

- `expo.icon` + `ios.icon` → `./assets/images/icon.png` (1024×1024, full-bleed)
- `android.adaptiveIcon` → `backgroundColor: "#F0FDFA"`, `foregroundImage: "./assets/images/adaptive-icon.png"`; `backgroundImage`/`monochromeImage` removed
- `expo-splash-screen` → `backgroundColor: "#F0FDFA"`, `image: "./assets/images/splash-icon.png"`, `imageWidth: 180`
- `adaptive-icon.png` re-scaled: source ink was 865×807 at (89,127); now 660×616 centred at (182,204) on 1024 — inside the Android mask safe zone
- Stock art deleted: `assets/expo.icon/`, `expo-logo.png`, `logo-glow.png`, `partial-react-logo.png`, `react-logo*.png`, `expo-badge*.png`, `tutorial-web.png`, `android-icon-*`
- `AnimatedSplashOverlay` now shows `splash-icon.png` (180×180) on `Colors.light.background`; the unused `AnimatedIcon` export and CSS module were removed
- `scripts/verify-app-assets.mjs` created — 21 assertions, exit 0

## Files Created/Modified

- `app.json` — icon/adaptive/splash rewiring only; package, experiments, plugins, favicon key untouched
- `scripts/verify-app-assets.mjs` — path existence, D-34 literals, D-35 favicon key, stock-art absence, untouched keys
- `assets/images/adaptive-icon.png` — re-encoded to the 660 px safe zone
- `src/components/animated-icon.tsx` — brand splash overlay on the teal token
- `src/components/animated-icon.web.tsx` — now a no-op (as before) without stock requires
- deleted: `src/components/animated-icon.module.css`, 10 stock image files, `assets/expo.icon/`

## Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx expo-doctor` | 20/20 checks passed |
| `node scripts/verify-app-assets.mjs` | 21/21 PASS, exit 0 |
| `node scripts/verify-contrast.mjs` | all critical pairs ≥ 4.5:1, exit 0 |
| `node scripts/verify-tab-shell.mjs` | 20/20 PASS, exit 0 |
| `npx expo run:android` (native rebuild) | see build log — wired assets are consumed only by native generation |

## Human Checkpoints (PASSED 2026-11-04)

| Task | Requirement | Status |
|---|---|---|
| 2 — 360dp low-end Android proof (D-24) | splash teal at 360dp, launcher icon/adaptive mask, per-screen clipping/overlap, keyboard-open Save, slow-load skeletons | ✅ PASS — user-confirmed on a real 360dp low-end Android device |
| 3 — both-modes sweep (D-40/D-41) | 10 routes × light/dark screenshots + transient rows (skeleton, §7.5 empty, export success, form validation, restore warning, load error) | ✅ PASS — user-confirmed on-device sweep, 2026-11-04 |

Evidence note: both checkpoints were confirmed by the user during `/gsd-verify-work 8` (2026-11-04). Screenshots were reviewed on-device; no image files were committed to the repo. The UAT record is `.planning/phases/08-polish-edge-cases/08-UAT.md` (tests 10–12).

## Decisions Made

- Favicon: the regenerated 48×48 file stays. D-35 defers the **web icon scope**; the `web.favicon` key is unchanged and the gate asserts that key. Recorded as a deliberate scope extension (user-approved 2026-11-04).
- Adaptive icon keeps a flat token background colour rather than the previous background/monochrome image pair (user instruction; also removes the stock art dependency).
- The splash overlay uses the same art and background as the native splash so the handoff is seamless.

## Deviations from Plan

- **Plan said** wire `android.adaptiveIcon.{foregroundImage,backgroundImage,monochromeImage}`; **executed** foreground + backgroundColor only (user instruction 2026-11-04). Gate updated to assert the absence of the removed keys.
- **Plan said** keep the stock `AnimatedSplashOverlay` assets; deleting `expo-logo.png`/`logo-glow.png` would break the Metro build, so the overlay was repointed to `splash-icon.png` and its dead sibling export removed.
- **Plan said** assets would be placed as `hazra-icon*.png`; the user supplied `icon.png`, `adaptive-icon.png`, `splash-icon.png` instead. Names used as supplied.

## Issues Encountered

- The generated `adaptive-icon.png` was not mask-safe (865×807 ink). Re-encoded with a high-quality bicubic scale into the 660×660 centre.
- `npx expo install --fix` bumped 6 packages and `expo`/`expo-constants`; doctor now passes 20/20.

## Next Phase Readiness

- Phase 8 code work is complete and both human checkpoints passed 2026-11-04; `/gsd-verify-work 8` recorded 12/12 UAT tests passing.
- Phase 9 (Build & Ship) inherits: the older deferred device proofs from Phases 2, 6 and 7, plus the stock tab-icon placeholders (`tabIcons/explore.png` reused for Attendance/Workers/Reports).
- Phase 8's security review (`/gsd-secure-phase 8`) has not run; config has `security_enforcement: true`.

---
*Phase: 08-polish-edge-cases*
*Completed: 2026-11-04 (both human checkpoints passed)*
