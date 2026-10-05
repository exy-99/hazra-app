# State — Hazra Attendance

**Milestone:** v1.0 — Offline Staff Attendance Register (MVP)
**Current phase:** 2 — Worksites & Workers
**Status:** Complete — Phase 1 verified 2026-10-03 (8/8 plans, 32/32 must-haves; verification: human_needed → 2 static fixes applied, 3 on-device proofs deferred to Phase 9)
**Last updated:** 2026-10-03

## Position

- Roadmap created: 9 phases, 41/41 requirements mapped.
- Phase 1 planned: `.planning/phases/01-foundation/01-01-PLAN.md` … `01-08-PLAN.md`.
- Plans are a conventions-conforming 8-plan split (≤3 tasks/plan, ≤3 files/task); all Phase 1 req IDs (DS-01..04, NF-01..03, NF-05) covered.
- Real codebase is still the Expo starter; no product feature implemented.
- Phase 1 COMPLETE (2026-10-03): all 8 plans executed across 3 waves; code review 01-REVIEW.md (2 critical/9 warnings/4 info, all assessed); verification 01-VERIFICATION.md (32/32 must-haves, status human_needed); post-verification fixes applied — `src/app/_layout.tsx` gained a `dbReady` gate (tabs render only after init resolves) + accent "Try again" retry, `src/components/app-tabs.tsx` null-guarded to `Colors[scheme === 'dark' ? 'dark' : 'light']` (commit 24cef39); UAT 01-HUMAN-UAT.md tracks 2 passed + 3 Phase-9-deferred items.
- Plan 01-01 COMPLETE (2026-10-03): v1 deps installed (expo-sqlite/crypto/file-system/sharing/print/dev-client, dayjs, lucide-react-native, react-native-svg, @expo-google-fonts/inter); `src/constants/status.ts` frozen (STATUS/CYCLE/AttendanceStatus); SUMMARY at `.planning/phases/01-foundation/01-01-SUMMARY.md`; commits 35fd5c3, 830f4b1, 020feae. DS-01 done.
- Plan 01-02 COMPLETE (2026-10-03): product theme tokens in `src/constants/theme.ts` (14 product color keys both modes, Type 48→13, Radius sm/md/lg/pill); starter keys + `ThemeColor` intact; standing self-checks `scripts/verify-theme-tokens.mjs`, `scripts/verify-theme-scale.mjs`; SUMMARY at `.planning/phases/01-foundation/01-02-SUMMARY.md`; commits 16766f4, 8fff62d, d30dbdc, dc712ac. DS-03, DS-04 done.
- Plan 01-03 COMPLETE (2026-10-03): local date-key helpers in `src/utils/dates.ts` (todayKey/toDateKey/addDays/formatDisplay/lastNDays on dayjs, no `toISOString`) + `newId()` in `src/utils/ids.ts` (expo-crypto randomUUID); midnight/TZ check verified under Asia/Kolkata; standing self-checks `scripts/verify-date-utils.mjs`, `scripts/verify-ids.mjs`; SUMMARY at `.planning/phases/01-foundation/01-03-SUMMARY.md`; commits 3713579, 304defe, e4378e9, 6ad4656. NF-05 prerequisite done.
- Plan 01-04 COMPLETE (2026-10-03): frozen SQLite contract in `src/db/types.ts` (Worksite/Worker/AttendanceEntry row types, AttendanceStatus re-exported from canonical status.ts) + `src/db/index.ts` (cached openDatabaseAsync singleton, idempotent CREATE TABLE x3 matching PRD §8, foreign_keys=ON, CHECK status whitelist, UNIQUE(worker_id,date), user_version hook); SDK-57 async names confirmed against versioned docs; SUMMARY at `.planning/phases/01-foundation/01-04-SUMMARY.md`; commits 1827a4c, 7381f1f. NF-02, NF-05 done.
- Plan 01-07 COMPLETE (2026-10-03): four-tab shell (native `src/components/app-tabs.tsx` + web `src/components/app-tabs.web.tsx`, Home/Attendance/Workers/Reports, selected=primary/unselected=mutedForeground via documented `{default,selected}` labelStyle/iconColor) + token-driven Home placeholder (`src/app/index.tsx`) + three new tab screens (`src/app/attendance.tsx|workers.tsx|reports.tsx`); `src/app/explore.tsx` deleted; standing self-check `scripts/verify-tab-shell.mjs` 20/20; SUMMARY at `.planning/phases/01-foundation/01-07-SUMMARY.md`; commits b5241e3, 15a8d2d. NF-01, NF-03 done.
- Plan 01-05 COMPLETE (2026-10-03): worksite + worker DAOs in `src/db/worksites.ts` (list/get/create/update/deactivate, soft delete, parameterized) + `src/db/workers.ts` (same plus worksiteId filter and worksite_id reassignment); `tsc` exit 0, no DELETE in either file; SUMMARY at `.planning/phases/01-foundation/01-05-SUMMARY.md`; commits 0f966d5, 8603c5d. NF-05 done.
- Plan 01-06 COMPLETE (2026-10-03): attendance DAO in `src/db/attendance.ts` (single-statement upsertAttendance via ON CONFLICT(worker_id,date), getAttendanceForDate LEFT JOIN with null-status unmarked, getAttendanceForWorker from/to history, getDailyCounts with derived unmarked and off_day separate); `tsc` exit 0; SUMMARY at `.planning/phases/01-foundation/01-06-SUMMARY.md`; commits ab78606, c64cfa9. NF-05 done.
- Plan 01-08 COMPLETE (2026-10-03): six drill-down placeholders (`src/app/worksites.tsx`, `src/app/worker/[id].tsx` echoing id, `src/app/worksite-form.tsx`, `src/app/worker-form.tsx`, `src/app/export.tsx`, `src/app/backup.tsx`), SQLite once-only init in `src/app/_layout.tsx` (module `initialized` guard, splash hide in `finally` with double-hide catch, `dbError` screen), shared flat `EmptyState` in `src/components/empty-state.tsx`; `tsc` exit 0, phase-wide no-hex/no-network gates pass; SUMMARY at `.planning/phases/01-foundation/01-08-SUMMARY.md`; commits 6194ffc, d2d2364, ebd0c15. DS-02, NF-01, NF-02, NF-05 automated acceptance done; on-device `__boot_probe__` restart proof + airplane-mode boot DEFERRED to Phase 9 by user approval (no dev build in this environment).
- Plan 02-01 COMPLETE (2026-10-06): nav foundation — four tab routes moved with `git mv` into `src/app/(tabs)/` + `(tabs)/_layout.tsx` rendering `AppTabs`; root `src/app/_layout.tsx` renders theme-driven `<Stack>` (`(tabs)` headerless + 6 titled drill-down screens); db gate/splash/retry untouched; `tsc` exit 0; SUMMARY at `.planning/phases/02-worksites-workers/02-01-SUMMARY.md`; commits 927aed3, aafd150. WS-04/WK-04 reachability done; on-device push/back-header proof DEFERRED to Phase 9 (no dev build).
- Plan 02-03 COMPLETE (2026-10-06): shared `src/components/form-field.tsx` (frozen prop contract: label/value/onChangeText/placeholder/error/keyboardType/autoCapitalize, destructive border + polite live-region error) + rewritten `src/app/worksite-form.tsx` (add/edit via `?id=`, `getWorksite` prefill on focus, "Worksite not found" EmptyState, 5-chip `WORKSITE_TYPES` picker defaulting to Office, exact `'Name is required'` gating, blank address → `null`, orange Save → `router.back()`); `WORKSITE_TYPES` tuple added to `src/db/worksites.ts` per plan interface contract (Rule 3, committed with task 2); `tsc` exit 0, all grep gates pass; SUMMARY at `.planning/phases/02-worksites-workers/02-03-SUMMARY.md`; commits 894196a, f8baccf. WS-01, WS-02 done.
- Plan 02-04 COMPLETE (2026-10-06): rewritten `src/app/(tabs)/workers.tsx` — header (Workers title + text-only primary Worksites entry → `/worksites`), All/per-site filter chips refetching via `listWorkers({ worksiteId })` on focus, memo rows (`name` + `role · site` via include-inactive name Map, `'—'` fallback) → `/worker-form?id=…`, exact §7.5 empty copy with Add worker action, single orange `+ Add worker` CTA in non-empty branch only; `tsc` exit 0, all grep gates pass (pre-existing watcher-corruption failure verified on clean HEAD before committing); SUMMARY at `.planning/phases/02-worksites-workers/02-04-SUMMARY.md`; commits 889526c, 0ae3fa0. WK-04 done.
- Plan 02-05 COMPLETE (2026-10-06): rewritten `src/app/worker-form.tsx` — add/edit via `?id=`, `getWorker` prefill on focus, "Worker not found" EmptyState (Users icon, no action), name/role/phone FormFields (frozen contract, phone-pad), active-only worksite radio rows (default first active in add / current id in edit), zero-sites guidance → `/worksite-form` with Save disabled, exact `'Name is required'` / `'Choose a worksite'` gating, blanks → `null`, reassignment via same `updateWorker` call, single-accent orange Save → `router.back()`; legacy inactive `worksite_id` leaves selector unselected so save requires an active pick (T-02-15); `Worksite` type imported from `@/db/types` (Rule 1 fix); `tsc` exit 0, all grep gates pass; SUMMARY at `.planning/phases/02-worksites-workers/02-05-SUMMARY.md`; commits 65c7cbf, a7fb1c1. WK-01, WK-02 done.
- Plan 02-06 COMPLETE (2026-10-06): shared `src/components/confirm-dialog.tsx` (frozen contract: visible/title/message/confirmLabel/onConfirm/onCancel; fade Modal, `onRequestClose` + backdrop-press cancel, `Radius.lg` card, text-only destructive confirm) + edit-mode Remove in `src/app/worksite-form.tsx` (live `listWorkers({ worksiteId })` count at press time, exact count-aware copy, confirm → `deactivateWorksite` → `router.back()`, zero DELETE SQL); `tsc` exit 0, all grep gates pass; SUMMARY at `.planning/phases/02-worksites-workers/02-06-SUMMARY.md`; commits 40fe351, d38b8a1. WS-03 done.

