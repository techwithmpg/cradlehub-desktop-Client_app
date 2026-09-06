# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 (Bookings) is **ACCEPTED / MERGED / CLOSED** on `main` at `379d460ebce14f09d90db910f8e321711e5dcea6`.

Stage 03 (Customers) remains **NOT STARTED / NOT AUTHORIZED**. Explicit owner authorization is required before creating `stage/03-customers`.

- **Stage 02 Merged Baseline**: `379d460ebce14f09d90db910f8e321711e5dcea6` on `main`.
- **Previous Base Baseline (BASE_SHA)**: `c9720805975004dbe11367f1ad9999270ad4ae7c` on `main`.
- **Reviewed Implementation HEAD**: `9268a95d1ada8b2d963cceb56f0b0b5a1d69e83f`.
- **Merged Stage 02 Source Branch**: `stage/02-bookings` @ `379d460ebce14f09d90db910f8e321711e5dcea6`.
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Hosted Booking Boundary**: Endpoint `POST /api/desktop/v1/bookings` merged and active on hosted `main`; production Vercel/GitHub deployment check succeeded (`REPOSITORY-RECORDED PRODUCTION EVIDENCE`).
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**:
  - Visual inspection and booking workflow verified by owner in real native Windows Desktop application runtime.
  - Owner confirmation and merge authorization received prior to fast-forward merge into `main`.
- **Native Tauri HTTP Transport**: Uses `@tauri-apps/plugin-http` / `tauri-plugin-http` v2. Registered in Rust `src-tauri/src/lib.rs`.
- **Least-Privilege HTTP Capability**: Scoped strictly in `src-tauri/capabilities/desktop-api.json` to the single exact verified rule: `https://www.cradlewellnessliving.com/api/desktop/v1/*`. Zero host wildcards.
- **Fail-Closed API Configuration**: Requires canonical `VITE_CRADLEHUB_API_URL` matching exact verified origin `https://www.cradlewellnessliving.com`, no embedded credentials, and normalized trailing slash. Fails closed with `API_CONFIG_REQUIRED` without initiating any network call if unset, mismatched origin, or invalid.
- **Hosted Error & Success Contract**: Authoritatively parses `body.message` (not `body.error`), preserving domain error codes (`CRM_BRANCH_FORBIDDEN`, `SLOT_UNAVAILABLE`, `EXACT_TIME_UNAVAILABLE`, `NO_SCHEDULE_AT_START`, `UNAUTHORIZED`, `BOOKING_INSERT_FAILED`). Verifies non-empty string `bookingId`.
- **Payment Defaults**: Defaults to `paymentReceived = false` and `paymentMethod = ''`. Payment method is only sent after explicit operator confirmation and selection.
- **Home Service Disabled**: Home Service tab is disabled in Desktop Stage 02 UI with accessible tooltip/title explaining precise-location support is required. `createBranchBooking` fails closed with `HOME_SERVICE_LOCATION_REQUIRED` before network call.
- **Customer Lookup Disabled**: Customer lookup remains disabled (`CUSTOMER_LOOKUP_UNAVAILABLE`) pending safe branch-scoped hosted read boundary.
- **Quality & Security Integrity**: Full frontend suite (157/157 tests passed, lint clean, typecheck clean, build clean) and Rust backend suite (cargo fmt/check/test/clippy clean) verified on `main`. Zero service-role secrets in Desktop renderer or bundle.

See [Stage 02 evidence](evidence/stage-02-bookings.md) for full implementation details and validation records.
