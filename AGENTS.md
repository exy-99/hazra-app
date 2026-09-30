This is an Expo/React Native mobile application (Expo SDK 57, React Native 0.86, React 19, TypeScript strict) targeting iOS, Android, and web. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## The running app is still the Expo starter — the attendance product is only planned

`PRD_Attendance_App.md`, `design.md`, and `build_plan.md` describe an intended offline attendance-register app. **None of it is implemented.** The app on disk is the stock Expo starter: `src/app/index.tsx` ("Welcome to Expo") and `src/app/explore.tsx`.

Before implementing any product feature, know these docs are not a description of the current system:
- `build_plan.md` is stale. It claims the repo has "no `package.json`, no `app.json`, no scaffold" — false now. It also plans a **different stack** than what exists (React Navigation + JavaScript/JSDoc + `src/theme|db|navigation|screens|utils`). The real repo uses **Expo Router + TypeScript strict** with `src/constants/theme.ts` for tokens. Do **not** execute `build_plan.md` literally (e.g. don't scaffold from scratch, don't install React Navigation, don't add a parallel `src/theme`).
- `design.md`'s color tokens are the product visual contract, but its file paths (`theme/colors.js`) are aspirational. Map the tokens into the real structure rather than creating a second theme system.
- When the docs and the code/config disagree, trust the code and config. Reconcile with the actual structure before writing code.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This repo uses npm (`package-lock.json`; no `bun.lock`). Use `npx`/`npm`, not bun.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server; press w/i/a for web/ios/android
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

- There is no test runner, CI, or `eas.json` in this repo.
- ESLint is not installed or configured; `npm run lint` / `npx expo lint` prompts interactively to set it up (it is not a clean pass yet).
- `npm run reset-project` is destructive — it deletes or moves `src/` and `scripts/`. Do not run it.
- Run typecheck before declaring any task done.

## Routing & layout

- `src/app/` is routes only (Expo Router file-based). Screens: `index.tsx` (Home), `explore.tsx` (Explore); `_layout.tsx` wraps everything in `ThemeProvider` + `AppTabs`.
- Keep components, hooks, and constants in `src/` outside `src/app/`.
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*`. Use these rather than deep relative paths.
- Styling uses React Native `StyleSheet` + the token constants — there is no Tailwind/NativeWind.

## Platform-split components

Tabs and several components have separate native and web implementations selected by filename, not `Platform.OS`:

- `app-tabs.tsx` uses `expo-router/unstable-native-tabs` (`NativeTabs`); `app-tabs.web.tsx` uses `expo-router/ui`.
- Same pattern in `use-color-scheme.ts` / `.web.ts` and `animated-icon.tsx` / `.web.tsx`.

Follow the `.web.tsx` file split when adding platform behavior. Note the native tabs API is under an `unstable-` import path and may change. Native tab triggers reference route names directly (`<NativeTabs.Trigger name="index">`), so adding a screen means adding the route file **and** a trigger.

## Config & theme quirks

- `app.json` enables `typedRoutes` and `reactCompiler`. Typed routes make route hrefs typechecked (types regenerate while `expo start` runs). The React Compiler is on, so avoid unnecessary manual `useMemo`/`useCallback`.
- `useColorScheme()` from react-native can return `'unspecified'`; existing code normalizes to `'light'`. Prefer `useTheme()` from `@/hooks/use-theme` over reading `Colors` directly.
- Design tokens live in `src/constants/theme.ts`: `Colors`, `Spacing` (named scale, e.g. `Spacing.three` = 16), `Fonts`, plus `BottomTabInset` and `MaxContentWidth` for safe tab/content sizing. Use tokens instead of hardcoding values.
- `src/global.css` (imported by `theme.ts`) defines the `--font-*` CSS variables used only on web.

## Generated & native files

- `ios/`, `android/`, `.expo/`, `dist/`, and `expo-env.d.ts` are generated and gitignored. Never create or edit `ios/`/`android/` by hand — configure native behavior in `app.json` and config plugins (Continuous Native Generation).
- Expo Go only includes its bundled native modules. After adding a library with native code (e.g. `expo-sqlite` for the planned product), the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Use EAS to build, sign, submit, and ship OTA updates from the cloud (`eas build`, `eas submit`, `eas update`); run the CLI as `npx eas-cli@latest <command>`. Docs: https://docs.expo.dev/eas/index.md
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
