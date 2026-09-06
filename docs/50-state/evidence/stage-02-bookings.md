# Stage 02 — Bookings Hosted API Integration Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 02 — Bookings
- **Branch**: `stage/02-bookings`
- **Accepted Main BASE_SHA**: `c9720805975004dbe11367f1ad9999270ad4ae7c`
- **Reviewed Implementation HEAD_SHA**: `9268a95d1ada8b2d963cceb56f0b0b5a1d69e83f`
- **Current Stage HEAD_SHA**: `d3410986533368ba0c15649f66580f128109c2cc`
- **Status**: Implementation complete on `stage/02-bookings`. Owner runtime verification confirmed. Desktop `main` is NOT YET MERGED in this evidence-only pass. Final independent merge review is the immediate gate. Stage 03 remains **NOT AUTHORIZED**.

## Canonical Hosted Repository Truth

- **Hosted Repository**: `https://github.com/techwithmpg/Cradlehub.git`
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585`
- **Hosted Endpoint on Main**: `POST /api/desktop/v1/bookings`
- **Exact Verified Origin**: `https://www.cradlewellnessliving.com`
- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**:
  - The authoritative hosted booking boundary (`stage/02-desktop-booking-api`) has been fast-forward merged into hosted `main` at commit `f8455078d212b55595c277c577a80d89995c7585`.
  - The production Vercel/GitHub deployment check succeeded for this merged hosted main.
  - _Note_: Repository and deployment records document hosted platform availability; they do not replace owner runtime verification.

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

- **Runtime Environment**: Real native Windows Desktop application runtime.
- **Visual Inspection**: Stage 02 Bookings interface, forms, and workflow were visually inspected in the actual native Windows Desktop application.
- **Workflow Verification**: The Stage 02 Bookings runtime and authoritative booking-creation flow were verified by the owner.
- **Owner Evaluation**: The owner reports the authoritative booking workflow was verified and considers Stage 02 acceptable.
- **Merge Authorization**: The owner has explicitly authorized proceeding to the Stage 02 merge step following final independent review.
- **Limitation**: Exact booking ID was not supplied for the evidence record.

## Exact Hosted API Origin & Proof of Authority

- **Exact Verified Origin**: `https://www.cradlewellnessliving.com`
- **Source of Authority**:
  1. Hosted `.env.example`: `APP_URL=https://www.cradlewellnessliving.com` and `NEXT_PUBLIC_APP_URL=https://www.cradlewellnessliving.com`.
  2. Hosted application source: `src/lib/attendance/qr-url.ts`, `tests/lib/attendance/qr-url.test.ts`, `tests/lib/http/request-origin.test.ts`.
  3. Live audit record in `docs/03-CURRENT-SYSTEM-TRUTH.md` (lines 162-165): A read-only production-web `HEAD` request returned HTTP 200 at `https://www.cradlewellnessliving.com/` identifying Vercel and Next.js response headers.
- **Candidate Origins Rejected**:
  - `*.cradlehub.com`, `*.cradlehub.app`, `*.cradlehub.ph`: Rejected as unverified guessed wildcard families not grounded by repository or deployment evidence.
  - `*.vercel.app`: Rejected as non-canonical preview wildcard.

## Native HTTP Transport & Capability Scoping

1. **Official Tauri v2 HTTP Plugin**:
   - JS package: `@tauri-apps/plugin-http` (~2.2.0).
   - Rust crate: `tauri-plugin-http` ("2") in `src-tauri/Cargo.toml`.
   - Plugin registration: `tauri::Builder::default().plugin(tauri_plugin_http::init())` in `src-tauri/src/lib.rs`.
   - Capability: `src-tauri/capabilities/desktop-api.json` references `http:default` with exactly ONE scoped allow rule:
     - `https://www.cradlewellnessliving.com/api/desktop/v1/*`
   - Strict scoping: Zero host wildcards. No wildcard schemes (`https://*`, `http://*`, `*`) and no arbitrary subdomains.
   - Capability registered in `src-tauri/tauri.conf.json` under `"capabilities": ["desktop-api"]`.

