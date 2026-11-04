# Phase 9: Build & Ship - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Android release path for the finished offline app: configure an EAS production profile, produce a release-signed APK that installs independently of the development environment, run the production-build and deferred on-device proofs against that exact APK, and hand the verified artifact to the manager. This phase may change release configuration and documentation, but it does not add product capabilities. Play Store/AAB distribution, iOS release work, web deployment, CI/CD, OTA updates, and store-listing collateral are outside the phase.

Phase 8's security review is still a prerequisite in `.planning/STATE.md`: it must be completed or explicitly waived before Phase 9 execution advances. That prerequisite is not reopened here.

</domain>

<decisions>
## Implementation Decisions

### Release identity
- **D-01:** The installed, user-visible app name is **Hazra**. Apply this as the display name only (`expo.name`); do not propagate the rename through technical identifiers.
- **D-02:** Keep the Android application ID **`com.exy99.hazraapp`**. This is the stable identity for the first and subsequent sideloaded builds.
- **D-03:** The first shipped release is **v1.0.0**. Android's internal build number must increment automatically for EAS production builds so rebuilt APKs remain distinguishable and upgradeable.
- **D-04:** Keep the existing Expo slug/npm package name `hazra-app` and URL scheme `hazraapp`. No broad identifier rename is wanted.

### Distribution route and artifact
- **D-05:** v1 ships by **direct APK sideload only**. Do not add a Play Store track, public listing, AAB deliverable, or extra Play-oriented profile to this phase.
- **D-06:** The production EAS profile must output an installable, release-signed APK. The exact same APK that passes release testing is the artifact handed to the manager; a debug/development/preview build cannot stand in for it, and the tested APK must not be rebuilt afterward.
- **D-07:** The handoff bundle includes the APK, concise install and future sideload-update instructions, app version and Android build-number details, and a SHA-256 checksum for integrity verification.
- **D-08:** Sideloading is the intended ongoing distribution posture, not merely a temporary bridge to Play Store. No work is required to preserve a Play listing path. Normal Android signing continuity is still mandatory so a later sideloaded APK can update the installed app without uninstalling it or losing local SQLite data.

### Release acceptance
- **D-09:** Close the outstanding production-device debt from Phases 1, 2, 6, and 7 before handoff. This includes offline/restart persistence, roster removal/navigation behavior, CSV/PDF Downloads and second-device opening, and backup/restore/invalid-file checks. The granular UAT artifacts and `.planning/STATE.md` are the acceptance sources; do not silently drop a pending row.
- **D-10:** Run the proofs against the unchanged production APK from D-06. If a deferred proof originally assumed temporary debug instrumentation (for example, the Phase 1 `__boot_probe__` SQL logging), use normal app behavior or non-mutating external inspection so the shipped binary remains byte-for-byte the tested binary.
- **D-11:** Phase 9 is Android-only because the roadmap's release criterion is `eas build --platform android`. Existing iOS and web runtime compatibility must not be regressed, but producing or distributing those builds is not part of this phase.

### OpenCode's Discretion
- Exact EAS account/project initialization and Android signing-credential management, subject to: no secrets or keystores committed, ownership/recovery documented for the user, and the signing key preserved for future sideloaded updates.
- Exact SDK 58-supported `eas.json` fields, EAS app-version source, and build-number automation mechanism. Research these against current official Expo/EAS documentation rather than relying on remembered APIs.
- Physical Android device model(s), second-device transfer target, evidence format, APK filename, and private archive location, provided every locked acceptance check is reproducible and the delivered checksum matches the tested APK.
- How to reconcile the Phase 2 tracking mismatch: `02-HUMAN-UAT.md` records roster restart as passed and four later rows as pending, while `.planning/STATE.md` still summarizes broader roster debt. Preserve the passed result, execute every granular pending row, and cover release-build persistence separately under REL-01.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and project constraints
- `.planning/ROADMAP.md` §Phase 9 — Build & Ship goal, Android production-build boundary, four success criteria, and REL-01 mapping.
- `.planning/REQUIREMENTS.md` §Release (REL-01) — install-and-run requirement independent of the development environment.
- `.planning/PROJECT.md` — offline/single-manager product boundary, live SDK/stack, and stale-document reconciliation rules.
- `.planning/STATE.md` §§Deferred Verification Debt, Next — outstanding device proofs and the Phase 8 security-gate prerequisite.
- `AGENTS.md` §§Expo has changed, Commands, Generated & native files — mandatory SDK 58 documentation checks, npm/EAS commands, CNG constraints, and release verification commands.