## Decisions (carry into planning)

- Use **Expo Router + TypeScript strict**, not React Navigation / JS from `build_plan.md`.
- Extend `src/constants/theme.ts`; do **not** create a parallel `src/theme`.
- SQLite via `expo-sqlite` (requires a development build; not available in Expo Go).
- `off_day` excluded from attendance-% denominator; `half_day` counts 0.5.
- Soft-delete worksites/workers via `is_active`; history preserved.
- Manual backup/restore only in v1.
- Dev loop now needs a development build (expo-dev-client installed; Expo Go can't load sqlite/file-system/sharing/print).
- Plan grep gates run as node -e equivalents on Windows PowerShell (no grep binary); assertions identical.
- `expo-router/unstable-native-tabs` SDK-57 color API confirmed from versioned docs + installed types: `labelStyle` and `iconColor` both accept `{ default, selected }` (plan 01-07); use those keys for active/inactive tab colors, never invented ones.
- `SplashScreen.hideAsync()` in `_layout.tsx` carries `.catch(() => {})` because `AnimatedSplashOverlay` also hides the splash — a double-hide rejection must not surface (plan 01-08).
- `EmptyState` action button renders only when both `actionLabel` and `onAction` are provided — no dead affordances (plan 01-08).
- `worker/[id]` param stays a display string at the route boundary; later DAOs must bind it as a `?` parameter, never interpolate (plan 01-08, T-08-01).
- Plan 01-08 marked complete on automated gates by user approval (2026-10-03): the on-device `__boot_probe__` persistence proof + airplane-mode boot check are deferred verification debt for Phase 9, when a development build exists.
- Root navigation is a `<Stack>` hosting a URL-transparent `(tabs)` group (plan 02-01): drill-downs push with theme-driven headers; tab screens stay headerless. `(tabs)/index.tsx` keeps URL `/` per versioned Expo docs.
- List screens refetch on every focus via `useFocusEffect(useCallback(...))` so form saves reflect immediately; worker counts stay derived live via `listWorkers({ worksiteId })`, never cached (plan 02-02).
- One orange action per screen state: the worksite-list CTA renders only in the non-empty branch because the empty state carries its own accent action (plan 02-02).
- List-screen 16px gutters live on title/list/footer individually, not on `SafeAreaView` padding, to avoid doubled footer insets (plan 02-02).
- On Windows, the background `expo start` file-watcher regen of `.expo/types/router.d.ts` emits backslash-mixed context keys, dropping `/` for `/index` and breaking `tsc` on hrefs (plans 02-01, 02-02). Workaround: re-run `regenerateDeclarations()` from `@expo/router-server/build/typed-routes` in node (forward-slash context, same as server-start generation). Recurred on modify-only edits in 02-02, so expect it on ANY source edit while the watcher runs — not just route add/delete.
- `WORKSITE_TYPES` lives in `src/db/worksites.ts` as a frozen `as const` tuple (plan 02-03 interface contract); screens import it, never re-declare the 5-type literal.
- Form validation gates on `(triedSubmit || fieldTouched)` with the exact plan-specified error string passed as `FormField` error; touch tracking lives in the screen's `onChangeText` because the frozen `FormField` contract has no `onBlur` (plan 02-03).
- Tampered `?id=` resolves via `getWorksite` and renders a no-action "not found" EmptyState — the raw param never reaches SQL or UI text (plan 02-03, T-02-07).
- Worker-list CTA follows the 02-02 one-orange rule (footer CTA only in the non-empty branch; empty state carries its own accent action), and site names resolve via a display-only `listWorksites(true)` Map while chips/rows stay active-only (plan 02-04, T-02-10).
- Worker-form loading gate covers both modes (`useState(true)` initial) because add mode also awaits `listWorksites()` — the zero-sites branch must never flash before sites resolve (plan 02-05).
- Edit-mode prefill uses the worker's `worksite_id` only when it matches a DAO-loaded active site; a legacy inactive id leaves the selector unselected so the save gate enforces picking an active site while DB history stays intact (plan 02-05, T-02-15).
- Destructive confirms are text-only (`theme.destructive` text, never a filled background) with Cancel/back/backdrop all aborting; guard counts are queried live at press time, never passed as stale props (plan 02-06, T-02-16).
- `ConfirmDialog` backdrop Pressable wraps the card; nested action Pressables take precedence, and Remove-press ripple uses neutral `theme.muted` to avoid implying a filled destructive surface (plan 02-06).

## Deferred Verification Debt

- Plan 01-08 on-device proof deferred to Phase 9 (user-approved 2026-10-03): `__boot_probe__` row-survives-restart counts + airplane-mode boot check. No development build exists in this environment; execute the exact steps recorded in `.planning/phases/01-foundation/01-08-SUMMARY.md` ("Deferred Verification") once a dev build exists.
- Plan 02-01 on-device proof deferred to Phase 9: drill-down push + always-visible back header check. Execute once a dev build exists (see `.planning/phases/02-worksites-workers/02-01-SUMMARY.md` "Next Phase Readiness").

## Blockers

None. (Prior 01-08 dev-build blocker resolved by deferral — see Deferred Verification Debt above.)

## Next

`/gsd-execute-phase 2` — continue Phase 2 (Worksites & Workers): 02-01 nav + 02-02 worksite list + 02-03 worksite form + 02-04 worker list + 02-05 worker form + 02-06 worksite delete done 2026-10-05/06; remaining: wave 3 (02-07).

## Notes

- `build_plan.md` is retained as a planning reference only; its stack section is stale.
- The `.planning/` artifacts were bootstrapped manually because the repo had no GSD project state.
- The `gsd-planner` subagent could not be used on this provider (it crashes with a `content[].thinking` API error). The Phase 1 plan set was written directly and structurally validated (8 plans, 2–3 tasks each, ≤3 files/task, all req IDs covered). The `gsd-plan-checker` pass was not run for the same provider reason.
