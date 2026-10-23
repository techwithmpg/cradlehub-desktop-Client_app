# Current State

## Current development state (2026-10-23)

- Desktop `main` is at `1faa7493de961de3b314b8c1b28409ecdabf91ba`.
- Hosted `main` is at `2b3bab3c9e71274c25d747daf37d7928ee670e2c`.
- Stage 17 is **PARKED / UNACCEPTED — OUTSTANDING REVIEW CORRECTIONS**.
  - Desktop branch: `stage/17-intake-booking-modal` at `a76a32d665b1b702ec4cff3337ef4fbdf6ceb56b` (clean, 762/762 passing tests, unmerged).
  - Hosted branch: `stage/17-desktop-location-endpoints` at `272339a5d49e39b86160c541bb63d5c09841f81a` (clean, 10/10 passing tests, unmerged).
- Stage 18 (CRM Cashier Workspace) is **COMPLETE ON STAGE BRANCH / STOPPED FOR INDEPENDENT REVIEW**.
  - Desktop branch: `stage/18-crm-cashier` (clean, 758/758 passing tests across 35 test files, 0 lint warnings, clean build).
  - Hosted branch: `stage/18-desktop-cashier-endpoints` at `6f648c946983152a7995f5e9fe7fde3e8b524b0d` (pushed to origin, 12/12 cashier tests passing, 123/123 desktop v1 tests passing).
  - Pass A (Cashier Contract Audit), Pass B (Hosted Financial API), Pass C (Navigation & Design System), Pass D (Fast Workflows & Modals), Pass E (Drawer & Day Close), Pass F (History & Ledger), and Pass G (Closeout & Evidence) are all complete.
  - See [Stage 18 Evidence](evidence/stage-18-crm-cashier.md) for full implementation and verification details.

## Historical accepted-stage record

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.
Stage 03 is **ACCEPTED / MERGED / CLOSED** at `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
Stage 04 is **ACCEPTED / MERGED / CLOSED** at `9bd83ab8f05ace193d026de896b70f3a4eff363d`.
Stage 05 (Canonical Module Workspace) is **ACCEPTED / MERGED / CLOSED** on `main`.

- **Pre-Stage Main Baseline (PRE_STAGE_MAIN_SHA)**: `9bd83ab8f05ace193d026de896b70f3a4eff363d` on `main`.
- **Accepted Stage Branch Tip (ACCEPTED_STAGE_BRANCH_TIP)**: `65c7eb371652c3f272b75bda55c437481867abc1` (`stage/05-canonical-module-workspace`).
- **Main Immediately After Fast-Forward (MAIN_AFTER_FAST_FORWARD)**: `65c7eb371652c3f272b75bda55c437481867abc1`.
- **Stage 05 Closeout Main SHA (STAGE_05_CLOSEOUT_MAIN_SHA)**: `19284eeb83db32c2e02d72f38010c1ac91a08b6f`.
- **Implementation Code SHA (IMPLEMENTATION_HEAD_SHA)**: `409c712f1e12ec855b787bfa2d4c94c1ed2dfc85`.
- **Merge Style**: `FAST-FORWARD` (`git merge --ff-only`).
- **Canonical Hosted Reference (HOSTED_REFERENCE)**: `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Owner Confirmation**: Owner explicitly accepted Stage 05 after independent review.
- **Evidence & Runtime Assessment**: AGENT VIEWPORT QA: NOT PERFORMED — exact runtime inspection unavailable in the agent environment. Repository-level structural and automated regression checks passed; runtime visual equivalence was not independently agent-verified. Visual impact: NO INTENTIONAL VISUAL CHANGE.
- **Canonical Workspace Family**:
  - `src/components/workspace/ModuleWorkspaceHost.tsx`: Permanent neutral structural host in `CanonicalShell`.
  - `src/components/workspace/ModuleWorkspaceMount.tsx`: Neutral structural mount container in `CanonicalShell`.
  - `src/components/workspace/ModuleWorkspace.tsx`: Top-level workspace layout container (`.bookings-view-container`) as neutral container without nested main landmark.
  - `src/components/workspace/ModuleHeader.tsx`: Canonical header primitive with title, subtitle, refresh button, primary action button, and custom slots.
  - `src/components/workspace/ModuleSummary.tsx`: Composable KPI metrics (`ModuleSummaryCard`, `ModuleKpiGrid`, `ModuleKpiCell` with native button elements for interactive cells).
  - `src/components/workspace/ModuleMainGrid.tsx`: 2-column grid (`.bookings-main-grid`) with `ModulePrimaryColumn` and `ModuleInspectorColumn`.
  - `src/components/workspace/ModulePrimaryCard.tsx`: Operational card surface (`.bookings-list-card`).
  - `src/components/workspace/ModuleTabs.tsx`: In-card tab strip with ARIA and keyboard navigation.
  - `src/components/workspace/ModuleToolbar.tsx`: Standard toolbar container.
  - `src/components/workspace/ModuleDataGridFrame.tsx`: Table wrapper (`.bookings-datagrid-wrapper`) and table primitive (`.bookings-table`).
  - `src/components/workspace/ModulePagination.tsx`: Pagination footer with count, page size, and navigation.
  - `src/components/workspace/ModuleInspectorFrame.tsx`: Inspector shell and empty state.
  - `src/components/workspace/ModuleLoadingState.tsx`: Canonical skeleton loading geometry.
  - `src/components/workspace/ModuleStateMessage.tsx`: Error and success banners.
- **Module Migration**:
  - `Bookings`: Migrated to canonical workspace primitives with no intentional visual change.
  - `Staff`: Migrated to canonical workspace primitives preserving all 6 functional tabs, persistent summary, and sibling inspector with no intentional visual change.
  - `Customers`: Compatibility preserved with `ModuleWorkspaceHost` & `ModuleWorkspaceMount`. No redesign.
  - `Placeholders`: Kept truthful unavailable state; no fake dashboards or speculative caches.
- **Verification Baseline on Merged Main**:
  - 290 passing vitest tests across 14 test files (including 17 canonical component tests and 20 shell integration tests).
  - ESLint 0 errors / 0 warnings.
  - TypeScript `tsc --noEmit` clean.
  - Vite production build clean.
  - `pnpm format:check` clean.
  - `git diff --check` clean.
- **Stage 05 closeout next-step note**: At that closeout, Schedule / Stage 06 had not started and required separate owner authorization. Current development status is recorded above.

See [Stage 05 evidence](evidence/stage-05-canonical-module-workspace.md) for full implementation details.
