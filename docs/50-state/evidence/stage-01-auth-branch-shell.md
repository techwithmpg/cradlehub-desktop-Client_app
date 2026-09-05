# Stage 01 — Authentication, Authorized Branch Context, and Canonical Shell Evidence

Status: **ACTIVE / UNACCEPTED — READY FOR INDEPENDENT REVIEW**.

## Target and References

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`
- Local Root: `E:\Cradle-Destop-Client`
- Branch: `stage/01-auth-branch-shell`
- BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`
- Hosted Reference: `https://github.com/techwithmpg/Cradlehub.git` at `E:\CradleHub-References\Cradlehub-Web`
- Hosted SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43` (clean origin/main)
- Authority: Owner's Stage 01 explicit authorization.

## Authentication Architecture

- **Client Library**: `@supabase/supabase-js` pinned at `2.115.0`.
- **Environment Configuration**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` loaded via Vite `import.meta.env`. `.env.example` provides names only; real `.env.local` is ignored and untracked.
- **Session Persistence**: Strict in-memory session (`persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`). No `localStorage`, `sessionStorage`, `indexedDB`, SQLite, custom token files, or Windows credential caches are introduced.
- **Authentication Flow**: Real email and password authentication via `supabase.auth.signInWithPassword`. Authenticated identity is verified via `supabase.auth.getUser()`.
- **Error Mapping**:
  - Generic invalid credentials error (`"Invalid login credentials"`) for wrong email/password.
  - Distinct connection/configuration error (`"Unable to connect to authentication service. Please check your network connection."`) for network failures.
  - Form validation for missing fields.
  - Password and token values are never printed, rendered unmasked, or logged to the console.

## Authorization & Authoritative Branch Context

- **Staff Context Query**: Authenticated `auth_user_id` is queried against the `staff` table with `is_active = true`.
- **Role Canonicalization**:
  - Front Desk aliases (`'crm'`, `'csr'`, `'csr_head'`, `'csr_staff'`) canonicalize to `'crm'`.
  - Management roles (`'owner'`, `'manager'`, `'assistant_manager'`, `'store_manager'`) canonicalize directly.
  - CRM workspace eligibility strictly requires one of the above 5 roles.
- **Branch Context**:
  - Requires authoritative `branch_id` from the staff record.
  - Resolves `branch_name` via `branches` relation.
  - Displayed as read-only context in the sidebar and top header.
  - No client-side branch picker or arbitrary cross-branch access. Multi-branch/owner selection is omitted pending future server contract.
- **Fail-Closed Behavior**:
  - Missing staff record -> Denied: `"No staff profile associated with this authenticated account."`
  - Inactive staff profile -> Denied: `"Your staff account is marked inactive. Contact an administrator."`
  - Non-CRM role -> Denied: `"Your account role ({role}) is not authorized for CRM workspace access."`
  - Missing branch assignment -> Denied: `"No branch is assigned to your staff profile."`
  - Context resolution failure -> Denied: `"Failed to verify staff record due to database or permission error."`
  - Denial view provides a real "Sign Out" button to clear in-memory auth state and return to login.

## Canonical Shell Implementation

- **Character**:
  - Dark green navigation sidebar (`#0d2b20`, `#081d15`, `#164332`, `#e2ede8`, `#8ba89c`).
  - Restrained gold accents (`#d4af37`, `#c59b27`) for brand mark, active indicators, and badges.
  - Light operational workspace (`#f4f6f8`, `#ffffff`, `#e2e8f0`, `#0f172a`, `#64748b`).
  - Compact desktop density, clean vertical rhythm, high information hierarchy.
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
- **Real Sign Out**: Top header action calls `supabase.auth.signOut()`, resets context, and immediately restores login view.

## Security & Boundary Scan

- **Tauri Security Capabilities**: `[]` (empty list; no native process/shell/fs capabilities).
- **Tauri CSP**: Relaxed strictly to the exact public Supabase project origin:
  `connect-src 'self' https://<project-subdomain>.supabase.co`
  (No wildcards `*` or broad `https:` allowed).
- **No Durable Auth Persistence**: Boundary scan verifies no `localStorage`, `sessionStorage`, `indexedDB`, or SQLite usage in renderer sources.
- **No Credential Logging**: Automated tests scan for any `console.log` containing passwords or tokens.
- **No Hosted or Backend Modifications**: Hosted reference repository remains read-only at `feda4600f37e93084fdb672bd0c2612e9872bb43`. No schema changes, migrations, RLS mutations, or server secrets introduced.

