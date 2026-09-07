# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 STAFF BOOKING-SYSTEM UI UNIFICATION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Complete Stage 04 Staff Management Workspace rebuilt and unified with canonical Bookings design tokens, layout hierarchy, and interaction architecture.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `5f2d95b2d7ae9333e6199f0e12df2910f153ddae`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Staff Management Workspace Deliverables**:
  - Six in-card scope tabs: `Staff Roster`, `Schedule View`, `Applications`, `Performance`, `Capabilities & Services`, `Roles & Permissions` (rendered directly inside `.bookings-scope-tabs-container`, replacing standalone tab strip).
  - Staff Roster unified with Bookings: KPI summary strip with interactive status filtering, multi-facet filter toolbar, simplified 4-column DataGrid (`Staff Member`, `Role / Function`, `Status`, `Action`), and standard 10/25/50 pagination.
  - Recomposed Staff Inspector (390–420px): Status header, avatar/identity, 2-column summary bar, `Overview` / `Services` / `Access` tabs, grouped 2-column detail grid, conditional Skill Tier, and quick operational actions.
  - Rebuilt Schedule View: Focused staff selector DataGrid + Schedule Inspector with Day/Week/Month `StaffFullScheduleModal` and `StaffScheduleModal`.
  - Rebuilt Applications, Capabilities, and Roles views matching Bookings list + inspector architecture.
  - Contract-backed truthful state for Performance (_"Performance metrics are not available in the current Staff data contract."_).
  - Offboarding gate documented as `OFFBOARDING CONTRACT REQUIRED`.
  - Zero service-role key or admin client leaks.
- **Verification Baseline**:
  - 267 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
