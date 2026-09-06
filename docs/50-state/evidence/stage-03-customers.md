# Stage 03 — Customers Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 03 Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`
- **Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`
- **Hosted Dependency**: `techwithmpg/Cradlehub` `main` at `653f4d0ba04f1af76a7006209a74e40022d7de84`
- **Current Status**: **STAGE 03 DESKTOP CUSTOMERS IMPLEMENTED AND PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER VISUAL INSPECTION — NO MERGE — STAGE 04 NOT STARTED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Summary of Changes

Stage 03 implements the real Desktop Customers module (visual + functional vertical slice) strictly against the hosted Desktop Customer API merged into `techwithmpg/Cradlehub` (`653f4d0ba04f1af76a7006209a74e40022d7de84`):

1. **Customers Service (`src/lib/customers-service.ts`)**:
   - Implements `fetchBranchCustomers({ branchId, tab, q, page, pageSize })` targeting `GET /api/desktop/v1/customers`.
   - Implements `fetchCustomerDetail(customerId, branchId)` targeting `GET /api/desktop/v1/customers/[customerId]`.
   - Uses `@tauri-apps/plugin-http` with Bearer token authentication retrieved from Supabase session (`getSupabaseClient().auth.getSession()`).
   - Strict error normalization (401 session expired, 403 forbidden, 404 not found, 400 bad request, 500 server error, network failure).
   - Zero token logging or exposure in error strings.

2. **Stage 02 Customer Lookup Re-enabled (`src/lib/bookings-service.ts`, `src/components/bookings/NewBookingModal.tsx`)**:
   - Replaced temporary lookup placeholder throwing unavailable error with real call to `GET /api/desktop/v1/customers?tab=all&q=<query>&branchId=<branchId>&page=1&pageSize=20`.
   - Mapped hosted camelCase `CustomerListItem` DTO fields to `BookingCustomer` (`fullName` -> `full_name`, `totalBookings` -> `total_bookings`, etc.).
   - Removed fixed unavailable warning; preserved truthful network and server errors.

3. **Canonical UI Workspace (`src/components/customers/`)**:
   - **`CustomersHeader.tsx`**: Canonical header ("Customers", operational subtitle, refresh button). No fake "New Customer" button.
   - **`CustomersKpiSummary.tsx`**: 5 canonical KPI metrics (Total Customers, Repeat Clients, Lapsed Clients, New This Month, Total Visits) with tab switching integration. Excludes financial/revenue metrics.
   - **`CustomersListCard.tsx`**:
     - 4 canonical tabs (`All`, `Repeat`, `Lapsed`, `Follow-up`).
     - Debounced live search input (300ms) with search reset control.
     - Customer DataGrid for normal records: columns `Customer`, `Phone`, `Email`, `Visits`, `First Visit`, `Last Visit`, `Preferred Staff`.
     - Follow-up DataGrid for waitlist records: columns `Customer`, `Phone`, `Service`, `Preferred Date`, `Preferred Time`, `Visit Type`, `Status`.
     - Pagination controls with total count and page range indicator.
   - **`CustomerInspectorCard.tsx`**:
     - Overview tab: contact identity, loyalty tier, visit summary, preferences (visit type, pressure), birthday, operational notes, health considerations.
     - History tab: operational booking history (date, time, status, type, service, staff, branch). Excludes prices and payments.
     - Follow-up Inspector: truthful waitlist request details (service, therapist, date/time preferences, request notes, contact details).
   - **`CustomersView.tsx`**:
     - Root workspace coordinator with branch scoping from `useAuth()`.
     - Request version refs (`listVersionRef`, `detailVersionRef`) preventing async race conditions across tabs, searches, and pagination.
     - Comprehensive UI states: loading skeletons, empty branch, search empty, network error, 401/403/400/500 banners, selection clearing.

4. **Canonical Shell Integration (`src/components/CanonicalShell.tsx`)**:
   - Connected `CustomersView` to the `customers` nav item with wide operational canvas modifier (same width & density treatment as Bookings).

---

## 2. Changed Files vs Baseline

Implementation changes vs accepted `main` (`59f69fc7e321c32f040f6f9a79aca47e77547675`):

### Source & Components

1. `src/types/customers.ts` (NEW) — Complete TypeScript types and DTO definitions for customer list, KPIs, pagination, detail, and follow-up items.
2. `src/lib/customers-service.ts` (NEW) — Authoritative HTTP transport client for hosted customer list and detail endpoints.
3. `src/lib/bookings-service.ts` (MODIFIED) — Re-enabled customer lookup against hosted API; removed unavailable placeholder.
4. `src/components/bookings/NewBookingModal.tsx` (MODIFIED) — Updated customer search call to pass required `branchId`.
5. `src/components/customers/CustomersHeader.tsx` (NEW) — Header component.
6. `src/components/customers/CustomersKpiSummary.tsx` (NEW) — 5-metric KPI strip.
7. `src/components/customers/CustomersListCard.tsx` (NEW) — Tabbed customer & follow-up DataGrid with search & pagination.
8. `src/components/customers/CustomerInspectorCard.tsx` (NEW) — Right-side customer & follow-up inspector.
9. `src/components/customers/CustomersView.tsx` (NEW) — Root coordinator view.
10. `src/components/CanonicalShell.tsx` (MODIFIED) — Render `CustomersView` for `customers` module.
11. `src/styles.css` (MODIFIED) — Customer workspace CSS classes matching canonical design tokens.

### Tests

12. `tests/customers-service.test.ts` (NEW) — 7 unit tests for transport, query parameters, auth headers, 401/403 errors, network failure, and DTO parsing.
13. `tests/customers-components.test.tsx` (NEW) — 6 integration tests for component rendering, KPI cards, inspector tabs, search debouncing, waitlist follow-up, and CanonicalShell integration.
14. `tests/booking-options.test.ts` (MODIFIED) — Updated lookup test expectations for enabled hosted boundary.
15. `tests/booking-preview.test.tsx` (MODIFIED) — Updated modal lookup lifecycle test expectations.

### Documentation & State

16. `docs/50-state/CURRENT_STATE.md`
17. `docs/50-state/CURRENT_TASK.md`
18. `docs/50-state/HANDOFF.md`
19. `docs/50-state/LAST_VERIFIED_GATE.md`
20. `docs/50-state/evidence/stage-03-customers.md`

---

## 3. Verification & Test Results

All verification suites executed and verified green:

| Check                     | Command             | Result                                            |
| ------------------------- | ------------------- | ------------------------------------------------- |
| Prettier Formatter        | `pnpm format:check` | PASSED (All matched files match style)            |
| ESLint Linter             | `pnpm lint`         | PASSED (0 errors, 0 warnings)                     |
| TypeScript Compiler       | `pnpm typecheck`    | PASSED (`tsc --noEmit` clean)                     |
| Vitest Unit & Integration | `pnpm test`         | PASSED (10 test files, 163 tests passed)          |
| Production Build          | `pnpm build`        | PASSED (Vite production bundle generated cleanly) |
| Git Whitespace Check      | `git diff --check`  | PASSED (0 whitespace/conflict errors)             |

### Test Breakdown by File

- `tests/roles.test.ts` — 5 tests passed
- `tests/auth-service.test.ts` — 15 tests passed
- `tests/customers-service.test.ts` — 7 tests passed
- `tests/booking-options.test.ts` — 14 tests passed
- `tests/bookings-service.test.ts` — 34 tests passed
- `tests/boundary.test.ts` — 6 tests passed
- `tests/customers-components.test.tsx` — 6 tests passed
- `tests/bookings-components.test.tsx` — 15 tests passed
- `tests/components.test.tsx` — 19 tests passed
- `tests/booking-preview.test.tsx` — 42 tests passed

**Total: 163 tests passed across 10 test files.**

---

## 4. Runtime Evidence Status

```
OWNER-PROVIDED MANUAL RUNTIME EVIDENCE:
NONE YET
```

- Runtime visual inspection requires owner manual confirmation on live Desktop environment.
- Service and components are fully verified against mock and integration harnesses with zero regressions.

---

## 5. Security & Privacy Invariants

- **No Direct Table Queries**: The renderer never executes direct `supabase.from("customers")` or `supabase.from("waitlist_requests")` queries.
- **No Customer Writes**: Customer creation, editing, notes mutation, and deletion remain strictly excluded.
- **No Financial Data**: Zero revenue, spend, pricing, or payment details are queried, returned, or rendered.
- **No Local Persistence**: Customer records and health notes are never stored in localStorage, IndexedDB, or SQLite.
- **No Bearer Token Logging**: Bearer tokens are kept in-memory per request and never logged or exposed in error messages.
- **Branch Privacy Enforced**: Server-side scoping through hosted customer engine enforces branch isolation for non-owners.

---

## 6. Limitations & Rollback Plan

- **Limitations**:
  - Read-only slice; customer profile editing and new customer creation are not in Stage 03 scope.
  - Follow-up waitlist actions (e.g. converting waitlist to booking) are not in Stage 03 scope.
- **Rollback**:
  - Desktop `main` baseline is `59f69fc7e321c32f040f6f9a79aca47e77547675`.
  - Revert branch with: `git reset --hard 59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Stage 04 Status**: Stage 04 (Staff) is **NOT STARTED / NOT AUTHORIZED**.
