# Stage 09B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 09B — Desktop Today UI

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/09b-desktop-today-ui`

**BASE_SHA:** `c83f5303a83ea9670506a3040050f99404d8b785`

**Accepted Hosted Contract SHA:** `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`

---

## Authorized Scope

Implement the smallest real Desktop Today vertical slice against the accepted hosted Stage 09A contract (`GET /api/desktop/v1/today` and `POST /api/desktop/v1/today/mutations`) using canonical desktop workspace primitives while preserving desktop boundaries:

1. **Canonical Workspace System**:
   - Replaces the generic unavailable placeholder for `today` in `CanonicalShell`.
   - Uses `ModuleWorkspace`, `ModuleHeader`, `ModuleSummaryCard`, `ModulePrimaryCard`, `ModuleDataGridFrame`, `ModuleInspectorFrame`, `ModuleLoadingState`, `ModuleErrorBanner`, `ModuleSuccessBanner`, `ModuleToolbar`, and `ModuleTabs`.
   - No parallel UI systems, no `TodayV2` or separate workspace implementations.

2. **Today Service & Types**:
   - `src/types/today.ts`: Exact types matching hosted Stage 09A DTOs (`DesktopTodayContext`, `DesktopTodaySummary`, `DesktopTodayQueueItem`, `DesktopTodayReadiness`, `DesktopTodayAttendance`, `DesktopTodayNotifications`, `DesktopTodayData`, `DesktopTodayMutationPayload`, `DesktopTodayMutationResult`).
   - `src/lib/today-service.ts`: `fetchToday` (GET `/api/desktop/v1/today`) and `mutateToday` (POST `/api/desktop/v1/today/mutations`).
   - Strict server-resolved branch authority: no client-selected branch parameter.
   - Authentication via Supabase Bearer token; response validation via `readHostedJsonResponse` and strengthened `isTodayResponse` with contract-complete nested item validation.

3. **Information Hierarchy & Operational Workflow**:
   - **Header**: Business date and branch name from authoritative context, manual Refresh action. No fake "Live" indicators.
   - **Operational Summary**: 6 actionable KPI cards (Waiting, In Service, Ready to Pay, Completed, Unassigned, Home Service) derived strictly from contract summary numbers.
   - **Primary Queue**: Displays time, customer, service, staff/resource, progress stage, Home Service indicators, and contextual action buttons. Search and stage filtering (All, Waiting, In Service, Ready to Pay, Completed).
   - **Inspector Panel**: 4 structured tabs:
     - _Detail_: Authoritative booking timing, assignment, customer contacts, and Home Service address/dispatch context.
     - _Readiness_: Truthful ok / warning / critical status, and explicit degraded panel when `readiness.available === false`.
     - _Attendance_: Authoritative recent check-in activity, and explicit degraded panel when `attendance.available === false`.
     - _Alerts_: Authoritative action notifications, and explicit degraded panel when `notifications.available === false`.

4. **Mutation Boundaries**:
   - Only safe supported operational mutations: `confirm_booking`, `mark_arrived`, `start_service`, `complete_service`.
   - In-flight mutation state disables action button and displays `Updating...`.
   - Mutation response wire contract: Hosted Stage 09A returns `{ ok: true, data: {} }` (with optional `releasedNow` / `releaseAt` for dispatch release). Desktop `DesktopTodayMutationResult` reflects this exact envelope; invented fields (`success`, `bookingId`, `status`, `code`, `error`, `message`) are removed.
   - `TodayView` resolves mutations without expecting `result.data.success`, generates a concise post-response confirmation message (`"Booking confirmed."`, `"Arrival recorded."`, `"Service started."`, `"Service completed."`), and re-fetches the authoritative Today snapshot.
   - On failure, server error is surfaced through an error alert banner; no local optimistic transitions.

5. **Payment Scope Exclusion**:
   - Payments remain strictly dormant desktop scope.
   - No "Collect Payment" or payment mutation buttons.
   - No payment amount, payment reference, or payment-method totals.
   - Stage `ready_to_pay` displays read-only status pill: `"Payment Pending — manage on web"`.

6. **Home Service Boundary in Today**:
   - Displays truthful queue context (`isHomeService`, `driverName`, `homeServiceAddress`).
   - When `dispatchContextAvailable === false`, displays `"Dispatch context unavailable on desktop"` without fabricating `"No driver assigned"`.
   - Home Service bookings are strictly excluded from ALL four Today mutations (`confirm_booking`, `mark_arrived`, `start_service`, `complete_service`). Home Service operational mutations remain exclusively within the Home Service module.

7. **Freshness Model**:
   - Strict snapshot + manual refresh. No polling, timers, background sync, SQLite, or Realtime subscriptions.

---

## Changed Implementation Files

- `src/types/today.ts` (new)
- `src/lib/today-service.ts` (new)
- `src/components/today/TodayView.tsx` (new)
- `src/components/CanonicalShell.tsx` (modified)
- `src/styles.css` (modified)
- `tests/today-service.test.ts` (new)
- `tests/today-components.test.tsx` (new)
- `tests/components.test.tsx` (modified)
- `docs/30-delivery/STAGE_09B_EVIDENCE.md` (new)

---

## Repository Evidence

**REPOSITORY-RECORDED PRODUCTION EVIDENCE**

Verification confirms:

- **Mount & Shell Integration**: `activeModule === 'today'` in `CanonicalShell` mounts `<TodayView authContext={authContext} />` within `ModuleWorkspaceHost` configured for `wide` desktop layout.
- **Strict Server Authority**: `fetchToday()` requests `/api/desktop/v1/today` with no client branch parameter; branch resolution is enforced on the hosted server from the Bearer token.
- **Contract Type Conformity**: `src/types/today.ts` preserves nullability, optional counts, exact stage enumerations matching hosted Stage 09A, and exact mutation success envelope `{ ok: true, data: DesktopTodayMutationData }`.
- **Nested Validation**: `isTodayResponse()` in `src/lib/today-service.ts` verifies every queue item, readiness issue, attendance item, and notification item against contract schemas, preventing malformed nested payloads from entering the UI.
- **Truthful Degradation**:
  - `readiness.available === false` displays degraded readiness notice; never claims "All clear".
  - `attendance.available === false` displays degraded attendance notice; never claims empty success.
  - `notifications.available === false` displays degraded alerts notice; never claims empty success.
  - `notifications.available === true && items.length === 0` displays truthful empty alerts state.
  - `dispatchContextAvailable === false` displays `"Dispatch context unavailable on desktop"` without inventing a "No driver" claim.
- **Payment Dormancy**: Queue rows and inspector details render read-only text `"Payment Pending — manage on web"` for `ready_to_pay` stages; zero payment CTA buttons exist.
- **Mutation Handling**: Double clicks prevented while mutation is in-flight; failures display truthful error banner without falsifying local UI transition.

---

## Agent-Observed Development & Runtime Evidence

**AGENT-OBSERVED DEVELOPMENT/RUNTIME EVIDENCE**

1. **Automated Test Suites**:
   - `tests/today-service.test.ts`: 13/13 tests passing. Verifies contract validation, rejection of malformed responses (including nested queue items, invalid stage enums, invalid readiness statuses, malformed readiness issues, malformed attendance items, malformed notification items, and invalid dispatchContextAvailable types), Bearer auth, network error handling, mutation payload formatting with real hosted `{ ok: true, data: {} }` response, and absence of client branch query parameter.
   - `tests/today-components.test.tsx`: 13/13 tests passing. Verifies loading skeleton, authoritative data rendering, KPI derivation, error/retry lifecycle, empty state, degraded section isolation (readiness, attendance, notifications), payment boundary enforcement, Home Service dispatch degradation, real hosted-shaped mutation success handling (`{ ok: true, data: {} }`), post-mutation refresh, mutation failure handling, and strict exclusion of Home Service bookings from ALL Today mutations.
   - `tests/components.test.tsx`: 20/20 tests passing. Verifies navigation integration and shell switching.

2. **Repository-Inspected Responsive Layout Rules**:
   - The source contains responsive CSS layout rules in `src/styles.css`:
     - **1440×900**: 2-column workspace (`1fr + 380px` inspector); 6 KPI summary cards across single row (`repeat(6, 1fr)`).
     - **1366×768**: 2-column workspace (`1fr + 340px` inspector); 8px gap on KPI summary cells.
     - **1024×768**: Responsive breakpoint reflows `.bookings-kpi-grid` into 2 rows of 3 (`repeat(3, 1fr)`), `.bookings-main-grid` stacks into single column (`1fr`), and inspector switches to `position: static` beneath the primary card.
   - _Note_: Native/runtime viewport verification was not performed in this pass; source inspection confirms the declared rules, while native visual and layout verification at these viewports is deferred to owner manual runtime review.

3. **Runtime Backend Note**:
   - In accordance with repository rules, normal runtime populated data was verified via automated test fixtures against the exact accepted hosted Stage 09A contract schema. Native live-backend execution remains subject to independent owner review.

---

## Exact Automated Checks & Results

All repository checks pass cleanly:

- **Vitest Unit & Component Suite**: `pnpm test`
  - Result: **23 test files passed (23)**, **416 tests passed (416)**, 0 failed
  - Today Service Tests: 13 passed (`tests/today-service.test.ts`)
  - Today Component Tests: 13 passed (`tests/today-components.test.tsx`)
- **TypeScript Typecheck**: `pnpm run typecheck` (`tsc --noEmit`)
  - Result: **0 errors** (exit code 0)
- **ESLint**: `pnpm run lint` (`eslint . --max-warnings 0`)
  - Result: **0 warnings, 0 errors** (exit code 0)
- **Prettier Code Style**: `pnpm run format:check` (`prettier --check .`)
  - Result: **All matched files use Prettier code style** (exit code 0)
- **Production Build**: `pnpm run build` (`tsc --noEmit && vite build`)
  - Result: **Production bundle built successfully** (exit code 0)
- **Git Diff Whitespace & Syntax Check**: `git diff --check`
  - Result: **0 defects** (exit code 0)

---

## Security and Data Impact

- No database schema or migration required or modified.
- Hosted online repository (`E:\cradlehub`) was inspected read-only and remains untouched at SHA `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`.
- Desktop renderer adheres strictly to boundary: Supabase Bearer token used via Tauri HTTP; zero privileged secrets or service-role keys in bundle; zero client-selected branch authority or query override.
- Strict dormant payment boundary: No payment CTAs, collect payment buttons, amounts, or mutation handlers. Stage `ready_to_pay` displays read-only label `"Payment Pending — manage on web"`.
- Home Service boundary: Excluded from all Today mutations; truthful `"Dispatch context unavailable on desktop"` displayed when `dispatchContextAvailable === false` without faking `"No driver assigned"`.

---

## Known Limitations

- OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: Not yet provided. Owner visual/runtime inspection remains required before Stage 09B acceptance.
- Payments remain dormant on desktop; payment collection must be conducted on the web application.
- Home Service mutations are not executable from Today.
- Snapshot + manual refresh only (no background polling, timers, or Realtime subscriptions).

---

## Rollback Instructions

Before merge, abandon branch `stage/09b-desktop-today-ui`.

After merge, revert the Stage 09B implementation and evidence commits rather than rewriting accepted history.

No database rollback is required because Stage 09B introduced no schema or migration changes.

---

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
