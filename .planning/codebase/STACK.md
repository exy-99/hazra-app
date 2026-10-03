# Technology Stack

**Analysis Date:** 2026-10-02

## Languages

**Primary:**
- TypeScript ~6.0.3 (`typescript` devDependency; `tsconfig.json` extends `expo/tsconfig.base` with `"strict": true`) - All source under `src/`, scripts remain plain JS.

**Secondary:**
- JavaScript (CommonJS) - `scripts/reset-project.js` only.
- CSS - `src/global.css` (web font variables) and `src/components/animated-icon.module.css` (web-only gradient).

> **Planned vs actual:** `PRD_Attendance_App.md`, `design.md`, and `build_plan.md` describe an offline attendance register. That product is **not implemented**. `build_plan.md`'s stack table (React Navigation + JavaScript/JSDoc + `src/theme`) is stale. The repo is stock Expo starter code using Expo Router + TypeScript strict.

## Runtime

**Environment:**
- Expo SDK `~57.0.25` (resolved `57.0.25` in `package-lock.json`) - managed React Native runtime, CNG (no committed `ios/`/`android/`).
- React Native `0.86.3`
- React `19.2.3` / `react-dom` `19.2.3`
- Node.js: no `.nvmrc` / `.node-version` / `engines` field detected. Not pinned.

**Package Manager:**
- npm (authoritative per `AGENTS.md`; `package-lock.json` present, `lockfileVersion: 3`).
- No `bun.lock`, `yarn.lock`, or `pnpm-lock.yaml`.

## Frameworks

**Core:**
- `expo-router` `~57.0.23` - File-based routing. Entry point is `expo-router/entry` (`package.json` `"main"`). Typed routes enabled via `app.json` `experiments.typedRoutes`.
  - Native tabs: `expo-router/unstable-native-tabs` (`NativeTabs`) - `src/components/app-tabs.tsx`.
  - Web tabs: `expo-router/ui` (`Tabs`, `TabList`, `TabTrigger`, `TabSlot`) - `src/components/app-tabs.web.tsx`.
- `react-native-reanimated` `4.5.1` - Declarative `Keyframe` / `FadeIn` animations (`src/components/animated-icon.tsx`, `src/components/ui/collapsible.tsx`).
- `react-native-worklets` `0.10.1` - `scheduleOnRN` to call JS from a reanimated worklet (`src/components/animated-icon.tsx`).
- `react-native-safe-area-context` `~5.7.0` - `SafeAreaView` / `useSafeAreaInsets` (`src/app/index.tsx`, `src/app/explore.tsx`).

**Testing:**
- Not detected. No test runner, no `*.test.*` / `*.spec.*` files, no `jest.config.*` / `vitest.config.*`.

**Build/Dev:**
- `expo` CLI (`~57.0.25`) - scripts `start`, `android`, `ios`, `web`, `reset-project`, `lint` (`package.json`).
- `expo-splash-screen` `~57.0.9` - splash control + config plugin (`app.json`).
- React Compiler - enabled in `app.json` `experiments.reactCompiler`. Avoid unnecessary manual `useMemo`/`useCallback`.
- Babel / Metro: no local `babel.config.js` / `metro.config.js`; using Expo defaults.
- No `eas.json` present.

## Key Dependencies

**Actively imported in `src/`:**
- `expo-device` `~57.0.2` - device-vs-simulator dev-menu hint (`src/app/index.tsx`).
- `expo-image` `~57.0.5` - `Image` component (`src/app/explore.tsx`, `src/components/animated-icon.tsx`, `src/components/web-badge.tsx`).
- `expo-symbols` `~57.0.3` - `SymbolView` platform-mapped SF Symbols / Material icons (`src/app/explore.tsx`, `src/components/app-tabs.web.tsx`, `src/components/ui/collapsible.tsx`).
- `expo-web-browser` `~57.0.3` - in-app browser for external links (`src/components/external-link.tsx`).
- `react-native-web` `~0.21.0` - web target rendering.
- `@types/react` `~19.2.2`, `@types/react-native` `^0.72.8` - type definitions.

**Declared but NOT imported anywhere in `src/` (candidate unused / transitive-only):**
- `@expo/ui` `~57.0.20`
- `expo-glass-effect` `~57.0.4`
- `expo-constants` `~57.0.19`
- `expo-font` `~57.0.4`
- `expo-linking` `~57.0.11`
- `expo-status-bar` `~57.0.1`
- `expo-system-ui` `~57.0.4`
- `react-native-gesture-handler` `~2.32.0`
- `react-native-screens` `~4.26.0`

**Critical (product, planned — NOT installed):**
- `expo-sqlite` - locked data layer in `.planning/PROJECT.md` and `.planning/STATE.md`; requires a development build (not available in Expo Go). Do not assume it exists today.
- `@expo-google-fonts/inter` - named in ROADMAP Phase 8; not installed.

## Configuration

**Environment:**
- No `.env` files required for the current app. `.gitignore` ignores `.env*.local`. Runtime env consumed: `process.env.EXPO_OS` (Expo-injected, `src/components/external-link.tsx`).
- No required env vars for the starter.

**Build:**
- `app.json` - Expo config: `name`/`slug` `hazra-app`, `scheme` `hazraapp`, `orientation` portrait, `userInterfaceStyle` automatic; plugins `expo-router` and `expo-splash-screen`; `web.output: "static"`; `experiments.typedRoutes` + `reactCompiler`.
- `tsconfig.json` - `strict: true`; path aliases `@/*` → `./src/*`, `@/assets/*` → `./assets/*`; includes `.expo/types/**/*.ts` and `expo-env.d.ts`.
- `expo-env.d.ts` - generated, gitignored; `/// <reference types="expo/types" />`.
- No ESLint/Prettier/Biome config. `npm run lint` runs `expo lint`, which is interactive and not yet set up (`AGENTS.md`).

## Platform Requirements

**Development:**
- Node + npm; run `npx expo start` (press `w`/`i`/`a`), or `npx expo run:ios|android` for a dev build.
- Expo Go works only for the current JS-only starter. Adding native modules (e.g. `expo-sqlite`) forces a development build.
- `npx tsc --noEmit` for typecheck; `npx expo-doctor` / `npx expo install --fix` for dependency health.

**Production:**
- Targets iOS, Android, and web (`app.json` has per-platform icons/splash; `react-native-web`).
- No deployment config committed. EAS Cloud (`eas build` / `eas submit` / `eas update`) is the intended path per `AGENTS.md`, but no `eas.json` exists.
- `ios/`, `android/`, `.expo/`, `dist/`, `expo-env.d.ts` are generated and gitignored (Continuous Native Generation).

---

*Stack analysis: 2026-10-02*