### Live release configuration
- `app.json` — current `1.0.0` app version, `hazra-app` display name/slug, `hazraapp` scheme, Android package `com.exy99.hazraapp`, icon/splash config, and native plugins.
- `package.json` — Expo SDK 58, native-module inventory, npm scripts, and current package version.
- `.gitignore` — generated native folders and signing-material exclusions; release work must not commit credentials.

### Deferred on-device acceptance
- `.planning/phases/01-foundation/01-08-SUMMARY.md` §Deferred Verification — SQLite restart persistence and airplane-mode boot proof, including the original `__boot_probe__` procedure.
- `.planning/phases/02-worksites-workers/02-HUMAN-UAT.md` — latest granular roster UAT state: restart persistence passed; worker removal, worksite removal/count, drill-down back navigation, and permanent delete pending.
- `.planning/phases/06-export/06-HUMAN-UAT.md` — four pending production-device export proofs: spreadsheet parsing, Downloads CSV/PDF, second-device transfer, and preselected/tampered entry points.
- `.planning/phases/07-backup-restore/07-04-SUMMARY.md` — completed backup/restore UI behavior that Phase 9 must exercise on device.
- `.planning/STATE.md` §Deferred Verification Debt — four Phase 7 device proofs not represented by a dedicated UAT file: external backup opening, restore round-trip, document picking, and invalid-backup rejection.

### Mandatory external documentation entry points
- `https://docs.expo.dev/versions/v58.0.0/` — version-matched Expo SDK documentation; use for SDK-bound APIs and config behavior.
- `https://docs.expo.dev/llms.txt` — current Expo documentation index and corrections; resolve exact EAS/build/versioning pages from here.
- `https://docs.expo.dev/eas/index.md` — official EAS build, credentials, and distribution documentation entry point.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app.json` already contains the Android package, production icon/adaptive icon/splash, required native plugins, and portrait/keyboard settings. Release work should alter only the display name and fields required by researched EAS setup.
- `scripts/verify-app-assets.mjs`, `scripts/verify-contrast.mjs`, and `scripts/verify-tab-shell.mjs` are standing pre-build regression gates, alongside `npx tsc --noEmit` and `npx expo-doctor`.
- `src/db/index.ts` owns idempotent SQLite initialization and schema migration state; it is the persistence path exercised by the release build.
- `src/utils/files.ts`, `src/app/export.tsx`, and `src/app/backup.tsx` provide the Downloads, document-picker, print, sharing, backup, and restore paths that need real release-build proof rather than new implementations.

### Established Patterns
- Continuous Native Generation is locked: `ios/` and `android/` are generated and gitignored; configure release behavior through Expo config/plugins and `eas.json`, never hand-edited native files.
- The project uses npm and `npx eas-cli@latest`; there is currently no `eas.json`, CI pipeline, or committed signing material.
- The app is offline and account-free. EAS is build infrastructure only; do not add runtime networking, analytics, authentication, or cloud sync.
- Native SQLite/file-system/print/sharing behavior must be validated in a real release build. Expo Go and a development client are not acceptable evidence for REL-01.

### Integration Points
- Add root `eas.json` with the researched production APK/versioning configuration.
- Update only `expo.name` in `app.json` from `hazra-app` to `Hazra`; retain slug, scheme, Android package, plugins, and asset wiring.
- EAS project initialization may add standard project metadata to Expo config; planner must verify the SDK 58/EAS-supported shape before editing.
- Release evidence and the handoff manifest must tie the EAS build ID, v1.0.0, Android build number, APK SHA-256, device results, and delivered filename to one immutable artifact.

</code_context>

<specifics>
## Specific Ideas

- The manager should see the short label **“Hazra”** under the installed icon; the longer project title is not the installed label.
- Distribution should feel like a deliberate private handoff, not an unfinished developer build: one verified production APK with a small install/update guide and checksum.
- “Sideload only” is an explicit decision. Do not spend phase time on Play Console setup, listing assets, AAB generation, or future-store accommodation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 9. Play Store distribution was considered and explicitly rejected rather than deferred.

</deferred>

---

*Phase: 09-build-ship*
*Context gathered: 2026-11-04*
