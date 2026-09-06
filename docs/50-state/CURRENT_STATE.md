# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.

Stage 04 (Staff): **UI REFINEMENT GATE — OWNER DESIGN REVIEW REQUIRED**. Functional read-only workspace build complete.

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Functional Implementation Deliverables**:
  - Staff service layer (`src/lib/staff-service.ts`) querying `public.staff` and `public.staff_services` via authenticated Supabase client.
  - Runtime derived statuses strictly `active`, `awaiting`, and `invited` (`"inactive"` is not emitted and excluded from UI filters/badges).
  - Deterministic summary KPIs: `Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`.
  - Minimized service capability data (`id`, `name`) in operational inspector.
  - Dense DataGrid table with sorting, search by full name/nickname/phone, and status filter tabs.
  - Two-tab operational inspector (`Profile`, `Services`) with truthful empty states and keyboard accessibility.
  - Wireup to `CanonicalShell` under `staff` navigation module.
- **Verification Baseline**:
  - 220 passing vitest tests across 13 test files.
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean in 1.16s.
  - `git diff --check` clean.

See [Stage 04 evidence](evidence/stage-04-staff.md) for full implementation details.
