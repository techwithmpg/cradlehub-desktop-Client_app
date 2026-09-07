# Stage 05 — Canonical Module Workspace Extraction Evidence

## Status & Governance

- **Target**: CradleHub Desktop (`https://github.com/techwithmpg/cradlehub-desktop-Client_app`)
- **Stage**: Stage 05 — Canonical Module Body / Workspace Extraction
- **PRE_STAGE_MAIN_SHA**: `9bd83ab8f05ace193d026de896b70f3a4eff363d`
- **ACCEPTED_STAGE_BRANCH_TIP**: `65c7eb371652c3f272b75bda55c437481867abc1` (`stage/05-canonical-module-workspace`)
- **PRIOR_REVIEW_SHA**: `5d0990507ba00cab30d3d6f1cfa4d9ad7703a0c6`
- **IMPLEMENTATION_HEAD_SHA**: `409c712f1e12ec855b787bfa2d4c94c1ed2dfc85`
- **PRIOR_EVIDENCE_ACCOUNTING_HEAD**: `9ae995b9cfd65c93836a7e7e1bb4ad49eb2092f8`
- **MERGE_STYLE**: `FAST-FORWARD` (`git merge --ff-only`)
- **MAIN_AFTER_FAST_FORWARD**: `65c7eb371652c3f272b75bda55c437481867abc1`
- **HOSTED_REFERENCE**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **Current Status**: **STAGE 05 — ACCEPTED / MERGED / CLOSED** on `main`.
- **OWNER CONFIRMATION**: Owner explicitly accepted Stage 05 after independent review.
- **Accounting Note**: The SHA of the final documentation closeout commit on `main` is intentionally not self-embedded in this file. The final pushed `main` tip is recorded in the agent closeout report and independently verified from GitHub.
- **Stage Authorization**: Owner-authorized Stage 05 architectural extraction to consolidate the proven module workspace architecture from Bookings and Staff into one canonical workspace component family (`src/components/workspace/`), migrating Bookings and Staff to consume it with no intentional visual change.

---

## 1. Executive Summary & Architectural Migration

Stage 05 extracts the proven workspace architecture from accepted **Bookings** and **Staff** implementations into a single, canonical React component family in `src/components/workspace/`.

### Architecture Evolution:

- **Before Stage 05**:
  ```text
  CanonicalShell
      ↓
  Module-specific wrapper branches (`bookings-module-wrapper`, `staff-module-wrapper`)
      ↓
  Independently composed raw JSX layouts (`bookings-main-grid`, `bookings-list-column`, `bookings-inspector-column`, etc.)
  ```
- **After Stage 05**:
  ```text
  CanonicalShell
      ↓
  ModuleWorkspaceHost (neutral structural host)
      ↓
  ModuleWorkspaceMount (neutral mount container)
      ↓
  Active Module Controller (BookingsView, StaffView, CustomersView)
      ↓
  ModuleWorkspace
      ├── ModuleHeader
      ├── ModuleSummary (SummaryCard, KpiGrid, KpiCell)
      ├── ModuleStateMessage (SuccessBanner, ErrorBanner)
      ├── ModuleLoadingState
      ├── ModuleMainGrid
      │   ├── ModulePrimaryColumn
      │   │   └── ModulePrimaryCard
      │   │       ├── ModuleTabs
      │   │       ├── ModuleToolbar
      │   │       ├── ModuleDataGridFrame & ModuleTable
      │   │       └── ModulePagination
      │   └── ModuleInspectorColumn
      │       └── ModuleInspectorFrame & ModuleInspectorEmptyState
  ```

---

## 2. Pre-Extraction Consumer Audit & Ownership Transition

