# Stage 03 — Customers Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop Customers
- **Stage**: 03 Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`
- **Original Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`
- **Original Evidence HEAD**: `a29bbe1021e369314611195696bdaa1f7d034e36`
- **First Runtime Correction HEAD**: `91697fdf6c533c3c3833e8bf3e271a90079b336f`
- **First Correction Evidence HEAD**: `bf9535961c47ea88e5e66d2f8b6347d00c412c3e`
- **Response Diagnostic HEAD**: `3930100aa0515b2547052cc026dcc27bcd37efa3`
- **Response Diagnostic Evidence HEAD**: `4513d9b1402d7fe66d899e6eab0be290387062e9`
- **HTTP Version Alignment HEAD**: `cbdd51686eeb34ee26f59c27d39e2f1d4e861b7f`
- **Hosted Dependency**: `techwithmpg/Cradlehub` `main` at `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`
- **Current Status**: **STAGE 03 TAURI HTTP VERSION CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER NATIVE RE-TEST — NO MERGE — STAGE 04 NOT STARTED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Owner Runtime Evidence & Root Cause Investigation

### Owner-Provided Manual Runtime Evidence (2026-09-06)

Following the response diagnosis correction, the owner re-tested the real native Windows Desktop Customers module:

- The previous generic `"Unable to parse customer response from server."` error was updated by our diagnostic handling to report the exact native HTTP response state:
  `"Customer service returned an invalid JSON response (HTTP 200)."`
- The native Windows Customers module reached HTTP 200 against the hosted API, but failed while reading/parsing the body through the native Tauri HTTP guest-core bridge.

### Root Condition Finding: Tauri HTTP Version Inconsistency

Inspection of the repository dependencies confirmed a guest/core version mismatch:

- **JavaScript Manifest (`package.json`)**: `"@tauri-apps/plugin-http": "~2.2.0"`
- **JavaScript Lockfile (`pnpm-lock.yaml`)**: `@tauri-apps/plugin-http@2.2.0`
- **Rust Manifest (`src-tauri/Cargo.toml`)**: `tauri-plugin-http = "2"`
- **Rust Lockfile (`src-tauri/Cargo.lock`)**: `tauri-plugin-http v2.6.0`

The guest JS plugin (`2.2.0`) and the native Rust core plugin (`2.6.0`) had a 4-minor-version drift. In Tauri v2 plugins, body streaming, IPC response buffers, and fetch handling can diverge across mismatched guest-core versions.

---

## 2. Applied Corrections

1. **Aligned Tauri HTTP Plugin Dependencies**:
   - **`package.json`**: Set `"@tauri-apps/plugin-http": "2.6.0"`.
   - **`src-tauri/Cargo.toml`**: Set `tauri-plugin-http = "=2.6.0"`.
   - **`pnpm-lock.yaml`**: Regenerated via `pnpm install`, resolving `@tauri-apps/plugin-http@2.6.0`.
   - **`src-tauri/Cargo.lock`**: Verified resolved `tauri-plugin-http v2.6.0`.

2. **Transport & UI Invariants Preserved**:
   - Zero changes to customer transport logic (`fetchBranchCustomers`, `fetchCustomerDetail`, `searchBranchCustomers`).
   - Zero changes to native Tauri initialization (`tauri_plugin_http::init()` in `src-tauri/src/lib.rs`).
   - Capability remains strictly restricted to `https://www.cradlewellnessliving.com/api/desktop/v1/*` in `src-tauri/capabilities/desktop-api.json`.
   - Hosted repository (`techwithmpg/Cradlehub` at `aac89fb49d5c5fe87fc6ee4c072dbcb425237f1e`) modified files: **NONE**.

---

## 3. Verification & Test Results

All verification suites executed and verified green:

### JavaScript Verification

| Check                     | Command                          | Result                                            |
| ------------------------- | -------------------------------- | ------------------------------------------------- |
| Lockfile Integrity        | `pnpm install --frozen-lockfile` | PASSED (Lockfile up to date)                      |
| Prettier Formatter        | `pnpm format:check`              | PASSED (All matched files match style)            |
| ESLint Linter             | `pnpm lint`                      | PASSED (0 errors, 0 warnings)                     |
| TypeScript Compiler       | `pnpm typecheck`                 | PASSED (`tsc --noEmit` clean)                     |
| Vitest Unit & Integration | `pnpm test`                      | PASSED (10 test files, 171 tests passed)          |
| Production Build          | `pnpm build`                     | PASSED (Vite production bundle generated cleanly) |
| Git Whitespace Check      | `git diff --check`               | PASSED (0 whitespace/conflict errors)             |

### Rust Verification (from `src-tauri`)

| Check        | Command                                                    | Result               |
| ------------ | ---------------------------------------------------------- | -------------------- |
| Cargo Format | `cargo fmt --check`                                        | PASSED               |
| Cargo Check  | `cargo check`                                              | PASSED (Clean build) |
| Cargo Test   | `cargo test`                                               | PASSED (0 failures)  |
| Cargo Clippy | `cargo clippy --all-targets --all-features -- -D warnings` | PASSED (0 warnings)  |

---

## 4. Security & Privacy Invariants

- **Zero Token/Header Logging**: No Bearer tokens, access tokens, or Authorization headers logged.
- **Zero Payload/PII Logging**: Customer names, phones, emails, notes, and health information are never logged.
- **Zero Raw HTML Leakage**: Raw HTML bodies are never rendered or leaked.
- **Zero Direct Renderer DB Reads**: Renderer never executes direct queries to `customers` or `waitlist_requests`.
- **Zero Customer Writes**: Customer creation, editing, and deletion remain strictly excluded.
- **No Capabilities Broadened**: Scoped strictly to `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

---

## 5. Limitations & Owner Action

- **Limitation**:
  `THIS CORRECTION DOES NOT PROVE THE NATIVE CUSTOMER RESPONSE ISSUE IS FIXED.`
  Automated unit/integration tests mock the JS response layer and cannot verify the native Windows Tauri HTTP binary bridge.
- **Required Owner Re-Test**:
  1. Rebuild and launch the real native Windows Desktop application.
  2. Authenticate with an authorized branch account.
  3. Open the Customers workspace.
  4. Confirm whether live branch customer data renders or report the exact error.
- **Rollback**:
  - Revert branch to accepted main: `git reset --hard 59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Stage 04 Status**: Stage 04 (Staff) is **NOT STARTED / NOT AUTHORIZED**.
