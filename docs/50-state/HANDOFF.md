# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03: **ACCEPTED / MERGED / CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff): **STAGE 04 NESTED CAPABILITY CONTRACT FIX READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `5e79b212bbc0e948b75d47a84f4053f546378a4b`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Final Nested Capability Contract Fix:

1. **Capability Identity Validation**: Validates outer `service_id`, nested `services.id`, and nested `services.name` across object and single-element array shapes.
2. **Defensive Identity Consistency**: Enforces `services.id === staff_services.service_id`; mismatches fail closed (`null`).
3. **Strict Collection Shape**: `staff_services` 1-to-many embed requires an array (rejects `null` and `undefined`; `[]` represents valid 0 capabilities).
4. **Staff Read Service**: Strict modern schema payload validation rejecting `undefined` on selected fields and requiring non-empty `updated_at`.
5. **Tier Display Semantics**: Implemented `shouldDisplayStaffTier` matching hosted `getStaffDisplayMeta()`; table displays `—` for non-tier staff; inspector omits Skill Tier detail row.
6. **Conservative Status Copy**: Removed unproven lifecycle claims from KPI cards (`Total Staff` = `"Branch roster headcount"`, `Active` = `"Active branch staff"`, `Awaiting Approval` and `Invites Sent` subtext omitted).
7. **Branch Invariant & Selection Coherence**: Enforces `branch_id === expectedBranchId`; synchronizes inspector selection on tab and search changes; clears inspector on 0 visible matches.
8. **Business Terminology & Accessibility**: Neutral inspector labels; table headers use `th-sort-btn` with `aria-sort`; KPI cells use `<button type="button">` with `aria-pressed`.
9. **Responsive Search**: Responsive client-side search over loaded roster.
10. **Strict Read-Only Scope**: Zero mutations, additions, edits, or deletes.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery and implementation findings.

Work is stopped awaiting independent review of the nested capability contract fix.
