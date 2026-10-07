---
status: resolved
trigger: "I have three UI layout bugs on this screen that need fixing: 1) Misaligned Status Badge (Absent): when an item is marked/selected, the 'Absent' pill renders out of place—it overlaps the card's top edge and overflows off the right side of the screen. It should stay neatly aligned in the top-right corner of the card where the original 'Mark' button was, fitting within the card's bounds. Please fix the positioning. 2) Horizontally Overflowing Action Buttons: the row containing 'Present', 'Absent', 'Half day', 'Off day', and 'Close' is clipping on the right. Please make this row horizontally scrollable or use a Wrap layout so chips don't overflow the card container. 3) Uneven Top Pillar/Oval Widths: the vertical oval columns at the top have inconsistent widths (items with shorter text like 'Tft' shrink while others remain wide). Please make all oval columns have an equal width (e.g. using flex:1 / Expanded / fixed min-width)."
created: 2026-10-07T06:46:32Z
updated: 2026-10-07T06:46:32Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: "CONFIRMED (static): bugs 1 & 2 shared root = picker nested inside topRow trailing item with zero width constraints; bug 3 = chip with no minWidth in unbounded ScrollView."
test: "Code-structure analysis + fix applied; npx tsc --noEmit clean; git diff shows only the 2 intended files."
expecting: "Pill stays top-right in bounds; picker wraps full-width below topRow; filter chips equal min-width."
next_action: "HUMAN VERIFY on Android — long-press a row, confirm pill position + picker wraps without clipping; confirm filter chips equal width."

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: "1) The status pill (e.g. 'Absent') stays aligned to the card's top-right corner where the initial 'Mark' button sits, inside the card bounds. 2) The action chips row (Present/Absent/Half day/Off day/Close) fits the card without clipping — via horizontal scroll or wrap. 3) All top workingsite filter ovals/chips share one equal width regardless of label length (e.g. short 'Tft')."
actual: "1) When a row is marked, the status pill overflows the card's top edge and runs off the right edge of the screen instead of staying in the card's top-right. 2) The action chip row clips on the right, cutting off trailing chips. 3) Filter ovals at the top have inconsistent widths — short labels (e.g. 'Tft') render narrower than long ones."
errors: "None — purely visual. No console errors or warnings reported."
reproduction: "Open the Attendance tab (src/app/(tabs)/attendance.tsx). Mark a worker status to reveal the status pill and the action chip picker. The worksite filter chip row is visible at the top of the same screen."
started: "Always broken — present since the attendance screen was built (Phase 3, 2026-10-07). Not a regression."
platform: "Android (native tabs, expo-router/unstable-native-tabs)"
scope: "Attendance tab only."

## Platform / Scope (from symptom gathering)
- Platform: Android
- Screen: src/app/(tabs)/attendance.tsx
- Element for bug 3: the worksite filter chip row at the top ('All' + worksite names, one of which is 'Tft')
- Element for bugs 1 & 2: AttendanceRow status pill (src/components/status-pill.tsx) and its long-press picker (CYCLE mini-pills + Close)
- Timeline: present since the screen was built; no regression
- No errors; purely layout

## Eliminated
<!-- APPEND only - prevents re-investigating -->

(empty)

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-10-07T06:55:00Z
  checked: "src/components/status-pill.tsx render structure (lines 33-89)"
  found: "StatusPill returns a single outer <View> (no style constraints) containing the pill Pressable AND the picker View (CYCLE 4x miniPill + Close). This whole wrapper is placed as the trailing item of topRow (flexDirection:row) in attendance.tsx line 58-63."
  implication: "The picker (~4 pills + Close, several hundred px intrinsic width) lives inside a horizontal row's trailing item — prime suspect for right-edge overflow (bugs 1 & 2)."

- timestamp: 2026-10-07T06:55:00Z
  checked: "topRow / name / pill styles for width constraints"
  found: "topRow = {flexDirection:row, alignItems:center, justifyContent:space-between, gap}. name Text has NO flex/flexShrink/numberOfLines. Pill wrapper has NO flexShrink:0. RN Yoga defaults flexShrink to 0, so nothing in the row can shrink — any wide content (long name, open picker) overflows the card's right edge instead of compressing."
  implication: "Explains right-edge overflow. Tall picker wrapper as tallest topRow item under alignItems:center also lifts the pill toward the card's top padding edge — consistent with bug 1's 'overlaps top edge' report."

- timestamp: 2026-10-07T06:55:00Z
  checked: "picker style vs user symptom"
  found: "picker = {flexDirection:row, flexWrap:wrap, gap, paddingTop}. flexWrap:wrap only wraps when the picker is width-constrained; nested in the unbounded trailing row item it never gets constrained, so it extends in one line and clips instead of wrapping."
  implication: "Moving the picker to a full-width card child (bounded by card width) makes the existing flexWrap actually wrap — the user's requested 'Wrap layout' fix with no new ScrollView needed."

- timestamp: 2026-10-07T06:55:00Z
  checked: "worksite filter chip style (attendance.tsx lines 406-413) + container"
  found: "chip = {alignItems/justifyContent:center, minHeight:44, paddingHorizontal:16, borderWidth:1, borderRadius:pill} — NO minWidth/flex. Container is a horizontal ScrollView (unbounded main axis), so each chip sizes to its label: 'Tft' renders much narrower than long worksite names. flex:1 cannot equalize inside a ScrollView (unbounded axis ignores flex)."
  implication: "Bug 3 root confirmed: missing minWidth. Fix = fixed minWidth on chip (shorts equalize, longs grow + scroll). StatusPill used ONLY by attendance.tsx (grep) — safe to refactor its API."

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "Bugs 1 & 2: StatusPill rendered the CYCLE picker (4 mini-pills + Close, several hundred px intrinsic width) inside the trailing flex item of topRow (horizontal row) with no width constraints anywhere (RN Yoga default flexShrink:0; name had no flex). The wide picker forced the row past the card's right edge (clipped chips, pill pushed off-screen) and the tall wrapper under alignItems:center lifted the pill toward the card's top edge. The picker's flexWrap:wrap could never trigger because it was never width-constrained. Bug 3: worksite filter chip style had no minWidth/flex inside an unbounded horizontal ScrollView, so each chip sized to its label ('Tft' shrank)."
fix: "status-pill.tsx: split into StatusPill (pill button, wrapper flexShrink:0, onOpenPicker callback) + StatusPicker (CYCLE mini-pills + Close, existing flexWrap now effective); removed picker paddingTop (card row gap covers spacing). attendance.tsx AttendanceRow: owns pickerOpen state, renders StatusPicker as a full-width card child below topRow (wrap layout), name gets flex:1 + numberOfLines={1} (ellipsize, pill anchored right), filter chip gets minWidth:96 (shorts equalize, longs grow + scroll; flex:1 can't work in a ScrollView). StatusPill has no other callers — API change is safe."
verification: "npx tsc --noEmit clean (exit 0). git diff --stat shows only the 2 intended files, no formatter churn. On-device Android visual confirmation PENDING by human."
files_changed: ["src/components/status-pill.tsx", "src/app/(tabs)/attendance.tsx"]
