# Stage 17 — Evidence

**Target:** Booking Modal Layout, Density, and Functional Mode Activation (Phone, Future, Home Service)

**Stage / Task:** Stage 17 — Intake Booking Modal Parity Corrections & Mode Activation

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/17-intake-booking-modal`

**BASE_SHA:** `1faa7493de961de3b314b8c1b28409ecdabf91ba`

**PRE_CORRECTION_HEAD_SHA:** `035263ca64f2a13ade27cb6691bb3566df8090b0`

**Hosted web reference SHA:** `2b3bab3c9e71274c25d747daf37d7928ee670e2c`

## Authorized scope

1. **Layout & Density (Owner Accepted):**
   - Corrected `NewBookingModal` layout, density, and workflow to match the owner-approved reference (`media_1792744377414.jpg`) without rebuilding from scratch.
   - Dialog geometry (~1220px max width, ~86vh max height, 70/30 split, controlled scroll).
   - Single compact Customer Information card with merged searchable customer name (`#customer-fullname`), phone, email, notes.
   - Self-contained Guest Cards with category filter pills, service carousel, duration pills, auto/override therapist & room, date/start/finish time.
   - Non-financial intake constraints respected (`showFinancialFields=false`).

2. **Phone & Future Booking Mode Activation:**
   - Phone and Future options made visibly selectable, keyboard accessible, and functionally active inside the Phone / Future mode card.
   - **Phone Mode:**
     - Header displays `New Booking – Phone Booking`.
     - Summary banner displays `Phone booking`.
     - Editable date and start time.
     - Automatically calculated expected finish time.
     - Preserves customer information, guest services, therapist/room assignment options.
     - Submits via authenticated desktop API (`POST /api/desktop/v1/bookings`) with `mode: 'phone'`, `type: 'phone'`, `crmBookingMode: 'phone'`.
   - **Future Mode:**
     - Header displays `New Booking – Future Booking`.
     - Summary banner displays `Future booking`.
     - Editable date and start time, initializing date to tomorrow if currently today (`min={defaults.date}`).
     - Automatically calculated expected finish time.
     - Preserves all guest service configurations.
     - Submits via authenticated desktop API (`POST /api/desktop/v1/bookings`) with `mode: 'standard_future'`, `type: 'walkin'`, `crmBookingMode: 'standard_future'`.
   - **Walk-in Preservation:**
     - Walk-in continues using automatic read-only branch business date/time.
     - Switching between modes preserves customer details, phone, email, notes, and guest services without silent discard. Switching back to Walk-in resets date/time to branch defaults.

3. **Home Service Mode & Geolocation Contract:**
   - Mode card selectable (`disabled: true` removed).
   - Retains Customer Information card with merged customer name search, phone, email, and notes.
   - Added clearly labeled Home Service Address field (`#hs-address`) inside Customer Information.
   - Address input is fully editable (not disabled).
   - Preserves 6 distinct location states: `not_entered`, `entering`, `pending`, `verified`, `failed`, `service_unavailable`.
   - Services filtered to `availableHomeService === true`.
   - Spa room selector replaced with "No room required (Home Service)" (`data-testid="hs-no-room"`).
   - Header displays `New Booking – Home Service` and summary displays `Home Service booking`.
   - **Fail-Closed Creation Boundary:**
     - Hosted booking schema requires precise location data (`place_id`, formatted address, `latitude`, `longitude`, and computed transportation fee).
     - The Tauri client capability strictly restricts requests to `/api/desktop/v1/*`. No endpoint exists on the hosted desktop API for Google Places autocomplete, geocoding, or transportation fee calculation.
     - Privileged Google API keys are NOT placed in the renderer.
     - Free-text address is NOT interpreted as verified location; no coordinates or fees are fabricated.
     - Save button is disabled with explanatory notice (`data-testid="hs-save-blocked-notice"`).
     - `createBranchBooking` fails closed with code `HOME_SERVICE_LOCATION_REQUIRED`.

## Changed files

