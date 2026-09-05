# Stage 02 — Bookings Final Truth-State Correction Evidence

**Status: NOT ACCEPTED / NOT MERGED / AWAITING INDEPENDENT REVIEW.**
Stage 03 remains **NOT AUTHORIZED**.

- Desktop repository: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`.
- Existing branch: `stage/02-bookings`.
- Reviewed starting HEAD: `63cc5ce35a4eedee6fac94045ddf675c3a754ad3`.
- Accepted main BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Hosted repository: `https://github.com/techwithmpg/Cradlehub.git`.
- Fetched HOSTED_SHA inspected: `feda4600f37e93084fdb672bd0c2612e9872bb43`.
- Exact repository origins, clean starting worktrees, branch/HEAD and main baseline were checked before correction. Desktop and hosted refs were fetched; hosted HEAD matched its origin/main. The final correction commit is the commit carrying this evidence; its exact SHA is reported with the push result rather than a self-referential hash in this file.

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

Earlier owner observations reported cramped workspace width, a weak/invisible New Booking button, a resource relation error, tab scrolling, and the need for real New Booking behavior.

The owner has **not** visually confirmed reviewed HEAD `63cc5ce35a4eedee6fac94045ddf675c3a754ad3` or this correction. The previous claim of post-correction owner layout approval was incorrect and is withdrawn. The synthetic browser checks below are agent test evidence, not owner observations.

## INDEPENDENT REPOSITORY REVIEW

The supplied independent review identified the earlier direct renderer writes as incompatible with the hosted booking contract. Those writes had already been replaced by a fail-closed helper at the reviewed starting HEAD. This pass removes its UI invocation and addresses the reviewed catalog fallback, eligibility, error states, disabled creation, dirty/reset lifecycle and evidence inaccuracies. Independent review findings are separate from owner runtime evidence; this pass still awaits a new independent review.

## REPOSITORY-RECORDED PRODUCTION EVIDENCE

This heading means behavior recorded in the pinned hosted source. It does not mean deployed production behavior was exercised or independently verified. All paths below refer to hosted SHA `feda4600f37e93084fdb672bd0c2612e9872bb43`.

### Hosted action and authority

- `src/app/(dashboard)/crm/bookings/new/page.tsx` renders `QuickBookingForm` from `src/components/features/bookings/quick-booking-form.tsx`.
- The form invokes server-only `createInhouseBookingMultiAction` in `src/lib/actions/inhouse-booking.ts`.
- That action calls the authenticated Supabase client's `auth.getUser()`, then selects `id, branch_id, system_role` from active `staff` by `auth_user_id`. It canonicalizes `system_role` and, outside the explicit development bypass, requires staff plus `canAccessCrmWorkspace(staffRole)`. It resolves the requested/staff branch, rejects missing branch, and rejects cross-branch access for non-owner staff. The development bypass is present in hosted source and was not adopted in desktop. This action does not use the previously claimed `requirePermission('bookings:create')` path.
- The hosted server action uses privileged server-side operations for customer resolution, sequential service bookings, exact provider/resource checks and payment/audit effects. It assigns the resolved provider to the sequential service rows. These operations cannot be replaced with renderer table inserts.
- `src/app/api/crm/bookings/route.ts` exports a listing `GET`. Inspection/search of the API route tree found no desktop-callable booking-creation endpoint implementing this action's contract. Existing availability/distance endpoints do not authorize booking creation. No hosted boundary was added.

### Catalog and delivery eligibility

