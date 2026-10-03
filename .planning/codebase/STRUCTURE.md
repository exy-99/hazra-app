# Codebase Structure

**Analysis Date:** 2026-10-02

> This is the stock Expo starter layout. The planned attendance product is not implemented. Place new product code inside `src/` (outside `src/app/`), following the conventions below.

## Directory Layout

```
hazra-app/
├── .claude/                 # Editor/plugin settings (enabledPlugins: expo)
├── .planning/               # GSD project state (PROJECT, ROADMAP, REQUIREMENTS, STATE)
│   ├── codebase/            # These mapping documents (STACK/INTEGRATIONS/ARCHITECTURE/STRUCTURE)
│   └── phases/01-foundation/  # Phase 1 plans (01-01-PLAN.md, 01-02-PLAN.md)
├── .vscode/                 # Editor settings
├── assets/
│   ├── expo.icon/           # Expo icon composer source (icon.json + Assets/)
│   └── images/              # App icons, splash, logo, tab icons, tutorial images
├── scripts/
│   └── reset-project.js     # Destructive starter reset (do not run)
├── src/
│   ├── app/                 # Expo Router routes ONLY
│   │   ├── _layout.tsx      # Root layout (theme + splash + tabs)
│   │   ├── index.tsx        # Home route
│   │   └── explore.tsx      # Explore route
│   ├── components/          # Reusable UI (platform-split where needed)
│   │   ├── ui/              # Lower-level composite components
│   │   └── *.tsx / *.web.tsx
│   ├── constants/
│   │   └── theme.ts         # Design tokens
│   ├── hooks/               # Theme/color-scheme hooks
│   └── global.css           # Web font CSS variables
├── AGENTS.md                # Locked repo constraints (authoritative)
├── app.json                 # Expo config
├── CLAUDE.md                # Editor guidance
├── design.md                # Planned visual contract (aspirational paths)
├── build_plan.md            # Stale planning reference (React Navigation/JS)
├── PRD_Attendance_App.md    # Planned product source of truth
├── package.json
├── package-lock.json        # npm lockfile v3
├── tsconfig.json
└── expo-env.d.ts            # Generated, gitignored
```

Generated/ignored (do not edit): `.expo/`, `node_modules/`, `dist/`, `web-build/`, `/ios`, `/android`, `expo-env.d.ts`.

## Directory Purposes