2. **HTTP Client Boundary (`src/lib/bookings-service.ts`)**:
   - One unified service abstraction (`createBranchBooking`) executing native HTTP POST.
   - Supports dependency-injected / test-mocked `customFetch` or falls back to native `tauriFetch`.
   - Enforces `EXPECTED_HOSTED_API_ORIGIN = 'https://www.cradlewellnessliving.com'`.
   - Validates configured base URL using `validateHostedApiBaseUrl()`: requires HTTPS, matches exact verified origin, rejects embedded credentials, and normalizes trailing slashes.
   - Fails closed with `API_CONFIG_REQUIRED` without initiating any network call if base URL is missing, non-HTTPS, mismatched origin, or malformed.

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

## Complete Changed Files in Stage 02

The complete Stage 02 delta against accepted `main` (`c9720805975004dbe11367f1ad9999270ad4ae7c`) as returned by `git diff --name-only origin/main...HEAD`:

1. `.env.example`
2. `docs/50-state/CURRENT_STATE.md`
3. `docs/50-state/CURRENT_TASK.md`
4. `docs/50-state/HANDOFF.md`
5. `docs/50-state/LAST_VERIFIED_GATE.md`
6. `docs/50-state/evidence/stage-02-bookings.md`
7. `package.json`
8. `pnpm-lock.yaml`
9. `src-tauri/Cargo.lock`
10. `src-tauri/Cargo.toml`
11. `src-tauri/capabilities/desktop-api.json`
12. `src-tauri/src/lib.rs`
13. `src-tauri/tauri.conf.json`
14. `src/components/CanonicalShell.tsx`
15. `src/components/bookings/BookingInspectorCard.tsx`
16. `src/components/bookings/BookingsHeader.tsx`
17. `src/components/bookings/BookingsKpiSummary.tsx`
18. `src/components/bookings/BookingsListCard.tsx`
19. `src/components/bookings/BookingsView.tsx`
20. `src/components/bookings/NewBookingModal.tsx`
21. `src/lib/bookings-service.ts`
22. `src/styles.css`
23. `src/types/bookings.ts`
24. `tests/booking-options.test.ts`
25. `tests/booking-preview.test.tsx`
26. `tests/bookings-components.test.tsx`
27. `tests/bookings-service.test.ts`
28. `tests/boundary.test.ts`

## Previously Executed Validation Results

- `pnpm format:check`: 0 formatting issues.
- `pnpm lint`: 0 errors, 0 warnings (`--max-warnings 0`).
- `pnpm typecheck`: 0 errors (`tsc --noEmit`).
- `pnpm test`: 8 test files passed, 157 tests passed.
- `pnpm build`: Successful production bundle (Vite).
- `cargo fmt --check`: Clean formatting in `src-tauri`.
- `cargo check --locked`: Clean check in `src-tauri`.
- `cargo test --locked`: 0 errors in `src-tauri`.
- `cargo clippy --locked --all-targets -- -D warnings`: 0 warnings/errors in `src-tauri`.
- `git diff --check`: 0 whitespace errors.

## Security & Data Impact

- Bearer token retrieved at request time from active Supabase session; no token persistence in storage or SQLite.
- Zero service-role keys or privileged credentials in Desktop renderer or bundle.
- Hosted server remains the sole authorization, validation, scheduling, and database authority.
- Native HTTP transport scoped strictly to single verified host origin `https://www.cradlewellnessliving.com`.
- No optimistic or offline booking mutations; network or session errors fail closed.
- Home Service remains disabled until precise-location support is implemented.
- Customer search remains disabled pending safe hosted branch-scoped read boundary.
- Zero database migrations, schema alterations, or RLS changes in Desktop Stage 02.

## Limitations & Remaining Gate

- Exact booking ID was not supplied for the evidence record.
- Repository/deployment records document hosted availability but do not replace owner runtime verification.
- Desktop Stage 02 remains unmerged on Desktop repository pending final independent review.
- Stage 03 is **NOT STARTED / NOT AUTHORIZED**.

## Rollback Plan

If required, Desktop `main` can be restored to the accepted Stage 01 baseline:
`c9720805975004dbe11367f1ad9999270ad4ae7c`.
_(No rollback is requested or performed)._
