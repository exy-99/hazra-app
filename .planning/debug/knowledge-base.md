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
