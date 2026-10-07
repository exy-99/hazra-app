# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## attendance-bottom-gap — Unwanted fixed blank gap between Attendance list and the bottom tab bar (Android)
- **Date:** 2026-10-07
- **Error patterns:** ui, gap, blank space, empty gap, dead zone, bottom navigation bar, tab bar, paddingBottom, BottomTabInset, scrollable content, layout, attendance screen, native tabs
- **Root cause:** `src/app/(tabs)/attendance.tsx` applied `paddingBottom: BottomTabInset` (80 px on Android) to the full-screen `SafeAreaView`. Native tabs (`expo-router/unstable-native-tabs`) already reserve their own height and do not overlay screen content, so the padding was a redundant fixed dead strip between the `flex:1` list and the tab bar. Proven by differential against the structurally-identical, user-confirmed-correct `workers.tsx`, which omits that padding. Only visible on a scroll-to-edge list; screens with centered content hide it.
- **Fix:** Removed `paddingBottom: BottomTabInset` from `styles.safeArea` and dropped the now-unused `BottomTabInset` import in `src/app/(tabs)/attendance.tsx` (now mirrors `workers.tsx`); the list's `contentContainerStyle` `paddingVertical` (Spacing.two = 8px) remains as the only bottom breathing room.
- **Files changed:** src/app/(tabs)/attendance.tsx
---

## attendance-layout-bugs — Status pill overflow, picker clipping, unequal filter chips (Android)
- **Date:** 2026-10-07
- **Error patterns:** ui, status pill, badge, overflow, off-screen, clipping, picker, chips, flexWrap, flexShrink, minWidth, ScrollView, unequal width, layout, attendance screen
- **Root cause:** `StatusPill` rendered the CYCLE picker (4 mini-pills + Close) inside the trailing flex item of the card's horizontal `topRow` with no width constraints anywhere (RN Yoga default `flexShrink: 0`; name had no `flex`). The wide picker forced the row past the card's right edge (pill pushed off-screen, chips clipped) and the tall wrapper under `alignItems: center` lifted the pill toward the card's top edge. The picker's `flexWrap: wrap` could never trigger because it was never width-constrained. Separately, worksite filter chips had no `minWidth` inside an unbounded horizontal `ScrollView`, so each sized to its label ('Tft' shrank); `flex: 1` cannot equalize inside a `ScrollView`.
- **Fix:** Split `status-pill.tsx` into `StatusPill` (pill button, wrapper `flexShrink: 0`, `onOpenPicker`) + `StatusPicker`; `AttendanceRow` renders `StatusPicker` as a full-width card child below `topRow` so the existing wrap takes effect. Name gets `flex: 1` + `numberOfLines={1}`; filter chips get `minWidth: 96`. Single caller (`attendance.tsx`), so the `StatusPillProps` API change (`onPick` -> `onOpenPicker`) is safe.
- **Files changed:** src/components/status-pill.tsx, src/app/(tabs)/attendance.tsx
---
