# Current State

Stage 00 is **ACCEPTED / MERGED / CLOSED** at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 is **ACCEPTED / MERGED / CLOSED** at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 is **ACCEPTED / MERGED / CLOSED** at `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Stage 03 (Customers): **IMPLEMENTED AND PUSHED — AWAITING INDEPENDENT REVIEW AND OWNER VISUAL INSPECTION**. Stage 04 remains **NOT AUTHORIZED**.

- **Active Branch**: `stage/03-customers`.
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`.
- **Canonical Hosted Main SHA**: `653f4d0ba04f1af76a7006209a74e40022d7de84` (`https://github.com/techwithmpg/Cradlehub.git`).
- **Implementation Summary**: Real Customers module implemented with header, 5-metric KPI summary, 4-tab list (All, Repeat, Lapsed, Follow-up), live search with debounce, DataGrid, right-side inspector (Overview + History), and waitlist follow-up inspector.
- **Hosted Integration**: Authoritative HTTP transport in `src/lib/customers-service.ts` targeting `GET /api/desktop/v1/customers` and `GET /api/desktop/v1/customers/[customerId]` with Bearer auth.
- **Booking Customer Lookup**: Re-enabled in `bookings-service.ts` / `NewBookingModal.tsx` querying the hosted customer search API.
- **Security & Privacy**: Zero direct Supabase customer reads from renderer; zero customer writes; zero finance/payment surfaces; zero local storage caching; zero token logging.
- **Verification Results**: 163 tests passed across 10 test files; lint clean (0 warnings); typecheck clean; build clean; prettier clean.

See [Stage 03 evidence](evidence/stage-03-customers.md) for full implementation details and verification records.
