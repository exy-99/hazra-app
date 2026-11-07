---
phase: quick
plan: 261107-nhw
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/app-tabs.tsx
  - src/components/app-tabs.web.tsx
  - scripts/verify-tab-shell.mjs
autonomous: true
requirements: [DS-09]
user_setup: []

must_haves:
  truths:
    - "Home, Attendance, Workers, and Reports each show a distinct, recognizable icon alongside the existing label on iOS and Android"
    - "The web tab shell mirrors the same four icon meanings without replacing labels or tab accessibility semantics"
    - "Selected icons use the theme primary color and unselected icons use mutedForeground in both color schemes"
  artifacts:
    - path: "src/components/app-tabs.tsx"
      provides: "Four SDK 58 native-tab system icon mappings"
      contains: "NativeTabs.Trigger.Icon"
    - path: "src/components/app-tabs.web.tsx"
      provides: "Four Lucide icons in the custom web tab buttons"
      contains: "CalendarCheck"
    - path: "scripts/verify-tab-shell.mjs"
      provides: "Regression checks for complete native and web icon coverage"
      contains: "native icons"
  key_links:
    - from: "src/components/app-tabs.tsx"
      to: "expo-router/native-tabs"
      via: "documented NativeTabs.Trigger.Icon sf/md props"
      pattern: "NativeTabs\\.Trigger\\.Icon"
    - from: "src/components/app-tabs.web.tsx"
      to: "lucide-react-native"
      via: "each TabTrigger passes its matching icon into TabButton"
      pattern: "icon=\\{(House|CalendarCheck|Users|ChartBar)\\}"
---

<objective>
Replace the native tab shell's repeated placeholder PNG with four reliable route-specific system icons, and add matching icons to the platform-split web shell.

Purpose: Only Home currently renders a useful icon; Attendance, Workers, and Reports all reuse the old `explore.png` placeholder. The tab bar should identify all four destinations visually while retaining labels, accessibility, theme colors, and the existing navigation behavior.
Output: Complete native and web icon mappings plus a standing regression gate.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/STATE.md
@package.json
@src/components/app-tabs.tsx
@src/components/app-tabs.web.tsx
@scripts/verify-tab-shell.mjs

<interfaces>
`package.json` pins Expo `~58.0.23` and Expo Router `~58.0.30`; SDK 58 uses the stable `expo-router/native-tabs` import already present.

SDK 58 native tabs provide platform system icons directly:
```tsx
<NativeTabs.Trigger.Icon
  sf={{ default: 'house', selected: 'house.fill' }}
  md="home"
/>
```
Use `sf` for SF Symbols on iOS and `md` for Material Symbols on Android. This is preferred by the SDK 58 guide and needs no icon package or native asset generation.

The web split already owns `TabButton({ children, isFocused, ...props })`, sets `accessibilityRole="tab"`, an explicit label, and selected state, and derives active/inactive text colors from `theme.primary` / `theme.mutedForeground`. `lucide-react-native` is already a direct dependency and the app-wide web-compatible icon family.

Required implementation references (read before editing Expo Router code, per `AGENTS.md`):
- `https://docs.expo.dev/llms.txt`
- `https://docs.expo.dev/versions/v58.0.0/sdk/router/native-tabs.md`
- `https://docs.expo.dev/router/advanced/native-tabs.md#icon`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>task 1: give every platform tab a distinct icon and lock the contract</name>
  <files>src/components/app-tabs.tsx, src/components/app-tabs.web.tsx, scripts/verify-tab-shell.mjs</files>
  <read_first>
    - package.json (confirm Expo major 58 before using Router APIs)
    - AGENTS.md (SDK-specific documentation and platform-split rules)
    - src/components/app-tabs.tsx (preserve native trigger order, labels, and color props)
    - src/components/app-tabs.web.tsx (preserve custom tab semantics and touch targets)
    - scripts/verify-tab-shell.mjs (extend the standing gate rather than adding a new script)
    - https://docs.expo.dev/llms.txt
    - https://docs.expo.dev/versions/v58.0.0/sdk/router/native-tabs.md
    - https://docs.expo.dev/router/advanced/native-tabs.md#icon
  </read_first>
  <action>
