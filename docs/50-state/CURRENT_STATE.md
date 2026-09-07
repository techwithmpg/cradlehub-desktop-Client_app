# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 STAFF FINAL EVIDENCE ACCOUNTING READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Complete Stage 04 Staff Management Workspace with full-width DataGrid utilization, persistent frame architecture, and final evidence accounting.

- **Active Branch**: `stage/04-staff`.
- **BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **HEAD_SHA (implementation under review)**: `a7dcd763f86ae284ecc4370405897c58f92c45bf`.
- **INITIAL_AUDIT_SHA**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **AUDIT_CONFIRMED_SHA**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **PREVIOUS_FUNCTIONAL_SHA**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **FRAME_CORRECTION_SHA**: `d15ff7964d62e185e1aba9600c6f3350b097de4f`.
- **IMPLEMENTATION_HEAD_SHA**: `a7dcd763f86ae284ecc4370405897c58f92c45bf`.
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Universal Workspace Status**: NOT STARTED — awaiting Stage 04 acceptance.
- **Staff Management Workspace Deliverables**:
  - Full-Width DataGrids: Replaced orphaned `bookings-datagrid` with canonical `bookings-table` across Roster, Applications, Capabilities, Roles, and Schedule views.
  - Column Distribution: Applied proportional colgroups (Staff Member 44%, Role/Function 28%, Status 17%, Action 11% on Roster) to span full card width cleanly.
  - Text Truncation Safety: Applied `min-width: 0` and ellipsis truncation on long staff names to prevent table distortion.
  - Persistent Outer Surfaces Preserved: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` remain mounted across all 6 tabs without DOM destruction or layout jumps.
  - Sibling Inspector: `StaffContextInspector` is a direct child of `.bookings-inspector-column` (sibling to the left card through the outer grid) with independent height and stable geometry.
- **Previously Recorded Implementation Verification Baseline (`a7dcd763f86ae284ecc4370405897c58f92c45bf`)**:
  - 272 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
