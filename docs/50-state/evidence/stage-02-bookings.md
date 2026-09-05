# Stage 02 — Evidence: Bookings Module Greenfield Functional Rebuild

**Target:** CradleHub Desktop (`https://github.com/techwithmpg/cradlehub-desktop-Client_app`)

**Stage / Task:** Stage 02 — Bookings Module Greenfield Functional Rebuild

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/02-bookings`

**BASE_SHA:** `c9720805975004dbe11367f1ad9999270ad4ae7c`

**Hosted web reference SHA:** `feda4600f37e93084fdb672bd0c2612e9872bb43`

---

## Authorized scope

1. Greenfield functional build of the real Bookings module body for CradleHub Desktop inside the operational workspace canvas when `activeModule === 'bookings'`.
2. Faithful alignment to the owner-approved Bookings visual reference for hierarchy, proportions, card separation, and design tokens:
   - **Card A (KPI Summary Card)**: Horizontal strip with 6 status partition metric cells (Today's Bookings, Confirmed, Checked In, Completed, No Show, Cancelled).
   - **Card B (Bookings List Card)**: 8 scope tabs (`all`, `today`, `tomorrow`, `this_week`, `this_month`, `upcoming`, `completed`, `cancelled`), filter toolbar (search, status, exact date, service, therapist/staff, reset), compact DataGrid with customer initials avatar, service pill, therapist chip, source tag, price, and pagination footer.
   - **Card C (Booking Inspector Card)**: Tall sticky right inspector showing live status badge, customer profile card, 5 tabs (Overview, Customer, Timeline, Payments [Read-Only/Dormant], Notes), quick actions (Reschedule notice, Cancel notice, Add Payment disabled), and full customer profile snapshot.
3. Canonical shell preservation: Exactly zero redesign or alteration to Stage 01 canonical sidebar, top bar, avatar menu, or session indicators.
4. Real Supabase read queries scoped strictly to the authenticated operator's `branch_id`.
5. Strict dormant module boundaries: Payments mutations, finance, and report mutations remain dormant and explicit.

---

## Changed files

- `src/types/bookings.ts`: Canonical TypeScript definitions for bookings, joined entities, scope tabs, filters, and KPI summary structures.
- `src/lib/bookings-service.ts`: Query functions for branch bookings (`fetchBranchBookings`), record normalization (`normalizeBooking`), KPI computation (`computeBookingKpis`), and multi-dimension filtering (`filterBookings`).
- `src/components/bookings/BookingsHeader.tsx`: Bookings module header with title, subtitle, refresh button, and new booking action with dormant notice dialog.
- `src/components/bookings/BookingsKpiSummary.tsx`: Card A horizontal KPI summary strip with 6 interactive status cells.
- `src/components/bookings/BookingsListCard.tsx`: Card B bookings table with scope tabs, filters, pagination, and row selection.
- `src/components/bookings/BookingInspectorCard.tsx`: Card C selected booking inspector with 5 panels, quick actions, and customer profile details.
- `src/components/bookings/BookingsView.tsx`: Integrated orchestrator for the Bookings workspace with loading skeleton, error banner, and responsive layout.
- `src/components/CanonicalShell.tsx`: Integration of `BookingsView` when `activeModule === 'bookings'`, preserving shell page title contract.
- `src/styles.css`: Complete styling for Card A, Card B, and Card C matching the 3-card layout, color palette, and responsive breakpoints.
- `tests/bookings-service.test.ts`: Automated test suite for data normalization, KPI aggregation, multi-scope filtering, and branch query isolation.
- `tests/bookings-components.test.tsx`: Automated test suite for Bookings UI components and container views.
- `docs/50-state/CURRENT_STATE.md`: Updated active state documentation.
- `docs/50-state/CURRENT_TASK.md`: Updated active task documentation.
- `docs/50-state/HANDOFF.md`: Updated handoff state.
- `docs/50-state/LAST_VERIFIED_GATE.md`: Updated verification record.

---

## Contract evidence

### Database Contract Verification

- Verified live Supabase schema via read-only MCP queries:
  - Table `bookings`: `id`, `branch_id`, `booking_date`, `start_time`, `end_time`, `type`, `delivery_type`, `status`, `amount_paid`, `payment_method`, `payment_status`, `payment_reference`, `resource_id`, `staff_id`, `customer_id`, `service_id`, `travel_buffer_mins`, `metadata`, `created_at`, `updated_at`.
  - Joined tables: `customers` (`id`, `full_name`, `phone`, `email`, `total_bookings`, `loyalty_tier`, `notes`, `health_notes`), `services` (`id`, `name`, `duration_minutes`, `price`), `staff` (`id`, `full_name`, `nickname`, `tier`, `avatar_url`), `branch_resources` (`id`, `name`, `type`).
- Verified query isolation: `eq('branch_id', authContext.branchId)` ensures operators only access their authorized branch data.

---

## Exact checks

| Command / Check                                      | Result | Notes                                                     |
| ---------------------------------------------------- | ------ | --------------------------------------------------------- |
| `pnpm format`                                        | PASS   | Prettier formatted all changed files                      |
| `pnpm format:check`                                  | PASS   | All matched files use Prettier code style                 |
| `pnpm lint`                                          | PASS   | `eslint . --max-warnings 0` exited with 0 warnings/errors |
| `pnpm typecheck`                                     | PASS   | `tsc --noEmit` passed with 0 type errors                  |
| `pnpm test`                                          | PASS   | 71 tests passed across 6 test suites                      |
| `pnpm build`                                         | PASS   | Vite production bundle built successfully in 757ms        |
| `cargo fmt --check`                                  | PASS   | Rust code formatted according to style guidelines         |
| `cargo check --locked`                               | PASS   | Rust backend check passed with 0 warnings/errors          |
| `cargo test --locked`                                | PASS   | All Rust unittests and doc-tests passed with 0 errors     |
| `cargo clippy --locked --all-targets -- -D warnings` | PASS   | Zero clippy warnings across all targets                   |
| `git diff --check`                                   | PASS   | Zero trailing whitespace or merge conflict markers        |
| `git status --short`                                 | PASS   | Working tree clean after staging and commit               |

---

## Runtime evidence actually observed

- Automated component tests verified:
  - `BookingsHeader`: Renders module title, subtitle, refresh button, and modal notice for New Booking.
  - `BookingsKpiSummaryCard`: Renders 6 metric cells and dispatches scope clicks.
  - `BookingsListCard`: Filters correctly by scope tabs, search input, status, date, service, and staff dropdowns; selection triggers row highlight and inspector updates; renders clean empty state when list is empty.
  - `BookingInspectorCard`: Displays customer identity, booking ref, session details, tab switching across Overview, Customer, Timeline, Payments, and Notes; quick actions display informational notice modals.
  - `BookingsView`: Asynchronously queries branch bookings using `fetchBranchBookings(authContext.branchId)`, shows loading skeleton during fetch, handles network errors with retry mechanism.
- Canonical shell integration: Verified that clicking other navigation items shows the neutral empty state placeholder while 'Bookings' renders the real 3-card workspace.

---

## Security / data impact

- **production data changed?** NO.
- **schema/migration changed?** NO.
- **Auth/RLS/Storage policy changed?** NO.
- **secrets introduced/exposed?** NO.
- **privileged server behavior changed?** NO.
- **Tauri capabilities changed?** NO.

---

## Limitations

1. **Administrative Writes**: New booking creation, rescheduling, and cancellations in Stage 02 display modal notices explaining that write operations remain hosted and will be connected during authorized write stages.
2. **Payments Module**: Payments tab in the inspector provides read-only inspection of recorded booking amounts and payment references; payment mutation pathways are dormant.

---

## Rollback

To rollback this stage:

```bash
git checkout main
git branch -D stage/02-bookings
```

---

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
