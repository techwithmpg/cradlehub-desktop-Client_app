# Stage 04 — Staff Audit & Discovery Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Audit Evidence Precision Fix)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **INITIAL_AUDIT_SHA**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`
- **CORRECTION_BASE_SHA**: `a97746772e49ffa443f38a740786afd73110f10a`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 04 AUDIT EVIDENCE PRECISION FIX READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage 04 Functional UI Implementation**: **NOT YET STARTED / AWAITING CHECKPOINT REVIEW**.
- **Stage Authorization**: Only Stage 04 is authorized. Other modules remain separate or dormant.

---

## 1. Executive Summary & Purpose

This checkpoint establishes the authoritative data contract, security boundaries, role permissions, and UI structure for the **Stage 04 Staff** module before writing functional UI code.

The desktop client must integrate with the hosted database and application contracts while maintaining strict adherence to:

1. **One canonical UI design system**: Reusing the accepted desktop architecture (tokens, DataGrid, inspector, skeletons, error states from Stages 01–03).
2. **Single-branch desktop authority**: Reusing the single authoritative branch resolved in desktop `AuthContext` (`branchId`, `branchName`).
3. **Hosted Staff-management roster authority**: The desktop roster mirrors the hosted Staff management reads (`.eq('branch_id', branchId)`), returning all branch staff and deriving operational status per record.
4. **Distinction between Staff Management and Schedulable Staff**: `isOperationalStaff()` in `src/lib/staff/operational-staff.ts` is an operational scheduling helper for booking availability; it is NOT the general Staff-management roster because it excludes invited and awaiting staff.
5. **Authoritative status derivation**: Runtime derived statuses are strictly `active`, `awaiting`, and `invited`. `"inactive"` exists in the hosted type/label vocabulary but is not emitted by `getStaffStatus()`, and is therefore not exposed in Stage 04 filters or badges.
6. **Deterministic summary metrics**: Summary statistics align 1:1 with hosted Staff semantics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`) rather than invented provider/support groupings.
7. **Data minimization**: Service capability lookups retrieve only minimal operational fields (`id`, `name`), avoiding unnecessary pricing or duration data.
8. **Read-only initial vertical slice**: Stage 04 implementation delivers an authoritative read-only staff roster and operational inspector. Zero mutations are authorized for Prompt 2 implementation.
9. **No fake or speculative local fallback data**: All state surfaces reflect genuine database and transport responses.

---

## 2. Canonical Hosted Staff Contract Discovery

Inspection of hosted `techwithmpg/Cradlehub` at `HOSTED_SHA` (`aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`) identified the authoritative data sources and contracts:

### A. Primary Data Model (`public.staff`)

| Column                 | Type          | Nullable | Description & Domain Semantics                                                                                                                                                 |
| :--------------------- | :------------ | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `uuid`        | NO       | Primary key for staff member.                                                                                                                                                  |
| `branch_id`            | `uuid`        | NO       | Primary branch assignment. Foreign key to `public.branches(id)`.                                                                                                               |
| `auth_user_id`         | `uuid`        | YES      | Links to Supabase Auth (`auth.users.id`). `NULL` if staff has no login credentials or is pending invitation claim.                                                             |
| `full_name`            | `text`        | NO       | Legal / formal staff name. Placeholder `"Pending invitation"` indicates invite link generated but unlinked.                                                                    |
| `nickname`             | `text`        | YES      | Operational name known to front desk and customers. Display fallback if present.                                                                                               |
| `phone`                | `text`        | YES      | Contact phone number for operational dispatch. Default placeholder `"0000000000"` in legacy/unassigned records.                                                                |
| `avatar_url`           | `text`        | YES      | Public URL or Supabase storage path to profile image.                                                                                                                          |
| `tier`                 | `text`        | NO       | Therapist skill tier: `'senior'`, `'mid'`, `'junior'`. (Default `'mid'`). Applicable to service-capable staff types.                                                           |
| `system_role`          | `text`        | NO       | Canonical app access role: `'owner'`, `'manager'`, `'assistant_manager'`, `'store_manager'`, `'crm'`, `'staff'`, `'service_head'`, `'service_staff'`, `'driver'`, `'utility'`. |
| `staff_type`           | `text`        | NO       | Real-world job function: `'therapist'`, `'csr'`, `'nail_tech'`, `'aesthetician'`, `'driver'`, `'utility'`, `'managerial'`, `'salon_head'`. (Default `'therapist'`).            |
| `is_head`              | `boolean`     | NO       | Department head / lead therapist supervisor flag. (Default `false`).                                                                                                           |
| `is_active`            | `boolean`     | NO       | Raw operational boolean flag.                                                                                                                                                  |
| `is_cross_branch`      | `boolean`     | NO       | Flag indicating if staff can take shifts/appointments at other branches.                                                                                                       |
| `archived_at`          | `timestamptz` | YES      | Soft-delete timestamp. Used by scheduling/availability helpers.                                                                                                                |
| `merged_into_staff_id` | `uuid`        | YES      | Pointer if duplicate record was merged. Used by scheduling/availability helpers.                                                                                               |
| `created_at`           | `timestamptz` | NO       | Creation timestamp.                                                                                                                                                            |
| `updated_at`           | `timestamptz` | NO       | Last update timestamp.                                                                                                                                                         |

### B. Hosted Staff-Management Roster Authority vs Operational Staff

In the hosted CRM Staff workspace (`src/app/(dashboard)/crm/staff/page.tsx` and `src/lib/queries/staff.ts`), the Staff-management reads are:

1. **Active Staff**: `getStaffByBranchWithBranches(branchId)`
   ```ts
   supabase
     .from('staff')
     .select('*, branches ( id, name )')
     .eq('branch_id', branchId)
     .eq('is_active', true)
     .order('tier')
     .order('full_name');
   ```
2. **Pending Staff**: `getPendingStaffByBranch(branchId)`
   ```ts
   supabase
     .from('staff')
     .select('*, branches ( id, name )')
     .eq('branch_id', branchId)
     .eq('is_active', false)
     .order('created_at', { ascending: false });
   ```

Neither of these authoritative Staff-management queries filters on `archived_at` or `merged_into_staff_id`.

> [!IMPORTANT]
> The current hosted CRM Staff-management reads divide branch Staff by `is_active`. Separate operational/schedulability helpers (`isOperationalStaff()` in `src/lib/staff/operational-staff.ts`) use stricter archive/merge/metadata exclusions for appointment scheduling contexts. Stage 04 Desktop mirrors the current Staff-management contract rather than introducing a Desktop-only roster rule.

### C. Authoritative Staff Status Derivation

Hosted source `src/components/features/staff/staff-management-utils.ts` defines the canonical runtime status derivation:

```ts
export function getStaffStatus(member: StaffMember): StaffStatus {
  if (member.is_active) return 'active';
  if (
    !member.auth_user_id ||
    member.full_name.toLowerCase() === 'pending invitation'
  ) {
    return 'invited';
  }
  return 'awaiting';
}
```

The runtime derivation produces exactly three possible statuses:

1. **`active` ("Active")**: `is_active === true`. Staff member is active, verified, and operational on the roster.
2. **`invited` ("Invite Sent")**: `is_active === false` AND (`!auth_user_id` OR `full_name.toLowerCase() === "pending invitation"`). Staff record created as an invitation placeholder awaiting user account claim.
3. **`awaiting` ("Awaiting Approval")**: `is_active === false` AND `auth_user_id !== null` AND `full_name.toLowerCase() !== "pending invitation"`. Staff member has claimed an account but is awaiting manager/owner activation.

> [!NOTE]
> `"inactive"` exists in the hosted `StaffStatus` TypeScript type and label dictionary (`"Inactive"`), but the current authoritative `getStaffStatus()` function does NOT emit it. Stage 04 must therefore NOT expose an `Inactive` filter or badge.

### D. Secondary Data Model (`public.staff_services`)

| Column       | Type          | Nullable | Description                                                                                      |
| :----------- | :------------ | :------- | :----------------------------------------------------------------------------------------------- |
| `staff_id`   | `uuid`        | NO       | Foreign key to `public.staff(id)`.                                                               |
| `service_id` | `uuid`        | NO       | Foreign key to `public.services(id)`. Identifies services this provider is qualified to perform. |
| `created_at` | `timestamptz` | YES      | Assignment timestamp.                                                                            |

For Stage 04 read-only display, the capability query is minimized to `staff_services(service_id, services(id, name))`. Pricing, durations, and financial metadata are omitted as they do not belong to the Staff operational profile.

---

## 3. Authorization & Row Level Security (RLS)

All database reads and writes execute under the authenticated user's Supabase session.

### A. Database RLS Authority

1. **`public.staff` SELECT (`staff_csr_read_branch` / `staff_org_structure`)**:
   - `crm`, `assistant_manager`, `store_manager`, `manager`, `csr`, `csr_head`, `csr_staff`: Permitted to `SELECT` all staff rows where `branch_id = get_auth_branch_id()`.
   - `owner`: Permitted to `SELECT` all staff rows across all branches (`staff_owner_all`).
   - `staff`: Permitted to `SELECT` only their own staff record (`staff_read_own`).
2. **`public.staff` UPDATE (`staff_operational_update_branch` in migration `20260701130415_crm_staff_operational_update_policy.sql`)**:
   - Operational roles (`manager`, `assistant_manager`, `store_manager`, `crm`, `csr`, `csr_head`, `csr_staff`) are granted `UPDATE` on operational columns (`full_name`, `nickname`, `phone`, `tier`, `staff_type`, `is_head`, `is_active`, `system_role`, `branch_id`).
   - Row filter: `branch_id = get_auth_branch_id()` AND `system_role NOT IN ('owner', 'manager', 'assistant_manager', 'store_manager')`.
   - Non-owner actors cannot update managerial or owner rows.
3. **`public.staff_services` RLS (migrations `20260617141348` and `20260806132402`)**:
   - **SELECT (`staff_services_operational_select_branch`)**: Operational roles can `SELECT` `staff_services` rows where target staff belongs to `get_auth_branch_id()`.
   - **INSERT (`staff_services_operational_insert_branch`)**: Operational roles can `INSERT` capabilities for active branch staff where service is assignable in branch (`public.is_branch_service_assignable`).
   - **UPDATE (`staff_services_operational_update_branch`)**: Operational roles can `UPDATE` capabilities for branch staff where service is assignable.
   - **DELETE (`staff_services_operational_delete_branch`)**: Operational roles can `DELETE` capabilities for non-managerial branch staff.
   - **Atomic RPC (`public.replace_staff_service_capabilities`)**: Validates authenticated actor, branch scope, target staff active status, and canonical branch assignability before replacing capabilities.

### B. Hosted Application Mutation Contract (`updateStaffAction`)

Hosted server action `updateStaffAction` in `src/app/(dashboard)/owner/staff/actions.ts` adds application-level guardrails on top of RLS:

- Role check: Requires active staff record with role in `STAFF_OPERATIONAL_ROLES` (`owner`, `manager`, `assistant_manager`, `store_manager`, `crm`).
- Branch constraint: Non-owner actors are constrained to `ctx.me.branch_id`.
- Sensitive role protection: Non-owner actors cannot edit target staff with `SENSITIVE_SYSTEM_ROLES` (`owner`, `manager`, `assistant_manager`, `store_manager`, `super_admin`, `platform_admin`, `branch_manager`).
- Role assignment guard: Non-owner actors can only assign `MANAGER_SAFE_ROLES` (`crm`, `driver`, `utility`, `service_head`, `service_staff`, `staff`).
- Service sync: Invokes `replace_staff_service_capabilities` RPC when `serviceIds` are updated.

### C. Desktop Implementation Authorization & Scope

- **Stage 04 Initial Vertical Slice is Strictly READ-ONLY**:
  - No profile mutation (`UPDATE staff`) is authorized for initial implementation.
  - No service capability mutation (`INSERT/DELETE staff_services` or `replace_staff_service_capabilities`) is authorized for initial implementation.
  - No staff deletion or deactivation action is authorized.
  - Initial slice delivers authenticated read-only roster and operational inspector.

---

## 4. Authoritative Contract Matrix

| Operation                        | Authority Layer      | Transport / API Pattern                                                    | Auth Required     | Role Scope                                                      | Branch Scope                                       | Request Shape                                                      | Response Shape                                   | Desktop Implication                                                                                                    |
| :------------------------------- | :------------------- | :------------------------------------------------------------------------- | :---------------- | :-------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Fetch Branch Staff Roster**    | Database RLS         | `supabase.from('staff').select(...)` via accepted `getSupabaseClient()`    | Supabase Session  | `crm`, `manager`, `owner`, `assistant_manager`, `store_manager` | Branch-Scoped (`branch_id = authContext.branchId`) | `branch_id: string`, order by `tier, full_name`                    | Array of `StaffMemberRow` with joined `branches` | Reuses accepted desktop Supabase client infrastructure matching Bookings/Customers pattern.                            |
| **Fetch Staff Capabilities**     | Database RLS         | `supabase.from('staff_services').select('service_id, services(id, name)')` | Supabase Session  | Operational roles                                               | Branch staff only                                  | `staff_id: string`                                                 | Array of assigned service names                  | Rendered inside the Staff Inspector panel Services tab. Minimized to `id, name`.                                       |
| **Search / Filter Staff**        | Client / Memory      | Local filtering over loaded branch roster                                  | Supabase Session  | Operational roles                                               | Current branch                                     | `search: string`, `role: string`, `status: string`, `type: string` | Filtered array of `StaffMemberRow`               | Real-time search by name, nickname, or phone; filter by role, staff type, or status (`active`, `awaiting`, `invited`). |
| **Staff Profile Update**         | App Action / DB RLS  | Hosted server action / direct RLS mutation                                 | Supabase Session  | Operational roles (non-owner targets)                           | Own branch                                         | Profile payload                                                    | Updated staff row                                | **DEFERRED**: Read-only vertical slice prioritized for Stage 04 initial release.                                       |
| **Replace Service Capabilities** | Atomic RPC / DB RLS  | `replace_staff_service_capabilities` RPC                                   | Supabase Session  | Operational roles                                               | Own branch, assignable services                    | `p_target_staff_id`, `p_service_ids`                               | Array of `service_id`                            | **DEFERRED**: Read-only vertical slice prioritized for Stage 04 initial release.                                       |
| **Onboarding / Invite Requests** | Hosted Web Admin     | Server Action / Admin API                                                  | Admin Credentials | Owner / HR only                                                 | Cross-branch                                       | Onboarding form                                                    | Onboarding record                                | **EXPLICITLY REJECTED**: Out of scope for Desktop Client.                                                              |
| **Shift Check-in / Attendance**  | Attendance RPC / RLS | Attendance transactional RPC                                               | Staff / Device    | Operational                                                     | Branch device                                      | Check-in payload                                                   | Attendance event                                 | **EXPLICITLY REJECTED**: Belongs to the separate Attendance module.                                                    |
| **Schedule / Shift Overrides**   | Schedule RLS         | `staff_schedules` / `schedule_overrides`                                   | Supabase Session  | Manager / CRM                                                   | Own branch                                         | Schedule rows                                                      | Schedule items                                   | **EXPLICITLY REJECTED**: Belongs to the separate Schedule module.                                                      |
| **Payroll / Rates**              | Payroll RLS          | `payroll_settings`                                                         | Owner / HR        | Owner only                                                      | Organization                                       | Compensation data                                                  | Payroll records                                  | **EXPLICITLY REJECTED**: Dormant Payroll module.                                                                       |

---

## 5. Security & Privacy Audit

1. **Branch Isolation Model**:
   - The desktop client operates strictly in the single branch resolved in authenticated desktop context (`authContext.branchId`).
   - Querying with `.eq('branch_id', branchId)` provides workspace result scoping.
   - Authorization is enforced by PostgreSQL RLS (`get_auth_branch_id()`, `get_auth_role()`). The client cannot access data from unassigned branches even if an invalid `branchId` were supplied.
2. **PII & Data Minimization**:
   - Staff roster exposes only operational fields (`full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`).
   - Personal addresses, bank accounts, government IDs, compensation details, and auth credentials do NOT exist in the `public.staff` operational schema.
   - Service capability queries retrieve only `id` and `name`, avoiding pricing or duration leakage.
3. **Privileged Credentials**:
   - Zero Supabase service-role keys in renderer or desktop bundle.
   - All operations execute under the authenticated user's JWT via the accepted `getSupabaseClient()` singleton.
4. **Transport Failure Handling**:
   - Direct PostgREST / Supabase queries return `{ data, error }` results.
   - Failures must fail closed: authentication expiration, RLS permission denial, or network drops render clean error cards with retry options. They must NEVER be mapped to empty roster states.

---

## 6. Scope Boundaries & Explicitly Rejected Scope

The following features are **EXPLICITLY REJECTED** from Stage 04 Desktop:

1. **Attendance Module**: Shift check-ins, dynamic clock-in/out triggers, QR scanning, and device sync belong to the separate **Attendance** module.
2. **Schedule Module**: Recurring shift rules, 90-day override matrix, shift window builders, and blocked-time adjustments belong to the separate **Schedule** module.
3. **Payroll & Finance Modules**: Base rates, commission splits, and cash reconciliation belong to the dormant **Payroll**, **Finance**, and **Reconciliation** modules.
4. **HR & Onboarding Workflow**: `staff_onboarding_requests`, invite link generation, and applicant reviews belong to the web admin portal.
5. **Auth Administration**: Password resets, MFA management, and user creation belong to the administrative web console.

---

## 7. UI State Matrix

| State                                    | Trigger Condition                                                     | Visual / Operational Behavior                                                                                                                                          |
| :--------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Initial Loading**                      | Workspace mount / authenticated branch-context load                   | Renders canonical `bookings-loading-state` skeleton with KPI summary strip, table rows skeleton, and inspector skeleton (`aria-busy="true"`).                          |
| **Populated Success**                    | Authoritative staff query returns >= 1 rows for authorized branch     | Displays truthful KPI summary cards (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`), populated DataGrid table, and auto-selects the first staff member. |
| **Valid Empty Roster**                   | Authoritative query returns valid 0-row result for authorized branch  | Renders KPI strip (all `0`), empty DataGrid card with `"No staff members assigned to this branch"`, and empty inspector prompt.                                        |
| **Search / Filter Zero Matches**         | Local search query or active filter returns 0 matches from loaded set | Displays `"No staff members match the active filters"`, with a `"Reset Filters"` action button. Loaded dataset remains in memory.                                      |
| **Selected Staff Member**                | User clicks DataGrid row or auto-selects on load                      | Highlights row in DataGrid, opens `StaffInspectorCard` showing operational profile, contact details, derived status badge, and assigned service capabilities.          |
| **Selected Staff Disappears on Refetch** | Refetch returns roster where previously selected staff ID is missing  | Clears stale selection, auto-selects the first available staff member (or transitions to empty inspector if roster is empty).                                          |
| **Auth Session Expired**                 | Supabase session missing or JWT expired                               | Sets error state `"Your session has expired. Sign in again to view the staff roster."`, renders canonical `Staff Service Unavailable` alert card.                      |
| **Permission Denied (RLS / Auth)**       | PostgREST error `42501` or authorization mismatch                     | Sets error state `"You do not have permission to view staff for this branch."`, renders canonical `Staff Service Unavailable` alert card.                              |
| **Database / Network Error**             | Network disconnect, query timeout, or PostgREST error                 | Sets error state `"Failed to load staff roster. Please check your connection and try again."`, renders canonical alert card with `"Retry Request"` action button.      |
| **Malformed Response Payload**           | Response fails contract type-guard validator                          | Sets error state `"Staff service returned an invalid data payload."`, renders canonical alert card. Does NOT convert invalid payload into `[]`.                        |

