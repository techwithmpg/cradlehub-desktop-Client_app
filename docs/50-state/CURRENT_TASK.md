# Current Task

Stage 04 — Staff: Audit Roster Contract Alignment.

**STAGE 04 AUDIT ROSTER CONTRACT CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `63e3e585d4a2210caa870c05008ef69c88a854ff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Roster Alignment Accomplishments:

1. **Roster Authority Aligned with Hosted CRM**: Removed Desktop-only archive/merge exclusions; query mirrors hosted CRM Staff management (`.eq('branch_id', branchId)`).
2. **Operational Predicate Distinguished**: Clarified that `isOperationalStaff()` in `src/lib/staff/operational-staff.ts` is an operational scheduling predicate, not the general Staff-management roster.
3. **Status Semantics Confirmed**: Runtime derived status produces strictly `active`, `awaiting`, and `invited`. `"inactive"` is not emitted by `getStaffStatus()` and is excluded from UI filters and badges.
4. **Deterministic Summary Metrics**: Aligned summary strip 1:1 with hosted Staff statistics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
5. **Capability Minimization**: Restricted capability query to `id` and `name` (no pricing or duration data).
6. **Legacy Column Fallback Documented**: Modern schema attempted first; fallback classified as compatibility behavior and tested.
7. **Strict Read-Only Vertical Slice**: Confirmed Stage 04 initial release contains zero mutations.
8. **Next Step**: Await independent review of these Stage 04 audit corrections before beginning functional implementation.
