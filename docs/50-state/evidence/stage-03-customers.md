# Stage 03 — Customers Implementation Evidence

## Status & Governance

- **Target**: CradleHub Desktop
- **Stage**: Stage 03 Customers
- **Branch**: `stage/03-customers`
- **Accepted Main BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`
- **Original Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`
- **Original Evidence HEAD**: `a29bbe1021e369314611195696bdaa1f7d034e36`
- **First Runtime Correction HEAD**: `91697fdf6c533c3c3833e8bf3e271a90079b336f`
- **First Correction Evidence HEAD**: `bf9535961c47ea88e5e66d2f8b6347d00c412c3e`
- **Diagnostic Implementation HEAD**: `3930100aa0515b2547052cc026dcc27bcd37efa3`
- **Hosted Dependency**: `techwithmpg/Cradlehub` `main` at `653f4d0ba04f1af76a7006209a74e40022d7de84`
- **Current Status**: **STAGE 03 CUSTOMER RESPONSE CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER VISUAL RE-TEST — NO MERGE — STAGE 04 NOT STARTED**.
- **Stage 04**: **NOT STARTED / NOT AUTHORIZED**.

---

## 1. Owner Runtime Evidence & Production Probes

### Owner Visual/Runtime Evidence (2026-09-06)

Following the initial layout and configuration correction, the owner re-tested the live native Windows Desktop Customers module:

1. The previous configuration error (`"Customer service is not configured..."`) is resolved.
2. The runtime reported:
   `Customer Service Error: Unable to parse customer response from server.`
3. The normal Customers result surfaces remained unavailable.
4. The error was rendered twice (top red banner + central unavailable card).

### Production Endpoint Diagnostics (Unauthenticated Probes)

Probes executed directly against production from PowerShell (zero credentials/tokens used):

| URL                                                                                  | Method               | Status | Content-Type       | Location                                                        | Body Prefix                                                                                      |
| ------------------------------------------------------------------------------------ | -------------------- | ------ | ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `https://www.cradlewellnessliving.com/api/desktop/v1/customers`                      | GET                  | 401    | `application/json` | `<none>`                                                        | `{"ok":false,"code":"UNAUTHORIZED","message":"Authorization header is required."}`               |
| `https://cradlewellnessliving.com/api/desktop/v1/customers`                          | GET                  | 307    | `application/json` | `https://www.cradlewellnessliving.com/api/desktop/v1/customers` | `{"redirect": "https://www.cradlewellnessliving.com/api/desktop/v1/customers", "status": "307"}` |
| `https://www.cradlewellnessliving.com/api/desktop/v1/bookings` (Control)             | POST                 | 401    | `application/json` | `<none>`                                                        | `{"ok":false,"code":"UNAUTHORIZED","message":"Authorization header is required."}`               |
| `https://www.cradlewellnessliving.com/api/desktop/v1/customers?tab=all&branchId=...` | GET (invalid Bearer) | 401    | `application/json` | `<none>`                                                        | `{"ok":false,"code":"UNAUTHORIZED","message":"Invalid or expired access token."}`                |

**Diagnostic Finding**:

- The production endpoint `https://www.cradlewellnessliving.com/api/desktop/v1/customers` is active and correctly responds with structured JSON 401 on unauthenticated and invalid token requests.
- When an authenticated request fails with non-JSON or a transport error, the previous Desktop code collapsed all response failures into a vague `"Unable to parse customer response from server."` message.

---

## 2. Applied Desktop Corrections

1. **Safe Status & Content-Type Response Handling (`src/lib/customers-service.ts`, `src/lib/bookings-service.ts`)**:
   - For `fetchBranchCustomers`, `fetchCustomerDetail`, and `searchBranchCustomers`:
     - Inspects `response.status` and `response.headers.get("content-type")` before attempting JSON parsing.
     - If `Content-Type` is not JSON: returns code `HOSTED_API_NON_JSON_RESPONSE` with status-aware truthful messages (404: `"The hosted Customers endpoint is not available on the current deployment."`, 500: `"The hosted Customers service returned an unexpected server response."`, 3xx: `"The hosted Customers endpoint redirected unexpectedly."`, other: `"Customer service returned an unexpected HTTP <status> response instead of JSON."`).
     - If `Content-Type` indicates JSON but parsing fails (e.g. malformed body): returns `RESPONSE_PARSE_ERROR` with message `"Customer service returned an invalid JSON response (HTTP <status>)."`.
     - Zero raw HTML, tokens, cookies, or sensitive PII exposed in error strings.

