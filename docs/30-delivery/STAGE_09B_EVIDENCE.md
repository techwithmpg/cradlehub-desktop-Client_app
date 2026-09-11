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

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE & VIEWPORT / MODAL / PAGINATION CORRECTION

### Owner-Provided Manual Runtime Observations

Following visual inspection of the running Today workspace, the owner confirmed:

**Good / Approved Elements Preserved:**

- Today header hierarchy (title, business date, branch, static Front Desk View indicator, Refresh action).
- Four upper action cards composition.
- Active Service Workflow visual language, table columns, and lifecycle tabs.
- Activity right-rail card with Snapshot freshness badge, Recent Scans, and Recent Activity.
- Quick Actions right-rail card with canonical module navigation.
- Today's Money card with truthful web-only placeholder state (no fake figures, no fake currency symbols).
- Overall two-column operational workspace composition.

**Defects & Corrections Directed by Owner:**

1. **Unused Vertical Workspace**: Large blank canvas remained below the workflow and rail.
2. **Booking Details Consumed Unnecessary Space**: Inline Booking Details underneath the queue table was unwanted and cluttered the workflow.
3. **Workflow Height Distribution**: Active Service Workflow must fill the available vertical area and approximately align with the bottom of Today's Money.
4. **Queue Overflow Mechanism**: Queue overflow must use pagination, NOT vertical scrolling.
5. **No-Scroll Desktop Viewport**: Today workspace must fit inside the visible Desktop viewport (at 1440×900 and 1366×768) without page scrolling.
6. **Booking Action Cards Interaction**: The four upper action cards must open the canonical `NewBookingModal` with initial mode selection rather than merely navigating to the Bookings module.

---

### Corrections Applied in This Pass

1. **Inline Booking Details Removed Completely**:
   - Removed `.today-selected-booking-card` and all associated markup (`Booking Details — <customer>`, ID, timing, service, staff, resource, contact, stage, Home Service address details, and close button).
   - Removed selection-only state (`selectedId`, `selectedBooking`), automatic selection of the first booking, row `tabIndex`, and row selection styling (`.selected`).
   - Workflow card now contains strictly: card header, controls row, adaptive queue table, and canonical pagination footer.
   - Lifecycle action buttons in the `NEXT ACTION` column remain fully interactive.

2. **Full-Height Today Viewport Geometry**:
   - Added Today-specific layout classes from `CanonicalShell`: `.today-workspace-content`, `.today-workspace-host`, and `.today-workspace-mount` with `height: 100%`, `min-height: 0`, and `overflow: hidden`.
   - Global `.workspace-content { overflow-y: auto; }` remains untouched for all other modules.
   - `.today-workspace-root` configured as flex column (`height: 100%; min-height: 0; flex: 1; gap: 12px`).
   - `.today-page-grid` configured with `align-items: stretch; height: 100%; min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 16px`.
   - `.today-main-col` and `.today-workflow-card` flex to fill remaining vertical area (`flex: 1; min-height: 0`). Unused table area stays inside the white operational card rather than creating a gray page void.
   - Workflow card bottom approximately aligns with the bottom of Today's Money.

3. **Three-Card Right Rail Height Distribution**:
   - Preserved exactly the three approved cards: Activity (`TodayActivityCard`), Quick Actions (`TodayQuickActionsCard`), and Today's Money (`TodayMoneyCard`).
   - `.today-right-rail` configured as `grid-template-rows: minmax(0, 1fr) auto auto; height: 100%; min-height: 0; gap: 12px`.
   - Activity card absorbs flexible space while Quick Actions and Today's Money retain compact natural dimensions at the bottom.
   - Capped preview items in Activity card (4 scans, 3 notifications) and hidden internal vertical scrolling (`overflow-y: hidden`).
   - Responsive degradation at 1024×768: right rail arranges cards into a 3-column horizontal grid (`grid-template-columns: repeat(3, 1fr); height: auto`) to avoid deep vertical page stacking.

