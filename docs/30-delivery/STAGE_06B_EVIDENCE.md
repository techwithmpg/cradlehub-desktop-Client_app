# Stage 06B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 06B — Desktop Schedule UI

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/06b-desktop-schedule-ui`

**BASE_SHA:** `be398b67011661f99a67c272f210e36a1bdff252`

**HEAD_SHA:** `ad5cd15be3f1e1405b6cff5d61dba9a5c151d264`

**Hosted web reference SHA:** `8ccf238085e69fb450965d79279aecdb0a809e14`

> `HEAD_SHA` records the tested implementation commit. The following
> evidence-only commit changes documentation only.

## Authorized scope

Implement the first-release Desktop Schedule vertical slice against the
accepted hosted Schedule contract while preserving the canonical shell,
design system, authentication boundary, branch authority, and hosted system
as canonical online truth.

Authorized Schedule scope includes:

- authoritative daily and weekly Schedule reads
- authoritative staff availability and staff-detail reads
- role and operational-state filtering
- staff/customer/service/resource search
- Day and Week Schedule views
- selected-staff inspector
- real booking-resource display
- Schedule conflict visibility
- Adjust Schedule
- Block Time
- Full Schedule
- Availability
- server-mediated Schedule mutations only
- truthful loading, empty, error and disconnected behavior

Dormant modules and unrelated architecture were not authorized.

## Changed files

- `src/components/CanonicalShell.tsx`
- `src/components/schedule/ScheduleActionModal.tsx`
- `src/components/schedule/ScheduleBoard.tsx`
- `src/components/schedule/ScheduleInspector.tsx`
- `src/components/schedule/ScheduleView.tsx`
- `src/lib/schedule-role-groups.ts`
- `src/lib/schedule-service.ts`
- `src/lib/schedule-view-utils.ts`
- `src/styles.css`
- `src/types/schedule.ts`
- `tests/schedule-components.test.tsx`
- `tests/schedule-role-groups.test.ts`
- `tests/schedule-service.test.ts`

## Contract evidence

### Repository verified

**REPOSITORY-RECORDED PRODUCTION EVIDENCE**

Repository verification established:

- Schedule mounts through the canonical authenticated shell.
- Daily Schedule reads use the hosted Desktop Schedule endpoint with bearer
  authentication and without a renderer-supplied branch override.
- Staff availability and staff-detail reads use the accepted hosted endpoints.
- Schedule writes route through the hosted
  `/api/desktop/v1/schedule/mutations` boundary.
- No direct renderer Supabase Schedule write was introduced.
- Hosted mutation failures remain failures; malformed success envelopes fail
  closed instead of creating simulated mutation success.
- Successful Schedule mutations trigger authoritative day and availability
  refresh before the action dialog closes.
- `checked_in` attendance has operational precedence and resolves to
  `On Duty` even when Schedule assignment is missing/inconsistent.
- Otherwise day-off resolves to `Day Off`.
- Otherwise missing/unconfigured Schedule resolves to `Not Assigned`.
- Otherwise valid scheduled staff resolve to `Scheduled`.
- Rooms/resource presentation derives only from resources returned on real
  booking payloads.
- Component tests cover loading, empty, error, role/state filters, search,
  staff selection, inspector data, keyboard activation, Week lazy loading,
  Week-mode role/state/resource filter application, Availability, Adjust
  Schedule, Block Time, Full Schedule and post-mutation authoritative refresh.

Repository source proves repository implementation only. It does not by
itself prove deployed production behavior.

### Owner-provided manual runtime evidence

**OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**

On 2026-09-09, after the Stage 06B owner runtime gate was requested, the owner
confirmed the result as acceptable and explicitly instructed: "it ok lets
procceed".

No screenshots or separate per-resolution observations were supplied with
that confirmation, so this evidence record does not invent viewport-specific
or mutation-specific observations beyond the owner's acceptance.

### Unverified / open questions

- No screenshot artifact is stored with this evidence record.
- No independent claim is made here that a real hosted Schedule mutation was
  manually performed during owner inspection.
- Repository tests use isolated service/component mocks where appropriate and
  do not constitute production mutation evidence.
- Deployed hosted behavior remains authoritative and separate from repository
  implementation evidence.

## Independent review correction — Week filters

Independent GitHub review found that the Week board kept the shared role,
operational-state and resource controls visible while the Week overview only
consumed search input. This made those controls ineffective in Week mode.

The correction:

- passes the authoritative availability map plus role, state and resource
  selections from `ScheduleView` into `ScheduleWeekOverview`
- reuses the same canonical role/state matching helpers used by the Day
  timeline
- applies resource matching only against real booking `resource_id` values
- applies the filters both when building the weekly staff list and when
  resolving individual day cells
- adds a component regression test covering Week-mode role, Day Off and real
  resource filtering through the actual `ScheduleView` controls
- does not alter the hosted contract, authentication, mutation boundary,
  schema, migrations or dormant modules

Tested correction implementation SHA: `ad5cd15be3f1e1405b6cff5d61dba9a5c151d264`.

## Exact checks

| Command / Check                                                                                                             | Result | Notes                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| `pnpm typecheck`                                                                                                            | PASS   | TypeScript no-emit check                                     |
| `pnpm exec vitest run tests/schedule-service.test.ts tests/schedule-role-groups.test.ts tests/schedule-components.test.tsx` | PASS   | 3 files, 47/47 Stage 06B focused tests; Week filters covered |
| `pnpm lint`                                                                                                                 | PASS   | ESLint with zero allowed warnings                            |
| `pnpm test`                                                                                                                 | PASS   | 17 files, 337/337 tests                                      |
| `pnpm format:check`                                                                                                         | PASS   | All files matched Prettier                                   |
| `pnpm build`                                                                                                                | PASS   | Vite production build, 1941 modules                          |
| `git diff --check`                                                                                                          | PASS   | No whitespace errors                                         |
| Schedule direct-write guard                                                                                                 | PASS   | No renderer Supabase insert/upsert/delete/rpc Schedule write |
| migration/schema scope guard                                                                                                | PASS   | No migration/schema files changed                            |

Known non-failing output:

- existing Customers component tests emit React `act(...)` stderr warnings
- Vite reports a greater-than-500-kB chunk-size advisory

Neither warning was expanded into unrelated Stage 06B cleanup.

## Runtime evidence actually observed

**OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**

Owner accepted the Schedule runtime and authorized proceeding on 2026-09-09.

No additional visual facts are inferred beyond that owner statement.

## Security / data impact

- production data changed? **no by repository implementation/test scripts;
  no owner-reported manual mutation is recorded**
- schema/migration changed? **no**
- Auth/RLS/Storage policy changed? **no**
- secrets introduced/exposed? **no**
- privileged server behavior changed? **no**
- Tauri capabilities changed? **no**

Schedule mutations remain server-mediated through the accepted hosted API
boundary. Renderer-supplied authorization is not trusted.

## Limitations

- Hosted repository source establishes the implementation contract, not
  deployed production behavior.
- The evidence record contains owner confirmation but no saved runtime
  screenshots.
- Existing Customers `act(...)` warnings remain outside Stage 06B.
- Existing Vite chunk-size advisory remains outside Stage 06B.
- No schema, migration, caching, persistence, polling or background-sync
  architecture was added.

## Rollback

Before merge, the Stage 06B commits can be abandoned by deleting the stage
branch.

After merge, revert the Stage 06B implementation and evidence commits rather
than rewriting accepted history. No database rollback is required because
Stage 06B introduces no schema or migration changes.

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
