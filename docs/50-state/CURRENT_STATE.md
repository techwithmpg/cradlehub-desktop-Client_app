# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **AUDIT & ARCHITECTURE CHECKPOINT READY FOR REVIEW — PUSHED AND STOPPED**. Functional UI implementation has NOT yet started.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Canonical Hosted Main SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Audit Findings**:
  - Full discovery of `public.staff` and `public.staff_services` data models and RLS policies.
  - Branch isolation enforced via Supabase session claims and Postgres RLS.
  - Explicit scope boundaries: Attendance, Schedule, Payroll, and Web Onboarding rejected from Stage 04.
  - Proposed high-density desktop vertical slice matching Bookings/Customers architecture.
- **Verification Baseline**: 192/192 vitest tests passing across 11 test files, ESLint 0 errors / 0 warnings, TypeScript clean, Vite production build clean, Cargo clean.

See [Stage 04 audit evidence](evidence/stage-04-staff.md) for full discovery details and contract matrices.
