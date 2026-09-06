# Current Task

Stage 02 — Bookings Hosted API Integration Correction: native Tauri HTTP transport, strict contract mapping, fail-closed configuration, payment default changes, home service disabling, and persistent success warning UX.

**NOT ACCEPTED / NOT MERGED / HARDENED HOSTED INTEGRATION IMPLEMENTED — AWAITING INDEPENDENT REVIEW.** Stage 03 remains **NOT AUTHORIZED**.

- Branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Desktop integration HEAD before correction: `8c972d533e72163884c632171242314a46e090ca`.
- Reviewed hosted boundary HEAD: `f37f84feeb5a33d132c500a3369beab5904c695a` (`stage/02-desktop-booking-api`).

Correction details:

1. **Native HTTP Transport**: Installed `@tauri-apps/plugin-http` and `tauri-plugin-http` (Tauri v2). Registered plugin in `src-tauri/src/lib.rs`.
2. **Strict Capability Scope**: `src-tauri/capabilities/desktop-api.json` permits only `https://*.cradlehub.(com|app|ph)/api/desktop/v1/*`. No wildcards.
3. **Fail-Closed Base URL**: Validates HTTPS, rejects embedded credentials, trims trailing slash. Returns `API_CONFIG_REQUIRED` when unset or invalid without network requests.
4. **Hosted Error Contract**: Parses `body.message` (not `body.error`). Preserves domain error codes (`CRM_BRANCH_FORBIDDEN`, `SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `BOOKING_INSERT_FAILED`).
5. **Success Contract**: Requires non-empty string `bookingId`. Missing/blank `bookingId` fails closed with `SERVER_ERROR`.
6. **Payment Default**: Defaults `paymentReceived: false` and `paymentMethod: ''`. `paymentMethod` is omitted when paymentReceived is false. Selecting payment requires explicit method choice.
7. **Home Service Disabled**: Tab disabled in Desktop Stage 02 UI with accessible explanation. `createBranchBooking` fails closed before network with `HOME_SERVICE_LOCATION_REQUIRED`. No fake coordinates or place IDs.
8. **Success Warning UX**: Server warning survives modal unmount and displays in the parent workspace banner upon authoritative refresh.
9. **Delivery**: Local suite verified (152/152 vitest, prettier check, eslint 0 warnings, tsc noEmit, cargo check/test/clippy). Commit and push on `stage/02-bookings`, then stop for independent review.
