# Current Task

Stage 02 — Bookings: Owner Runtime Verification Evidence and Closeout Preparation.

**OWNER RUNTIME VERIFIED / MERGE AUTHORIZED — AWAITING FINAL INDEPENDENT REVIEW.** Desktop `main` is **NOT YET MERGED** in this evidence pass. Stage 03 remains **NOT AUTHORIZED**.

- Branch: `stage/02-bookings`.
- BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Implementation HEAD: `9268a95d1ada8b2d963cceb56f0b0b5a1d69e83f`.
- Canonical Hosted Main: `f8455078d212b55595c277c577a80d89995c7585`.
- Hosted Endpoint on Main: `POST /api/desktop/v1/bookings` (Vercel/GitHub deployment check succeeded).
- Exact Verified Origin: `https://www.cradlewellnessliving.com`.

Closeout status details:

1. **Owner Runtime Evidence**: Owner verified the Stage 02 Bookings workflow in the actual native Windows Desktop application runtime, visually inspected the interface, confirmed acceptable behavior, and explicitly authorized proceeding to the Desktop merge step.
2. **Hosted Boundary Alignment**: Hosted authoritative booking endpoint is merged to canonical hosted `main` (`f8455078d212b55595c277c577a80d89995c7585`) with successful production deployment.
3. **Desktop Native HTTP & Security Integrity**: Official `@tauri-apps/plugin-http` / `tauri-plugin-http` transport with single exact capability rule `https://www.cradlewellnessliving.com/api/desktop/v1/*` (zero wildcards), fail-closed origin validation, Bearer token passed per-request from Supabase session, zero service-role keys in renderer, and zero offline optimistic writes.
4. **Error & Success Contracts**: Authoritative `body.message` parsing, domain error code preservation, strict `bookingId` validation, modal payment defaults, and disabled Home Service mode.
5. **Quality & Evidence Gates**: Full local suite verified (vitest 157/157 tests, prettier, eslint 0 warnings, tsc noEmit, cargo check/test/clippy/fmt). Evidence recorded in `docs/50-state/evidence/stage-02-bookings.md`.
6. **Next Gate**: Push evidence commit to `stage/02-bookings` and stop for final independent merge review. Do NOT merge Desktop main or start Stage 03 in this step.