---

## 8. User Action Matrix

| User Action                            | Type        | Supported in Stage 04 | Authorization Rule   | Behavior                                                                                                   |
| :------------------------------------- | :---------- | :-------------------- | :------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Select Staff Member**                | Local State | YES                   | Any operational role | Highlights row and renders member details in `StaffInspectorCard`.                                         |
| **Search Staff (Name/Nickname/Phone)** | Local State | YES                   | Any operational role | Real-time debounced client search over loaded branch roster.                                               |
| **Filter by Role / Type / Status**     | Local State | YES                   | Any operational role | Filters DataGrid rows by `system_role`, `staff_type`, or derived status (`active`, `awaiting`, `invited`). |
| **Sort Staff (Name, Tier, Role)**      | Local State | YES                   | Any operational role | Sorts DataGrid rows by selected column.                                                                    |
| **Refresh Staff Roster**               | Transport   | YES                   | Any operational role | Triggers explicit refetch via toolbar `onRefresh` button.                                                  |
| **Inspect Service Capabilities**       | Read-Only   | YES                   | Any operational role | Renders list of qualified service names for selected staff member in Inspector Services tab.               |
| **Edit Staff Profile**                 | Mutation    | DEFERRED              | Operational roles    | Deferred: Read-only vertical slice prioritized for Stage 04 initial implementation.                        |
| **Assign Services to Staff**           | Mutation    | DEFERRED              | Operational roles    | Deferred: Read-only vertical slice prioritized for Stage 04 initial implementation.                        |
| **Delete / Deactivate Staff**          | Mutation    | OUT OF SCOPE          | N/A                  | Managed via Web Admin portal.                                                                              |
| **Multi-Branch Switching**             | Shell Event | UNAVAILABLE           | N/A                  | Desktop operates strictly within the resolved authenticated branch context.                                |

