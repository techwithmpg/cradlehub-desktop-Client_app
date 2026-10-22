# Current State

**REPOSITORY-RECORDED PRODUCTION EVIDENCE.** This file describes repository state, not deployed or owner-observed runtime behavior.

- Accepted desktop `main` baseline for Stage 16: `5399ad6dbb1d447fdf3f47f47ef641ede3cfe1f2` (fetched and matched the local checkout on 2026-10-22).
- `main` contains the Stage 15 merge `413d20fd35d589622899c08243f7400ce13d6421` and the subsequent retained-workspace correction ending at the baseline above. Stage 00–05 closeout history remains in their evidence files; Stage 06B–15 delivery evidence is in `docs/30-delivery/`. Their old check results are historical, not inherited Stage 16 PASS results.
- Stage 16, **current hosted-contract discovery and reconciliation**, is ACTIVE / UNACCEPTED on `stage/16-current-hosted-convergence-contract`. Its base is the desktop `main` SHA above. No booking-modal implementation, hosted API change, migration, production-data write, or Cashier work is authorized in this stage.
- Hosted repository `main` at discovery: `2b3bab3c9e71274c25d747daf37d7928ee670e2c`. Repository source is the current contract reference; deployed production behavior has not been independently verified.
- The existing desktop booking modal remains the normal-runtime implementation. Stage 16 records its compatibility against the hosted source in [the booking-modal assessment](../20-product/STAGE_16_BOOKING_MODAL_COMPATIBILITY.md).
- The Stage 15 Rust-owned SQLite foundation is still not wired to CRM modules. Real booking/customer payloads must not be persisted without a later authorized retention and at-rest policy.

See [Current Task](CURRENT_TASK.md), [Stage 16 evidence](../30-delivery/STAGE_16_DISCOVERY_EVIDENCE.md), and [Last Verified Gate](LAST_VERIFIED_GATE.md). Stage 16 completion does not authorize booking-modal implementation.
