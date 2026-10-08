---
phase: 03
slug: attendance-marking
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-08
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Date utils → UI | All date math via local-key helpers; no UTC conversion | `YYYY-MM-DD` date keys (non-sensitive) |
| Picker → state | Date keys cross as opaque `YYYY-MM-DD` strings | Date key strings |
| STATUS → pill | All status color flows from the frozen contract; no ad-hoc hex | `AttendanceStatus` literals |
| Pill → handler | Status crosses as a `CYCLE`-member string only | `AttendanceStatus` literals |
| UI → SQLite | Every write funnels through `upsertAttendance`; no raw SQL in the screen | Attendance rows (status + note) |
| Date → DAO | `selectedDate` crosses as an opaque local-key string | Date key strings |
| TextInput → SQLite | Free text crosses only as a bound `note` parameter; never concatenated | Note free text |
| Note ↔ status | Independent axes sharing one UPSERT row; neither write nulls the other | `(status, note)` pairs |
| Filter → DAO | `selectedSite` crosses as an opaque id string into a bound parameter | Worksite id strings |
| Counts → UI | Counts derive server-side from the same scope as the rows; no client math | Daily count totals |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Tampering | future-date selection | mitigate | Strip/modal never render keys after `todayKey()` (`key <= todayKey()` clamp) | closed |
| T-03-02 | Tampering | locale/TZ midnight skew | mitigate | All keys via `todayKey`/`addDays` (local dayjs); zero `toISOString` in date path | closed |
| T-03-03 | Denial of service | modal with unbounded list | mitigate | Fixed 30-row `FlatList` + `keyExtractor` | closed |
| T-03-04 | Spoofing | invented status strings | mitigate | `onPick` typed `AttendanceStatus`; cycle indexes `CYCLE`; DB CHECK whitelist | closed |
| T-03-05 | Information disclosure | color-only status | mitigate | Every pill carries its text label; unmarked labeled "Mark" | closed |
| T-03-06 | Repudiation | picker mis-tap unwind | accept | Close-without-pick changes nothing; DB row is the audit trail | closed |
| T-03-07 | Tampering | duplicate (worker,date) rows under race | mitigate | Single-statement `ON CONFLICT(worker_id,date) DO UPDATE` + `pendingIds` guard | closed |
| T-03-08 | Tampering | worker_id interpolation | mitigate | `workerId` binds as a `?` parameter; zero raw SQL in screen | closed |
| T-03-09 | Denial of service | write failure bricks the register | mitigate | Polite banner only; rows stay interactive; `finally` clears pending | closed |
| T-03-10 | Information disclosure | soft-deleted workers reappear | mitigate | `getAttendanceForDate` filters `is_active = 1` server-side; screen never passes `includeInactive` | closed |
| T-03-11 | Tampering (SQL injection) | note text with quotes/CSV chars | mitigate | Note binds as a `?` parameter; zero SQL in screen/note-field | closed |
| T-03-12 | Tampering | status clobbered by note save (and vice versa) | mitigate | Both writers read-then-write the full `(status, note)` pair; unmarked+note defaults to `present` | closed |
| T-03-13 | Information disclosure | note preview leak on shared screen | accept | Single-manager offline device (NF-03); no sync, no second viewer | closed |
| T-03-14 | Tampering | filter-reset loses marks | mitigate | Sibling state, no reset call; `setSelectedDate` grep-gated to 2 hits | closed |
| T-03-15 | Information disclosure | cross-site rows leak through filter | mitigate | Server-side `w.worksite_id = ?` bound param, not client-side hiding | closed |
| T-03-16 | Elevation of privilege | counts disagree with rows (spoofed totals) | mitigate | Single `load()` fetches rows + counts with identical `(date, worksiteId)` scope | closed |
| T-03-17 | Denial of service | zero-sites register crash | mitigate | §7.5 empty state with setup action; counts header only in non-empty branch | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-03-01 | `src/components/date-strip.tsx:29` (`.filter((key) => key <= today)`); `:39` (`addDays(today, -i)`, past-only modal source) |
| T-03-02 | `src/utils/dates.ts:4-5,14-15` (local dayjs `todayKey`/`addDays`); `toISOString` 0 hits in `date-strip.tsx` and `attendance.tsx` (only `updated_at`/`created_at` audit timestamps in `src/db/`) |
| T-03-03 | `src/components/date-strip.tsx:39` (`length: 30`); `:152-154` (`FlatList` + `keyExtractor`) |
| T-03-04 | `src/components/status-pill.tsx:73` (`onPick: (s: AttendanceStatus)`); `:85` (`CYCLE.map`); `src/app/(tabs)/attendance.tsx:253` (`CYCLE[(CYCLE.indexOf(row.status)+1)%CYCLE.length]`); `src/db/index.ts:28` (`CHECK(status IN ('present','absent','half_day','off_day'))`) |
| T-03-05 | `src/components/status-pill.tsx:26` (`entry ? entry.label : 'Mark'`); `:102` (every mini-pill renders `STATUS[option].label`) |
| T-03-06 | Accepted risk (see log); `src/components/status-pill.tsx:108-116` (Close affordance, close changes nothing) |
| T-03-07 | `src/db/attendance.ts:16` (`ON CONFLICT(worker_id, date) DO UPDATE`); `src/app/(tabs)/attendance.tsx:216-219` + `:236-242` (`pendingIds` early-return, add-before-await, delete-in-`finally`) |
| T-03-08 | `src/db/attendance.ts:16-17` (`?` placeholders + bound array); zero `SELECT`/`INSERT`/`DELETE` in `attendance.tsx` and `note-field.tsx` |
| T-03-09 | `src/app/(tabs)/attendance.tsx:393-399` (polite banner, `accessibilityLiveRegion="polite"`, list stays mounted); `:236-242` and `:286-292` (`finally` clears pending on both writers) |
| T-03-10 | `src/db/attendance.ts:51` (`WHERE w.is_active = 1`); `includeInactive` 0 hits in `attendance.tsx` |
| T-03-11 | `src/db/attendance.ts:16-17` (note binds as `?` param); zero SQL keywords in `note-field.tsx` and `attendance.tsx` |
| T-03-12 | `src/app/(tabs)/attendance.tsx:226` (`applyStatus` passes `note: row?.note ?? null`); `:268,274-275` (`saveNote` derives `status = row.status ?? 'present'`, writes full pair) |
| T-03-13 | Accepted risk (see log); `fetch(` 0 hits in `attendance.tsx` (no sync path) |
| T-03-14 | `src/app/(tabs)/attendance.tsx:132-133` (sibling state); `setSelectedDate` 2 hits (`:132` decl + `:204` handler only); `setSelectedSite` 2 hits (`:133` + `:326` chip `onPress` only) |
| T-03-15 | `src/db/attendance.ts:47` (`AND w.worksite_id = ?`); screen passes `scope` (`attendance.tsx:176-180`), never filters client-side |
| T-03-16 | `src/app/(tabs)/attendance.tsx:176-180` (one `load()`: `Promise.all([listWorksites(), getAttendanceForDate(selectedDate, scope), getDailyCounts(selectedDate, scope)])`, identical scope; no independent count state) |
| T-03-17 | `src/app/(tabs)/attendance.tsx:370-387` (zero-sites "No worksites yet" + "Add worksite" → `/worksite-form`; roster-empty "No attendance marked for this date"); `:392` (`CountsHeader` renders only inside the non-empty `rows.length > 0` branch) |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-01 | T-03-06 | Picker close-without-pick changes nothing; the real audit trail is the SQLite attendance row written on explicit cycle/pick. Mis-tap has no silent side effect. | secure-phase audit (plan disposition: accept) | 2026-10-08 |
| R-03-02 | T-03-13 | Single-manager offline device per NF-03; no sync, no network, no second viewer exists to leak note previews to. Shoulder-surfing on the manager's own device is out of scope. | secure-phase audit (plan disposition: accept) | 2026-10-08 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-08 | 17 | 17 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-08
