# CradleHub Desktop

Greenfield Windows client, effective 2026-09-05. Stage 00 is ACCEPTED / MERGED and closed on main. Merge commit: `b16593d6d1ea873b5d4d10eac99d21cbb400e9a6`.

Desktop repository: https://github.com/techwithmpg/cradlehub-desktop-Client_app
Hosted reference: https://github.com/techwithmpg/Cradlehub (read-only source audit).

The single Tauri 2 / React / TypeScript / Vite application displays initialization, not-authenticated and connection-not-established states. No product module or backend connection is implemented.

## Stage 01 work in progress

The owner has separately authorized Stage 01 on `stage/01-auth-branch-shell`. It is ACTIVE / UNACCEPTED and paused for public client configuration; the runtime below is still the accepted Stage 00 implementation.
Create ignored `.env.local` from `.env.example`, supplying only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (anon/publishable key). Do not include passwords or privileged secrets. Real environment values must remain untracked and must not be printed in logs/evidence.

## Start here

Read [agent rules](AGENTS.md), [governance](docs/00-governance/AI_START_HERE.md), [current state](docs/50-state/CURRENT_STATE.md), and [Stage 00 evidence](docs/50-state/evidence/stage-00-initialization.md).

Use pnpm 10.33.2. This host was checked with Node 25.2.0, Rust/Cargo 1.98.0, Windows MSVC Build Tools, Windows SDK and WebView2. Direct JavaScript dependencies and both lockfiles are committed. Do not install hosted web dependencies here or copy environment files.

```powershell
pnpm install --frozen-lockfile
pnpm tauri dev
```

The development command launches the native Windows application and a loopback-only Vite server. For a native executable with embedded production renderer assets:

```powershell
pnpm tauri build --debug --no-bundle
```

The executable is `src-tauri/target/debug/cradlehub-desktop.exe`. Debug packaging is local verification only; signed installers, update distribution and release acceptance remain unverified.

## Checks

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/verify-stage00.mjs
cd src-tauri
cargo fmt --check
cargo check --locked
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
```

The original `scripts/verify-stage00.mjs` includes pre-acceptance state and stage-branch assertions. It is not a post-merge main gate and was not rerun during closure. Its recorded initialization result applies to the reviewed initialization snapshot; the script remains unchanged. The requested post-merge verification is recorded in the Stage 00 evidence.

The three renderer/boundary tests protect unavailable operational actions, an empty native capability set and the absence of renderer persistence/network calls. Rust has no domain logic or authored unit tests yet; cargo test checks compilation/test targets, not CRM behavior.

## Boundaries

See [hosted contracts](docs/10-architecture/WEB_CONTRACT_INVENTORY.md), [desktop ownership](docs/10-architecture/DESKTOP_BOUNDARY.md), and [one UI direction](docs/10-architecture/UI_SYSTEM_DIRECTION.md).

The owner-authorized Stage 00 merge is complete on `main`; `stage/00-initialization` is preserved. Stage 01 authentication, authorized branch context and canonical shell work are now separately authorized on `stage/01-auth-branch-shell`. Product-module implementation, speculative persistence/offline sync, hosted or production/database changes, merge and Stage 02 remain unauthorized.
