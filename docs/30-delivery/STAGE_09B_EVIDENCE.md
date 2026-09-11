# Stage 09B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 09B — Desktop Today UI

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/09b-desktop-today-ui`

**BASE_SHA:** `c83f5303a83ea9670506a3040050f99404d8b785`

**HOSTED_AUTHORITY_SHA:** `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`

**TESTED_IMPLEMENTATION_HEAD_SHA:** `42f92f02ba436dae37a3cd67e0d4e055b952bae3`

---

## Authorized Scope

Implement the smallest real Desktop Today vertical slice against the accepted hosted Stage 09A contract (`GET /api/desktop/v1/today` and `POST /api/desktop/v1/today/mutations`) using canonical desktop workspace primitives while preserving desktop boundaries:

1. **Canonical Workspace System**:
   - Replaces the generic unavailable placeholder for `today` in `CanonicalShell`.
   - Uses `ModuleWorkspace`, `ModuleHeader`, `ModuleSummaryCard`, `ModulePrimaryCard`, `ModuleDataGridFrame`, `ModuleInspectorFrame`, `ModuleLoadingState`, `ModuleErrorBanner`, `ModuleSuccessBanner`, `ModuleToolbar`, and `ModuleTabs`.
   - No parallel UI systems, no `TodayV2` or separate workspace implementations.

2. **Today Service & Types**:
   - `src/types/today.ts`: Exact types matching hosted Stage 09A DTOs (`DesktopTodayContext`, `DesktopTodaySummary`, `DesktopTodayQueueItem`, `DesktopTodayReadiness`, `DesktopTodayAttendance`, `DesktopTodayNotifications`, `DesktopTodayData`, `DesktopTodayMutationPayload`, `DesktopTodayMutationResult`).
   - `DesktopTodayMutationData` is strictly modeled as an empty object contract (`Record<string, never>`), and `DesktopTodayMutationResult` reflects the exact wire shape `{ ok: true, data: {} }`. Dormant dispatch response fields (`releasedNow`, `releaseAt`) are completely removed from Today types.
   - `src/lib/today-service.ts`: `fetchToday` (GET `/api/desktop/v1/today`) and `mutateToday` (POST `/api/desktop/v1/today/mutations`).
   - Strict server-resolved branch authority: no client-selected branch parameter.
   - Authentication via Supabase Bearer token; response validation via `readHostedJsonResponse` and strengthened `isTodayResponse` with contract-complete nested item validation.
   - `isTodayMutationResult` strictly verifies that `value.data` is an empty object (`Object.keys(value.data).length === 0`). Any payload containing unexpected keys is rejected.

3. **Information Hierarchy & Operational Workflow**:
   - **Header**: Business date and branch name from authoritative context, manual Refresh action. No fake "Live" indicators.
   - **Operational Summary**: 6 actionable KPI cards (Waiting, In Service, Ready to Pay, Completed, Unassigned, Home Service) derived strictly from contract summary numbers.
   - **Primary Queue**: Displays time, customer, service, staff/resource, progress stage, Home Service indicators, and contextual action buttons. Search and stage filtering (All, Waiting, In Service, Ready to Pay, Completed).
   - **Inspector Panel**: 4 structured tabs:
     - _Detail_: Authoritative booking timing, assignment, customer contacts, and Home Service address/dispatch context.
     - _Readiness_: Truthful ok / warning / critical status, and explicit degraded panel when `readiness.available === false`.
     - _Attendance_: Authoritative recent check-in activity, and explicit degraded panel when `attendance.available === false`.
     - _Alerts_: Authoritative action notifications, and explicit degraded panel when `notifications.available === false`.

4. **Mutation Boundaries & Presentation-Only Eligibility**:
   - Successful authorized Today mutations currently return:
     ```json
     {
       "ok": true,
       "data": {}
     }
     ```
   - The four authorized Today actions are:
     - `confirm_booking`
     - `mark_arrived`
     - `start_service`
     - `complete_service`
   - No dispatch-release mutation exists in Stage 09B.
   - Action eligibility (`getApplicableAction`) is purely presentation-only and derived from authoritative operational lifecycle states:
     - Home Service bookings return `null` (zero Today mutations).
     - Checked-in bookings (`bookingProgressStatus === 'checked_in'`) offer **Start Service**.
     - In-service bookings (`bookingProgressStatus === 'session_started'`, `status === 'in_progress'`, or `stage === 'in_service'`) offer **Complete Service**.
     - Confirmed bookings waiting to start (`status === 'confirmed' && bookingProgressStatus === 'not_started'`) offer **Mark Arrived**.
     - Unconfirmed bookings in waiting stage (`stage === 'waiting' && bookingProgressStatus === 'not_started' && status !== 'confirmed'`) offer **Confirm**.
     - No parallel copy of the hosted `CONFIRMABLE_STATUSES` rule exists on Desktop (neither as a Set nor an inline status check). The hosted API endpoint remains the sole authority for whether confirmation is valid and will reject unsupported statuses.
   - In-flight mutation state disables action button and displays `Updating...`.
   - `TodayView` generates a concise post-response confirmation message (`"Booking confirmed."`, `"Arrival recorded."`, `"Service started."`, `"Service completed."`), and re-fetches the authoritative Today snapshot.
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
- **Contract Type Conformity**: `src/types/today.ts` preserves nullability, optional counts, exact stage enumerations matching hosted Stage 09A, and exact mutation success envelope `{ ok: true, data: DesktopTodayMutationData }` where `DesktopTodayMutationData` is `Record<string, never>`.
- **Nested Validation**: `isTodayResponse()` in `src/lib/today-service.ts` verifies every queue item, readiness issue, attendance item, and notification item against contract schemas, preventing malformed nested payloads from entering the UI.
- **Strict Mutation Validation**: `isTodayMutationResult()` requires `Object.keys(value.data).length === 0`. Unexpected keys (e.g. `releasedNow`) are rejected.
- **Truthful Degradation**:
  - `readiness.available === false` displays degraded readiness notice; never claims "All clear".
  - `attendance.available === false` displays degraded attendance notice; never claims empty success.
  - `notifications.available === false` displays degraded alerts notice; never claims empty success.
  - `notifications.available === true && items.length === 0` displays truthful empty alerts state.
  - `dispatchContextAvailable === false` displays `"Dispatch context unavailable on desktop"` without inventing a "No driver" claim.
- **Payment Dormancy**: Queue rows and inspector details render read-only text `"Payment Pending — manage on web"` for `ready_to_pay` stages; zero payment CTA buttons exist.
- **Mutation Handling**: Double clicks prevented while mutation is in-flight; failures display truthful error banner without falsifying local UI transition.

---

## Automated and Repository-Inspected Evidence

### Automated Test Evidence

1. **Today Service Suite** (`tests/today-service.test.ts`):
   - 14/14 tests passing.
   - Verifies contract validation, rejection of malformed responses (including nested queue items, invalid stage enums, invalid readiness statuses, malformed readiness issues, malformed attendance items, malformed notification items, and invalid dispatchContextAvailable types).
   - Verifies Bearer auth header and absence of client branch query parameter.
   - Verifies mutation payload formatting with exact hosted `{ ok: true, data: {} }` wire response.
   - Regression test verifies rejection of unexpected mutation response keys (such as dormant `{ releasedNow: true }`).

2. **Today Component Suite** (`tests/today-components.test.tsx`):
   - 18/18 tests passing.
   - Verifies loading skeleton, authoritative data rendering, KPI derivation, error/retry lifecycle, empty state, degraded section isolation (readiness, attendance, notifications), payment boundary enforcement, Home Service dispatch degradation.
   - Verifies real hosted-shaped mutation success handling (`{ ok: true, data: {} }`), post-mutation refresh, and truthful mutation failure display.
   - Verifies presentation-only action eligibility lifecycle:
     - Home Service: zero mutation actions offered.
     - Confirmed + `not_started`: offers Mark Arrived.
     - `checked_in`: offers Start Service.
     - `session_started`: offers Complete Service.
     - Status `in_progress`: offers Complete Service.
     - Waiting/non-confirmed presentation state: offers Confirm without maintaining an exact duplicate copy of the hosted `CONFIRMABLE_STATUSES` rule.
     - Server rejection handling displays truthful error banner.

3. **Shell Component Suite** (`tests/components.test.tsx`):
   - 20/20 tests passing.
   - Verifies navigation integration and shell switching to Today module.

### Repository-Inspected Responsive Rules

The source contains responsive CSS layout rules in `src/styles.css`:

- **1440×900**: 2-column workspace (`1fr + 380px` inspector); 6 KPI summary cards across single row (`repeat(6, 1fr)`).
- **1366×768**: 2-column workspace (`1fr + 340px` inspector); 8px gap on KPI summary cells.
- **1024×768**: Responsive breakpoint reflows `.bookings-kpi-grid` into 2 rows of 3 (`repeat(3, 1fr)`), `.bookings-main-grid` stacks into single column (`1fr`), and inspector switches to `position: static` beneath the primary card.

### Runtime Verification Disclaimer

No native populated Desktop runtime against live hosted data was verified by the agent in this pass. Automated synthetic fixtures validate component and service behavior only. Owner manual runtime/visual inspection remains required.

---

## Exact Automated Checks & Results

- **Focused Today Test Suites**:
  - `pnpm vitest run tests/today-service.test.ts tests/today-components.test.tsx`
  - Result: **2 files passed (2)**, **32 tests passed (32)**, 0 failed
    - `tests/today-service.test.ts`: 14 passed
    - `tests/today-components.test.tsx`: 18 passed
- **Shell Component Integration Suite**:
  - `pnpm vitest run tests/components.test.tsx`
  - Result: **1 file passed (1)**, **20 tests passed (20)**, 0 failed
- **Full Regression Test Suite Execution**:
  - `pnpm test`
  - Result: **22 files passed**, **1 file failed** (`tests/schedule-components.test.tsx`)
  - Total Tests: **421 passed**, **1 failed**
  - **Regression Detail**: The full suite was executed. Stage 09B Today tests passed (32/32) and Shell integration tests passed (20/20). One unrelated accepted-baseline Schedule test (`derives Next Booking from the selected staff real booking data` in `tests/schedule-components.test.tsx`) failed (`Unable to find an element with the text: Swedish Massage`) because it is wall-clock-sensitive at the execution time (local time > 23:00, whereas the fixture's hardcoded booking start time is `23:00`). Stage 09B does not modify that Schedule file; comparison against `BASE_SHA` shows zero diff (`git diff c83f5303a83ea9670506a3040050f99404d8b785 -- tests/schedule-components.test.tsx` produces empty output). No unrelated Schedule correction was introduced into this stage.
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
- Server is the final authority for all mutations; renderer only presents actions based on operational progress.

---

## Known Limitations

- OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: Not yet provided. Owner visual/runtime inspection remains required before Stage 09B acceptance.
- Payments remain dormant on desktop; payment collection must be conducted on the web application.
- Home Service mutations are not executable from Today.
- Snapshot + manual refresh only (no background polling, timers, or Realtime subscriptions).
- Accepted baseline Schedule test (`tests/schedule-components.test.tsx`) is wall-clock sensitive past 23:00 local time; left unmodified as out-of-scope for Stage 09B.

---

## OWNER-DIRECTED TODAY LAYOUT CORRECTION

### Reference Visual Authority

- **Approved Visual Reference**: `docs/20-product/reference-ui/current/crm/crm-today.png`
- **Scope**: Layout and spatial composition pass prior to Stage 09B acceptance, preserving existing backend contract, bearer auth, server authority, and mutation safety.

### Layout Changes Applied

1. **Page-Level Two-Column Composition (`.today-page-grid`)**:
   - Replaced the previous `ModuleMainGrid` + persistent `ModuleInspectorColumn` with a two-column Desktop Today grid (`minmax(0, 1fr)` main column + ~280–310px secondary right rail).
   - Responsive degradation at 1024×768: right rail stacks cleanly below the main column; action cards adapt to 2×2 grid; queue table contains internal horizontal scroll when constrained.

2. **Persistent Three-Card Right Rail (`.today-right-rail`)**:
   - Replaces the old persistent booking inspector with three independent canonical cards:
     - **Card 1: Activity (`TodayActivityCard`)**:
       - Freshness indicator rendered as **"Snapshot"** (truthful to manual snapshot refresh; zero fake "Live" / "Realtime" claims).
       - Two tabs: **Recent Scans** (rendering real scans from `data.attendance.items`, with truthful degraded/empty states and a "View Attendance →" canonical navigation button) and **Recent Activity** (rendering truthful operational alerts from `data.notifications` or truthful empty state; zero fabricated chronological audit log).
     - **Card 2: Quick Actions (`TodayQuickActionsCard`)**:
       - Four canonical module navigation buttons: View Customers (`customers`), Check Schedule (`schedule`), View Attendance (`attendance`), and Home Service (`home-service`).
     - **Card 3: Today's Money (`TodayMoneyCard`)**:
       - 2×2 metric structure showing "—" placeholders and a "Web only" badge.
       - Truthful unavailable notice: _"Financial summary is not available in Desktop yet. Manage payments on web."_
       - Contains **NO** authoritative monetary values, **NO** fake currency symbols (`₱`), and **NO** collect payment actions.

3. **Front-Desk Action Strip (`.today-action-strip`)**:
   - Four cards positioned above Active Service Workflow:
     - **New Booking** (primary, navigates to canonical `bookings` module)
     - **Walk-in** (informational front-desk guidance)
     - **Book for Later** (informational phone/future booking guidance)
     - **Home Service** (navigates to canonical `home-service` dispatch module)

4. **Active Service Workflow Card Hierarchy**:
   - Header with clear title and helper copy (_"One clear next action for every customer visit."_).
   - Controls row with lifecycle tabs containing authoritative counts (**Waiting**, **In Service**, **Ready to Pay**, **Completed**, and **All Queue**), followed by search input.
   - Dense Desktop table with columns: `TIME`, `CUSTOMER`, `SERVICE / SUMMARY`, `STATUS`, `ASSIGNEE`, `NEXT ACTION`.
   - Compact status badges, staff/customer initials fallback avatars, and operational next action buttons.

5. **Inspector Preservation & Relocation**:
   - Persistent inspector removed from the primary right rail.
   - Useful booking detail preserved in a secondary card (`.today-selected-booking-card`) directly associated with the selected queue row below the table, without creating an alternate drawer/modal framework.
   - Readiness status preserved as a compact operational alert strip (`.today-alert-strip`) only when active issues or degradation occur, avoiding a wasteful permanent empty tab.

### Explicit Confirmations

- **NO fake data**: All displayed records originate strictly from `data.queue`, `data.attendance`, and `data.notifications`.
- **NO fake money**: Today's Money contains zero fabricated figures; financial totals are explicitly marked web-only and dormant on Desktop.
- **NO fake Live**: Freshness badge is strictly "Snapshot"; no background polling, timers, or WebSocket subscriptions added.
- **NO payment mutations**: Payment Pending / Ready to Pay stage remains strictly read-only (`"Payment Pending — manage on web"`).
- **NO Home Service mutations**: Home Service bookings remain strictly excluded from Today mutation eligibility.
- **NO contract code rewritten**: `today-service.ts`, `today.ts`, and hosted routes are unchanged.
- **NO hosted modifications**: `E:\cradlehub` remains 100% untouched at `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`.
- **NO second UI system**: Uses canonical tokens, styling classes, and existing shell navigation.
- **Owner visual/runtime confirmation**: **PENDING**.

---

## Rollback Instructions

Before merge, abandon branch `stage/09b-desktop-today-ui`.

After merge, revert the Stage 09B implementation and evidence commits rather than rewriting accepted history.

No database rollback is required because Stage 09B introduced no schema or migration changes.

---

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
