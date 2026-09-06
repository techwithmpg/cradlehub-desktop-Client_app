# Current Task

Stage 03 — Customers: Contract Audit & Safe Hosted Read Boundary Specification.

**STAGE 03 CUSTOMER CONTRACT AUDITED — SAFE HOSTED CUSTOMER READ BOUNDARY REQUIRED — NO UNSAFE DESKTOP READ IMPLEMENTED — STOPPED.** Stage 04 remains **NOT AUTHORIZED**.

- **Branch**: `stage/03-customers`.
- **BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585`.
- **Desktop Main**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Audit & Next Steps summary:

1. **Privacy Invariant Grounding**: The hosted database `customers` table does not contain `branch_id`. Branch scoping is enforced on the hosted server via `branchCustomerIds(supabase, branchId)` (joining against bookings). Client-side filtering in the Desktop renderer is strictly avoided to prevent cross-branch privacy leaks.
2. **Missing Desktop Read Boundary**: The hosted repository currently contains only `POST /api/desktop/v1/bookings`. Existing customer routes (`/api/customers/lookup`, `/api/customers/search`) use cookie-based web session auth, not Bearer token authentication.
3. **Hosted Boundary Specification**: Defined `GET /api/desktop/v1/customers` (paginated customer list with tabs `all`, `repeat`, `lapsed`, `followup`, search `q`, and KPI summary) and `GET /api/desktop/v1/customers/[customerId]` (single profile + booking history) authenticated via `verifyDesktopBearerAuth`.
4. **Desktop UI Direction**: Fully specified to reuse the canonical Stages 01–02 shell, DataGrid, KPI cards, filter toolbar, and right-side inspector pattern without introducing a second UI system.
5. **Quality & Evidence**: Local validation passed (vitest 157/157, prettier, eslint 0 warnings, tsc noEmit, cargo check/test/clippy/fmt). Evidence recorded in `docs/50-state/evidence/stage-03-customers.md`.
6. **Next Gate**: Push `stage/03-customers` and stop for independent review. Implementation of Desktop customer reads awaits the authoritative hosted customer boundary.
