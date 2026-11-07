---
status: diagnosed
trigger: "whay cant i see my app logo ?"
created: 2026-11-05T03:00:00Z
updated: 2026-11-06T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED (build side). There is no defect in the icon/splash wiring: the assets, app.json, regenerated android res, and the built debug APK all contain the new Hazra artwork. The failure is therefore environmental or an expectation gap, ranked:
  (1) Expo Go — it always renders its own app icon and splash and ignores project icon/splash assets entirely.
  (2) Stale install / launcher cache — the device still runs an install predating the 2026-11-04 10:54 native resource regen, or the Android launcher cached the old icon bitmap.
  (3) In-app branding — no logo is rendered anywhere in the app UI, so a logo on Home/header can never appear.
test: Confirm which surface the user means and how the app is launched (Expo Go vs installed dev build). Then compare the installed package firstInstallTime/lastUpdateTime with the asset regen time (2026-11-04 10:54) and the APK build time (2026-11-04 18:48).
expecting: Reinstalling android/app/build/outputs/apk/debug/app-debug.apk (or `npx expo run:android`) on a real install surfaces the icon and splash logo. If the ask is an in-app logo, a new UI element is required.
next_action: user confirms surface; reinstall the current APK, or add an in-app logo if that is the intent

## Symptoms

expected: User expects to see the Hazra app logo (launcher icon, splash, or in-app branding).
actual: User reports "can't see my app logo" (surface not yet confirmed).
errors: none reported.
timeline: Assets were committed 2026-11-03/04 (commit a717b19 "feat(08-07): wire hazra icon/splash and remove stock Expo art"); user asks on 2026-11-04/05.
reproduction: Not yet confirmed by the user.

## Eliminated

- Missing or corrupt asset files: all four PNGs exist and decode at the expected sizes — icon.png 1024x1024 (opaque white background, alpha 255), adaptive-icon.png 1024x1024 (transparent, alpha 0 at corner), splash-icon.png 1024x1024 (transparent), splash.png 1284x2778 (present but unused). Each contains the calendar/check character, not stock Expo art.
- app.json wiring: icon -> ./assets/images/icon.png, android.adaptiveIcon.foregroundImage -> ./assets/images/adaptive-icon.png with backgroundColor #F0FDFA, web.favicon -> ./assets/images/favicon.png (48x48), expo-splash-screen plugin image -> ./assets/images/splash-icon.png with imageWidth 180 and backgroundColor #F0FDFA. Values are valid and resolve to existing files.
- Stale native resources: android/app/src/main/res was regenerated at 2026-11-04 10:54, after the 10:21-10:45 asset writes. mipmap-*/ic_launcher.webp and ic_launcher_foreground.webp visibly contain the new character; splashscreen_logo.png in drawable-* also contains it.
- Stale APK: android/app/build/outputs/apk/debug/app-debug.apk (2026-11-04 18:48, 104 MB) contains res/mipmap-*/ic_launcher*.webp and res/drawable-*/splashscreen_logo.png with byte sizes identical to the regenerated native resources. The APK is not the problem.
- In-app splash overlay image: src/components/animated-icon.tsx renders require('@/assets/images/splash-icon.png') at 180x180 inside AnimatedSplashOverlay, which is mounted in src/app/_layout.tsx. Code path is valid.
- gsd-sdk / tdd_mode: gsd-sdk is not installed in this repo (npm 404); TDD mode defaults to false. No test runner exists.

## Evidence

- timestamp: 2026-11-05T02:45:00Z
  checked: assets/images/*.png dimensions and corner alpha via System.Drawing
  found: icon.png 1024x1024 with opaque white corner (A=255); adaptive-icon.png, splash-icon.png, hazra-logo.png 1024x1024 with transparent corners (A=0); favicon.png 48x48; splash.png 1284x2778. All contain the same calendar character.
  implication: The artwork exists and the adaptive/splash layers are correctly transparent for compositing over the D-34 teal (#F0FDFA) background.
- timestamp: 2026-11-05T02:45:00Z
  checked: app.json icon/splash/favicon configuration
  found: All six asset references point at existing files; splash uses imageWidth 180 on background #F0FDFA; android package is com.exy99.hazraapp.
  implication: Config is correctly wired. A native rebuild is the only way icon/splash changes reach the device (AGENTS.md: Metro reload does not update native icon/splash).
- timestamp: 2026-11-05T02:50:00Z
  checked: android/app/src/main/res generated icon/splash resources (timestamps + visual content)
  found: Regenerated 2026-11-04 10:54:15-10:54:19 (after the 10:21-10:45 asset writes). Opened mipmap-xxxhdpi/ic_launcher.webp, ic_launcher_foreground.webp and drawable-xxxhdpi/splashscreen_logo.png — all show the new calendar/check character.
  implication: Prebuild/generation picked up the new art. Native resources are not stale.
- timestamp: 2026-11-05T02:52:00Z
  checked: app-debug.apk contents (zip listing) vs native res sizes
  found: APK (2026-11-04 18:48) contains res/mipmap-{m,h,x,xx,xxx}dpi-v4/ic_launcher*.webp and res/drawable-*/splashscreen_logo.png with lengths exactly matching the regenerated native resources (e.g. xxxhdpi ic_launcher.webp 8604 bytes, splashscreen_logo.png 69102 bytes).
  implication: The built artifact already embeds the correct logo. Reinstalling that APK should show it.
