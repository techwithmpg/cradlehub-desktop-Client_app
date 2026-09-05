# Stage 02 — Evidence: Bookings Module Greenfield Functional Rebuild & Refinement

**Target:** CradleHub Desktop (`https://github.com/techwithmpg/cradlehub-desktop-Client_app`)

**Stage / Task:** Stage 02 — Bookings Module Greenfield Functional Rebuild & Owner-Requested Correction Pass

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/02-bookings`

**Accepted Main Baseline (BASE_SHA):** `c9720805975004dbe11367f1ad9999270ad4ae7c`

**Starting Branch HEAD Before Correction:** `2940f44e3c043c85ac97c9a9a37a4e6c9e553693`

**Hosted Canonical Reference SHA Inspected:** `feda4600f37e93084fdb672bd0c2612e9872bb43`

---

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

The owner tested the real native Windows desktop runtime of Stage 02 and observed the following defects:

1. **Cramped body width**: The entire Bookings body was cramped into a narrow area (`max-width: 900px`) even though substantial workspace width was available.
2. **Weak / invisible New Booking action**: The New Booking button had poor contrast and appeared almost invisible.
3. **New Booking flow**: New Booking previously did not perform the real hosted booking creation flow.
4. **PostgREST relation error**: Real booking loading failed with:
   `Failed to load branch bookings: Could not embed because more than one relationship was found for 'bookings' and 'branch_resources'`
5. **Scope tabs horizontal scrolling**: The Bookings scope tabs unnecessarily used horizontal scrolling even at large desktop widths.
6. **Responsive space utilization**: The tabs, list, and inspector needed to expand gracefully across available space while preserving the approved three-card composition.

---

## Authorized Corrections Applied

1. **Wide Workspace Layout Modifier**:
   - Added `.workspace-canvas-wide` (`max-width: 100%; width: 100%;`) applied selectively to `activeModule === 'bookings'` without breaking standard max-widths of other module placeholders.
   - 1440×900: Bookings body gracefully utilizes available width; KPI card spans across; list card takes dominant width (~1fr); inspector occupies stable 380px right panel.
   - 1366×768: Side-by-side list + 340px inspector layout preserved without control crushing or horizontal page scroll.
   - 1024×768: Responsive layout cleanly stacks inspector below list.

2. **Scope Tabs Layout**:
   - Set `.bookings-scope-tab-btn` with `flex: 1 1 0` and reduced safe padding so all 8 scope tabs distribute evenly across desktop widths without horizontal scrolling.

3. **New Booking Button Contrast**:
   - Styled `.bookings-header-primary-btn` with dark CradleHub brand green (`background: #0d2b20`, `border: 1px solid #164332`, `color: #ffffff`, `hover: #143d2e`, `active: #081d15`, `focus: 2px solid var(--color-accent)`).

4. **Foreign Key Relationship Fix for `branch_resources`**:
   - **Root Cause**: Two foreign keys link `bookings` to `branch_resources`: `bookings.resource_id -> branch_resources.id` (`bookings_resource_id_fkey`) and `bookings.session_started_from_resource_id -> branch_resources.id` (`bookings_session_started_from_resource_id_fkey`).
   - **Constraint Selected**: `bookings_resource_id_fkey` on column `resource_id`.
   - **Authoritative Source**: Inspected Supabase database schema (`information_schema.table_constraints` and hosted query in `src/app/actions/calendar-actions.ts`).
   - **Corrected PostgREST Hint**: `branch_resources!bookings_resource_id_fkey ( id, name, type )`.