2. **Single Canonical Unavailable State (`src/components/customers/CustomersView.tsx`, `src/styles.css`)**:
   - Removed duplicate top red banner when authoritative failure occurs.
   - Renders exactly ONE clean, canonical `workspace-placeholder` card (`role="alert"`) with error icon (`placeholder-error-icon`), title (`"Customer Service Unavailable"`), truthful description (`listError`), and Retry button (`"Retry Request"`).

3. **Hosted Source Changes**:
   - **NONE**. No modifications made to `E:\cradlehub`.

---

## 3. Verification & Test Results

All verification suites executed and verified green:

| Check                     | Command             | Result                                            |
| ------------------------- | ------------------- | ------------------------------------------------- |
| Prettier Formatter        | `pnpm format:check` | PASSED (All matched files match style)            |
| ESLint Linter             | `pnpm lint`         | PASSED (0 errors, 0 warnings)                     |
| TypeScript Compiler       | `pnpm typecheck`    | PASSED (`tsc --noEmit` clean)                     |
| Vitest Unit & Integration | `pnpm test`         | PASSED (10 test files, 171 tests passed)          |
| Production Build          | `pnpm build`        | PASSED (Vite production bundle generated cleanly) |
| Git Whitespace Check      | `git diff --check`  | PASSED (0 whitespace/conflict errors)             |

### Test Breakdown by File

- `tests/roles.test.ts` — 5 tests passed
- `tests/auth-service.test.ts` — 15 tests passed
- `tests/customers-service.test.ts` — 11 tests passed (+4 tests for non-JSON 404, 500, 3xx, and malformed JSON)
- `tests/booking-options.test.ts` — 16 tests passed (+1 test for non-JSON lookup error)
- `tests/bookings-service.test.ts` — 33 tests passed
- `tests/boundary.test.ts` — 6 tests passed
- `tests/customers-components.test.tsx` — 9 tests passed (verified single unavailable card without duplicate banner)
- `tests/bookings-components.test.tsx` — 15 tests passed
- `tests/components.test.tsx` — 19 tests passed
- `tests/booking-preview.test.tsx` — 42 tests passed

**Total: 171 tests passed across 10 test files.**

---

## 4. Visual Verification Status

- **SUCCESS-DATA CUSTOMER LAYOUT STILL REQUIRES OWNER VISUAL VERIFICATION**:
  - The canonical two-column layout (`bookings-main-grid`), 5-column KPI strip (`customers-kpi-grid`), and DataGrid formatting have passed all unit and integration test suites.
  - Live visual verification on native Windows Desktop with real authenticated branch data remains required by owner inspection.

---

## 5. Security & Privacy Invariants

- **No Token Logging**: Zero tokens or Authorization headers logged or exposed in error messages.
- **No Raw HTML Exposure**: Server HTML bodies are never rendered or leaked to the user.
- **No Direct Table Queries**: Renderer never executes direct queries to `customers` or `waitlist_requests`.
- **No Customer Writes**: Customer creation, editing, notes mutation, and deletion remain strictly excluded.
- **No Fallback Data**: No fake or sample data fallbacks.
- **Tauri HTTP Capability**: Strictly unchanged; restricted to `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

---

## 6. Limitations & Rollback Plan

- **Limitations**:
  - Read-only slice; customer editing, writes, and waitlist mutations remain excluded.
- **Rollback**:
  - Desktop `main` baseline is `59f69fc7e321c32f040f6f9a79aca47e77547675`.
  - Revert branch with: `git reset --hard 59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Stage 04 Status**: Stage 04 (Staff) is **NOT STARTED / NOT AUTHORIZED**.
