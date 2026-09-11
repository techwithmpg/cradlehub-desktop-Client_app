# Stage 08B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 08B — Desktop Home Service UI

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/08b-desktop-home-service-ui`

**BASE_SHA:** `88631802b6d16c7dae2061a733eb60c6cdff359c`

**HEAD_SHA:** `8647b85b52a67c0240a73dbfe2d22efc392d51a5`

**Accepted Hosted Contract SHA:** `045e9193ae9cac427c13ddf97b053dee34f6ea62`

> `HEAD_SHA` records the previous remote HEAD. The current commit applies review corrections for canonical typography, duplicate evidence removal, and accurate evidence classification.

---

## Authorized Scope

Implement and verify the Stage 08B Desktop Home Service UI against the accepted hosted Stage 08A Home Service contract while preserving the canonical desktop shell, shared design system, authentication boundary, server-resolved branch authority, and hosted CradleHub as canonical online truth.

Implemented and verified:

- Home Service workspace mounted via `CanonicalShell` (`activeModule === 'home-service'`)
- Dispatch Queue with KPI summary counters, search, status filters, area filters, service filters, and scope tabs (All, Needs Dispatch, On the Way, Active Service, Completed)
- Permanent HomeServiceMapCard displaying truthful customer coordinates, driver snapshot, recorded timestamps, and no fake route/ETA fabrication
- Dispatch Details Modal displaying authoritative booking details, timeline, service items, and mutation controls
- Drivers tab displaying real Active Staff records, assigned counts, active dispatches, and latest recorded snapshot
- Location Map tab presenting truthful static coordinates context without unauthorized mapping provider integration
- Authoritative mutations: `assign_driver`, `assign_therapist`, `prepare_dispatch`, `release_to_driver`, `reschedule`, `cancel`
- Canonical typography: all text strictly conforms to the existing desktop typography hierarchy (10px to 16px; no sub-10px micro-fonts, no bespoke scale)

---

## Changed Implementation Files

- `src/components/CanonicalShell.tsx`
- `src/components/home-service/HomeServiceMapCard.tsx`
- `src/components/home-service/HomeServiceView.tsx`
- `src/lib/home-service-service.ts`
- `src/styles.css`
- `src/types/home-service.ts`
- `tests/home-service-components.test.tsx`
- `tests/home-service-service.test.ts`
- `docs/30-delivery/STAGE_08B_EVIDENCE.md`

_(Accidental root duplicate `STAGE_08B_EVIDENCE.md` was removed.)_

---

## Repository Evidence

**REPOSITORY-RECORDED PRODUCTION EVIDENCE**

Repository verification confirms:

- **Mount & Auth**: Home Service mounts cleanly through `CanonicalShell`. All hosted requests call authoritative `/api/desktop/v1/home-service*` endpoints using Bearer token authentication.
- **Branch Authority**: Branch authority is resolved strictly by the server from the authenticated session; no client-side branch override is sent or permitted.
- **Zero Secrets**: No service-role secrets or privileged credentials exist in the client/renderer bundle.
- **Zero Simulation**: No simulated success, fake route optimization, fabricated ETAs, artificial driver movements, or synthetic ratings exist.
- **Failures Remain Failures**: Network failures, 4xx/5xx responses, and malformed payloads are caught and surfaced via accessible error banners; they do not masquerade as empty state.
- **Truthful Mapping State**: MapCard renders real coordinates when present, shows `Coordinates pending` when absent, and clearly labels driver snapshots with provenance and timestamp.
- **Dispatch Details Modal**: Automated component tests prove that the modal opens upon row selection (click or Enter/Space), displays authoritative booking details, timeline, and service items, surfaces detail loading errors gracefully, and closes via close button or Escape key while retaining queue selection.
- **Canonical Typography**: All Home Service font sizes and styles strictly inherit from the established desktop typography system:
  - Module/Dialog Headings: 14px – 16px, font-weight 700 / 600
  - Section Headings & Top Tabs: 13px, font-weight 600
  - Primary Table Data & Inputs: 12px
  - Filters, Subtabs, Action Buttons, Definition Terms: 11px / 11.5px
  - Table Headers, Badges, Status Chips, Captions, Timestamps: 10px, font-weight 600
  - No bespoke micro-fonts below 10px exist.
- **Code-Level Viewport Adaptability**: Layout responsiveness and breakpoint rules (1440×900, 1366×768, and degraded 1024×768) were verified via CSS inspection and automated test rendering; native runtime viewport verification is deferred to final system QA.

---

## Owner-Provided Manual Runtime Evidence

**OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**

The following owner-provided manual runtime evidence was established:

- The owner launched the real Desktop runtime.
- The owner successfully reached the authenticated Desktop runtime after login screen startup was restored.
- The owner visually inspected the Home Service workspace.
- The owner accepted the visible Home Service UI composition for now (Dispatch Queue + permanently visible MapCard + Dispatch Details Modal interaction).
- The owner chose the Dispatch Queue + enlarged location area + modal design.
- The owner deferred exhaustive cross-system testing and live sample booking end-to-end walkthrough until later.

_(Note: Manual opening/interaction with the Dispatch Details modal against a real populated queue booking and multi-viewport native verification were not part of the owner's initial visual inspection pass and remain deferred to final system QA.)_

---

## Home Service Pickup Test Findings

_(Investigated via read-only hosted database inspection and automated test suites, NOT claimed as owner runtime evidence)_

Investigation of the sample booking ("testing 2", ID `6800dafe-ff21-49b5-b061-67aab0eac228`):

1. **Date Filtering**: The booking date in the hosted database is `2026-09-12`. Desktop was displaying `2026-09-11` (today). When the Desktop date control is set to `2026-09-12`, the hosted query correctly returns the booking.
2. **Type & Delivery Type**: The booking has `type: "home_service"` and `delivery_type: "home_service"`, matching the hosted query criteria (`type = home_service OR delivery_type = home_service`).
3. **Branch Context**: The booking belongs to `branch_id: "c1000000-0000-0000-0000-000000000001"` (Main Spa), matching the authenticated staff branch.
4. **Location Review & Readiness**: The booking has `needs_location_review: true`. This hosted warning **does not** hide the booking from the dispatch queue; it correctly flags the queue item with `needsLocationReview: true`, renders a `GPS Location Needed` alert, and surfaces location review status truthfully in both the queue and the details modal.
5. **Dispatch Status**: With `driver_id: null`, the dispatch status is correctly evaluated as `awaiting_driver`.
6. **Conclusion**: There is no contract or implementation defect. The initial non-appearance was purely a date filter mismatch (`2026-09-11` vs `2026-09-12`).

---

## Exact Automated Checks & Results

All repository checks pass:

- **Vitest**: `pnpm test`
  - Total test files: **21 passed (21)**
  - Total tests: **390 passed (390)**
  - Service tests: 12 passed (`tests/home-service-service.test.ts`)
  - Component tests: 18 passed (`tests/home-service-components.test.tsx`)
- **TypeScript**: `pnpm run typecheck` (`tsc --noEmit`)
  - Result: **0 errors** (exit code 0)
- **ESLint**: `pnpm run lint` (`eslint . --max-warnings 0`)
  - Result: **0 warnings, 0 errors** (exit code 0)
- **Prettier**: `pnpm run format:check` (`prettier --check .`)
  - Result: **All matched files use Prettier code style** (exit code 0)
- **Vite Build**: `pnpm run build` (`tsc --noEmit && vite build`)
  - Result: **Production build successful** (exit code 0)
- **Git Diff**: `git diff --check`
  - Result: **0 whitespace or formatting defects** (exit code 0)

---

## Security and Data Impact

- No database schema or migration required or modified.
- Hosted online repository (`E:\cradlehub`) was inspected read-only and remained completely untouched at SHA `045e9193ae9cac427c13ddf97b053dee34f6ea62`.
- Renderer strictly adheres to desktop security posture: no privilege elevation, no service-role secrets, no direct database queries from client.

---

## Known Limitations

- Home Service sample pickup/location-zone behavior has been verified against hosted data and unit/component test suites; live in-app end-to-end walkthrough remains subject to owner sign-off.
- Interactive map provider (e.g. Leaflet / Google Maps / Mapbox) is deliberately not connected to prevent unauthorized CSP/network capability expansion in Tauri without separate authorization.
- Continuous live driver tracking is not implemented; snapshot timestamps are displayed truthfully.
- Route optimization is not implemented.
- Home Service booking creation remains disabled in Desktop until precise location/address geocoding support is connected.
- Native runtime verification of the Dispatch Details modal with a live booking and exhaustive multi-viewport manual runs are deferred to final system QA.

---

## Rollback Instructions

To rollback Stage 08B changes:

```bash
git checkout stage/08b-desktop-home-service-ui
git reset --hard 88631802b6d16c7dae2061a733eb60c6cdff359c
```