---

## 9. Proposed Stage 04 Vertical Slice Architecture

Stage 04 Staff will strictly reuse existing accepted desktop infrastructure from Stage 01 (Auth), Stage 02 (Bookings), and Stage 03 (Customers):

1. **Service Layer (`src/lib/staff-service.ts`)**:
   - Reuses accepted `getSupabaseClient()` from `src/lib/supabase.ts`.
   - `fetchBranchStaff(branchId: string)`: Queries `public.staff` with joined `branches` and `staff_services(service_id, services(id, name))` where `branch_id = branchId`, ordered by `tier, full_name`.
   - **Legacy Schema Compatibility Handling**: Stage 04 will first query the current authoritative modern schema (`id, branch_id, auth_user_id, full_name, nickname, phone, avatar_url, tier, system_role, staff_type, is_head, is_active, is_cross_branch, created_at, updated_at, branches(id, name)`). If compatibility fallback behavior is introduced to support legacy database schemas, it must preserve truthful UI semantics, avoid fabricating unverified job functions, and be explicitly tested during the functional implementation build before acceptance.
   - Contract validator type guards (`isStaffMember`, `isStaffServiceCapability`) ensuring malformed data cannot masquerade as valid roster data.
   - Comprehensive error mapping distinguishing session expiry, RLS permission errors, PostgREST errors, and network disconnects.
