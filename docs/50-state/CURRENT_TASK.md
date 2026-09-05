# Current Task

Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell.
Status: **ACTIVE / UNACCEPTED — READY FOR INDEPENDENT REVIEW**.
Branch: `stage/01-auth-branch-shell`.
BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`.

Completed:

1. Forensic local state inspection and preservation of interrupted Codex session work.
2. Verified hosted reference repository remains clean on main at `feda4600f37e93084fdb672bd0c2612e9872bb43`.
3. Created names-only `.env.example` template with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`. Verified `.env.local` is ignored and contains valid public configuration without exposing values.
4. Installed exact pinned dependencies: `@supabase/supabase-js@2.115.0`, `@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.7`, `jsdom@30.0.1`.
5. Implemented Supabase in-memory client module (`src/lib/supabase.ts`) with `persistSession: false`.
6. Implemented role canonicalization and CRM eligibility checks (`src/lib/roles.ts`).
7. Implemented authentication and staff/branch context resolution service (`src/lib/auth-service.ts`) with fail-closed denial.
8. Implemented accessible production Login view (`src/components/LoginView.tsx`).
9. Implemented Access Denied view (`src/components/AccessDeniedView.tsx`) with real Sign Out.
10. Implemented Canonical Shell (`src/components/CanonicalShell.tsx`) with dark green navigation, gold accents, compact density, exactly 8 authorized modules, and truthful unavailable destination states.
11. Implemented App coordinator (`src/App.tsx`).
12. Updated styling tokens and responsive layout (`src/styles.css`).
13. Narrowed Tauri CSP in `src-tauri/tauri.conf.json` strictly to the exact public Supabase project origin.
14. Added comprehensive automated tests across 4 test suites (30 tests passing).
15. Passed all quality checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `cargo fmt --check`, `cargo check --locked`, `cargo test --locked`, `cargo clippy --locked --all-targets -- -D warnings`, `git diff --check`.
16. Native Tauri dev run verified locally.

Next:

- Push `stage/01-auth-branch-shell` to GitHub for independent review.
- Owner manual credential entry directly into the native application.
- Stop and wait for independent review. Do not merge. Stage 02 is not authorized.
