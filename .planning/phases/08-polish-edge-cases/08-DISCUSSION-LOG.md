# Phase 08: polish-edge-cases - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 08-polish-edge-cases
**Areas discussed:** Empty states + skeletons, Accessibility pass, Layout + tap targets, Fonts + app icon/splash, Tab bar + nav chrome, Dark-mode sweep, Safe-area edge cases

---

## Empty states + skeletons

| Option | Description | Selected |
|--------|-------------|----------|
| Exact §7.5 everywhere | Every list matches the copy table word-for-word | ✓ |
| Fix gaps only | Keep per-screen calm lines, fix clear mismatches | |
| You decide | Researcher audits, planner picks per-screen | |

**User's choice:** Exact §7.5 everywhere
**Notes:** Maximal consistency; current lines rewritten where they differ.

| Option | Description | Selected |
|--------|-------------|----------|
| All screens | Every data-loading screen gets skeletons | ✓ |
| Flashiest screens only | Skeletons only where blank flash was seen | |
| You decide | Researcher audits, planner picks | |

**User's choice:** All screens

| Option | Description | Selected |
|--------|-------------|----------|
| Static + pulse | Opacity-only pulse, respects reduced-motion | ✓ |
| Shimmer sweep | Animated shimmer sweep | |
| You decide | Planner picks within constraint | |

**User's choice:** Static + pulse

| Option | Description | Selected |
|--------|-------------|----------|
| Chrome stays | Headers/chips mounted, skeletons over stats+list | ✓ |
| Full-screen | Full-screen skeleton replaces everything | |
| You decide | Planner picks per-screen | |

**User's choice:** Chrome stays

| Option | Description | Selected |
|--------|-------------|----------|
| Keep contract | Action only when label+handler exist | ✓ |
| Action everywhere | Every empty state gets a button | |
| You decide | Planner picks per-screen | |

**User's choice:** Keep contract

| Option | Description | Selected |
|--------|-------------|----------|
| One error voice | Unified Couldn't-verb + Try again | ✓ |
| Keep variations | Keep per-screen error lines | |
| You decide | Planner picks per-screen | |

**User's choice:** One error voice

| Option | Description | Selected |
|--------|-------------|----------|
| Match cards | Blocks mirror each card's height/shape | ✓ |
| Generic blocks | One generic 3-block stack reused | |
| You decide | Planner picks per-screen | |

**User's choice:** Match cards

| Option | Description | Selected |
|--------|-------------|----------|
| Include not-found | Not-found + zero-data + zero-marks all conform | ✓ |
| Lists only | Exact-copy rule covers list empties only | |
| You decide | Researcher maps, planner picks | |

**User's choice:** Include not-found

---

## Accessibility pass

| Option | Description | Selected |
|--------|-------------|----------|
| Full audit | Every icon-only control labeled+role+hitSlop | ✓ |
| New touchpoints only | Label only changed controls | |
| You decide | Researcher audits, planner fixes | |

**User's choice:** Full audit

| Option | Description | Selected |
|--------|-------------|----------|
| Both modes | Computed check light + dark independently | ✓ |
| Light only | Check light, dark by eye | |
| You decide | Researcher picks method | |

**User's choice:** Both modes

| Option | Description | Selected |
|--------|-------------|----------|
| Full live-region | All validation/success/error announce politely | ✓ |
| Critical only | Destructive + outcomes only | |
| You decide | Planner picks regions | |

**User's choice:** Full live-region

| Option | Description | Selected |
|--------|-------------|----------|
| Respect + simplify | Audit all animations vs AccessibilityInfo | ✓ |
| Gate new only | Gate new skeleton motion only | |
| You decide | Planner picks | |

**User's choice:** Respect + simplify

| Option | Description | Selected |
|--------|-------------|----------|
| Visible rings | Explicit ring-token outline on all pressables | ✓ |
| Defaults + gaps | Platform defaults, fix invisible spots | |
| You decide | Planner picks | |

**User's choice:** Visible rings

| Option | Description | Selected |
|--------|-------------|----------|
| Strict pairing | Every status/count pairs icon/dot + text | ✓ |
| Fix offenders only | Fix known color-alone spots | |
| You decide | Researcher audits, planner fixes | |

**User's choice:** Strict pairing

| Option | Description | Selected |
|--------|-------------|----------|
| Full semantics | Real headings + list roles everywhere | ✓ |
| Pain points only | Forms/dialogs/tabs only | |
| You decide | Planner picks | |

