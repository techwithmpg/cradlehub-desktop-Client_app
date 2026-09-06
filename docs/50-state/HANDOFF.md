# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main`.
Stage 02 (Bookings): **OWNER RUNTIME VERIFIED / MERGE AUTHORIZED — PUSHED FOR FINAL INDEPENDENT MERGE REVIEW**. Desktop `main` is **NOT YET MERGED** in this pass. Stage 03 remains **NOT AUTHORIZED**.

- **Base Baseline (BASE_SHA)**: `c9720805975004dbe11367f1ad9999270ad4ae7c` on `main`.
- **Active Branch**: `stage/02-bookings`.
- **Reviewed Implementation HEAD**: `9268a95d1ada8b2d963cceb56f0b0b5a1d69e83f`.
- **Current Stage HEAD**: `d3410986533368ba0c15649f66580f128109c2cc`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Hosted Endpoint on Main**: `POST /api/desktop/v1/bookings` (Vercel/GitHub deployment check succeeded).

Summary of Stage 02 deliverable:

1. **Card A (KPI Summary Strip)**: 6 status metric cells (Today, Confirmed, Checked In, Completed, No Show, Cancelled) dynamically computed from branch bookings.
2. **Card B (Bookings List Card)**:
   - 8 scope tabs: `All Bookings`, `Today`, `Tomorrow`, `This Week`, `This Month`, `Upcoming`, `Completed`, `Cancelled`.
   - Filter toolbar: live search (customer name, phone, service, therapist, id), status selector, date picker, service selector, staff selector, and one-click filter reset.
   - Compact DataGrid: time/date, customer initials badge and details, service and duration pill, room resource tag, status badge, therapist avatar/tier chip, source badge, price, inspect action.
   - Pagination: configurable rows per page (10, 25, 50), page selector, total record counts.
3. **Card C (Booking Inspector Card)**:
   - Selected booking sticky panel with status header, customer identity, and quick actions (Reschedule, Cancel, Add Payment [Dormant]).
   - 5 inspector tabs (Overview, Customer, Timeline, Payments, Notes).
4. **Authoritative Booking Creation Boundary**:
   - Official Tauri v2 `@tauri-apps/plugin-http` / `tauri-plugin-http` transport.
   - Single exact capability allow rule: `https://www.cradlewellnessliving.com/api/desktop/v1/*` (zero wildcards).
   - Strict origin validation matching `https://www.cradlewellnessliving.com`.
   - Per-request Supabase session Bearer token authentication.
   - Authoritative domain error code parsing and non-empty `bookingId` validation.
   - Modal payment defaults (`paymentReceived: false`, `paymentMethod: ''`) and Home Service tab disabled with explanatory tooltip.
5. **Quality Gate Verification**:
   - `pnpm format:check` — PASSED
   - `pnpm lint` — PASSED (`--max-warnings 0`)
   - `pnpm typecheck` — PASSED
   - `pnpm test` — PASSED (157/157 tests passing across 8 test suites)
   - `pnpm build` — PASSED (Vite production bundle built cleanly)
   - `cargo fmt --check; cargo check --locked; cargo test --locked; cargo clippy --locked --all-targets -- -D warnings` — PASSED (100% Rust backend clean)
   - `git diff --check` — PASSED
6. **Owner Runtime Evidence**:
   - Visual inspection and booking workflow verified by owner in real native Windows Desktop application runtime.
   - Owner confirmation and merge authorization received.

Consult `docs/50-state/evidence/stage-02-bookings.md` for full implementation details and evidence.

Work is stopped for final independent merge review. Do NOT merge into Desktop `main` or start Stage 03 in this step.
