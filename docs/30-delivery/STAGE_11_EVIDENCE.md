# Stage 11 — Evidence

- **Target:** CradleHub Windows desktop CRM client
- **Stage / Task:** Stage 11 — Canonical Modal Parity (Final Fail-Closed Staff Modal / Authority Correction)
- **Status:** `READY FOR INDEPENDENT RE-REVIEW — NOT ACCEPTED / NOT MERGED`
- **Branch:** `stage/11-canonical-modal-parity`
- **BASE_SHA:** `3596493f07aaa61dc9c5e0cc1d7c1b5f31a75ac7`
- **Starting Correction HEAD:** `b459ffb116f5b04ed77fcb53cd5d91be008b1aac`
- **Authoritative Hosted Reference:** `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99` (`https://github.com/techwithmpg/Cradlehub.git` `origin/main`, READ-ONLY)

---

## 1. Correction Rationale & Scope Reconciliation

### 1.1 Why the Staff Modal Authority Correction Was Required

Independent review of the previous correction pass identified a key contradiction:

- The Stage 11 matrix classified several Staff workflows as `BLOCKED — HOSTED ENDPOINT REQUIRED`.
- However, the actual Desktop source components (`StaffApplicationApprovalModal.tsx`, `StaffInspectorCard.tsx`, `StaffRoleModal.tsx`, `StaffScheduleModal.tsx`) still exposed active UI paths that called client-side database mutation helpers (`reviewOnboardingRequest`, `updateStaffSystemRole`, `adjustStaffSchedule`, `updateStaffProfile`).
- A workflow cannot simultaneously be classified as blocked while remaining executable via unsafe client-side mutations in the normal Desktop runtime.
- Furthermore, for Staff Schedule, an authoritative hosted endpoint (`POST /api/desktop/v1/schedule/mutations`) already existed on current hosted main (`ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`) and had a client wrapper `mutateSchedule(...)` in `src/lib/schedule-service.ts`. Staff Schedule was therefore erroneously classified as blocked instead of being routed through the existing safe hosted endpoint.

### 1.2 Core Correction Principles Applied

1. **Truthful Fail-Closed Boundary**: Where authoritative server validation cannot be reached safely (`Staff Approval`, `Staff Rejection`, `Staff Role Assignment`, `Staff Inline Profile Edit`), active mutations are completely disconnected from the normal Desktop runtime.
   - The UI displays explicit unavailable notices (`UNAVAILABLE IN DESKTOP — AUTHORITATIVE ENDPOINT REQUIRED`).
   - Submit / Save / Approve / Reject action buttons are disabled with explanatory titles.
   - No fake success or simulated optimistic updates occur.
   - Modals remain dismissible via Cancel/Close buttons and keyboard Escape.
2. **Route Through Existing Safe Transport**: `StaffScheduleModal` is adapted to call `scheduleService.mutateSchedule(...)` (`POST /api/desktop/v1/schedule/mutations`), reusing the canonical schedule transport family and honoring server-derived branch authority.
3. **Preservation of Historical Helpers**: Historical mutation helpers in `src/lib/staff-service.ts` (`reviewOnboardingRequest`, `updateStaffSystemRole`, `adjustStaffSchedule`, `updateStaffProfile`) are preserved to protect any potential external consumers or existing unit tests, but static audit confirms they have **zero reachable consumers** across all runtime Desktop modal components.
4. **Zero Hosted Repository Impact**: Hosted repository `E:\cradlehub` was audited strictly read-only. Zero new endpoints (`/api/desktop/v1/staff/*`) were created (reserved for Stage 12).
5. **Zero Database / Schema Mutation**: No migrations or schema changes were performed.

---

## 2. Canonical Modal Parity Matrix Reconciliation