| Component / Structure      | Before Stage 05 Ownership                                      | After Stage 05 Ownership                                                                                                |
| :------------------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| Workspace Mount Boundary   | `CanonicalShell` (per-module wrapper branches)                 | `ModuleWorkspaceHost` & `ModuleWorkspaceMount`                                                                          |
| Module Workspace Container | Ad-hoc `div.bookings-view-container` in modules                | Canonical `ModuleWorkspace` (neutral layout container, no nested `main` landmark)                                       |
| Module Header              | Duplicate header JSX in `BookingsHeader` & `StaffHeader`       | Canonical `ModuleHeader` (thin wrappers retained)                                                                       |
| KPI Metrics Strip          | Duplicate grid JSX in `BookingsKpiSummary` & `StaffKpiSummary` | Canonical `ModuleSummaryCard`, `ModuleKpiGrid`, `ModuleKpiCell` (native `<button type="button">` for interactive cells) |
| Two-Column Grid            | Raw `bookings-main-grid` in views                              | Canonical `ModuleMainGrid`, `ModulePrimaryColumn`, `ModuleInspectorColumn`                                              |
| Primary Operation Card     | Raw `bookings-list-card` in views                              | Canonical `ModulePrimaryCard`                                                                                           |
| In-Card Tabs               | Raw `bookings-scope-tabs` in list cards                        | Canonical `ModuleTabs` (full ARIA `role="tablist"`/`role="tab"` & keyboard navigation)                                  |
| Toolbars                   | Raw `bookings-toolbar-container`                               | Canonical `ModuleToolbar` (`role="toolbar"`)                                                                            |
| DataGrid Table Frame       | Raw `bookings-datagrid-wrapper` & `bookings-table`             | Canonical `ModuleDataGridFrame` & `ModuleTable`                                                                         |
| Table Pagination           | Duplicate pagination footer JSX                                | Canonical `ModulePagination` (accessible page navigation)                                                               |
| Context Inspector Frame    | Raw `booking-inspector-card` in inspector cards                | Canonical `ModuleInspectorFrame` & `ModuleInspectorEmptyState`                                                          |
| Loading Skeletons          | Duplicate loading skeleton JSX                                 | Canonical `ModuleLoadingState`                                                                                          |
| Notice/Error Banners       | Raw banner markup in views                                     | Canonical `ModuleErrorBanner` & `ModuleSuccessBanner`                                                                   |

---

## 3. Canonical Workspace Primitives Inventory

Located in `src/components/workspace/`:

