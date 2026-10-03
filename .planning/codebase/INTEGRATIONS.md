# External Integrations

**Analysis Date:** 2026-10-02

> The current app is the stock Expo starter. It has **no** network, database, auth, or service integrations. All data is static assets bundled with the app. Planned integrations (SQLite, file export/share) are recorded under "Planned (not implemented)" at the end.

## APIs & External Services

**None.**
- No HTTP client dependency (`axios`, `fetch` wrappers) and no API endpoint constants in `src/`.
- No `process.env` API keys referenced. Only Expo-injected `process.env.EXPO_OS` (`src/components/external-link.tsx:14`).
- The only external URLs are documentation links opened in a browser (`https://docs.expo.dev`, `https://reactnative.dev/docs/images`) via `ExternalLink` (`src/components/external-link.tsx`, used in `src/app/explore.tsx`). These are user-initiated `openBrowserAsync` calls, not background integrations.

## Data Storage

**Databases:**
- None. No database client, ORM, or schema files.
- Planned: `expo-sqlite` (offline, on-device) — see "Planned" below. Not installed.

**File Storage:**
- Local bundled assets only (`assets/`), loaded via `expo-image` and `require()`. No runtime filesystem persistence.

**Caching:**
- None configured.

## Authentication & Identity

**Auth Provider:**
- None. No sign-in, session, token, or OAuth code. The app has no accounts (product intent is offline, single-manager, per `.planning/PROJECT.md`).

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry/Crashlytics/etc.).

**Logs:**
- `console` only — startup messages in `scripts/reset-project.js`. No logging library.

## CI/CD & Deployment

**Hosting:**
- None committed. `app.json` sets `web.output: "static"`, so a static web export is possible, but no host config exists.

**CI Pipeline:**
- None. No `.github/` workflows, no CI config of any kind. `AGENTS.md` confirms there is no CI.

## Environment Configuration

**Required env vars:**
- None for the current app.

**Secrets location:**
- None present. `.gitignore` ignores `.env*.local` and native key/certificate files (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem`). No `.env` file currently on disk.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

## Planned (not implemented)

These are described in the planning docs only; treat them as future work, not existing integrations.

- **`expo-sqlite` local database** — locked data layer in `.planning/PROJECT.md` / `.planning/STATE.md`, required by ROADMAP Phase 1. Requires a development build.
- **CSV/PDF export + file sharing** — ROADMAP Phase 6 (`EX-01..03`); no `expo-file-system` / `expo-sharing` / PDF library installed.
- **Manual JSON backup/restore** — ROADMAP Phase 7 (`BK-01..03`); not implemented.
- **EAS Build/Submit/Update** — intended production path per `AGENTS.md`; no `eas.json` exists.

---

*Integration audit: 2026-10-02*
