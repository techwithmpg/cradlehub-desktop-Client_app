# Current Task

Stage 04 — Staff: Full-Width DataGrid Utilization Fix.

**STAGE 04 STAFF FULL-WIDTH DATAGRID CORRECTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED.**

- **Active Branch**: `stage/04-staff`.
- **Accepted Main BASE_SHA**: `fb17b71d17d02ca33041e0331ec09a6174aad9a4`.
- **Initial Audit Commit (INITIAL_AUDIT_SHA)**: `2ad6b23357bcf49d1224a34e3cf4219c2122359f`.
- **Audit Confirmed Commit (AUDIT_CONFIRMED_SHA)**: `1fcd2b892d39a8b611a49825511bd34740fd2f7a`.
- **Previous Functional SHA (PREVIOUS_FUNCTIONAL_SHA)**: `25e017b4504171f6f90b1cfaf3a8a5aab65b9065`.
- **Frame Correction SHA (FRAME_CORRECTION_SHA)**: `d15ff7964d62e185e1aba9600c6f3350b097de4f`.
- **Canonical Hosted Main SHA (HOSTED_SHA)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.

Staff Workspace Full-Width DataGrid Deliverables:

1. **Full-Width Canonical Table Styling**: Replaced unsupported `bookings-datagrid` with canonical `bookings-table` across Staff Roster, Applications, Capabilities, Roles, and Schedule tables.
2. **Proportional Column Widths**: Applied proportional colgroups across all Staff DataGrids to eliminate blank right-hand space and distribute columns across 100% of the available management card width.
3. **Safe Long Name Truncation**: Protected identity blocks with `min-width: 0` and ellipsis overflow to prevent layout deformation.
4. **Persistent Outer Surfaces Preserved**: Header, summary frame, two-column grid, left management card, and sibling inspector shell remain completely stable across all tab switches.
5. **Test Coverage**: 272 passing tests across 13 test files.
6. **Universal Workspace Extraction Status**: NOT STARTED — waiting for owner confirmation of final Staff workspace geometry.
7. **Next Step**: Independent review of Stage 04 Staff Full-Width DataGrid Correction.
