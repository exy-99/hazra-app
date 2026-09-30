# Design System — Hazra Attendance

**Version:** 1.0 · **Stack:** React Native + Expo · **Style:** Flat Design (light-first, dark-ready)

---

## 1. Design Intent

A register the manager can use with thumbs while standing on a site. Three rules:

1. **One glance, one number.** The home screen leads with today's attendance %, huge and color-coded.
2. **One tap per worker.** Status is a big pill you tap to cycle — no dropdowns, no modals, no forms in the daily flow.
3. **No chrome.** Flat surfaces, hairline borders, zero shadows and zero gradients. Color does the talking.

---

## 2. Visual Direction

| | |
|---|---|
| **Style** | Flat Design — 2D, typography-led, icon-heavy, border-separated |
| **Mood** | Clean, dependable, fast, high-end utility |
| **Light mode** | Full (default — a site is often used in daylight) |
| **Dark mode** | Full (early shifts, low-light offices) |
| **Signature** | Teal foundation + one loud orange accent, plus a strict 4-color attendance language |

**The one bold move:** teal is used for structure and navigation only. Every *action* is orange. Every *status* is its own fixed color. A user should be able to read a screen's state from color alone, before reading a single word.

---

## 3. Color Tokens

```js
// theme/colors.js
export const light = {
  primary:      '#0D9488', // teal-600  — structure, active nav, links
  onPrimary:    '#FFFFFF',
  secondary:    '#14B8A6', // teal-500  — progress ring fill
  accent:       '#EA580C', // orange-600 — CTAs only
  onAccent:     '#FFFFFF',

  background:   '#F0FDFA', // teal-tinted off-white
  surface:      '#FFFFFF', // cards, rows, sheets
  foreground:   '#134E4A', // teal-900 — primary text
  muted:        '#E8F1F4', // inert fills, disabled
  mutedForeground: '#5F7472', // secondary text — 4.5:1 on surface
  border:       '#CCE9E3', // hairline dividers
  ring:         '#0D9488', // focus outline
  destructive:  '#DC2626',
  onDestructive:'#FFFFFF',
};

export const dark = {
  primary:      '#2DD4BF', // teal-400 — brighter so it reads on dark
  onPrimary:    '#042F2E',
  secondary:    '#14B8A6',
  accent:       '#FB923C', // orange-400 — lifts off dark backgrounds
  onAccent:     '#431407',

  background:   '#0B1F1D',
  surface:      '#123330',
  foreground:   '#E6FFFA',
  muted:        '#1B4A46',
  mutedForeground: '#9DC4BF',
  border:       '#205550',
  ring:         '#2DD4BF',
  destructive:  '#F87171',
  onDestructive:'#450A0A',
};
```

**Usage rules**
- Never hardcode a hex in a component — always import a token.
- Teal = navigation/identity. Orange = "this saves or creates something." If a button is orange you may tap it and something happens.
- Reserve `destructive` for delete/restore only (soft-delete confirmations, restore-overwrites warning).

---

## 4. The Attendance Status System

This is the app's identity. **Four statuses, four fixed colors, used nowhere else.**

| Status | Solid fill | Tinted pill bg | Pill text | Meaning |
|---|---|---|---|---|
| `present` | `#16A34A` | `#DCFCE7` | `#15803D` | Green = expected and here |
| `absent` | `#DC2626` | `#FEE2E2` | `#B91C1C` | Red = expected, missing |
| `half_day` | `#B45309` | `#FEF3C7` | `#B45309` | Amber = partial |
| `off_day` | `#64748B` | `#E2E8F0` | `#475569` | Slate = not expected (excluded from %) |

- **Solid fill + white text** = interactive (the tappable cycle button).
- **Tinted pill + dark text** = read-only (history rows, report chips).
- Both variants clear 4.5:1. Never use a lighter text tone on a tinted pill.
- `off_day` is deliberately the only *neutral* status — it visually recedes, matching the business rule that it's excluded from the denominator.
- **Never rely on color alone** (WCAG): every pill carries its label text, and the home ring shows a numeral. Charts and legends must always be labeled.

---

## 5. Typography

**Inter** for everything — headings, body, numerals.

```bash
npx expo install @expo-google-fonts/inter expo-font
```

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `display` | 48 / 52 | 700 | Today's attendance % (home hero) |
| `h1` | 28 / 34 | 700 | Screen titles |
| `h2` | 20 / 26 | 600 | Section headers, card titles |
| `body` | 16 / 24 | 400 | Default UI text, inputs |
| `label` | 14 / 20 | 600 | Pill text, buttons, field labels |
| `caption` | 13 / 18 | 500 | Timestamps, helper text |

- Base is 16px. **Nothing below 13px.**
- Stats, counts, percentages, dates: `fontVariant: ['tabular-nums']` so numbers don't jitter as they change.
- Line-height 1.5 on body; tighten headings to ≤1.25.

---

## 6. Spacing, Radius, Elevation

```js
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
```

- 16px screen gutter; 8px minimum between adjacent tap targets.
- **Flat = no shadows.** Separate with `1px border` (`colors.border`) and background contrast (`surface` on `background`). If you reach for `elevation`, use a border instead.
- Cards: `radius.md`, 16px padding, hairline border, `surface` fill.
- Sheets/modals: `radius.lg` top corners only.

---

## 7. Signature Components

### 7.1 Attendance Ring (home hero)
The biggest visual element on the app's first screen. A flat, thick-stroke progress ring — no gradient, no glow.

