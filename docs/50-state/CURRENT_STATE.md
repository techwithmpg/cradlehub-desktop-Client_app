# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is ACCEPTED / MERGED / CLOSED at `c9720805975004dbe11367f1ad9999270ad4ae7c`.

Stage 02 — Bookings: **NOT ACCEPTED / NOT MERGED / HARDENED HOSTED INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW**. Stage 03 is **NOT AUTHORIZED**.

- Existing branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Desktop integration HEAD before correction: `8c972d533e72163884c632171242314a46e090ca`.
- Reviewed hosted booking API boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).
- **Native Tauri HTTP Transport**: Uses `@tauri-apps/plugin-http` / `tauri-plugin-http` v2. Registered in Rust `src-tauri/src/lib.rs`.
- **Least-Privilege HTTP Capability**: Scoped strictly in `src-tauri/capabilities/desktop-api.json` to canonical hosted origins (`https://*.cradlehub.com/api/desktop/v1/*`, `https://*.cradlehub.app/api/desktop/v1/*`, `https://*.cradlehub.ph/api/desktop/v1/*`). No wildcard HTTP/HTTPS origins.
- **Fail-Closed API Configuration**: Requires canonical `VITE_CRADLEHUB_API_URL` with valid HTTPS origin, no embedded credentials, and normalized trailing slash. Fails closed with `API_CONFIG_REQUIRED` without initiating any network call if unset or invalid.
- **Hosted Error Contract**: Authoritatively parses `body.message` (not `body.error`), preserving domain error codes (`CRM_BRANCH_FORBIDDEN`, `SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `BOOKING_INSERT_FAILED`).
- **Malformed Success Fail-Closed**: Verifies `bookingId` is a non-empty string. If `bookingId` is missing/empty, returns `SERVER_ERROR` and keeps form open.
- **Payment Defaults**: Defaults to `paymentReceived = false` and `paymentMethod = ''`. Payment method is only sent after explicit operator confirmation and selection.
- **Home Service Disabled**: Home Service tab is disabled in Desktop Stage 02 UI with accessible tooltip/title explaining precise-location support is required. `createBranchBooking` fails closed with `HOME_SERVICE_LOCATION_REQUIRED` before network call. No fake geocoordinates or place IDs.
- **Success Warning UX**: Server warning survives modal close and is displayed in the parent `BookingsView` status banner upon authoritative list refresh.
- **No Production Booking Created**: Verification conducted via mock/unit/typecheck/build/cargo suites without creating live production data.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for detailed evidence and test results. Stop after the authorized same-branch integration push; do not merge or start Stage 03.