5. **Authoritative Booking Creation Workflow (`NewBookingModal`)**:
   - Inspected hosted modal in `components/modals/QuickBookingModal.tsx` and action `createBooking` in `src/app/actions/booking-actions.ts`.
   - Replicated full client-safe form flow using canonical desktop controls:
     - Booking mode selector (Walk-in, Phone, Future, Home Service) with automatic defaults (date, quarter-hour start time, advance payment toggle).
     - Customer lookup by name/phone with debounced search (`searchBranchCustomers`) and inline selection/clearing; manual name/phone/email inputs.
     - Multi-service selection with dynamic duration and price calculation.
     - Therapist picker (staff list) and room/resource picker (`branch_resources`).
     - Home service address, barangay, and city fields when `mode === 'home_service'`.
     - Advance payment toggle, payment method selector (`cash`, `gcash`, `bank_transfer`, `credit_card`).
     - Notes field and calculated end time.
     - Validation for required fields, phone format, and date/time.
     - Authoritative creation via `createBranchBooking` into `customers` and `bookings`, relying on PostgreSQL server triggers (`fn_on_booking_created`, `guard_booking_assignment_overlap`, `prepare_booking_timing_snapshots`) for overlap prevention (`23P01`) and audit logging without requiring privileged secrets.
     - On success: closes modal, triggers list and KPI refetch, and selects the new booking.
     - Unsaved changes confirmation dialog if user attempts to dismiss a dirty modal.

---

## Changed Files

- `src/types/bookings.ts`: Added types for `QuickBookingMode`, `QuickBookingOptionService`, `QuickBookingOptionStaff`, `QuickBookingOptionResource`, `CreateBranchBookingParams`, and `CreateBookingResult`.
- `src/lib/bookings-service.ts`: Fixed PostgREST embed hint with `branch_resources!bookings_resource_id_fkey`; added `fetchBranchBookingOptions`, `searchBranchCustomers`, `computeBookingEndTime`, `createBranchBooking`, and centralized `formatCurrency`.
- `src/components/CanonicalShell.tsx`: Applied `.workspace-canvas-wide` when `activeModule === 'bookings'`.
- `src/components/bookings/BookingsHeader.tsx`: Updated New Booking primary button styling and wired real modal open state.
- `src/components/bookings/BookingsView.tsx`: Integrated `NewBookingModal`, refetch callback, and wide workspace layout.
- `src/components/bookings/NewBookingModal.tsx`: Complete canonical desktop booking creation dialog.
- `src/styles.css`: Added styles for wide workspace canvas, distributed scope tabs, high-contrast primary button, and new booking modal.
- `tests/bookings-service.test.ts`: Added unit tests for explicit FK hint, booking option fetching, customer search, end-time calculation, and booking creation.
- `tests/bookings-components.test.tsx`: Added component tests for `NewBookingModal` rendering, mode switching, validation, and submission.
- `docs/50-state/CURRENT_STATE.md`: Updated state documentation.
- `docs/50-state/CURRENT_TASK.md`: Updated task documentation.
- `docs/50-state/evidence/stage-02-bookings.md`: Recorded full evidence and test results.

---

## Exact Checks & Results

| Check / Command                                      | Result | Notes                                                     |
| ---------------------------------------------------- | ------ | --------------------------------------------------------- |
| `pnpm format:check`                                  | PASS   | All files formatted with Prettier                         |
| `pnpm lint`                                          | PASS   | `eslint . --max-warnings 0` exited with 0 warnings/errors |
| `pnpm typecheck`                                     | PASS   | `tsc --noEmit` passed with 0 errors                       |
| `pnpm test`                                          | PASS   | 78 tests passing across 6 test suites                     |
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
- **Secrets introduced?** NO.
- **Privileged server behavior changed?** NO. Client uses authenticated Supabase user token to insert into `customers` and `bookings`, protected by database RLS and triggers.
- **Hosted repository changed?** NO (inspected read-only).

---

## Limitations

1. **Dormant Modules**: Payments mutations, Finance, Reconciliation, and Reports remain dormant.
2. **Reschedule & Cancel Actions**: Quick actions in the inspector remain informational dialogs.
3. **Owner Visual Review**: Owner must visually confirm the runtime behavior in native Windows desktop.

---

## Rollback

```bash
git checkout main
git branch -D stage/02-bookings
```

---

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