- `src/components/bookings/NewBookingModal.tsx`: Activated Phone, Future, and Home Service modes; interactive Phone/Future tabs; editable date/time with finish time calculation; editable Home Service address field with 6 status states; room selector replacement for Home Service; disabled Save button with explanatory notice; state preservation across mode switching.
- `src/lib/bookings-service.ts`: Mapped `type` and `crmBookingMode` for Phone and Future bookings; preserved fail-closed `HOME_SERVICE_LOCATION_REQUIRED` guard for Home Service creation.
- `src/styles.css`: Added styles for Phone/Future sub-buttons, Home Service address card, location status badges (neutral, info, warning, success, error), service-unavailable wrap, and Home Service save blocked notice.
- `tests/bookings-service.test.ts`: Added unit tests verifying Phone mode payload (`type: 'phone'`, `crmBookingMode: 'phone'`), Future mode payload (`type: 'walkin'`, `crmBookingMode: 'standard_future'`), and Home Service creation fail-closed rejection.
- `tests/booking-preview.test.tsx`: Updated Home Service test from testing disabled tab to testing selectable tab, editable address input, replaced spa room, and blocked save.
- `tests/booking-modal-layout-corrections.test.tsx`: Added comprehensive tests covering Phone mode selection and submission, Future mode selection and submission, mode switching state preservation, and Home Service address status transitions and blocked save.
- `docs/30-delivery/STAGE_17_EVIDENCE.md`: This evidence record.
- `docs/50-state/CURRENT_STATE.md`: Updated active state documentation.
- `docs/50-state/CURRENT_TASK.md`: Updated current task documentation.
- `docs/50-state/HANDOFF.md`: Updated handoff notes.
- `docs/50-state/LAST_VERIFIED_GATE.md`: Updated gate notes.

## Contract evidence

### Repositories verified

- Desktop base commit: `1faa7493de961de3b314b8c1b28409ecdabf91ba`.
- Desktop pre-functional head: `035263ca64f2a13ade27cb6691bb3566df8090b0`.
- Hosted reference commit: `2b3bab3c9e71274c25d747daf37d7928ee670e2c`.
- Approved design: Owner visual inspection of layout and density approved; functional mode corrections requested.

### Missing server contracts

- Home Service requires an authoritative place-search and transportation-fee service on `/api/desktop/v1/` to satisfy the hosted booking schema without exposing Google Maps API credentials in the desktop renderer.
- Until an authorized desktop endpoint (`/api/desktop/v1/places/search`, `/api/desktop/v1/home-service/quote`) is published by the hosted platform, Home Service creation remains blocked fail-closed.

## Exact checks

| Command / Check        | Result | Notes                                                                            |
| ---------------------- | ------ | -------------------------------------------------------------------------------- |
| `npm run typecheck`    | PASSED | `tsc --noEmit` exited 0 with 0 errors                                            |
| `npm run lint`         | PASSED | `eslint . --max-warnings 0` exited 0 with 0 warnings                             |
| `npm run format:check` | PASSED | Prettier verified all source files                                               |
| `npm test`             | PASSED | 754 tests passed across 34 test files (including new mode activation unit tests) |
| `npm run build`        | PASSED | `tsc --noEmit && vite build` bundled client in 2.16s                             |
| `git diff --check`     | PASSED | 0 whitespace or formatting anomalies                                             |

## Security and data impact

- Production data changed? No.
- Schema/migration changed? No.
- Auth/RLS/Storage policy changed? No.
- Secrets introduced/exposed? No. No Google API keys in Tauri bundle/renderer.
- Privileged server behavior changed? No.
- Tauri capabilities changed? No.

## Limitations

- Multi-guest group bookings share a single booking date and start time per hosted platform constraints.
- Home Service bookings cannot be submitted until the hosted backend provides an authenticated desktop place-search and transportation quotation endpoint.

## Rollback

- Revert the branch to pre-functional commit:
  `git checkout stage/17-intake-booking-modal && git reset --hard 035263ca64f2a13ade27cb6691bb3566df8090b0`

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