- Track: `muted` · Fill: `secondary`, turns `accent` if % drops below 75 · Center numeral in `display`.
- Beneath it, a 4-up row of tinted status pills with counts.

### 7.2 Status Cycle Button (Mark Attendance)
Rows are one-line and thumb-sized. Tapping the pill advances status; no confirmation, no modal.

```jsx
// Pressable, not TouchableOpacity
const CYCLE = ['present', 'absent', 'half_day', 'off_day'];

<Pressable
  onPress={() => cycle(worker.id)}
  android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
  style={({ pressed }) => [
    styles.pill,
    { backgroundColor: SOLID[status], opacity: pressed ? 0.85 : 1 },
  ]}
>
  <Text style={styles.pillText}>{LABEL[status]}</Text>
</Pressable>
```

- Minimum **44×44px**; the whole row is the target, not just the pill.
- Press feedback on *every* pressable: ripple (Android) + opacity `0.85` (iOS). No 0ms state changes.
- Row: worker name (`body`, 600) left, role/worksite (`caption`, muted) second line, pill right.
- Rows in a `FlatList` with `keyExtractor={item => item.id}` and a memoized row component.

### 7.3 Stat Card
Fixed 2-column grid (2×2 on home). Numeral in `h1` weight 700, tinted by its status color; label in `caption`/muted above it. Tapping opens the filtered report.

### 7.4 Forms (Worksites, Workers)
- **Visible labels above every field** — never placeholder-as-label.
- Controlled inputs (`value` + `onChangeText`).
- Inline error directly under the offending field in `destructive`, as soon as the field is touched and invalid.
- Primary action is a full-width orange button at the bottom; destructive actions (`Remove`) are text-only in `destructive`, never a filled button.
- Worksite type = a segmented picker or chip row (Office / Construction / School / Farm / Other). Not free text.

### 7.5 Empty States
Every list has one. Icon (Lucide, `mutedForeground`) + one line of copy + one action button.

| Screen | Copy | Action |
|---|---|---|
| Worksites | "No worksites yet" | **Add worksite** (orange) |
| Workers | "No workers at this worksite" | **Add worker** |
| Attendance | "No attendance marked for this date" | **Mark today** |
| Worker history | "No attendance recorded yet" | — (no action, keep it calm) |

### 7.6 Loading
Skeleton rows matching the real row height (never a blank flash, never a centered spinner if the layout is known). Keep the reserve space so nothing jumps.

---

## 8. Screen Map

| Screen | Hero element | Primary action |
|---|---|---|
| **Home** | Attendance ring + today's date | **Mark attendance** (orange, full-width) |
| **Mark Attendance** | Date strip + "Today" jump | Tap-to-cycle pills; saves on tap |
| **Worksites** | List of bordered cards | **+ Add worksite** |
| **Workers** | Worksite filter chips | **+ Add worker** |
| **Worker Profile** | Worker name + attendance % ring (smaller) | Scrollable history list |
| **Reports** | Date-range + worksite filters | "Lowest attendance" highlight list |
| **Export / Backup** | File-type choice + last-backup date | **Export** / **Backup now** |

**Navigation:** bottom tab bar, 4 tabs max — Home · Attendance · Workers · Reports. Drill-downs (profile, forms, export) push with an always-visible back arrow. Active tab = `primary` icon + label; inactive = `mutedForeground`.

---

## 9. Motion

- **150–300ms**, `ease-out` on enter, `ease-in` on exit — exits faster than enters.
- Animate **opacity and transform only**. Never animate `width`/`height` (use `scaleX` on the ring, or `LayoutAnimation`).
- The ring animates its sweep when a % changes — that's the one "delight" moment. Everything else is instant.
- Respect `prefers-reduced-motion` / `AccessibilityInfo.isReduceMotionEnabled()`: skip the ring sweep, keep the state change.
- No decorative-only animation. Every motion must communicate "this changed" or "this came from there."

---

## 10. Guardrails (do not)

- ❌ Shadows, gradients, glassmorphism, neon glow — this is Flat Design.
- ❌ Emojis as icons. Use **Lucide** (already the recommended set) via `lucide-react-native`.
- ❌ Reusing green/red/amber/slate for anything other than attendance status.
- ❌ More than one orange element competing on a screen — one primary action per view.
- ❌ Placeholder-only labels, errors shown only at the top, or validation on submit.
- ❌ `TouchableOpacity` in new code — use `Pressable`.
- ❌ Any color as the *sole* carrier of meaning.
- ❌ Any network, analytics, or account UI — the app is offline and single-manager.

---

## 11. Pre-Delivery Checklist

- [ ] Text contrast ≥ 4.5:1 in both light and dark mode (status pills especially)
- [ ] All tap targets ≥ 44×44px, with `hitSlop` on icon-only buttons
- [ ] ≥ 8px gap between adjacent tap targets
- [ ] Press feedback (ripple + opacity) on every pressable, 150–300ms transitions
- [ ] Empty state on every list, loading state on every fetch, no blank flashes
- [ ] Focus rings visible; `accessibilityLabel` on icon-only controls
- [ ] Safe areas respected (`react-native-safe-area-context`) — no content under the notch or home indicator
- [ ] Dark mode checked independently, not derived by eye from light mode
- [ ] `FlatList` + `keyExtractor` + memoized rows for any list that can exceed 50 items
- [ ] Numerals use tabular figures everywhere a count or % is displayed
- [ ] Reduced-motion path tested
- [ ] Verified on a low-end Android device at 360dp width
