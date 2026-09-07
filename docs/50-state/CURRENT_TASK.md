# Current Task

Stage 04 — Staff: Staff Management Workspace UI/UX System Unification.

**STAGE 04 STAFF BOOKING-SYSTEM UI UNIFICATION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Correction Start SHA (CORRECTION_START_SHA)**: `5f2d95b2d7ae9333e6199f0e12df2910f153ddae`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Staff Management Workspace Unification Deliverables:

1. **In-Card Scope Tabs**: Six primary views (`Staff Roster`, `Schedule View`, `Applications`, `Performance`, `Capabilities & Services`, `Roles & Permissions`) inside main card header (`bookings-scope-tabs-container`), zero visual divergence from Bookings.
2. **Staff Roster Unified with Bookings**: KPI summary strip, simplified 4-column DataGrid (`Staff Member`, `Role / Function`, `Status`, `Action`), interactive KPI status filtering, multi-facet toolbar, and standard 10/25/50 pagination.
3. **Recomposed Staff Inspector (390–420px)**: Header matching Booking inspector, `Overview` / `Services` / `Access` tabs, grouped detail grid, conditional Skill Tier, inline profile edit form, and quick actions.
4. **Rebuilt Schedule View & Modals**: Focused staff selector table + Schedule Inspector; `StaffFullScheduleModal` (Day/Week/Month calendar) and `StaffScheduleModal` with responsive viewport bounds.
5. **Rebuilt Applications, Capabilities, and Roles Views**: Compact list + inspector architecture with standard pagination.
6. **Contract-backed Performance Gate**: _"Performance metrics are not available in the current Staff data contract."_
7. **Offboarding Gate**: Documented as `OFFBOARDING CONTRACT REQUIRED`.
8. **Test Coverage**: 267 passing tests across 13 test files.
9. **Next Step**: Independent review of Stage 04 Staff Management Workspace UI/UX Unification.
