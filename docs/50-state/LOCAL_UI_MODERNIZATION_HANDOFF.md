# Local UI modernization handoff

**Status:** Owner-directed implementation prepared for remote publication and independent review. This is a development handoff, not an accepted-state record or a permanent governance amendment.

## Owner-directed workflow exception

The owner explicitly authorized one local-only modernization batch on the existing `main` checkout, with no branch/worktree creation and no automatic push. This exception applies only to this batch. The normal stage-branch and independent-review rules in `AGENTS.md` and `CHATGPT_PROJECT_RULES.md` have not been amended. The owner reported Stage 16 discovery independently reviewed and confirmed; its pushed branch was not merged or cherry-picked. The Stage 16 branch's active/unaccepted state files remain historical branch content and were not imported into `main`.

## Baseline and scope

- Target: `E:\Cradle-Destop-Client`, remote `techwithmpg/cradlehub-desktop-Client_app`.
- Initial checkout: clean `stage/16-current-hosted-convergence-contract` at `79fca3dd27e6a56ef51aadd091490b1a0ae45d4d`, tracking the pushed Stage 16 branch.
- `git fetch origin main` succeeded. Local `main` and `origin/main` both resolved to `5399ad6dbb1d447fdf3f47f47ef641ede3cfe1f2`; `main` had no unpublished commits. Switched the clean checkout to local `main` before editing.
- Source authority: hosted CRM remains authoritative for business data, authorization, and booking actions. This batch changes presentation only and retains the existing desktop API and booking modal.
- Out of scope: hosted/schema/RLS/data mutations, booking-modal replacement, Cashier, Finance, Operations redesign, persistence/sync, and multi-monitor work.

## Audit and implementation

- Preserved `CanonicalShell`, all eight authorized navigation items, retained module mounting and invalidation, shared workspace frames, the existing booking modal, and Tauri capabilities/CSP.
- Existing workspace controls were used by Bookings, Attendance, Customers, Schedule, Home Service, and Staff; `ModuleTabs` already had keyboard navigation, and the modal already had focus containment. Those working mechanisms were retained.
- The shell account menu had no Arrow Down opening or focus restoration. Today used filter buttons marked as tabs without a tab panel or arrow-key support, advertised F1–F4 shortcuts without handlers, and lacked a selectable booking detail view. Repeated raw buttons and hard-coded neutral colors reduced consistency. No runtime timing trace was available to justify virtualization or caching.
- Added shadcn CLI configuration for the existing Vite/TypeScript/Tailwind 4 project with the Radix style, disabled RSC, Lucide icons, and aliases. The CLI version used was `4.22.1`. Generated Button, Input, and Toggle Group source was adjusted to the existing CradleHub palette and CSP. No second theme or stylesheet was introduced.
- Shared `ModuleHeader` and `ModulePagination` now use the shared Button source. `ModuleLoadingState` exposes its existing label as a status. `CanonicalShell` account menu opens with Arrow Down, moves focus to Sign Out, and restores focus on Escape; existing session, branch, notification and sign-out behavior remains.
- Today is presented as an Intake workspace. It retains connected data, search, queue actions, current booking modal entry points, and the original right-rail status cards. Its stage filter now uses a Radix Toggle Group, search uses the shared Input, action cards are denser, false shortcut labels were removed, and a selection button opens an inspector built on `ModuleInspectorFrame` using only fields already returned by the Today endpoint. A Bookings quick action joins the existing module links. Missing data uses explicit unavailable wording.

## Dependencies and licensing

Exact direct versions: `@radix-ui/react-slot@1.5.0` (MIT), `@radix-ui/react-toggle-group@1.2.1` (MIT), `class-variance-authority@0.7.1` (Apache-2.0), and `clsx@2.1.1` (MIT). Package metadata was inspected locally. `pnpm-lock.yaml` is updated. The CLI's transient `cn` dependency and unused Toggle and `tailwind-merge` dependencies were removed after the generated sources were adapted. Compatibility is evidenced by TypeScript, component tests, the production build, and a native launch and normal close.

## Verification and impact

- Baseline production build: JavaScript 899.40 kB (217.80 kB gzip); CSS 167.82 kB (27.24 kB gzip).
- Final production build: JavaScript 932.99 kB (229.14 kB gzip); CSS 181.31 kB (29.19 kB gzip). This is a bundle-size regression of 33.59 kB JavaScript (11.34 kB gzip) and 13.49 kB CSS (1.95 kB gzip). Runtime load and navigation timing were not measured.
- Focused Today/workspace/shell test run: 79/79 passed. An initial full suite run exposed two tests that required the loading state's existing `aria-label`; that attribute was restored. Final full suite: 33/33 files and 729/729 tests passed.
- Final `pnpm build` (includes TypeScript), `pnpm lint`, `pnpm format:check`, and `git diff --check`: PASS. No native code changed, so Rust/Tauri checks were not run.
- Tauri/Rust was not changed. After the owner reported an access violation followed by a port-1420 collision, a stale Node/Vite process tree from the prior evening was identified as the port owner and stopped. `pnpm tauri dev` then started Vite, compiled Rust, launched a responsive `CradleHub Desktop` window, and exited with code 0 when the window was closed normally. An alternate-port run also launched and closed with code 0. The reported earlier access violation was not reproduced, and no matching Application Error event was found; its cause remains unconfirmed. No authenticated production endpoint or target viewport was observed.

## Publication handoff and rollback

The complete diff against `5399ad6dbb1d447fdf3f47f47ef641ede3cfe1f2` was reviewed before publication. On 2026-10-23, the owner explicitly requested that the local work be pushed to the remote. This handoff does not imply acceptance or authorize another stage. No merge, deployment, schema change, or production-data write is part of this batch. Git records the exact published commit; rollback should use a reviewed revert commit rather than resetting `main` or changing the Stage 16 branch.
