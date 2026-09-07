# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **STAGE 04 NESTED CAPABILITY CONTRACT FIX READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**. Functional read-only workspace nested capability contract fix complete.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `5e79b212bbc0e948b75d47a84f4053f546378a4b`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Final Functional Truth & Contract Fix Deliverables**:
  - Strict payload validation in `src/lib/staff-service.ts` validating all required modern fields (`id`, `branch_id`, `auth_user_id`, `full_name`, `nickname`, `phone`, `avatar_url`, `tier`, `system_role`, `staff_type`, `is_head`, `is_active`, `is_cross_branch`, `created_at`, `updated_at`, `staff_services`); rejecting `undefined` on selected fields and failing closed on missing properties.
  - Strict nested service capability validation in `extractCapabilities`: requires non-empty outer `service_id`, non-empty nested `services.id`, non-empty nested `services.name`, requires `services.length === 1` for relation arrays, enforces defensive identity consistency (`services.id === staff_services.service_id`), and rejects `null`/`undefined` for `staff_services` (exact `[]` valid for zero assigned services).
  - Tier display semantics in `shouldDisplayStaffTier` aligning with hosted `getStaffDisplayMeta()` (therapist/nail_tech/aesthetician service providers show tier; non-tier/managerial/crm/driver/utility show `—` in table and omit row in inspector).
  - Conservative KPI copy removing unproven lifecycle claims (`Total Staff` = `"Branch roster headcount"`, `Active` = `"Active branch staff"`, `Awaiting Approval` and `Invites Sent` subtexts omitted).
  - Branch invariant validation (`branch_id === expectedBranchId`).
  - Selection coherence in `StaffView.tsx`.
  - Accessible keyboard sort headers and KPI buttons.
  - Responsive client-side search without artificial debounce.
- **Verification Baseline**:
  - 259 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
