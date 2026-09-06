# Stage 03 — Customers Contract Audit & Hosted Boundary Requirement

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 03 — Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Hosted Canonical Main SHA**: `f8455078d212b55595c277c577a80d89995c7585`
- **Current Status**: **STAGE 03 CUSTOMER CONTRACT AUDITED — SAFE HOSTED CUSTOMER READ BOUNDARY REQUIRED — NO UNSAFE DESKTOP READ IMPLEMENTED — STOPPED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Hosted Customer Contract Audit

Inspection of current hosted `main` (`f8455078d212b55595c277c577a80d89995c7585`) identified the following system truths:

### A. Database Schema & Privacy Architecture

1. **No `branch_id` on `customers` table**: The `customers` table (`id`, `full_name`, `phone`, `email`, `total_bookings`, `first_booking_date`, `last_booking_date`, `preferred_staff_id`, `notes`, etc.) is global at the database level and contains no `branch_id` column.
2. **Authoritative Scoping via Bookings**: In the hosted CRM (`src/lib/queries/customers.ts`), branch scoping is derived dynamically by querying `bookings.customer_id` for bookings belonging to the active `branch_id` (`branchCustomerIds(supabase, branchId)`).
3. **Privacy Invariant**: Client-side filtering in the Desktop renderer after executing `supabase.from("customers").select()` would leak customer names, phone numbers, and notes across all branches to non-owner front-desk staff. Direct renderer queries against the `customers` table are strictly forbidden.

### B. Existing Hosted API Endpoints

1. `GET /api/customers/lookup`: Uses web cookie authentication (`createClient()`); queries `lookupCustomerByPhone` without branch scoping. Not bearer-authenticated, not safe for Desktop.
2. `GET /api/customers/search`: Uses web cookie authentication (`createClient()`); performs branch-scoped search only for web sessions. Not bearer-authenticated.
3. `POST /api/desktop/v1/bookings`: The only existing Desktop v1 endpoint (Stage 02 booking creation boundary).
4. **Conclusion**: Zero Desktop-safe, Bearer-authenticated endpoints exist for customer list, customer search, segments (`repeat`, `lapsed`, `followup`), KPI statistics, or customer profile / booking history.

---

## 2. Proposed Minimum Hosted Customer Read Boundary

To enable Stage 03 Desktop customer capabilities without compromising cross-branch privacy or role authorization, the hosted server requires a dedicated Desktop API boundary under `/api/desktop/v1/customers`:

### Endpoint 1: `GET /api/desktop/v1/customers`

- **Authentication**: `Authorization: Bearer <token>` verified via `verifyDesktopBearerAuth(request)`.
- **Authorization**:
  - Staff must be active with CRM workspace access (`canAccessCrmWorkspace(role)`: `owner`, `manager`, `crm`).
  - Non-owners are strictly scoped to `staff.branch_id`.
  - Owners may provide an optional `branchId` query parameter or query across all branches.
- **Query Parameters**:
  - `tab`: `all` (default) | `repeat` | `lapsed` | `followup`
  - `q`: optional search string (filters `full_name` and `phone`)
  - `page`: positive integer (default `1`)
  - `pageSize`: positive integer (default `25`, max `100`)
- **Server Execution**:
  - Leverages existing server query logic (`getCustomersPage`, `getRepeatCustomers`, `getLapsedCustomers`, `getCrmStats`, `getWaitlistAction`).
  - Executes server-side `branchCustomerIds` to scope results before returning records to Desktop.
