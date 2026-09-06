# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is ACCEPTED / MERGED / CLOSED at `c9720805975004dbe11367f1ad9999270ad4ae7c`.

Stage 02 — Bookings: **OWNER RUNTIME VERIFIED / MERGE AUTHORIZED — AWAITING FINAL INDEPENDENT REVIEW**. Desktop `main` is **NOT YET MERGED** in this evidence pass. Stage 03 remains **NOT AUTHORIZED**.

- Existing branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Implementation HEAD: `9268a95d1ada8b2d963cceb56f0b0b5a1d69e83f`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Hosted Booking Boundary Status**: Merged to hosted `main` at `f8455078d212b55595c277c577a80d89995c7585`; production Vercel/GitHub deployment check succeeded.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - Visual inspection completed in real native Windows Desktop application.
  - Stage 02 Bookings runtime and authoritative booking-creation flow verified by owner.
  - Owner confirmed workflow acceptable and explicitly authorized proceeding to Desktop merge step following independent review.
- **Exact Verified Hosted API Origin**: `https://www.cradlewellnessliving.com`.
- **Source of Authority**: Hosted repository `.env.example` (`APP_URL=https://www.cradlewellnessliving.com`, `NEXT_PUBLIC_APP_URL=https://www.cradlewellnessliving.com`), `src/lib/attendance/qr-url.ts`, `tests/lib/attendance/qr-url.test.ts`, `tests/lib/http/request-origin.test.ts`, and `docs/03-CURRENT-SYSTEM-TRUTH.md` live verification record.
- **Native Tauri HTTP Transport**: Uses `@tauri-apps/plugin-http` / `tauri-plugin-http` v2. Registered in Rust `src-tauri/src/lib.rs`.
- **Least-Privilege HTTP Capability**: Scoped strictly in `src-tauri/capabilities/desktop-api.json` to the single exact verified rule: `https://www.cradlewellnessliving.com/api/desktop/v1/*`. Zero host wildcards. No `*.cradlehub.(com|app|ph)` wildcard guesses.
- **Fail-Closed API Configuration**: Requires canonical `VITE_CRADLEHUB_API_URL` with exact origin matching `https://www.cradlewellnessliving.com`, no embedded credentials, and normalized trailing slash. Fails closed with `API_CONFIG_REQUIRED` without initiating any network call if unset, mismatched origin, or invalid.
- **Hosted Error Contract**: Authoritatively parses `body.message` (not `body.error`), preserving domain error codes (`CRM_BRANCH_FORBIDDEN`, `SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `BOOKING_INSERT_FAILED`).
- **Malformed Success Fail-Closed**: Verifies `bookingId` is a non-empty string. If `bookingId` is missing/empty, returns `SERVER_ERROR` and keeps form open.
- **Payment Defaults**: Defaults to `paymentReceived = false` and `paymentMethod = ''`. Payment method is only sent after explicit operator confirmation and selection.
- **Home Service Disabled**: Home Service tab is disabled in Desktop Stage 02 UI with accessible tooltip/title explaining precise-location support is required. `createBranchBooking` fails closed with `HOME_SERVICE_LOCATION_REQUIRED` before network call. No fake geocoordinates or place IDs.
- **Success Warning UX**: Server warning survives modal close and is displayed in the parent `BookingsView` status banner upon authoritative list refresh.
- **No Schema / Migration Changes**: Zero database migrations, schema alterations, or RLS changes in Desktop Stage 02.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for detailed evidence and test results. Stop after this authorized evidence push; Desktop is not merged and Stage 03 is not started.
