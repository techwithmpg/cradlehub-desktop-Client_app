# Stage 05 — Canonical Module Workspace Extraction Evidence

## Status & Governance

- **Target**: CradleHub Desktop (`https://github.com/techwithmpg/cradlehub-desktop-Client_app`)
- **Stage**: Stage 05 — Canonical Module Body / Workspace Extraction
- **Branch**: `stage/05-canonical-module-workspace`
- **BASE_SHA**: `9bd83ab8f05ace193d026de896b70f3a4eff363d`
- **HEAD_SHA**: `stage/05-canonical-module-workspace` tip
- **HOSTED_SHA**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Canonical Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **Current Status**: **STAGE 05 CANONICAL MODULE WORKSPACE EXTRACTION READY FOR INDEPENDENT REVIEW — PUSHED AND STOPPED**.
- **Stage Authorization**: Owner-authorized Stage 05 architectural extraction to consolidate the proven module workspace architecture from Bookings and Staff into one canonical workspace component family (`src/components/workspace/`), migrating Bookings and Staff to consume it with zero visual or functional regression.

---

## 1. Executive Summary & Architectural Migration

Stage 05 successfully extracts the proven workspace architecture from accepted **Bookings** and **Staff** implementations into a single, canonical React component family in `src/components/workspace/`.

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
  ModuleWorkspaceHost (neutral mounting boundary)
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

## 2. Canonical Workspace Primitives Inventory

Located in `src/components/workspace/`:

1. `ModuleWorkspaceHost.tsx`: Permanent neutral structural host in `CanonicalShell` managing `.workspace-canvas` and `.workspace-canvas-wide`.
2. `ModuleWorkspace.tsx`: Top-level workspace layout container (`.bookings-view-container`) with semantic `role="main"`.
3. `ModuleHeader.tsx`: Header primitive managing title, subtitle, refresh button (with spinner and disabled state), primary action button, and custom action slots.
4. `ModuleSummary.tsx`: Composable KPI metrics family (`ModuleSummaryCard`, `ModuleKpiGrid`, `ModuleKpiCell`) supporting 4-up, 6-up, or custom grid geometries with interactive key/click handlers.
5. `ModuleMainGrid.tsx`: Canonical 2-column grid (`.bookings-main-grid`) with `ModulePrimaryColumn` (`.bookings-list-column`) and `ModuleInspectorColumn` (`.bookings-inspector-column`).
6. `ModulePrimaryCard.tsx`: White operational card surface (`.bookings-list-card`) with border, shadow, and radius.
7. `ModuleTabs.tsx`: In-card horizontal tab strip with full keyboard navigation (Arrow keys, Home, End), ARIA attributes (`role="tablist"`, `role="tab"`, `aria-selected`), and badge counts.
8. `ModuleToolbar.tsx`: Standard toolbar container (`.bookings-toolbar-container`) with `role="toolbar"`.
9. `ModuleDataGridFrame.tsx`: Scrollable full-width table wrapper (`.bookings-datagrid-wrapper`) and table primitive (`.bookings-table`).
10. `ModulePagination.tsx`: Standard pagination footer (`.bookings-table-footer`) with record counts, page size select, and prev/next page buttons.
11. `ModuleInspectorFrame.tsx`: Context inspector shell (`.booking-inspector-card.active` / `.booking-inspector-card.empty`) and `ModuleInspectorEmptyState`.
12. `ModuleLoadingState.tsx`: Canonical skeleton loading geometry (`.bookings-loading-state`) reflecting real workspace layout.
13. `ModuleStateMessage.tsx`: Error banner with retry trigger (`ModuleErrorBanner`) and dismissible notice banner (`ModuleSuccessBanner`).
14. `index.ts`: Clean export barrel.

---

## 3. CSS Strategy & Selector Ownership

- **Legacy Selector Encapsulation**: Existing CSS classes (`bookings-main-grid`, `bookings-list-column`, `bookings-inspector-column`, `bookings-list-card`, `bookings-scope-tabs-container`, `bookings-toolbar-container`, `bookings-datagrid-wrapper`, `bookings-table`, `booking-inspector-card`) are encapsulated as internal implementation details of the canonical workspace components.
- **Zero CSS Renaming**: No global CSS rename was performed, eliminating regression risk.
- **No Second Token File**: Preserved all existing theme color, spacing, and font tokens in `src/styles.css`.

---

## 4. Bookings & Staff Migration Summary

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
- **Behavior Preservation**: All 6 tabs (`Roster`, `Schedule`, `Applications`, `Performance`, `Capabilities`, `Roles`), persistent `selectedStaffId`, isolated `selectedApplicationId`, full-width tables, and modals remain completely intact.

---

## 5. Customers & Placeholder Integrity

- **Customers Module**: Unmodified in functional behavior. Compatible with `ModuleWorkspaceHost`. No redesign.
- **Placeholder Modules**: Today, Attendance, Schedule, Home Service, and Settings remain truthful empty states: _"This module is not yet available in the desktop client."_ No fake data.
- **Module Lifecycle**: Only the active domain controller runs; inactive modules unmount cleanly. No speculative caching or background DOM keeping.

---

## 6. Verification & Automated Test Results

All 14 test suites and 288 tests pass cleanly:

```bash
pnpm format:check  # PASS (All matched files use Prettier code style)
pnpm lint          # PASS (0 errors, 0 warnings)
pnpm typecheck     # PASS (tsc --noEmit exited 0)
pnpm test          # PASS (14 test files, 288 tests passed)
pnpm build         # PASS (vite v8.2.2 client bundle built in 1.15s)
git diff --check   # PASS (clean diff)
```

### Test Suite Summary:

- `tests/workspace-components.test.tsx`: 16 focused tests for all canonical workspace primitives.
- `tests/bookings-components.test.tsx`: 15 Bookings UI tests.
- `tests/bookings-service.test.ts`: 33 Bookings service tests.
- `tests/staff-components.test.tsx`: 18 Staff UI tests.
- `tests/staff-service.test.ts`: 62 Staff service tests.
- `tests/customers-components.test.tsx`: 10 Customers UI tests.
- `tests/customers-service.test.ts`: 19 Customers service tests.
- `tests/components.test.tsx`: 19 Stage 01/Shell UI tests.
- `tests/auth-service.test.ts`: 15 Auth service tests.
- `tests/booking-preview.test.tsx`: 42 Booking preview tests.
- `tests/booking-options.test.ts`: 16 Booking options tests.
- `tests/boundary.test.ts`: 6 Desktop boundary tests.
- `tests/hosted-json-response.test.ts`: 12 Envelope tests.
- `tests/roles.test.ts`: 5 Role helper tests.

---

## 7. Security & Data Impact

- No database migrations, schemas, or RPCs touched.
- No changes to canonical hosted repository `https://github.com/techwithmpg/Cradlehub`.
- No privileged secrets or backend credentials introduced to renderer code.

---

## 8. Rollback Point

- **Rollback Target SHA**: `9bd83ab8f05ace193d026de896b70f3a4eff363d` (accepted `main` baseline).

---

## 9. Next Work

- **Schedule has NOT started and is NOT part of Stage 05.**
- Next stage will be scheduled only upon explicit owner authorization and review.
