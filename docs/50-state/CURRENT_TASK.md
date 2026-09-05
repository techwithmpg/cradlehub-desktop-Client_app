# Current Task

Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell (Corrections Pass).
Status: **ACTIVE / UNACCEPTED — READY FOR INDEPENDENT RE-REVIEW**.
Branch: `stage/01-auth-branch-shell`.
BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`.

Completed in this correction pass:

1. Corrected staff query and role canonicalization to use authoritative `staff.system_role` instead of `staff.role`.
2. Added focused contract-drift automated test verifying `system_role` selection and canonicalization.
3. Updated desktop sign-out to `supabase.auth.signOut({ scope: 'local' })` to prevent terminating operator sessions on other devices.
4. Implemented non-swallowed sign-out error handling with retryable error presentation in UI and protected context retention.
5. Enabled in-memory token refresh (`autoRefreshToken: true`, `persistSession: false`, `detectSessionInUrl: false`).
6. Implemented truthful 4-category error taxonomy separating Invalid Credentials, Network/Auth failure, Context Load / Query errors (`ContextLoadError`), and proven Authorization Denial (`AuthDenialError`).
7. Removed unsupported `"RLS Verified"` label from runtime shell and replaced with truthful `"In-memory session"`.
8. Updated all automated unit, component, and boundary tests (43 tests passing).
9. Verified `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and all Cargo / Rust checks pass.

Next:

- Independent GitHub re-review, followed by owner native runtime verification if re-review is acceptable.
- Stop and wait for independent review. Do not merge. Stage 02 is not authorized.
