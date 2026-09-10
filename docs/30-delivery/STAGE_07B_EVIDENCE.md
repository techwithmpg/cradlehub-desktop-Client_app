# Stage 07B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 07B — Desktop Attendance UI

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/07b-desktop-attendance-ui`

**BASE_SHA:** `a1ddc3d298c8fbd4036fa0bb9cd7957b2161bad7`

**HEAD_SHA:** `9ca7da09cdcc85fb39b92c6c847c36e27ebdcc44`

**Hosted Attendance contract SHA:** `dd2b2e087cbecb0c641a14c8f263d204493b64d7`

> `HEAD_SHA` records the tested implementation commit. The following evidence-only commit changes documentation only.

## Authorized scope

Implement the first-release Desktop Attendance workspace against the accepted
hosted Attendance contract while preserving the canonical shell, shared design
system, authentication boundary, server-resolved branch authority and hosted
CradleHub as canonical online truth.

Implemented:

- Today operational workspace
- Review open-exception queue
- History weekly workspace
- Setup authorized Attendance rules
- real hosted reads
- server-mediated mutations
- canonical table, inspector and pagination patterns
- truthful loading, empty and error states
- responsive desktop behavior

No schema, migration, local database, caching, offline queue or background sync
architecture was introduced.

## Changed implementation files

- `src/components/attendance/AttendanceView.tsx`
- `src/components/CanonicalShell.tsx`
- `src/lib/attendance-service.ts`
- `src/styles.css`
- `src/types/attendance.ts`
- `tests/attendance-components.test.tsx`
- `tests/attendance-service.test.ts`

## Repository evidence

**REPOSITORY-RECORDED PRODUCTION EVIDENCE**

Repository verification establishes:

- Attendance mounts through the canonical authenticated desktop shell.
- Today reads use the hosted Desktop Attendance endpoint.
- History uses the dedicated hosted Attendance History endpoint.
- Attendance writes use `/api/desktop/v1/attendance/mutations`.
- Hosted requests use bearer authentication.
- No renderer service-role credential was introduced.
- Renderer branch selection is not used as Attendance authorization.
- Review supports `review_exception` and `resolve_exception`.
- Review pagination defaults to 10 rows with 10 / 25 / 50 options.
- History loads when its tab is opened.
- History uses a seven-day staff-by-day view.
- Missing History rows are presented as `No record`, not inferred absence.
- History pagination defaults to 10 staff with 10 / 25 / 50 options.
- Setup exposes only:
  - `late_grace_minutes`
  - `clock_in_window_before_shift_minutes`
  - `duplicate_scan_debounce_minutes`
- Setup writes use `update_rules`.
- Hidden/internal Attendance rules remain unexposed.
- QR/device/branch context comes from real Attendance workspace data.
- No simulated mutation success is used.

Repository source proves repository implementation only, not deployed behavior.

## Owner-provided manual runtime evidence

**OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**

On 2026-09-10 the owner manually exercised the native Desktop Attendance
workspace and confirmed:

- Today loaded real hosted Attendance data.
- Initial hosted Attendance loading was noticeably slow but completed.
- Review rendered the real exception workspace.
- Review pagination was added and accepted.
- History rendered its weekly workspace.
- Previous-week History navigation worked.
- Empty History displayed a truthful no-history state.
- Setup displayed real Attendance rule values and QR/device context.
- Refined Setup visual styling was accepted.
- All four tabs were manually inspected at:
  - 1440×900 — PASS
  - 1366×768 — PASS
  - 1024×768 — PASS

No claim is made that a real production Review, Resolve, or Setup mutation was
performed during the closing runtime gate.

## Exact checks

| Check                           | Result |
| ------------------------------- | ------ |
| Attendance focused Vitest suite | PASS   |
| Canonical workspace regression  | PASS   |
| Full `pnpm test`                | PASS   |
| `pnpm lint`                     | PASS   |
| `pnpm typecheck`                | PASS   |
| `pnpm format:check`             | PASS   |
| `git diff --check`              | PASS   |
| `pnpm build`                    | PASS   |
| Hosted endpoint guard           | PASS   |
| Server mutation boundary guard  | PASS   |
| service-role renderer guard     | PASS   |
| renderer All Branches guard     | PASS   |
| exact stage file-scope guard    | PASS   |

Known non-failing output:

- Vite may report the existing greater-than-500-kB chunk-size advisory.

## Security / data impact

- schema/migration changed? **no**
- Auth/RLS changed? **no**
- privileged hosted behavior changed? **no**
- service-role secret exposed? **no**
- Tauri capability changed? **no**
- local persistence/sync architecture added? **no**
- fake Attendance data added? **no**

## Performance limitation

Initial hosted Attendance reads were owner-observed as slow.

For Stage 07B:

- hosted reads have a temporary longer timeout
- mutations retain the shorter fail-closed timeout
- no speculative caching, SQLite, polling or background sync was added

Performance/local-data architecture remains deferred to a separately authorized
stage.

## Limitations

- Hosted repository source is repository evidence, not deployed production proof.
- No owner-confirmed live Review/Resolve/Setup mutation is recorded.
- Initial Attendance read performance remains deferred.
- Local DB, checkpointing, delta sync and offline mutation queues remain out of scope.
- Dormant product surfaces remain out of scope.

## Rollback

Before merge, abandon this stage branch.

After merge, revert the Stage 07B implementation and evidence commits rather
than rewriting accepted history.

No database rollback is required.

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
