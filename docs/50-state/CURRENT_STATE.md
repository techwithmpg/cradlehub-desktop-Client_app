# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 FUNCTIONAL CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Functional read-only workspace correction complete.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Functional Correction Deliverables**:
  - Strict payload validation in `src/lib/staff-service.ts` validating all required modern fields (`id`, `branch_id`, `auth_user_id`, `full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`, `is_cross_branch`, `created_at`, `updated_at`, `staff_services`) without fabricating defaults on missing data.
  - Strict nested service capability validation in `extractCapabilities` without creating fake `"Unnamed Service"` labels.
  - Branch invariant validation (`branch_id === expectedBranchId`).
  - Selection coherence in `StaffView.tsx` (synchronizes inspector selection when filters or searches change; clears inspector on 0 visible results).
  - Truthful business terminology in `StaffInspectorCard.tsx` (`Department Head`, `Not a department head`, `Skill Tier`, `Cross-Branch Eligibility`, `Account linked` / `Not linked`, no raw UUID display).
  - KPI subtext correction (`"Active branch staff"`) and accessible `<button type="button">` KPI elements with `aria-pressed`.
  - Keyboard-operable sorting on table headers (`<button type="button" className="th-sort-btn">` with `aria-sort`).
  - Responsive client-side search without artificial debounce.
- **Verification Baseline**:
  - 232 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
