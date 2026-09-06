# Current Task

Stage 04 — Staff: Functional Read-Only Workspace Implementation.

**UI REFINEMENT GATE — OWNER DESIGN REVIEW REQUIRED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Functional Implementation Accomplishments:

1. **Staff Service Layer**: Created `src/lib/staff-service.ts` to fetch authoritative branch staff, normalize records, extract minimized service capabilities, derive operational statuses, and calculate KPI counts.
2. **Status Derivation & KPIs**: Implemented status derivation (`active`, `awaiting`, `invited`, zero `"inactive"`) and 4 KPI metrics (`Total Staff`, `Active`, `Awaiting Approval`, `Invites Sent`).
3. **Operational DataGrid Table**: Created `StaffListCard.tsx` with sorting, search by full name/nickname/phone, and status filter tabs.
4. **Two-Tab Inspector**: Created `StaffInspectorCard.tsx` with Profile tab and Services capability tab.
5. **Shell Integration**: Connected `CanonicalShell.tsx` to render `StaffView.tsx` when `activeModule === 'staff'`.
6. **Test Coverage**: Added 28 new tests across `staff-service.test.ts` and `staff-components.test.tsx` (total 220 passing tests across 13 test files).
7. **Next Step**: Await owner design review at the UI Refinement Gate before starting any aesthetic polish or next stage.
