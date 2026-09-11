# Stage 11 — Evidence

**Target:** CradleHub Windows desktop CRM client  
**Stage / Task:** Stage 11 — Canonical Modal Parity  
**Status:** `READY FOR INDEPENDENT REVIEW — NOT ACCEPTED / NOT MERGED`  
**Branch:** `stage/11-canonical-modal-parity`  
**BASE_SHA:** `3596493f07aaa61dc9c5e0cc1d7c1b5f31a75ac7`  
**Hosted Canonical Reference:** `E:\cradlehub` (commit `1ea191f3ebedccda6a2249f3ee8f1b53d5e6791a`, READ-ONLY)

---

## 1. Executive Summary & Purpose

Stage 11 establishes functional parity between the operational modal workflows of the CradleHub Windows Desktop Client and the authoritative hosted CradleHub web application (`https://www.cradlewellnessliving.com`).

All modals, dialogs, confirmation dialogs, and drawer sheets across the active CRM modules were audited against the canonical hosted codebase. For every applicable workflow, the hosted contract defines:

- The authoritative trigger and permission requirements.
- The required and optional form fields.
- Client-side and server-side validation rules.
- Available options (e.g. cancellation reasons, roles, capabilities).
- Authoritative backend endpoints and payload contracts.

The Desktop client preserves the canonical function, fields, and error boundaries while rendering through the desktop design system (tokens, borders, spacing, dark mode adaptation, and keyboard accessibility).

### Scope Boundaries Maintained

- **Strictly Active Modules**: Only the 8 authorized first-release modules were audited and maintained:
  1. Today (`src/components/today/**`)
  2. Bookings (`src/components/bookings/**`)
  3. Attendance (`src/components/attendance/**`)
  4. Customers (`src/components/customers/**`)
  5. Schedule (`src/components/schedule/**`)
  6. Home Service (`src/components/home-service/**`)
  7. Staff (`src/components/staff/**`)
  8. Settings (`src/components/CanonicalShell.tsx` module placeholder)
- **Zero Financial Modules Reopened**: Owner, Payments, Finance, Reports, Reconciliation, and Payroll remain dormant and excluded from modal additions.
- **Zero Backend Mutation**: No schema changes, no migrations, no alterations to hosted code in `E:\cradlehub`.
- **Zero Privileged Secrets**: All client API requests authenticate via user session Bearer tokens; no Supabase service role keys exist in the renderer.
- **Fail-Closed Offline Security**: In the absence of network connectivity or valid authentication, all modal actions fail closed with clear, actionable error messaging.

---

## 2. Canonical Modal Parity Matrix Summary

