# Current Task

Stage 04 — Staff: Audit Evidence Truth Correction.

**STAGE 04 AUDIT EVIDENCE TRUTH CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `fb39c364028ca386a3da4d68c31469b116c539c9`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Evidence Truth Accomplishments:

1. **Premature Fallback Claims Removed**: Corrected statements that claimed Desktop fallback behavior was already tested. Clarified that compatibility fallback testing remains a functional-build requirement.
2. **Roster Authority Preserved**: Query mirrors hosted CRM Staff management (`.eq('branch_id', branchId)`).
3. **Operational Predicate Distinguished**: `isOperationalStaff()` in `src/lib/staff/operational-staff.ts` is an operational scheduling predicate, not the general Staff-management roster.
4. **Status Semantics Confirmed**: Runtime derived status produces strictly `active`, `awaiting`, and `invited`. `"inactive"` is not emitted by `getStaffStatus()` and is excluded from UI filters and badges.
5. **Deterministic Summary Metrics**: Summary strip aligned 1:1 with hosted Staff statistics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
6. **Capability Minimization**: Restricted capability query to `id` and `name` (no pricing or duration data).
7. **Accurate Verification Accounting**: Recorded exact checks run on the latest documentation-only commit vs historical checks.
8. **Strict Read-Only Vertical Slice**: Confirmed Stage 04 initial release contains zero mutations.
9. **Next Step**: Await independent review of these Stage 04 audit corrections before beginning functional implementation.
