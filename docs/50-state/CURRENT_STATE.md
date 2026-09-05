# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is ACCEPTED / MERGED / CLOSED on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 — Bookings final truth-state correction: **NOT ACCEPTED / NOT MERGED / AWAITING INDEPENDENT REVIEW**.
Stage 03 remains **NOT AUTHORIZED**.

- Branch: `stage/02-bookings`; reviewed starting HEAD: `63cc5ce35a4eedee6fac94045ddf675c3a754ad3`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Fetched hosted reference inspected: `feda4600f37e93084fdb672bd0c2612e9872bb43`; hosted tracked source remains unchanged and clean.
- The booking preview reads branch services only, applies active/visibility/delivery flags and branch overrides, and requires explicit selected-service provider capabilities. This is a conservative subset of hosted behavior, not authoritative availability or full hosted equivalence.
- Creation is disabled before submission. The UI does not call `createBranchBooking`; that helper retains its fail-closed rejection. No renderer insert path is present.
- Customer search and option loading distinguish errors from successful empty results. Each modal opening and branch change gets new defaults/options, with stale async responses ignored. Dirty detection compares every meaningful form value with the opening defaults.
- Wide workspace, three-card Bookings layout, distributed tabs, high-contrast New Booking button, explicit resource FK relation and canonical shell are preserved without changes to their components or CSS.
- Local checks passed: formatting, lint, TypeScript, 133 frontend tests across eight files, production build, all required Rust checks and whitespace review. Rust unit/doc suites contain zero tests. These are local results, not CI or live production verification.
- Separate synthetic browser fixture checks passed at 1440×900, 1366×768 and 1024×768. No owner visual acceptance is recorded for the reviewed HEAD or this correction.

Authoritative New Booking mutation still requires a separately authorized hosted server-side desktop-callable write boundary. No hosted implementation, production/schema/RLS/Auth change, merge or Stage 03 work is authorized by this correction.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for exact scope, source facts, limitations and checks. Stop after the authorized same-branch correction push for independent review.
