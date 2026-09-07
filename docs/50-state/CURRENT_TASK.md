# Current Task

Stage 04 — Staff: Final Functional Truth Correction.

**STAGE 04 FINAL FUNCTIONAL TRUTH CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `4773eb2ce8b531e4461189e2f3ff8f4cb2db9a22`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Final Functional Truth Accomplishments:

1. **Strict Selected-Field Payload Validation**: `normalizeStaffMember` rejects `undefined` for all selected fields (`nickname`, `phone`, `avatar_url`, `auth_user_id`, `updated_at`, `staff_services`), rejects empty/whitespace `auth_user_id`, and requires non-empty `updated_at`.
2. **Capability Array Validation**: `extractCapabilities` rejects `undefined` (fails closed, does not convert to `[]`), strictly enforces `services.length === 1` for relation arrays, and forbids fabricated service names.
3. **Tier Applicability Display**: Implemented `shouldDisplayStaffTier` matching hosted `getStaffDisplayMeta()`; table displays `—` for non-tier staff; inspector omits the Skill Tier row for non-tier staff.
4. **Conservative Status Copy**: Removed unproven lifecycle claims from KPI cards (`Total Staff` = `"Branch roster headcount"`, `Active` = `"Active branch staff"`, `Awaiting Approval` and `Invites Sent` subtext omitted).
5. **Branch Invariant**: Enforces `branch_id === expectedBranchId`.
6. **Selection Coherence**: Synchronizes inspector selection on tab and search changes; clears selection when 0 results match.
7. **Business Terminology & Accessibility**: Neutral inspector labels; table headers use `th-sort-btn` with `aria-sort`; KPI cells use `<button type="button">` with `aria-pressed`.
8. **Test Coverage**: 256 passing tests across 13 test files.
9. **Next Step**: Independent review of the final functional correction slice.
