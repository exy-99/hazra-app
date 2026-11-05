# Phase 9: Build & Ship - Research

**Researched:** 2026-11-05 `[VERIFIED: user-provided current date]`
**Domain:** Expo SDK 58 / Expo Build Android release engineering
**Confidence:** HIGH — the release configuration is covered by current official Expo/EAS and Android documentation; account, credential, artifact, and device outcomes remain intentionally human-owned checkpoints. `[CITED: https://docs.expo.dev/eas/cli.md]` `[CITED: https://developer.android.com/google/play/app-updates]`

<user_constraints>
## User Constraints (from CONTEXT.md)

**Provenance:** The decisions, discretion areas, and deferred scope below are copied verbatim from `09-CONTEXT.md`. `[VERIFIED: .planning/phases/09-build-ship/09-CONTEXT.md]`

### Locked Decisions

#### Release identity
- **D-01:** The installed, user-visible app name is **Hazra**. Apply this as the display name only (`expo.name`); do not propagate the rename through technical identifiers.
- **D-02:** Keep the Android application ID **`com.exy99.hazraapp`**. This is the stable identity for the first and subsequent sideloaded builds.
- **D-03:** The first shipped release is **v1.0.0**. Android's internal build number must increment automatically for EAS production builds so rebuilt APKs remain distinguishable and upgradeable.
- **D-04:** Keep the existing Expo slug/npm package name `hazra-app` and URL scheme `hazraapp`. No broad identifier rename is wanted.

#### Distribution route and artifact
- **D-05:** v1 ships by **direct APK sideload only**. Do not add a Play Store track, public listing, AAB deliverable, or extra Play-oriented profile to this phase.
- **D-06:** The production EAS profile must output an installable, release-signed APK. The exact same APK that passes release testing is the artifact handed to the manager; a debug/development/preview build cannot stand in for it, and the tested APK must not be rebuilt afterward.
- **D-07:** The handoff bundle includes the APK, concise install and future sideload-update instructions, app version and Android build-number details, and a SHA-256 checksum for integrity verification.
- **D-08:** Sideloading is the intended ongoing distribution posture, not merely a temporary bridge to Play Store. No work is required to preserve a Play listing path. Normal Android signing continuity is still mandatory so a later sideloaded APK can update the installed app without uninstalling it or losing local SQLite data.

#### Release acceptance
- **D-09:** Close the outstanding production-device debt from Phases 1, 2, 6, and 7 before handoff. This includes offline/restart persistence, roster removal/navigation behavior, CSV/PDF Downloads and second-device opening, and backup/restore/invalid-file checks. The granular UAT artifacts and `.planning/STATE.md` are the acceptance sources; do not silently drop a pending row.
- **D-10:** Run the proofs against the unchanged production APK from D-06. If a deferred proof originally assumed temporary debug instrumentation (for example, the Phase 1 `__boot_probe__` SQL logging), use normal app behavior or non-mutating external inspection so the shipped binary remains byte-for-byte the tested binary.
- **D-11:** Phase 9 is Android-only because the roadmap's release criterion is `eas build --platform android`. Existing iOS and web runtime compatibility must not be regressed, but producing or distributing those builds is not part of this phase.

### OpenCode's Discretion
- Exact EAS account/project initialization and Android signing-credential management, subject to: no secrets or keystores committed, ownership/recovery documented for the user, and the signing key preserved for future sideloaded updates.
- Exact SDK 58-supported `eas.json` fields, EAS app-version source, and build-number automation mechanism. Research these against current official Expo/EAS documentation rather than relying on remembered APIs.
- Physical Android device model(s), second-device transfer target, evidence format, APK filename, and private archive location, provided every locked acceptance check is reproducible and the delivered checksum matches the tested APK.
- How to reconcile the Phase 2 tracking mismatch: `02-HUMAN-UAT.md` records roster restart as passed and four later rows as pending, while `.planning/STATE.md` still summarizes broader roster debt. Preserve the passed result, execute every granular pending row, and cover release-build persistence separately under REL-01.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 9. Play Store distribution was considered and explicitly rejected rather than deferred.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | The app installs and runs as a production build independent of the dev environment (SQLite paths, filesystem, sharing verified in a release build). | Use the minimal production APK profile, remotely managed/incremented Android `versionCode`, release signing continuity, immutable-artifact evidence chain, and the complete human production-device matrix in this document. `[VERIFIED: .planning/REQUIREMENTS.md]` `[CITED: https://docs.expo.dev/eas/json.md]` |
</phase_requirements>

## Summary

The repository is already an Expo SDK 58 application (`expo ~58.0.23`) with the required Android-native runtime modules installed; Phase 9 is release configuration, provenance, and acceptance work rather than product implementation. The live config already has `version: 1.0.0`, package `com.exy99.hazraapp`, slug `hazra-app`, scheme `hazraapp`, and the required native plugins, but it still has display name `hazra-app`, no EAS project metadata, and no `eas.json`. `[VERIFIED: package.json]` `[VERIFIED: app.json]` `[VERIFIED: glob for eas.json]`

The prescriptive configuration is a single `production` profile whose Android section sets `buildType: "apk"` and `autoIncrement: "versionCode"`, with `cli.appVersionSource: "remote"`, `cli.requireCommit: true`, and remotely managed credentials. Expo's current schema maps `buildType: "apk"` to the release Gradle task `:app:assembleRelease`; a default production profile would otherwise produce an AAB, which cannot be installed directly. Remote versioning keeps the Android developer-facing build number on Expo's servers and increments it for production builds while `expo.version` remains the human-facing `1.0.0`. `[CITED: https://docs.expo.dev/eas/json.md]` `[CITED: https://docs.expo.dev/build-reference/apk.md]` `[CITED: https://docs.expo.dev/build-reference/app-versions.md]`

Per the user's resume steering, the agent must stop at repository-owned configuration, static validation, and evidence/handoff templates. The user personally owns EAS authentication/project linkage, signing-credential interaction and backup, cloud build invocation, APK download, checksum capture, installation, all physical-device UAT, second-device opening, and final handoff; no plan may mark those outcomes passed without the user's supplied evidence. `[VERIFIED: user steering, 2026-11-05]`

Phase 8's security review remains a hard prerequisite: `08-SECURITY.md` is absent and `.planning/STATE.md` says the review must run or be explicitly waived before Phase 9 execution advances. Planning may proceed, but the first execution gate must verify completion or a recorded waiver. `[VERIFIED: .planning/STATE.md]` `[VERIFIED: glob .planning/phases/08-polish-edge-cases/08-SECURITY.md]`

