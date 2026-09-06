# Current Task

Stage 04 — Staff: Audit & Architecture Discovery Corrections.

**STAGE 04 AUDIT CORRECTIONS READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Correction Base (CORRECTION_BASE_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Correction Accomplishments:

1. **SHA Evidence Correction**: Disentangled BASE_SHA (`fb17b71d17d02ca33041e0331ec09a6174aad9a4`), initial audit commit (`2ad6b23357bcf49d1224a34e3cf4219c2122359f`), and correction base.
2. **Single-Branch Desktop Model**: Removed multi-branch switching claim; desktop operates strictly in the single authoritative branch resolved by `AuthContext`.
3. **Authoritative Staff Status Semantics**: Documented hosted `getStaffStatus` rules (`active`, `invited`, `awaiting`), preventing misclassification of invited/awaiting staff as deactivated.
4. **RLS & Application Update Authorization**: Clarified database RLS vs hosted application guardrails (`updateStaffAction`), reinforcing that the Stage 04 initial slice is strictly READ-ONLY.
5. **Staff Services RLS & RPC Verification**: Verified exact policies on `public.staff_services` (`staff_services_operational_select_branch`, insert/update/delete policies, and `replace_staff_service_capabilities` RPC).
6. **Desktop Client / Transport Reuse**: Clarified reuse of accepted `getSupabaseClient()` singleton and session infrastructure.
7. **Scope Boundaries & Future Stages**: Removed speculative stage numbering; confirmed Attendance and Schedule are separate modules and Payroll/Finance remain dormant.
8. **Refined KPIs and State Matrix**: Defined deterministic metrics and PostgREST-appropriate error semantics.
9. **Next Step**: Await independent review of these Stage 04 audit corrections before beginning functional implementation.
