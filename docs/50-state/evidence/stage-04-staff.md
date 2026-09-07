# Stage 04 — Staff Functional Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Functional Correction)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **INITIAL_AUDIT_SHA**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`
- **AUDIT_CONFIRMED_SHA**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`
- **CORRECTION_START_SHA**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 04 FUNCTIONAL CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage Authorization**: Stage 04 read-only functional correction completed. Other modules remain separate or dormant.

---

## 1. Executive Summary & Accomplishments

Stage 04 implements the real, production-oriented, read-only **Staff Workspace** for CradleHub Desktop:

1. **One Canonical UI Design System**: Fully integrated with desktop layout tokens, DataGrid, two-tab Inspector, skeletons, empty states, and alert cards from Stages 01–03.
2. **Single-Branch Desktop Authority**: Reuses the single authenticated branch context from `AuthContext` (`branchId`, `branchName`).
3. **Hosted Staff-Management Roster Authority**: Queries current-branch staff directly via authenticated Supabase client (`.eq('branch_id', branchId)`), returning all branch staff without applying unhosted archive/merge filters.
4. **Distinction from `isOperationalStaff()`**: Honors the separation between general Staff-management roster views and operational booking/scheduling filters.
5. **Authoritative Status Derivation**: Implements `deriveStaffStatus()`, producing strictly `active`, `awaiting`, and `invited` (`"inactive"` is not emitted and excluded from UI filters/badges).
6. **Deterministic Summary Metrics**: Displays 4 KPI cards aligned 1:1 with hosted Staff semantics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`). Active subtext is truthfully phrased as `"Active branch staff"`.
7. **Strict Payload & Capability Validation (No Fabricated Business Truth)**:
   - `normalizeStaffMember` validates all required modern schema fields (`id`, `branch_id`, `auth_user_id`, `full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`, `is_cross_branch`, `created_at`, `updated_at`, `staff_services`).
   - Does NOT fabricate default business values (`therapist`, `mid`, `staff`, `false`) on missing/malformed modern fields; fails closed with `INVALID_PAYLOAD`.
   - `extractCapabilities` validates nested relations and fails closed on corrupted data without fabricating `"Unnamed Service"`. Accepts valid empty capability arrays.
   - Strictly validates branch invariant (`obj.branch_id === expectedBranchId`).
8. **Selection Coherence**:
   - Preserves selected Staff if still visible.
   - If selected Staff is excluded by active filter or search and visible results remain, selects the first visible result.
   - If zero visible results remain, clears the inspector selection (`No Staff Selected`).
   - Never displays an inspector for a staff member absent from the visible result set.
9. **Truthful Business Terminology**:
   - Department supervision renders neutral `"Department Head"` (for `is_head === true`) and `"Not a department head"` (for `is_head === false`), avoiding universal `"Head Therapist"` or `"Standard Provider"` misnomers.
   - Tier label renders neutral `"Skill Tier"`.
   - Cross-branch label renders neutral `"Cross-Branch Eligibility"`.
   - Account login link renders human status (`"Account linked"` / `"Not linked"`) without displaying raw `auth_user_id` UUID strings.
10. **Keyboard Accessibility**:
    - Table column headers retain semantic `<th>` with keyboard-operable `<button type="button" className="th-sort-btn">` and `aria-sort` state (`ascending`, `descending`, `none`).
    - KPI cards render as accessible `<button type="button">` elements with `aria-pressed` state when interactive.
11. **Responsive Local Search**: Immediate responsive client-side filtering over the loaded roster without artificial network delays or debounces.
12. **Strict Read-Only Vertical Slice**: Zero mutation controls (no add, edit, delete, invite, or toggle buttons).

---

## 2. Canonical Data Model & Service Architecture

### A. Data Schema (`public.staff` & `public.staff_services`)

- **Primary table**: `public.staff` (fields: `id`, `branch_id`, `auth_user_id`, `full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`, `is_cross_branch`, `created_at`, `updated_at`).
- **Join table**: `public.staff_services` (fields: `service_id`, nested `services(id, name)`).

### B. Service Layer (`src/lib/staff-service.ts`)