**User's choice:** Full semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Bump colors | Adjust token colors to meet 4.5:1 | ✓ |
| Resize instead | Enlarge/bold failing text | |
| You decide | Researcher measures, planner picks | |

**User's choice:** Bump colors

| Option | Description | Selected |
|--------|-------------|----------|
| Announce hints | Pills announce status + cycle/long-press hints | ✓ |
| Status only | Announce status value only | |
| You decide | Planner picks wording | |

**User's choice:** Announce hints

| Option | Description | Selected |
|--------|-------------|----------|
| Trap + return | Focus traps in dialog/sheet, returns on close | ✓ |
| No trap | Leave focus where it is | |
| You decide | Planner picks within ConfirmDialog contract | |

**User's choice:** Trap + return

| Option | Description | Selected |
|--------|-------------|----------|
| Inline + polite | Inline destructive hint + polite announcement | ✓ |
| Focus jump | Move focus to first invalid field, assertive | |
| You decide | Planner picks | |

**User's choice:** Inline + polite

| Option | Description | Selected |
|--------|-------------|----------|
| Survive scaling | Layouts survive 200% system font | ✓ |
| Cap it | Cap scaling where layout breaks | |
| You decide | Researcher tests, planner fixes | |

**User's choice:** Survive scaling

---

## Layout + tap targets

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce all | 44px + 8px gaps on every pressable | ✓ |
| Fix failures only | Fix only 360dp-measured failures | |
| You decide | Researcher measures, planner fixes | |

**User's choice:** Enforce all

| Option | Description | Selected |
|--------|-------------|----------|
| Children only | Gutters on children, never SafeAreaView padding | ✓ |
| SafeArea padding | Move gutters to SafeAreaView | |
| You decide | Planner picks per-screen | |

**User's choice:** Children only

| Option | Description | Selected |
|--------|-------------|----------|
| All lists | FlatList + keyExtractor + memo everywhere | ✓ |
| Stutterers only | Convert only stuttering lists | |
| You decide | Researcher audits, planner converts | |

**User's choice:** All lists

| Option | Description | Selected |
|--------|-------------|----------|
| Real 360dp check | Verify on real low-end Android device | ✓ |
| Emulator only | Emulator/responsive preview | |
| You decide | Planner picks method | |

**User's choice:** Real 360dp check

| Option | Description | Selected |
|--------|-------------|----------|
| Everywhere | Tabular numerals on every count/date/filename | ✓ |
| Jitter spots only | Add where jitter visible | |
| You decide | Researcher greps, planner adds | |

**User's choice:** Everywhere

| Option | Description | Selected |
|--------|-------------|----------|
| Full sweep | Ripple + opacity on every pressable, zero TouchableOpacity | ✓ |
| Gaps only | Fix pressables missing feedback | |
| You decide | Planner picks | |

**User's choice:** Full sweep

| Option | Description | Selected |
|--------|-------------|----------|
| Strict one-orange | One orange CTA per screen state incl. sheets | ✓ |
| Main screens only | Enforce on main screens | |
| You decide | Researcher counts, planner reconciles | |

**User's choice:** Strict one-orange

| Option | Description | Selected |
|--------|-------------|----------|
| Zero shadows | No shadows/gradients/glass anywhere | ✓ |
| Visible only | Remove visible shadows | |
| You decide | Planner picks | |

**User's choice:** Zero shadows

---

## Fonts + app icon/splash

| Option | Description | Selected |
|--------|-------------|----------|
| useFonts + hold | Inter via useFonts, hold splash, system fallback | ✓ |
| Bundle static | Static assets via app.json + expo-font config | |
| You decide | Researcher checks SDK-57, planner picks | |

**User's choice:** useFonts + hold

| Option | Description | Selected |
|--------|-------------|----------|
| Bump to 13 | All text to caption 13 minimum, no exceptions | ✓ |
| Allow exceptions | Sub-13 fine print with passing contrast | |
| You decide | Researcher audits, planner fixes | |

**User's choice:** Bump to 13

**User's choice (icon source):** User-supplied files later (freeform) — icon + splash source = user assets pending upload; planner wires into app.json on receipt.
**Notes:** User said "i am going to provide you the files later", then "continue".

| Option | Description | Selected |
|--------|-------------|----------|
| Strict scale | Every size maps onto Type scale | ✓ |
| Outliers only | Fix hierarchy-breaking outliers | |
| You decide | Researcher audits, planner maps | |

