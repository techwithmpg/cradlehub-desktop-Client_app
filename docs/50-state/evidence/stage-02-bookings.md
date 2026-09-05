# Stage 02 — Evidence: Bookings Module Contract Correction & Alignment

**Target:** CradleHub Desktop (`https://github.com/techwithmpg/cradlehub-desktop-Client_app`)

**Stage / Task:** Stage 02 — Bookings Module Contract Correction Pass

**Status:** `STAGE 02 CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW — NOT ACCEPTED OR MERGED`

**Branch:** `stage/02-bookings`

**Accepted Main Baseline (BASE_SHA):** `c9720805975004dbe11367f1ad9999270ad4ae7c`

**Starting Reviewed Branch HEAD Before Correction:** `8eda71c46ccac5e637e203f06643671be129bc7d`

**Hosted Canonical Reference Inspected:** `https://github.com/techwithmpg/Cradlehub` @ `feda4600f37e93084fdb672bd0c2612e9872bb43`

---

## REPOSITORY-RECORDED PRODUCTION EVIDENCE

### 1. Hosted Booking Contract Inspection

Inspection of `https://github.com/techwithmpg/Cradlehub` at commit `feda4600f37e93084fdb672bd0c2612e9872bb43` revealed:

- **Canonical Route & Form**:
  - `src/app/(dashboard)/crm/bookings/new/page.tsx` renders `QuickBookingForm` from `src/components/features/bookings/quick-booking-form.tsx`.
- **Authoritative Booking Creation Action**:
  - Hosted CRM invokes `createInhouseBookingMultiAction` in `src/lib/actions/inhouse-booking.ts`.
  - It is a Next.js Server Action running in a server-only execution environment.
  - Uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS and perform authoritative CRM operations.
- **Hosted Authoritative Behaviors & Side Effects**:
  - **Auth / Role / Branch Authority**: Validates authenticated session, canonical CRM role (`requirePermission('bookings:create')`), and verified branch membership server-side.
  - **Customer Creation / Upsert**: Authoritatively finds existing customer or creates a new customer row using server-side deduplication.
  - **Multi-Service Semantics**: Creates authoritative sequential individual `bookings` rows for each selected service (sharing a group identifier or sequentially scheduled start/end times), rather than a single booking with secondary IDs crammed into metadata.
  - **Branch Service Catalog & Overrides**: Options loaded via `getQuickBookingOptions` in `src/lib/queries/quick-booking-options.ts` querying `branch_services` with branch price (`custom_price`), duration (`custom_duration_minutes`), and service mode availability (`available_in_spa`, `available_home_service`).
  - **Staff Eligibility**: Filters staff via `canActAsBookingServiceProvider` logic (`role`, `is_service_provider`, `is_merged === false`, `status === 'active'`) and includes provider service capabilities.
  - **Resource Assignment**: Validates and assigns branch resources (`branch_resources`) for the booking timeframe.
  - **Home Service Location & Distance**: Calculates distance/travel fee and address metadata from authoritative geocoding/branch configuration.
  - **Side Effects**: Writes payment audit records (`booking_payment_logs`), creates notifications, writes operational logs, and triggers Next.js cache revalidation (`revalidatePath`).
- **Network Write Boundary Inspection**:
  - Inspected all routes under `src/app/api/**`.
  - `src/app/api/crm/bookings/route.ts` only exports a `GET` handler for listing bookings.
  - No `POST` / mutation endpoint exists in `src/app/api/**` for creating bookings.
  - No safe desktop-callable network boundary (REST/RPC) currently exists in the hosted codebase.

---

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

The owner previously tested the native Windows desktop runtime of Stage 02 and noted:

- The Bookings workspace layout and visual presentation were approved after the responsive layout, high-contrast button, distributed scope tabs, and `bookings_resource_id_fkey` relation fix were applied.
- Independent review determined that the New Booking workflow in the desktop renderer previously performed direct table inserts (`createBranchBooking` writing directly to `customers` and `bookings` tables), which did NOT reproduce the hosted server action contract and multi-service semantics.

---

## Critical Stop Condition & Write Boundary Decision

**Decision:** `BLOCKED — HOSTED WRITE BOUNDARY REQUIRES OWNER AUTHORIZATION`

1. **Reason**: The desktop renderer cannot safely reproduce the hosted server action (`createInhouseBookingMultiAction`) without a network-callable server boundary. Exposing `SUPABASE_SERVICE_ROLE_KEY` or privileged admin server code to the desktop renderer violates security rules.
2. **Action Taken**:
   - Removed the false direct-write equivalence from `src/lib/bookings-service.ts`.
   - `createBranchBooking` now explicitly fails closed, returning:
     `{ ok: false, code: 'HOSTED_WRITE_BOUNDARY_REQUIRED', error: 'Stage 02 requires owner authorization to add a hosted server-side desktop-callable booking creation boundary.' }`
   - `NewBookingModal` displays a truthful notice stating that booking creation requires a hosted server boundary and refuses to simulate success.