In `src/components/app-tabs.tsx`, replace all four image `src`/`renderingMode` icon declarations and the stale `explore.png` placeholder comments with the SDK 58 documented `sf` + `md` system-symbol API. Keep one coherent outlined system family per native platform and use these route mappings: Home = SF `house` → `house.fill`, Material `home`; Attendance = SF `calendar` → `calendar.badge.checkmark`, Material `event_available`; Workers = SF `person.2` → `person.2.fill`, Material `groups`; Reports = SF `chart.bar` → `chart.bar.fill`, Material `bar_chart`. Preserve the exact `index`, `attendance`, `workers`, `reports` trigger order, visible labels, `iconColor={{ default: colors.mutedForeground, selected: colors.primary }}`, label colors, background, and indicator. Do not add a dependency, switch navigators, create native files, or retain a PNG fallback—the built-in SDK 58 symbols are the smallest fix and avoid the repeated placeholder asset path.

In `src/components/app-tabs.web.tsx`, use the already-installed Lucide family with the matching `House`, `CalendarCheck`, `Users`, and `ChartBar` icons. Add an `icon: LucideIcon` prop to `TabButton`, pass one explicit icon from each existing `TabTrigger`, and render it at a consistent 20px/2px-stroke size using the same focused/unfocused theme color as the adjacent label. Keep the text labels visible and unchanged; keep the Pressable's explicit tab role, accessible label, selected state, focus behavior, and existing padding/touch target. Mark the SVG decorative/non-focusable so it cannot duplicate the accessible tab name. Use token spacing for a compact icon/label row; add no hardcoded colors.

Extend `scripts/verify-tab-shell.mjs` (do not create another gate) to assert exactly four native `NativeTabs.Trigger.Icon` declarations, the four route-specific SF/Material mappings, zero remaining `tabIcons/` or `explore.png` references in the native tab component, and exactly one matching Lucide icon prop for each web trigger. Target JSX tokens rather than comments so the checks cannot pass on explanatory prose. Retain every existing route, theme-color, accessibility, and no-hardcoded-hex assertion.
  </action>
  <verify>
    <automated>node scripts/verify-tab-shell.mjs</automated>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>The standing tab-shell gate and strict typecheck both exit 0; native declares four distinct SDK 58 system icons with no placeholder image references; web declares four matching Lucide icons while labels, semantics, routes, and theme-driven selected/unselected colors remain intact.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Tab metadata → native navigator | Static route labels and icon identifiers are interpreted by Expo Router and the platform tab bar |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-Q261107-01 | Tampering | Native/web tab-to-icon mapping | mitigate | Keep explicit route-local mappings and extend `verify-tab-shell.mjs` to assert every route and icon exactly once. |
| T-Q261107-02 | Denial of service | Unsupported native icon/API identifier | mitigate | Use only SDK 58 documented `sf`/`md` props, identifiers present in installed types, then run strict TypeScript and the standing shell gate. |
| T-Q261107-03 | Information disclosure | Web accessibility announcement | accept | Icons carry no data; keep the existing explicit tab label/state and hide decorative SVGs from assistive technology to avoid duplicate names. |
</threat_model>

<verification>
1. `node scripts/verify-tab-shell.mjs` exits 0 with the new four-icon native/web assertions and all prior navigation/accessibility/color checks.
2. `npx tsc --noEmit` exits 0.
3. Runtime smoke check in the existing development build: inspect Home, Attendance, Workers, and Reports on Android and iOS; all four icons are visible and distinct, tapping each still navigates correctly, selected is primary, inactive is muted, and labels remain visible in light and dark mode.
4. Web smoke check via `npx expo start --web`: the same four icon meanings appear beside their labels; keyboard focus and tab semantics remain unchanged.
</verification>

<success_criteria>
- All four native bottom-navigation destinations display distinct, recognizable icons instead of only Home showing a useful icon.
- The platform-split web navigation has matching Lucide icons without losing labels or accessibility semantics.
- No dependency, native generated file, route behavior, tab order, touch target, or hardcoded color is introduced.
- `node scripts/verify-tab-shell.mjs` and `npx tsc --noEmit` pass.
</success_criteria>

<output>
After completion, create `.planning/quick/261107-nhw-i-want-to-add-the-bottom-nav-icons-only-/261107-nhw-SUMMARY.md`.
</output>