**User's choice:** Strict scale

| Option | Description | Selected |
|--------|-------------|----------|
| Lock weights | 400/600 body, 700 titles-only | ✓ |
| Free weights | 700 wherever emphasis needed | |
| You decide | Planner picks | |

**User's choice:** Lock weights

| Option | Description | Selected |
|--------|-------------|----------|
| Token-matched | Splash bg uses theme background token | ✓ |
| Plain | White/black splash background | |
| You decide | Planner picks | |

**User's choice:** Token-matched

| Option | Description | Selected |
|--------|-------------|----------|
| All surfaces | Icon + adaptive + splash + favicon | |
| Mobile only | Android/iOS icon + splash, favicon later | ✓ |

**User's choice:** Mobile only
**Notes:** Web favicon deferred.

---

## Tab bar + nav chrome (follow-up round)

| Option | Description | Selected |
|--------|-------------|----------|
| Full DS-09 audit | Count + colors + labels token-driven | ✓ |
| Leave shell | Skip unless violation found | |
| You decide | Researcher audits, planner fixes | |

**User's choice:** Full DS-09 audit

| Option | Description | Selected |
|--------|-------------|----------|
| Title + back | Title + always-visible back on drill-downs | ✓ |
| Titles only | Audit titles, back as built | |
| You decide | Planner picks | |

**User's choice:** Title + back

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce insets | BottomTabInset clearance on every screen | ✓ |
| Gaps only | Fix overlaps only | |
| You decide | Planner picks | |

**User's choice:** Enforce insets

| Option | Description | Selected |
|--------|-------------|----------|
| Full tab semantics | Tablist roles + labels + selection | ✓ |
| If flagged | Only if full-semantics pass flags it | |
| You decide | Planner picks | |

**User's choice:** Full tab semantics

---

## Dark-mode sweep (follow-up round)

| Option | Description | Selected |
|--------|-------------|----------|
| Every screen | Re-verify all screens in dark independently | ✓ |
| Touched only | Dark-check phase-touched screens | |
| You decide | Researcher defines checklist | |

**User's choice:** Every screen

| Option | Description | Selected |
|--------|-------------|----------|
| Include states | Skeletons/success/validation/share in dark | ✓ |
| Base only | Base screens only | |
| You decide | Planner picks | |

**User's choice:** Include states

| Option | Description | Selected |
|--------|-------------|----------|
| Zero hex | All colors via tokens, grep-gated | ✓ |
| Allow exceptions | Hex for overlays/scrims with comment | |
| You decide | Researcher greps, planner tokenizes | |

**User's choice:** Zero hex

| Option | Description | Selected |
|--------|-------------|----------|
| Re-verify ramps | Status/destructive/accent in dark ≥4.5:1 | ✓ |
| Fix reports only | Fix reported dark misses | |
| You decide | Planner picks | |

**User's choice:** Re-verify ramps

---

## Safe-area edge cases (follow-up round)

| Option | Description | Selected |
|--------|-------------|----------|
| All insets | Notch/status/gesture/tab respected everywhere | ✓ |
| Clippers only | Fix screens that clip today | |
| You decide | Researcher audits, planner fixes | |

**User's choice:** All insets

| Option | Description | Selected |
|--------|-------------|----------|
| Fix keyboard | Forms scroll visible, Save never hidden | ✓ |
| Reports only | Fix reported hides | |
| You decide | Planner picks mechanism | |

**User's choice:** Fix keyboard

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll-safe | 360dp + short heights scroll without clipped CTAs | ✓ |
| Width only | 360dp width only | |
| You decide | Planner picks | |

**User's choice:** Scroll-safe

| Option | Description | Selected |
|--------|-------------|----------|
| Polish only | Behavior fixes become noted follow-ups | ✓ |
| Fix inline | Tiny behavior fixes inline | |
| You decide | Planner judges per-find | |

**User's choice:** Polish only

---

## OpenCode's Discretion

Skeleton block shapes/pulse timing; per-screen §7.5 variant selection; contrast-measurement tooling and per-token bump values; keyboard-avoidance mechanism; `useFonts` placement and fallback copy. Icon/splash creative is user-supplied (not discretion).

## Deferred Ideas

- Phase 7 Backup & Restore dumped by user decision — stays without context; screen remains placeholder.
- Web favicon deferred (D-35 mobile-only scope).
- Behavior fixes found during polish deferred as follow-ups (D-47) — none identified in discussion.
