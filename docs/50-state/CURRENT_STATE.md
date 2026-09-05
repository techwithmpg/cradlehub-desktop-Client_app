# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is ACCEPTED / MERGED / CLOSED at `c9720805975004dbe11367f1ad9999270ad4ae7c`.

Stage 02 — Bookings: **NOT ACCEPTED / NOT MERGED / AWAITING OWNER AUTHORIZATION FOR HOSTED BOOKING WRITE BOUNDARY**. Stage 02 remains functionally incomplete and this customer-scope correction awaits independent review. Stage 03 is **NOT AUTHORIZED**.

- Existing branch: `stage/02-bookings`.
- Reviewed starting HEAD: `51e3c56ef6d2ee3b0b15e083611d28ab3c972a1e`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Actual fetched hosted main: `feda4600f37e93084fdb672bd0c2612e9872bb43`; inspected without source edits.
- **Customer lookup is disabled.** The configured Supabase project's live booking/customer RLS could not be inspected: the connected MCP account does not list that project, and its read-only policy query was denied. Repository policy/source evidence alone does not prove live enforcement. The global customer query was removed; the helper now rejects with `CUSTOMER_LOOKUP_UNAVAILABLE` without making any database request. Manual customer fields remain preview-only.
- The modal shows: “Customer lookup is unavailable until a branch-scoped hosted read boundary is available.” This is UNAVAILABLE, not EMPTY or an alleged successful branch search. Retained async safeguards are tested using isolated mocks; no lookup is enabled in normal runtime.
- Booking creation remains genuinely disabled before submit, with no UI invocation of `createBranchBooking` and no renderer booking/customer inserts.
- Branch-only services, mode filtering, conservative providers, option error/empty states, clean modal reopen/branch reset, wide three-card Bookings layout, distributed tabs, contrast entry button, explicit resource FK and canonical shell are preserved.
- A versioned hosted booking endpoint is documented only, with bearer user-token verification, server-derived role/branch authority and shared server-only canonical domain logic. No endpoint, migration, policy or Auth changes were made.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for exact source facts, the proposed schema-derived request/result contract and local checks. No new owner runtime approval is recorded. Stop after the authorized same-branch correction push; do not merge or start Stage 03.
