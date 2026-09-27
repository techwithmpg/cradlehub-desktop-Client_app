# Stage 12B — Desktop Wiring & Final Security Sweep

## Target and authority

- Target: CradleHub Desktop (`techwithmpg/cradlehub-desktop-Client_app`).
- Stage: 12B only; implementation on `stage/12b-desktop-wiring-security`.
- BASE_SHA: `683b5c11651c972e6290b6796d01b3b449c105a4`.
- HOSTED_AUTHORITY_SHA: `03242a0bfbcfe6c4b1b03ba624510004cae7cc6a` (`techwithmpg/Cradlehub`).
- HEAD_SHA: resolved after the Stage 12B commit and push, and reported in the final handoff. A commit cannot encode its own SHA in its contents. Resolve the evidence-bearing revision with `git log -1 --format=%H -- docs/30-delivery/STAGE_12B_EVIDENCE.md`; final handoff also verifies local and remote branch equality.
- Verification date: 2026-09-27.

**REPOSITORY-RECORDED PRODUCTION EVIDENCE:** Desktop main was fetched and verified clean at BASE_SHA before branch creation. Hosted main was independently fetched and remained at HOSTED_AUTHORITY_SHA; its Stage 12A endpoint source was inspected. This label denotes repository/source observations, not executed production workflows. The hosted checkout remained clean and was not modified.

**OWNER-PROVIDED MANUAL RUNTIME EVIDENCE:** The owner reports that the hosted Vercel deployment for the exact Stage 12A merge SHA was independently observed as READY. This proves deployment of that commit; it does not prove authenticated Staff or Booking mutations were exercised successfully. No new deployment was initiated for this Desktop stage.

## Exact changed files

```text
docs/30-delivery/STAGE_12B_EVIDENCE.md
src/components/bookings/BookingInspectorCard.tsx
src/components/bookings/BookingsView.tsx
src/components/bookings/RescheduleBookingModal.tsx
src/components/staff/StaffInspectorCard.tsx
src/components/staff/StaffView.tsx
src/components/staff/modals/StaffApplicationApprovalModal.tsx
src/components/staff/modals/StaffOffboardingNoticeModal.tsx
src/components/staff/modals/StaffRoleModal.tsx
src/lib/bookings-service.ts
src/lib/hosted-json-response.ts
src/lib/roles.ts
src/lib/staff-service.ts
src/lib/use-modal-focus.ts
src/types/bookings.ts
src/types/staff.ts
tests/bookings-components.test.tsx
tests/bookings-service.test.ts
tests/boundary.test.ts
tests/staff-components.test.tsx
tests/staff-service.test.ts
```

The existing Staff and Booking components are wired in place. Shared constants describe supported inputs; the focus hook supplies behavior to existing modal markup. Tests protect the touched workflows and security boundary. No package, lockfile, styles/token system, Tauri configuration, schema, migration, or hosted source changed.

## Staff contracts wired

All paths below are relative to `https://www.cradlewellnessliving.com` and carry the current Supabase user access token as `Authorization: Bearer <access_token>` using native `@tauri-apps/plugin-http`.

| Workflow     | Endpoint                                                    | Desktop request body                                                                     |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Approval     | `POST /api/desktop/v1/staff/onboarding/[requestId]/approve` | `branchId`, canonical `systemRole`, canonical `tier`, optional deduplicated `serviceIds` |
| Rejection    | `POST /api/desktop/v1/staff/onboarding/[requestId]/reject`  | Optional trimmed `rejectionReason` (maximum 500); `{}` when absent                       |
| Profile      | `PATCH /api/desktop/v1/staff/[staffId]`                     | Only `fullName`, `nickname`, optional `phone`, `tier`, `staffType`, `isHead`             |
| System role  | `POST /api/desktop/v1/staff/[staffId]/role`                 | Only canonical `systemRole`                                                              |
| Deactivation | `POST /api/desktop/v1/staff/[staffId]/deactivate`           | Exactly `{}`                                                                             |

Approval does not send `staffId`, `staffType`, reviewer role, authorization branch, or auth user ID. The hosted server resolves actor authority and derives staff type from the onboarding request. The preferred role is read-only in the approval UI. Branch and target identifiers are mutation inputs, not claims of caller authority.

