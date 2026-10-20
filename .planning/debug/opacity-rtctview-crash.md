---
status: resolved
trigger: "\"error while updating property 'opacity ' of a view managed by : RTCTView\" red-screen crash on Android launch; user asked why it happens"
created: 2026-10-19T00:00:00Z
updated: 2026-10-19T00:15:00Z
---

## Current Focus

hypothesis: CONFIRMED. A React Native `AnimatedInterpolation` node (a JS object, not a number) is being passed as `opacity` to plain `<View>` elements in three loading skeletons. RN only unwraps animated nodes for `Animated.View`; a plain `View` forwards the object to Android, where the native `opacity` prop setter cannot cast it to a float and throws the exact quoted message.
test: Static proof from installed sources (stack trace not required): (1) the only non-numeric `opacity` values in the repo are these three files; (2) NativeTabs mounts all tab screens eagerly at launch, so the Attendance and Workers skeletons render during the splash; (3) RN Android applies native props through `ViewManager.updateProperties` → `GenericViewManagerDelegate` → `ViewManagersPropertyCache`, whose `FloatPropSetter` casts to `Double` and wraps any failure in the observed message.
expecting: Replacing the pulsing plain `View`s with `RNAnimated.View` removes the non-numeric value and the crash; static 0.55 still applies under reduced motion.
next_action: Fix applied (8 elements across 3 files). `npx tsc --noEmit` exits 0. User should rebuild/reload the dev client to confirm the red screen is gone.

## Symptoms

expected: App launches and shows the Home tab after the splash overlay.
actual: Android red-screen crash (app unusable/closed).
errors: "error while updating property 'opacity ' of a view managed by : RTCTView"
timeline: Started after the recent Phase 8 UI changes; Android only.
reproduction: Launch the Android dev build; crash appears during/just after splash.

## Eliminated

- Home screen skeleton (`src/app/(tabs)/index.tsx:42-64`): every style value is a numeric token or a static hex color; no animated opacity. Home cannot produce this error even though it is the first focused tab.
- Reanimated `FadeIn`/`FadeOut`/`LinearTransition` wrappers and the splash `Keyframe` (`src/components/animated-icon.tsx`): all opacity values are numeric literals inside keyframes applied to `Animated.View` (Reanimated), which is the supported path. `animated-icon.tsx` was not touched by the recent Phase 8 commits.
- All other `opacity` usages in `src/` (90 matches): ternaries such as `pressed ? 0.85 : 1`, `pending ? 0.6 : ...`, `0.5` disabled states — always numeric.
- Corrupt/renamed native view manager: there is no `RTCTView` anywhere in `node_modules`; the real manager name is `RCTView` (`ViewProps.kt:16`). The reported name is a transcription artifact.
- "The animation is not running": irrelevant. The crash is not caused by the animation running; it is caused by the animated *node object* being rendered as a style value.

## Evidence

- timestamp: 2026-10-19T00:00:00Z
  checked: node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/uimanager/ViewManagersPropertyCache.java:80-103
  found: This exact message is constructed only when a legacy ViewManager setter invocation throws while applying a prop; the trailing name is `viewManager.getName()`.
  implication: The view's `opacity` prop received a value the native setter could not convert (object/string), not a normal number. RN registers the generic view manager as `RCTView`; no manager named `RTCTView` exists in any installed source, so the reported name is a transcription/OCR artifact of `RCTView`.
- timestamp: 2026-10-19T00:00:00Z
  checked: repo-wide `opacity` usages (90 matches) across src/
  found: All are numeric literals/booleans except `const opacity = reduced ? 0.55 : pulseOpacity` fed to three plain `<View>`s: src/app/(tabs)/attendance.tsx:155-162, src/app/(tabs)/workers.tsx:113-122, src/app/worksites.tsx:100-110. `pulseOpacity` is `pulseValue.interpolate(...)`, and the animation uses `useNativeDriver: true` while the Views are plain `View` (not `Animated.View`).
  implication: When `reduced` is false (the default), an Animated node object is serialized into the native `opacity` prop. RN Animated does not drive plain Views, so the value is never a number -> native conversion throws the observed error.
