This is an Expo/React Native mobile application (Expo SDK 58, React Native 0.88, React 19.3, TypeScript strict) targeting iOS, Android, and web. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Product status: implemented through Phase 7, Phase 8 checkpoints open

The offline attendance-register product **is implemented** in `src/`: worksites, workers, the daily attendance register (status pills + notes), worker profiles/history, Home dashboard, reports, CSV/PDF export, and backup/restore. It is no longer the Expo starter.

`.planning/` is the source of truth:
- `.planning/STATE.md` — decisions, deferred verification debt, next action
- `.planning/ROADMAP.md` — 9 phases and requirement mapping
- `.planning/phases/NN-*/` — PLAN / SUMMARY / UAT / VERIFICATION artifacts
- Phase 8 plans are all executed; 08-07's 360dp device proof, both-modes sweep and the Phase 8 SUMMARY backfill are outstanding. Phase 9 (Build & Ship) is not started.

Doc caveats:
- `build_plan.md` is stale. It claims the repo has "no `package.json`, no `app.json`, no scaffold" — false. It also plans a **different stack** (React Navigation + JavaScript/JSDoc + `src/theme|db|navigation|screens|utils`). The real repo uses **Expo Router + TypeScript strict** with `src/constants/theme.ts` for tokens. Do **not** execute `build_plan.md` literally (no scaffold-from-scratch, no React Navigation, no parallel `src/theme`).
- `design.md`'s color tokens are the product visual contract, but its file paths (`theme/colors.js`) are aspirational. Map tokens into the real structure.
- When docs and code/config disagree, trust the code and config.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v58.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This repo uses npm (`package-lock.json`; no `bun.lock`). Use `npx`/`npm`, not bun.

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server; press w/i/a for web/ios/android
npx expo run:android        # development build (required for sqlite/print/sharing and for icon/splash changes)
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions

node scripts/verify-app-assets.mjs   # icon/splash wiring gate (paths exist, D-34 teal, D-35 favicon key)
node scripts/verify-contrast.mjs     # WCAG ≥4.5:1 across both modes + focus-ring lockstep
node scripts/verify-tab-shell.mjs    # 4-tab navigation contract
```

- There is no test runner, CI, or `eas.json` in this repo.
- ESLint is not installed or configured; `npm run lint` / `npx expo lint` prompts interactively to set it up (it is not a clean pass yet).
- `npm run reset-project` is destructive — it deletes or moves `src/` and `scripts/`. Do not run it.
- Run typecheck before declaring any task done.

## Routing & layout

- `src/app/` is routes only (Expo Router file-based):
  - `(tabs)/` — `index.tsx` (Home), `attendance.tsx`, `workers.tsx`, `reports.tsx`; `(tabs)/_layout.tsx` mounts `AppTabs`
  - drill-downs — `worksites.tsx`, `worksite-form.tsx`, `worker-form.tsx`, `worker/[id].tsx`, `export.tsx`, `backup.tsx`, registered in the root `src/app/_layout.tsx` `<Stack>`
  - the root layout gates rendering on SQLite init + Inter fonts, renders an error/retry screen on boot failure, and mounts `AnimatedSplashOverlay`
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
- `useColorScheme()` from react-native can return `null`, `'light'` or `'dark'` (RN 0.88 types have no `'unspecified'`); normalize with `scheme === 'dark' ? 'dark' : 'light'`. Prefer `useTheme()` from `@/hooks/use-theme` over reading `Colors` directly.
- Design tokens live in `src/constants/theme.ts`: `Colors`, `Spacing` (named scale, e.g. `Spacing.three` = 16), `Type`, `Radius`, `Fonts`, plus `BottomTabInset` and `MaxContentWidth` for safe tab/content sizing. Use tokens instead of hardcoding values.
- Icon/splash wiring is in `app.json` pointing at `assets/images/{icon,adaptive-icon,splash-icon}.png`; splash and adaptive-icon background are the light `background` token `#F0FDFA` (D-34). `scripts/verify-app-assets.mjs` gates it. Native icon/splash changes only appear after a rebuild (`npx expo run:android|ios`), not a Metro reload. `adaptive-icon.png` must keep its ink inside the 660×660 centre safe zone of the 1024 canvas.
- `src/global.css` (imported by `theme.ts`) defines the `--font-*` CSS variables used only on web.

## Generated & native files

- `ios/`, `android/`, `.expo/`, `dist/`, and `expo-env.d.ts` are generated and gitignored. Never create or edit `ios/`/`android/` by hand — configure native behavior in `app.json` and config plugins (Continuous Native Generation).
- Expo Go only includes its bundled native modules. After adding a library with native code (e.g. `expo-sqlite` for the planned product), the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Use EAS to build, sign, submit, and ship OTA updates from the cloud (`eas build`, `eas submit`, `eas update`); run the CLI as `npx eas-cli@latest <command>`. Docs: https://docs.expo.dev/eas/index.md
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
