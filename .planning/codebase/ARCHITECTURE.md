<!-- refreshed: 2026-10-02 -->
# Architecture

**Analysis Date:** 2026-10-02

> **Current state:** this is the stock Expo starter, not the planned attendance product. It renders two demo screens with a theme system and platform-split tabs. There is no data layer, state store, or network code. The planned product is noted at the end under "Planned Architecture (not implemented)".

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Expo Router entry                         │
│              `expo-router/entry` (package.json)              │
├──────────────────────────┬──────────────────────────────────┤
│   Route: Home            │   Route: Explore                  │
│   `src/app/index.tsx`    │   `src/app/explore.tsx`           │
└────────────┬─────────────┴───────────────┬──────────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Root layout — ThemeProvider + splash + tabs                 │
│  `src/app/_layout.tsx`                                       │
│    ├── `src/components/animated-icon.tsx` (splash overlay)   │
│    └── `src/components/app-tabs.tsx` / `.web.tsx` (nav)      │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Presentation primitives + theme system                      │
│  `src/components/themed-text.tsx`, `themed-view.tsx`,        │
│  `src/constants/theme.ts`, `src/hooks/use-theme.ts`,         │
│  `src/hooks/use-color-scheme.ts` / `.web.ts`                 │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Static assets — `assets/images/*`                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Wraps app in `ThemeProvider`, mounts splash overlay and tab navigator | `src/app/_layout.tsx` |
| Home screen | Demo landing screen: hero icon, "Welcome to Expo", hint rows | `src/app/index.tsx` |
| Explore screen | Demo scrollable content with `Collapsible` sections and web badge | `src/app/explore.tsx` |
| App tabs (native) | `NativeTabs` from `expo-router/unstable-native-tabs`; triggers `index` and `explore` | `src/components/app-tabs.tsx` |
| App tabs (web) | `Tabs`/`TabList`/`TabTrigger` from `expo-router/ui` with custom tab list | `src/components/app-tabs.web.tsx` |
| Animated splash / icon | Keyframe entrance animations and splash overlay lifecycle | `src/components/animated-icon.tsx` / `.web.tsx` |
| Theme hook | Resolves `Colors[light|dark]`; normalizes `'unspecified'` → `'light'` | `src/hooks/use-theme.ts` |
| Color-scheme hook | Native re-export; web hydration-safe wrapper | `src/hooks/use-color-scheme.ts` / `.web.ts` |
| Theme tokens | `Colors`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth` | `src/constants/theme.ts` |
| Themed text | Typographic variants + token-based color | `src/components/themed-text.tsx` |
| Themed view | Token-based background color | `src/components/themed-view.tsx` |
| External link | Opens URLs in-app browser on native, new tab on web | `src/components/external-link.tsx` |
| Collapsible | Animated disclosure section (`reanimated` `FadeIn`) | `src/components/ui/collapsible.tsx` |
| Hint row | Label + code-snippet row | `src/components/hint-row.tsx` |
| Web badge | Version + Expo badge image (web only in practice) | `src/components/web-badge.tsx` |

## Pattern Overview

**Overall:** File-based routing (Expo Router) with a small presentational component library and a platform-split theming layer.

**Key Characteristics:**
- Routes are files under `src/app/`; non-route code lives in `src/components`, `src/hooks`, `src/constants`.
- Platform behavior is selected by **filename split** (`.web.tsx`), not `Platform.OS` branching — except for small inline checks (e.g. `Platform.OS === 'web'` in `src/app/index.tsx`).
- Central design tokens consumed through hooks (`useTheme()`) and typed props (`ThemedTextProps.themeColor`, `ThemedViewProps.type`), never hardcoded colors in screens.
- Route names in native tabs are referenced directly, so adding a screen requires both a route file and a `<NativeTabs.Trigger name="...">` entry.

## Layers

**Routing layer:**
- Purpose: Declare screens and navigation.
- Location: `src/app/`
- Contains: `_layout.tsx`, route screens (`index.tsx`, `explore.tsx`).
- Depends on: components, theme.
- Used by: Expo Router entry (`expo-router/entry`).

**Component layer:**
- Purpose: Reusable presentational building blocks.
- Location: `src/components/`
- Contains: themed primitives, tabs, animated icon, links, `ui/collapsible.tsx`.
- Depends on: theme constants/hooks, `expo-image`, `expo-symbols`, `react-native-reanimated`.
- Used by: route screens and `_layout.tsx`.

**Theming / constants layer:**
- Purpose: Single source of design tokens and color-scheme resolution.
- Location: `src/constants/theme.ts`, `src/hooks/`
- Contains: `Colors`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth`; `useTheme`, `useColorScheme`.
- Depends on: `react-native` `Platform`/`useColorScheme`, `src/global.css` (web fonts).
- Used by: all components.

