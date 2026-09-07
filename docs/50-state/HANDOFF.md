# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03: **ACCEPTED / MERGED / CLOSED** on `main` at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 (Staff): **STAGE 04 PERSISTENT STAFF WORKSPACE FRAME READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.

- **Base Baseline (BASE_SHA)**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4` on `main`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `588669b26b6424009536b2184ef256c59c3238bc`.
- **Active Branch**: `stage/04-staff`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Stage 04 Staff Persistent Workspace Frame Correction:

1. **Persistent Outer Surfaces**: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` stay mounted across all 6 Staff tabs (`Staff Roster`, `Schedule View`, `Applications`, `Performance`, `Capabilities & Services`, `Roles & Permissions`).
2. **Sibling Inspector Architecture**: Inspector is outside `staff-management-card` as a sibling column via `.bookings-main-grid`. Independent height, no layout locks.
3. **Truthful Tab Summaries**: Roster (Total, Active, Awaiting, Invites), Applications (Total, Pending, Approved, Rejected), Capabilities (Total, With/Without, Total assignments), Roles (Total, Linked/Unlinked, Heads), Schedule (Staff in view, Overrides, Blocked times, Week), Performance (same-frame truthful message).
4. **Persistent Contextual Inspector**: One persistent inspector shell (`StaffContextInspector`) with contextual inner content per active tab. Empty state displayed when selection is closed without unmounting the frame.
5. **Selection Coherence & State Isolation**: `selectedStaffId` preserved across staff-centric tabs; `selectedApplicationId` isolated for Applications tab.
6. **Content-Only Child Components**: All tab child views render only the left-column content inside the persistent card.
7. **Verification**: 271 passing tests across 13 test files, clean lint, typecheck, build, and format.
8. **Universal Workspace Extraction**: NOT STARTED — waiting for owner confirmation of persistent Staff frame.

Consult `docs/50-state/evidence/stage-04-staff.md` for full discovery and implementation findings.

Work is stopped awaiting independent review of the Stage 04 Staff Persistent Workspace Frame.
