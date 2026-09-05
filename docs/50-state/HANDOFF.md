# Handoff

Stage 00: **ACCEPTED / MERGED / CLOSED** on `main`.
Stage 01: **ACCEPTED / MERGED / CLOSED** on `main`.
Stage 02 (Bookings): **OWNER AUTHORIZED — NOT STARTED**.

- **Pre-Merge Main Baseline**: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13` (BASE_SHA).
- **Stage 01 Branch**: `stage/01-auth-branch-shell`.
- **Owner-Approved Implementation Snapshot**: `01419e4ff2bc354b734f36b4b78e1240a84b1034`.
- **Merged Stage 01 Branch Snapshot**: `36651ce871c8b5dd278aaf34fbdc19d8b444d5b3`.

Stage 01 was merged into `main` via fast-forward following explicit owner authorization.
Stage 02 — Bookings is owner authorized but has not started. The next controlled action is independent verification of the Stage 01 merge, followed by creation of `stage/02-bookings` from the accepted main baseline.

Consult `docs/50-state/evidence/stage-01-auth-branch-shell.md` for full implementation, checks, boundary scan, owner runtime evidence, and merge closure record.

Summary of Stage 01 deliverable:

- Single canonical desktop client application with real Supabase email/password authentication.
- In-memory auth session only (`persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`, no browser localStorage/sessionStorage/SQLite token caching).
- Authoritative staff and branch context resolution using `staff.system_role` (NOT `role`) matching the hosted authority contract.
- Local-scoped sign-out (`supabase.auth.signOut({ scope: 'local' })`) without unexpected termination of other device sessions.
- Non-swallowed sign-out error handling and retryable error state.
- Truthful error taxonomy: Invalid Credentials, Network/Auth failure, Context Load failure, and proven Authorization Denial.
- Single refined canonical shell with corrected visual hierarchy:
  - Sidebar: Product navigation only (~224px width, 8 destinations, no duplicated branch or operator profile).
  - Top Bar: Slim ~50px header with compact global controls (`[ Branch Context ] [ ● Session Active ] [ Bell ] [ Avatar ]`), no page title or direct sign out.
  - User Menu: Avatar dropdown containing full name, email, canonical role, branch, and exclusive Sign Out action.
  - Workspace Canvas: Owns module page title and clean, quiet empty state without internal engineering terms.
- 45 automated tests passing across 4 test suites.
- All frontend (`pnpm install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `test`, `build`), Rust (`cargo fmt`, `check`, `test`, `clippy`), and git whitespace checks pass.
- Full owner native Windows runtime and visual inspection completed and approved.

Do not start Stage 02 implementation or create `stage/02-bookings` until independent merge review completes.
