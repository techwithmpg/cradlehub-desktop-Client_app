# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **AUDIT ROSTER CONTRACT ALIGNMENT COMPLETE — PUSHED AND STOPPED FOR REVIEW**. Functional UI implementation has NOT yet started.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `63e3e585d4a2210caa870c05008ef69c88a854ff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Audit Findings & Finalized Semantics**:
  - Full discovery of `public.staff` and `public.staff_services` data models and RLS policies.
  - Staff roster authority strictly mirrors hosted CRM Staff management (`.eq('branch_id', branchId)`), without applying unhosted archive/merge filters.
  - Distinction documented: `isOperationalStaff()` in `src/lib/staff/operational-staff.ts` is an operational scheduling helper, not the general Staff-management roster.
  - Runtime derived status strictly produces `active`, `awaiting`, and `invited` (`"inactive"` is not emitted by `getStaffStatus()` and is excluded from filters/badges).
  - Summary metrics aligned 1:1 with hosted Staff semantics: `Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`.
  - Service capability data minimized to `id` and `name` (no pricing or duration data).
  - Single branch desktop authority in `AuthContext`; strict read-only initial vertical slice.
  - Explicit scope boundaries: Attendance, Schedule, Payroll, Finance, and Web Onboarding rejected from Stage 04.
- **Verification Baseline**: 192/192 vitest tests passing across 11 test files, ESLint 0 errors / 0 warnings, TypeScript clean, Vite production build clean, Cargo clean.

See [Stage 04 audit evidence](evidence/stage-04-staff.md) for full discovery details and contract matrices.
