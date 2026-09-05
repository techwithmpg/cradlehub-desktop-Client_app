# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED on main at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell is **ACTIVE / UNACCEPTED** under the owner's explicit Stage 01 authorization.
Branch: `stage/01-auth-branch-shell`. BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Fetched HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`; hosted tracked source remains read-only and clean.

Stage 01 implementation is complete on `stage/01-auth-branch-shell`:

- Real Supabase email/password authentication via `@supabase/supabase-js` (2.115.0).
- In-memory session management (`persistSession: false`, no localStorage/sessionStorage/SQLite).
- RLS-governed staff and branch context resolution with fail-closed authorization.
- Canonical desktop shell with dark green sidebar, restrained gold accents, compact operational workspace.
- Exactly 8 authorized navigation modules (Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings) with truthful unavailable destination states.
- Real Sign Out clearing authenticated state and returning to login.
- Narrowed Tauri CSP allowing only the exact public Supabase project origin.
- 30 automated unit and boundary tests passing with full test coverage of boundaries and auth flows.

Status remains **ACTIVE / UNACCEPTED** pending independent GitHub review and owner runtime verification.
Product modules, hosted changes, schema/RLS changes, merge to main, and Stage 02 remain unauthorized.
