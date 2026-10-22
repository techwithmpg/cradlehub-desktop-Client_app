# Stage 16 — hosted booking contract discovery evidence

**REPOSITORY-RECORDED PRODUCTION EVIDENCE.** This record describes source and repository checks only. It does not establish the deployed hosted build or a native desktop booking outcome.

| Field                | Value                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| TARGET               | CradleHub Desktop                                                                                           |
| STAGE                | 16 — current hosted-contract discovery and reconciliation only                                              |
| BRANCH               | `stage/16-current-hosted-convergence-contract`                                                              |
| BASE_SHA             | `5399ad6dbb1d447fdf3f47f47ef641ede3cfe1f2` (`origin/main` at discovery)                                     |
| HEAD_SHA             | Report the pushed evidence commit SHA in the handoff; a commit cannot encode its own SHA.                   |
| HOSTED_AUTHORITY_SHA | `2b3bab3c9e71274c25d747daf37d7928ee670e2c` (hosted `main` reported by GitHub on 2026-10-22)                 |
| Runtime evidence     | NOT OBSERVED. No desktop modal, authenticated production endpoint, database row, or viewport was exercised. |

## Authorization and scope

The owner explicitly limited Stage 16 to inspecting the latest hosted modal, supporting components, booking engine, validation rules and available desktop APIs; documenting compatibility; reconciling active state; and pushing discovery evidence. Replacing the desktop modal, modifying hosted contracts, migrations, production data, and Cashier are not authorized. Stage 16 completion does not authorize an implementation stage.

Desktop `git fetch origin main` succeeded and local `main`, `origin/main` and the clean Stage 16 branch matched BASE_SHA. A direct hosted `git fetch` did not complete in the available execution session and was interrupted without using its `FETCH_HEAD` as evidence. The connected GitHub repository read independently returned the hosted `main` SHA above; all hosted file reads were pinned to it. Repository implementation is lower authority than independently observed deployment, which was unavailable here.

## Work performed and compatibility outcome

Read all eleven requested hosted files: `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx`, `quick-booking-service-selector.tsx`, `inline-service-duration-dropdown.tsx`, `administrative-booking.ts`, `inhouse-booking.ts`, `inhouse-booking-engine.ts`, `quick-booking-options.ts`, `booking.ts`, `booking-order-contract.ts`, and `service-line-quote.ts`. Also traced hosted Bearer auth, desktop bookings/customers/Schedule/Home Service routes, CRM and public availability, service-line quote, customer-search, precise-Place, Home Service distance, server quote resolution, and route tests. Inspected current desktop `NewBookingModal`, booking service/types, Today/Bookings/Schedule callers, canonical styling/focus boundary, and related tests. The [compatibility assessment](../20-product/STAGE_16_BOOKING_MODAL_COMPATIBILITY.md) includes pinned source links, an endpoint inventory, a feature matrix, proposed API work, test scope, security gates and open decisions.

Key findings:

- Bearer `POST /api/desktop/v1/bookings` delegates to the shared server engine and accepts hosted multi-guest/service-line fields. The current desktop payload does not send them or an idempotency key.
- CRM submission caps at four attendees. Groups share one date/start time, use automatic therapist/room allocation, and cannot promise exact per-guest therapists. The hosted form itself blocks selected group therapists; consultation-only group staffing needs a contract decision.
- Hosted quote, exact CRM availability and Home Service distance endpoints use web cookie authentication. No matching desktop Bearer endpoint was found in the hosted `src/app/api/desktop/v1/` tree at HOSTED_AUTHORITY_SHA. Direct desktop use would be an unverified auth assumption.
- Service prices/durations are server resolved with fixed/extendable policies and quote versions. The desktop catalog/preview lacks policy, quote version, category, image and description. A local price sum must not become booking authority.
- Home Service requires a selected precise Google Place, server driving-distance/fee quote, eligibility/rules, and dispatch checks. Current desktop submission correctly stays unavailable; a client fee formula or privileged renderer key is prohibited.
- The booking POST response returns booking ID and optional warning, omitting order/attendee/line identifiers. Its status mapper defaults several typed quote/distance errors to HTTP 500. This is an API compatibility issue for later authorization, not a Stage 16 edit.
- The annotated image describes hierarchy and density, but pictured guest-specific start times and payment behavior exceed or conflict with the current hosted submission/UI and the desktop financial boundary.

## Changed files

1. `docs/20-product/STAGE_16_BOOKING_MODAL_COMPATIBILITY.md` — pinned source assessment, parity matrix and later-stage contract/test/security scope.
2. `docs/30-delivery/STAGE_16_DISCOVERY_EVIDENCE.md` — this evidence record.
3. `docs/50-state/CURRENT_STATE.md` — current Stage 16 status and baseline, replacing stale Stage 05-only state.
4. `docs/50-state/CURRENT_TASK.md` — explicit discovery-only authorized task and stop point.
5. `docs/50-state/LAST_VERIFIED_GATE.md` — distinguishes historical Stage 15 checks from current Stage 16 verification.
6. `docs/50-state/HANDOFF.md` — points to active Stage 16 records rather than stale Stage 05 handoff.
7. `CHATGPT_PROJECT_RULES.md` — reconciles the stale Stage 01 current-stage sentence with the active Stage 16 discovery scope; permanent governance rules remain intact.

## Exact checks and results

No frontend, native or hosted runtime code changed, so automated booking behavior is not newly validated by this stage.

| Check                                                                 | Result                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Desktop `git fetch origin main`; base/branch/status inspection        | PASS at BASE_SHA before edits.                                                                 |
| Hosted and desktop `main` SHAs and pinned source reads through GitHub | PASS for repository source; both branch SHAs rechecked before commit. Deployment NOT OBSERVED. |
| `pnpm exec prettier --check` on the seven changed Markdown files      | PASS: all matched files use Prettier code style.                                               |
| Relative Markdown link target check on seven changed files            | PASS: zero missing local targets.                                                              |
| `git diff --check` and `git diff --cached --check`                    | PASS: tracked worktree and complete seven-file staged diff.                                    |
| Changed-file/scope review                                             | PASS: only the seven documentation files listed above are changed or new.                      |
| Frontend unit/type/lint/build and Tauri/Rust checks                   | NOT RUN for documentation-only discovery. Historical results are not inherited.                |
| Native viewport and authenticated production booking                  | NOT OBSERVED.                                                                                  |

## Security and data impact

Documentation only. No renderer code, secret, Tauri capability, Supabase policy/table, migration, hosted endpoint, database row, payment transaction, or local business-data cache was changed or exercised. The desktop remains bound to authenticated hosted mutation authority. This assessment does not approve production/database target mutation or a new Google Maps credential strategy.

## Limitations and rollback

No deployed-production or native UI behavior was verified. The GitHub source snapshot may differ from the deployed service. No live RLS/policy, group booking, quote, distance or retry behavior was exercised. The future implementation must be separately authorized and tested at actual target viewports and authenticated runtime. Rollback for this stage is a reviewed revert of the discovery-only documentation commit; no data/schema rollback is required.
