# Current Task

Stage 04 — Staff: Persistent Staff Workspace Frame Correction.

**STAGE 04 PERSISTENT STAFF WORKSPACE FRAME READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `588669b26b6424009536b2184ef256c59c3238bc`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Staff Workspace Persistent Frame Deliverables:

1. **Persistent Outer Surfaces**: Header, `StaffSummaryCard`, `bookings-main-grid.staff-main-grid`, Left `staff-management-card`, and Right `StaffContextInspector` stay mounted across all 6 Staff tabs (`Staff Roster`, `Schedule View`, `Applications`, `Performance`, `Capabilities & Services`, `Roles & Permissions`).
2. **Sibling Inspector Architecture**: Inspector is outside `staff-management-card` as a sibling column via `.bookings-main-grid`. Independent height, no layout locks.
3. **Truthful Tab Summaries**: Roster (Total, Active, Awaiting, Invites), Applications (Total, Pending, Approved, Rejected), Capabilities (Total, With/Without, Total assignments), Roles (Total, Linked/Unlinked, Heads), Schedule (Staff in view, Overrides, Blocked times, Week), Performance (same-frame truthful message).
4. **Persistent Contextual Inspector**: One persistent inspector shell (`StaffContextInspector`) with contextual inner content per active tab. Empty state displayed when selection is closed without unmounting the frame.
5. **Selection Coherence & State Isolation**: `selectedStaffId` preserved across staff-centric tabs; `selectedApplicationId` isolated for Applications tab.
6. **Content-Only Child Components**: All tab child views render only the left-column content inside the persistent card.
7. **Test Coverage**: 271 passing tests across 13 test files.
8. **Universal Workspace Extraction Status**: NOT STARTED — awaiting owner confirmation of the persistent Staff frame proof.
9. **Next Step**: Independent review of Stage 04 Staff Persistent Workspace Frame.
