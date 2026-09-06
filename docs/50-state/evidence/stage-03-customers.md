# Stage 03 — Customers Contract Audit & Hosted Boundary Requirement

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 03 — Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Audited Stage Snapshot HEAD_SHA**: `2ec15ddf0600ac93b796118d14263781d5b43341`
- **Hosted Canonical Main SHA**: `f8455078d212b55595c277c577a80d89995c7585`
- **Current Status**: **STAGE 03 CUSTOMER CONTRACT AUDITED — SAFE HOSTED CUSTOMER READ BOUNDARY REQUIRED — NO UNSAFE DESKTOP READ IMPLEMENTED — STOPPED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Hosted Customer Contract Audit & Authority Findings

Inspection of current hosted `main` (`f8455078d212b55595c277c577a80d89995c7585`) established the following repository implementation truths:

### A. Database Schema & Privacy Architecture

1. **No `branch_id` on `customers` Table**: The `customers` table is global at the database schema level and does not contain a `branch_id` column.
2. **Dynamic Scoping via Bookings in List Queries**: In hosted CRM list queries (`src/lib/queries/customers.ts`), branch scoping is derived dynamically via `branchCustomerIds(supabase, branchId)` by selecting distinct `customer_id` values from `bookings` for the given `branch_id`.
3. **Renderer Invariant**: Direct `supabase.from("customers")` queries from the Desktop renderer are strictly prohibited. Client-side branch filtering in React would leak all customer records across branches to non-owner front-desk staff.

### B. Customer Profile Read Scoping Gap

1. **Source Inspection (`src/app/(dashboard)/crm/actions.ts` & `src/lib/queries/customers.ts`)**:
   - `getCustomerProfileAction(customerId)` calls `requireCrmAccess()` (verifying CRM role).
   - However, it then calls `getCustomerById(customerId)` and `getBookingsByCustomer(customerId)` without passing or applying `ctx.branchId` to either query.
   - `getBookingsByCustomer(customerId)` in `src/lib/queries/bookings.ts` filters by `customer_id` but does not add a `branch_id` predicate.
2. **Implication for Desktop**:
   - The existing hosted web profile action is CRM-authenticated for web sessions, but repository source does not demonstrate branch-scoped authorization for a supplied `customerId`.
   - This action **MUST NOT** be reused directly as the Desktop authorization boundary.
   - The proposed Desktop detail endpoint (`GET /api/desktop/v1/customers/[customerId]`) must explicitly verify branch membership and filter booking history server-side before returning data.

### C. Customer Write & Mutation Authority

1. **Update Action (`updateCustomerAction` in `src/app/(dashboard)/crm/actions.ts`)**:
   - Validates input against `updateCustomerSchema` (`fullName`, `phone`, `email`, `notes`, `preferredStaffId`, `preferredVisitType`, `pressurePreference`, `healthNotes`, `birthday`, `loyaltyTier`).
   - Executes `ctx.supabase.from("customers").update(...).eq("id", customerId)` without a booking-derived branch membership check in application source.
   - Static source alone does not establish cross-branch write authorization for arbitrary `customerId` values.
   - **Conclusion**: Customer writes remain **OUT OF SCOPE** for the Desktop Stage 03 read slice. No direct renderer writes or unverified mutation actions will be called.
2. **Create Action (`createCustomerAction`)**:
   - Calls admin RPC `upsert_customer(p_phone, p_full_name, p_email)` which creates or upserts a global customer identity.
   - Does not itself establish customer-to-branch membership; branch relationship is established only upon creating a booking.

### D. Existing Web Search & Lookup Routes

1. **`GET /api/customers/search`**:
   - Cookie/web session authenticated (`createClient()`).
   - Resolves staff profile, verifies CRM role, and passes `branchId` for non-owners (`null` for owners).
   - Not Bearer-authenticated for Desktop.
2. **`GET /api/customers/lookup`**:
   - Cookie/web session authenticated (`createClient()`).
   - Performs global phone lookup (`lookupCustomerByPhone`) without CRM role verification or branch scoping.
   - Unsuitable as a Desktop customer lookup boundary.

### E. Follow-Up & Waitlist Architecture

1. **`getWaitlistAction` (`src/app/(dashboard)/crm/waitlist/actions.ts`)**:
   - Web Server Action that invokes `createClient()`, authenticates via web cookies, and evaluates its own CRM context and branch rules.
   - The Desktop Bearer API **MUST NOT** call cookie-based Server Actions like `getWaitlistAction` directly.
   - The hosted platform must extract a server-only waitlist query helper accepting an authorized client and effective branch context, or implement a dedicated Bearer-authenticated boundary.
2. **Owner Semantics**:
   - In customer queries, owner `branchId=null` represents all branches, whereas waitlist logic expects a concrete branch.
   - For Desktop Stage 03, owner behavior will default to the currently selected authorized Desktop branch context, while non-owners are strictly locked to their assigned branch.

---

## 2. Minimum Hosted Customer Read Boundary Proposal

To enable Desktop customer functionality with strict server-side authorization and branch privacy, the hosted repository requires a dedicated, Bearer-authenticated server-only boundary under `/api/desktop/v1/customers`:

### Architecture

- **Bearer Authentication**: Uses existing `verifyDesktopBearerAuth(request)` from `src/lib/auth/desktop-bearer-auth.ts`.
- **Server-Only Read Helper**: A shared domain helper (`src/lib/customers/desktop-customer-engine.ts`) receiving:
  1. Authenticated user-scoped Supabase client
  2. Verified operator context (`authUserId`, `staff`, `staffRole`, `isDevBypass: false`)
  3. Effective branch context (enforced staff `branch_id` for non-owners; selected/active branch for owners)
  4. Validated query parameters

