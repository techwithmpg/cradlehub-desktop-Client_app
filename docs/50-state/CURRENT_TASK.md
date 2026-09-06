# Current Task

Stage 02 — Bookings Hosted API Integration: connect Desktop New Booking workflow to authoritative hosted creation boundary.

**NOT ACCEPTED / NOT MERGED / HOSTED API INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW.** Stage 03 remains **NOT AUTHORIZED**.

- Branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Integration start HEAD: `7afb30ccb0996915544dae4c41c9e653bc9f310e`.
- Reviewed hosted boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).

Integration details:

1. **Auth Integration**: `createBranchBooking` retrieves the operator's current Supabase session access token via `supabase.auth.getSession()` and passes `Authorization: Bearer <access_token>`. If no active session exists, it fails closed with `AUTH_SESSION_REQUIRED` without initiating a network call.
2. **Authoritative Endpoint**: `POST /api/desktop/v1/bookings` with canonical JSON payload derived from `createInhouseBookingMultiSchema`.
3. **Payload Mapping**: Correctly maps `branchId`, `serviceIds`, `date`, `startTime`, `deliveryType`, `type`, `crmBookingMode`, `fullName`, `phone`, `email`, `staffId`, `resourceId`, `customerId`, `notes`, `paymentReceived`, `paymentMethod`, and home-service address fields. Omits UI-only fields (`totalDurationMinutes`, `totalPrice`, `mode`) and sends no privileged flags (`isDevBypass`, `role`).
4. **Error & Conflict UX**: Preserves hosted domain error codes (`SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `CRM_BRANCH_FORBIDDEN`, `BOOKING_INSERT_FAILED`, `NETWORK_ERROR`). Form values are preserved on conflict so operator can adjust time/provider and retry.
5. **Customer Lookup**: Customer search remains disabled (`CUSTOMER_LOOKUP_UNAVAILABLE`) pending a branch-scoped hosted read boundary. Manual customer entry fields remain active for creation.
6. **Delivery**: Local suite verified (154/154 vitest, prettier check, eslint 0 warnings, tsc noEmit, cargo check/test/clippy). Commit and push on `stage/02-bookings`, then stop for independent review.