**Scripts layer:**
- Purpose: One-off project maintenance (not shipped).
- Location: `scripts/reset-project.js`
- Contains: interactive reset of `src/` and `scripts/` to a blank app.
- Depends on: Node `fs`, `path`, `readline`.
- Used by: `npm run reset-project` (destructive; do not run per `AGENTS.md`).

## Data Flow

### Screen render path

1. `expo-router/entry` loads routes; typed routes are generated from `src/app/` while `expo start` runs.
2. `src/app/_layout.tsx:10` mounts `ThemeProvider` with `DarkTheme`/`DefaultTheme` selected by `useColorScheme()`.
3. `src/app/_layout.tsx:14` renders `AnimatedSplashOverlay`, then `src/app/_layout.tsx:15` renders `AppTabs`.
4. `AppTabs` resolves to the native (`src/components/app-tabs.tsx`) or web (`src/components/app-tabs.web.tsx`) implementation by platform extension.
5. The active route (`src/app/index.tsx` or `src/app/explore.tsx`) renders using `ThemedView`/`ThemedText` + `Spacing` tokens.

### Theme resolution

1. `useTheme()` (`src/hooks/use-theme.ts:9`) calls `useColorScheme()`.
2. Native: `src/hooks/use-color-scheme.ts` re-exports react-native's `useColorScheme`.
3. Web: `src/hooks/use-color-scheme.web.ts` returns `'light'` until hydration, then the real scheme (static-render safety).
4. `'unspecified'` is normalized to `'light'` in `useTheme` and repeated inline in `app-tabs.tsx` / `app-tabs.web.tsx`.
5. Result is `Colors[theme]`, consumed by `ThemedText`/`ThemedView` and tab colors.

### Splash lifecycle (native)

1. `_layout.tsx:8` calls `SplashScreen.preventAutoHideAsync()`.
2. `AnimatedSplashOverlay` (`src/components/animated-icon.tsx:11`) renders a `View` on first layout; `onLayout` hides the native splash then flips to the animated `Keyframe` overlay.
3. A worklet callback uses `scheduleOnRN(setVisible, false)` (`animated-icon.tsx:43`) to unmount the overlay when the exit animation finishes.
4. Web implementation is a no-op (`src/components/animated-icon.web.tsx:8`).

**State Management:**
- Local React `useState` only (`animated-icon.tsx`, `ui/collapsible.tsx`). No context store, Redux, Zustand, or React Query.

## Key Abstractions

**Theme tokens:**
- Purpose: Central color/spacing/typography contract.
- Examples: `src/constants/theme.ts` (`Colors`, `Spacing`, `Fonts`).
- Pattern: `as const` objects + derived TS types (`ThemeColor`).

**Themed primitives:**
- Purpose: Apply theme without hardcoded values.
- Examples: `src/components/themed-text.tsx`, `src/components/themed-view.tsx`.
- Pattern: Props (`type`, `themeColor`) index into the active theme object.

**Platform-split module:**
- Purpose: Provide different implementations per platform via file extension.
- Examples: `app-tabs.{tsx,web.tsx}`, `animated-icon.{tsx,web.tsx}`, `use-color-scheme.{ts,web.ts}`.
- Pattern: Identical export names; Metro resolves `.web.*` for web.

## Entry Points

**Expo Router entry:**
- Location: `expo-router/entry` (declared as `package.json` `"main"`).
- Triggers: `npx expo start` → web/iOS/Android.
- Responsibilities: Discover routes in `src/app/`, hydrate typed routes, render root layout.

