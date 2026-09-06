# Stage 04 — Staff Audit & Discovery Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Audit & Architecture Checkpoint)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **Audit HEAD**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 04 AUDIT READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage 04 Functional UI Implementation**: **NOT YET STARTED / AWAITING CHECKPOINT REVIEW**.
- **Stage 05+**: **NOT AUTHORIZED**.

---

## 1. Executive Summary & Purpose

This checkpoint establishes the authoritative data contract, security boundaries, role permissions, and UI structure for the **Stage 04 Staff** module before writing functional UI code.

The desktop client must integrate with the hosted database and application contracts while maintaining strict adherence to:

1. One canonical UI design system (reusing Bookings/Customers desktop architecture).
2. Branch isolation enforced by PostgreSQL Row Level Security (RLS) and user session claims.
3. Zero renderer direct mutations to dormant or cross-module boundaries (Payroll, Attendance, Schedule, Auth Administration).
4. No fake or speculative local fallback data.

---

## 2. Canonical Hosted Staff Contract Discovery

Inspection of hosted `techwithmpg/Cradlehub` at `HOSTED_SHA` (`aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`) identified the authoritative data sources and contracts:

### A. Primary Data Model (`public.staff`)

| Column                 | Type          | Nullable | Description & Domain Semantics                                                                                                                                                 |
| :--------------------- | :------------ | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `uuid`        | NO       | Primary key for staff member.                                                                                                                                                  |
| `branch_id`            | `uuid`        | NO       | Primary branch assignment. Foreign key to `public.branches(id)`.                                                                                                               |
| `auth_user_id`         | `uuid`        | YES      | Links to Supabase Auth (`auth.users.id`). `NULL` if staff has no login credentials.                                                                                            |
| `full_name`            | `text`        | NO       | Legal / formal staff name.                                                                                                                                                     |
| `nickname`             | `text`        | YES      | Operational name known to front desk and customers. Display fallback if present.                                                                                               |
| `phone`                | `text`        | YES      | Contact phone number for operational dispatch and notifications.                                                                                                               |
| `avatar_url`           | `text`        | YES      | Public URL or Supabase storage path to profile image.                                                                                                                          |
| `tier`                 | `text`        | NO       | Therapist skill tier: `'senior'`, `'mid'`, `'junior'`. (Default `'mid'`).                                                                                                      |
| `system_role`          | `text`        | NO       | Canonical app access role: `'owner'`, `'manager'`, `'assistant_manager'`, `'store_manager'`, `'crm'`, `'staff'`, `'service_head'`, `'service_staff'`, `'driver'`, `'utility'`. |
| `staff_type`           | `text`        | NO       | Real-world job function: `'therapist'`, `'csr'`, `'nail_tech'`, `'aesthetician'`, `'driver'`, `'utility'`, `'managerial'`, `'salon_head'`.                                     |
| `is_head`              | `boolean`     | NO       | Department head / lead therapist supervisor flag. (Default `false`).                                                                                                           |
| `is_active`            | `boolean`     | NO       | Operational status. `false` indicates inactive/deactivated/pending staff.                                                                                                      |
| `is_cross_branch`      | `boolean`     | NO       | Flag indicating if staff can take shifts/appointments at other branches.                                                                                                       |
| `archived_at`          | `timestamptz` | YES      | Soft-delete timestamp. `NULL` for active roster members.                                                                                                                       |
| `merged_into_staff_id` | `uuid`        | YES      | Pointer if duplicate record was merged. Excluded from active roster.                                                                                                           |
| `created_at`           | `timestamptz` | NO       | Creation timestamp.                                                                                                                                                            |
| `updated_at`           | `timestamptz` | NO       | Last update timestamp.                                                                                                                                                         |

### B. Secondary Data Model (`public.staff_services`)

| Column       | Type          | Nullable | Description                                                                                      |
| :----------- | :------------ | :------- | :----------------------------------------------------------------------------------------------- |
| `staff_id`   | `uuid`        | NO       | Foreign key to `public.staff(id)`.                                                               |
| `service_id` | `uuid`        | NO       | Foreign key to `public.services(id)`. Identifies services this provider is qualified to perform. |
| `created_at` | `timestamptz` | YES      | Assignment timestamp.                                                                            |

