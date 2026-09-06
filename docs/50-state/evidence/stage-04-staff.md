# Stage 04 — Staff Functional Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Functional Build)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **INITIAL_AUDIT_SHA**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`
- **AUDIT_CONFIRMED_SHA**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **UI REFINEMENT GATE — OWNER DESIGN REVIEW REQUIRED**.
- **Stage Authorization**: Stage 04 read-only functional implementation completed. Other modules remain separate or dormant.

---

## 1. Executive Summary & Accomplishments

Stage 04 implements the real, production-oriented, read-only **Staff Workspace** for CradleHub Desktop:

1. **One Canonical UI Design System**: Fully integrated with desktop layout tokens, DataGrid, two-tab Inspector, skeletons, empty states, and alert cards from Stages 01–03.
2. **Single-Branch Desktop Authority**: Reuses the single authenticated branch context from `AuthContext` (`branchId`, `branchName`).
3. **Hosted Staff-Management Roster Authority**: Queries current-branch staff directly via authenticated Supabase client (`.eq('branch_id', branchId)`), returning all branch staff without applying unhosted archive/merge filters.
4. **Distinction from `isOperationalStaff()`**: Honors the separation between general Staff-management roster views and operational booking/scheduling filters.
5. **Authoritative Status Derivation**: Implements `deriveStaffStatus()`, producing strictly `active`, `awaiting`, and `invited` (`"inactive"` is not emitted and excluded from UI filters/badges).
6. **Deterministic Summary Metrics**: Displays 4 KPI cards aligned 1:1 with hosted Staff semantics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
7. **Service Capability Data Minimization**: Capability lookups query only `id` and `name` from `services` via `staff_services(service_id, services(id, name))`.
8. **Strict Read-Only Vertical Slice**: Zero mutation controls (no add, edit, delete, invite, or toggle buttons).
9. **Zero Speculative or Mock Data**: Real database queries, truthful empty states, network error handling, session expiry handling, and permission failure alerts.

---

## 2. Canonical Data Model & Service Architecture

### A. Data Schema (`public.staff` & `public.staff_services`)

- **Primary table**: `public.staff` (fields: `id`, `branch_id`, `auth_user_id`, `full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`, `is_cross_branch`, `created_at`, `updated_at`).
- **Join table**: `public.staff_services` (fields: `service_id`, nested `services(id, name)`).

### B. Service Layer (`src/lib/staff-service.ts`)

- `fetchBranchStaff(branchId, client?)`: Queries branch staff roster, validates payload, extracts minimized service capabilities, derives runtime statuses, and computes KPI metrics.
- `deriveStaffStatus(member)`: Emits `'active'`, `'invited'`, or `'awaiting'`.
- `calculateStaffKpis(roster)`: Derives summary counts.
- `classifyStaffError(err)`: Accurately maps errors to user-friendly messages for session expiry (`401` / `PGRST301`), permission denied (`42501`), network failure, and database error.
- `normalizeStaffMember(row)`: Validates contract types and fails closed on malformed rows.

---

## 3. UI Component Architecture

### A. `src/components/staff/StaffView.tsx`

- Workspace container handling async data lifecycle, version refs for race safety, error state with Retry action, loading skeleton, search/filter state, and selection resilience.

### B. `src/components/staff/StaffHeader.tsx`

- Workspace header displaying "Staff", descriptive subtitle, and accessible Refresh button with spinner.

### C. `src/components/staff/StaffKpiSummary.tsx`

- 4 interactive KPI metric cards (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`) that double as quick status filters.

### D. `src/components/staff/StaffListCard.tsx`

- Dense operational DataGrid table with sortable columns: Staff Member (avatar + legal name + nickname + supervisor badge), Role, Staff Type, Skill Tier, Phone, Status.
- Status filter tabs (`All Staff`, `Active`, `Awaiting Approval`, `Invites Sent`) with badge counts.
- Debounced search toolbar with clear action.
- Truthful empty states for zero branch staff and zero search/filter matches.

### E. `src/components/staff/StaffInspectorCard.tsx`

- Two-tab inspector for selected staff member:
  - **Profile tab**: Full operational identity, access role, job function, skill tier, department supervision, cross-branch dispatch, account claim status, and branch assignment.
  - **Services tab**: Qualified service capability names with clean badge counter and truthful empty state when 0 services are assigned.
  - **No Selection state**: Clean placeholder prompt.

### F. Shell Integration (`src/components/CanonicalShell.tsx`)

- Connected `staff` navigation module to render `StaffView`.

---

## 4. Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**:
  - `E:\cradlehub` hosted schema, migrations, and status utilities at `HOSTED_SHA` (`aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`).
  - Desktop `main` baseline at commit `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
  - 220 passing unit and integration tests across 13 test files in `E:\Cradle-Destop-Client`.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - `OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: None`

---

## 5. Verification & Checks Record

### Current Implementation Validation

- `pnpm format:check` — **PASSED** (all files match Prettier style)
- `pnpm lint` — **PASSED** (0 errors, 0 warnings across all files)
- `pnpm typecheck` — **PASSED** (`tsc --noEmit` clean)
- `pnpm test` — **PASSED** (13 test files, 220/220 vitest tests passed)
- `pnpm build` — **PASSED** (Vite production bundle built cleanly in 1.16s)
- `git diff --check` — **PASSED** (0 whitespace / conflict errors)

### Previously Recorded Cargo Validation (Historical)

- `cargo fmt --check` — **PASSED**
- `cargo clippy -- -D warnings` — **PASSED**
- `cargo test` — **PASSED**

---

## 6. Security & Data Impact

- **Security Model**: Strict RLS enforcement; client executes queries using authenticated user JWT via singleton client.
- **Data Mutation**: Zero mutations, schema changes, or database migrations in Stage 04.
- **Data Minimization**: Staff capability lookups restricted to `id` and `name`.

---

## 7. Limitations & Rollback Plan

- **Limitations**:
  - Staff management UI is purely read-only in the Stage 04 initial slice. Profile edits, service assignments, and status toggles are deferred.
  - Schedulability and booking availability predicates (`isOperationalStaff()`) are separate from general Staff roster management.
- **Rollback**:
  - `BASE_SHA`: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
  - Rollback command: `git checkout main && git branch -D stage/04-staff`
