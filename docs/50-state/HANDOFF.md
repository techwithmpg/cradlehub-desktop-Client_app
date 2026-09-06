# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03: **ACCEPTED / MERGED / CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff): **UI REFINEMENT GATE — OWNER DESIGN REVIEW REQUIRED**.

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Functional Implementation:

1. **Staff Read Service**: Implemented `src/lib/staff-service.ts` querying `public.staff` and `public.staff_services` with strict RLS and fail-closed error classification.
2. **Status Semantics**: Derived runtime statuses are strictly `active`, `awaiting`, and `invited`. `"inactive"` is not emitted by `getStaffStatus()` and is excluded from UI filters/badges.
3. **Deterministic Summary KPIs**: Aligned metrics 1:1 with hosted Staff statistics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
4. **Data Minimization**: Restricted capability query to `id` and `name` (no pricing, duration, or commission data).
5. **Staff Workspace UI**: Implemented `StaffView.tsx`, `StaffHeader.tsx`, `StaffKpiSummary.tsx`, `StaffListCard.tsx`, and `StaffInspectorCard.tsx`.
6. **Canonical Shell Integration**: Mounted `StaffView` inside `CanonicalShell.tsx` under `staff` navigation module.
7. **Strict Read-Only Scope**: Zero mutations, additions, edits, or deletes.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery and implementation findings.

Work is stopped at the UI Refinement Gate awaiting owner design review.