2. **Components (`src/components/staff/`)**:
   - `StaffView.tsx`: Main workspace coordinating roster state, search/filter debounce, and selected staff ID.
   - `StaffHeader.tsx`: Title, branch context label, search input, and refresh button.
   - `StaffKpiSummary.tsx`: 4 truthful operational metrics matching hosted Staff semantics:
     - **Total Staff**: Count of roster records returned by the branch query.
     - **Active**: Count of staff with `getStaffStatus(member) === "active"`.
     - **Awaiting Approval**: Count of staff with `getStaffStatus(member) === "awaiting"`.
     - **Invites Sent**: Count of staff with `getStaffStatus(member) === "invited"`.
   - `StaffListCard.tsx`: Canonical DataGrid table with columns (Staff Member, Role, Staff Type, Skill Tier, Phone, Status) and active role/type/status filter tabs (`all`, `active`, `awaiting`, `invited`).
   - `StaffInspectorCard.tsx`: Two-tab inspector (Profile, Services) displaying avatar, contact info, derived status badge, and assigned service names.
3. **Shell Integration (`src/components/CanonicalShell.tsx`)**:
   - Mount `StaffView` when `activeModule === 'staff'`.

---

## 10. Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**:
  - `E:\cradlehub` hosted schema, migrations (`20260429000001_core_tables.sql`, `20260430000001_staff_org_structure.sql`, `20260510000004_csr_roles_rls.sql`, `20260617141348_crm_staff_service_capabilities_rpc.sql`, `20260701130415_crm_staff_operational_update_policy.sql`, `20260806132402_service_catalog_unification_repair.sql`), query models (`src/lib/queries/staff.ts`), operational helpers (`src/lib/staff/operational-staff.ts`), and status utilities (`src/components/features/staff/staff-management-utils.ts`, `src/components/features/crm/staff/crm-staff-status-tab.tsx`).
  - Desktop `main` baseline at commit `fb17b71d17d02ca33041e0331ec09a6174aad9a4` with 192 passing unit/integration tests across 11 test files.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - None for Stage 04 yet (Functional implementation not yet started).

