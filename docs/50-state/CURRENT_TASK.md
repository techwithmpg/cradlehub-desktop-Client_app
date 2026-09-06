# Current Task

Stage 04 — Staff: Audit & Architecture Discovery Finalization.

**STAGE 04 AUDIT FINAL CORRECTIONS READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `b89f812a1022407e483392dece11798dea1b3093`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Final Semantics Accomplishments:

1. **Status Semantics Finalized**: Documented that runtime derived status produces only `active`, `awaiting`, and `invited`. `"inactive"` is not emitted by `getStaffStatus()` and is excluded from UI filters and badges.
2. **Deterministic Summary Metrics**: Aligned summary strip 1:1 with hosted Staff semantics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`), removing speculative provider/support groupings.
3. **Exact Roster Membership Rule**: Defined explicit query and inclusion criteria (`branch_id = authContext.branchId`, `archived_at IS NULL`, `merged_into_staff_id IS NULL`).
4. **Service Capability Data Minimization**: Minimized `staff_services` query to `id` and `name`, avoiding unnecessary pricing or duration data.
5. **Strict Read-Only Vertical Slice**: Confirmed Stage 04 initial release contains zero mutations (all profile edits, service assignments, and status toggles deferred).
6. **Next Step**: Await independent review of these finalized Stage 04 audit findings before beginning functional implementation.
