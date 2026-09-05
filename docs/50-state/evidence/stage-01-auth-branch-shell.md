# Stage 01 — Authentication, Authorized Branch Context, and Canonical Shell Evidence

Status: **ACTIVE / UNACCEPTED — READY FOR INDEPENDENT RE-REVIEW**.

## Target and References

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`
- Local Root: `E:\Cradle-Destop-Client`
- Branch: `stage/01-auth-branch-shell`
- BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`
- Reviewed HEAD prior to corrections: `2fb7e50b637d6b3d0c509832242fd7830ac4cef8`
- Hosted Reference: `https://github.com/techwithmpg/Cradlehub.git` at `E:\CradleHub-References\Cradlehub-Web`
- Hosted SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43` (clean origin/main)
- Authority: Owner's Stage 01 explicit authorization and post-review corrections.

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
  - Displayed as read-only context in the sidebar and top header.
  - No client-side branch picker or arbitrary cross-branch access.
- **Fail-Closed Behavior**:
  - Missing staff record -> Denied: `"No staff profile associated with this authenticated account."`
  - Inactive staff profile -> Denied: `"Your staff account is marked inactive. Contact an administrator."`
  - Non-CRM system_role -> Denied: `"Your account role ({role}) is not authorized for CRM workspace access."`
  - Missing branch assignment -> Denied: `"No branch is assigned to your staff profile."`
  - Query/network failure during staff or branch resolution -> Context Load Error (NOT denial).
  - Denial view provides a local "Sign Out" button to clear in-memory auth state and return to login.

## Canonical Shell Implementation

- **Character**:
  - Dark green navigation sidebar (`#0d2b20`, `#081d15`, `#164332`, `#e2ede8`, `#8ba89c`).
  - Restrained gold accents (`#d4af37`, `#c59b27`) for brand mark, active indicators, and badges.
  - Light operational workspace (`#f4f6f8`, `#ffffff`, `#e2e8f0`, `#0f172a`, `#64748b`).
  - Compact desktop density, clean vertical rhythm, high information hierarchy.
- **Truthful Runtime Claims**:
  - Uses neutral `"In-memory session"` badge.
  - Contains no unsupported `"RLS Verified"`, `"Production Verified"`, `"Live Verified"`, or `"Sync Verified"` claims.
- **Exactly 8 Authorized Navigation Modules**:
  1. Today (`CalendarDays`)
  2. Bookings (`BookmarkCheck`)
  3. Attendance (`UserCheck`)
  4. Customers (`Users`)
  5. Schedule (`CalendarRange`)
  6. Home Service (`Truck`)
  7. Staff (`UserCog`)
  8. Settings (`Settings`)
- **Dormant Modules Absent**: Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing are strictly excluded.
- **Module Destinations**: Shared truthful unavailable destination pattern (`"{Module} is not yet available in the desktop client."`) with summary of active branch and operator context. No fake dashboards, counts, or mock records.
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

| Check                     | Command                                              | Result                                                                                                  |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Lockfile / Dependencies   | `pnpm install --frozen-lockfile`                     | Exit 0 — Dependencies verified strictly against frozen lockfile                                         |
| Code Formatting           | `pnpm format:check`                                  | Exit 0 — All matched files use Prettier code style                                                      |
| ESLint Check              | `pnpm lint`                                          | Exit 0 — 0 warnings, 0 errors                                                                           |
| TypeScript Typecheck      | `pnpm typecheck`                                     | Exit 0 — `tsc --noEmit` clean                                                                           |
| Automated Tests           | `pnpm test`                                          | Exit 0 — 4 test suites, 43 tests passed                                                                 |
| Production Frontend Build | `pnpm build`                                         | Exit 0 — Built clean bundle in `dist/`                                                                  |
| Rust Code Formatting      | `cargo fmt --check` (src-tauri)                      | Exit 0 — Clean                                                                                          |
| Cargo Compilation Check   | `cargo check --locked` (src-tauri)                   | Exit 0 — Clean                                                                                          |
| Cargo Unit Tests          | `cargo test --locked` (src-tauri)                    | Exit 0 — 0 failed                                                                                       |
| Cargo Clippy Lints        | `cargo clippy --locked --all-targets -- -D warnings` | Exit 0 — Clean                                                                                          |
| Git Whitespace Diff Check | `git diff --check`                                   | Exit 0 — Clean                                                                                          |
| Native Windows Runtime    | `pnpm tauri dev`                                     | Exit 0 — Native window compiled and opened `target\debug\cradlehub-desktop.exe` displaying login screen |

## Test Suites Breakdown (43 Tests)

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
   - Scans renderer source ensuring absence of unsupported claims (`RLS Verified`, `Production Verified`, `Live Verified`, `Sync Verified`).
   - Verifies Supabase client configuration (`persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`).
   - Preserves names-only `.env.example` without values.
   - Verifies exactly 8 navigation entries and absence of all 7 dormant modules.

4. `tests/components.test.tsx` (17 tests):
   - `LoginView`: accessible labels, password visibility toggle, error banner display, loading state, trimmed submission.
   - `AccessDeniedView`: denial reason, context summary, Sign Out button, sign-out error presentation.
   - `CanonicalShell`: renders 8 nav items, active branch badge, operator badge, in-memory session badge (absence of `RLS Verified`), sign-out error notification, module navigation switching, truthful unavailable destination panel, header Sign Out.
   - `App`: end-to-end state transitions (Login -> Shell -> Sign Out -> Login; Login -> Shell -> Failed Sign Out retains Shell with error; Login -> Denied -> Sign Out -> Login; Login -> ContextLoadError displays alert on LoginView).

## Native Runtime Verification Note

Automated checks and Tauri compilation verify that the application launches natively on Windows.
When verifying real Supabase authentication:

- The owner must manually enter credentials directly into the running native application.
- Never paste credentials into chat or CLI commands.
- Never record plaintext passwords or capture unmasked credentials.

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
- CSP changed during correction: **NO** (Retains narrow CSP: `connect-src 'self' https://<project-subdomain>.supabase.co`)

## Rollback Path

To safely roll back to accepted Stage 00 main:

```bash
git checkout main
git rev-parse HEAD # Expected: 79ef30b9da7267b6f01a6bf9a462712a2b8cfc13
```

No database rollback or hosted changes are necessary.