1. `ModuleWorkspaceHost.tsx`: Permanent neutral structural host in `CanonicalShell` managing `.workspace-canvas` and `.workspace-canvas-wide`.
2. `ModuleWorkspaceMount.tsx`: Neutral structural mount container managing canonical `.bookings-module-wrapper` geometry.
3. `ModuleWorkspace.tsx`: Top-level workspace layout container (`.bookings-view-container`) as a neutral container without duplicate `main` landmarks.
4. `ModuleHeader.tsx`: Header primitive managing title, subtitle, refresh button (with spinner and disabled state), primary action button, and custom action slots.
5. `ModuleSummary.tsx`: Composable KPI metrics family (`ModuleSummaryCard`, `ModuleKpiGrid`, `ModuleKpiCell`) supporting 4-up, 6-up, or custom grid geometries. Interactive cells render native `<button type="button">` elements.
6. `ModuleMainGrid.tsx`: Canonical 2-column grid (`.bookings-main-grid`) with `ModulePrimaryColumn` (`.bookings-list-column`) and `ModuleInspectorColumn` (`.bookings-inspector-column`).
7. `ModulePrimaryCard.tsx`: White operational card surface (`.bookings-list-card`) with border, shadow, and radius.
8. `ModuleTabs.tsx`: In-card horizontal tab strip with full keyboard navigation (Arrow keys, Home, End), ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`), and badge counts.
9. `ModuleToolbar.tsx`: Standard toolbar container (`.bookings-toolbar-container`) with `role="toolbar"`.
10. `ModuleDataGridFrame.tsx`: Scrollable full-width table wrapper (`.bookings-datagrid-wrapper`) and table primitive (`.bookings-table`).
11. `ModulePagination.tsx`: Standard pagination footer (`.bookings-table-footer`) with record counts, page size select, and accessible prev/next page buttons.
12. `ModuleInspectorFrame.tsx`: Context inspector shell (`.booking-inspector-card.active` / `.booking-inspector-card.empty`) and `ModuleInspectorEmptyState`.
13. `ModuleLoadingState.tsx`: Canonical skeleton loading geometry (`.bookings-loading-state`) reflecting real workspace layout.
14. `ModuleStateMessage.tsx`: Error banner with retry trigger (`ModuleErrorBanner`) and dismissible notice banner (`ModuleSuccessBanner`).
15. `index.ts`: Clean export barrel.

---

## 4. CSS Strategy & Selector Ownership

- **Legacy Selector Encapsulation**: Existing CSS classes (`bookings-main-grid`, `bookings-list-column`, `bookings-inspector-column`, `bookings-list-card`, `bookings-scope-tabs-container`, `bookings-toolbar-container`, `bookings-datagrid-wrapper`, `bookings-table`, `booking-inspector-card`, `bookings-kpi-cell`) are encapsulated as internal implementation details of the canonical workspace components.
- **Zero CSS Renaming**: No global CSS rename was performed, eliminating regression risk.
- **Native Button Reset**: The CSS reset added for `.bookings-kpi-cell` (`font: inherit; text-align: left; width: 100%; color: inherit; box-sizing: border-box;`) is intended to preserve the accepted appearance.
- **No Second Token File**: Preserved all existing theme color, spacing, and font tokens in `src/styles.css`.

---

## 5. Bookings & Staff Migration Summary

### Bookings Migration:

- `BookingsView`: Wrapped in `<ModuleWorkspace>`, uses `<ModuleSuccessBanner>`, `<ModuleErrorBanner>`, `<ModuleLoadingState>`, `<BookingsKpiSummaryCard>`, `<ModuleMainGrid>`, `<ModulePrimaryColumn>`, `<ModuleInspectorColumn>`.
- `BookingsHeader`: Refactored to thin wrapper over `<ModuleHeader>`.
- `BookingsKpiSummary`: Refactored to compose `<ModuleSummaryCard>`, `<ModuleKpiGrid>`, and `<ModuleKpiCell>`.
- `BookingsListCard`: Refactored to compose `<ModulePrimaryCard>`, `<ModuleTabs>`, `<ModuleToolbar>`, `<ModuleDataGridFrame>`, `<ModuleTable>`, and `<ModulePagination>`.
- `BookingInspectorCard`: Refactored to compose `<ModuleInspectorFrame>` and `<ModuleInspectorEmptyState>`.
- **Visual Impact**: **NO INTENTIONAL VISUAL CHANGE**.

### Staff Migration:

- `StaffView`: Wrapped in `<ModuleWorkspace>`, uses `<ModuleLoadingState>`, `<StaffSummaryCard>`, `<ModuleMainGrid>`, `<ModulePrimaryColumn>`, `<ModulePrimaryCard>`, `<ModuleTabs>`, `<ModuleInspectorColumn>`.
- `StaffHeader`: Refactored to thin wrapper over `<ModuleHeader>`.
- `StaffListCard`: Refactored to compose `<ModuleToolbar>`, `<ModuleDataGridFrame>`, `<ModuleTable>`, and `<ModulePagination>`.
- `StaffInspectorCard`: Refactored to compose `<ModuleInspectorFrame>` and `<ModuleInspectorEmptyState>`.
- **Behavior Preservation**: All 6 tabs (`Roster`, `Schedule`, `Applications`, `Performance`, `Capabilities`, `Roles`), persistent `selectedStaffId`, isolated `selectedApplicationId`, full-width tables, and modals remain completely intact. **NO INTENTIONAL VISUAL CHANGE**.

---

## 6. Customers, Shell, & Lifecycle Integrity

- **Customers Module**: Unmodified in internal composition. Mounts cleanly through `ModuleWorkspaceHost` and `ModuleWorkspaceMount`. No shell-level per-module wrapper classes.
- **Shell Neutrality**: `CanonicalShell` no longer maintains module-specific CSS branches. A single `ModuleWorkspaceHost` wraps `ModuleWorkspaceMount`.
- **Single Title Hook**: Exactly one neutral hidden test hook `data-testid="active-module-title"` is rendered at the root of `ModuleWorkspaceMount`.
- **Placeholder Modules**: Today, Attendance, Schedule, Home Service, and Settings remain truthful empty states: _"This module is not yet available in the desktop client."_ No fake data.
- **Module Lifecycle**: Only the active domain controller runs; inactive modules unmount cleanly. No speculative caching or background DOM keeping.

---

## 7. Exact Changed Files Inventory (33 Files)

Changed relative to accepted `main` baseline (`9bd83ab8f05ace193d026de896b70f3a4eff363d`) through `IMPLEMENTATION_HEAD_SHA` (`409c712f1e12ec855b787bfa2d4c94c1ed2dfc85`):

```text
docs/50-state/CURRENT_STATE.md
docs/50-state/CURRENT_TASK.md
docs/50-state/HANDOFF.md
docs/50-state/LAST_VERIFIED_GATE.md
docs/50-state/evidence/stage-05-canonical-module-workspace.md
src/components/CanonicalShell.tsx
src/components/bookings/BookingInspectorCard.tsx
src/components/bookings/BookingsHeader.tsx
src/components/bookings/BookingsKpiSummary.tsx
src/components/bookings/BookingsListCard.tsx
src/components/bookings/BookingsView.tsx
src/components/staff/StaffHeader.tsx
src/components/staff/StaffInspectorCard.tsx
src/components/staff/StaffListCard.tsx
src/components/staff/StaffView.tsx
src/components/workspace/ModuleDataGridFrame.tsx
src/components/workspace/ModuleHeader.tsx
src/components/workspace/ModuleInspectorFrame.tsx
src/components/workspace/ModuleLoadingState.tsx
src/components/workspace/ModuleMainGrid.tsx
src/components/workspace/ModulePagination.tsx
src/components/workspace/ModulePrimaryCard.tsx
src/components/workspace/ModuleStateMessage.tsx
src/components/workspace/ModuleSummary.tsx
src/components/workspace/ModuleTabs.tsx
src/components/workspace/ModuleToolbar.tsx
src/components/workspace/ModuleWorkspace.tsx
src/components/workspace/ModuleWorkspaceHost.tsx
src/components/workspace/ModuleWorkspaceMount.tsx
src/components/workspace/index.ts
src/styles.css
tests/components.test.tsx
tests/workspace-components.test.tsx
```

---

## 8. Split Validation Evidence

### A. IMPLEMENTATION VALIDATION

Executed at `IMPLEMENTATION_HEAD_SHA` (`409c712f1e12ec855b787bfa2d4c94c1ed2dfc85`):

```bash
pnpm format:check  # PASS (All matched files use Prettier code style)
pnpm lint          # PASS (0 errors, 0 warnings)
pnpm typecheck     # PASS (tsc --noEmit exited 0)
pnpm test          # PASS (14 test files, 290 tests passed)
pnpm build         # PASS (vite production client bundle built cleanly in 5.36s)
git diff --check   # PASS (clean diff)
```

#### Test Suite Summary:

- `tests/workspace-components.test.tsx`: 17 tests (Canonical primitives unit tests including Host, Mount, neutral Workspace container, and native button KPI cells).
- `tests/components.test.tsx`: 20 tests (Stage 01/Shell UI tests including single `ModuleWorkspaceHost`, single `ModuleWorkspaceMount`, single `active-module-title` hook, unmounting of inactive controllers, and tab transitions).
- `tests/bookings-components.test.tsx`: 15 Bookings UI tests.
- `tests/bookings-service.test.ts`: 33 Bookings service tests.
- `tests/staff-components.test.tsx`: 18 Staff UI tests.
- `tests/staff-service.test.ts`: 62 Staff service tests.
- `tests/customers-components.test.tsx`: 10 Customers UI tests.
- `tests/customers-service.test.ts`: 19 Customers service tests.
- `tests/auth-service.test.ts`: 15 Auth service tests.
- `tests/booking-preview.test.tsx`: 42 Booking preview tests.
- `tests/booking-options.test.ts`: 16 Booking options tests.
- `tests/boundary.test.ts`: 6 Desktop boundary tests.
- `tests/hosted-json-response.test.ts`: 12 Envelope tests.
- `tests/roles.test.ts`: 5 Role helper tests.

### B. EVIDENCE ACCOUNTING VALIDATION

Executed following documentation updates:

```bash
pnpm format:check  # Verified
git diff --check   # Verified
```

---

## 9. Runtime / Viewport Evidence

- **AGENT VIEWPORT QA**: NOT PERFORMED — exact runtime inspection unavailable in the agent environment.
- **OWNER CONFIRMATION**: Owner explicitly accepted Stage 05 after independent review.
- **Visual Impact**: **NO INTENTIONAL VISUAL CHANGE**.

---

## 10. Security & Data Impact

- No database migrations, schemas, or RPCs touched.
- No changes to canonical hosted repository `https://github.com/techwithmpg/Cradlehub`.
- No privileged secrets or backend credentials introduced to renderer code.

---

## 11. Known Limitations Preserved

1. Legacy `bookings-*` CSS selector class names remain internal implementation details of the canonical workspace system.
2. Complex domain modals (e.g., `NewBookingModal`, `StaffCapabilityModal`, `StaffRoleModal`, `StaffScheduleModal`) retain their domain structures and were intentionally not over-abstracted into a new dialog API.
3. Customers internal workspace composition was not migrated in Stage 05 (only shell-level mounting was neutralized).
4. No speculative data persistence/cache was introduced.
5. Schedule has NOT started.
6. Stage 06 requires a separate explicitly authorized stage.

---

## 12. Rollback Point

- **Rollback Target SHA**: `9bd83ab8f05ace193d026de896b70f3a4eff363d` (accepted pre-Stage-05 `main` baseline).

---

## 13. Next Work

- **Schedule / Stage 06 has NOT started and is NOT part of Stage 05.**
- Next architectural stage requires separate explicit owner authorization.
