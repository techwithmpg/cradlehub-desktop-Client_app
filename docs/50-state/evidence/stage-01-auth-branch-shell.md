# Stage 01 — Authentication, Authorized Branch Context, and Canonical Shell Evidence

Status: **OWNER CONFIRMED / ACCEPTED PENDING MERGE**.

## Target and References

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`
- Local Root: `E:\Cradle-Destop-Client`
- Branch: `stage/01-auth-branch-shell`
- BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`
- Accepted Stage 01 HEAD: `01419e4ff2bc354b734f36b4b78e1240a84b1034`
- Hosted Reference: `https://github.com/techwithmpg/Cradlehub.git` at `E:\CradleHub-References\Cradlehub-Web`
- Hosted SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43` (clean origin/main)
- Authority: Owner's Stage 01 explicit authorization, review corrections, visual hierarchy correction, and final owner runtime confirmation.

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

Date:
2026-09-05

The owner previously confirmed:

- Native CradleHub Desktop launched successfully.
- Real Supabase authentication succeeded.
- Authenticated operator context resolved.
- Real branch context resolved.
- Exactly eight authorized navigation destinations were present.
- Navigation between module placeholders worked.
- Real Sign Out returned to the login screen.

After the latest canonical-shell visual correction at:

`01419e4ff2bc354b734f36b4b78e1240a84b1034`

the owner also visually inspected the real native desktop runtime and explicitly APPROVED:

- simplified canonical sidebar;
- removal of duplicate branch information;
- removal of duplicate user identity;
- Sign Out ownership inside avatar menu;
- module title ownership inside the module workspace;
- compact global top app bar;
- branch context placement;
- truthful Session Active indicator;
- notification trigger and truthful empty notification state;
- avatar/user menu;
- overall canonical shell visual hierarchy and presentation.

This constitutes final OWNER visual confirmation for Stage 01.

## Authentication Architecture

- **Client Library**: `@supabase/supabase-js` pinned at `2.115.0`.
- **Environment Configuration**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` loaded via Vite `import.meta.env`. `.env.example` provides names only; real `.env.local` is ignored and untracked.
- **Session Persistence & In-Memory Auto-Refresh**: Strict in-memory session (`persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`). No `localStorage`, `sessionStorage`, `indexedDB`, SQLite, custom token files, or Windows credential caches are introduced.
- **Authentication Flow**: Real email and password authentication via `supabase.auth.signInWithPassword`. Authenticated identity is verified via `supabase.auth.getUser()`.
- **Error Mapping Taxonomy**:
  - `InvalidCredentialsError` (`"Invalid email or password."`) for wrong email/password or 400 invalid credentials response.
  - `NetworkOrConfigError` (`"Unable to connect to authentication service. Please check your network connection."`) for transport/connection errors or `getUser()` failures.
  - `ContextLoadError` (`"We could not load your authorized workspace context. Please check your connection and try again."`) for database, permission, or PostgREST query failures when loading staff or branch context.
  - `AuthDenialError` for confirmed non-eligibility (no staff profile, inactive account, non-CRM system_role, missing branch assignment).
  - Passwords and token values are never printed, rendered unmasked, or logged to the console.
- **Local-Scoped Sign Out**: Desktop sign-out explicitly calls `supabase.auth.signOut({ scope: 'local' })`, ensuring it does not terminate active browser/device sessions elsewhere. Sign-out errors are caught, presented truthfully in a retryable UI banner, and context is preserved until sign-out succeeds.

## Authorization & Authoritative Branch Context

- **Authoritative Field**: Authoritative `system_role` queried from `staff` table:
  ```ts
  .select('id, auth_user_id, full_name, system_role, branch_id, is_active, branches(name)')
  ```
- **Role Canonicalization**:
  - Front Desk aliases (`'crm'`, `'csr'`, `'csr_head'`, `'csr_staff'`) canonicalize to `'crm'`.
  - Management roles (`'owner'`, `'manager'`, `'assistant_manager'`, `'store_manager'`) canonicalize directly.
  - CRM workspace eligibility strictly requires one of the above 5 roles.
- **Branch Context**:
  - Requires authoritative `branch_id` from the staff record.
  - Resolves `branch_name` via `branches` relation or fallback query.
  - Displayed as read-only context in the global top app bar.
  - No client-side branch picker or arbitrary cross-branch access.