**`src/app/`:**
- Purpose: File-based routes. Expo Router turns each file into a route; `_layout.tsx` wraps them.
- Contains: Route screens and the root layout. Nothing else.
- Key files: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/explore.tsx`.

**`src/components/`:**
- Purpose: Reusable, presentational UI components shared across routes.
- Contains: Themed primitives, navigation tabs, animated splash/icon, links, badges, hint rows.
- Key files: `src/components/themed-text.tsx`, `src/components/themed-view.tsx`, `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`.

**`src/components/ui/`:**
- Purpose: Higher-level composite components built on primitives.
- Contains: `src/components/ui/collapsible.tsx`.

**`src/constants/`:**
- Purpose: Static design/configuration values.
- Contains: `src/constants/theme.ts` (`Colors`, `Fonts`, `Spacing`, `BottomTabInset`, `MaxContentWidth`).

**`src/hooks/`:**
- Purpose: Shared React hooks.
- Contains: `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-color-scheme.web.ts`.

**`scripts/`:**
- Purpose: One-off Node maintenance scripts, not shipped in the app bundle.
- Contains: `src`/`scripts` reset script `scripts/reset-project.js`.

**`assets/`:**
- Purpose: Static images and icon-composer sources referenced via `@/assets/*`.
- Contains: `assets/images/` (icons, splash, tab icons, tutorial art), `assets/expo.icon/`.

**`.planning/`:**
- Purpose: GSD project management artifacts (state, roadmap, requirements, plans, these codebase maps).

## Key File Locations

**Entry Points:**
- `package.json` (`"main": "expo-router/entry"`): App entry.
- `src/app/_layout.tsx`: Root layout; mounts theme, splash, tabs.
- `scripts/reset-project.js`: Destructive scaffold reset (manual only).

**Configuration:**
- `app.json`: Expo config — plugins, icons/splash, `scheme: "hazraapp"`, `experiments.typedRoutes` + `reactCompiler`, `web.output: "static"`.
- `tsconfig.json`: TypeScript strict + `@/*` / `@/assets/*` path aliases.
- `package.json`: Dependencies and npm scripts.
- `expo-env.d.ts`: Generated Expo type reference (gitignored).

**Core Logic:**
- `src/constants/theme.ts`: Single source of design tokens.
- `src/hooks/use-theme.ts`: Theme resolution used by all components.
- `src/components/app-tabs.tsx` / `src/components/app-tabs.web.tsx`: Navigation implementations.

**Testing:**
- Not present. No test directory, runner config, or `*.test.*` / `*.spec.*` files.

**Planning docs (not code):**
- `PRD_Attendance_App.md`: Planned product requirements.
- `design.md`: Planned visual contract; file paths inside are aspirational.
- `build_plan.md`: Stale planning reference (do not execute literally).
- `AGENTS.md`: Locked repo constraints — treat as authoritative over the PRD/build_plan where they disagree.

## Naming Conventions

**Files:**
- Routes: lowercase, kebab-case where multi-word (`index.tsx`, `explore.tsx`).
- Components/hooks: kebab-case (`themed-text.tsx`, `app-tabs.tsx`, `use-theme.ts`).
- Platform variants: `.web.tsx` / `.web.ts` suffix for the web implementation; base name for native (`app-tabs.web.tsx`, `use-color-scheme.web.ts`, `animated-icon.web.tsx`).
- CSS modules: `<component>.module.css` (`animated-icon.module.css`).

**Directories:**
- Lowercase, single word (`app`, `components`, `constants`, `hooks`, `ui`, `scripts`, `assets`).

**Aliases:**
- `@/*` → `src/*`; `@/assets/*` → `assets/*`. Use aliases instead of deep relative paths.

## Where to Add New Code

**New Route/Screen:**
- Primary code: `src/app/<name>.tsx` (plus `_layout.tsx` if a new navigator is needed).
- Then register a trigger: `<NativeTabs.Trigger name="<name>">` in `src/components/app-tabs.tsx` **and** a `<TabTrigger name="<name>" href="/<name>">` in `src/components/app-tabs.web.tsx`. Route names are referenced directly, so both must be updated.

**New Component/Module:**
- Implementation: `src/components/<name>.tsx`. Use `src/components/ui/<name>.tsx` for composites built on primitives.
- Screen-specific (non-reusable) UI stays inside the route file in `src/app/`.

**New Hook:**
- Shared helpers: `src/hooks/use-<name>.ts` (add a `.web.ts` twin only if web behavior differs).

**New Design Token:**
- Edit `src/constants/theme.ts`. Do **not** create a parallel `src/theme` (see `.planning/PROJECT.md` locked decision).

**New Static Asset:**
- Reference via `@/assets/...`; place under `assets/images/`.

**Planned product code (SQLite, roster, attendance):**
- Database/schema layer: new `src/db/` (planned; confirm in Phase 1 plan).
- Product screens: `src/app/` route files, wired into both tab implementations.
- Keep `src/app/` routes-only; all logic/components/hooks outside it.

**Tests (when added):**
- Co-locate or add a `__tests__/` directory; no existing convention to follow.

## Special Directories

**`.expo/`:**
- Purpose: Expo-generated types/metadata (e.g. typed routes).
- Generated: Yes.
- Committed: No (gitignored).

**`ios/` / `android/`:**
- Purpose: Generated native projects (Continuous Native Generation).
- Generated: Yes.
- Committed: No (gitignored). Never hand-edit; configure via `app.json`/config plugins.

**`dist/` / `web-build/`:**
- Purpose: Static web export output.
- Generated: Yes.
- Committed: No (gitignored).

**`.planning/phases/01-foundation/`:**
- Purpose: GSD phase plans for Phase 1 (Foundation & Data Layer).
- Generated: No.
- Committed: Per `.planning/config.json` `commit_docs: true`.

---

*Structure analysis: 2026-10-02*
