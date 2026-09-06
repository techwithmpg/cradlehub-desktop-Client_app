# Stage 02 — Bookings Hosted API Integration Evidence

**NOT ACCEPTED / NOT MERGED / HARDENED HOSTED INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW.**
Stage 03 remains **NOT AUTHORIZED**.

## Repository identity and preflight

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`, local `E:\Cradle-Destop-Client`.
- Authorized branch: `stage/02-bookings`.
- Accepted main BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Desktop integration HEAD before correction: `8c972d533e72163884c632171242314a46e090ca`.
- Hosted reference repository: `https://github.com/techwithmpg/Cradlehub.git` (READ-ONLY in this pass).
- Reviewed hosted boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).
- Endpoint implemented on reviewed hosted branch: `POST /api/desktop/v1/bookings`.

## Native HTTP Transport & Capability Scoping

1. **Official Tauri v2 HTTP Plugin**:
   - JS package: `@tauri-apps/plugin-http` (~2.2.0).
   - Rust crate: `tauri-plugin-http` ("2") in `src-tauri/Cargo.toml`.
   - Plugin registration: `tauri::Builder::default().plugin(tauri_plugin_http::init())` in `src-tauri/src/lib.rs`.
   - Capability: `src-tauri/capabilities/desktop-api.json` references `http:default` with scoped allow list:
     - `https://*.cradlehub.com/api/desktop/v1/*`
     - `https://*.cradlehub.app/api/desktop/v1/*`
     - `https://*.cradlehub.ph/api/desktop/v1/*`
   - Strict scoping: No wildcard schemes (`https://*`, `http://*`, `*`) and no arbitrary hosts.
   - Capability registered in `src-tauri/tauri.conf.json` under `"capabilities": ["desktop-api"]`.

2. **HTTP Client Boundary (`src/lib/bookings-service.ts`)**:
   - One unified service abstraction (`createBranchBooking`) executing native HTTP POST.
   - Supports dependency-injected / test-mocked `customFetch` or falls back to native `tauriFetch`.
   - Validates configured base URL using `validateHostedApiBaseUrl()`: requires HTTPS, rejects embedded credentials, and normalizes trailing slashes.
   - Fails closed with `API_CONFIG_REQUIRED` without initiating any network call if base URL is missing, non-HTTPS, or malformed.

## Auth Integration & Token Security

1. **Session & Token Retrieval**:
   - Desktop retrieves the authenticated operator's Supabase session access token at request time via `supabase.auth.getSession()` from `getSupabaseClient()`.
   - Passes `Authorization: Bearer <access_token>` in request headers.
   - Never persists tokens in `localStorage`, `sessionStorage`, `indexedDB`, or `SQLite`.
   - Contains no `service_role` key, admin token, or privileged secret.
   - Sends no `isDevBypass`, `role`, `operatorRole`, or client-side branch authority claims. Authorization is derived and enforced solely by the hosted authoritative server.

2. **Session Failure Handling**:
   - If `!session?.access_token`, `createBranchBooking` fails closed immediately with code `AUTH_SESSION_REQUIRED`. No network call is made.

3. **Network & Offline Behavior**:
   - If network fetch fails, `createBranchBooking` fails closed with code `NETWORK_ERROR`.
   - No offline queue, no optimistic booking, no SQLite write.

## Hosted Error & Success Contract

1. **Authoritative Error Parsing**:
   - Hosted endpoint returns `{ ok: false, code: string, message: string }`.
   - Desktop reads `body.message` (not `body.error`), mapping it cleanly to `{ ok: false, code, error: body.message }`.
   - Preserves domain error codes (`CRM_BRANCH_FORBIDDEN`, `SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `BOOKING_INSERT_FAILED`).
   - Conflict states retain all operator-entered values in the form.

2. **Malformed Success Fail-Closed**:
   - Success requires `body.ok === true`, `typeof body.bookingId === 'string'`, and `body.bookingId.trim().length > 0`.
   - Missing or empty `bookingId` fails closed with `SERVER_ERROR` and keeps the form open.

3. **Persistent Server Warning UX**:
   - On creation success, `onBookingCreated({ bookingId, warning })` is passed to the parent `BookingsView`.
   - The server warning survives modal close and is displayed in the parent status banner along with an authoritative list refresh.

## Payment & Home Service Constraints

1. **Payment Defaults**:
   - Modal initializes with `paymentReceived: false` and `paymentMethod: ''`.
   - `paymentMethod` is omitted from the submission payload when `paymentReceived === false`.
   - When `paymentReceived === true`, operator must explicitly select a valid payment method (`cash`, `gcash`, `maya`, `card`, `other`).
   - Clean dirty state correctly reflects untouched `paymentReceived: false` and `paymentMethod: ''`.

2. **Home Service Disabled**:
   - Home Service mode tab is disabled in Stage 02 Desktop UI (`aria-disabled="true"`, `disabled`) with tooltip explaining that precise-location support is required.
   - `createBranchBooking` fails closed with `HOME_SERVICE_LOCATION_REQUIRED` before network request.
   - No partial home-service fields (`homeServiceAddress`, `homeServiceBarangay`, `homeServiceCity`) sent as pseudo-satisfaction.
   - No fake geocoordinates (`homeServiceLat`, `homeServiceLng`) or placeholder `homeServicePlaceId`.

## Customer Lookup Status

- Customer lookup remains disabled (`CUSTOMER_LOOKUP_UNAVAILABLE`) with truthful message: `"Customer lookup is unavailable until a branch-scoped hosted read boundary is available."`.
- Manual customer entry fields remain active for booking creation.

## Preserved Work & Exact Changed Files

- `package.json`
- `pnpm-lock.yaml`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/src/lib.rs`
- `src-tauri/tauri.conf.json`
- `src-tauri/capabilities/desktop-api.json`
- `src/lib/bookings-service.ts`
- `src/components/bookings/NewBookingModal.tsx`
- `src/components/bookings/BookingsView.tsx`
- `src/styles.css`
- `tests/bookings-service.test.ts`
- `tests/booking-preview.test.tsx`
- `tests/boundary.test.ts`
- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/evidence/stage-02-bookings.md`

## Exact Local Validation Results

- `pnpm format:check`: 0 formatting issues.
- `pnpm lint`: 0 errors, 0 warnings.
- `pnpm typecheck`: 0 errors.
- `pnpm test`: 8 test files passed, 152 tests passed.
- `pnpm build`: Successful production bundle in 1.52s.
- `cargo fmt --check`: Clean formatting in `src-tauri`.
- `cargo check --locked`: Clean check in `src-tauri`.
- `cargo test --locked`: 0 errors in `src-tauri`.
- `cargo clippy --locked --all-targets -- -D warnings`: 0 warnings/errors in `src-tauri`.
- `git diff --check`: 0 whitespace errors.

## Limitations & Remaining Gate

- Hosted branch `stage/02-desktop-booking-api` remains unmerged on hosted repository.
- Live hosted integration is blocked until the reviewed hosted boundary is merged and deployed.
- Stage 02 remains unaccepted and unmerged.
- Stage 03 is NOT started.