---

## 11. Verification & Checks Record

### A. Current Correction Pre-Commit Validation

The following checks were executed against the final documentation working tree immediately before commit. No source files changed in the subsequent commit operation:

- `pnpm format:check` — **PASSED** (all files match Prettier style)
- `pnpm lint` — **PASSED** (0 errors, 0 warnings across all files)
- `pnpm typecheck` — **PASSED** (`tsc --noEmit` clean)
- `pnpm test` — **PASSED** (11 test files, 192/192 vitest tests passed)
- `pnpm build` — **PASSED** (Vite production bundle built cleanly)
- `git diff --check` — **PASSED** (0 whitespace / conflict errors)

### B. Previously Recorded Stage 04 Checks (Historical within Stage 04)

- `cargo fmt --check` — **PASSED**
- `cargo clippy -- -D warnings` — **PASSED**
- `cargo test` — **PASSED**

_(Executed during initial audit checkpoint `2ad6b23357bcf49d1224a34e3cf4219c2122359f` and not rerun for docs-only precision corrections)._

---

## 12. Security & Data Impact

- **Security Model**: Strict RLS enforcement; client executes queries using authenticated user JWT via singleton client.
- **Data Mutation**: Zero mutations, schema changes, or database migrations in Stage 04.
- **Data Minimization**: Staff capability lookups restricted to `id` and `name`.

---

## 13. Limitations & Rollback Plan

- **Limitations**:
  - Staff management UI is purely read-only in the Stage 04 initial slice. Profile edits, service assignments, and status toggles are deferred.
  - Schedulability and booking availability predicates (`isOperationalStaff()`) are separate from general Staff roster management.
- **Rollback**:
  - `BASE_SHA`: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
  - Rollback command: `git checkout main && git branch -D stage/04-staff`
  - Implementation files modified in this checkpoint: **NONE** (Documentation and evidence precision corrections only).

---

## 14. Hosted Contract Follow-Up

- **Archive / Merge Handling in Staff Management**: In the current hosted codebase, `archived_at` and `merged_into_staff_id` filters are applied in scheduling/availability queries (`isOperationalStaff()`) rather than general CRM Staff-management views (`getStaffByBranchWithBranches`, `getPendingStaffByBranch`). If general Staff management is later updated on hosted to filter archived/merged rows, Stage 04 Desktop will adapt to that updated hosted contract.
