# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02: **ACCEPTED / MERGED / CLOSED** on `main` at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 (Customers): **CONTRACT AUDITED — SAFE HOSTED CUSTOMER READ BOUNDARY REQUIRED — STOPPED FOR INDEPENDENT REVIEW**.

- **Base Baseline (BASE_SHA)**: `59f69fc7e321c32f040f6f9a79aca47e77547675` on `main`.
- **Active Branch**: `stage/03-customers`.
- **Audited Stage Snapshot HEAD_SHA**: `2ec15ddf0600ac93b796118d14263781d5b43341`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).

Summary of Stage 03 Contract Audit & Plan:

1. **Hosted Contract Audit**:
   - Database `customers` table lacks `branch_id`; server-side scoping through `bookings.customer_id` is mandatory to protect customer privacy across branches.
   - Hosted web profile action (`getCustomerProfileAction`) lacks branch-scoping parameter; cannot be used directly as Desktop authorization boundary.
   - Current hosted repository does not yet provide a Bearer-authenticated `/api/desktop/v1/customers` endpoint.
   - Unsafe direct queries (`supabase.from("customers")`) from Desktop renderer are strictly avoided.
2. **Proposed Hosted Read Boundary**:
   - `GET /api/desktop/v1/customers`: Bearer-authenticated paginated customer list, segments (`all`, `repeat`, `lapsed`, `followup`), live search (`q`), and KPI statistics.
   - `GET /api/desktop/v1/customers/[customerId]`: Bearer-authenticated single customer profile and booking history verified and filtered to the caller's authorized branch.
3. **Desktop Canonical UI Reuse**:
   - Header + KPI strip + 4 Segment Tabs + Search Filter + Compact DataGrid + Sticky Right Inspector.
   - 100% reuse of canonical Stage 01–02 shell, components, and design tokens.
   - Excludes dormant finance and payment surfaces (no `pricePaid`, `totalRevenue`, or financial KPIs).
4. **Checks Status**:
   - **Previously Verified Main Baseline Checks**: Vitest (157/157 tests), ESLint (0 warnings), TypeScript (`tsc --noEmit`), Vite build, Cargo fmt/check/test/clippy clean.
   - **Stage 03 Audit-Pass Checks Actually Run**: Prettier formatting check on docs, `git diff --check`, `git diff --name-only`.

Consult `docs/50-state/evidence/stage-03-customers.md` for full contract audit details and proposed boundary specifications.

Work is stopped for independent review. Stage 04 (Staff) has NOT started.
