# Stage 04 — Staff Workspace Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Staff Management Workspace)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **AUDIT_CONFIRMED_SHA**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`
- **PREVIOUS_FUNCTIONAL_SHA**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`
- **CORRECTION_START_SHA**: `18cfecdd82ba8de0611725113353da94b0defced`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 04 STAFF MANAGEMENT WORKSPACE READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage Authorization**: Owner-authorized Stage 04 Staff Management Workspace rebuilt mirroring Bookings layout and interaction architecture.

---

## 1. Executive Summary & Architecture

The Stage 04 Staff Management Workspace provides a comprehensive, production-grade operational system mirroring the Bookings module architecture:

1. **Six Primary Module Tabs**:
   - `Staff Roster` (Default operational list with dense DataGrid, multi-facet filter toolbar, secondary status tabs, and 390-420px inspector).
   - `Schedule View` (7-day Monday-to-Sunday weekly grid displaying shifts, blocked times, and quick adjustments).
   - `Applications` (Onboarding queue with quick review, reject, and canonical configuration modal).
   - `Performance` (Contract-backed truthful unavailable state: _"Performance metrics are not available in the current Staff data contract."_).
   - `Capabilities & Services` (Matrix view mapping staff to assigned branch service capabilities).
   - `Roles & Permissions` (System governance table with role update workflows).
   - **Documents**: Strictly out of scope (no documents tab, models, or placeholder UI).

2. **Bookings-Mirroring Staff Roster Layout**:
   - **KPI Summary Strip**: Total Staff, Active Staff, Awaiting Approval, Invites Sent with truthful subtext.
   - **Secondary Status Scope Filter**: `All Staff`, `Active`, `Awaiting Approval`, `Invites Sent`.
   - **Multi-Facet Filter Toolbar**: Search input, Staff Type select, System Role select, Capability select, and Reset button.
   - **Dense DataGrid**: Status pill, avatar/name/nickname, staff type, skill tier (`—` for non-tier), role, head tag, and capabilities counter.
   - **Bookings-Identical Pagination**: Rows per page selector (10/25/50), start/end record counters, and prev/next page buttons.

3. **Staff Inspector (390–420px Width)**:
   - Header with avatar, full name, nickname, type, tier, head badge, and status pill.
   - Quick action button bar: Edit Profile, Manage Schedule, Capabilities, Change Role, and Offboard.
   - Internal Sub-Tabs: `Profile` (contact, identifiers, bio, controlled inline edit form), `Services` (assigned service capability list), and `Access` (system role, cross-branch eligibility, login status).

4. **Canonical Modal Family**:
   - `StaffCapabilityModal`: Capability selection backed by `replace_staff_service_capabilities` RPC.
   - `StaffScheduleModal`: Working hours, day off, blocked time adjustments (`schedule_overrides` / `blocked_times`).
   - `StaffRoleModal`: Role change modal enforcing Owner-only elevation rules.
   - `StaffApplicationApprovalModal`: Configurable staff type, role, tier, and service assignment for incoming applicants.
   - `StaffAddGuidanceModal`: Standard operational guidance modal directing owners to the public onboarding portal.
   - `StaffOffboardingNoticeModal`: Truthful offboarding gate stating `OFFBOARDING CONTRACT REQUIRED`.

5. **Security & Data Integrity**:
   - Strict Selected-Field Payload Validation in `normalizeStaffMember`.
   - Strict Nested Service Capability & Identity Consistency in `extractCapabilities`.
   - Tier applicability display semantics matching hosted `getStaffDisplayMeta()`.
   - Pure client RLS authorization (no service-role key or admin auth client in renderer).

---

## 2. Verification Record

- `pnpm format:check` — PASSED
- `pnpm lint` — PASSED (0 errors, 0 warnings across all files)
- `pnpm typecheck` — PASSED (`tsc --noEmit` clean)
- `pnpm test` — PASSED (13 test files, 267/267 vitest tests passed)
- `pnpm build` — PASSED (Vite production build clean in 3.03s)
- `git diff --check` — PASSED (0 whitespace / conflict errors)
