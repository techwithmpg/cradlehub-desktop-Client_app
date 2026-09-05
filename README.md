# CradleHub Desktop

Greenfield Windows desktop CRM client for CradleHub, effective 2026-09-05.

- **Desktop Repository**: https://github.com/techwithmpg/cradlehub-desktop-Client_app
- **Hosted Reference**: https://github.com/techwithmpg/Cradlehub (read-only source audit)
- **Base / Stage 00 Baseline**: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13` (Stage 00 accepted and merged)
- **Stage 01 Branch**: `stage/01-auth-branch-shell` (ACCEPTED / MERGED / CLOSED on `main`)

## Stage Status

- **Stage 00**: **ACCEPTED / MERGED — CLOSED** on `main`.
- **Stage 01 (Authentication, Branch Context & Canonical Shell)**: **ACCEPTED / MERGED — CLOSED** on `main`.
- **Stage 02 (Bookings)**: **OWNER AUTHORIZED — NOT STARTED**.

Stage 01 provides:

- Real Supabase email and password authentication with identity verification via `supabase.auth.getUser()`.
- Authoritative `staff.system_role` querying and canonical role resolution matching hosted contracts.
- Authoritative, read-only branch context presentation.
- Single refined canonical shell with corrected visual hierarchy (product-only sidebar, slim ~50px top app bar, exclusive avatar menu Sign Out, module workspace title ownership).
- Exactly eight authorized navigation destinations (`Today`, `Bookings`, `Attendance`, `Customers`, `Schedule`, `Home Service`, `Staff`, `Settings`) with truthful unavailable states.
- Local-scoped desktop Sign Out (`supabase.auth.signOut({ scope: 'local' })`) with retryable error presentation.
- In-memory session management (`persistSession: false`, `autoRefreshToken: true`, `detectSessionInUrl: false`) with no durable token storage in localStorage/sessionStorage/SQLite.

Stage 01 is merged and closed on `main`; Stage 02 is owner authorized but not yet started.

## Configuration

Create ignored `.env.local` from `.env.example`, supplying only public connection keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not include service-role keys, passwords, or privileged secrets. Real environment values remain untracked.

## Development & Build

Requires Node >=24 <26, pnpm 10.33.2, Rust/Cargo (MSVC toolchain on Windows), Windows SDK, and WebView2.

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

For a native debug build with embedded renderer assets:

```powershell
pnpm tauri build --debug --no-bundle
```

The native binary is output to `src-tauri/target/debug/cradlehub-desktop.exe`.

## Verification & Checks

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cd src-tauri
cargo fmt --check
cargo check --locked
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
```

Automated tests provide 45 tests across 4 suites:

- `tests/roles.test.ts`: Role canonicalization and CRM workspace eligibility.
- `tests/auth-service.test.ts`: Real authentication service, context resolution, contract drift (`system_role`), error taxonomy, and local sign-out.
- `tests/boundary.test.ts`: Tauri security capability restrictions (`[]`), narrow Supabase origin CSP, absence of durable persistence / credential logging, and absence of leaked engineering terminology.
- `tests/components.test.tsx`: Login form, Access Denied view, Canonical Shell hierarchy, popovers, and end-to-end authentication/sign-out state transitions.

Renderer network communication is strictly restricted by CSP to the configured public Supabase project origin (`connect-src 'self' https://<project-ref>.supabase.co`).

## Boundaries

- Stage 01 is accepted, merged, and closed on `main`.
- Stage 02 (Bookings) is owner authorized but not yet started (awaiting independent merge review before branch creation).
- Product module implementations (Bookings, Attendance, etc.), speculative offline sync, and database/schema changes remain unavailable until authorized stages are executed.