---

## 3. Authorization & Row Level Security (RLS)

All database reads and writes execute under the authenticated user's Supabase session. RLS policies in the database enforce the following rules:

1. **SELECT (`staff_operational_read_branch` & `staff_manager_read_branch`)**:
   - `crm`, `assistant_manager`, `store_manager`, `manager`: Permitted to `SELECT` all staff where `branch_id = get_auth_branch_id()`.
   - `owner`: Permitted to `SELECT` all staff across all branches (`staff_owner_all`).
   - `staff`: Permitted to `SELECT` only their own staff record (`staff_read_own`).
2. **UPDATE (`staff_operational_update_branch`)**:
   - Operational roles (`crm`, `manager`, `assistant_manager`, `store_manager`) can update `full_name`, `nickname`, `phone`, `tier`, `staff_type`, `is_head`, `is_active` for non-management staff within their own branch (`branch_id = get_auth_branch_id()` and `system_role NOT IN ('owner', 'manager', 'assistant_manager', 'store_manager')`).
3. **STAFF SERVICES (`staff_services_operational_all`)**:
   - Operational roles can `SELECT`, `INSERT`, and `DELETE` on `public.staff_services` for staff belonging to their assigned branch.

---

## 4. Authoritative Contract Matrix

| Operation                          | Authority         | Mechanism                                                                                           | Auth Required                | Role Scope                                                      | Branch Scope                                       | Request Shape                                                                      | Response Shape                                                        | Desktop Implication                                                                  |
| :--------------------------------- | :---------------- | :-------------------------------------------------------------------------------------------------- | :--------------------------- | :-------------------------------------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Fetch Branch Staff Roster**      | Database RLS      | `supabase.from('staff').select(...)`                                                                | Supabase Session             | `crm`, `manager`, `owner`, `assistant_manager`, `store_manager` | Branch-Scoped (`branch_id = authContext.branchId`) | `branch_id: string`, order by `tier, full_name`                                    | Array of `StaffMemberRow` with joined `branches` and `staff_services` | Direct authenticated Supabase client query matching Bookings/Options pattern.        |
| **Fetch Staff Capabilities**       | Database RLS      | `supabase.from('staff_services').select('service_id, services(id, name, duration_minutes, price)')` | Supabase Session             | Operational roles                                               | Branch staff only                                  | `staff_id: string`                                                                 | Array of assigned service objects                                     | Rendered inside the Staff Inspector panel.                                           |
| **Search / Filter Staff**          | Client / Supabase | Query params / Client memory                                                                        | Supabase Session             | Operational roles                                               | Current branch                                     | `q: string`, `role: string`, `status: string`, `staffType: string`                 | Filtered list                                                         | Real-time search by name, nickname, or phone; filter by role/type/status.            |
| **Staff Profile Update**           | Database RLS      | `supabase.from('staff').update(...)`                                                                | Supabase Session             | Manager / CRM                                                   | Own branch, non-owner staff                        | Profile fields (`nickname`, `phone`, `tier`, `staff_type`, `is_head`, `is_active`) | Updated row                                                           | Phase 2 mutation; read-only vertical slice prioritized for Stage 04 initial release. |
| **Onboarding / Invite Requests**   | Hosted Admin      | Server Action / Admin API                                                                           | Admin Service Role           | Owner / HR Manager only                                         | Cross-branch                                       | Onboarding form payload                                                            | Request record                                                        | **REJECTED**: Out of scope for Desktop Front Desk.                                   |
| **Shift Check-in / QR Attendance** | Database RPC      | `attendance_transactional_scan`                                                                     | Authenticated Staff / Device | Operational                                                     | Branch device                                      | QR Token / Staff ID                                                                | Attendance event                                                      | **REJECTED**: Belongs to Stage 05 (Attendance).                                      |
| **Schedule / Window Overrides**    | Database RLS      | `staff_schedules` / `schedule_overrides`                                                            | Supabase Session             | Manager / CRM                                                   | Own branch                                         | Schedule rows                                                                      | Schedule items                                                        | **REJECTED**: Belongs to Stage 06 (Schedule).                                        |
| **Payroll / Rates / Compensation** | Database RLS      | `payroll_settings`                                                                                  | Owner / HR                   | Owner only                                                      | Organization                                       | Salary data                                                                        | Payroll records                                                       | **REJECTED**: Dormant Payroll module.                                                |

