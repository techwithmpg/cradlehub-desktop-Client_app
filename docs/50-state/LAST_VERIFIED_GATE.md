# Last Verified Gate

Stage 00 = **ACCEPTED / MERGED — CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 = **ACCEPTED / MERGED — CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 = **ACCEPTED / MERGED — CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 = **ACCEPTED / MERGED — CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff) = **STAGE 04 PERSISTENT STAFF WORKSPACE FRAME READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.

Other Modules = **NOT STARTED / NOT AUTHORIZED**.

## Verification Record

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `588669b26b6424009536b2184ef256c59c3238bc`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.
- **Checks Record (Current Stage 04 Staff Persistent Workspace Frame)**:
  - `pnpm format:check` — PASSED (Prettier clean across all files)
  - `pnpm lint` — PASSED (0 errors, 0 warnings across all files)
  - `pnpm typecheck` — PASSED (`tsc --noEmit` clean)
  - `pnpm test` — PASSED (13 test files, 271/271 vitest tests passed)
  - `pnpm build` — PASSED (Vite production build clean in 1.23s)
  - `git diff --check` — PASSED (0 whitespace / conflict errors)
- **Scope Integrity**:
  - Persistent Outer Frame: Header, Summary card, Main grid, Left card, Right inspector remain mounted across all 6 tabs without page layout destruction.
  - Sibling Inspector: `StaffContextInspector` is outside `staff-management-card` as a sibling column via `.bookings-main-grid`.
  - Truthful summary metrics for all 6 tabs (Roster, Schedule, Applications, Capabilities, Roles, Performance).
  - Selection persistence across staff-centric tabs; Application selection isolation.
  - Closed selection keeps persistent inspector shell mounted with canonical empty state.
  - Child views converted to content-only components inside left workspace card.
  - Zero schema or migration modifications.
- **Stage Status**: Stage 04 Staff Persistent Workspace Frame complete; ready for independent review.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery and implementation evidence.
