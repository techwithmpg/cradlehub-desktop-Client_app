# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Stage 03 (Customers): **CONTRACT AUDITED — SAFE HOSTED CUSTOMER READ BOUNDARY REQUIRED — AWAITING INDEPENDENT REVIEW**. Stage 04 remains **NOT AUTHORIZED**.

- **Active Branch**: `stage/03-customers`.
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Contract Audit Status**: Completed. Identified that `customers` table has no `branch_id`; server-side scoping through `bookings.customer_id` is required to prevent cross-branch customer leakage.
- **Hosted Boundary Requirement**: Current hosted repository does not yet provide a Bearer-authenticated `/api/desktop/v1/customers` endpoint. Desktop has strictly avoided unsafe direct renderer reads (`supabase.from("customers")`) or fake customer data.
- **Proposed Hosted API Boundary**: Dedicated endpoints `GET /api/desktop/v1/customers` and `GET /api/desktop/v1/customers/[customerId]` with server-side bearer token authentication via `verifyDesktopBearerAuth`, CRM permission checks, and server-enforced branch scoping.
- **Desktop UI Design**: Approved to reuse the canonical Stage 01–02 shell, DataGrid, KPI cards, tabs, and inspector layout.
- **Quality & Security Gates**: All validation checks verified clean on `stage/03-customers`.

See [Stage 03 evidence](evidence/stage-03-customers.md) for detailed contract audit findings and proposed boundary specifications.