---

## 5. Security & Privacy Audit

1. **Branch Isolation**: The desktop client must pass `branch_id = authContext.branchId` and rely on database RLS. Renderer cannot forge access to other branches.
2. **PII & Data Minimization**:
   - Staff data exposes only operational fields (`full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`).
   - Personal addresses, bank accounts, government IDs, payroll rates, and auth passwords do NOT exist in the `public.staff` operational schema.
3. **Privileged Credentials**: Zero Supabase service-role keys in renderer. All operations execute under the authenticated user's JWT.
4. **Failure Behavior**: If authentication is missing, expired, or rejected, the Staff workspace fails closed and renders `Customer Service Unavailable` / `Staff Service Unavailable` with clean error boundaries.

---

## 6. Scope Collisions & Explicitly Rejected Scope

The following features found in the hosted repository are **EXPLICITLY REJECTED** from Stage 04 Desktop:

1. **Attendance System**: Shift check-in logs, dynamic clock-in/out triggers, QR verification, and device sync belong to the upcoming **Attendance** module.
2. **Schedule & Shift Editor**: Weekly recurring rules, 90-day override matrix, shift window builders, and blocked-time adjustments belong to the upcoming **Schedule** module.
3. **Payroll & Compensation**: Base rates, commission splits, and cash reconciliation belong to the dormant **Payroll** and **Reconciliation** modules.
4. **HR & Onboarding Workflow**: `staff_onboarding_requests`, invite generation, email verification links, and applicant reviews belong to the web admin portal.
5. **Auth Account Management**: Password reset links, MFA administration, and Supabase Auth user creation belong to the administrative web console.

---

## 7. UI State Matrix

| State                          | Trigger Condition                        | Visual / Operational Behavior                                                                                                                              |
| :----------------------------- | :--------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Initial Loading**            | Workspace mount or branch switch         | Renders canonical `bookings-loading-state` skeleton with KPI bar, table skeleton, and inspector skeleton. `aria-busy="true"`.                              |
| **Populated Success**          | Valid staff records returned for branch  | Displays truthful KPI summary cards, populated DataGrid table, and auto-selects the first staff member in the Inspector card.                              |
| **Valid Empty Roster**         | Branch has 0 active/pending staff        | Renders KPI strip (all `0`), empty table card with `"No staff members assigned to this branch"`, and empty inspector prompt.                               |
| **Search / Filter No Matches** | Active query or filter returns 0 matches | Displays search query, `"No staff members match the active filters"`, with a `"Reset Filters"` action button.                                              |
| **Selected Staff Member**      | User clicks table row or auto-selects    | Highlights row in DataGrid, opens `StaffInspectorCard` showing full operational profile, badges, contact details, and service capabilities.                |
| **Auth Session Expired (401)** | Missing/expired access token             | Sets `listError = "Your session has expired. Sign in again to view staff roster."`, renders canonical `Staff Service Unavailable` alert card.              |
| **Permission Denied (403)**    | Role not authorized for branch           | Sets `listError = "You do not have permission to view staff for this branch."`, renders canonical `Staff Service Unavailable` alert card.                  |
| **Database / Network Failure** | Connection drop or Postgres error        | Sets `listError = "Failed to load staff roster. Please check your connection and try again."`, renders canonical alert card with `"Retry Request"` button. |

---

## 8. User Action Matrix

