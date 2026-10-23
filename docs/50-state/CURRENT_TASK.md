# Current Task

Stage 17 — Intake booking modal functional corrections & mode activation: **ACTIVE / UNREVIEWED** on `stage/17-intake-booking-modal`.

- **BASE_SHA**: `1faa7493de961de3b314b8c1b28409ecdabf91ba`, verified on desktop `main` and `origin/main` before implementation.
- **PRE_CORRECTION_HEAD_SHA**: `035263ca64f2a13ade27cb6691bb3566df8090b0` on `stage/17-intake-booking-modal`.
- **Previous correction gate**: The owner confirmed visual acceptance of the modal layout and requested functional activation of remaining modes (Phone, Future, Home Service).
- **Hosted reference**: `2b3bab3c9e71274c25d747daf37d7928ee670e2c`, verified on hosted `main`.
- **Authorized scope**: Activate Phone and Future modes with editable date/time, expected finish time calculation, and authoritative API submission; make Home Service selectable with editable address field, 6 location states, spa room removal, and fail-closed blocked save pending hosted place-search API contract; preserve existing Walk-in flow, customer search, and multi-guest configurations.
- **Stage 16 discovery**: Independently reviewed and owner confirmed on `stage/16-current-hosted-convergence-contract` at `79fca3dd27e6a56ef51aadd091490b1a0ae45d4d`; not merged into desktop `main`.
- **Delivery**: Commit and push to `stage/17-intake-booking-modal`, then stop for independent review. Do not merge into `main` or start another stage.

## Historical Stage 05 task and closeout record

Stage 05 — Canonical Module Body / Workspace Extraction: **ACCEPTED / MERGED / CLOSED** on `main`.

- **Pre-Stage Baseline (PRE_STAGE_MAIN_SHA)**: `9bd83ab8f05ace193d026de896b70f3a4eff363d` on `main`.
- **Accepted Stage Branch Tip (ACCEPTED_STAGE_BRANCH_TIP)**: `65c7eb371652c3f272b75bda55c437481867abc1` (`stage/05-canonical-module-workspace`).
- **Main Immediately After Fast-Forward (MAIN_AFTER_FAST_FORWARD)**: `65c7eb371652c3f272b75bda55c437481867abc1`.
- **Stage 05 Closeout Main SHA (STAGE_05_CLOSEOUT_MAIN_SHA)**: `19284eeb83db32c2e02d72f38010c1ac91a08b6f`.
- **Implementation Code SHA (IMPLEMENTATION_HEAD_SHA)**: `409c712f1e12ec855b787bfa2d4c94c1ed2dfc85`.
- **Canonical Hosted Reference (HOSTED_REFERENCE)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`.
- **Owner Confirmation**: Owner explicitly accepted Stage 05 after independent review.

Stage 05 Workspace Extraction Closeout Summary:

1. **Extraction Complete & Accepted**: Canonical workspace component family established in `src/components/workspace/` (14 primitives + export barrel).
2. **Bookings & Staff Migrated**: Both Bookings and Staff migrated to consume canonical primitives with no intentional visual change (automated test suite passed; runtime visual equivalence was not independently agent-verified).
3. **ModuleWorkspaceHost & Mount Integrated**: Shell mounts active modules through a single neutral `ModuleWorkspaceHost` and `ModuleWorkspaceMount`.
4. **Post-Merge Verification Passed**: All checks passed on merged `main` (290 tests across 14 test files, 0 lint warnings, clean build).
5. **Stage 05 closeout next-step note**: The next stage required explicit owner authorization; Schedule (Stage 06) had not started at that closeout and was not part of Stage 05. Current work is recorded above.
