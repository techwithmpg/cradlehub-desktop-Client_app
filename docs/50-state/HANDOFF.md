# Handoff

Stage 01 on `stage/01-auth-branch-shell` (BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`).
Status: **ACTIVE / UNACCEPTED — READY FOR INDEPENDENT REVIEW**.

Consult `docs/50-state/evidence/stage-01-auth-branch-shell.md` for full implementation, checks, and boundary scan evidence.

Summary of Stage 01 deliverable:

- Single canonical desktop client application with Supabase email/password authentication.
- In-memory auth session only (`persistSession: false`, no browser localStorage/sessionStorage/SQLite token caching).
- Authoritative staff and branch context resolution with fail-closed access denial (no staff profile, inactive account, non-CRM role, missing branch).
- Single canonical shell featuring dark green navigation, gold accents, compact desktop density, and exactly 8 authorized navigation modules.
- Truthful unavailable destination view for each module destination.
- Real Sign Out clearing authenticated context and returning to login.
- 30 automated tests passing across 4 test suites.
- All frontend (`format:check`, `lint`, `typecheck`, `test`, `build`), Rust (`cargo fmt`, `check`, `test`, `clippy`), and git whitespace checks pass.

Stage status MUST remain ACTIVE / UNACCEPTED until independent review and owner runtime confirmation.
Do not merge into main. Do not start module implementations. Stage 02 is not authorized.
