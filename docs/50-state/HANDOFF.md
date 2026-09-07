# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03: **ACCEPTED / MERGED / CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff): **STAGE 04 FUNCTIONAL CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Functional Correction:

1. **Staff Read Service**: Implemented strict modern schema payload validation and nested capability validation in `src/lib/staff-service.ts` without fabricating default values or fake service labels.
2. **Branch Invariant**: Enforces `branch_id === expectedBranchId`.
3. **Selection Coherence**: Synchronizes inspector selection on tab and search changes; clears inspector on 0 visible matches.
4. **Business Terminology**: Neutral inspector labels (`Department Head`, `Not a department head`, `Skill Tier`, `Cross-Branch Eligibility`, `Account linked` / `Not linked`, no raw UUID).
5. **Accessibility**: Table headers use `<button type="button" className="th-sort-btn">` with `aria-sort`; KPI cells use `<button type="button">` with `aria-pressed`.
6. **Responsive Search**: Responsive client-side search over loaded roster.
7. **Canonical Shell Integration**: Mounted `StaffView` inside `CanonicalShell.tsx` under `staff` navigation module.
8. **Strict Read-Only Scope**: Zero mutations, additions, edits, or deletes.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery and implementation findings.

Work is stopped awaiting independent review of the functional correction.