- `fetchBranchStaff(branchId, client?)`: Queries branch staff roster, validates payload strictly against modern schema, extracts minimized service capabilities, derives runtime statuses, and computes KPI metrics.
- `deriveStaffStatus(member)`: Emits `'active'`, `'invited'`, or `'awaiting'`.
- `calculateStaffKpis(roster)`: Derives summary counts.
- `classifyStaffError(err)`: Accurately maps errors to user-friendly messages for session expiry (`401` / `PGRST301`), permission denied (`42501`), network failure, and database error.
- `normalizeStaffMember(row, expectedBranchId?)`: Validates contract types, verifies branch invariant, and fails closed on malformed rows without fabricating defaults.
- `extractCapabilities(rawServices)`: Validates nested relationship shape; returns `null` on corruption and `[]` for valid empty capability sets.

---

## 3. UI Component Architecture

### A. `src/components/staff/StaffView.tsx`

- Workspace container handling async data lifecycle, version refs for race safety, error state with Retry action, loading skeleton, search/filter state, and selection coherence synchronization.

### B. `src/components/staff/StaffHeader.tsx`

- Workspace header displaying "Staff", descriptive subtitle, and accessible Refresh button with spinner.

### C. `src/components/staff/StaffKpiSummary.tsx`

- 4 interactive KPI metric buttons (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`) with accessible `aria-pressed` selection states that double as quick status filters.

### D. `src/components/staff/StaffListCard.tsx`

- Dense operational DataGrid table with keyboard-sortable headers (`th-sort-btn` with `aria-sort`): Staff Member (avatar + legal name + nickname + supervisor badge), Role, Staff Type, Skill Tier, Phone, Status.
- Status filter tabs (`All Staff`, `Active`, `Awaiting Approval`, `Invites Sent`) with badge counts.
- Responsive client-side search toolbar with clear action.
- Truthful empty states for zero branch staff (`"No staff members are assigned to this branch."`) and zero search/filter matches.

### E. `src/components/staff/StaffInspectorCard.tsx`

- Two-tab inspector for selected staff member:
  - **Profile tab**: Full operational identity, access role, job function, skill tier, department supervision (`Department Head` / `Not a department head`), cross-branch eligibility, human account linkage state (`Account linked` / `Not linked`), and branch assignment.
  - **Services tab**: Qualified service capability names with clean badge counter and truthful empty state when 0 services are assigned.
  - **No Selection state**: Clean placeholder prompt (`No Staff Selected`).

### F. Shell Integration (`src/components/CanonicalShell.tsx`)

- Connected `staff` navigation module to render `StaffView`.

---

## 4. Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**:
  - `E:\cradlehub` hosted schema, migrations, and status utilities at `HOSTED_SHA` (`aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`).
  - Desktop `main` baseline at commit `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
  - 232 passing unit and integration tests across 13 test files in `E:\Cradle-Destop-Client`.
- **RUNTIME / VIEWPORT EVIDENCE**:
  - `1440×900 — NOT RUNTIME-OBSERVED IN THIS CORRECTION`
  - `1366×768 — NOT RUNTIME-OBSERVED IN THIS CORRECTION`
  - `1024×768 — NOT RUNTIME-OBSERVED IN THIS CORRECTION`
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - `OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: None`

---

## 5. Verification & Checks Record

### Current Implementation Validation

- `pnpm format:check` — **PASSED** (all files match Prettier style)
- `pnpm lint` — **PASSED** (0 errors, 0 warnings across all files)
- `pnpm typecheck` — **PASSED** (`tsc --noEmit` clean)
- `pnpm test` — **PASSED** (13 test files, 232/232 vitest tests passed)
- `pnpm build` — **PASSED**
- `git diff --check` — **PASSED** (0 whitespace / conflict errors)

---

## 6. Security & Data Impact

- **Security Model**: Strict RLS enforcement; client executes queries using authenticated user JWT via singleton client.
- **Data Mutation**: Zero mutations, schema changes, or database migrations in Stage 04.
- **Data Minimization**: Staff capability lookups restricted to `id` and `name`. Raw UUID identifiers omitted from inspector UI.

---

## 7. Limitations & Rollback Plan

- **Limitations**:
  - Staff management UI is purely read-only in the Stage 04 slice. Profile edits, service assignments, and status toggles are deferred.
  - Schedulability and booking availability predicates (`isOperationalStaff()`) remain separate from general Staff roster management.
- **Rollback**:
  - `BASE_SHA`: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
  - Rollback command: `git checkout main && git branch -D stage/04-staff`
