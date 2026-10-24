# Stage 17 — Evidence

**Target:** Booking Modal Layout, Density, Mode Unification, and Real Google Places Home Service Location Verification

**Stage / Task:** Stage 17 — Intake Booking Modal Parity Corrections, Unified Phone / Future Mode & Home Service Location Integration

**Status:** `READY FOR INDEPENDENT REVIEW`

**Desktop Branch:** `stage/17-intake-booking-modal`

**Desktop Base SHA:** `1faa7493de961de3b314b8c1b28409ecdabf91ba`

**Desktop Previous Head SHA:** `c4f0e721a40390eacdb29104a5a13a291ec75f2c`

**Desktop HEAD SHA:** `b5028e12dfce05b9dfd660e5aa0f3fc0d09a0f4a`

**Hosted Repository:** `https://github.com/techwithmpg/Cradlehub`

**Hosted Branch:** `stage/17-desktop-location-endpoints`

**Hosted Commit SHA:** `272339a5d49e39b86160c541bb63d5c09841f81a` (pushed to origin)

**Hosted Main Reference SHA:** `2b3bab3c9e71274c25d747daf37d7928ee670e2c`

---

## 1. Owner-Provided Manual Runtime Evidence

- The owner visually inspected the redesigned booking modal on desktop runtime and approved its visual layout, geometry, density, customer card, guest cards, and finish-time presentation.
- Screenshots provided by the owner are recorded as **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**, acknowledging visual satisfaction while establishing that functional API corrections, mode unification, and geolocation connectivity were required before delivery.

---

## 2. Phone / Future Mode Unification

1. **Exactly Three Visible Mode Options:**
   - `Walk-in` — customer is at the branch (Now · In branch).
   - `Phone / Future` — booking made in advance, with editable date and time (Call or schedule in advance).
   - `Home Service` — booking at customer's verified location (We go to customer).
2. **Removed Nested Buttons:**
   - Removed nested `.new-booking-mode-pair-actions` (`[ Phone ]` and `[ Future ]`) inside the Phone / Future card.
   - Entire card is a single `<button role="tab">` element with standard ARIA semantics.
   - Clicking anywhere on the Phone / Future card selects the unified mode.
3. **Behavior When Phone / Future Selected:**
   - Booking date is editable (`min={defaults.date}`).
   - Start time is editable (`<input type="time">`).
   - Expected finish time automatically updates based on service duration and start time.
   - Preserves customer lookup, customer details, therapist selection, and room assignment validation.
   - Summary panel displays `Phone / Future booking`.
   - Single-guest and group drafts supported.
4. **Backend Payload Contract Alignment:**
   - Hosted `createInhouseBookingMultiSchema` accepts only `'walkin'` and `'home_service'` for the booking `type` field.
   - Fixed desktop mismatch: unified Phone / Future bookings send hosted-valid `type: 'walkin'` with canonical `crmBookingMode: 'phone'`.
   - Preserves compatibility for callers passing `initialMode: 'phone'` or `initialMode: 'standard_future'`; both normalize cleanly to the unified Phone / Future state.
5. **Walk-in Mode Preservation:**
   - Automatic branch business date (`defaults.date`) and proposed quarter-hour start time (`defaults.startTime`).
   - Read-only date and start time controls.
   - Automatic time is not claimed as guaranteed available slot unless validated.
   - Switching between modes preserves customer info, phone, email, notes, and guest services. Switching back to Walk-in resets date/time to branch defaults.

---

## 3. Hosted Location API Implementation (`E:\cradlehub`)

Branch `stage/17-desktop-location-endpoints` at SHA `272339a5d49e39b86160c541bb63d5c09841f81a`:

1. **`POST /api/desktop/v1/locations/autocomplete`**:
   - Authenticated via bearer token and staff branch authorization.
   - Validates input: `query` (min 2 chars), `branchId`, optional `sessionToken`.
   - Resolves active branch coordinates for Philippine circular location bias (15 km radius) and country restriction (`ph`).
   - Calls Google Places API (New) autocomplete endpoint server-side.
   - Returns normalized predictions: `placeId`, `description`, `mainText`, `secondaryText`.
   - Protects Google API credentials server-side; zero secrets in response.
