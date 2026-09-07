# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 STAFF FULL-WIDTH DATAGRID CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Stage 04 Staff Management Workspace DataGrids corrected to naturally consume full available left card width using canonical `bookings-table` styling and proportional colgroups across all Staff views.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Frame Correction SHA (FRAME_CORRECTION_SHA)**: `d15ff7964d62e185e1aba9600c6f3350b097de4f`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Staff Management Workspace Deliverables**:
  - Full-Width DataGrids: Replaced orphaned `bookings-datagrid` with canonical `bookings-table` across Roster, Applications, Capabilities, Roles, and Schedule views.
  - Column Distribution: Applied proportional colgroups (Staff Member 44%, Role/Function 28%, Status 17%, Action 11% on Roster) to span full card width cleanly.
  - Text Truncation Safety: Applied `min-width: 0` and ellipsis truncation on long staff names to prevent table distortion.
  - Persistent Outer Surfaces Preserved: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` remain mounted across all 6 tabs without DOM destruction or layout jumps.
  - Sibling Inspector: `StaffContextInspector` is a direct child of `.bookings-inspector-column` (sibling to the left card through the outer grid) with independent height and stable geometry.
- **Verification Baseline**:
  - 272 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
