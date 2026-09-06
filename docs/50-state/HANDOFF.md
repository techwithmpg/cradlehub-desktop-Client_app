# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03: **ACCEPTED / MERGED / CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff): **AUDIT CHECK ACCOUNTING FIX COMPLETE — PUSHED AND STOPPED FOR REVIEW**.

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `2bcab03bbeb9bd391f0ba88e5d1f38d1ec1c9305`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Check Accounting Fixes:

1. **Check Accounting Precision**: Accurately isolated current-correction checks (`pnpm format:check`, `git diff --check`) from previously recorded JS and Cargo validation suites.
2. **Roster Authority**: Roster query strictly mirrors hosted CRM Staff management (`.eq('branch_id', branchId)`).
3. **Operational Predicate Distinction**: `isOperationalStaff()` in `src/lib/staff/operational-staff.ts` is an operational scheduling helper, not the general Staff-management roster.
4. **Status Semantics**: Derived runtime statuses are strictly `active`, `awaiting`, and `invited`. `"inactive"` is not emitted by `getStaffStatus()` and is excluded from UI filters/badges.
5. **Summary Strip**: Aligned metrics 1:1 with hosted Staff statistics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
6. **Data Minimization**: Restricted capability query to `id` and `name` (no pricing or duration data).
7. **Implementation Scope**: Functional UI implementation has NOT started in this checkpoint. Strict read-only slice.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery findings.

Work is stopped awaiting independent review of these Stage 04 audit corrections.
