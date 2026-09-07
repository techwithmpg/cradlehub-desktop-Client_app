# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff) is **ACCEPTED / MERGED / CLOSED** on `main`.

- **Accepted Pre-Merge Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Accepted Stage 04 Branch Tip**: `34096a5b7faef05e4faa9379c845aec812d7136c` on `stage/04-staff`.
- **Implementation Geometry Commit (IMPLEMENTATION_HEAD_SHA)**: `a7dcd763f86ae284ecc4370405897c58f92c45bf`.
- **Merge Method**: Fast-forward merge of `stage/04-staff` into `main`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Staff Management Workspace Deliverables**:
  - Full-Width DataGrids: Consuming canonical `bookings-table` across Roster, Applications, Capabilities, Roles, and Schedule views.
  - Column Distribution: Proportional colgroups spanning 100% of the available management card width.
  - Text Truncation Safety: Applied `min-width: 0` and ellipsis truncation on long staff names to prevent table distortion.
  - Persistent Outer Surfaces: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` remain mounted across all 6 tabs without DOM destruction or layout jumps.
  - Sibling Inspector: `StaffContextInspector` is a direct child of `.bookings-inspector-column` (sibling to the left card through the outer grid) with independent height and stable geometry.
- **Post-Merge Verification Baseline on `main`**:
  - 272 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.
- **Next Authorized Architectural Work**: Canonical Module Body / Workspace extraction — NOT STARTED.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