Canonical tiers: `n/a`, `junior`, `mid`, `senior`, `head`. Profile staff types: `therapist`, `nail_tech`, `aesthetician`, `csr`, `driver`, `utility`, `salon_head`, `managerial`.

Canonical selectable roles: `owner`, `manager`, `assistant_manager`, `store_manager`, `crm`, `staff`, `service_head`, `service_staff`, `digital_marketer`, `driver`, `utility`. Owner sees all eleven; management sees CRM, digital marketer and the operational lower roles; CRM sees the same operational lower roles except digital marketer. Legacy role aliases are not selectable. Filtering and self-action guards assist the operator; the hosted server remains the authorization authority.

Profile validation enforces name 2–100 characters, nickname at most 80, and supplied phone 7–20. An unchanged blank/null phone is omitted; a valid changed phone is sent. Clearing an existing phone shows a validation error because the contract does not support clearing it. Nickname clearing sends `null`. Email, branch, system role, activation state, and auth user ID are excluded from the profile body.

The existing modal/inspector classes, buttons and banners are retained. Each action has pending locks and duplicate-submit guards, keeps errors and input visible after failure, and shows success only after a validated hosted success. Staff success callbacks refresh authoritative Staff/Application data; profile and role callbacks do not optimistically patch local records. Deactivation wording states that access is disabled and the staff record retained.

## Booking contract wired

`POST /api/desktop/v1/bookings/[bookingId]/reschedule` sends `date`, `startTime`, optional trimmed `note`, optional `homeServiceAddress`, optional `homeServiceAccessNote`, and optional `therapistId`/`overrideReason` for a changed therapist. An explicitly cleared access note remains an empty string so the hosted contract can clear it. An unchanged therapist omits both reassignment fields.

Exact reason values: `customer_requested`, `therapist_on_break`, `manager_decision`, `skill_or_service_mismatch`, `workload_balance`, `other`. Therapist change counts as an operational change and requires a reason in Desktop UX. Note remains optional for ordinary date/time changes and reassignment. The server computes end time and validates role, branch, lifecycle, therapist qualification/availability, room/resources and concurrency; Desktop does not duplicate this authority.

Therapist choices use the accepted branch booking-options read. Loading, options, empty set and read error are rendered truthfully. Failed candidate reads prevent reassignment while leaving ordinary rescheduling with the current therapist usable. Pending requests disable controls and dismissal; failures remain visible. Hosted success triggers existing authoritative refresh and success feedback.

## Request and security boundary

The Staff service has one small internal hosted helper; reschedule also uses `readHostedJsonResponse`. Both obtain the existing user session, fail closed without its access token, validate success envelopes at runtime, preserve server error codes/messages, and report network failures as connection-required failures. Non-JSON/malformed responses cannot be treated as successful writes. No offline queue or synthetic success is added.

The existing base URL validation requires HTTPS, no embedded URL credentials, and the exact expected hosted origin. No actor role/authority headers or privileged credentials are sent. The bearer token identifies the caller; hosted code resolves authorization.

Sensitive direct renderer table writes for onboarding approval/rejection, profile and system role have been removed. Deactivation and booking reschedule/reassignment use the hosted endpoints. The added TypeScript AST boundary test checks direct `update`/`insert`/`upsert`/`delete` chains on `staff`, `staff_onboarding_requests` and `bookings` in renderer services. Mock boundary tests assert no table/RPC calls for these five hosted Staff functions. Accepted roster and schedule reads, schedule mutation contracts and the capability RPC remain intact. The correction section below records the subsequent catalogue and onboarding read contract changes.

The accepted `replace_staff_service_capabilities` call remains unchanged and uses the caller-authenticated Supabase client. Its hosted PostgreSQL function is `SECURITY DEFINER` and performs internal actor-aware authorization using `auth.uid()` and server-resolved actor, role, branch and target/service constraints. This is not a claim that ordinary table RLS authorizes the function operation. No service-role client is used by Desktop.

Tauri capability result: unchanged. `src-tauri/capabilities/desktop-api.json` still permits only `https://www.cradlewellnessliving.com/api/desktop/v1/*` for this hosted route family. No filesystem, shell, database, process or arbitrary-domain permissions were added.

