# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is ACCEPTED / MERGED / CLOSED at `c9720805975004dbe11367f1ad9999270ad4ae7c`.

Stage 02 — Bookings: **NOT ACCEPTED / NOT MERGED / HOSTED API INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW**. Stage 03 is **NOT AUTHORIZED**.

- Existing branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Integration start HEAD: `7afb30ccb0996915544dae4c41c9e653bc9f310e`.
- Reviewed hosted booking API boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).
- **Authoritative Booking Creation Connected**: `createBranchBooking` connects the Desktop New Booking workflow to `POST /api/desktop/v1/bookings` using the authenticated operator's Supabase session access token (`Authorization: Bearer <access_token>`).
- **Session & Network Safety**: Fails closed with `AUTH_SESSION_REQUIRED` if no active session exists. Distinct fail-closed handling for network failure (`NETWORK_ERROR`), auth rejection (`UNAUTHORIZED`), branch/CRM forbidden (`CRM_BRANCH_FORBIDDEN`), scheduling/resource conflicts (`SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`), and server errors (`BOOKING_INSERT_FAILED`, `SERVER_ERROR`).
- **Conflict UX**: Conflict states retain all operator-entered values in the form so date/time/staff/room can be corrected and retried.
- **Customer Lookup Disabled**: Customer search remains disabled (`CUSTOMER_LOOKUP_UNAVAILABLE`) pending an independently reviewed branch-scoped hosted read boundary. Manual customer entry fields remain active for creation.
- **Configuration**: Hosted API base is configurable via `VITE_CRADLEHUB_API_URL` (documented in `.env.example`). No hardcoded localhost or developer URLs in production code. No privileged keys (`service_role`) in Desktop.
- **Live Hosted Integration Status**: Hosted branch `stage/02-desktop-booking-api` is unmerged; live end-to-end integration is blocked until the hosted boundary is merged/deployed. Desktop integration verified against reviewed boundary contract.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for detailed evidence and test results. Stop after the authorized same-branch integration push; do not merge or start Stage 03.
