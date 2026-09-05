# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell is **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 — Bookings: **CONTRACT CORRECTION COMPLETED ON BRANCH `stage/02-bookings` — STOPPED FOR OWNER / INDEPENDENT REVIEW**.
BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Fetched HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`; hosted tracked source remains read-only and clean.

- **Stage 02 Contract Corrections**:
  - Re-inspected canonical hosted repository (`src/app/(dashboard)/crm/bookings/new/page.tsx`, `src/components/features/bookings/quick-booking-form.tsx`, `src/lib/actions/inhouse-booking.ts`, `src/lib/queries/quick-booking-options.ts`, `src/app/api/crm/bookings/route.ts`).
  - Found that hosted CRM creates bookings via server-only Server Action `createInhouseBookingMultiAction` using `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`), with multi-service row generation, customer deduplication, payment logging, and cache revalidation. No network-callable create API route exists.
  - Enforced Critical Stop Condition: Removed false direct-write table mutation from desktop renderer to preserve security boundary. Direct writes fail closed with truthful requirement notice.
  - Replaced global service query with branch-specific catalog options (`branch_services` with `custom_price`, `custom_duration_minutes`, `available_in_spa`, `available_home_service`) and filtered staff using `canActAsBookingServiceProvider`.
  - Corrected modal lifecycle with proper dirty tracking, discard confirmation, and clean state reset.
  - Preserved all layout/visual corrections (wide workspace, distributed scope tabs, high-contrast button, `branch_resources!bookings_resource_id_fkey` relation hint).
- **Canonical Shell Preservation**: Exactly zero changes to the canonical shell sidebar, top bar, avatar menu, or session indicators.
- **Automated Tests**: 77 tests passing across 6 test suites (`tests/roles.test.ts`, `tests/bookings-service.test.ts`, `tests/auth-service.test.ts`, `tests/boundary.test.ts`, `tests/bookings-components.test.tsx`, `tests/components.test.tsx`).
- **Quality Gates**: `format:check`, `lint`, `typecheck`, `test`, `build`, `cargo fmt --check`, `cargo check --locked`, `cargo test --locked`, `cargo clippy --locked --all-targets -- -D warnings`, `git diff --check` all passed with 0 errors.
- **Stage Status**: Stage 00 (CLOSED), Stage 01 (CLOSED), Stage 02 (CONTRACT CORRECTION COMPLETED ON BRANCH — AWAITING INDEPENDENT REVIEW).
- **Boundaries**: Strictly stopped for review. Not merged into `main`. Stage 03 is NOT authorized.