- `src/lib/queries/quick-booking-options.ts` loads `getBranchServiceCatalog(branchId, { audience: 'crm' })`.
- `src/lib/services/service-catalog.ts` and `service-eligibility.ts` require both the global service and branch membership to be active; apply branch price/duration overrides; normalize canonical `visibility` and legacy `booking_visibility`; expose public/internal visibility to CRM; and require the requested delivery flag. Home service also requires `homeServiceEnabled` from branch booking rules.
- Hosted legacy normalization can default missing visibility to public and missing in-spa flags to true, and the catalog supports older column shapes. Desktop intentionally uses a narrower modern-column read: explicit supported visibility/delivery flags, finite nonnegative price and positive duration. Unknown flags/visibility are excluded; absent columns produce an error instead of a global fallback.
- Hosted `src/lib/queries/branch-booking-rules.ts` uses a privileged server client and defaults. Desktop reads only `home_service_enabled` from `branch_booking_rules` with the existing authenticated client and branch filter. A missing/RLS-hidden row cannot enable home service. An explicit read error fails the options load. No hosted default or privileged read is copied into the renderer.
- Hosted migration `20260702064926_transactional_booking_payment_update.sql` records authenticated branch-scoped CRM/management SELECT access to branch booking rules. That repository policy is not proof of current live grants/RLS, which were not exercised in this pass.

### Provider semantics

- `src/lib/queries/quick-booking-options.ts` reads `staff` directly, scoped by branch, `is_active = true`, `archived_at IS NULL`, and `merged_into_staff_id IS NULL`, including `staff_type`, `system_role` and `staff_services(service_id)`. It does not use the earlier claimed branch_staff join or fictional provider/merged/status fields.
- `src/lib/staff/service-providers.ts` retains hard exclusions for `driver`, `digital_marketer` and `utility`, even with a capability row.
- `src/lib/engine/exact-crm-booking-time.ts` checks a single provider against the complete selection. Home service requires explicit capability for every service. In-spa calls `canScheduledProviderPerformServices` in `src/lib/bookings/scheduled-provider-roster.ts`, which requires every service to be explicitly assigned or supported by staff-type/service-category inference.
- Desktop deliberately requires explicit `staff_services` capability for **every** selected service in all modes, a narrower subset of hosted in-spa inference. It does not claim provider schedule, check-in, booking conflict, travel-time or resource availability verification. No role alone establishes selected-service capability in the modal.

## Corrections and behavior

1. Empty `branch_services` stays empty, with no global `services` request. Active/visibility/mode filtering and branch overrides are applied before display. Home-service enablement must be explicitly readable and true.
2. Walk-in, phone and future modes show only in-spa services; home mode shows only home-eligible services. Switching removes invalid selections and picks an eligible default only when one exists. Provider options must cover the entire service selection; a now-ineligible provider is cleared.
3. Customer query errors reject. The UI shows “Customer search unavailable” separately from successful “No matching customers.” Query version guards ignore late successes, failures and completion callbacks; selection/clear/close invalidate pending search.
4. Services, staff, resources and rules load as one coherent option snapshot. Any failed read is an explicit options error, with corresponding unavailable messages; successful empty lists have distinct services/provider/resource messages. The previous snapshot is never used as a fallback.
5. The CTA is genuinely disabled and reads “Booking Creation Unavailable.” Its accessible description points to one compact workflow-preview notice. Form submission only prevents the default event. `createBranchBooking` is not imported or invoked by the modal; the helper still returns `HOSTED_WRITE_BOUNDARY_REQUIRED` defensively. There is no save state or success simulation. Payment labels explicitly describe a preview.
6. The stateful form unmounts on close and is keyed by branch. Reopen or branch change creates fresh defaults, clears all inputs, selections, search/errors/discard state and options, and starts a fresh load. Old option responses are ignored. No fake successful-creation path is recorded.
7. Dirty detection compares exact values for mode, selected customer, search query, full name, phone, email, ordered service IDs, provider, resource, date, time, notes, address, barangay, city, payment flag and method. Initial date/time are captured per opening; the first eligible in-spa service is the canonical service default. Exact reversion is pristine. Merely touching a field is not dirty.
8. No changes to CSS, the wide Bookings workspace, three-card layout, distributed tabs, high-contrast New Booking entry button, canonical shell or `branch_resources!bookings_resource_id_fkey` listing relation. Their preservation is supported by the scoped diff, not a new owner approval.

