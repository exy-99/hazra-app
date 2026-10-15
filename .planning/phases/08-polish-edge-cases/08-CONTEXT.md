# Phase 8: Polish & Edge Cases - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

The app feels finished, not prototyped: every list has an exact-spec empty state, every data load shows a skeleton (no blank flash), a11y/contrast/motion verified in both modes, 44px targets + 16px gutters + FlatList discipline everywhere, Inter wired with nothing below 13px, and icon + splash shipped via `app.json` verified at 360dp on low-end Android. Polish only — any behavior fix found becomes a noted follow-up, never silent scope (D-47). No backup/restore work — Phase 7 was dumped by user decision and stays without context. No new capabilities beyond DS-05..DS-09.

</domain>

<decisions>
## Implementation Decisions

### Empty states + skeletons
- **D-01:** Empty-state copy is exact `design.md` §7.5 everywhere — every list matches the copy table word-for-word; current calm lines get rewritten where they differ.
- **D-02:** Skeleton coverage is all data-loading screens — every screen that loads data gets skeleton blocks, not just visibly flashy ones.
- **D-03:** Skeleton style is static + opacity pulse (150–300ms, opacity-only); no shimmer sweep. Reduced-motion skips animation, keeps state change.
- **D-04:** Screen chrome stays mounted under skeletons — titles, chips, filters remain; skeletons cover only the stats/list region (profile + reports precedent, no layout jump).
- **D-05:** EmptyState frozen contract kept — action button renders only when label + onAction both exist; not-found states stay actionless, no dead buttons.
- **D-06:** One error voice — all failures use the `Couldn't-verb + Try again` family (CR-01/CR-02 discipline), grep-auditable.
- **D-07:** Skeleton blocks match each card's height/shape so content swaps without reflow (no generic stack).
- **D-08:** Exact-copy enforcement includes not-found states (tampered ids) — lists, zero-data, zero-marks, and not-found all conform to §7.5.

### Accessibility pass
- **D-09:** Full a11y-label audit — every icon-only control app-wide gets `accessibilityLabel` + role + `hitSlop` (pills, steppers, pickers, sheet closes), grep-audited.
- **D-10:** Contrast ≥ 4.5:1 verified computationally in both light and dark independently — never derived by eye.
- **D-11:** Full live-region coverage — status pills, validation, success, and error regions all announce via polite live region.
- **D-12:** Reduced motion respected + simplified — all animations audited against `AccessibilityInfo`, opacity + transform only, 150–300ms.
- **D-13:** Visible focus rings — explicit `ring`-token outline on all pressables (web + d-pad navigable).
- **D-14:** Strict never-color-alone — every status/count pairs icon or dot + label text; STATUS tokens never carry meaning by color.
- **D-15:** Full screen-reader semantics — real headings + `FlatList` list roles everywhere, not pain points only.
- **D-16:** Contrast failures fixed by bumping token colors (caption 13px especially), not by resizing text.
- **D-17:** Status pills announce current status + cycle/long-press hints for screen readers, not status value only.
- **D-18:** Dialogs + sheets (ConfirmDialog, calendar, month grid) trap focus on open and return it to the trigger on close.
- **D-19:** Form errors stay inline + polite (frozen FormField pattern) — no focus jump to invalid fields.
- **D-20:** Layouts survive 200% system font scaling (scroll + wrap, no fixed text heights) — no `allowFontScaling` caps.

### Layout + tap targets
- **D-21:** Enforce 44×44 targets + ≥8px gaps on every pressable (hitSlop where visual is smaller), grep-audited.
- **D-22:** Keep the children-only gutter rule — 16px gutters on title/list/footer children, never `SafeAreaView` padding (02-02 precedent, avoids doubled footer insets).
- **D-23:** FlatList discipline on all lists — `FlatList` + `keyExtractor` on id + memo rows everywhere (register, workers, history, reports, pickers).
- **D-24:** Real 360dp check on a low-end Android device — no clipping/overlap, tab bar + safe areas intact (emulator alone insufficient).
- **D-25:** Tabular numerals everywhere — all counts, dates, filenames, % use `fontVariant: ['tabular-nums']`.
- **D-26:** Full press-feedback sweep — ripple + opacity 0.85 on every `Pressable`; zero `TouchableOpacity` stragglers.
- **D-27:** Strict one-orange rule on every screen state, including sheets/dialogs (empty-state owns its accent action where applicable).
- **D-28:** Zero shadows/gradients/glassmorphism everywhere — 1px borders + surface contrast only, including `StyleSheet` shadow props.