### Endpoint 1: `GET /api/desktop/v1/customers`

- **Purpose**: Paginated customer list, segment tabs, live search, and KPI statistics.
- **Query Parameters**:
  - `tab`: `all` (default) | `repeat` | `lapsed` | `followup`
  - `q`: optional search string (filters `full_name` and `phone`)
  - `page`: validated positive integer (default `1`)
  - `pageSize`: validated, capped integer (default `25`, max `100`)
  - `branchId`: optional branch override permitted only for verified `owner`
- **Data Minimization (List Rows)**:
  - Rows contain strictly fields required for the DataGrid: `id`, `fullName`, `phone`, `email` (if present), `totalBookings`, `firstBookingDate`, `lastBookingDate`, `preferredStaffId`, `preferredStaffName`.
  - Sensitive profile fields (`healthNotes`, detailed notes, `birthday`, preferences) are omitted from list rows.
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
        "preferredStaffName": "Therapist Name"
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

- **Purpose**: Single customer detail and booking history for the right-side inspector.
- **Authorization & Server Scoping**:
  - Non-owner: Server verifies customer has at least one booking at operator's assigned `branch_id`. If not, returns HTTP 404 / 403.
  - Returns only booking history rows associated with the authorized branch.
- **Exclusion of Dormant Finance/Payments Scope**:
  - Booking history returns operational fields only (`id`, `bookingDate`, `startTime`, `status`, `type`, `serviceName`, `staffName`, `branchName`).
  - Zero financial fields (`pricePaid`, `totalRevenue`, `averageSpend`, payment references) are exposed in Stage 03 Desktop responses.
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
        "branchName": "Bacolod Main"
      }
    ]
  }
  ```

### Reusable Search Boundary

- The `q` query parameter on `GET /api/desktop/v1/customers` provides the single authoritative, branch-scoped search boundary to be reused by the Stage 02 New Booking modal once implemented.

---

## 3. Desktop UI Scope & Canonical Reuse

- **Canonical UI System**: 100% reuse of Stages 01–02 design tokens, shell, cards, DataGrid, tabs, and right-side inspector.
- **Workspace Hierarchy**:
  1. `CustomersHeader`: Clean title + operational subtitle.
  2. `CustomersKpiSummary`: 5 canonical metric cards (Total Customers, Repeat Clients, Lapsed Clients, New This Month, Total Visits).
  3. `CustomerSegmentTabs`: 4 canonical tabs (`All`, `Repeat`, `Lapsed`, `Follow-up`).
  4. `CustomersFilterToolbar`: Live debounced search input + filter reset.
  5. `CustomersListCard`: Canonical DataGrid with sorting, pagination, and row inspection selection.
  6. `CustomerInspectorCard`: Sticky right-side profile and operational history inspector.
- **Zero Financial Surfaces**: Excludes revenue, payment methods, prices, or financial totals.

---

## 4. Complete Changed Files in Stage 03 (Audit Pass)

Changed files vs accepted `main` (`59f69fc7e321c32f040f6f9a79aca47e77547675`) from `git diff --name-only origin/main...HEAD`:

1. `docs/50-state/CURRENT_STATE.md`
2. `docs/50-state/CURRENT_TASK.md`
3. `docs/50-state/HANDOFF.md`
4. `docs/50-state/LAST_VERIFIED_GATE.md`
5. `docs/50-state/evidence/stage-03-customers.md`

---

## 5. Verification Checks

### PREVIOUSLY VERIFIED MAIN BASELINE CHECKS (Stage 02 Closeout on Main)

- `pnpm format:check` — PASSED
- `pnpm lint` — PASSED (`--max-warnings 0`)
- `pnpm typecheck` — PASSED (`tsc --noEmit`)
- `pnpm test` — PASSED (8 test files, 157 vitest tests passed)
- `pnpm build` — PASSED (Vite production bundle built cleanly)
- `cargo fmt --check; cargo check --locked; cargo test --locked; cargo clippy --locked --all-targets -- -D warnings` — PASSED (100% Rust backend clean)

### STAGE 03 AUDIT-PASS CHECKS ACTUALLY RUN

- `pnpm prettier --check docs/50-state/evidence/stage-03-customers.md docs/50-state/CURRENT_STATE.md docs/50-state/CURRENT_TASK.md docs/50-state/HANDOFF.md docs/50-state/LAST_VERIFIED_GATE.md` — PASSED
- `git diff --check` — PASSED (0 whitespace or conflict marker errors)
- `git diff --name-only` — PASSED (only the 5 documentation files listed above)

---

## 6. Runtime Evidence Status

**NO OWNER-PROVIDED MANUAL RUNTIME EVIDENCE FOR STAGE 03 YET — THIS PASS IS CONTRACT AUDIT / DOCUMENTATION ONLY.**

---

## 7. Security & Data Impact

- Zero source code changes in `src/**` or `src-tauri/**`.
- Zero database mutations, schema changes, RLS changes, or migrations.
- No live bookings or customer records created or modified.
- No secrets exposed.
- Direct unsafe queries to `customers` table avoided.

---

## 8. Limitations & Rollback Plan

- **Limitations**: Desktop customer read integration is blocked until the hosted Bearer customer read boundary is implemented and reviewed on `https://github.com/techwithmpg/Cradlehub`. Customer writes and notes editing remain disabled.
- **Rollback**: Desktop `main` baseline is `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Stage 04 Status**: Stage 04 (Staff) remains **NOT STARTED / NOT AUTHORIZED**.