## Exact changed files in this correction

- `src/lib/bookings-service.ts`
- `src/components/bookings/NewBookingModal.tsx`
- `tests/bookings-service.test.ts`
- `tests/bookings-components.test.tsx`
- `tests/booking-options.test.ts`
- `tests/booking-preview.test.tsx`
- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/evidence/stage-02-bookings.md`

## Local checks

These results were run locally for this correction. They are not GitHub CI and do not inherit an earlier stage's pass.

| Command                                              | Result                                                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm format`                                        | PASS; Prettier applied                                                     |
| `pnpm format:check`                                  | PASS                                                                       |
| `pnpm lint`                                          | PASS; zero warnings/errors                                                 |
| `pnpm typecheck`                                     | PASS                                                                       |
| `pnpm test`                                          | PASS; 133 tests in eight files                                             |
| `pnpm build`                                         | PASS; TypeScript and Vite production build                                 |
| `cargo fmt --check`                                  | PASS, from src-tauri                                                       |
| `cargo check --locked`                               | PASS, from src-tauri                                                       |
| `cargo test --locked`                                | PASS; zero unit/doc tests defined, from src-tauri                          |
| `cargo clippy --locked --all-targets -- -D warnings` | PASS, from src-tauri                                                       |
| `git diff --check`                                   | PASS                                                                       |
| `git status --short --branch`                        | Inspected for same-branch scope; final clean status verified with delivery |

The new regression suites cover branch-only catalog behavior, activity/visibility/overrides/modes/rules, role exclusions and capabilities, failed versus empty reads, disabled submission in every mode, dirty/revert behavior, all reset fields, same-branch reopening, branch changes and late option/search responses. Existing listing/FK and component tests remain passing.

The first test-mock type check and the first lint check found issues, which were corrected before the passing checks above. An isolated fixture bootstrap initially used an incompatible Vite helper; the fixture was corrected without adding dependencies or changing product code.

### Separate rendered fixture check

Browser skill/plugin was not available; bundled Playwright with headless Microsoft Edge was used. A temporary script outside the repository (`work/stage02-visual.mjs` in the task workspace) served only a clearly marked synthetic fixture at `http://127.0.0.1:1432/__stage02_fixture`, with external requests blocked. It imported the real modal and compiled CSS and substituted controlled read responses. No test fixture was added to normal runtime or committed.

Page identity, nonblank content, absence of Vite overlay, zero browser errors/warnings, mode selection, distinct customer-search failure and discard/reopen reset passed. Modal bounds and the visible disabled CTA passed at 1440×900, 1366×768 and 1024×768. Screenshots were inspected and saved outside the repository in the task outputs (`stage02-preview-1440.png`, `stage02-preview-1366.png`, `stage02-preview-1024.png`, `stage02-preview-home-error.png`). This is not a native WebView2/live-auth/RLS test, a production claim or owner acceptance.

## Security and data impact

- Production data, schema, migrations, RLS, Auth configuration and hosted source changes: **none**.
- No privileged credentials, admin clients, dependency changes or renderer mutations were introduced. No live customer/staff data was used in the tests.
- Source scans for booking/customer inserts, `createAdminClient`, `SUPABASE_SERVICE_ROLE_KEY`, `service_role` and `service-role` were reviewed. These patterns produced no source matches; no booking/customer insert path exists.
- Full correction diff against `63cc5ce35a4eedee6fac94045ddf675c3a754ad3` was reviewed for scope and whitespace. Hosted source remained clean at the pinned SHA.

## Remaining blocker and gate

Authoritative New Booking mutation still requires a separately authorized hosted server-side desktop-callable write boundary. It must perform authenticated role/branch enforcement and the canonical hosted booking workflow. That work is outside this correction.

This correction is to be committed and pushed on `stage/02-bookings` only, then stopped for independent review. No merge, owner acceptance or Stage 03 authorization is recorded.