The comprehensive audit and matrix is recorded in [`docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md`](file:///E:/Cradle-Destop-Client/docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md).

| Module           | Canonical Modal / Workflow  | Desktop Status              | Implementation Notes                                                                                                               |
| :--------------- | :-------------------------- | :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Today**        | In-Spa Booking Actions      | Complete                    | Handled via inline card actions with status confirmation; cancel/reschedule delegates to Bookings inspector.                       |
| **Bookings**     | New Booking Modal           | Complete                    | Implemented in Stage 02/08B with walk-in, phone, and future booking options and write boundaries.                                  |
| **Bookings**     | Cancel Booking Modal        | **Implemented in Stage 11** | Replaced placeholder notice with canonical `CancelBookingModal` calling `POST /api/desktop/v1/bookings/:bookingId/cancel`.         |
| **Bookings**     | Reschedule Booking Modal    | **Implemented in Stage 11** | Replaced placeholder notice with canonical `RescheduleBookingModal` calling `POST /api/desktop/v1/bookings/:bookingId/reschedule`. |
| **Attendance**   | Review Queue Override       | Complete                    | Direct operational review with audit comments and status derivation.                                                               |
| **Customers**    | Customer Lookup / Details   | Complete                    | Read-only inspector profile and debounced search via `POST /api/desktop/v1/customers`.                                             |
| **Schedule**     | Shift Adjust / Action Modal | Complete                    | Modals for shift viewing and adjustments conform to canonical shift models.                                                        |
| **Home Service** | Dispatch Details Modal      | Complete                    | Dispatch detail inspection and driver assignment conform to dispatch contract.                                                     |
| **Staff**        | Application Approval Modal  | Complete                    | Full staff candidate review with tier and branch assignment.                                                                       |
| **Staff**        | Role & Capability Modals    | Complete                    | Role assignment and service capability modals conform to hosted role types.                                                        |
| **Settings**     | Desktop Settings            | Truthfully Unavailable      | Remains truthfully unavailable; no desktop settings service exists.                                                                |

---

## 3. Substantive Implementation Details

### 3.1 Bookings Service Endpoints (`src/lib/bookings-service.ts`)

Added authoritative client functions for booking cancellation and rescheduling:

1. **`BOOKING_CANCELLATION_REASONS`**:
   Canonical CRM reason list matching hosted web application:
   - `customer_requested` ("Customer requested cancellation")
   - `customer_unavailable` ("Customer unavailable")
   - `duplicate_booking` ("Duplicate booking")
   - `scheduling_conflict` ("Scheduling conflict")
   - `staff_unavailable` ("Staff unavailable")
   - `payment_issue` ("Payment issue")
   - `invalid_booking` ("Invalid booking")
   - `other` ("Other")

2. **`cancelBranchBooking(input, client?, customFetch?)`**:
   - Endpoint: `POST ${baseUrl}/api/desktop/v1/bookings/:bookingId/cancel`
   - Authorization: Bearer JWT from current user session.
   - Payload: `{ cancellationReason, note }`.
   - Security: Tokens are never exposed in error responses.

3. **`rescheduleBranchBooking(input, client?, customFetch?)`**:
   - Endpoint: `POST ${baseUrl}/api/desktop/v1/bookings/:bookingId/reschedule`
   - Authorization: Bearer JWT from current user session.
   - Payload: `{ date, startTime, note, homeServiceAddress, homeServiceAccessNote }`.
   - Handles both in-spa and home-service address adjustments.

### 3.2 Canonical Cancel Booking Modal (`src/components/bookings/CancelBookingModal.tsx`)

- **Component**: `<CancelBookingModal isOpen={isOpen} onClose={onClose} booking={booking} onBookingCancelled={...} />`
- **Features**:
  - Read-only summary panel: Customer Name, Service, Scheduled Date, Scheduled Time.
  - Reason selector dropdown populated with canonical reasons.
  - Optional internal context/note textarea with character limit.
  - Red warning theme for destructive action confirmation.
  - Keyboard accessibility: Escape key listener, focusable inputs, `role="dialog"`, `aria-labelledby="cancel-booking-modal-title"`.
  - Inner dialog component lifecycle to avoid setState in effects.

### 3.3 Canonical Reschedule Booking Modal (`src/components/bookings/RescheduleBookingModal.tsx`)

- **Component**: `<RescheduleBookingModal isOpen={isOpen} onClose={onClose} booking={booking} onBookingRescheduled={...} />`
- **Features**:
  - Current schedule summary: Customer Name, Service & duration, Current date/time, Location.
  - Date input and Start Time input prefilled with existing booking values.
  - Conditional home service section: prefilled address and access notes when booking delivery type is home service.
  - CRM internal note input for audit trail.
  - Dirty checking: Save button remains disabled until at least one field is modified.
  - Keyboard accessibility: Escape key listener, `role="dialog"`, `aria-labelledby="reschedule-booking-modal-title"`.

### 3.4 Wireup in Bookings Inspector & View

- **`BookingInspectorCard.tsx`**: Quick action buttons for "Reschedule" and "Cancel" trigger the respective modal dialogs; calls `onBookingUpdated` callback on mutation success.
- **`BookingsView.tsx`**: Passes `onBookingUpdated={handleRefresh}` to trigger data refresh upon cancellation or reschedule.

---

## 4. Verification Evidence & Quality Gates

### 4.1 Automated Test Execution

| Test Suite                                     | Tests Run | Result   | Duration   |
| :--------------------------------------------- | :-------- | :------- | :--------- |
| `tests/bookings-service.test.ts`               | 45        | **PASS** | 89ms       |
| `tests/bookings-components.test.tsx`           | 26        | **PASS** | 1761ms     |
| **Full Repository Test Suite (23 test files)** | **473**   | **PASS** | **19.24s** |

Baseline test count: 450 tests.  
Stage 11 final test count: **473 tests (+23 new tests)**.

### 4.2 Quality Checks

1. **Typecheck (`pnpm run typecheck`)**:
   - Clean execution: `tsc --noEmit` exited with code `0` (0 errors).
2. **Lint (`pnpm run lint`)**:
   - Clean execution: `eslint . --max-warnings 0` exited with code `0` (0 errors, 0 warnings).
3. **Format Check (`pnpm run format:check`)**:
   - Clean execution: `prettier --check .` exited with code `0` (all matched files use Prettier style).
4. **Vite Production Build (`pnpm run build`)**:
   - Clean execution: `tsc --noEmit && vite build` exited with code `0`.
   - Distribution assets emitted: `dist/index.html`, `dist/assets/index-BBxms6Hu.css`, `dist/assets/index-BYXosstk.js`.
5. **Git Whitespace & Formatting (`git diff --check`)**:
   - Clean execution: exited with code `0` (no whitespace errors, no unresolved merge markers).

---

## 5. Evidence Classification

- **Source Code & Unit Test Evidence**: Verified in local repository via Vitest and TypeScript compiler.
- **JSDOM Simulation**: Dialog open/close, focus, keyboard triggers, form submissions, and error states verified in JSDOM environment.
- **Native Windows Runtime Evidence**: Marked `PENDING OWNER INSPECTION`. Real Windows WebView rendering and live OS-level interaction require manual owner visual verification.

---

## 6. Conclusion & Handoff

```text
STATUS: READY FOR INDEPENDENT REVIEW
NOT ACCEPTED
NOT MERGED
NEXT STAGE NOT AUTHORIZED
```
