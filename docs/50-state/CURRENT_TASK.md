# Current Task

Stage 02 — Bookings Final Contract Correction: customer-search authority and documented hosted write blocker.

**NOT ACCEPTED / NOT MERGED / AWAITING OWNER AUTHORIZATION FOR HOSTED BOOKING WRITE BOUNDARY.** Stage 02 is functionally incomplete. This correction awaits independent review; Stage 03 remains **NOT AUTHORIZED**.

- Branch: `stage/02-bookings`.
- Reviewed starting HEAD: `51e3c56ef6d2ee3b0b15e083611d28ab3c972a1e`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Fetched hosted main inspected: `feda4600f37e93084fdb672bd0c2612e9872bb43`.

Decision: **CUSTOMER LOOKUP DISABLED** under authorization Section 8. The configured project's live RLS cannot be inspected through the connected Supabase MCP account; therefore safe branch scoping cannot be proven. The former global query has been removed, the helper makes no requests and rejects as unavailable, and the UI disables lookup while keeping manual preview fields.

Preserved: branch service/provider/mode constraints, distinct option errors, disabled creation, full meaningful-field dirty tracking, clean modal lifecycle, stale-response guards, listing relation and layout/shell. Isolated mock tests retain coverage of async lookup behavior; they are not an enabled production lookup.

Documented only: proposed `POST /api/desktop/v1/bookings`, bearer user-token validation, active staff/canonical CRM role/branch enforcement, shared server-only booking logic and exact request fields/response shape derived from `createInhouseBookingMultiSchema`. The desktop renderer cannot replace this with inserts.

Delivery: run the required local checks and three-size fixture verification, review the diff against the reviewed HEAD, commit and push on this same branch, then stop for independent review. Exact results and limitations are in [Stage 02 evidence](evidence/stage-02-bookings.md). No hosted changes, owner acceptance, merge or Stage 03 work are authorized here.
