# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 (Bookings): **ACCEPTED / MERGED / CLOSED** on `main` at `379d460ebce14f09d90db910f8e321711e5dcea6`.

Stage 03 (Customers): **NOT STARTED / NOT AUTHORIZED**. A separate explicit owner authorization is required before creating `stage/03-customers`.

- **Stage 02 Merged Baseline**: `379d460ebce14f09d90db910f8e321711e5dcea6` on `main`.
- **Merged Source Branch**: `stage/02-bookings` (fast-forward merged into `main`).
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Hosted Endpoint on Main**: `POST /api/desktop/v1/bookings` (Vercel/GitHub deployment check succeeded).

Summary of Stage 02 deliverable on `main`:

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
5. **Quality Gate Verification on Main**:
   - `pnpm format:check` — PASSED
   - `pnpm lint` — PASSED (`--max-warnings 0`)
   - `pnpm typecheck` — PASSED
   - `pnpm test` — PASSED (157/157 tests passing across 8 test suites)
   - `pnpm build` — PASSED (Vite production bundle built cleanly)
   - `cargo fmt --check; cargo check --locked; cargo test --locked; cargo clippy --locked --all-targets -- -D warnings` — PASSED (100% Rust backend clean)
   - `git diff --check` — PASSED
6. **Owner Runtime Evidence**:
   - Visual inspection and booking workflow verified by owner in real native Windows Desktop application runtime.
   - Owner confirmation and merge authorization received prior to merge.

Consult `docs/50-state/evidence/stage-02-bookings.md` for full implementation details and validation records.

Stage 02 is complete and closed on `main`. Stage 03 requires explicit owner authorization before initiation.