### Fonts + app icon/splash
- **D-29:** Inter loads via `@expo-google-fonts/inter` `useFonts` with splash held until loaded; system-font fallback on failure.
- **D-30:** Nothing below 13px — grep-audit for `fontSize < 13`, bump all to `caption` 13 minimum, no exceptions.
- **D-31:** Icon + splash source is user-supplied assets (pending upload as of discussion). Planner wires them into `app.json` once received; no generated mark in the meantime.
- **D-32:** Strict type scale — every size/weight maps onto the `Type` scale (display/h1/h2/body/label/caption); one-off sizes removed.
- **D-33:** Weights locked — body/label use 400 + 600 only; 700 reserved for `h1` titles and success numerals.
- **D-34:** Splash background is theme-token matched (teal-tint light / dark pair), applied once user files land.
- **D-35:** Icon wiring scope is mobile only (Android/iOS icon + adaptive-icon + splash). Web favicon explicitly deferred.

### Tab bar + nav chrome
- **D-36:** Full DS-09 audit — 4-tab max confirmed, active = `primary` / inactive = `mutedForeground`, labels + icons token-driven.
- **D-37:** Drill-down headers enforce title + always-visible back (02-01 Stack pattern); tab screens stay headerless.
- **D-38:** Tab-safe footers everywhere — CTAs/footers clear the tab bar via `BottomTabInset` + insets on every screen.
- **D-39:** Full tablist semantics on the tab bar — tab roles, labels, selected/unselected announcement.

### Dark-mode sweep
- **D-40:** Every screen re-verified in dark independently (screenshots, never derived by eye), not touched-screens only.
- **D-41:** Transient states included — skeletons, success/share cards, validation frames stay legible in dark; file bytes stay theme-independent.
- **D-42:** Zero hardcoded hex — every color via `useTheme()`/tokens in both modes (DS-03), grep-gated.
- **D-43:** Status + destructive + accent ramps all re-verified in dark for ≥4.5:1 with text; status red never reused for warnings.

### Safe-area edge cases
- **D-44:** All insets enforced on every screen — notch, status bar, gesture bar, tab bar respected via SafeArea + insets; nothing under chrome.
- **D-45:** Keyboard overlap fixed on all forms (worksite/worker/note) — fields scroll visible, Save never hidden behind keyboard.
- **D-46:** Scroll-safe at 360dp width + short heights — `MaxContentWidth` 800 centered, gutters intact, CTAs reachable by scroll.
- **D-47:** Polish-only scope guard — visuals/copy/layout only; behavior fixes found become noted follow-ups, never inline scope.

### OpenCode's Discretion
- Exact skeleton block shapes/pulse timing within the opacity-only + reduced-motion constraint.
- Exact per-screen §7.5 line selection where the table offers variants.
- Contrast-measurement tooling and per-token bump values within the ≥4.5:1 both-modes rule.
- Keyboard-avoidance mechanism (avoiding view vs scroll wiring) within the never-hidden-Save rule.
- `useFonts` placement and loading-fallback copy within the splash-hold rule.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product requirements
- `.planning/REQUIREMENTS.md` — DS-05..DS-09 (pending); BK-01..BK-03 explicitly out (Phase 7 dumped)
- `.planning/ROADMAP.md` — Phase 8 goal, requirements (DS-05..DS-09), and all 5 success criteria (exact §7.5 copy + skeletons; a11y labels/rings/contrast; 16px/8px/safe-area/FlatList/tabular-nums; Inter + 13px floor; icon + splash at 360dp)