| User Action                            | Type          | Supported in Stage 04 | Authorization Rule   | Behavior                                                                |
| :------------------------------------- | :------------ | :-------------------- | :------------------- | :---------------------------------------------------------------------- |
| **Select Staff Member**                | Local State   | YES                   | Any operational role | Displays member details in `StaffInspectorCard`.                        |
| **Search Staff (Name/Nickname/Phone)** | Local / Query | YES                   | Any operational role | Real-time debounced client/query search.                                |
| **Filter by Role / Type / Status**     | Local / Query | YES                   | Any operational role | Filters DataGrid rows by `system_role`, `staff_type`, or active status. |
| **Sort Staff (Name, Tier, Role)**      | Local         | YES                   | Any operational role | Sorts DataGrid column order.                                            |
| **Refresh Staff Roster**               | Query         | YES                   | Any operational role | Triggers explicit refetch via `onRefresh` button.                       |
| **Switch Authorized Branch**           | Shell Event   | YES                   | Multi-branch users   | Re-fetches staff roster scoped to the newly selected branch.            |
| **Inspect Service Capabilities**       | Read-Only     | YES                   | Any operational role | Shows list of assignable services for selected provider.                |
| **Edit Staff Profile**                 | Mutation      | Deferred (Phase 2)    | Manager / Owner      | Planned for Stage 04 Phase 2 after read vertical slice is accepted.     |
| **Assign Services to Staff**           | Mutation      | Deferred (Phase 2)    | Manager / Owner      | Planned for Stage 04 Phase 2.                                           |
| **Delete / Deactivate Staff**          | Destructive   | NO                    | Out of Scope         | Managed via Web Admin.                                                  |

---

## 9. Proposed Stage 04 Vertical Slice Architecture

To guarantee consistency, reliability, and security, Stage 04 Staff will follow the exact architectural patterns established in Stage 01 (Auth), Stage 02 (Bookings), and Stage 03 (Customers):

1. **Service Layer (`src/lib/staff-service.ts`)**:
   - `fetchBranchStaff(branchId: string)`: Queries `public.staff` with joined `branches` and `staff_services(service_id, services(id, name, duration_minutes, price))`.
   - Contract validator type guards (`isStaffMember`, `isStaffServiceCapability`) ensuring malformed responses cannot masquerade as valid roster data.
   - Comprehensive error mapping distinguishing network errors, session expiry, and permission errors.
2. **Components (`src/components/staff/`)**:
   - `StaffView.tsx`: Main workspace coordinating roster state, search/filter debounce, and selection.
   - `StaffHeader.tsx`: Title, branch context, search bar, and refresh control.
   - `StaffKpiSummary.tsx`: 4 truthful operational metrics:
     - **Total Staff**: Count of roster members at branch.
     - **Active Providers**: Count of active therapists, nail techs, aestheticians.
     - **Support & Front Desk**: Count of CSR, utility, driver staff.
     - **Department Heads**: Count of supervisors / service leads (`is_head = true`).
   - `StaffListCard.tsx`: Canonical DataGrid with columns (Staff Member, Role, Staff Type, Skill Tier, Phone, Status) and active tab/filter controls.
   - `StaffInspectorCard.tsx`: Two-tab inspector (Profile, Services) displaying avatar, contact info, assigned services, and operational metadata.
3. **Shell Integration (`src/components/CanonicalShell.tsx`)**:
   - Mount `StaffView` when `activeModule === 'staff'`.

---

## 10. Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**:
  - `E:\cradlehub` hosted schema, migrations (`20260429000001_core_tables.sql`, `20260701130406_normalize_front_desk_crm_roles.sql`, `20260701130415_crm_staff_operational_update_policy.sql`), and query models (`src/lib/queries/staff.ts`).
  - Desktop `main` baseline at commit `fb17b71d17d02ca33041e0331ec09a6174aad9a4` with 192 passing unit/integration tests across 11 test files.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - None for Stage 04 yet (Functional implementation not yet started).

---

## 11. Rollback & Preflight Plan

- `BASE_SHA`: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- Rollback command: `git checkout main && git branch -D stage/04-staff`
- Implementation files modified in this checkpoint: **NONE** (Documentation and audit only).
