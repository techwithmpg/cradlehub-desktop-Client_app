# Handoff

Stage 01 on `stage/01-auth-branch-shell`.
Accepted Main: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13` (BASE_SHA).
Owner-Approved Implementation HEAD: `01419e4ff2bc354b734f36b4b78e1240a84b1034`.
Current Stage 01 Branch Tip: `f6165ae2493f48d45518c93e589516e508aca849` (includes documentation-only acceptance and reconciliation commits).
Status: **OWNER CONFIRMED / ACCEPTED PENDING MERGE**.

Consult `docs/50-state/evidence/stage-01-auth-branch-shell.md` for full implementation, checks, boundary scan, and owner runtime evidence.

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

Stage status MUST remain **OWNER CONFIRMED / ACCEPTED PENDING MERGE** until owner-authorized merge.
Do not merge into main. Do not start module implementations. Stage 02 is not authorized.