3. **Required Hosted Addition**:
   - Owner authorization is required to implement a secure, authenticated API route (e.g. `POST /api/crm/bookings/create` or a dedicated Supabase Edge Function) in the hosted repository.
   - The endpoint must accept the authenticated user token, verify branch/role permissions, execute canonical multi-service creation with customer upsert, assign resources, write payment/audit logs, and return the created booking records.

---

## Authorized Corrections Made

1. **Branch Service Catalog & Option Loading**:
   - `fetchBranchBookingOptions` in `src/lib/bookings-service.ts` now queries `branch_services` with explicit overrides (`custom_price`, `custom_duration_minutes`, `available_in_spa`, `available_home_service`), matching hosted `getQuickBookingOptions`.
   - Staff list queries `branch_staff` joined to `staff` and applies `canActAsBookingServiceProvider` filtering.
   - Distinguishes empty data from query / network / auth errors.
2. **Modal Form Lifecycle & Dirty State**:
   - Clean reset on close, discard, or submission.
   - Robust `isDirty` calculation covering customer changes, notes, address, staff selection, resource selection, and multi-service changes.
   - Discard confirmation modal prevents accidental loss of edits.
   - Search debounce ref cleaned up on unmount.
3. **Preserved Visual & Layout Corrections**:
   - Wide Bookings workspace (`.workspace-canvas-wide`).
   - Responsive layouts at 1440×900, 1366×768, and degraded 1024×768.
   - Evenly distributed 8 scope tabs (`flex: 1 1 0`).
   - High-contrast New Booking button (`#0d2b20`).
   - Explicit `branch_resources!bookings_resource_id_fkey` relation hint.

---

## Changed Files

- `src/types/bookings.ts`: Updated `QuickBookingOptionService`, `QuickBookingOptionStaff`, `CreateBookingResult`.
- `src/lib/bookings-service.ts`: Implemented `canActAsBookingServiceProvider`, branch-specific service queries with overrides, staff filtering, and write boundary rejection in `createBranchBooking`.
- `src/components/bookings/NewBookingModal.tsx`: Updated with truthful write-boundary banner, comprehensive `isDirty` tracking, discard dialog, and clean reset.
- `src/styles.css`: Added styles for `.new-booking-write-boundary-notice`.
- `tests/bookings-service.test.ts`: Added tests for branch option loading with overrides, provider filtering, query error distinction, and write-boundary rejection.
- `tests/bookings-components.test.tsx`: Added tests for NewBookingModal write-boundary notice, discard flow, and option loading.
- `docs/50-state/CURRENT_STATE.md`: Updated state documentation.
- `docs/50-state/CURRENT_TASK.md`: Updated task documentation.
- `docs/50-state/evidence/stage-02-bookings.md`: Recorded full evidence.

---

## Exact Checks & Results

| Check / Command                                      | Result | Notes                                                     |
| ---------------------------------------------------- | ------ | --------------------------------------------------------- |
| `pnpm format:check`                                  | PASS   | All files formatted with Prettier                         |
| `pnpm lint`                                          | PASS   | `eslint . --max-warnings 0` exited with 0 warnings/errors |
| `pnpm typecheck`                                     | PASS   | `tsc --noEmit` passed with 0 errors                       |
| `pnpm test`                                          | PASS   | 77 tests passing across 6 test suites                     |
| `pnpm build`                                         | PASS   | Vite production bundle built successfully                 |
| `cargo fmt --check`                                  | PASS   | Rust code formatted                                       |
| `cargo check --locked`                               | PASS   | Rust backend check passed                                 |
| `cargo test --locked`                                | PASS   | Rust unittests and doc-tests passed                       |
| `cargo clippy --locked --all-targets -- -D warnings` | PASS   | Zero clippy warnings                                      |
| `git diff --check`                                   | PASS   | Zero whitespace errors                                    |

---

## Security / Data Impact

- **Production data changed?** NO.
- **Schema/migration changed?** NO.
- **Auth/RLS/Storage policy changed?** NO.
- **Secrets introduced?** NO (no service-role key or admin client in renderer).
- **Direct table mutation removed?** YES (removed direct renderer insert into `customers` and `bookings`).
- **Hosted repository changed?** NO (inspected read-only).

---

## Gate

`STAGE 02 CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW — NOT ACCEPTED OR MERGED`