- **Fail-Closed Behavior**:
  - Missing staff record -> Denied: `"No staff profile associated with this authenticated account."`
  - Inactive staff profile -> Denied: `"Your staff account is marked inactive. Contact an administrator."`
  - Non-CRM system_role -> Denied: `"Your account role ({role}) is not authorized for CRM workspace access."`
  - Missing branch assignment -> Denied: `"No branch is assigned to your staff profile."`
  - Query/network failure during staff or branch resolution -> Context Load Error (NOT denial).
  - Denial view provides a local "Sign Out" button to clear in-memory auth state and return to login.

## Canonical Shell Implementation & Visual Hierarchy Correction

- **Core Hierarchy Principles**:
  - **Sidebar = Product Navigation Only**:
    - Compact 224px width in refined dark green (`#0d2b20`, `#081d15`, `#164332`).
    - Restrained gold accents (`#d4af37`) for brand mark and active indicator pills.
    - Exactly 8 authorized navigation destinations (`Today`, `Bookings`, `Attendance`, `Customers`, `Schedule`, `Home Service`, `Staff`, `Settings`).
    - Removed redundant Active Branch card, Read-only Scope tag, and bottom operator profile.
  - **Global Top App Bar = Global Context Only**:
    - Slim 50px horizontal bar.
    - Right-aligned compact global control cluster: `[ Branch Context ] [ ● Session Active ] [ Bell ] [ Avatar ]`.
    - Compact ghost/text styling with subtle vertical dividers instead of individual large boxed cards.
    - Removed module title & subtitle, direct Sign Out button, and user name/role text.
  - **User Menu = Account Context & Sign Out**:
    - Circular avatar trigger (user initials + chevron) opening a clean 260px account popover.
    - Contains: full name, email, canonical role label, assigned branch, and exclusive Sign Out button.
  - **Module Workspace = Page Context & Actions**:
    - Owns module page title (`Today`, `Bookings`, etc.).
    - Elegant, quiet empty-state placeholder (`This module is not yet available in the desktop client.`) replacing bulky engineering cards.
    - Eliminates internal developer terminology (`Stage 01 Scope`, `Canonical Shell`, `Session Authority`, `Active Operator`, `In-Memory Active summary cards`) from normal user runtime.
- **Truthful Runtime Claims**:
  - Contains no unsupported `"RLS Verified"`, `"Production Verified"`, `"Live Verified"`, or `"Sync Verified"` claims.
- **Dormant Modules Absent**: Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing are strictly excluded.
- **Single Shell Rule**: Exactly one canonical shell (`CanonicalShell.tsx`). No duplicate shells, V2s, or showcase variants.

## Security & Boundary Scan

- **Tauri Security Capabilities**: `[]` (empty list; no native process/shell/fs capabilities).
- **Tauri CSP**: Relaxed strictly to the exact public Supabase project origin:
  `connect-src 'self' https://<project-subdomain>.supabase.co`
  (No wildcards `*` or broad `https:` allowed).
- **No Durable Auth Persistence**: Boundary scan verifies no `localStorage`, `sessionStorage`, `indexedDB`, or SQLite usage in renderer sources.
- **No Credential Logging**: Automated tests scan for any `console.log` containing passwords or tokens.
- **No Hosted or Backend Modifications**: Hosted reference repository remains read-only at `feda4600f37e93084fdb672bd0c2612e9872bb43`. No schema changes, migrations, RLS mutations, or server secrets introduced.

## Exact Checks and Results

| Check                     | Command                                              | Result                                                          |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Lockfile / Dependencies   | `pnpm install --frozen-lockfile`                     | Exit 0 — Dependencies verified strictly against frozen lockfile |
| Code Formatting           | `pnpm format:check`                                  | Exit 0 — All matched files use Prettier code style              |
| ESLint Check              | `pnpm lint`                                          | Exit 0 — 0 warnings, 0 errors                                   |
| TypeScript Typecheck      | `pnpm typecheck`                                     | Exit 0 — `tsc --noEmit` clean                                   |
| Automated Tests           | `pnpm test`                                          | Exit 0 — 4 test suites, 45 tests passed                         |
| Production Frontend Build | `pnpm build`                                         | Exit 0 — Built clean bundle in `dist/`                          |
| Rust Code Formatting      | `cargo fmt --check` (src-tauri)                      | Exit 0 — Clean                                                  |
| Cargo Compilation Check   | `cargo check --locked` (src-tauri)                   | Exit 0 — Clean                                                  |
| Cargo Unit Tests          | `cargo test --locked` (src-tauri)                    | Exit 0 — 0 failed                                               |
| Cargo Clippy Lints        | `cargo clippy --locked --all-targets -- -D warnings` | Exit 0 — Clean                                                  |
| Git Whitespace Diff Check | `git diff --check`                                   | Exit 0 — Clean                                                  |