- **Success Response (HTTP 200)**:
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "uuid",
        "fullName": "Customer Name",
        "phone": "09171234567",
        "email": "customer@example.com",
        "totalBookings": 5,
        "firstBookingDate": "2026-01-10",
        "lastBookingDate": "2026-09-01",
        "preferredStaffId": "uuid",
        "preferredStaffName": "Therapist Name",
        "notes": "Prefers medium pressure"
      }
    ],
    "page": 1,
    "pageSize": 25,
    "total": 42,
    "totalPages": 2,
    "kpiData": {
      "totalCustomers": 42,
      "repeatClients": 18,
      "lapsedClients": 7,
      "newThisMonth": 5,
      "totalVisits": 128
    }
  }
  ```

### Endpoint 2: `GET /api/desktop/v1/customers/[customerId]`

- **Authentication**: `Authorization: Bearer <token>` verified via `verifyDesktopBearerAuth(request)`.
- **Authorization**:
  - Server verifies that the requested customer has at least one booking at the caller's assigned `branch_id` (or caller is `owner`).
  - Returns HTTP 403 `CRM_BRANCH_FORBIDDEN` or HTTP 404 `CUSTOMER_NOT_FOUND` if outside authorized branch.
- **Success Response (HTTP 200)**:
  ```json
  {
    "ok": true,
    "customer": {
      "id": "uuid",
      "fullName": "Customer Name",
      "phone": "09171234567",
      "email": "customer@example.com",
      "firstBookingDate": "2026-01-10",
      "lastBookingDate": "2026-09-01",
      "totalBookings": 5,
      "notes": "Prefers medium pressure",
      "preferredStaffId": "uuid",
      "preferredVisitType": "in_spa",
      "pressurePreference": "medium",
      "healthNotes": "None",
      "birthday": "1990-05-15",
      "loyaltyTier": "regular"
    },
    "bookings": [
      {
        "id": "uuid",
        "bookingDate": "2026-09-01",
        "startTime": "14:00",
        "status": "completed",
        "type": "walkin",
        "serviceName": "Signature Massage",
        "staffName": "Therapist Name",
        "branchName": "Bacolod Main",
        "pricePaid": 850
      }
    ]
  }
  ```

---

## 3. Desktop UI Architecture & Canonical Reuse

When the safe hosted boundary is available, Stage 03 Desktop Customers will directly reuse the established canonical UI system from Stages 01–02:

1. **Canonical Shell**: Identical layout, top bar, avatar menu, branch switcher, and active session indicators.
2. **Workspace Hierarchy**:
   - `CustomersHeader`: Clean title + operational subtitle.
   - `CustomersKpiSummary`: 5 canonical metric cards (Total Customers, Repeat Clients, Lapsed Clients, New This Month, Total Visits).
   - `CustomerSegmentTabs`: 4 canonical tabs (`All`, `Repeat`, `Lapsed`, `Follow-up`).
   - `CustomersFilterToolbar`: Live debounced search input + filter reset.
   - `CustomersListCard`: Canonical compact DataGrid with sorting, pagination, and row inspection selection.
   - `CustomerInspectorCard`: Sticky right-side panel with profile overview, contact details, loyalty tier, visit summary, notes, and booking history.
3. **No Second UI System**: Zero new CSS frameworks or competing design tokens.

---

## 4. Current Desktop Scope & Pre-Boundary Safety

- **Zero Unsafe Queries**: No direct `supabase.from("customers")` reads implemented in the Desktop renderer.
- **Booking Customer Lookup**: Retains safe `CUSTOMER_LOOKUP_UNAVAILABLE` limitation until the branch-scoped hosted read boundary is implemented and verified.
- **No Mock / Fake Customer Data**: No mock customer records or synthetic KPIs introduced into normal runtime.

---

## 5. Verification Checks

- `pnpm format:check` — PASSED
- `pnpm lint` — PASSED (`--max-warnings 0`)
- `pnpm typecheck` — PASSED (`tsc --noEmit`)
- `pnpm test` — PASSED (8 test files, 157 tests passed)
- `pnpm build` — PASSED (Vite production bundle built cleanly)
- `cargo fmt --check; cargo check --locked; cargo test --locked; cargo clippy --locked --all-targets -- -D warnings` — PASSED
- `git diff --check` — PASSED

---

## 6. Limitations & Next Steps

- **Blocked on Hosted Boundary**: Stage 03 Desktop customer read integration is blocked pending implementation of the authoritative hosted customer boundary (`/api/desktop/v1/customers` on `https://github.com/techwithmpg/Cradlehub`).
- **Stage 04 Status**: Stage 04 (Staff) remains **NOT STARTED / NOT AUTHORIZED**.
- **Rollback Baseline**: Stage 02 accepted baseline on Desktop `main` is `59f69fc7e321c32f040f6f9a79aca47e77547675`.
