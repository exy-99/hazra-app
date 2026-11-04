# Phase 9: Build & Ship - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-04
**Phase:** 09-build-ship
**Areas discussed:** Release identity, Distribution route

---

## Release identity

### Installed app name

| Option | Description | Selected |
|--------|-------------|----------|
| Hazra Attendance | Matches the product and project name while leaving the technical Expo slug unchanged. | |
| Hazra | Shorter icon label, but less explicit in Android settings and file-sharing surfaces. | ✓ |
| Keep hazra-app | No config rename, but ships a developer-style name to the manager. | |

**User's choice:** Hazra
**Notes:** This is the installed display name, not a broad technical rename.

### Android application ID

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `com.exy99.hazraapp` | Keep the already-configured ID; lowest risk unless it was only a placeholder. | ✓ |
| Use `com.hazra.attendance` | Change before release to a cleaner brand-facing identity. | |
| Specify another ID | Use another stable reverse-domain ID intentionally controlled by the user. | |

**User's choice:** Keep `com.exy99.hazraapp`
**Notes:** The user accepted that changing this after distribution would create a separate Android app rather than an update.

### First release version

| Option | Description | Selected |
|--------|-------------|----------|
| v1.0.0 with automatic build numbers | Ship the milestone as 1.0.0 and let EAS advance Android's internal build number. | ✓ |
| v1.0.0 with manual build numbers | Keep 1.0.0, but require a deliberate build-number update before each release build. | |
| v0.9 pilot | Treat the first manager install as a prerelease, then promote after field use. | |

**User's choice:** v1.0.0 with automatic Android build-number increments
**Notes:** Exact EAS version-source/config syntax is left for official-doc research.

### Rename breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Display name only | Set `expo.name` to Hazra; retain slug/npm name `hazra-app` and scheme `hazraapp`. | ✓ |
| Name and slug | Also rename the EAS/Expo slug to `hazra` before project initialization. | |
| Align everything | Rename display name, slug, npm package name, and URL scheme. | |

**User's choice:** Display name only
**Notes:** Keep all existing technical identifiers except the user-visible name.

---

## Distribution route

### Initial distribution channel

| Option | Description | Selected |
|--------|-------------|----------|
| Direct APK | Build, verify, and sideload an installable APK; best fit for one manager with no store overhead. | ✓ |
| APK now, Play later | Ship the APK now while preserving package/signing continuity for a future Play Store phase. | |
| Play test track | Distribute through a Play internal or closed track with Play Console setup. | |
| Public Play release | Publish a listed app now, adding policy, review, listing, and rollout work. | |

**User's choice:** Direct APK
**Notes:** Android sideloading is the Phase 9 delivery endpoint.

### Tested and delivered artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Same production APK | Test the exact release-signed production APK, then hand off that unchanged artifact. | ✓ |
| Preview then production | Test an internal preview APK, then create production and repeat critical checks. | |
| APK plus AAB | Produce both a sideload APK and Play-ready AAB now. | |

**User's choice:** The same production APK is tested and delivered
**Notes:** Debug, development, or preview evidence cannot substitute for the delivered release binary.

### APK handoff contents

| Option | Description | Selected |
|--------|-------------|----------|
| Guide and checksum | Include install/update steps, version/build details, and a SHA-256 checksum. | ✓ |
| Install guide only | Include concise sideload/update instructions without an integrity checksum. | |
| APK only | Hand over only the binary. | |

**User's choice:** Guide and checksum
**Notes:** The handoff should identify one immutable, verified artifact.

### Future Play Store posture

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve Play path | Keep production signing/package continuity for possible Play distribution, without store work now. | |
| Sideload only | Treat manual APK delivery as the ongoing channel; no future-store requirement. | ✓ |
| OpenCode decides | Let planning choose the lowest-risk posture without adding Play work. | |

**User's choice:** Sideload only
**Notes:** No Play-oriented work is required. Ordinary signing continuity is still necessary for later sideloaded APK updates.

---

## OpenCode's Discretion

- The user did not select Signing ownership or Device proof for deep discussion and confirmed readiness to capture context.
- Research/planning may choose EAS account/project initialization, secure credential management, device matrix, evidence format, artifact filename, and archive location within the locked constraints.
- All previously deferred on-device checks remain mandatory; only their safe execution details are discretionary.

## Deferred Ideas

None. Play Store distribution was considered and rejected rather than deferred.