2. **`POST /api/desktop/v1/locations/resolve`**:
   - Authenticated and branch-authorized.
   - Validates `placeId` and optional `sessionToken`.
   - Calls Google Place Details endpoint using strict field mask (`id,formattedAddress,location,addressComponents`).
   - Returns authoritative place details: `placeId`, `formattedAddress`, `lat`, `lng`, `addressComponents`, `mapUrl`.
3. **`POST /api/desktop/v1/locations/distance-quote`**:
   - Authenticated and branch-authorized.
   - Uses hosted `calculateHomeServiceDistanceQuote` service.
   - Calculates authoritative Google driving distance (meters, km) and duration via Google Routes API.
   - Calculates branch-specific transportation fee according to branch pricing rules.
   - Returns authoritative quote: `distanceKm`, `drivingDistanceKm`, `distanceSource`, `travelFee`, `baseFee`, `includedKm`, `perKmFee`.
   - Zero straight-line approximations; fails closed if routes or pricing unavailable.

---

## 4. Desktop Home Service Google Location Integration (`E:\Cradle-Destop-Client`)

1. **Address Input & States:**
   - Single primary field labeled `Home Service Address` (`#hs-address-input`) inside the Customer Information card.
   - Local state lifecycle: `not_entered` -> `entering` (< 3 chars) -> `searching` (debounced 250ms) -> `suggestions_available` -> `resolving` -> `quoting` -> `quote_available` (or `failed` / `service_unavailable`).
   - Autocomplete suggestions dropdown (`.hs-address-suggestions-dropdown`) with keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
2. **Immediate Invalidation:**
   - Typing into the address field or clicking `Clear` immediately clears previous `placeId`, `resolvedLocation`, coordinates, and `distanceQuote`.
   - Free text alone is never treated as verified Google location.
3. **Authoritative Place Resolution & Quote Display:**
   - Selecting a suggestion calls hosted `resolveLocationPlace`.
   - Automatically requests authoritative `fetchDistanceQuote` using branch origin and resolved destination coordinates.
   - Verified location panel displays formatted address, driving distance (`X.X km`), travel fee (`₱XXX.XX`), and routes provider tag.
   - Summary panel updates with `Transportation Fee (X.X km)` line and recalculates `Total Amount` including travel fee.
4. **Conditional Save Enablement:**
   - Save button remains disabled with clear notice (`hs-save-blocked-notice`) while location is unverified or quote is missing.
   - Save becomes enabled ONLY when: valid customer name/phone, eligible Home Service service selected, date/time valid, Google location verified, and authoritative distance quote obtained.
   - On submission, sends payload:
     - `mode: 'home_service'`
     - `type: 'home_service'`
     - `deliveryType: 'home_service'`
     - `crmBookingMode: 'home_service'`
     - `homeServiceAddress`, `homeServicePlaceId`, `homeServiceFormattedAddress`, `homeServiceLat`, `homeServiceLng`, `homeServiceDistanceKm`, `homeServiceTravelFee`
     - Spa room (`resourceId`) omitted (`No room required (Home Service)`).

---

## 5. Security & Zero Secret Exposure

- Zero Google Maps API keys or service role credentials exist in the Tauri client, renderer bundle, or API responses.
- All Google API calls are mediated server-side through authenticated `/api/desktop/v1/locations/*` endpoints.
- Rate limiting, session token rotation, request cancellation, and field masks are enforced to prevent credential leakage and uncontrolled API consumption.

---

## 6. Changed Files

### Desktop Repository (`E:\Cradle-Destop-Client`)