**Primary recommendation:** Commit a minimal, Android-only release contract and templates first; after the Phase 8 gate, hand the user a checkpoint sequence that creates one release-signed APK, binds every proof to its build ID/version/signing certificate/SHA-256, rejects that artifact on any required change, and hands off only the unchanged bytes that passed every row.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Display name, version name, package, slug, scheme | Repo / Expo app config | CNG-generated Android resources | `app.json` is the source from which CNG generates the standalone app's label and identifiers; native folders remain generated. `[CITED: https://docs.expo.dev/versions/v58.0.0/config/app.md]` |
| Build profile and APK packaging | Repo / release config | Expo Build service | `eas.json` selects the production profile and `android.buildType: "apk"`; Expo Build executes the release build. `[CITED: https://docs.expo.dev/build/eas-json.md]` |
| EAS project identity | Expo Services project | Repo `owner` + `extra.eas.projectId` | Human-owned `eas init` creates or links the remote project and writes its non-secret identity metadata locally. `[CITED: https://docs.expo.dev/tutorial/eas/configure-development-build.md]` |
| Android build-number state | Expo Services remote version store | EAS build metadata / APK manifest | With `appVersionSource: "remote"`, local `android.versionCode` is not authoritative; the actual value must be copied from the completed build/APK into evidence. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` |
| APK signing continuity | Android keystore managed by Expo Services | User-controlled encrypted recovery backup | Android updates require matching application ID and signing certificate; direct sideload has no Play-managed recovery path, so the private key backup is release-critical. `[CITED: https://developer.android.com/google/play/app-updates]` `[CITED: https://docs.expo.dev/app-signing/security.md]` |
| SQLite persistence | Android client | App-private SQLite storage | `expo-sqlite` persists its database across app restarts; the exact production APK must prove the application's real initialization and data path. `[CITED: https://docs.expo.dev/versions/v58.0.0/sdk/sqlite.md]` `[VERIFIED: src/db/index.ts]` |
| Downloads, PDF, backup, restore, sharing | Android client | Android SAF, document picker, share sheet, external viewer apps | The implementation delegates public Downloads access and external opening/sharing to platform services, so static checks cannot replace physical-device proof. `[CITED: https://docs.expo.dev/versions/v58.0.0/sdk/filesystem-legacy.md]` `[CITED: https://docs.expo.dev/versions/v58.0.0/sdk/sharing.md]` |
| Artifact identity and integrity | Human release process / private archive | EAS build record + repo commit | Build ID, source commit, version, certificate fingerprint, filename, size, and SHA-256 must identify one immutable APK from download through handoff. `[VERIFIED: 09-CONTEXT.md D-06/D-07]` `[CITED: https://docs.expo.dev/eas/cli.md]` |
| Release acceptance | Human physical-device checkpoint | Repo evidence template | The user, not the agent, executes and attests install/UAT/checksum/handoff steps against the exact APK. `[VERIFIED: user steering, 2026-11-05]` |

## Project Constraints (from AGENTS.md)

- Target Expo SDK 58, React Native 0.88, React 19.3, and strict TypeScript; prioritize mobile-first, performant, cross-platform-safe changes even though Phase 9 only produces Android. `[VERIFIED: AGENTS.md]`
- Trust live code/config and `.planning/` over stale `build_plan.md`; do not scaffold, switch to React Navigation, introduce JavaScript/JSDoc, or create parallel `src/theme|db|navigation|screens|utils` structures. `[VERIFIED: AGENTS.md]`
- Before touching Expo/EAS behavior, confirm the installed Expo major, fetch the matching `v58.0.0` docs, fetch `llms.txt`, and follow the current exact page; this research did all three. `[VERIFIED: package.json]` `[CITED: https://docs.expo.dev/versions/v58.0.0/]` `[CITED: https://docs.expo.dev/llms.txt]`
- Use npm and `npx`, never Bun; use `npx eas-cli@latest` for EAS commands and `npx expo install` if an Expo dependency ever changes. No dependency change is recommended for this phase. `[VERIFIED: AGENTS.md]`
- Run `npx tsc --noEmit` before completion; also retain the standing `verify-app-assets`, `verify-contrast`, and `verify-tab-shell` gates and run `npx expo-doctor`. `[VERIFIED: AGENTS.md]`
- Do not run `npm run reset-project`; it is destructive. Do not treat `npm run lint` or `npx expo lint` as a clean gate because ESLint is not installed/configured. `[VERIFIED: AGENTS.md]`
- Keep Expo Router and TypeScript route structure intact; components/hooks/constants stay outside `src/app`, aliases stay `@/*` and `@/assets/*`, and this non-UI phase should not change route/component code. `[VERIFIED: AGENTS.md]`
- Preserve platform filename splits rather than introducing new `Platform.OS` branches when platform behavior is ever needed; no platform implementation change is recommended here. `[VERIFIED: AGENTS.md]`
- Preserve typed routes, React Compiler, theme tokens, and all existing icon/splash wiring; only `expo.name` plus EAS-generated `owner`/`extra.eas.projectId` are permitted `app.json` deltas. `[VERIFIED: AGENTS.md]` `[VERIFIED: .planning/phases/09-build-ship/09-CONTEXT.md]`
- Continuous Native Generation is mandatory: never create or hand-edit `ios/` or `android/`; release behavior belongs in `app.json`, config plugins, and root `eas.json`. `[VERIFIED: AGENTS.md]` `[CITED: https://docs.expo.dev/llms.txt]`
- No test runner, CI, or `eas.json` currently exists; do not introduce CI/CD as part of this phase. `[VERIFIED: AGENTS.md]` `[VERIFIED: .planning/phases/09-build-ship/09-CONTEXT.md]`
- Project skill discovery found neither `.claude/skills/` nor `.agents/skills/`, so there are no additional repository-local skill rules to apply. `[VERIFIED: glob .claude/skills and .agents/skills]`

## Recommended Release Contract

### Minimal `eas.json`

Use exactly one build profile; do not add development, preview, submit, update, Play, iOS, or web profiles. `[VERIFIED: 09-CONTEXT.md D-05/D-11]`

```json
{
  "cli": {
    "version": ">= 27.4.1",
    "appVersionSource": "remote",
    "requireCommit": true
  },
  "build": {
    "production": {
      "credentialsSource": "remote",
      "android": {
        "buildType": "apk",
        "autoIncrement": "versionCode"
      }
    }
  }
}
```

`cli.version` accepts a semantic-version range; `requireCommit: true` makes builds use a shallow clone of the last commit and blocks non-interactive builds on a dirty tree; `credentialsSource: "remote"` selects Expo-managed signing credentials; Android-specific `autoIncrement: "versionCode"` is the explicit equivalent of `true`; and `buildType: "apk"` maps to `:app:assembleRelease`. `[CITED: https://docs.expo.dev/eas/json.md]` `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`

Do **not** set `distribution: "internal"`. That option is designed to create shareable internal-build URLs and changes Android's default output to APK; this phase instead uses the documented production-profile exception `android.buildType: "apk"` and a private downloaded-file handoff. `[CITED: https://docs.expo.dev/build/internal-distribution.md]` `[CITED: https://docs.expo.dev/build/eas-json.md#production-builds]`

Do **not** add `android.versionCode` to `app.json`: remote version values are set on the native project during the build, local build-version fields are ignored under remote versioning, and the completed build's actual number is the evidence source. The absence of a local value lets a new remote version initialize at `1`, but the handoff must record the observed value rather than assume it because a linked project may already have remote version state. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]`

### Allowed `app.json` changes

1. Change only `expo.name` from `hazra-app` to `Hazra`; SDK 58 defines `name` as the home-screen name for a standalone app. `[CITED: https://docs.expo.dev/versions/v58.0.0/config/app.md#name]`
2. Preserve `expo.version: "1.0.0"`, `slug: "hazra-app"`, `scheme: "hazraapp"`, `android.package: "com.exy99.hazraapp"`, all plugins, experiments, and asset paths. `[VERIFIED: app.json]` `[VERIFIED: 09-CONTEXT.md D-02/D-04]`
3. After the human chooses and links the EAS account/project, accept only the standard non-secret metadata generated by `eas init`: `expo.owner` and `expo.extra.eas.projectId`. Do not invent a project ID or account owner in advance. `[CITED: https://docs.expo.dev/tutorial/eas/configure-development-build.md]`

### Credential custody recommendation

Use remote credentials under an Expo account or Organization controlled by the user, generate the Android keystore once if no existing release credential exists, and reuse that credential forever for this package. Expo reuses managed credentials on subsequent builds; its credential menu can download `credentials.json` and the keystore for local backup. `[CITED: https://docs.expo.dev/app-signing/managed-credentials.md]` `[CITED: https://docs.expo.dev/app-signing/syncing-credentials.md]`

Before any credential interaction, add root ignores for `/credentials.json`, `*.keystore`, `*.jks`, `*.apk`, and `*.aab`; the repo already ignores `*.jks` and several certificate formats but not `credentials.json`, `*.keystore`, or APK/AAB artifacts. `[VERIFIED: .gitignore]` `[CITED: https://docs.expo.dev/app-signing/local-credentials.md]`

The user must move the downloaded keystore and password-bearing `credentials.json` immediately to a user-controlled encrypted recovery location outside the repository, verify that Git has not staged/tracked either file, and remove the temporary repo-local copies. The release evidence may record the custodian, recovery-location reference, key alias, and public certificate SHA-256 fingerprint, but never passwords or private-key bytes. `[CITED: https://docs.expo.dev/app-signing/app-credentials.md]` `[CITED: https://developer.android.com/studio/publish/app-signing#keep-your-key-secure]`

### Source and artifact immutability rule

Set `requireCommit: true`, finish all repository gates, commit the exact release config/templates, and require a clean tree before the human starts the build. The current tree is not clean because `.planning/debug/cant-see-app-logo.md` is untracked; the user must decide whether to commit, move, or otherwise resolve that unrelated file rather than let an automated prompt include it. `[VERIFIED: git status --short --branch, 2026-11-05]` `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`

After the human downloads the APK by exact EAS build ID, the artifact lifecycle is procedural and binary-preserving: move/rename the file once into the private archive, record metadata, verify its signature, compute SHA-256, install that same file, and recompute the checksum before final handoff. Do not zip-edit, align, re-sign, repack, or otherwise modify the APK; Android documents that changing a signed APK invalidates its signature. `[CITED: https://developer.android.com/tools/apksigner]`

If any proof requires a source/config change, the current APK is rejected. After the fix, the user creates a new build (which receives a new remote `versionCode`), downloads a new artifact, replaces all evidence identifiers, and reruns the **entire** release matrix; partial pass results cannot be carried across APK hashes. `[VERIFIED: 09-CONTEXT.md D-03/D-06/D-10]`

## Human-Owned Checkpoint Boundary

The planner must model every row below as `autonomous: false`; repo tasks may prepare instructions/templates but may not execute or attest these actions. `[VERIFIED: user steering, 2026-11-05]`

| Checkpoint | Human action | Required recorded output | Why agent cannot close it |
|------------|--------------|--------------------------|---------------------------|
| H0 — Phase 8 security prerequisite | Run the Phase 8 security review or explicitly record a waiver. | `08-SECURITY.md` or named waiver decision. | The prerequisite belongs to the user/security workflow and is currently absent. `[VERIFIED: .planning/STATE.md]` |
| H1 — EAS account/project ownership | Authenticate, choose the user-controlled account/Organization, inspect any existing `@owner/hazra-app`, then create/link intentionally. | `owner`, project slug, project UUID, dashboard URL, and confirmation that package/slug were not changed. | Account ownership and creation are external privileged decisions. `[CITED: https://docs.expo.dev/eas/cli.md#eas-init]` |
| H2 — Signing credentials and recovery | Inspect existing Android credentials; reuse if legitimate, otherwise generate once; download and secure a recovery copy outside Git. | Credential owner/custodian, recovery reference, key alias, public cert SHA-256; explicit “no secret committed” check. | Keystore prompts and private material must remain under user custody. `[CITED: https://docs.expo.dev/app-signing/managed-credentials.md]` |
| H3 — Cloud build | From the clean committed tree, invoke the production Android build with no submit/update flags. | EAS CLI version, source commit, build ID/URL, profile, status, app version, Android build number. | User explicitly owns cloud build invocation and any service usage. `[VERIFIED: user steering, 2026-11-05]` |
| H4 — APK download and binary checks | Download by exact build ID, archive privately, inspect package/version/signature, and capture SHA-256. | Filename, byte size, SHA-256, package, versionName, versionCode, cert SHA-256, download timestamp. | User explicitly owns APK download and checksum capture. `[VERIFIED: user steering, 2026-11-05]` |
| H5 — Exact-APK install and primary-device UAT | Install the archived APK on a physical Android device and run every acceptance row with Metro/dev servers off. | Device model/OS, install method, timestamped pass/fail notes and screenshots tied to build ID/hash. | Physical state, Android pickers, share sheet, and external apps are not observable by the agent. `[CITED: https://docs.expo.dev/build-reference/apk.md]` |
| H6 — Second-device transfer/open | Transfer files from the exact release build and open them on a second device in external CSV/PDF viewers. | Target device/app names plus parse/render results. | This is a physical cross-device acceptance requirement. `[VERIFIED: .planning/phases/06-export/06-HUMAN-UAT.md]` |
| H7 — Final handoff | Recheck the archived APK hash, assemble the bundle, deliver it privately, and have the manager verify the checksum. | Handoff timestamp/recipient/channel and matching sender/recipient SHA-256. | The user explicitly owns final distribution and recipient confirmation. `[VERIFIED: user steering, 2026-11-05]` |

## Standard Stack

### Core

| Library / Service | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| Expo | `58.0.23` (published 2026-11-03) | SDK/CNG runtime and native project generation | Installed SDK major is locked by the repo; npm registry reported this as current on 2026-11-05. `[VERIFIED: npm registry]` |
| EAS CLI | `27.4.1` (published 2026-11-04) via `npx eas-cli@latest` | Project linking, config resolution, credentials, build metadata, artifact download | Current official CLI reference identifies 27.4.1 and documents all required commands. `[VERIFIED: npm registry]` `[CITED: https://docs.expo.dev/eas/cli.md]` |
| Expo Build | Hosted service | CNG release compilation and signing | Official service supports cloud Android binaries and Expo-managed credentials without committed native folders. `[CITED: https://docs.expo.dev/build/introduction.md]` |
| Expo managed Android credentials | Remote (`credentialsSource`) | Stable release keystore for sideload update continuity | Remote is the schema default, reuses credentials, and allows an explicit user-controlled recovery download. `[CITED: https://docs.expo.dev/eas/json.md]` `[CITED: https://docs.expo.dev/app-signing/syncing-credentials.md]` |
| PowerShell `Get-FileHash` | PowerShell 5.1 available | SHA-256 artifact integrity | Native command is available in this Windows environment; no checksum package is needed. `[VERIFIED: environment probe, 2026-11-05]` |

### Installed Runtime Modules Exercised by REL-01

| Library | Installed/current SDK-58 version | Production proof |
|---------|----------------------------------|------------------|
| `expo-sqlite` | `58.0.15` (published 2026-10-31) | Database initialization plus force-stop/relaunch and offline persistence. `[VERIFIED: package.json]` `[VERIFIED: npm registry]` |
| `expo-file-system` | `58.0.13` (published 2026-10-28) | Android SAF permission, real Downloads writes, binary PDF copy, and picked-file reads. `[VERIFIED: package.json]` `[VERIFIED: npm registry]` |
| `expo-sharing` | `58.0.22` (published 2026-11-03) | Native share sheet and second-device transfer. `[VERIFIED: package.json]` `[VERIFIED: npm registry]` |
| `expo-print` | `58.0.8` (published 2026-10-28) | HTML-to-PDF cache artifact before binary-safe Downloads save. `[VERIFIED: package.json]` `[VERIFIED: npm registry]` |
| `expo-document-picker` | `58.0.4` (published 2026-10-01) | Native JSON backup selection with immediate cache copy/read. `[VERIFIED: package.json]` `[VERIFIED: npm registry]` |

### Supporting Tools

| Tool | Version / availability | Purpose | Fallback |
|------|------------------------|---------|----------|
| Android SDK Build Tools | `37.0.0` installed under `$env:ANDROID_HOME` | `apksigner` signature/certificate verification and `aapt2 dump badging` APK manifest inspection. `[VERIFIED: local SDK probe]` | Invoke by absolute SDK path because neither tool is on `PATH`. `[VERIFIED: Get-Command/glob probe]` |
| Android Debug Bridge | `37.0.1` installed | Optional user-operated USB install and force-stop/relaunch support. `[VERIFIED: adb --version]` | Android's on-device package installer can sideload manually. `[CITED: https://docs.expo.dev/build-reference/apk.md]` |
| Git | `2.52.0.windows.1` | Clean committed source identity for `requireCommit`. `[VERIFIED: git --version]` | None for the selected full-Git workflow. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]` |
| Node/npm | Node `24.18.0`, npm `12.2.0` | Local Expo/EAS commands and verification scripts. `[VERIFIED: environment probe]` | Current EAS CLI accepts Node 22 or later, so no fallback is needed. `[CITED: https://docs.expo.dev/eas/cli.md#installation]` |

### Alternatives Considered (Discretion Areas Only)

| Instead of | Could Use | Tradeoff / decision |
|------------|-----------|---------------------|
| Explicit production `android.buildType: "apk"` | `distribution: "internal"` | Internal distribution also makes an APK but is designed for shareable tester URLs; use explicit build type to preserve the production-profile/private-file contract. `[CITED: https://docs.expo.dev/build/internal-distribution.md]` |
| Remote version source | Local `android.versionCode` + local auto-increment | Local auto-increment requires persisting/committing each bump and is harder to coordinate; current Expo guidance recommends remote source. Use remote. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` |
| Remote managed credentials + encrypted user backup | `credentialsSource: "local"` | Local mode puts a password-bearing `credentials.json` and keystore on the build operator's filesystem for every build. Remote management is simpler, while the downloaded encrypted recovery copy prevents single-provider custody. `[CITED: https://docs.expo.dev/app-signing/local-credentials.md]` |
| Minimal handoff files | Public internal-build URL | Internal URLs may be available to anyone with the URL unless project settings require sign-in; direct private APK transfer plus SHA-256 better matches the locked handoff. `[CITED: https://docs.expo.dev/build/internal-distribution.md]` |

**Installation:** Add no package dependency. Use the repository-mandated current CLIs on demand. `[VERIFIED: AGENTS.md]`

```powershell
npx expo --version
npx eas-cli@latest --version
```

## Architecture Patterns

### System Architecture Diagram

```text
Repo-owned inputs
  app.json (Hazra / 1.0.0 / stable IDs)
  eas.json (production APK / remote version / remote credentials)
  .gitignore + release verifier + blank evidence templates
                         |
                         v
              [H0: Phase 8 security gate]
                         |
                         v
Human EAS account ----> [H1: eas init/link] ----> owner + projectId reviewed in repo
                         |
                         v
                 static gates + clean commit
                         |
                         v
Human credential UI --> [H2: select/generate ONE Android keystore]
                         |                         \
                         |                          -> encrypted off-repo recovery copy
                         v
Human command -------> [H3: Expo Build production/Android]
                         |
                         +--> failure --> no artifact accepted; fix repo; new full cycle
                         |
                         v
                EAS build ID + signed APK
                         |
                         v
Human download ------> [H4: private archive + manifest/signature/SHA-256]
                         |
                         v
Human install --------> [H5: exact APK on physical Android]
                         |
                         +--> SQLite/offline/restart
                         +--> roster/navigation/remove/delete
                         +--> CSV/PDF Downloads + sharing
                         +--> backup/picker/restore/invalid files
                         +--> [H6: second-device external open]
                         |
                 any failure requiring change?
                    yes /             \ no
                       v               v
             reject APK/hash      recompute same-file hash
             new build + all      [H7: APK + guide + versions
             proofs rerun          + SHA256SUMS private handoff]
```

The decision branch is mandatory: evidence belongs to an APK hash, not merely to source code or an app version string. `[VERIFIED: 09-CONTEXT.md D-06/D-10]`

### Recommended Project Structure

```text
app.json                                      # Display name + stable release identity + EAS link metadata
eas.json                                      # One production Android APK profile
.gitignore                                    # Credentials/keystore/APK exclusions
scripts/
└── verify-release-config.mjs                 # Fast local release-contract gate
.planning/phases/09-build-ship/
├── 09-RESEARCH.md
├── 09-RELEASE-EVIDENCE-TEMPLATE.md           # Blank; user fills only from real build/device results
└── 09-HANDOFF-TEMPLATE.md                    # Blank install/update/checksum guide

<human-selected private archive outside Git>/Hazra-v1.0.0/
├── Hazra-v1.0.0-build-<actualVersionCode>.apk
├── INSTALL-AND-UPDATE.txt
├── RELEASE-MANIFEST.txt
└── SHA256SUMS.txt

<separate encrypted credential vault>/        # Never bundled with manager APK handoff
├── <release-keystore>.jks
└── credentials.json
```

The private archive and credential vault are runtime/user state, not repository directories; the exact locations remain the user's checkpoint decision. `[VERIFIED: 09-CONTEXT.md OpenCode's Discretion]`

### Pattern 1: Human-generated EAS project metadata

**What:** The user runs `eas init` under the chosen owner; the repo accepts the generated owner and UUID only after review. `[CITED: https://docs.expo.dev/tutorial/eas/configure-development-build.md]`

**When to use:** Exactly once before credential setup/build, or to link an already existing verified project. `[CITED: https://docs.expo.dev/eas/cli.md#eas-init]`

**Expected shape (placeholders are documentation only, never committed literally):**

```json
{
  "expo": {
    "owner": "<human-selected-account>",
    "extra": {
      "eas": {
        "projectId": "<human-generated-project-uuid>"
      }
    }
  }
}
```

### Pattern 2: Evidence keyed to the binary

**What:** One record joins source identity, remote build identity, native manifest identity, signing identity, file identity, and test identity. `[CITED: https://docs.expo.dev/eas/cli.md]` `[CITED: https://developer.android.com/tools/apksigner]`

**Minimum fields:**

```text
release: Hazra v1.0.0
source_commit: <full git SHA>
eas_cli_version: <actual>
eas_owner/project_id: <actual>
eas_build_id/build_url: <actual>
profile/platform/status: production / android / finished
package/versionName/versionCode: com.exy99.hazraapp / 1.0.0 / <actual>
signing_certificate_sha256: <public fingerprint>
apk_filename/size/sha256: <actual>
primary_device/model/os/install_method: <actual>
second_device/viewer_apps: <actual>
acceptance_rows: pass/fail + evidence reference + timestamp
handoff_recipient/channel/timestamp/recipient_checksum: <actual>
```

The template must default every result to `NOT RUN`; only the user changes a row to pass/fail. `[VERIFIED: user steering, 2026-11-05]`

### Pattern 3: Human command sheet, not agent execution

The planner may place the following current commands in the checkpoint instructions, but execution and evidence capture belong to the user. `[VERIFIED: user steering, 2026-11-05]`

```powershell
# Account/project (human checkpoint)
npx eas-cli@latest whoami
npx eas-cli@latest init

# Credentials (human checkpoint; interactive)
npx eas-cli@latest credentials:configure-build --platform android --profile production
npx eas-cli@latest credentials --platform android

# Resolve config before build (human review)
npx eas-cli@latest config --platform android --profile production --json --non-interactive

# Build exactly the production Android profile; no submit/update flags
npx eas-cli@latest build --platform android --profile production --message "Hazra v1.0.0 release candidate"

# Inspect/download the exact completed build ID
npx eas-cli@latest build:view <BUILD_ID> --json
npx eas-cli@latest build:download --build-id <BUILD_ID> --non-interactive
# If CLI download is unavailable for that build, use Download on that exact
# authenticated build-details page; never select an artifact only as “latest”.

# Binary inspection and checksum (human checkpoint)
$apk = '<PRIVATE_ARCHIVE>\Hazra-v1.0.0-build-<VERSION_CODE>.apk'
$bt = "$env:ANDROID_HOME\build-tools\37.0.0"
& "$bt\apksigner.bat" verify --verbose --print-certs $apk
& "$bt\aapt2.exe" dump badging $apk
Get-FileHash -Algorithm SHA256 $apk

# Optional USB installation; on-device package installer is also valid
adb install $apk
```

The current EAS CLI documents `build:view --json` and `build:download --build-id`; Android documents `apksigner verify --print-certs`, AAPT2 `dump badging`, and `adb install`. `[CITED: https://docs.expo.dev/eas/cli.md]` `[CITED: https://developer.android.com/tools/apksigner]` `[CITED: https://developer.android.com/tools/aapt2#dump]` `[CITED: https://developer.android.com/tools/adb#installapp]`

### Pattern 4: Update instructions preserve local data

Future handoff instructions must say: back up in Hazra first, verify the new APK checksum, install it **over** the existing app, and never uninstall as a troubleshooting shortcut. Android accepts an update only when application ID and signing certificate match and the version code is not lower; uninstalling to bypass a mismatch erases app data. `[CITED: https://developer.android.com/google/play/app-updates]`

If Android reports an incompatible package/signature conflict, the manager must stop and contact the release custodian rather than uninstall. Subsequent release planning must use the same `com.exy99.hazraapp` package, the preserved keystore, and a higher remote `versionCode`. `[CITED: https://developer.android.com/studio/publish/app-signing#signing-considerations]` `[VERIFIED: 09-CONTEXT.md D-02/D-03/D-08]`

### Anti-Patterns to Avoid

- **Default empty production profile:** It generates an AAB by default, which is not directly installable. Use explicit `android.buildType: "apk"`. `[CITED: https://docs.expo.dev/build-reference/apk.md]`
- **Development/preview artifact as proof:** Those profiles have different build semantics and violate D-06; test only the production profile's release APK. `[CITED: https://docs.expo.dev/build/eas-json.md]` `[VERIFIED: 09-CONTEXT.md D-06]`
- **Manual Gradle/native edits:** They violate CNG and create untracked native state; use `eas.json` and app config. `[VERIFIED: AGENTS.md]`
- **Temporary SQL logging in the final binary:** It changes the artifact under test; use normal UI behavior or non-mutating inspection. `[VERIFIED: 09-CONTEXT.md D-10]`
- **“Latest build” ambiguity:** Always select/download by build ID, never by recency alone. `[CITED: https://docs.expo.dev/eas/cli.md#eas-build-download]`
- **Rebuilding after UAT:** A rebuilt APK is different evidence even if source appears unchanged; reject/retest instead. `[VERIFIED: 09-CONTEXT.md D-06]`
- **Putting credentials beside the APK:** Credential recovery material is secret and must be archived separately from the manager handoff. `[CITED: https://docs.expo.dev/app-signing/app-credentials.md]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Android release compilation | Custom Gradle scripts or committed native projects | Expo Build + CNG | Current SDK-aware build images and config plugins already own native generation. `[CITED: https://docs.expo.dev/build/introduction.md]` |
| APK output selection | A custom `gradleCommand` | `android.buildType: "apk"` | The schema maps it directly to `:app:assembleRelease`; custom Gradle commands override normal behavior and add risk. `[CITED: https://docs.expo.dev/eas/json.md#buildtype]` |
| Android build-number allocator | A file/counter script | `cli.appVersionSource: "remote"` + Android `autoIncrement: "versionCode"` | Expo stores and increments the developer-facing build version. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` |
| Signing/key generation | Home-grown crypto or ad hoc key scripts | Expo-managed credentials, then secure user backup | Expo can generate/reuse the keystore; Android requires the same certificate for updates. `[CITED: https://docs.expo.dev/app-signing/managed-credentials.md]` |
| Signature validation | Parsing APK ZIP/signature blocks in Node | Android `apksigner verify --print-certs` | `apksigner` is the platform tool for supported-signature verification and certificate output. `[CITED: https://developer.android.com/tools/apksigner]` |
| APK manifest parsing | Regex over binary XML | Android `aapt2 dump badging` | AAPT2 extracts manifest/package information from generated APKs. `[CITED: https://developer.android.com/tools/aapt2#dump]` |
| Artifact checksum | A custom JavaScript hash utility | PowerShell `Get-FileHash -Algorithm SHA256` | The OS command is present and avoids a new dependency. `[VERIFIED: environment probe]` |
| Device/file-system simulation | Mock success cards or Expo Go screenshots | Exact production APK on real Android + real external apps | REL-01 explicitly requires release-build SQLite/filesystem/sharing behavior. `[VERIFIED: .planning/REQUIREMENTS.md]` |
| Release result generation | Agent-authored “pass” prose | Blank templates completed by the human | Build/device facts are external and must not be fabricated. `[VERIFIED: user steering, 2026-11-05]` |

**Key insight:** This phase's hard problems are identity continuity and evidence integrity, not code generation. Standard platform/build tools should create and inspect the artifact; the repo should only constrain inputs and make human results auditable.

## Runtime State Inventory

This section is required because D-01 changes the installed display name, even though technical identifiers intentionally do not change. `[VERIFIED: 09-CONTEXT.md D-01/D-04]`

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | The SQLite schema contains only worksites, workers, attendance, and `user_version`; no `hazra-app` display-name key exists. `[VERIFIED: src/db/index.ts]` | No data migration. Prove data persistence under the unchanged package ID in the production APK. |
| Live service config | No local `owner` or `extra.eas.projectId` exists, and EAS CLI is not authenticated in this environment. A matching remote project may or may not already exist and cannot be determined without the user's account. `[VERIFIED: app.json]` `[VERIFIED: npx eas-cli@latest whoami]` | Human checks existing EAS project/credentials before creating anything; safe code edit is only the generated owner/project UUID. |
| OS-registered state | No Android device is currently connected through ADB, so existing installations cannot be inventoried. An old debug/dev APK with the same package but another certificate could block installation. `[VERIFIED: adb devices -l]` `[CITED: https://developer.android.com/google/play/app-updates]` | Human selects a clean test device or backs up before resolving any package conflict; never uninstall a manager install merely to bypass signing mismatch. |
| Secrets/env vars | No release credential file is tracked; `.gitignore` already excludes several key formats and `.env*.local`, but not `credentials.json` or `*.keystore`. Source search found no runtime env-variable reads. `[VERIFIED: git ls-files secret-pattern scan]` `[VERIFIED: .gitignore]` `[VERIFIED: grep src]` | Add ignore rules before credential interaction; human stores credential backup outside Git. No env-var rename is needed. |
| Build artifacts / installed packages | No APK, AAB, `credentials.json`, or `eas.json` exists in the repo. The npm package name remains `hazra-app` by decision. `[VERIFIED: glob and package.json]` | Add `eas.json`; keep npm name; human creates/downloads the first release artifact and archives it outside Git. |

**Canonical answer:** After every repo file is updated, the consequential runtime state will still live in the human-selected EAS project, its remote Android version counter, its remote/recovery keystore, the installed package on each Android device, and the downloaded APK/private handoff archive. Those are separate human checkpoints, not code edits. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` `[CITED: https://docs.expo.dev/app-signing/managed-credentials.md]`

## Common Pitfalls

### Pitfall 1: Shipping the default AAB
**What goes wrong:** The build succeeds but the artifact cannot be directly installed. `[CITED: https://docs.expo.dev/build-reference/apk.md]`

**Why it happens:** Android production defaults to app bundle unless the profile explicitly requests APK. `[CITED: https://docs.expo.dev/eas/json.md#buildtype]`

**How to avoid:** Static-gate `build.production.android.buildType === "apk"`; inspect the downloaded extension and APK manifest before UAT.

**Warning signs:** EAS labels the artifact `.aab`, or there is no install path.

### Pitfall 2: Confusing `1.0.0` with Android `versionCode`
**What goes wrong:** Release docs report only the user-facing version, or future updates cannot be ordered. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]`

**Why it happens:** `expo.version` becomes Android `versionName`, while `android.versionCode` is a distinct developer-facing integer. `[CITED: https://docs.expo.dev/versions/v58.0.0/config/app.md#versioncode]`

**How to avoid:** Keep `expo.version` at `1.0.0`, use remote auto-increment, and record the actual completed build number from EAS/APK.

**Warning signs:** Handoff filename/manifest has no build number, or someone manually edits local `versionCode` despite remote source.

### Pitfall 3: Losing or replacing the signing key
**What goes wrong:** A future APK cannot update the installed app; uninstalling to recover erases local data. `[CITED: https://developer.android.com/google/play/app-updates]`

**Why it happens:** Direct sideload distribution has no Play App Signing recovery layer, and generating a fresh EAS credential changes the signing certificate. `[CITED: https://developer.android.com/studio/publish/app-signing]`

**How to avoid:** Reuse one remote credential, export an encrypted user-owned recovery copy, and record the public certificate SHA-256 fingerprint.

**Warning signs:** Credential prompts offer “generate new” despite an existing release, certificate fingerprint changes, or Android reports an incompatible package.

### Pitfall 4: Linking the wrong EAS project/owner
**What goes wrong:** Build/version/credential state attaches to an account the user does not control or to a stale project. `[CITED: https://docs.expo.dev/tutorial/eas/configure-development-build.md]`

**Why it happens:** `eas init` is account-aware and can create or link based on slug/project ID. `[CITED: https://docs.expo.dev/eas/cli.md#eas-init]`

**How to avoid:** Human records `whoami`, selected owner, project UUID, and dashboard URL; review the `app.json` diff before committing.

**Warning signs:** Unexpected owner/slug, an unexplained existing project, or project ID mismatch.

### Pitfall 5: Building a dirty or ambiguous source tree
**What goes wrong:** The artifact contains changes not represented by its cited commit, or EAS prompts to commit unrelated files. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`

**Why it happens:** The default workflow copies working-directory changes; `requireCommit` instead blocks or prompts on dirty state. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`

**How to avoid:** Use `requireCommit: true`, resolve the current unrelated untracked debug note explicitly, run all gates, and record the full source SHA.

**Warning signs:** Non-empty `git status --porcelain` immediately before build.

### Pitfall 6: Testing one file and handing off another
**What goes wrong:** Device evidence no longer proves the delivered bytes. `[VERIFIED: 09-CONTEXT.md D-06]`

**Why it happens:** “Same version” or “same build profile” is mistaken for binary identity, or a post-test rebuild replaces the file.

**How to avoid:** Key evidence to build ID + filename + size + SHA-256; recompute the same file at final handoff; require recipient checksum confirmation.

**Warning signs:** A later build ID, changed size/hash, renamed file with no re-hash, or missing original archive.

### Pitfall 7: Carrying partial UAT across a changed APK
**What goes wrong:** A new binary inherits old pass rows despite potentially changed native/JS content. `[VERIFIED: 09-CONTEXT.md D-10]`

**How to avoid:** Any source/config fix rejects the candidate and resets every Phase 9 acceptance row to `NOT RUN` for the new hash.

**Warning signs:** Mixed build IDs/hashes in one evidence file.

### Pitfall 8: Silently dropping deferred proof rows
**What goes wrong:** REL-01 is marked done while Phase 2, 6, or 7 device debt remains pending. `[VERIFIED: .planning/STATE.md]`

**How to avoid:** Seed the evidence template from the granular UAT/state sources listed in Validation Architecture; preserve Phase 2 roster restart as already passed but add a separate exact-release persistence row.

**Warning signs:** Fewer than four Phase 2 pending rows, four Phase 6 rows, or four Phase 7 rows.

### Pitfall 9: Installing over a differently signed dev build
**What goes wrong:** Android refuses installation even though the package name matches. `[CITED: https://developer.android.com/google/play/app-updates]`

**How to avoid:** Use a clean device or knowingly remove only disposable dev-test state; back up any valuable installation first. Never normalize uninstall/reinstall as the manager update path.

**Warning signs:** `INSTALL_FAILED_UPDATE_INCOMPATIBLE` or an on-device prompt requiring uninstall.

### Pitfall 10: Treating a success card as file proof
**What goes wrong:** SAF permission, PDF bytes, MIME handling, share targets, or external parsing can fail after in-app success. `[VERIFIED: src/utils/files.ts]`

**How to avoid:** Verify actual Downloads entries, external Excel/Sheets and PDF viewers, share transfer, and second-device open.

**Warning signs:** Evidence contains only in-app screenshots and no external file/open result.

### Pitfall 11: Using the old debug-only boot probe
**What goes wrong:** Temporary instrumentation changes the binary, so it is no longer the artifact intended for handoff. `[VERIFIED: .planning/phases/01-foundation/01-08-SUMMARY.md]` `[VERIFIED: 09-CONTEXT.md D-10]`

**How to avoid:** Create representative data through normal UI, force-stop/relaunch, and verify visible counts/rows in airplane mode; optional ADB inspection must be non-mutating.

### Pitfall 12: Advancing before Phase 8 security closure
**What goes wrong:** Release work proceeds despite the project's enforced prerequisite. `[VERIFIED: .planning/STATE.md]`

**How to avoid:** Make H0 a blocking checkpoint before any Phase 9 execution task.

## Code Examples

### Fast repository-owned release-config verifier

The existing project convention is a small Node `.mjs` standing gate rather than a new test framework. The planner should add `scripts/verify-release-config.mjs` that reads JSON and fails unless all locked identity and EAS-profile values match, project metadata is present after H1, forbidden profile/submit keys are absent, and credential/artifact ignore rules exist. `[VERIFIED: scripts/verify-app-assets.mjs]`

```javascript
// Pattern source: existing scripts/verify-app-assets.mjs + current EAS schema
import { readFileSync } from 'node:fs';

const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
const ignore = readFileSync('.gitignore', 'utf8');

const failures = [];
const expect = (condition, label) => {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures.push(label);
};

expect(app.name === 'Hazra', 'display name');
expect(app.slug === 'hazra-app', 'slug unchanged');
expect(app.version === '1.0.0', 'version name');
expect(app.scheme === 'hazraapp', 'scheme unchanged');
expect(app.android?.package === 'com.exy99.hazraapp', 'application ID');
expect(typeof app.owner === 'string' && app.owner.length > 0, 'EAS owner linked');
expect(
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(
    app.extra?.eas?.projectId ?? '',
  ),
  'EAS project UUID linked',
);
expect(eas.cli?.appVersionSource === 'remote', 'remote version source');
expect(eas.cli?.requireCommit === true, 'clean committed build required');
expect(Object.keys(eas.build ?? '').join(',') === 'production', 'only production profile');
expect(eas.build?.production?.credentialsSource === 'remote', 'remote credentials');
expect(eas.build?.production?.android?.buildType === 'apk', 'production APK');
expect(
  eas.build?.production?.android?.autoIncrement === 'versionCode',
  'Android versionCode auto-increment',
);
expect(eas.submit === undefined, 'no submit configuration');
expect(app.android?.versionCode === undefined, 'remote build number is authoritative');
for (const rule of ['/credentials.json', '*.keystore', '*.jks', '*.apk', '*.aab']) {
  expect(ignore.split(/\r?\n/).includes(rule), `.gitignore contains ${rule}`);
}

process.exit(failures.length ? 1 : 0);
```

The UUID expression is a lightweight shape gate, not proof of remote ownership; H1 remains human-owned. `[CITED: https://docs.expo.dev/tutorial/eas/configure-development-build.md]`

### Static release gate command set

```powershell
node scripts/verify-release-config.mjs
node scripts/verify-app-assets.mjs
node scripts/verify-contrast.mjs
node scripts/verify-tab-shell.mjs
npx tsc --noEmit
npx expo-doctor
npx expo config --type public --json
git diff --check
git status --porcelain
```

These commands validate repository/config health only; none proves that an EAS build or physical-device behavior succeeded. `[VERIFIED: AGENTS.md]` `[VERIFIED: user steering, 2026-11-05]`

### Handoff checksum file format

```text
<64-hex-sha256> *Hazra-v1.0.0-build-<actualVersionCode>.apk
```

The user generates the actual line from `Get-FileHash -Algorithm SHA256`; the repo template must contain placeholders only. `[VERIFIED: environment probe]` `[VERIFIED: user steering, 2026-11-05]`

## State of the Art

| Old Approach | Current Approach | When Changed / current evidence | Impact |
|--------------|------------------|---------------------------------|--------|
| Global `expo-cli` | Local `npx expo` | Expo's current `llms.txt` says global `expo-cli` is deprecated. `[CITED: https://docs.expo.dev/llms.txt]` | Follow repo-local SDK CLI behavior. |
| “Eject” / managed-vs-bare split | Continuous Native Generation | `expo eject` was removed in SDK 46; current Expo uses prebuild/CNG. `[CITED: https://docs.expo.dev/llms.txt]` | Never commit or hand-edit generated native folders. |
| EAS service branding in prose | “Expo Build/Services”; `eas` commands and `eas.json` unchanged | Current docs explicitly preserve CLI/config names. `[CITED: https://docs.expo.dev/eas/index.md]` | Plans should use the repo-mandated `npx eas-cli@latest` commands despite renamed service prose. |
| Empty production profile assumed installable | Empty production produces AAB; explicit APK is the direct-install exception | Current build profile docs. `[CITED: https://docs.expo.dev/build/eas-json.md#production-builds]` | `android.buildType: "apk"` is non-optional for D-06. |
| Locally maintained build number | Remote app version source + auto-increment | Recommended from EAS CLI 12.0.0 onward. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` | Avoids manual build-number commits; evidence must read the actual remote result. |
| Classic `releaseChannel` | `channel` for Expo Update; neither is needed here | `releaseChannel` is deprecated and Classic Updates only supports SDK 49 and lower. `[CITED: https://docs.expo.dev/eas/json.md#releasechannel]` | Do not add OTA/update fields in this phase. |
| Manual dashboard-only artifact retrieval | Current `eas build:download --build-id` | EAS CLI 27.4.1 documents build-ID download. `[CITED: https://docs.expo.dev/eas/cli.md#eas-build-download]` | The user can retrieve the exact artifact without selecting “latest.” |
| ASVS v4 category numbering | ASVS 5.0.0 has 17 reorganized chapters | Stable 5.0.0 published 2025-05-30. `[CITED: https://owasp.org/www-project-application-security-verification-standard/]` | Security mapping below uses current V5/V6/V7/V8/V11/V13/V14 names, not the older V2–V6 labels. |

**Deprecated/outdated:**
- `releaseChannel`: do not use; no OTA work is in scope. `[CITED: https://docs.expo.dev/eas/json.md#releasechannel]`
- Global `expo-cli`: do not install; use `npx expo`. `[CITED: https://docs.expo.dev/llms.txt]`
- `expo eject` and hand-maintained generated native folders: do not use. `[CITED: https://docs.expo.dev/llms.txt]`
- Default AAB production output: valid for Play, but explicitly wrong for this sideload-only phase. `[CITED: https://docs.expo.dev/build-reference/apk.md]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. Recommendations are grounded in locked user decisions, live repository inspection, current npm data, and official Expo/Android/OWASP documentation. | — | — |

## Open Questions / Human Inputs

1. **Which user-controlled Expo account or Organization will own `hazra-app`?**
   - What we know: `eas init` can choose an account and writes `owner`/project UUID; Organizations support shared ownership and role-based access. `[CITED: https://docs.expo.dev/eas/cli.md#eas-init]` `[CITED: https://docs.expo.dev/accounts/account-types.md]`
   - What's unclear: the account name and whether a matching remote project/credential already exists; this environment is not logged in. `[VERIFIED: npx eas-cli@latest whoami]`
   - Recommendation: the user selects an Organization they control for a business/team release, records its recovery owners, and links rather than recreates any legitimate existing project.

2. **Where will the encrypted credential recovery copy and private release archive live?**
   - What we know: they must be outside Git and separate from each other/manager handoff. `[CITED: https://docs.expo.dev/app-signing/app-credentials.md]`
   - What's unclear: the user's vault/archive products and retention policy.
   - Recommendation: H2/H4 cannot close until the user names the locations in non-secret terms and confirms recovery access.

3. **Which primary Android and second-device/viewer combination will produce evidence?**
   - What we know: no device is currently connected through ADB, and second-device CSV/PDF opening is locked acceptance. `[VERIFIED: adb devices -l]` `[VERIFIED: 06-HUMAN-UAT.md]`
   - What's unclear: model/OS/viewer availability.
   - Recommendation: the user records both device models/OS versions and external Excel/Sheets-compatible and PDF viewer app names before starting UAT.

4. **How will the current unrelated untracked debug note be resolved before `requireCommit` build?**
   - What we know: `.planning/debug/cant-see-app-logo.md` makes the tree dirty now. `[VERIFIED: git status --short]`
   - What's unclear: whether it should be committed, moved, or discarded by its owner.
   - Recommendation: planner creates a user checkpoint; no agent should delete or absorb unrelated work silently.

5. **Has Phase 8 security been completed or explicitly waived?**
   - What we know: it is currently missing and blocks Phase 9 execution. `[VERIFIED: .planning/STATE.md]`
   - What's unclear: which closure route the user will choose.
   - Recommendation: H0 blocks every implementation/build checkpoint until the artifact or waiver exists.

## Environment Availability

| Dependency | Required By | Available | Version / state | Fallback |
|------------|-------------|-----------|-----------------|----------|
| Node.js | Expo/EAS CLI | ✓ | `24.18.0`; EAS supports Node 22 or later. `[VERIFIED: environment probe]` `[CITED: https://docs.expo.dev/eas/cli.md]` | — |
| npm/npx | Repo commands | ✓ | npm `12.2.0`. `[VERIFIED: environment probe]` | — |
| Expo SDK/CLI | Config/static gates | ✓ | package `expo 58.0.23`; `npx expo --version` reported `58.1.19`. `[VERIFIED: package.json and environment probe]` | — |
| EAS CLI | Human build workflow | ✓ | `npx eas-cli@latest` resolved `27.4.1`. `[VERIFIED: CLI probe]` | — |
| Authenticated Expo account | H1–H4 | ✗ current session | `eas whoami` returned `Not logged in`. `[VERIFIED: CLI probe]` | Human login is required; no autonomous fallback. |
| Linked EAS project | H1 onward | ✗ local metadata | No `owner`/`extra.eas.projectId`. `[VERIFIED: app.json]` | Human creates/links under chosen owner. |
| Git clean tree | Final build provenance | ✗ currently | One unrelated untracked debug note. `[VERIFIED: git status]` | Human resolves ownership; build stays blocked until clean. |
| Android SDK | APK inspection | ✓ | SDK root `C:\Users\Pratyush\AppData\Local\Android\Sdk`; platform/build-tools 37 installed. `[VERIFIED: environment probe]` | — |
| `apksigner` / `aapt2` | H4 binary checks | ✓ by absolute path | Build Tools `37.0.0`; not on `PATH`. `[VERIFIED: glob/Get-Command probe]` | Use `$env:ANDROID_HOME\build-tools\37.0.0\...`. |
| ADB | Optional human install/control | ✓ tool, ✗ device | ADB `37.0.1`; device list empty. `[VERIFIED: adb probes]` | Manual on-device package installer; physical device still required. |
| PowerShell SHA-256 | H4/H7 integrity | ✓ | PowerShell `5.1`; `Get-FileHash` available. `[VERIFIED: environment probe]` | `certutil -hashfile` could be a human fallback, but is not needed here. |
| Primary physical Android | REL-01 UAT | ✗ observable now | No connected device. `[VERIFIED: adb devices -l]` | User supplies device; no simulator may replace all SAF/share/second-device proofs. |
| Second transfer target + CSV/PDF viewers | EX-03 deferred proof | ? human input | Not observable from repo/environment. | User supplies and records exact apps/devices. |
| Phase 8 security closure | Execution prerequisite | ✗ | `08-SECURITY.md` absent; no waiver recorded. `[VERIFIED: .planning/STATE.md and glob]` | User runs review or explicitly waives. |

**Missing dependencies with no autonomous fallback:** authenticated user-owned Expo account/project, Phase 8 security closure, physical Android device, second-device/viewer target, and user-selected secure credential/artifact locations. `[VERIFIED: user steering and environment audit]`

**Missing dependencies with fallback:** `apksigner`/`aapt2` are absent from `PATH` but installed under Android Build Tools 37; ADB installation can fall back to the Android package installer, although physical-device acceptance remains mandatory. `[VERIFIED: environment audit]` `[CITED: https://docs.expo.dev/build-reference/apk.md]`

## Validation Architecture

> `.planning/config.json` disables generic Nyquist validation, but the user explicitly requested a concrete phase validation architecture. This section therefore defines release gates and human checkpoints without introducing a test runner. `[VERIFIED: .planning/config.json]` `[VERIFIED: user request]`

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No Jest/Vitest/Maestro runner; Node standing scripts + TypeScript/Expo diagnostics + human release checklist. `[VERIFIED: repository test/config scan]` |
| Config file | None; Wave 0 adds one focused script and two blank templates, not a framework. |
| Quick run command | `node scripts/verify-release-config.mjs && node scripts/verify-app-assets.mjs && npx tsc --noEmit` |
| Full suite command | `node scripts/verify-release-config.mjs; node scripts/verify-app-assets.mjs; node scripts/verify-contrast.mjs; node scripts/verify-tab-shell.mjs; npx tsc --noEmit; npx expo-doctor` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated / human command | File Exists? |
|--------|----------|-----------|---------------------------|-------------|
| REL-01/config | Stable v1.0.0 identity, Hazra display name, one production APK profile, remote build-number increment, no submit/update profiles | static contract | `node scripts/verify-release-config.mjs` | ❌ Wave 0 |
| REL-01/config | SDK dependency/config compatibility and unchanged icon/plugin wiring | static diagnostic | `node scripts/verify-app-assets.mjs && npx tsc --noEmit && npx expo-doctor` | ✅ |
| REL-01/build | Completed, release-signed production APK from exact committed source | human external checkpoint | H1–H4 command sheet; user records real build ID/status/metadata | ❌ template only in Wave 0 |
| REL-01/install | APK installs/launches without Metro, Expo Go, or a development server | human physical device | H5 checklist | ❌ template only in Wave 0 |
| REL-01/sqlite | Representative roster/attendance survives force-stop/relaunch and boots in airplane mode | human physical device | H5 row; normal UI, no debug probe | ❌ template only in Wave 0 |
| REL-01/filesystem | CSV, PDF, and backup are real files in Downloads and open externally | human physical device | H5/H6 rows | ❌ template only in Wave 0 |
| REL-01/sharing | Share sheet transfers export/backup and second device opens files | human physical devices | H5/H6 rows | ❌ template only in Wave 0 |
| REL-01/handoff | Delivered APK is byte-identical to tested APK and docs include version/build/checksum/update guidance | human integrity/handoff | H7 checksum comparison and recipient confirmation | ❌ template only in Wave 0 |

### Repo-Owned Automated Gates

1. `verify-release-config.mjs` must fail on any identifier drift, non-APK profile, local/non-incrementing build version, missing EAS metadata after H1, extra profile/submit block, or missing secret/artifact ignore. `[VERIFIED: recommended architecture]`
2. `verify-app-assets.mjs`, `verify-contrast.mjs`, and `verify-tab-shell.mjs` protect Phase 8 release regressions. `[VERIFIED: scripts directory and AGENTS.md]`
3. `npx tsc --noEmit` and `npx expo-doctor` are mandatory final repo gates. `[VERIFIED: AGENTS.md]`
4. `npx expo config --type public --json` should be attached to the evidence template as a reviewed pre-build snapshot; current output confirms SDK `58.0.0` and the live identifiers but still shows the pre-change name and no EAS metadata. `[VERIFIED: command output, 2026-11-05]`
5. `git status --porcelain` must be empty immediately before H3 because `requireCommit` is selected. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`

### Human Production-Artifact Gate

Every row starts `NOT RUN`; the user fills actual build/device evidence. `[VERIFIED: user steering, 2026-11-05]`

| Group | Required proof against the one APK | Canonical source | Evidence minimum |
|-------|------------------------------------|------------------|------------------|
| Artifact | Finished EAS build uses `production`/Android, yields `.apk`, package `com.exy99.hazraapp`, versionName `1.0.0`, actual incremented versionCode, valid release signature, expected cert fingerprint | REL-01 + D-02/D-03/D-06 `[VERIFIED: .planning/REQUIREMENTS.md and 09-CONTEXT.md]` | Build JSON/page, `aapt2` output, `apksigner` output, build ID/hash |
| Independent install | Fresh install launches as “Hazra” with Metro/dev server stopped and no Expo Go/development launcher dependency | REL-01 + D-01 `[VERIFIED: .planning/REQUIREMENTS.md and 09-CONTEXT.md]` | Device/model/OS, install method, home-screen/launch evidence |
| Offline + release persistence | In the release APK, create representative worksites/workers/attendance/note, force-stop, enable airplane mode, relaunch, and reconcile the same data/counts | Phase 1 deferred proof + REL-01 `[VERIFIED: 01-08-SUMMARY.md and .planning/REQUIREMENTS.md]` | Before/after visible values; no `__boot_probe__` instrumentation |
| Phase 2 preserved result | Keep “Roster build + restart persistence” recorded as passed in `02-HUMAN-UAT.md`; do not overwrite it | `02-HUMAN-UAT.md` test 1 `[VERIFIED: .planning/phases/02-worksites-workers/02-HUMAN-UAT.md]` | Cross-reference existing pass; separate release-persistence row above |
| Phase 2 pending 1 | Removed worker disappears from active lists/pickers while profile/history remains reachable | `02-HUMAN-UAT.md` test 2 `[VERIFIED: .planning/phases/02-worksites-workers/02-HUMAN-UAT.md]` | Before/remove/after/history evidence |
| Phase 2 pending 2 | Worksite removal confirmation states live active-worker count; confirming hides site without cascading worker/history data | `02-HUMAN-UAT.md` test 3 `[VERIFIED: .planning/phases/02-worksites-workers/02-HUMAN-UAT.md]` | Count and post-confirm evidence |
| Phase 2 pending 3 | `/worksites`, `/worksite-form`, `/worker-form` drill-downs show always-visible back navigation and tab URLs remain stable | `02-HUMAN-UAT.md` test 4 `[VERIFIED: .planning/phases/02-worksites-workers/02-HUMAN-UAT.md]` | Navigation evidence |
| Phase 2 pending 4 | Removed-profile permanent delete confirmation removes worker and all attendance; profile no longer resolves | `02-HUMAN-UAT.md` test 5 `[VERIFIED: .planning/phases/02-worksites-workers/02-HUMAN-UAT.md]` | Confirm/result evidence; use disposable sample data |
| Phase 6 pending 1 | Worker CSV containing `left early, told "back tomorrow"` opens in Excel/Sheets with correct columns | `06-HUMAN-UAT.md` test 1 `[VERIFIED: .planning/phases/06-export/06-HUMAN-UAT.md]` | Exported filename + external parsed row |
| Phase 6 pending 2 | Worksite-month CSV and PDF both land in Downloads with expected slug filenames | `06-HUMAN-UAT.md` test 2 `[VERIFIED: .planning/phases/06-export/06-HUMAN-UAT.md]` | Downloads listing + external opens |
| Phase 6 pending 3 | Share/transfer export to second device; CSV parses and PDF renders legend/footer | `06-HUMAN-UAT.md` test 3 `[VERIFIED: .planning/phases/06-export/06-HUMAN-UAT.md]` | Both device/app identities + results |
| Phase 6 pending 4 | Profile/report entry points preselect correct export scope; tampered worker/worksite IDs show not-found and do not crash | `06-HUMAN-UAT.md` test 4 `[VERIFIED: .planning/phases/06-export/06-HUMAN-UAT.md]` | Entry/tamper result evidence |
| Phase 7 pending 1 | Backup is written to Downloads and opens outside Hazra as complete JSON | `.planning/STATE.md` deferred debt `[VERIFIED: .planning/STATE.md]` | Filename + external viewer/read evidence |
| Phase 7 pending 2 | Backup → deliberately change/clear disposable data → restore reproduces counts and sample statuses/notes | `.planning/STATE.md` + `07-04-SUMMARY.md` `[VERIFIED: both local files]` | Pre-backup, changed, restored reconciliation |
| Phase 7 pending 3 | Native document picker selects the JSON backup and reaches validated summary | `.planning/STATE.md` + `src/app/backup.tsx` `[VERIFIED: both local files]` | Picker + summary evidence |
| Phase 7 pending 4 | Truncated JSON, missing `attendance`, and unknown `version` are each rejected while current data remains unchanged | `.planning/STATE.md` + `src/utils/backup.ts` `[VERIFIED: both local files]` | Three failure messages + before/after data check |
| Artifact closure | After all rows pass, archived file SHA-256 still equals initial post-download SHA-256; no rebuild occurred | D-06/D-07/D-10 `[VERIFIED: 09-CONTEXT.md]` | Initial/final hashes and unchanged build ID |
| Handoff | Bundle has APK, concise install/update guide, `1.0.0`, actual versionCode, release manifest, and `SHA256SUMS`; manager independently confirms hash | D-07/D-08 `[VERIFIED: 09-CONTEXT.md]` | Recipient/time/channel/checksum confirmation |

### Sampling Rate

- **Per repo task commit:** `node scripts/verify-release-config.mjs && npx tsc --noEmit` after the verifier exists. `[VERIFIED: recommended architecture]`
- **Before H1/H3:** full repo gate suite plus reviewed config diff; before H3 specifically require clean Git. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]`
- **Per candidate APK:** H4 binary inspection and initial hash, then the complete H5/H6 matrix; never sample only changed areas. `[VERIFIED: 09-CONTEXT.md D-06/D-10]`
- **Phase gate:** every row tied to one build ID/hash is passed, final hash matches, Phase 8 gate is closed, and H7 recipient confirmation exists before REL-01 is checked. `[VERIFIED: .planning/REQUIREMENTS.md]`

### Wave 0 Gaps

- [ ] `scripts/verify-release-config.mjs` — enforces release identity/profile/ignore contract.
- [ ] `.planning/phases/09-build-ship/09-RELEASE-EVIDENCE-TEMPLATE.md` — all H0–H7 and deferred rows default to `NOT RUN`.
- [ ] `.planning/phases/09-build-ship/09-HANDOFF-TEMPLATE.md` — install/update/no-uninstall guidance, version/build fields, checksum verification, and credential-support contact placeholder.
- [ ] No test framework installation — the repo intentionally has no runner and generic Nyquist is disabled. `[VERIFIED: .planning/config.json and test scan]`

## Security Domain

Security enforcement is enabled at ASVS Level 1. The current stable official ASVS is 5.0.0, whose chapter numbering differs from the older v4-style table often used in templates. `[VERIFIED: .planning/config.json]` `[CITED: https://owasp.org/www-project-application-security-verification-standard/]`

### Applicable ASVS 5.0 Categories

| ASVS Category | Applies | Standard control for this phase |
|---------------|---------|---------------------------------|
| V5 File Handling | yes | Validate picked backup content before DB writes; prove malformed files leave data unchanged; keep APK/backup artifacts in controlled locations. `[VERIFIED: src/utils/backup.ts]` |
| V6 Authentication | external build service only | User authenticates to their own Expo account; no authentication is added to the offline app. `[VERIFIED: NF-03]` `[CITED: https://docs.expo.dev/build/setup.md]` |
| V7 Session Management | external build service only | Do not commit/share EAS tokens or sessions; account interaction remains human-owned. `[VERIFIED: user steering]` |
| V8 Authorization | external build service only | Use user-controlled Expo Organization/account roles for project/build/credential access; no in-app roles exist. `[CITED: https://docs.expo.dev/accounts/account-types.md#manage-access]` |
| V11 Cryptography | yes | Use Android/Expo signing, `apksigner`, and SHA-256; never implement crypto or signing in app code. `[CITED: https://developer.android.com/studio/publish/app-signing]` |
| V13 Configuration | yes | Lock identity/build fields, clean committed source, CNG-only config, no submit/update profiles, and no secrets in Git. `[CITED: https://docs.expo.dev/eas/json.md]` |
| V14 Data Protection | yes | Preserve local SQLite during updates, back up before update/restore tests, separate credential vault from artifact handoff, and never solve signature mismatch by uninstalling valuable data. `[CITED: https://developer.android.com/google/play/app-updates]` |

### Known Threat Patterns for Expo/EAS Sideload Release

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong EAS account/project linked | Spoofing | Human `whoami`/owner/project-ID review, generated metadata diff, dashboard record. `[CITED: https://docs.expo.dev/eas/cli.md]` |
| Keystore/password committed or bundled with APK | Information Disclosure | Preemptive `.gitignore`, tracked-file scan, remote credentials, encrypted off-repo recovery vault, separate handoff. `[CITED: https://docs.expo.dev/app-signing/app-credentials.md]` |
| APK substituted between testing and handoff | Tampering | Build-ID download, initial/final/recipient SHA-256, immutable archive, no rebuild/repack. `[CITED: https://developer.android.com/tools/apksigner]` |
| Debug/dev APK represented as production | Spoofing / Tampering | Production-only profile, `buildType: apk` release task, EAS metadata, APK manifest/signature inspection, independent launch without Metro. `[CITED: https://docs.expo.dev/eas/json.md]` |
| New signing key blocks updates | Denial of Service / data loss | One preserved signing key, certificate fingerprint record, secure recovery copy, stop on mismatch. `[CITED: https://developer.android.com/studio/publish/app-signing#signing-considerations]` |
| Lower/ambiguous version code blocks update | Denial of Service | Remote authoritative version source + automatic `versionCode` increment + actual-value manifest evidence. `[CITED: https://docs.expo.dev/build-reference/app-versions.md]` |
| Uninstall used to bypass update failure | Data loss | Handoff explicitly says never uninstall; create in-app backup first and escalate signature/package conflicts. `[CITED: https://developer.android.com/google/play/app-updates]` |
| Malformed restore file destroys good data | Tampering | Existing full in-memory validation plus transaction; human proves three malformed classes leave data unchanged. `[VERIFIED: src/utils/backup.ts]` `[VERIFIED: src/db/backup.ts]` |
| Public artifact URL leaks private app | Information Disclosure | Omit internal-distribution URL workflow; private file handoff with checksum and named recipient. `[CITED: https://docs.expo.dev/build/internal-distribution.md]` |
| Agent fabricates unavailable external evidence | Repudiation | Templates default `NOT RUN`; only user-supplied build/device/checksum/handoff evidence closes checkpoints. `[VERIFIED: user steering, 2026-11-05]` |

## Sources

### Primary (HIGH confidence)

- Context7 `/websites/expo_dev` — queried APK profile, remote versioning, credentials, project init, and credential download topics on 2026-11-05. `[VERIFIED: Context7 CLI]`
- https://docs.expo.dev/versions/v58.0.0/ — confirmed Expo 58 / RN 0.88 / React 19.3 compatibility and SDK-specific docs (modified 2026-09-17). `[CITED: official Expo docs]`
- https://docs.expo.dev/llms.txt — current Expo documentation map and correction of obsolete workflow/CLI concepts. `[CITED: official Expo docs]`
- https://docs.expo.dev/eas/index.md — current Expo Services entry point and retained `eas`/`eas.json` naming (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/eas/json.md — exact current EAS CLI/build schema, including `appVersionSource`, `requireCommit`, `credentialsSource`, `autoIncrement`, and `buildType` (modified 2026-11-03). `[CITED: official Expo docs]`
- https://docs.expo.dev/eas/cli.md — EAS CLI 27.4.1 command/flag reference, including init, config, build, credentials, view, and download (modified 2026-11-04). `[CITED: official Expo docs]`
- https://docs.expo.dev/build/eas-json.md — build profile semantics and production APK exception (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/build-reference/apk.md — APK output/install/download/ADB path (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/build-reference/app-versions.md — remote version source and initialization/increment behavior (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/build-reference/project-upload.md — default/full-Git upload behavior and `requireCommit` (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/tutorial/eas/configure-development-build.md — `eas init` owner/project-ID mutations (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/app-signing/managed-credentials.md, `/syncing-credentials.md`, `/app-credentials.md`, and `/security.md` — remote credential reuse, download, secrecy, backup, and loss consequences (modified 2026-11-02). `[CITED: official Expo docs]`
- https://docs.expo.dev/versions/v58.0.0/config/app.md — SDK 58 app identity fields. `[CITED: official Expo docs]`
- https://docs.expo.dev/versions/v58.0.0/sdk/sqlite.md, `/filesystem-legacy.md`, `/sharing.md`, `/print.md`, `/document-picker.md` — exact installed native API behavior and recommended package versions. `[CITED: official Expo docs]`
- https://developer.android.com/google/play/app-updates — Android update identity/certificate/version conditions and uninstall data loss. `[CITED: official Android docs]`
- https://developer.android.com/studio/publish/app-signing — key continuity/custody and signing lifecycle. `[CITED: official Android docs]`
- https://developer.android.com/tools/apksigner, `/tools/aapt2`, and `/tools/adb` — platform verification, manifest dump, and install commands. `[CITED: official Android docs]`
- https://owasp.org/www-project-application-security-verification-standard/ — stable ASVS 5.0.0 publication and current chapter model. `[CITED: official OWASP]`
- npm registry — current versions/publish times for Expo 58 runtime modules and EAS CLI, queried 2026-11-05. `[VERIFIED: npm registry]`

### Repository Evidence (HIGH confidence)

- `AGENTS.md`, `package.json`, `app.json`, `.gitignore`, `.planning/config.json`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, and `09-CONTEXT.md`. `[VERIFIED: local reads]`
- Deferred acceptance artifacts: `01-08-SUMMARY.md`, `02-HUMAN-UAT.md`, `06-HUMAN-UAT.md`, and `07-04-SUMMARY.md`. `[VERIFIED: local reads]`
- Runtime implementation: `src/db/index.ts`, `src/utils/files.ts`, `src/utils/backup.ts`, `src/db/backup.ts`, `src/app/export.tsx`, and `src/app/backup.tsx`. `[VERIFIED: local reads]`
- Environment probes: package registry, CLI versions/auth, Git state, Android SDK tools, ADB devices, and PowerShell hashing availability. `[VERIFIED: shell probes, 2026-11-05]`

### Secondary (MEDIUM confidence)

- None used for implementation decisions; web search was used only to locate official Expo/Android/OWASP pages, then claims were verified against those primary pages. `[VERIFIED: research log]`

### Tertiary (LOW confidence)

- None. No web-search-only claim is carried into the recommendation. `[VERIFIED: research log]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed versions were read locally and checked against npm/current official SDK 58 docs. `[VERIFIED: package.json and npm registry]`
- Release configuration: HIGH — every recommended field is present in the 2026-11-03 EAS schema and cross-checked through Context7. `[CITED: https://docs.expo.dev/eas/json.md]` `[VERIFIED: Context7 CLI]`
- Architecture/provenance: HIGH — EAS project upload/download and Android signing/update behavior are documented by Expo and Android primary sources. `[CITED: https://docs.expo.dev/build-reference/project-upload.md]` `[CITED: https://developer.android.com/google/play/app-updates]`
- Device acceptance: HIGH for required coverage, intentionally unknown for results — rows come directly from canonical project artifacts, but only the user can execute them. `[VERIFIED: local UAT/STATE files]` `[VERIFIED: user steering]`
- Pitfalls/security: HIGH — derived from current official build, signing, update, and ASVS references plus live repo state. `[CITED: official sources listed above]`

**Research date:** 2026-11-05 `[VERIFIED: user-provided current date]`
**Valid until:** 2026-11-12 — EAS CLI/services are fast-moving; re-check current official docs and npm before the human build if execution occurs later. `[CITED: https://docs.expo.dev/build/setup.md]`
