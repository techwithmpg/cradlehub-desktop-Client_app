# Last Verified Gate

Stage 00 = **ACCEPTED / MERGED — CLOSED** on `main` at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 = **ACCEPTED / MERGED — CLOSED** on `main` at `c9720805975004dbe11367f1ad9999270ad4ae7c`.
Stage 02 = **ACCEPTED / MERGED — CLOSED** on `main` at `379d460ebce14f09d90db910f8e321711e5dcea6`.

Stage 03 (Customers) = **NOT STARTED / NOT AUTHORIZED**. A separate explicit owner authorization is required before creating `stage/03-customers`.

## Verification Record

- **Stage 02 Merged Baseline**: `379d460ebce14f09d90db910f8e321711e5dcea6` on `main`.
- **Merged Source Branch**: `stage/02-bookings` (fast-forward merged into `main`).
- **Canonical Hosted Main SHA**: `f8455078d212b55595c277c577a80d89995c7585`.
- **Owner Runtime Verification**:
  - Visual inspection in actual native Windows Desktop application runtime.
  - Authoritative booking-creation workflow verified by owner.
  - Owner confirmed workflow acceptable and explicitly authorized merge into `main`.
- **Quality Gate Verification Checks on Main**:
  - `pnpm format:check` — PASSED (Prettier clean).
  - `pnpm lint` — PASSED (`eslint . --max-warnings 0` with 0 warnings/errors).
  - `pnpm typecheck` — PASSED (`tsc --noEmit` with 0 errors).
  - `pnpm test` — PASSED (157/157 tests passing across 8 test suites).
  - `pnpm build` — PASSED (Vite production bundle built cleanly).
  - `cargo fmt --check` — PASSED.
  - `cargo check --locked` — PASSED.
  - `cargo test --locked` — PASSED.
  - `cargo clippy --locked --all-targets -- -D warnings` — PASSED.
  - `git diff --check` — PASSED (0 trailing whitespaces / conflict markers).
- **Scope Integrity**: Canonical shell preserved without alterations. Single exact native HTTP capability rule (`https://www.cradlewellnessliving.com/api/desktop/v1/*`). Dormant module boundaries enforced for Payments, Finance, and Reports. Real branch-scoped Supabase read queries implemented.
- **Stage Status**: Stage 02 is closed on `main`. Stage 03 is **NOT AUTHORIZED** until explicit owner authorization.

Consult `docs/50-state/evidence/stage-02-bookings.md` for full implementation evidence.
