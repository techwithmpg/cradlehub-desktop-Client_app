# CradleHub Desktop

Greenfield Windows client, effective 2026-09-05. Stage 00 is active and unaccepted.

Desktop repository: https://github.com/techwithmpg/cradlehub-desktop-Client_app
Hosted reference: https://github.com/techwithmpg/Cradlehub (read-only source audit).

The single Tauri 2 / React / TypeScript / Vite application displays initialization, not-authenticated and connection-not-established states. No product module or backend connection is implemented.

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

The three renderer/boundary tests protect unavailable operational actions, an empty native capability set and the absence of renderer persistence/network calls. Rust has no domain logic or authored unit tests yet; cargo test checks compilation/test targets, not CRM behavior.

## Boundaries

See [hosted contracts](docs/10-architecture/WEB_CONTRACT_INVENTORY.md), [desktop ownership](docs/10-architecture/DESKTOP_BOUNDARY.md), and [one UI direction](docs/10-architecture/UI_SYSTEM_DIRECTION.md).

No Stage 01, product modules, authentication, persistence, offline sync, production/database changes, or merge is authorized. Work remains on `stage/00-initialization` for independent review and explicit owner acceptance. Completion never authorizes the next stage.
