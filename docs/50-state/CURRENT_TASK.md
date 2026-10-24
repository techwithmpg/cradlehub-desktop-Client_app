# Current Task

## Integration Candidate Consolidation (Stages 17 & 18): **CONSOLIDATED / STOPPED FOR INDEPENDENT REVIEW**

- **DESKTOP_BASE_SHA**: `1faa7493de961de3b314b8c1b28409ecdabf91ba` on desktop `main`.
- **HOSTED_BASE_SHA**: `2b3bab3c9e71274c25d747daf37d7928ee670e2c` on hosted `main`.
- **Desktop Candidate Branch**: `stage/integration-candidate-17-18`.
- **Hosted Candidate Branch**: `stage/integration-candidate-17-18`.
- **Stage 17 Branches Consolidated**:
  - Desktop: `stage/17-intake-booking-modal` (`9e94c854ba1c66265fbf766657f10d3bf0a5d56b`).
  - Hosted: `stage/17-desktop-location-endpoints` (`54c992a7e722513f82029ee6faaeebf1d24bb56e`).
- **Stage 18 Branches Consolidated**:
  - Desktop: `stage/18-crm-cashier` (`6a1113b290dfb1ebdbb99d6d7be76cb5e94b29bb`).
  - Hosted: `stage/18-desktop-cashier-endpoints` (`3a53b24036cbff899a25b3a62886c8f85f543169`).
- **Targeted Corrections Applied**:
  - Correction 1 (P0): Canonical payment authorization with `canConfirmPayments()`, active staff identity verification, role boundary enforcement, and cross-branch prevention in hosted legacy payment writer and cashier routes.
  - Correction 2 (P1): History integrity without deriving inflows/outflows from `actual_cash`; null monetary values displayed truthfully as `—`; real reviewer identities without fabricated `'Staff'`; truthful error handling with retry.
  - Correction 3 (P0): Immutable financial retries in `RecordPaymentModal` and `RecordExpenseModal`; frozen payload and idempotency key snapshot; inputs locked during unresolved submissions; definitive (4xx) vs ambiguous (5xx/network) error differentiation; background refresh failure protection prevents double posting.
  - Correction 4 (P1): Order payment eligibility decoupled from outstanding balance; non-payable orders show truthful lifecycle status badge (`Completed`, `In Service`, `Waiting`, `Scheduled`) and explicit ineligibility reason; payment button disabled when `paymentEligible === false`.
  - Correction 5: Home Service location rate limiting fail-closed 503 behavior preserved cleanly without altering modal structure; infrastructure decision documented for Redis/Upstash distributed limiter in production.
- **Authorized Scope**:
  - Exactly one canonical desktop shell with 9 authorized CRM modules: Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings, and Cashier.
  - Booking modal preserves compact two-column layout, Walk-in, Phone/Future, Home Service with real Google Places address autocomplete, precise location verification, and driving distance quote.
  - Cashier workspace preserves all 5 tabs (Today, Ledger, Cash Drawer, Day Close, History), Pending Payment Queue, Paid & Closed, Record Payment modal, Record Expense modal, drawer operations, and Day Close summary.
  - Financial security, idempotency key preservation across retry attempts, partial payment queue retention, role and branch authorization checks.
- **Merge Readiness Gate Status**:
  - Integration candidates built, typed, linted, formatted, tested, and pushed on both repositories.
  - STOPPED for independent GitHub review and owner runtime acceptance.
  - NO merge into `main` has occurred. Main remains at baseline.

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