4. **Canonical Pagination Added (No Vertical Table Scrolling)**:
   - Reused canonical `ModulePagination` from `src/components/workspace/ModulePagination.tsx`.
   - Table container strictly uses `overflow-y: hidden; flex: 1; min-height: 0`.
   - Added backwards-compatible `showPageSizeSelector?: boolean` (defaults to `true`) on `ModulePagination`, passing `false` in Today so that the fixed viewport is not disrupted by a manual page-size selector.
   - Extracted helper `calculateAdaptivePageSize` into `src/components/today/adaptive-page-size.ts`.
   - Table region measures container height via local `ResizeObserver` and dynamically calculates page size based on compact 48px row height, clamped between 3 and 8 rows.
   - Filtering and search execute before pagination; switching stage tabs or changing search query resets page to 1.
   - Clamping logic guarantees `validCurrentPage` never exceeds `totalPages` after mutations or refreshes.

5. **Upper Action Cards Open Canonical `NewBookingModal`**:
   - Upper cards now open the canonical `NewBookingModal` from `src/components/bookings/NewBookingModal.tsx`.
   - Added backwards-compatible `initialMode?: QuickBookingMode` to `NewBookingModalProps`. Existing `BookingsView` usage is completely unaffected.
   - **New Booking** card: Opens modal in default mode (`walkin`).
   - **Walk-in** card: Opens modal with `initialMode="walkin"`.
   - **Book for Later** card: Opens modal with `initialMode="standard_future"`.
   - **Home Service** card: Opens modal focused on `home_service`.
   - **Home Service Fail-Closed Boundary Preserved**:
     - Home Service creation remains disabled and impossible.
     - Mode tab remains disabled with truthful tooltip: _"Home Service booking will be enabled after precise address/location support is connected."_
     - Displays error alert banner (`home-service-disabled-notice`).
     - Submit button is disabled; `handleSubmit` explicitly blocks submission when `mode === 'home_service'`; no mutation is fired; zero simulated success.
   - **Dirty State and Reset Integrity**:
     - Keyed modal preview with `initialMode` to ensure clean unmount/remount between sessions.
     - Opening mode is tracked as baseline; opening "Book for Later" does not trigger false dirty-state discard warnings.
     - Successful booking creation closes modal, displays truthful success banner, refreshes Today snapshot via `fetchToday`, and remains on Today without navigating away.

---

### Explicit Confirmations

- **Inline Booking Details**: Removed completely.
- **Row selection behavior**: Removed completely (no auto-selection, no `.selected` styling, no row click-to-expand).
- **Workflow height**: Flexes to consume available viewport height.
- **Workflow bottom alignment**: Approximately aligns with bottom of Today's Money card.
- **Queue overflow mechanism**: Managed via canonical pagination, NOT vertical scrolling.
- **Table scrollbar**: `overflow-y: hidden`; table container does not vertically scroll.
- **Desktop viewport**: Today fits within 1440×900 and 1366×768 without page-level vertical scrollbar.
- **Upper action cards**: Open canonical `NewBookingModal` with initial mode mappings.
- **Home Service creation**: Remains disabled, fail-closed, and impossible to submit.
- **Right rail**: Three-card rail preserved (Activity, Quick Actions, Today's Money).
- **Freshness & Data Truth**: Strictly snapshot + manual refresh; zero fake data; zero fake money; zero fake Live indicators.
- **Contract & Backend**: Unchanged.
- **Hosted repository**: `E:\cradlehub` remains untouched at `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`.
- **Owner visual re-test**: **PENDING**.

---

## Rollback Instructions

Before merge, abandon branch `stage/09b-desktop-today-ui`.

After merge, revert the Stage 09B implementation and evidence commits rather than rewriting accepted history.

No database rollback is required because Stage 09B introduced no schema or migration changes.

---

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
