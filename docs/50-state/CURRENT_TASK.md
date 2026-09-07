# Current Task

Stage 04 — Staff: Final Nested Capability Contract Fix.

**STAGE 04 NESTED CAPABILITY CONTRACT FIX READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `5e79b212bbc0e948b75d47a84f4053f546378a4b`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Nested Capability Contract Fix Accomplishments:

1. **Nested Service Identity & Name Validation**: `extractCapabilities` strictly validates outer `service_id` (non-empty string), nested `services.id` (non-empty string), and nested `services.name` (non-empty string) across both direct object and single-element array forms.
2. **Defensive Identity Consistency Check**: Enforces `services.id === staff_services.service_id` (trimmed); mismatches fail closed (`null`), producing `INVALID_PAYLOAD`.
3. **Strict Collection Shape**: Rejects `undefined` and `null` for `staff_services` (1-to-many relationship returns `[]` for zero assigned services).
4. **Single-Element Array Restriction**: Requires `services.length === 1` for relation arrays, failing closed on multi-element or malformed arrays.
5. **Strict Selected-Field Payload Validation**: `normalizeStaffMember` rejects `undefined` for all selected fields, rejects empty/whitespace `auth_user_id`, and requires non-empty `updated_at`.
6. **Tier Applicability Display**: Implemented `shouldDisplayStaffTier` matching hosted `getStaffDisplayMeta()`; table displays `—` for non-tier staff; inspector omits the Skill Tier row for non-tier staff.
7. **Conservative Status Copy**: Removed unproven lifecycle claims from KPI cards (`Total Staff` = `"Branch roster headcount"`, `Active` = `"Active branch staff"`, `Awaiting Approval` and `Invites Sent` subtext omitted).
8. **Branch Invariant & Selection Coherence**: Enforces `branch_id === expectedBranchId`; synchronizes inspector selection on tab and search changes; clears selection when 0 results match.
9. **Test Coverage**: 259 passing tests across 13 test files.
10. **Next Step**: Independent review of the nested capability contract fix.
