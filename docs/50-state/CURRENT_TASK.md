# Current Task

Stage 04 — Staff: Audit & Architecture Discovery Checkpoint.

**STAGE 04 AUDIT READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Canonical Hosted Main SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Checkpoint Accomplishments:

1. **Repository Verification**: Proved desktop baseline at `fb17b71d17d02ca33041e0331ec09a6174aad9a4`, created `stage/04-staff` branch.
2. **Hosted Staff Discovery**: Analyzed hosted `public.staff`, `public.staff_services`, RLS policies, role canonicalization (`crm`, `manager`, `owner`), and query patterns in `src/lib/queries/staff.ts`.
3. **Contract & Security Matrix**: Defined authoritative read/write boundaries, branch isolation enforcement, data minimization, and rejected dormant/cross-module scope (Attendance, Schedule, Payroll, Onboarding).
4. **UI State & Action Matrices**: Enumerated all operational and failure states (loading, populated, empty roster, no search matches, 401, 403, network drop).
5. **Proposed Stage 04 Slice**: Outlined `StaffView`, `StaffHeader`, `StaffKpiSummary`, `StaffListCard`, and `StaffInspectorCard` following canonical desktop architecture.
6. **Next Step**: Await independent review of the Stage 04 audit checkpoint before beginning functional implementation.