## Test Suites Breakdown (45 Tests)

1. `tests/roles.test.ts` (5 tests):
   - Canonicalizes Front Desk aliases (`crm`, `csr`, `csr_head`, `csr_staff`) to `crm`.
   - Canonicalizes management roles (`owner`, `manager`, `assistant_manager`, `store_manager`).
   - Returns `unknown` for unassigned or non-CRM roles (`therapist`, `driver`, etc.).
   - Verifies CRM workspace eligibility strictly.
   - Formats role display labels accurately.

2. `tests/auth-service.test.ts` (15 tests):
   - Valid user authentication and `getUser` identity verification.
   - Input validation (empty email/password handling).
   - Generic error mapping for invalid credentials (`InvalidCredentialsError`).
   - Distinct network/connection error handling (`NetworkOrConfigError`).
   - `getUser()` failure mapping to `NetworkOrConfigError`.
   - Resolves full `AuthContext` for active CRM staff with valid branch and authoritative `system_role`.
   - Contract-drift test: verifies `system_role` query selection and canonicalization when `role` is absent.
   - Database/PostgREST query error on staff resolves to `ContextLoadError` (NOT `AuthDenialError`).
   - Database/query error on fallback branch lookup resolves to `ContextLoadError`.
   - Fails closed on missing staff profile (`AuthDenialError`).
   - Fails closed on inactive staff profile (`AuthDenialError`).
   - Fails closed on non-CRM `system_role` (`AuthDenialError`).
   - Fails closed on missing branch assignment (`AuthDenialError`).
   - Real sign-out invocation calls `supabase.auth.signOut({ scope: 'local' })`.
   - Sign-out failure is rethrown and not swallowed.

3. `tests/boundary.test.ts` (6 tests):
   - Enforces empty Tauri capabilities `[]` and narrow Supabase origin CSP.
   - Scans all renderer source files ensuring no `localStorage`, `sessionStorage`, `indexedDB`, SQLite, or credential logging.
   - Scans renderer source ensuring absence of unsupported claims (`RLS Verified`, `Production Verified`, `Live Verified`, `Sync Verified`) and developer jargon (`Stage 01 Scope`, `Canonical Shell`, `Session Authority`, `Active Operator`).
   - Verifies Supabase client configuration (`persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`).
   - Preserves names-only `.env.example` without values.
   - Verifies exactly 8 navigation entries and absence of all 7 dormant modules.

4. `tests/components.test.tsx` (19 tests):
   - `LoginView` (5 tests): accessible labels, password visibility toggle, error banner display, loading state, trimmed submission.
   - `AccessDeniedView` (3 tests): denial reason, context summary, Sign Out button, sign-out error presentation.
   - `CanonicalShell` (7 tests): renders 8 nav items without branch/operator duplication in sidebar; branch and session active in top bar; absence of developer terminology; sign-out error notification; module navigation switching in workspace canvas; notification trigger with truthful popover; user avatar dropdown menu with exclusive Sign Out action.
   - `App` integration flows (4 tests): Login -> Shell -> Avatar Sign Out -> Login; Login -> Shell -> Failed Sign Out retains Shell with banner error; Login -> Denied -> Sign Out -> Login; Login -> ContextLoadError displays alert on LoginView.

## Security / Data Impact Statement

- Production data changed: **NO**
- Schema changed: **NO**
- Migrations applied/pushed: **NO**
- Server Auth configuration changed: **NO**
- RLS changed: **NO**
- Storage changed: **NO**
- Hosted repo modified: **NO**
- Service-role / privileged secret introduced: **NO**
- Auth token persisted: **NO** (In-memory session only via `persistSession: false`)
- Tauri capabilities changed: **NO** (`capabilities: []`)
- CSP changed: **NO** (Retains narrow CSP: `connect-src 'self' https://<project-subdomain>.supabase.co`)

## Rollback Path

To safely roll back to accepted Stage 00 main:

```bash
git checkout main
git rev-parse HEAD # Expected: 79ef30b9da7267b6f01a6bf9a462712a2b8cfc13
```

No database rollback or hosted changes are necessary.