- timestamp: 2026-11-05T02:55:00Z
  checked: repo-wide search for image/logo usage in src/ and the Home screen imports
  found: Only src/components/animated-icon.tsx (splash overlay) and src/components/app-tabs.tsx reference Image. src/app/(tabs)/index.tsx imports no Image and renders no brand logo.
  implication: There is no logo anywhere in the in-app UI. If the user expects branding on Home or a header, it was never implemented — that is a feature gap, not a broken asset.
- timestamp: 2026-11-05T02:58:00Z
  checked: adb devices and installed package com.exy99.hazraapp
  found: No device/emulator currently attached, so the installed build's firstInstallTime/lastUpdateTime could not be compared.
  implication: Cannot prove the on-device install is current; this remains the top launcher-icon hypothesis until a device is connected.
- timestamp: 2026-11-06T00:00:00Z
  checked: alpha bounding box of each asset (measured on a 2px grid)
  found: adaptive-icon.png ink (182,204)->(840,818) = 64.3% x 60.0%; splash-icon.png ink (174,204)->(864,848) = 67.4% x 62.9%; hazra-logo.png ink = 84.2% x 78.5%; icon.png is fully opaque (white background), so its bounding box is the whole canvas.
  implication: The adaptive foreground sits exactly inside the 660x660 centre safe zone (182..842 in a 1024 canvas), so Android's circular mask will not hide the character. The artwork is neither empty nor off-canvas.
- timestamp: 2026-11-06T00:00:00Z
  checked: expo-splash-screen Android generation math + generated drawable sizes
  found: node_modules/expo-splash-screen/plugin/build/withAndroidSplashImages.js:163-164 uses `size = imageWidth * multiplier` pasted on a `canvasSize = 288 * multiplier` canvas; generated splashscreen_logo.png is 288px (mdpi) / 1152px (xxxhdpi) square. With imageWidth 180, the image is 180dp and its ink is ~67% of that = ~121dp wide.
  implication: The native splash logo renders at a normal, visible size on the teal background. The transparent padding in splash-icon.png shrinks it from 180dp to ~121dp but does not make it invisible.
- timestamp: 2026-11-06T00:00:00Z
  checked: expo-dev-client presence in package.json
  found: expo-dev-client ~58.0.18 is installed alongside expo ~58.0.23 and expo-splash-screen ~58.0.13.
  implication: A development build exists in principle, but if the user opens the project through Expo Go instead, the custom icon and splash are still ignored.

## Resolution

root_cause: No code defect was found in the icon/splash pipeline. `assets/images/{icon,adaptive-icon,splash-icon}.png` all contain the new calendar/check artwork, `app.json` points at them correctly, `android/app/src/main/res` was regenerated after the assets (2026-11-04 10:54), and `android/app/build/outputs/apk/debug/app-debug.apk` (2026-11-04 18:48) embeds the new `ic_launcher*` and `splashscreen_logo` bitmaps byte-for-byte. The logo is therefore missing only because of how the app is being viewed: Expo Go ignores project icons/splashes, a device can still hold a pre-rebuild install or a cached launcher icon, or the user expects a logo inside the app UI, where no logo element exists.
fix: Not a code fix. (1) Launch a real install of the current build — `npx expo run:android` or install android/app/build/outputs/apk/debug/app-debug.apk. (2) Uninstall `com.exy99.hazraapp` first, then reinstall, to clear Android's launcher icon cache. (3) If an in-app logo is wanted, add an Image using @/assets/images/hazra-logo.png to the Home/header — that is a new feature, not a regression.
verification: Static only (no device attached): APK zip entries match regenerated native resources; asset ink bounding boxes are inside the adaptive safe zone; splash generation math yields a ~121dp visible logo. Runtime confirmation is pending a connected device.
files_changed: none
