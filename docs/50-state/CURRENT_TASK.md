# Current Task

Stage 04 — Staff: Functional Read-Only Workspace Correction.

**STAGE 04 FUNCTIONAL CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Functional Correction Accomplishments:

1. **Strict Payload Validation**: `normalizeStaffMember` validates all required modern fields and fails closed on missing/malformed fields without inventing defaults (`therapist`, `mid`, `staff`, `false`).
2. **Capability Validation**: `extractCapabilities` validates nested relations and fails closed on corrupted data without fabricating `"Unnamed Service"`.
3. **Branch Invariant**: Enforces `branch_id === expectedBranchId`.
4. **Selection Coherence**: Synchronizes inspector selection on tab and search changes; clears selection when 0 results match.
5. **Business Terminology**: Neutral inspector labels (`Department Head`, `Not a department head`, `Skill Tier`, `Cross-Branch Eligibility`, `Account linked` / `Not linked`, no raw UUID).
6. **Accessibility**: Table headers use `<button type="button" className="th-sort-btn">` with `aria-sort`; KPI cells use `<button type="button">` with `aria-pressed`.
7. **Responsive Search**: Responsive client-side search over loaded roster.
8. **Test Coverage**: 232 passing tests across 13 test files.
9. **Next Step**: Independent review of the functional correction slice.