- `src/types/bookings.ts`: Added `LocationPrediction`, `ResolvedLocation`, `DistanceQuote`, `HomeServiceLocationStatus` types; added location and quote fields to `CreateBookingInput`.
- `src/lib/bookings-service.ts`: Updated `createBranchBooking` payload mapping (`type: 'walkin'` for in-spa advance bookings, `type: 'home_service'` for home service, canonical `crmBookingMode`); added `generateLocationSessionToken`, `fetchLocationAutocomplete`, `resolveLocationPlace`, and `fetchDistanceQuote`.
- `src/components/bookings/NewBookingModal.tsx`: Unified Phone / Future into single card; removed nested sub-buttons; integrated debounced Google Places autocomplete, place resolution, distance quoting, immediate invalidation on any address edit, version-guarded async response handling to prevent stale overwrites, and conditional Save enablement.
- `src/styles.css`: Added styles for suggestions dropdown, verified location metrics card, distance quote line, and keyboard focus states.
- `tests/bookings-service.test.ts`: Added unit tests for session token generation, autocomplete, place resolution, distance quote, and payload construction.
- `tests/booking-preview.test.tsx`: Updated mode tab tests for unified Phone / Future mode; added legacy initial mode normalization test; updated Home Service tests.
- `tests/booking-modal-layout-corrections.test.tsx`: Added tests verifying exactly 3 visible mode tabs, no nested buttons, unified Phone / Future selection, legacy mode normalization, Home Service autocomplete, suggestion selection, distance quote, invalidation on edit, and rejection of stale in-flight responses.
- `tests/bookings-components.test.tsx`: Updated mode tab assertion from separate Phone/Future to unified Phone / Future.

### Hosted Repository (`E:\cradlehub`)

- `src/app/api/desktop/v1/locations/autocomplete/route.ts` & test (7 tests, including branch auth, query sanitization, and 429 rate limit)
- `src/app/api/desktop/v1/locations/resolve/route.ts` & test (4 tests, including branch auth, coordinate range validation, and 504 timeout)
- `src/app/api/desktop/v1/locations/distance-quote/route.ts` & test (3 tests, including staff branch isolation and quote calculations)
- `src/lib/locations/location-security.ts`: Rate limiting (60 req/min), query sanitization, branch authorization, and Google API timeout control.

---

## 7. Verification Evidence

### Desktop Checks (`E:\Cradle-Destop-Client`)

| Command / Check        | Result | Details                                                      |
| ---------------------- | ------ | ------------------------------------------------------------ |
| `npm run typecheck`    | PASSED | `tsc --noEmit` exited 0 with zero errors                     |
| `npm run lint`         | PASSED | `eslint . --max-warnings 0` exited 0 with zero warnings      |
| `npm run format:check` | PASSED | Prettier checked all files; 100% formatted                   |
| `npm test`             | PASSED | **763 passed across 34 test files (100% passing)**           |
| `npm run build`        | PASSED | `tsc --noEmit && vite build` built production client cleanly |
| `git diff --check`     | PASSED | 0 whitespace or conflict marker issues                       |

### Hosted Checks (`E:\cradlehub`)

| Command / Check                 | Result | Details                                                 |
| ------------------------------- | ------ | ------------------------------------------------------- |
| `pnpm test .../locations`       | PASSED | **14 passed across 3 test files (100% passing)**        |
| `pnpm tsc --noEmit`             | PASSED | Zero TypeScript errors in hosted location routes        |
| `pnpm eslint .../locations/...` | PASSED | Zero ESLint warnings / errors in hosted location routes |

---

## 8. Deployment Prerequisites

- The hosted branch `stage/17-desktop-location-endpoints` contains the authenticated Desktop v1 location routes and must be deployed to the hosted environment before live end-to-end Google Places queries can succeed in production.
- Until deployed, the desktop client fails closed truthfully with `service_unavailable` status, informing the receptionist that location services are not yet configured on the target server.

---

## 9. Rollback Plan

- **Desktop:** `git checkout stage/17-intake-booking-modal && git reset --hard c4f0e721a40390eacdb29104a5a13a291ec75f2c`
- **Hosted:** `git checkout stage/17-desktop-location-endpoints && git reset --hard 2b3bab3c9e71274c25d747daf37d7928ee670e2c`

---

## 10. Gate Status

`READY FOR INDEPENDENT SOURCE REVIEW AND OWNER RUNTIME INSPECTION — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