**Root layout:**
- Location: `src/app/_layout.tsx`
- Triggers: Rendered by Expo Router before any route.
- Responsibilities: Theme provider, splash control, tab navigator mount.

**Reset script:**
- Location: `scripts/reset-project.js`
- Triggers: `npm run reset-project` (manual, destructive).
- Responsibilities: Move/delete `src/` + `scripts/`, scaffold blank `src/app`.

## Architectural Constraints

- **Threading:** Single JS thread (React Native default). Reanimated worklets run on the UI thread; `scheduleOnRN` (`animated-icon.tsx:43`) is the only worklet→JS bridge in use.
- **Global state:** Module-level constants only — `Colors`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth` (`src/constants/theme.ts`), and `SplashScreen.preventAutoHideAsync()` at module load (`_layout.tsx:8`). No mutable shared singletons.
- **Circular imports:** None observed. Dependency direction is one-way: routes → components → hooks/constants.
- **Native config:** Native projects are generated (CNG); `ios/` and `android/` are gitignored. Configure native behavior in `app.json` and config plugins, never by editing native folders.
- **Typed routes:** Route hrefs are typechecked; `.expo/types` must be regenerated by a running dev server after adding routes.
- **React Compiler:** Enabled; avoid manual memoization that the compiler already handles.

## Anti-Patterns

### Duplicating color-scheme normalization

**What happens:** `'unspecified'` → `'light'` logic is written twice more, inline, outside the hook: `src/components/app-tabs.tsx:8` and `src/components/app-tabs.web.tsx:52`.
**Why it's wrong:** The rule lives in three places; a future change (e.g. new scheme value) can be missed, producing inconsistent colors between screens and tabs.
**Do this instead:** Route all color-scheme reads through `src/hooks/use-theme.ts` (or export a normalizing helper) so there is a single source of truth.

### Creating a parallel theme system

**What happens:** `design.md` references `theme/colors.js` and `build_plan.md` references `src/theme`, which do not exist.
**Why it's wrong:** A second theme system would fragment tokens and break `useTheme()`, which every component depends on.
**Do this instead:** Extend `src/constants/theme.ts` and consume through `useTheme()` (`src/hooks/use-theme.ts`), per `.planning/PROJECT.md` locked decision.

### Editing generated native folders by hand

**What happens:** A temptation to hand-edit `ios/` or `android/` to add a native capability.
**Why it's wrong:** Both directories are gitignored and regenerated; edits are lost on prebuild.
**Do this instead:** Configure in `app.json` / config plugins and rebuild with `npx expo run:*` or EAS.

## Error Handling

**Strategy:** Minimal; the starter has no domain error paths and no error boundary.

**Patterns:**
- `SplashScreen.hideAsync().finally(...)` (`src/components/animated-icon.tsx:52`) guarantees the animation starts regardless of hide success.
- `scripts/reset-project.js` wraps work in `try/catch` and logs via `console.error` (lines 50–101).
- No `ErrorBoundary`, toast, or error-state UI in `src/`.

## Cross-Cutting Concerns

**Logging:** `console` only; no logging framework.
**Validation:** None. No form inputs, schema validation, or runtime type guards.
**Authentication:** None.
**Internationalization:** None; all strings are hardcoded English.
**Accessibility:** No `accessibilityLabel`/roles on icon-only controls in the starter; ROADMAP Phase 8 targets an a11y pass.

## Planned Architecture (not implemented)

Per `.planning/PROJECT.md`, `.planning/ROADMAP.md`, and `PRD_Attendance_App.md`, the product will add (do **not** assume any of this exists):
- `expo-sqlite` local schema (worksites, workers, attendance) — Roadmap Phase 1.
- Roster management with soft delete (`is_active`) — Phase 2.
- One-tap attendance marking with `(worker, date)` upsert uniqueness — Phase 3.
- Worker history + attendance-% math (`off_day` excluded, `half_day` = 0.5) — Phase 4.
- Home dashboard + reports — Phase 5.
- CSV/PDF export — Phase 6; JSON backup/restore — Phase 7.
- Build/ship via EAS with `eas.json` — Phase 9.

---

*Architecture analysis: 2026-10-02*
