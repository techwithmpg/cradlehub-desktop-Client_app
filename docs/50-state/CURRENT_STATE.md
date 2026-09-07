# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 PERSISTENT STAFF WORKSPACE FRAME READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Complete Stage 04 Staff Management Workspace Persistent Workspace Frame corrected to prove the persistent module frame architecture matching Bookings before universal module-body extraction.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `588669b26b6424009536b2184ef256c59c3238bc`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Staff Management Workspace Deliverables**:
  - Persistent Outer Frame: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` remain mounted across all 6 tabs without DOM destruction or layout jumps.
  - Sibling Inspector: `StaffContextInspector` is a direct child of `.bookings-inspector-column` (sibling to the left card through the outer grid) with independent height and stable geometry.
  - Persistent Summary: Real authoritative summary metrics rendered inside the persistent summary frame for all 6 tabs (Roster, Schedule, Applications, Capabilities, Roles, Performance).
  - Selection Coherence: `selectedStaffId` preserved across staff-centric tabs; `selectedApplicationId` isolated for Applications tab.
  - Closed Selection: Inspector card remains mounted with canonical empty state on selection close.
  - Content-Only Child Components: Child views render only toolbar, table/body, and pagination inside the persistent left card.
- **Verification Baseline**:
  - 271 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