Security scans searched `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `service-role`, `supabaseServiceRole`, `admin client`, `createAdminClient` and secret-key prefixes. Renderer source, Tauri source/configuration and environment files contain no privileged credential or admin client. Repository-wide keyword matches are explanatory governance/evidence and negative test assertions, not credentials. Environment values were not printed. Generated bundle inspection found one literal `sb_secret_` prefix in the Supabase SDK's key-format classifier (`startsWith`), with no secret credential value or privileged client. No service-role key or admin-client implementation was found in the generated bundle. This distinguishes dependency vocabulary from secret exposure.

## Initial implementation tests and gates (pre-correction)

Node `24.14.0` and pnpm `10.33.2` were used; dependencies and lockfiles were unchanged.

| Command                                                                                                                                                                                                | Final result                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `pnpm exec vitest run tests/staff-service.test.ts tests/staff-components.test.tsx tests/bookings-service.test.ts tests/bookings-components.test.tsx tests/auth-service.test.ts tests/boundary.test.ts` | PASS: 6 files, 308 tests                                           |
| `pnpm test`                                                                                                                                                                                            | PASS: 23 files, 609 tests                                          |
| `pnpm typecheck`                                                                                                                                                                                       | PASS                                                               |
| `pnpm lint`                                                                                                                                                                                            | PASS, zero warnings                                                |
| `pnpm format:check`                                                                                                                                                                                    | PASS                                                               |
| `pnpm build`                                                                                                                                                                                           | PASS: TypeScript and Vite frontend build, 1958 transformed modules |
| `git diff --check`                                                                                                                                                                                     | PASS                                                               |

Service tests cover exact endpoints/methods/bearer bodies, stripped authority fields, optional rejection reason, nickname clearing and phone limits, canonical roles, absent session, configuration failure, server errors including 401/403/404/409/500, malformed/non-JSON responses, and network failure without token leakage. Booking tests cover reassignment fields, omission without reassignment, access-note clearing, errors and validated success.

Component tests cover canonical controls, actor-role UX choices, self/no-op guards, optional reasons/notes, pending/duplicate protection, failure persistence, authoritative callbacks/refresh, candidate read states, and profile selection/tab locks during submission. Keyboard tests exercise idle Escape, pending Escape blocking, Tab focus trapping and focus restoration in jsdom. Native HTML controls provide Enter/Space semantics; actual native keyboard behavior is not claimed from mocked tests. Accessible labels, named dialogs, semantic disabled controls, progress wording and error alerts are present in touched source.

These are automated source/component/service results with mocked mutations, not production workflow evidence. The build is the frontend production build, not installer/release packaging.

## Native Windows runtime and viewports

`pnpm tauri dev` was actually attempted. Its `BeforeDevCommand` (`pnpm dev`) failed because Vite port 1420 was already in use. The existing loopback listener was confirmed, and an existing `cradlehub-desktop` process had window title `CradleHub Desktop`. Existing owner processes were left running. Process/window metadata does not verify that this branch's UI rendered.

Native UI control is unavailable in this environment. No authenticated native Staff/Booking mutation was performed, and native HTTP execution of these newly wired routes was not observed. No screenshots were fabricated.

| Native viewport   | Result                              |
| ----------------- | ----------------------------------- |
| 1440×900          | NOT OBSERVED; native launch blocked |
| 1366×768          | NOT OBSERVED; native launch blocked |
| 1024×768 degraded | NOT OBSERVED; native launch blocked |

Dialog scrolling/footer layout and focus/pending behavior were reviewed in source and mocked component tests. Actual native layout, clipping, keyboard behavior, expected-route capability execution and authenticated workflows require owner runtime confirmation. No native runtime PASS is claimed.

## Data impact and known limitations

- Production mutation performed: **NO**.
- Schema/migration impact: **NONE**.
- Local DB/cache impact: **NONE**.
- Hosted repository changes: **NONE**.
- Capability/permission changes: **NONE**.
- Service-role/privileged secret exposure found: **NONE**.

The authoritative deactivation endpoint sets `is_active=false`.

The currently accepted Staff read/status model does not expose a reliable discriminator between an authenticated inactive row caused by deactivation and an authenticated inactive row classified as awaiting approval.

Stage 12B therefore does not invent a persistent Inactive classification. The authoritative write is wired; existing hosted read classification is preserved. Desktop `deriveStaffStatus` and hosted `src/components/features/staff/staff-management-utils.ts` at HOSTED_AUTHORITY_SHA continue to classify active, invited and awaiting rows. No local storage marker, timestamp inference or new status discriminator is added. Inactive status parity is not claimed.

Phone clearing remains unsupported by the hosted profile contract and is explained by validation. These writes require connectivity. Native runtime/viewports and authenticated workflow success remain unobserved in this agent run and require owner confirmation.

## Rollback and review boundary

Rollback is a reviewed Git revert of the Stage 12B implementation commit, identified by the final handoff HEAD_SHA. No database rollback is required or performed because this run changed no schema or production data. Restoring the accepted baseline returns these UI mutations to their prior unavailable state.

Push this stage branch for independent GitHub review and owner runtime confirmation, then stop. This evidence does not authorize merge, hosted changes, manual deployment, packaging, identity, notifications, SQLite/cache, or another stage.

## Correction and independent re-review

- Stage: 12B correction only, on the same `stage/12b-desktop-wiring-security` branch.
- PRE_CORRECTION_HEAD: `3054a61eea16d053ee2a1ecb2933e5b50ad794dc`.
- BASE_SHA remains `683b5c11651c972e6290b6796d01b3b449c105a4`.
- HOSTED_AUTHORITY_SHA remains `03242a0bfbcfe6c4b1b03ba624510004cae7cc6a`; hosted checkout was inspected and remained clean at this anchor.
- Correction HEAD_SHA is resolved after commit/push and reported in the handoff; it is not self-encoded in this file.

The independent review returned **CHANGES REQUIRED**. The pre-correction implementation had three defects: the approval service read could hide failure as empty data and fall back to global active services; onboarding reads also hid failures as empty applications; two disconnected availability actions generated a success-like operational claim without any availability query. The initial test results above describe that reviewed revision and do not establish that these defects were absent.

### Exact correction files

```text
docs/30-delivery/STAGE_12B_EVIDENCE.md
src/components/staff/StaffInspectorCard.tsx
src/components/staff/StaffView.tsx
src/components/staff/modals/StaffApplicationApprovalModal.tsx
src/lib/staff-service.ts
src/types/staff.ts
tests/staff-components.test.tsx
tests/staff-service.test.ts
```

### Corrected read and action behavior

`fetchBranchAssignableServices` now returns an explicit success/failure result. Verified empty is `{ ok: true, data: [] }`; query/RLS/network errors and malformed eligibility payloads return `ok: false` with a code and truthful message. The broad global `services` fallback is removed entirely.

The minimal read queries `branch_services` with `branch_id` and active membership filters, joining `services` and its optional category name. It verifies the returned branch identifier, matching service ID, relation shape, active flags and delivery flags. A wrong-branch or malformed eligibility row fails the complete catalogue read closed. Globally inactive services and inactive branch rows are excluded. In-spa availability qualifies an active service; home-only availability additionally requires verified enabled `branch_booking_rules.home_service_enabled` for the same branch. Visibility is not filtered, matching the hosted `staff_assignment` audience. Relation objects and the single-element array compatibility form are supported. No standalone global service query occurs.

**REPOSITORY-RECORDED PRODUCTION EVIDENCE:** Eligibility was checked against hosted `src/lib/services/service-catalog.ts`, `src/lib/services/service-eligibility.ts`, `src/lib/queries/branch-booking-rules.ts`, and schema types at HOSTED_AUTHORITY_SHA. The hosted subsystem was not copied into Desktop. Its hosted rule resolver can default absent rows; this Desktop read conservatively treats a missing/unreadable rules row as unverified when home-only eligibility depends on it, because the authenticated read cannot distinguish true absence from a row hidden by RLS. It does not silently assume an enabled Home Service mode. Reads requiring no home-only decision do not query booking rules. No new client authorization claim or schema fallback is introduced.

StaffView explicitly tracks catalogue loading, readiness and error, independently of list length. Approval defaults to unverified, disables submit and rejects direct form submission until the catalogue is verified, and displays verification/error text with Retry through the existing workspace reload. A verified empty catalogue or intentional zero selections may submit an explicit empty service list; there is no invented mandatory-capability rule. Selected IDs must still belong to the verified choices. Existing hosted mutation, pending, duplicate-submit and focus behavior is preserved.

`fetchBranchOnboardingRequests` now also returns explicit success/failure results and validates required fields, branch identity, status and payload shape. A legitimate empty applications read is successful; a failed/malformed read is not empty success. Nullable phone/preferred-role values remain displayable without inventing identifiers.

At reload start, StaffView marks dependencies unverified and clears actionable application rows. Failed application reloads keep actions unavailable, close the saved approval target and show the canonical error/Retry banner. The Applications list is rendered only after successful verification, so its normal empty-state copy cannot represent a failed read. Successful retry restores authoritative rows and clears errors. The modal resolves its target from current verified submitted applications. A read generation guard prevents an older overlapping refresh from restoring stale readiness over a newer result.

Both Staff inspector availability controls remain visible but disabled when no `onCheckAvailability` callback is supplied, with the title: `Availability checking is not connected in the current Staff contract.` A supplied callback receives the selected staff member. Neither path generates an availability claim. The now-unused `actionNotice` state and render blocks were removed. No availability API was added, and a callback unit test is not proof of production availability.

### Correction verification

Node `24.14.0` and pnpm `10.33.2` were reused. No dependencies, test configuration or security boundary tests were weakened or changed.

| Command                                                                                                                                                                                                | Correction result                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `pnpm exec vitest run tests/staff-service.test.ts tests/staff-components.test.tsx tests/bookings-service.test.ts tests/bookings-components.test.tsx tests/auth-service.test.ts tests/boundary.test.ts` | PASS: 6 files, 356 tests             |
| `pnpm test`                                                                                                                                                                                            | PASS: 23 files, 657 tests            |
| `pnpm typecheck`                                                                                                                                                                                       | PASS                                 |
| `pnpm lint`                                                                                                                                                                                            | PASS, zero warnings                  |
| `pnpm format:check`                                                                                                                                                                                    | PASS                                 |
| `pnpm build`                                                                                                                                                                                           | PASS: frontend TypeScript/Vite build |
| `git diff --check`                                                                                                                                                                                     | PASS                                 |

Formatting was finalized with the repository-pinned Prettier `3.9.6`; an earlier `pnpm exec prettier` invocation resolved a global `3.6.2`, which produced two formatting discrepancies. The required repository `pnpm format:check` passed after scoped formatting with the pinned version. The sandboxed Vite build was blocked by `spawn EPERM`; the unchanged build command passed outside the sandbox. Vite reported a nonfatal chunk-size warning; no build/test configuration was weakened.

The 48 added test cases verify scoped catalogue membership, legitimate emptiness, query/RLS/network failures, no global fallback, wrong-branch rejection, global/branch activity, delivery eligibility, required Home Service rules failures, malformed relations/payloads, application failure versus emptiness, catalogue fail-closed form submission, verified empty approval, selected service IDs, retry recovery, stale action removal, and both availability contexts. Earlier Stage 12B hosted Staff/Booking, bearer/origin, malformed-response, duplicate/focus and security tests remain in the passing regression suites. These are mocked tests and repository checks; no live production query or workflow verification is claimed.

Source security scans found no service-role key, privileged admin client or arbitrary mutation origin. The direct-sensitive-write AST regression remains passing and unchanged. Booking implementation, Tauri capability, accepted capability RPC, deactivation status derivation and hosted source are unchanged in this correction. Generated bundle scanning again distinguishes the Supabase SDK's literal `sb_secret_` format-check prefix from a credential; no privileged credential value was found.

Native runtime was not independently observed by the agent in this correction. The prior port-1420 block remains the recorded native attempt; no unknown owner process was stopped and no fabricated viewport evidence was added. 1440×900, 1366×768 and 1024×768 remain **NOT OBSERVED**. Owner runtime confirmation is required.

Production mutations: **NO**. Schema/migrations: **NONE**. Local DB/cache: **NONE**. Hosted changes: **NONE**. The deactivation read-model ambiguity and unsupported phone-clearing limitation above remain unchanged.

Rollback of this correction is a reviewed revert of its commit identified by the final NEW_HEAD_SHA. No data rollback is needed or performed. Push the correction without force to the same branch, verify local/remote equality and clean working tree, and stop for independent GitHub re-review. No merge or new stage is authorized by these results.
