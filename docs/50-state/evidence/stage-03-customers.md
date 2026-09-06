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
- **Hosted Dependency**: `techwithmpg/Cradlehub` `main` at `653f4d0ba04f1af76a7006209a74e40022d7de84`
- **Current Status**: **STAGE 03 NATIVE CUSTOMER RESPONSE CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER NATIVE RE-TEST — NO MERGE — STAGE 04 NOT STARTED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Owner Runtime Evidence & Root Cause

### Owner-Provided Manual Runtime Evidence (2026-09-06)

The owner rebuilt/relaunched the real Windows Tauri application after aligning both Tauri HTTP packages to 2.6.0.
Observed runtime states:

1. "Customer service returned an invalid JSON response (HTTP 200)."
2. On another request: UI rendered `0` for all KPIs and `"No customers in this segment"`.
3. Windows WebView2 DevTools Network showed IPC calls:
   `plugin:http|fetch -> 200`
   `plugin:http|fetch_send -> 200`
   `plugin:http|fetch_read_body -> 200` (~5 KB transferred).

### Root Causes Corrected

1. **Native Body Consumption**: Reliance on `response.json()` over Tauri HTTP IPC response objects was failing or inconsistently buffered on native Windows runtime.
2. **Unsafe Response Casting & False Empty Fallthrough**: Responses were force-cast without runtime schema/envelope validation. If an unexpected JSON payload reached `CustomersView`, missing `ok`/`message` fields could reset state to zeros and display a false `"No customers in this segment"` UI state.

---

## 2. Applied Corrections

1. **Canonical Streaming Native JSON Body Reader (`src/lib/hosted-json-response.ts`)**:
   - `readResponseBodyText`: Reads `response.body` via `getReader()`, looping `reader.read()` until `done === true`, decoding chunks with `TextDecoder('utf-8')` (streaming mode) to safely handle multi-byte characters split across chunks.
   - Enforces a 10 MB maximum body size limit (`HOSTED_RESPONSE_TOO_LARGE`).
   - Handles empty responses (`HOSTED_RESPONSE_EMPTY`).
   - Single-pass `JSON.parse` with parse error handling (`HOSTED_RESPONSE_PARSE_ERROR`).
   - Inspects Content-Type before reading body (`HOSTED_API_NON_JSON_RESPONSE`).
   - Never exposes or logs raw response bodies, bearer tokens, or PII in errors or UI.

2. **Strict Runtime Contract Validation**:
   - `isFetchCustomersSuccess`: Validates `ok: true`, allowed `tab`, `data` array of valid items, `waitlist` array of valid items, valid numeric `pagination` object, and valid numeric `kpis` object.
   - `isFetchCustomerDetailSuccess`: Validates `ok: true`, valid `customer` object, and `bookingHistory` array.
   - `isApiErrorEnvelope`: Validates error responses (`ok: false`, `code`, `message`).
   - If contract fails, returns `HOSTED_RESPONSE_CONTRACT_ERROR` with `"Customer service returned an unexpected response format."`.

3. **Customer Boundary Consumers & Request Headers**:
   - `fetchBranchCustomers` and `fetchCustomerDetail` in `src/lib/customers-service.ts` updated to use `readHostedJsonResponse` with runtime contract validators.
   - `searchBranchCustomers` in `src/lib/bookings-service.ts` updated to reuse the canonical `readHostedJsonResponse` with `isFetchCustomersSuccess`.
   - Explicit `Accept: application/json` header added to all customer GET requests alongside `Authorization: Bearer <token>`.

4. **False-Empty UI Prevention in `CustomersView.tsx`**:
   - Defensive error fallbacks ensure that any non-ok result, malformed response, or missing message sets `listError` and renders the canonical `Customer Service Unavailable` alert card.
   - Suppresses KPI strip and list card when an error occurs, preventing `0` KPIs or "No customers in this segment" from masquerading as authoritative data.

5. **Hosted API Modification**:
   - **NONE**. No changes made to hosted business logic.

---

## 3. Verification & Test Results

| Check                     | Command                                                    | Result                                            |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Lockfile Integrity        | `pnpm install --frozen-lockfile`                           | PASSED (Lockfile up to date)                      |
| Prettier Formatter        | `pnpm format:check`                                        | PASSED (All matched files use Prettier style)     |
| ESLint Linter             | `pnpm lint`                                                | PASSED (0 errors, 0 warnings)                     |
| TypeScript Compiler       | `pnpm typecheck`                                           | PASSED (`tsc --noEmit` clean)                     |
| Vitest Unit & Integration | `pnpm test`                                                | PASSED (11 test files, 192 tests passed)          |
| Production Build          | `pnpm build`                                               | PASSED (Vite production bundle generated cleanly) |
| Git Whitespace Check      | `git diff --check`                                         | PASSED (0 whitespace/conflict errors)             |
| Cargo Format              | `cargo fmt --check`                                        | PASSED                                            |
| Cargo Check               | `cargo check`                                              | PASSED (Clean build)                              |
| Cargo Test                | `cargo test`                                               | PASSED (0 failures)                               |
| Cargo Clippy              | `cargo clippy --all-targets --all-features -- -D warnings` | PASSED (0 warnings)                               |

---

## 4. Security & Privacy Invariants

- **Zero Token/Header Logging**: No Bearer tokens, access tokens, or Authorization headers logged.
- **Zero Payload/PII Logging**: Customer names, phones, emails, notes, and health information are never logged.
- **Zero Raw HTML/Body Leakage**: Raw response bodies are never surfaced in UI or error messages.
- **Zero Direct Renderer DB Reads**: Renderer never executes direct queries to `customers` or `waitlist_requests`.
- **Zero Customer Writes**: Customer creation, editing, and deletion remain strictly excluded.
- **No Capabilities Broadened**: Scoped strictly to `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

---

## 5. Owner Native Windows Re-Test Instructions

1. Rebuild and relaunch the real native Windows Desktop application.
2. Sign in as an authorized operator (`crm`, `assistant_manager`, `store_manager`, or `admin`).
3. Navigate to the **Customers** workspace.
4. Verify that real customer records and non-zero authoritative KPIs load.
5. If an error persists, record the exact visible text displayed in the Customer Service Unavailable alert card.