## Exact Checks and Results

| Check                     | Command                                              | Result                                                                                                                                       |
| ------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Lockfile / Dependencies   | `pnpm install`                                       | Exit 0 — Pinned exact `@supabase/supabase-js@2.115.0`, `@testing-library/react@16.3.3`, `@testing-library/user-event@14.6.7`, `jsdom@30.0.1` |
| Code Formatting           | `pnpm format:check`                                  | Exit 0 — All matched files use Prettier code style                                                                                           |
| ESLint Check              | `pnpm lint`                                          | Exit 0 — 0 warnings, 0 errors                                                                                                                |
| TypeScript Typecheck      | `pnpm typecheck`                                     | Exit 0 — `tsc --noEmit` clean                                                                                                                |
| Automated Tests           | `pnpm test`                                          | Exit 0 — 4 test suites, 30 tests passed                                                                                                      |
| Production Frontend Build | `pnpm build`                                         | Exit 0 — Built clean bundle in `dist/`                                                                                                       |
| Rust Code Formatting      | `cargo fmt --check` (src-tauri)                      | Exit 0 — Clean                                                                                                                               |
| Cargo Compilation Check   | `cargo check --locked` (src-tauri)                   | Exit 0 — Clean                                                                                                                               |
| Cargo Unit Tests          | `cargo test --locked` (src-tauri)                    | Exit 0 — 0 failed                                                                                                                            |
| Cargo Clippy Lints        | `cargo clippy --locked --all-targets -- -D warnings` | Exit 0 — Clean                                                                                                                               |
| Git Whitespace Diff Check | `git diff --check`                                   | Exit 0 — Clean                                                                                                                               |
| Native Windows Runtime    | `pnpm tauri dev`                                     | Exit 0 — Native window compiled and opened `target\debug\cradlehub-desktop.exe` displaying login screen                                      |

## Test Suites Breakdown (30 Tests)

1. `tests/roles.test.ts` (5 tests):
   - Canonicalizes Front Desk aliases (`crm`, `csr`, `csr_head`, `csr_staff`) to `crm`.
   - Canonicalizes management roles (`owner`, `manager`, `assistant_manager`, `store_manager`).
   - Returns `unknown` for unassigned or non-CRM roles (`therapist`, `driver`, etc.).
   - Verifies CRM workspace eligibility strictly.
   - Formats role display labels accurately.

2. `tests/auth-service.test.ts` (10 tests):
   - Valid user authentication and `getUser` identity verification.
   - Input validation (empty email/password handling).
   - Generic error mapping for invalid credentials.
   - Distinct network/connection error handling.
   - Resolves full `AuthContext` for active CRM staff with valid branch.
   - Fails closed on missing staff profile.
   - Fails closed on inactive staff profile.
   - Fails closed on non-CRM role.
   - Fails closed on missing branch assignment.
   - Real sign-out invocation.

3. `tests/boundary.test.ts` (3 tests):
   - Enforces empty Tauri capabilities `[]` and narrow Supabase origin CSP.
   - Scans all renderer source files ensuring no `localStorage`, `sessionStorage`, `indexedDB`, SQLite, or credential logging.
   - Verifies exactly 8 navigation entries and absence of all 7 dormant modules.

4. `tests/components.test.tsx` (12 tests):
   - `LoginView`: accessible labels, password visibility toggle, error banner display, loading state, trimmed submission.
   - `AccessDeniedView`: denial reason, context summary, Sign Out button.
   - `CanonicalShell`: renders 8 nav items, active branch badge, operator badge, module navigation switching, truthful unavailable destination panel, header Sign Out.
   - `App`: end-to-end state transitions (Login -> Shell -> Sign Out -> Login, and Login -> Denied -> Sign Out -> Login).

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
- CSP changed: **YES** (Narrowed strictly to allow only the exact public Supabase project origin: `connect-src 'self' https://<project-subdomain>.supabase.co`)

## Rollback Path

To safely roll back to accepted Stage 00 main:

```bash
git checkout main
git rev-parse HEAD # Expected: 79ef30b9da7267b6f01a6bf9a462712a2b8cfc13
```

No database rollback or hosted changes are necessary.