### Design contract
- `design.md` §7.5 — Empty-state copy table (exact lines enforced by D-01/D-08)
- `design.md` §4 — Status colors (STATUS tokens status-only, never color alone — D-14/D-43)
- `design.md` §10 — Guardrails (one orange per view, Pressable only, flat no-shadow — D-26/D-27/D-28)
- `design.md` §§1-3,7-9 — Type scale, spacing, tab bar, hero/stat/history/report/export patterns swept by this phase
- `.planning/phases/06-export/06-UI-SPEC.md` — Approved export-screen contract (success/share card, preview, skeleton-over-preview precedents reused by the sweep)
- `.planning/phases/07-backup-restore/07-UI-SPEC.md` — Approved backup-screen contract (defaults only; Phase 7 dumped so its screen stays a placeholder — sweep covers it as-is, no backup behavior work)

### Existing code (read before planning)
- `src/constants/theme.ts` — Tokens (Colors light/dark, Spacing named scale, Type 48→13, Radius, MaxContentWidth, BottomTabInset); extend, never parallel
- `src/hooks/use-theme.ts` — `useTheme()` resolution (`unspecified` → light); prefer over raw Colors
- `src/components/empty-state.tsx` — Frozen EmptyState (action only when label + onAction; D-05)
- `src/components/confirm-dialog.tsx` — Frozen ConfirmDialog (focus trap applies within this contract; D-18)
- `src/components/form-field.tsx` — Frozen FormField (inline polite errors; D-19)
- `src/components/app-tabs.tsx` + `src/components/app-tabs.web.tsx` — Native/web tab shells (DS-09 audit target; D-36/D-38/D-39)
- `src/app/_layout.tsx` — Root Stack + db gate + splash hold (font-hold + icon/splash wiring point; D-29)
- `src/app/(tabs)/index.tsx` + `src/app/(tabs)/reports.tsx` + `src/app/(tabs)/attendance.tsx` + `src/app/(tabs)/workers.tsx` — Tab screens (empty/skeleton/label/gutter sweep targets)
- `src/app/worksites.tsx` + `src/app/worksite-form.tsx` + `src/app/worker-form.tsx` + `src/app/export.tsx` + `src/app/backup.tsx` — Drill-down screens (headers, forms, keyboard, placeholders)
- `src/app/worker/[id].tsx` — Profile (StatsSkeleton precedent, ring + counts, history rows, Export action)
- `src/components/attendance-ring.tsx` — SVG ring (`value: number | null`, accent < 75)
- `src/components/status-pill.tsx` — Pill with cycle/long-press (a11y hint target; D-17)
- `src/components/date-strip.tsx` + `src/components/calendar-sheet.tsx` + `src/components/month-sheet.tsx` — Picker/sheet precedents (scrim, focus, skeleton patterns)
- `src/components/report-row.tsx` + `src/components/trend-chart.tsx` + `src/components/note-field.tsx` — Row/chart/note patterns (labels, tabular-nums, feedback)
- `src/utils/dates.ts` — `todayKey`/`formatDisplay` (local keys, never `toISOString`)
- `src/constants/status.ts` — Frozen STATUS/CYCLE contract
- `src/global.css` — Web `--font-*` variables (web font wiring)
- `app.json` — Expo config (typedRoutes + reactCompiler; icon/splash/font wiring target; D-29/D-31/D-34/D-35)
- `package.json` — `@expo-google-fonts/inter` already installed (wiring unchecked); no new deps expected
- `.planning/phases/06-export/06-CONTEXT.md` — D-01..D-22 (export decisions this sweep must not regress)
- `.planning/phases/05-home-dashboard-reports/05-CONTEXT.md` — D-01..D-25 (home/reports patterns)
- `.planning/phases/04-worker-profile-history/04-CONTEXT.md` — D-01..D-24 (profile/history patterns)
- `.planning/phases/03-attendance-marking/03-CONTEXT.md` — Register decisions (pill cycling, DateStrip, filter retention)
- `.planning/codebase/ARCHITECTURE.md` + `.planning/codebase/STACK.md` — Starter-to-product map, platform-split conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EmptyState` (frozen: action only when label + onAction) — the audit baseline for D-01/D-05/D-08; every list already renders it, copy is what changes.
- Profile `StatsSkeleton` + reports/export skeleton-over-region patterns — the card-matched, chrome-stays-mounted precedent for D-02/D-04/D-07.
- CR-01 load-error retry (`Couldn't load …` + `Try again`, `void load()`, catch-all-inside) + CR-02 saving guard — the unified error voice for D-06.
- `useTheme()` + `Colors` light/dark pairs + `Spacing`/`Type`/`Radius`/`MaxContentWidth`/`BottomTabInset` — the token surface for D-10/D-16/D-22/D-32/D-33/D-42/D-43.
- `@expo-google-fonts/inter` installed but wiring unverified — D-29 closes it with `useFonts` + splash hold.
- `StatusPill` (cycle/long-press), `ConfirmDialog` (frozen), `FormField` (inline errors), DateStrip/calendar/month sheets (scrim + focus) — a11y/label/focus subjects for D-09/D-11/D-17/D-18/D-19.
- `FlatList` + `keyExtractor` + memo rows on register/worker/history/report/picker lists — the discipline D-23 extends to remaining lists.
- `tabular-nums` on counts/dates/filenames in counts headers, rings, cards — the precedent D-25 makes universal.
- Root `Stack` + `(tabs)` group (02-01) + `BottomTabInset` footers — the nav/inset surface for D-36..D-39/D-44.