The detailed matrix is recorded in [`docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md`](file:///E:/Cradle-Destop-Client/docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md).

### 2.1 Reconciled Summary Table

| Module           | Canonical Workflow                 | Desktop Status            | Reconciled API / Boundary                                            | Runtime State                                                        |
| :--------------- | :--------------------------------- | :------------------------ | :------------------------------------------------------------------- | :------------------------------------------------------------------- |
| **Today**        | Quick Booking                      | Complete                  | `POST /api/inhouse-booking` or RPC                                   | Authoritative hosted route; financial fields suppressed.             |
| **Today**        | Stage Transitions                  | Complete                  | `POST /api/desktop/v1/today/mutations`                               | Inline execution with loading & error boundaries.                    |
| **Bookings**     | New Booking Modal                  | Complete                  | `createBranchBooking` (`bookings-service.ts`)                        | Walk-in, phone, and future booking options.                          |
| **Bookings**     | Cancel Booking Modal               | Complete                  | `POST /api/desktop/v1/bookings/:bookingId/cancel`                    | Dropdown reason required, optional note.                             |
| **Bookings**     | Reschedule: Date, Time & Address   | Complete                  | `POST /api/desktop/v1/bookings/:bookingId/reschedule`                | Strict change detection, CRM reason required for time/address.       |
| **Bookings**     | Reschedule: Therapist Reassignment | Blocked (Stage 12)        | Missing Hosted Endpoint                                              | Fail-closed notice; existing assignment preserved.                   |
| **Attendance**   | Review Queue Resolution            | Complete                  | `POST /api/desktop/v1/attendance/mutations`                          | Operational review with audit comments.                              |
| **Attendance**   | Time Correction                    | Complete (Read-Only)      | `POST /api/desktop/v1/attendance/mutations`                          | Review queue resolves issues; clock adjustment handled server-side.  |
| **Attendance**   | Device Recovery & QR               | Intentionally Unavailable | N/A                                                                  | Desktop utilizes physical hardware badge scanning.                   |
| **Customers**    | Customer Directory & Inspection    | Complete (Read-Only)      | `GET /api/desktop/v1/customers`, `GET /api/desktop/v1/customers/:id` | Corrected to `GET` endpoints with query parameters.                  |
| **Customers**    | Waitlist Booking Prefill           | Complete                  | `NewBookingModal` with prefill                                       | Opens `NewBookingModal` with customer preselected.                   |
| **Schedule**     | Block Time Modal                   | Complete                  | `POST /api/desktop/v1/schedule/mutations`                            | Authoritative blocked time creation.                                 |
| **Schedule**     | Adjust Working Hours / Day Off     | Complete                  | `POST /api/desktop/v1/schedule/mutations`                            | Authoritative daily schedule override upsert.                        |
| **Schedule**     | Full Schedule Review               | Complete (Read-Only)      | `GET /api/desktop/v1/schedule/staff/:staffId`                        | Read-only weekly schedule inspector modal.                           |
| **Schedule**     | Check Availability                 | Complete (Read-Only)      | `GET /api/desktop/v1/schedule/staff-availability`                    | Staff availability lookup.                                           |
| **Home Service** | Dispatch Details Modal             | Complete                  | `POST /api/desktop/v1/home-service/mutations`                        | Dispatch details inspection & driver assignment.                     |
| **Home Service** | Reassign Therapist in Dispatch     | Complete                  | `POST /api/desktop/v1/home-service/mutations`                        | Backed by server-side assignment API.                                |
| **Staff**        | Service Capabilities Modal         | Complete                  | RPC `replace_staff_service_capabilities`                             | Proven server-authoritative `SECURITY DEFINER` RPC.                  |
| **Staff**        | Application Approval               | Blocked (Stage 12)        | Requires `POST /api/desktop/v1/staff/onboarding/review`              | **FAIL-CLOSED / NO WRITE**: Unsafe write disconnected, CTA disabled. |
| **Staff**        | Application Rejection              | Blocked (Stage 12)        | Requires `POST /api/desktop/v1/staff/onboarding/review`              | **FAIL-CLOSED / NO WRITE**: Unsafe write disconnected, CTA disabled. |
| **Staff**        | Assign System Role                 | Blocked (Stage 12)        | Requires `POST /api/desktop/v1/staff/:staffId/role`                  | **FAIL-CLOSED / NO WRITE**: Unsafe write disconnected, CTA disabled. |
| **Staff**        | Staff Schedule Adjustment          | Complete                  | `POST /api/desktop/v1/schedule/mutations`                            | **AUTHORITATIVE WRITE**: Uses existing hosted schedule mutation API. |
| **Staff**        | Offboarding Notice                 | Blocked (Stage 12)        | Requires `POST /api/desktop/v1/staff/:staffId/offboard`              | **READ-ONLY INFORMATIONAL / NO WRITE**: Non-mutating notice modal.   |
| **Staff**        | Add Staff Guidance Modal           | Complete (Read-Only)      | N/A                                                                  | Informational modal directing operators to web URL.                  |
| **Settings**     | System / Branch Settings           | Intentionally Unavailable | N/A                                                                  | Settings remains unavailable in Desktop CRM first release.           |

---

## 3. Substantive Contract Corrections & Implementations

### 3.1 Staff Application Approval (`StaffApplicationApprovalModal.tsx`)

- **Correction**: Disconnected `reviewOnboardingRequest(...)` from the modal.
- **Runtime Presentation**: Added notice:
  > _⚠️ UNAVAILABLE IN DESKTOP — AUTHORITATIVE ENDPOINT REQUIRED_
  > _Staff onboarding approval requires the authoritative Desktop staff-review service (Stage 12). This action is temporarily unavailable in the Desktop client to prevent unverified client database mutations._
- **Controls**: The Approve Application button (`approve-application-submit-btn`) is disabled with `opacity-50 cursor-not-allowed` and title explaining the boundary.
- **Keyboard Access**: Modal remains fully accessible and dismissible via Close button and Escape key.

### 3.2 Staff Application Rejection (`StaffInspectorCard.tsx`, `StaffView.tsx`)

- **Correction**: Disconnected `reviewOnboardingRequest({ action: 'reject' })` from the inspector rejection modal and container handler.
- **Runtime Presentation**: Rejection modal renders clear warning notice:
  > _⚠️ UNAVAILABLE IN DESKTOP — AUTHORITATIVE ENDPOINT REQUIRED_
  > _Staff application rejection requires the authoritative Desktop staff-review service (Stage 12)._
- **Controls**: The Confirm Rejection button (`confirm-reject-btn`) is disabled. Reason input is disabled.
- **Container Handler**: `handleRejectApplication` in `StaffView.tsx` sets an informative error banner and executes zero writes.

### 3.3 Staff Role Assignment (`StaffRoleModal.tsx`)

- **Correction**: Disconnected `updateStaffSystemRole(staff.id, selectedRole)`.
- **Runtime Presentation**: Modal renders truthful warning banner:
  > _⚠️ UNAVAILABLE IN DESKTOP — AUTHORITATIVE ENDPOINT REQUIRED_
  > _System role assignment requires an authoritative Desktop backend endpoint (Stage 12). This action is temporarily unavailable in the Desktop client to prevent unverified client-driven role elevation._
- **Controls**: Save Role button (`save-role-modal`) is disabled with explanatory title.
- **Authorization Defense**: Desktop does not rely on renderer `actorRole` props to authorize database mutations.

### 3.4 Staff Schedule Authoritative Routing (`StaffScheduleModal.tsx`)

- **Correction**: Disconnected `adjustStaffSchedule(...)` direct Supabase mutation.
- **Transport**: Wired to `scheduleService.mutateSchedule(...)` (`POST /api/desktop/v1/schedule/mutations`), matching the exact payload contracts verified from hosted `src/lib/schedule/schedule-mutations.ts`:
  1. `working_hours` -> `mutateSchedule('upsert_override', { branchId, staffId, overrideDate, isDayOff: false, shiftType: 'single', startTime, endTime, reason })`
  2. `day_off` -> `mutateSchedule('upsert_override', { branchId, staffId, overrideDate, isDayOff: true, reason })`
  3. `blocked_time` -> `mutateSchedule('create_blocked_time', { branchId, staffId, blockDate, startTime, endTime, reason: blockReason })`
  4. `remove_override` -> `mutateSchedule('delete_override', { branchId, staffId, overrideId })`
  5. `remove_block` -> `mutateSchedule('delete_blocked_time', { branchId, staffId, blockId })`
- **Error & Lifecycle Handling**: Modal stays open on hosted rejection, surfaces authoritative error message, prevents duplicate submission during inflight request, and fires `onScheduleAdjusted()` and `onClose()` on verified success.

### 3.5 Staff Offboarding Notice (`StaffOffboardingNoticeModal.tsx`)

- **Correction**: Confirmed source is already a 100% read-only informational modal. It never executed any client-side database mutation.
- **Matrix Reconciliation**: Corrected previous misstatement that claimed it executed direct updates to `staff.is_active`. Recorded as `READ-ONLY INFORMATIONAL / NO WRITE`.

### 3.6 Staff Service Capabilities RPC Authority Verification (`StaffCapabilityModal.tsx`)

- **Audit Findings**: Audited hosted migration `supabase/migrations/20260806132402_service_catalog_unification_repair.sql`.
- **Security Proof**:
  - Defined as `SECURITY DEFINER` with fixed `search_path = public, auth`.
  - Authenticates caller via `auth.uid()`, rejecting unauthenticated calls (`UNAUTHORIZED`).
  - Verifies caller branch matches target staff branch (`BRANCH_MISMATCH`).
  - Enforces caller role in `('owner', 'manager', 'assistant_manager', 'store_manager', 'crm')`.
  - Protects privileged target staff (prevents non-owners from editing owner/manager records).
  - Validates that every assigned service exists, is active, and is assigned to the target branch (`INVALID_SERVICES`).
  - Revokes `EXECUTE` from `PUBLIC` and `anon`; grants only to `authenticated`.
- **Classification**: Confirmed **`PARITY COMPLETE`**.

### 3.7 Staff Profile Inline Editing (`StaffInspectorCard.tsx`)

- **Correction**: Disconnected `updateStaffProfile` direct Supabase mutation. Save Profile button is disabled with fail-closed notice: _"Staff profile editing requires an authoritative Desktop backend endpoint (Stage 12)"_.

### 3.8 Isolation of Historical Helpers in `staff-service.ts`

- Direct database mutation helpers (`reviewOnboardingRequest`, `updateStaffSystemRole`, `adjustStaffSchedule`, `updateStaffProfile`) are preserved in `src/lib/staff-service.ts` per Section 15 to avoid breaking uncertain external dependencies or existing service tests.
- Static audit (`git grep -n`) proves that **zero active Desktop components call these functions**.

---

## 4. Verification Evidence & Quality Gates

### 4.1 Automated Test Execution

| Test Suite                                     | Tests Run | Result   | Duration   |
| :--------------------------------------------- | :-------- | :------- | :--------- |
| `tests/staff-components.test.tsx`              | 28        | **PASS** | 1.83s      |
| `tests/staff-service.test.ts`                  | 62        | **PASS** | 20ms       |
| `tests/schedule-components.test.tsx`           | 21        | **PASS** | 1.51s      |
| `tests/schedule-service.test.ts`               | 22        | **PASS** | 19ms       |
| `tests/bookings-components.test.tsx`           | 31        | **PASS** | 1.64s      |
| `tests/bookings-service.test.ts`               | 45        | **PASS** | 20ms       |
| **Full Repository Test Suite (23 test files)** | **488**   | **PASS** | **20.46s** |

- Baseline test count (Stage 10): 450 tests.
- Initial Stage 11 test count: 473 tests (+23 tests).
- Stage 11 first correction test count: 478 tests (+5 tests).
- Stage 11 final fail-closed staff modal correction test count: **488 tests (+10 new tests, +38 net)**.

### 4.2 Quality Checks

1. **Typecheck (`pnpm run typecheck`)**:
   - Execution: `tsc --noEmit` exited with code `0` (0 errors).
2. **Lint (`pnpm run lint`)**:
   - Execution: `eslint . --max-warnings 0` exited with code `0` (0 errors, 0 warnings).
3. **Format Check (`pnpm run format:check`)**:
   - Execution: `prettier --check .` exited with code `0` (all matched files use Prettier code style).
4. **Vite Production Build (`pnpm run build`)**:
   - Execution: `tsc --noEmit && vite build` exited with code `0`.
   - Emitted assets: `dist/index.html`, `dist/assets/index-Bf6tMPcM.css` (167.84 kB), `dist/assets/index-9DoJsLDx.js` (880.89 kB).
5. **Git Whitespace & Formatting (`git diff --check`)**:
   - Execution: exited with code `0` (no whitespace errors, no merge markers).

---

## 5. Evidence Classification & Risk Disclosure

### 5.1 Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**: Does not prove deployed production behavior.
- **LOCAL TEST EVIDENCE**: Verified via Vitest in JSDOM environment; does not prove native Windows runtime.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**: Remains **`PENDING OWNER INSPECTION`** (1024×768, 1366×768, 1440×900) until the owner executes the native Windows binary.

### 5.2 Factual Risk Statement

Stage 11 enforces truthful fail-closed behavior on blocked staff workflows and routes staff schedule adjustments through existing authenticated hosted schedule mutation endpoints. Native runtime and deployed-host behavior remain pending owner verification.

---

## 6. Changed Files Discipline (Final Correction Pass)

Changed files since starting correction HEAD `b459ffb116f5b04ed77fcb53cd5d91be008b1aac`:

1. `src/components/staff/modals/StaffApplicationApprovalModal.tsx`:
   - Disconnected `reviewOnboardingRequest` mutation.
   - Added fail-closed unavailable notice and disabled Approve Application CTA.
2. `src/components/staff/StaffInspectorCard.tsx`:
   - Disconnected application rejection mutation (`handleConfirmReject` closes modal, CTA disabled).
   - Disconnected inline profile editing mutation (Save Profile CTA disabled with fail-closed notice).
   - Added `data-testid` attributes for automated verification.
3. `src/components/staff/StaffView.tsx`:
   - Disconnected `reviewOnboardingRequest` from `handleRejectApplication` (surfaces error banner).
   - Passed `existingOverrides` to `StaffScheduleModal`.
4. `src/components/staff/modals/StaffRoleModal.tsx`:
   - Disconnected `updateStaffSystemRole` mutation.
   - Added fail-closed unavailable notice and disabled Save Role CTA.
5. `src/components/staff/modals/StaffScheduleModal.tsx`:
   - Disconnected `adjustStaffSchedule` direct mutation helper.
   - Wired to authoritative hosted `scheduleService.mutateSchedule(...)` (`POST /api/desktop/v1/schedule/mutations`).
   - Implemented exact payload mappings for `upsert_override`, `create_blocked_time`, `delete_override`, and `delete_blocked_time`.
6. `tests/staff-components.test.tsx`:
   - Added 10 automated regression tests covering fail-closed security boundaries and authoritative schedule mutation routing.
   - Total suite count increased from 18 to 28 passing tests.
7. `docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md`:
   - Updated Staff workflows (1 through 7) and Section 4 summary to reconcile truthful fail-closed and authoritative routing statuses.
8. `docs/30-delivery/STAGE_11_EVIDENCE.md`:
   - Fully updated evidence artifact with reconciled test counts, static audit proofs, RPC authority proofs, and factual risk disclosures.

---

## 7. Conclusion & Handoff

```text
STATUS: READY FOR INDEPENDENT RE-REVIEW
NOT ACCEPTED
NOT MERGED
STAGE 12 NOT AUTHORIZED
```
