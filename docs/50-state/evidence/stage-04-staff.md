# Stage 04 — Staff Workspace Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 04 — Staff (Staff Management Workspace)
- **Branch**: `stage/04-staff`
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`
- **AUDIT_CONFIRMED_SHA**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`
- **PREVIOUS_FUNCTIONAL_SHA**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`
- **CORRECTION_START_SHA**: `588669b26b6424009536b2184ef256c59c3238bc`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 04 PERSISTENT STAFF WORKSPACE FRAME READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage Authorization**: Owner-authorized Stage 04 Staff Management Workspace Persistent Workspace Frame correction.

---

## 1. Executive Summary & Persistent Workspace Frame Architecture

The Stage 04 Staff Management Workspace has been refactored to prove the persistent module frame architecture mirroring Bookings:

1. **Persistent Outer Surfaces (Zero DOM Reconstruction across 6 Tabs)**:
   - `StaffHeader`: Outer header container with title, subtitle, refresh button, and canonical `Add Staff` primary action.
   - `StaffSummaryCard`: Persistent KPI summary container mounted across all 6 views (`Staff Roster`, `Schedule View`, `Applications`, `Performance`, `Capabilities & Services`, `Roles & Permissions`), updating only internal derived metrics.
   - `.bookings-main-grid.staff-main-grid`: Outer 2-column grid owning the layout structure.
   - Left Column (`.bookings-list-column`): Mounts one persistent `.bookings-list-card.staff-management-card` containing in-card scope tabs, active toolbar, active body, and footer.
   - Right Column (`.bookings-inspector-column`): Mounts one persistent `StaffContextInspector` (`data-testid="staff-context-inspector"`) sibling to the left card (independent height, not locked inside the left card).

2. **Truthful Tab-Specific Summary Metrics**:
   - **Staff Roster**: Total Staff, Active, Awaiting Approval, Invites Sent.
   - **Applications**: Total Applications, Pending Review, Approved, Rejected (from loaded `onboardingRequests`).
   - **Capabilities & Services**: Total Staff, With Capabilities, Without Capabilities, Total Capability Assignments (derived from loaded staff service relations).
   - **Roles & Permissions**: Total Staff, Linked Accounts (`auth_user_id`), Unlinked Accounts, Department Heads (`is_head`).
   - **Schedule View**: Staff in view, Overrides this week, Blocked times this week, Selected Week (from actual schedule response).
   - **Performance**: Same-frame truthful message ("Performance metrics are not available in the current Staff contract.").

3. **Persistent Contextual Inspector**:
   - One outer inspector card wrapper remains mounted across all tab changes and when closing selection.
   - Contextual inner panels:
     - Roster: Status, Identity, Overview / Services / Access tabs, Profile Editing, Quick Actions.
     - Schedule: Identity, Today's schedule state, This-week summary, Schedule modals.
     - Applications: Applicant review context, Status, Contact, Role, Experience, Application Actions.
     - Capabilities: Identity, Staff Type, Assignment count, Capabilities preview, Manage Capabilities modal.
     - Roles: Identity, System Role, Account Linkage, Department Head state, Manage Role modal.
     - Performance: Truthful empty state message inside the persistent frame.
   - Closing inspector selection leaves the persistent inspector shell mounted with canonical empty state ("No Staff Selected" / "No Application Selected").

4. **Selection Coherence & State Isolation**:
   - `selectedStaffId` persists across all staff-centric tabs (`roster`, `schedule`, `capabilities`, `roles`, `performance`).
   - `selectedApplicationId` is isolated for the `applications` tab. Switching to Applications and selecting an applicant does not destroy the previously selected staff member.

5. **Content-Only Child Components**:
   - Child components (`StaffScheduleContent`, `StaffApplicationsContent`, `StaffCapabilitiesContent`, `StaffRolesContent`, `StaffPerformanceContent`) render only the left-column toolbar, body table/calendar, and pagination.

---

## 2. Verification Record

- `pnpm format:check` — PASSED (Prettier clean across all files)
- `pnpm lint` — PASSED (0 errors, 0 warnings across all files)
- `pnpm typecheck` — PASSED (`tsc --noEmit` clean)
- `pnpm test` — PASSED (13 test files, 271/271 vitest tests passed)
- `pnpm build` — PASSED (Vite production build clean in 1.23s)
- `git diff --check` — PASSED (0 whitespace / conflict errors)