### Established Patterns
- 16px gutters on children (never `SafeAreaView` padding), 44px targets + ≥8px gaps, `Pressable`-only + ripple + opacity 0.85, one orange CTA per screen state, destructive text-only, teal = structure / orange = actions / status colors = status only.
- `useFocusEffect(useCallback(...))` refetch, `void load()` discipline, polite `theme.destructive` error surfaces.
- Local date keys only (`todayKey`/`formatDisplay`), never `toISOString`; `?`-bound DAO params, never interpolated; tampered ids render not-found.
- Opacity + transform motion only (150–300ms), sibling absolute-fill `Pressable` scrims, `StyleSheet.absoluteFill` spread.
- Dark mode checked independently, never derived by eye; contrast ≥ 4.5:1 both modes.
- Plan gates run as node temp-file one-liners on Windows PowerShell; `npx tsc --noEmit` exit code is the signal.

### Integration Points
- Sweep touches nearly every screen under `src/app/` (tabs + drill-downs) plus shared components — planner should batch by surface (lists/forms/sheets/tabs/chrome) not by requirement, with per-surface gates (hex 0, Pressable-only, tabular-nums, `tsc` 0).
- `src/app/_layout.tsx` + `app.json` form the font/icon/splash workfront (D-29/D-31/D-34/D-35) — blocked on user-supplied icon files for the icon half; font half is unblocked.
- `src/constants/theme.ts` is the only token surface — contrast bumps (D-16) and dark-ramp fixes (D-43) land there, never per-screen hex.
- No tab-trigger changes (4-tab max holds); no route additions; no DAO/schema changes expected — pure presentation pass.

</code_context>

<specifics>
## Specific Ideas

- User will supply the app icon + splash files later (D-31 pending upload) — planner wires on receipt; researcher proposes nothing generative in the meantime. Splash background is token-matched (D-34), scope mobile-only, favicon deferred (D-35).
- Sweep posture is maximal strictness: user chose the thorough option on nearly every question (exact copy, every screen, zero hex, strict pairing, survive scaling) — downstream agents should audit-then-fix, not sample.
- "Feels finished, not prototyped" is the bar — blank flashes, color-alone states, sub-13px text, and default Expo icon/splash are the visible tells this phase kills.

</specifics>

<deferred>
## Deferred Ideas

- Phase 7 Backup & Restore dumped by user decision (2026-10-15/16) — stays without CONTEXT; its screen remains a placeholder and the sweep covers it as-is with no behavior work.
- Web favicon deferred by D-35 scope (mobile icon + splash only).
- Behavior fixes discovered during polish deferred as follow-ups per D-47 scope guard — none identified during discussion.

</deferred>

---

*Phase: 08-polish-edge-cases*
*Context gathered: 2026-10-16*
