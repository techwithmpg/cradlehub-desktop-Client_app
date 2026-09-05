# Current Task

Stage 02 — Bookings Final Correction Pass, on the existing `stage/02-bookings` branch.

**NOT ACCEPTED / NOT MERGED / AWAITING INDEPENDENT REVIEW. Stage 03 NOT AUTHORIZED.**

- Reviewed starting HEAD: `63cc5ce35a4eedee6fac94045ddf675c3a754ad3`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Hosted SHA inspected: `feda4600f37e93084fdb672bd0c2612e9872bb43`.

Implemented within this correction:

1. Removed the global service fallback. Branch catalog rows require active service/membership, CRM-visible configuration and an enabled delivery mode. Price/duration overrides remain intact. Home service also requires an explicitly enabled branch rule.
2. Filtered providers by explicit capability for every selected service; retained hard role exclusions and active/unarchived/unmerged constraints. Invalid mode/service/provider selections are removed.
3. Distinguished customer search and option read errors from valid empty states; ignored stale requests after query change, close/reopen and branch change.
4. Disabled creation before submit with one preview notice. Removed the modal's write-helper invocation and fabricated future success path.
5. Remounted the form per opening/branch and compared all meaningful fields against canonical defaults for discard handling.
6. Corrected evidence attribution, exact hosted auth/provider facts and local-check terminology. Preserved the approved layout direction and canonical shell.

Validation: all required local checks passed, including 133 frontend tests in eight files; Rust checks passed with zero Rust tests defined. The isolated browser fixture verified three desktop sizes, mode filtering, distinct customer-search failure and discard/reopen. No live authentication/RLS/provider availability or owner acceptance is claimed.

Remaining blocker: authoritative New Booking mutation requires a separately authorized hosted server-side desktop-callable write boundary. See [evidence](evidence/stage-02-bookings.md).

Delivery gate: commit and push only this correction on `stage/02-bookings`, then stop for independent review. Do not merge, modify hosted CradleHub or start Stage 03.
