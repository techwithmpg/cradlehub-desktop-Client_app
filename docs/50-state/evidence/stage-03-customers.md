# Stage 03 — Customers Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 03 Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`
- **Original Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`
- **Original Evidence HEAD**: `a29bbe1021e369314611195696bdaa1f7d034e36`
- **Correction Implementation HEAD**: `91697fdf6c533c3c3833e8bf3e271a90079b336f`
- **Hosted Dependency**: `techwithmpg/Cradlehub` `main` at `653f4d0ba04f1af76a7006209a74e40022d7de84`
- **Current Status**: **STAGE 03 CUSTOMERS RUNTIME CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER VISUAL RE-TEST — NO MERGE — STAGE 04 NOT STARTED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Owner-Observed Runtime Defects & Corrections

### Owner Visual/Runtime Evidence (2026-09-06)

The owner inspected the native Windows Desktop Customers runtime and observed:

1. **Layout Misalignment**: Customers list and inspector were stacked vertically rather than side-by-side in the operational two-column layout.
2. **Missing Canonical DataGrid & Pagination Styling**: DataGrid container and pagination footer used non-canonical class names resulting in raw inline text and unstyled controls.
3. **KPI Grid Gap**: 5 customer metrics were rendered inside the 6-column `bookings-kpi-grid`, leaving a large unused 6th slot.
4. **Configuration Error**: Native runtime displayed `Customer Service Error: Customer service is not configured for this desktop installation.` because `getHostedApiBaseUrl()` returned `null` when `VITE_CRADLEHUB_API_URL` was unset.
5. **Misleading Error State**: When customer service failed, the UI simultaneously displayed zero KPI values and `"No customers in this segment"`, masquerading as an empty success state rather than an authoritative failure.

### Applied Corrections

1. **Two-Column Layout (`src/components/customers/CustomersView.tsx`, `src/styles.css`)**:
   - Switched root wrapper to canonical `bookings-main-grid` with `bookings-list-column` and `bookings-inspector-column`.
   - Added scoped modifier `.customers-view-container .bookings-main-grid { grid-template-columns: minmax(0, 1fr) 360px; }`.
   - Added responsive breakpoint `@media (max-width: 1024px)` collapsing to 1 column and unsticking inspector.

2. **5-Column KPI Strip (`src/components/customers/CustomersKpiSummary.tsx`, `src/styles.css`)**:
   - Reused canonical KPI card structure with scoped modifier `bookings-kpi-grid customers-kpi-grid`.
   - Added `.customers-kpi-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }` with responsive 3-column (<=1024px) and 2-column (<=640px) adaptation without clipping.

3. **Canonical DataGrid & Pagination Classes (`src/components/customers/CustomersListCard.tsx`)**:
   - Replaced `bookings-table-container` with canonical `bookings-datagrid-wrapper`.
   - Reused canonical empty state family: `bookings-table-empty-state`, `bookings-empty-icon-circle`, `bookings-empty-heading`, `bookings-empty-text`, and `bookings-empty-reset-btn`.
   - Customer cells use `customer-cell`, `customer-avatar-pill`, `customer-info`, `customer-name`, `customer-subtext`.
   - Replaced custom pagination with canonical Bookings footer: `bookings-table-footer`, `footer-count-text`, `count-highlight`, `footer-pagination-controls`, `page-size-selector-wrapper`, `page-size-label`, `page-size-select`, `pagination-buttons`, `pagination-btn`, `pagination-page-indicator`.

4. **Public Hosted Origin Fallback (`src/lib/bookings-service.ts`)**:
   - Modified `getHostedApiBaseUrl()`: when `VITE_CRADLEHUB_API_URL` is missing, blank, or `'undefined'`, it returns `EXPECTED_HOSTED_API_ORIGIN` (`https://www.cradlewellnessliving.com`).
   - Explicit overrides continue through strict validation `validateHostedApiBaseUrl()` rejecting non-HTTPS, credentials, or mismatched origins (fail-closed).
   - Tauri HTTP capability remains strictly restricted to `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

5. **Authoritative Error Handling & Lifecycle (`src/components/customers/CustomersView.tsx`)**:
   - When authoritative list request fails (`listError`), normal KPI grid and DataGrid are suppressed.
   - Rendered error banner with Retry button and `workspace-placeholder` with `"Customer Service Unavailable"` (no dismiss X, no fake zero KPIs, no fake empty state).
   - Clears stale customer and detail state on error; detail selection resets old detail and sets loading before fetch.

6. **Contract & DTO Alignment**:
   - **Search Response Contract (`src/lib/bookings-service.ts`)**: Fixed `searchBranchCustomers` to parse top-level `body.data` array and map camelCase DTO fields (`totalBookings`, `firstBookingDate`, `lastBookingDate`).
   - **Search Placeholders (`src/components/customers/CustomersListCard.tsx`)**: Truthful placeholders: `"Search customers by name or phone..."` (no email claim) and `"Search follow-up requests by name or phone..."` (no service claim).
   - **KPI Semantic Copy (`src/components/customers/CustomersKpiSummary.tsx`)**: Truthful descriptions: Total Customers (`"Branch customer roster"`), Repeat Clients (`"2+ recorded visits"`), Lapsed Clients (`"No visit in 30+ days"`), New This Month (`"First visit this month"`), Total Visits (`"Aggregate recorded visits"`).
   - **DTO Cleanup (`src/types/customers.ts`, `src/components/customers/CustomerInspectorCard.tsx`)**: Removed unreturned email row from follow-up inspector; loyalty tier read from `customerDetail?.loyaltyTier`; booking history type read from `item.type`.

---

## 2. Changed Files vs Baseline

Correction changes across `stage/03-customers`:

### Source & Components

1. `src/components/customers/CustomersView.tsx` — Two-column layout grid, truthful error suppression, detail lifecycle.
2. `src/components/customers/CustomersListCard.tsx` — Canonical DataGrid wrapper, empty state, avatar cell hierarchy, footer/pagination, truthful search copy.
3. `src/components/customers/CustomersKpiSummary.tsx` — 5-column grid class, truthful KPI semantic subtext.
4. `src/components/customers/CustomerInspectorCard.tsx` — Cleaned up optional DTO fields (no follow-up email, loyaltyTier from detail, type badge).
5. `src/lib/bookings-service.ts` — Canonical fallback in `getHostedApiBaseUrl`, mapped `searchBranchCustomers` to top-level `body.data` array.
6. `src/styles.css` — Scoped modifier classes for Customers two-column layout and 5-metric KPI grid with responsive breakpoints.
7. `src/types/customers.ts` — DTO type cleanup (removed unused waitlist email and booking history deliveryType).

### Tests

8. `tests/customers-components.test.tsx` — Integration tests for canonical layout, KPI grid, DataGrid wrapper, footer pagination, truthful copy, authoritative error suppression, and detail failure handling.
9. `tests/booking-options.test.ts` — Updated lookup tests for top-level `data` array parsing, session checks, and env cleanup.
10. `tests/bookings-service.test.ts` — Updated config tests for fallback to expected hosted origin when env is missing/blank.

---

## 3. Verification & Test Results

All verification suites executed and verified green:

| Check                     | Command             | Result                                            |
| ------------------------- | ------------------- | ------------------------------------------------- |
| Prettier Formatter        | `pnpm format:check` | PASSED (All matched files match style)            |
| ESLint Linter             | `pnpm lint`         | PASSED (0 errors, 0 warnings)                     |
| TypeScript Compiler       | `pnpm typecheck`    | PASSED (`tsc --noEmit` clean)                     |
| Vitest Unit & Integration | `pnpm test`         | PASSED (10 test files, 166 tests passed)          |
| Production Build          | `pnpm build`        | PASSED (Vite production bundle generated cleanly) |
| Git Whitespace Check      | `git diff --check`  | PASSED (0 whitespace/conflict errors)             |

### Test Breakdown by File

- `tests/roles.test.ts` — 5 tests passed
- `tests/auth-service.test.ts` — 15 tests passed
- `tests/customers-service.test.ts` — 7 tests passed
- `tests/booking-options.test.ts` — 15 tests passed
- `tests/bookings-service.test.ts` — 33 tests passed
- `tests/boundary.test.ts` — 6 tests passed
- `tests/customers-components.test.tsx` — 9 tests passed
- `tests/bookings-components.test.tsx` — 15 tests passed
- `tests/components.test.tsx` — 19 tests passed
- `tests/booking-preview.test.tsx` — 42 tests passed

**Total: 166 tests passed across 10 test files.**

---

## 4. Runtime Evidence Status

```
OWNER-PROVIDED MANUAL RUNTIME EVIDENCE:
2026-09-06:
Owner inspected Stage 03 Customers in real native Windows Desktop runtime.
Observed:
- incorrect stacked layout;
- unstyled/raw empty and pagination region;
- five-KPI/six-column dead space;
- runtime "Customer service is not configured" error.
Result: VISUAL/RUNTIME CORRECTION REQUIRED.
```

**Agent Correction Verification (2026-09-06)**:

- Canonical two-column grid (`minmax(0, 1fr) 360px`) and 5-column KPI grid implemented and verified via automated integration tests and responsive CSS rules.
- Base URL fallback to canonical hosted origin (`https://www.cradlewellnessliving.com`) resolves the native runtime config error while preserving strict validation for explicit overrides.
- Authoritative error states suppress false empty states and zero KPIs.
- Real native Windows Desktop re-test by owner is required for final visual sign-off.

---

## 5. Security & Privacy Invariants

- **No Direct Table Queries**: Renderer never executes direct `supabase.from("customers")` or `supabase.from("waitlist_requests")` queries.
- **No Customer Writes**: Customer creation, editing, notes mutation, and deletion remain strictly excluded.
- **No Financial Data**: Zero revenue, spend, pricing, or payment details are queried, returned, or rendered.
- **No Local Persistence**: Customer records and health notes are never stored in localStorage, IndexedDB, or SQLite.
- **No Bearer Token Logging**: Bearer tokens are kept in-memory per request and never logged or exposed in error messages.
- **Tauri HTTP Capability**: Strictly unchanged; restricted to `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

---

## 6. Limitations & Rollback Plan

- **Limitations**:
  - Read-only slice; customer profile editing and new customer creation are not in Stage 03 scope.
  - Follow-up waitlist actions (e.g. converting waitlist to booking) are not in Stage 03 scope.
- **Rollback**:
  - Desktop `main` baseline is `59f69fc7e321c32f040f6f9a79aca47e77547675`.
  - Revert branch with: `git reset --hard 59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Stage 04 Status**: Stage 04 (Staff) is **NOT STARTED / NOT AUTHORIZED**.