- timestamp: 2026-10-19T00:10:00Z
  checked: `git log -S"pulseOpacity" -- src` and `git show 94f346f`
  found: The pulse was introduced by commit 94f346f "feat(08-02): card-matched skeletons..." which added `Animated as RNAnimated`, the interpolated opacity and plain `<View>` consumers in all three files. `git log --oneline` places it 4 commits before HEAD.
  implication: Matches the user's "started after recent changes" timeline exactly.
- timestamp: 2026-10-19T00:10:00Z
  checked: RN Android prop application path in 0.86.3 (new architecture enabled): SurfaceMountingManager.kt:683, ViewManager.java:97-104/128, ViewManagerPropertyUpdater.kt:148-189, ViewManagersPropertyCache.java:252-256
  found: Fabric mounting calls `viewState.viewManager.updateProperties(view, currentProps)`. `ReactViewManager` does not provide a generated delegate, so `ViewManager.getDelegate()` returns `GenericViewManagerDelegate` -> `FallbackViewManagerSetter` -> the annotated `@ReactProp` setters in `ViewManagersPropertyCache`. The `opacity` setter is `FloatPropSetter.getValueOrDefault`, which does `(Float) ((Double) value).floatValue()`; a non-Double throws `ClassCastException`, caught at line 95 and rethrown as "Error while updating property 'opacity' of a view managed by: RCTView".
  implication: The exact quoted error is reproducible on Android under the new architecture through the Java ViewManager delegate path. It confirms that a non-numeric `opacity` reached the native view.
- timestamp: 2026-10-19T00:10:00Z
  checked: why the crash happens at launch rather than when visiting the tabs: expo-router NativeTabs (`NativeTabsView.android.js:19,33-49`), `NativeTabsView.shared.js:68-78`, react-native-screens `TabsScreen.android.tsx:56-70`
  found: Every tab is turned into a `Tabs.Screen` whose `children` include `contentRenderer()`; the Android `TabsScreen` renders `{children}` directly. All four tab screens mount with the navigator, not on first focus.
  implication: The Attendance and Workers loading skeletons mount during app startup while the splash overlay is up. `useReducedMotion` initialises to `false` and only resolves asynchronously, so the very first render always uses the Animated node — even for users with reduced motion enabled. This explains "on app launch / splash".
- timestamp: 2026-10-19T00:10:00Z
  checked: React Native Animated unwrapping semantics (Animated nodes vs plain host components) and the animated style payload path
  found: Animated values are only resolved by `createAnimatedComponent`/`AnimatedProps` when the host component is an `Animated.*` component. A plain `View` has no `AnimatedProps`, so the node object is handed to the renderer as a style value; `useNativeDriver: true` only controls how an attached animation ticks and does not convert the node.
  implication: The defect is the component type, not the driver flag. Switching the pulsing elements to `RNAnimated.View` is the minimal, idiomatic fix.

## Resolution

root_cause: The loading-skeleton pulse in `src/app/(tabs)/attendance.tsx`, `src/app/(tabs)/workers.tsx` and `src/app/worksites.tsx` assigns an `AnimatedInterpolation` object (`pulseValue.interpolate(...)`) to the `opacity` style of plain `<View>` components. React Native only resolves animated nodes for `Animated.View`; a plain View forwards the object to Android, where the `opacity` prop setter expects a number, fails to cast it to a float and throws "Error while updating property 'opacity' of a view managed by: RCTView". All tab screens mount eagerly at startup, so it crashes during/just after the splash.
fix: Replaced the eight pulsing plain `<View>` elements with `RNAnimated.View` from `react-native` (`Animated as RNAnimated`), preserving the reduced-motion static `0.55` path and the existing `useNativeDriver: true` animation. Files/lines: src/app/(tabs)/attendance.tsx:160-162, src/app/(tabs)/workers.tsx:121-122, src/app/worksites.tsx:108-110.
verification: `npx tsc --noEmit` exits 0 (TSC_EXIT=0). Static verification: no remaining non-numeric `opacity` is passed to a plain host component anywhere in src/. Runtime confirmation requires reloading/rebuilding the Android dev client (not possible from this session).
files_changed:
  - src/app/(tabs)/attendance.tsx
  - src/app/(tabs)/workers.tsx
  - src/app/worksites.tsx
