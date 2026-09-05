# Handoff

Stage 01 on `stage/01-auth-branch-shell` (BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`).
Status: **ACTIVE / UNACCEPTED — READY FOR OWNER VISUAL RE-TEST**.

Consult `docs/50-state/evidence/stage-01-auth-branch-shell.md` for full implementation, checks, and boundary scan evidence.

Summary of Stage 01 deliverable after visual hierarchy correction:

- Single canonical desktop client application with Supabase email/password authentication.
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

Stage status MUST remain ACTIVE / UNACCEPTED until independent review and owner runtime confirmation.
Do not merge into main. Do not start module implementations. Stage 02 is not authorized.
