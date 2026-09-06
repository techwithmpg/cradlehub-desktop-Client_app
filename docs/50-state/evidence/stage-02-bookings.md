# Stage 02 — Bookings Hosted API Integration Evidence

**NOT ACCEPTED / NOT MERGED / HOSTED API INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW.**
Stage 03 remains **NOT AUTHORIZED**.

## Repository identity and preflight

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`, local `E:\Cradle-Destop-Client`.
- Authorized branch: `stage/02-bookings`.
- Accepted main BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Integration start HEAD: `7afb30ccb0996915544dae4c41c9e653bc9f310e`.
- Hosted reference repository: `https://github.com/techwithmpg/Cradlehub.git` (READ-ONLY in this pass).
- Reviewed hosted boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).
- Endpoint implemented on reviewed hosted branch: `POST /api/desktop/v1/bookings`.

## Auth Integration & Authorization Model

1. **Session & Token Retrieval**:
   - Desktop retrieves the authenticated operator's Supabase session access token at request time via `supabase.auth.getSession()` from `getSupabaseClient()`.
   - Desktop passes `Authorization: Bearer <access_token>` in request headers.
   - Desktop never persists tokens in `localStorage`, `sessionStorage`, `indexedDB`, or `SQLite`.
   - Desktop contains no `service_role` key, admin token, or privileged secret.
   - Desktop sends no `isDevBypass`, `role`, `operatorRole`, or client-side branch authority claims. Authorization is derived and enforced solely by the hosted authoritative server.

2. **Session Failure Handling**:
   - If `!session?.access_token`, `createBranchBooking` fails closed immediately with code `AUTH_SESSION_REQUIRED` and error: `"Your session has expired. Sign in again to create this booking."`. No network call is made.

3. **Network & Offline Behavior**:
   - Bookings are authoritative server-side writes.
   - If connectivity is unavailable, `createBranchBooking` fails closed with code `NETWORK_ERROR` and error: `"Booking creation requires a connection. Please check your network and try again."`.
   - No offline queue, no optimistic booking, no SQLite write.

## Hosted API Client & Request Contract

- Base URL: Configured via `getHostedApiBaseUrl()`, reading `import.meta.env.VITE_CRADLEHUB_API_URL` (or `VITE_CRADLEHUB_URL`). Defaults to relative `/api/desktop/v1/bookings`. Documented names-only in `.env.example`.
- Endpoint: `POST ${baseUrl}/api/desktop/v1/bookings`
- Request payload mapped from `CreateBookingInput` conforming to `createInhouseBookingMultiSchema`:
  - `branchId`: string (uuid)
  - `serviceIds`: string[] (1-5 uuids)
  - `date`: string (YYYY-MM-DD)
  - `startTime`: string (HH:MM)
  - `deliveryType`: `'in_spa' | 'home_service'`
  - `type`: `'walkin' | 'home_service'`
  - `crmBookingMode`: `'walkin' | 'phone' | 'home_service' | 'standard_future'`
  - `fullName`: string (trimmed)
  - `phone`: string (trimmed)
  - `email`?: string (trimmed or undefined)
  - `staffId`?: string (uuid or undefined)
  - `resourceId`?: string (uuid or undefined, omitted in `home_service` mode)
  - `customerId`?: string (uuid or undefined)
  - `notes`?: string (trimmed or undefined)
  - `paymentReceived`: boolean
  - `paymentMethod`?: string
  - Home service fields (only when mode is `home_service`): `homeServiceAddress`, `homeServiceBarangay`, `homeServiceCity`.
- Response mapping:
  - Success (200/201): `{ ok: true, bookingId: string, warning?: string }`
  - Error (400, 401, 403, 409, 500): `{ ok: false, code: string, error: string }`
  - Unparseable response: `{ ok: false, code: 'SERVER_ERROR', error: string }`

## Modal Submission & Conflict UX

- Active submission wired to `createBranchBooking`.
- Submit button states: `Create Booking`, disabled during submission (`Creating Booking...`), disabled on incomplete input (missing name, phone, or services).
- On success: surfaces warning if present, invokes `onBookingCreated()`, closes modal.
- On failure / conflict (`SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`): surfaces error banner, preserves all entered form values so operator can correct time/staff/room and retry.

## Customer Lookup Status

- Customer lookup remains disabled (`CUSTOMER_LOOKUP_UNAVAILABLE`) with truthful message: `"Customer lookup is unavailable until a branch-scoped hosted read boundary is available."`.
- No global customer database reads are executed. Manual customer entry fields remain active for booking creation.

## Preserved Work & Exact Changed Files

- `.env.example`
- `src/components/bookings/NewBookingModal.tsx`
- `src/lib/bookings-service.ts`
- `tests/booking-preview.test.tsx`
- `tests/bookings-components.test.tsx`
- `tests/bookings-service.test.ts`
- `tests/boundary.test.ts`
- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/evidence/stage-02-bookings.md`

## Exact Local Validation Results

- `pnpm format:check`: 0 formatting issues.
- `pnpm lint`: 0 errors, 0 warnings.
- `pnpm typecheck`: 0 errors.
- `pnpm test`: 8 test files passed, 154 tests passed.
- `pnpm build`: Successful production build in 5.81s.
- `cargo fmt --check`: Clean formatting.
- `cargo check --locked`: Clean check.
- `cargo test --locked`: 0 errors.
- `cargo clippy --locked --all-targets -- -D warnings`: 0 warnings/errors.
- `git diff --check`: 0 whitespace errors.

## Limitations & Remaining Gate

- Hosted branch `stage/02-desktop-booking-api` remains unmerged on hosted repository.
- Live hosted integration is blocked until the reviewed hosted boundary is merged and deployed.
- Stage 02 remains unaccepted and unmerged.
- Stage 03 is NOT started.
