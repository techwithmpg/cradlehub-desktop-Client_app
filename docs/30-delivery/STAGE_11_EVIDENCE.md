# Stage 11 — Evidence

**Target:** CradleHub Windows desktop CRM client
**Stage / Task:** Stage 11 — Canonical Modal Parity (Correction Pass)
**Status:** `READY FOR INDEPENDENT REVIEW — NOT ACCEPTED / NOT MERGED`
**Branch:** `stage/11-canonical-modal-parity`
**BASE_SHA:** `3596493f07aaa61dc9c5e0cc1d7c1b5f31a75ac7`
**Starting Correction HEAD:** `dd7d0183486c721cc099f166d69dff5febdb0f31`
**Authoritative Hosted Reference:** `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99` (`https://github.com/techwithmpg/Cradlehub.git` `origin/main`, READ-ONLY)

---

## 1. Correction Rationale & Scope Reconciliation

### 1.1 Why the Previous Hosted Reference Was Corrected

The initial Stage 11 audit recorded `1ea191f3ebedccda6a2249f3ee8f1b53d5e6791a` as canonical because the auxiliary local checkout happened to be sitting on that commit. That commit was NOT the authoritative head of `origin/main`. Independent review identified the discrepancy, and `git -C "E:\cradlehub" fetch --all --prune` verified that current hosted `origin/main` is `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`.

All modal contracts, schema validations, and operational requirements have been audited directly against `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`.

### 1.2 Core Scope Boundaries

- **Strictly Active Modules (8)**: Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings.
- **Zero Dormant Modules Reopened**: Owner, Payments, Finance, Reports, Reconciliation, and Payroll remain dormant and strictly excluded.
- **Zero Backend Mutation**: No schema migrations or modifications were made to the hosted repository (`E:\cradlehub` is read-only).
- **Zero Privileged Secrets**: All client API requests authenticate via user session Bearer tokens; no Supabase service role keys exist in the renderer.
- **Fail-Closed Security**: In the absence of network connectivity or valid authentication, modal actions fail closed with actionable error messaging.

---

## 2. Canonical Modal Parity Matrix Reconciliation

The detailed matrix is recorded in [`docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md`](file:///E:/Cradle-Destop-Client/docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md).

### 2.1 Reconciled Summary Table

| Module           | Canonical Workflow                 | Desktop Status               | Reconciled API / Boundary                                            | Notes                                                                                                                          |
| :--------------- | :--------------------------------- | :--------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Today**        | Quick Booking                      | Complete                     | `POST /api/inhouse-booking` or RPC                                   | Financial fields suppressed (`showFinancialFields={false}`).                                                                   |
| **Today**        | Stage Transitions                  | Complete                     | `POST /api/desktop/v1/today/mutations`                               | Inline action execution with loading and error boundaries.                                                                     |
| **Bookings**     | New Booking Modal                  | Complete                     | `createBranchBooking` (`bookings-service.ts`)                        | Implemented with walk-in, phone, and future booking options.                                                                   |
| **Bookings**     | Cancel Booking Modal               | Complete                     | `POST /api/desktop/v1/bookings/:bookingId/cancel`                    | Dropdown reason required, optional note, destructive red styling.                                                              |
| **Bookings**     | Reschedule: Date, Time & Address   | Complete (Desktop Supported) | `POST /api/desktop/v1/bookings/:bookingId/reschedule`                | Strict change detection, CRM reason required for time/address changes, canonical metadata prefill.                             |
| **Bookings**     | Reschedule: Therapist Reassignment | Blocked (Stage 12)           | Missing Hosted Endpoint                                              | Web uses Next.js server actions; no desktop API endpoint exists. Reassignment notice displayed; existing assignment preserved. |
| **Attendance**   | Review Queue Resolution            | Complete                     | `POST /api/desktop/v1/attendance/mutations`                          | Operational review with audit comments and status derivation.                                                                  |
| **Attendance**   | Time Correction                    | Complete (Read-Only)         | `POST /api/desktop/v1/attendance/mutations`                          | Desktop review queue resolves issues; clock adjustment handled server-side.                                                    |
| **Attendance**   | Device Recovery & QR               | Intentionally Unavailable    | N/A                                                                  | Desktop utilizes physical hardware badge scanning in-spa.                                                                      |
| **Customers**    | Customer Directory & Inspection    | Complete (Read-Only)         | `GET /api/desktop/v1/customers`, `GET /api/desktop/v1/customers/:id` | Corrected matrix to reflect `GET` (not `POST`, and not `/api/branch-customers`).                                               |
| **Customers**    | Waitlist Booking Prefill           | Complete                     | `NewBookingModal` with customer prefill                              | Opens `NewBookingModal` with customer preselected.                                                                             |
| **Schedule**     | Block Time Modal                   | Complete                     | `POST /api/desktop/v1/schedule/mutations`                            | Creates blocked schedule window for therapist.                                                                                 |
| **Schedule**     | Adjust Working Hours / Day Off     | Complete                     | `POST /api/desktop/v1/schedule/mutations`                            | Daily schedule override upsert.                                                                                                |
| **Schedule**     | Full Schedule Review               | Complete (Read-Only)         | `GET /api/desktop/v1/schedule/staff/:staffId`                        | Read-only weekly schedule inspector modal.                                                                                     |
| **Schedule**     | Check Availability                 | Complete (Read-Only)         | `GET /api/desktop/v1/schedule/staff-availability`                    | Staff availability lookup.                                                                                                     |
| **Home Service** | Dispatch Details Modal             | Complete                     | `POST /api/desktop/v1/home-service/mutations` (`assign_driver`)      | Canonical dispatch details inspection and driver assignment.                                                                   |
| **Home Service** | Reassign Therapist in Dispatch     | Complete                     | `POST /api/desktop/v1/home-service/mutations` (`assign_therapist`)   | Backed by server-side recommendation & assignment API.                                                                         |
| **Staff**        | Service Capabilities Modal         | Complete                     | RPC `replace_staff_service_capabilities`                             | Server-enforced RPC under authenticated session.                                                                               |
| **Staff**        | Application Approval / Rejection   | Blocked (Stage 12)           | Supabase RLS client update                                           | Requires dedicated server-authoritative Desktop endpoint (Stage 12).                                                           |
| **Staff**        | Assign System Role                 | Blocked (Stage 12)           | Supabase RLS client update                                           | Requires dedicated server-authoritative Desktop endpoint (Stage 12).                                                           |
| **Staff**        | Staff Shift / Schedule             | Blocked (Stage 12)           | Supabase RLS table upsert                                            | Requires routing through `/api/desktop/v1/schedule/mutations` in Stage 12.                                                     |
| **Staff**        | Offboarding Notice                 | Blocked (Stage 12)           | Supabase RLS client update                                           | Requires dedicated server-authoritative Desktop endpoint (Stage 12).                                                           |
| **Staff**        | Add Staff Guidance Modal           | Complete (Read-Only)         | N/A                                                                  | Informational modal directing operators to web onboarding URL.                                                                 |
| **Settings**     | System / Branch Settings           | Intentionally Unavailable    | N/A                                                                  | Settings remains truthfully unavailable in Desktop CRM first release.                                                          |

---

## 3. Substantive Contract Corrections & Implementations

### 3.1 Bookings Reschedule Parity Repair (`src/components/bookings/RescheduleBookingModal.tsx`)

Following direct audit of hosted `src/components/features/bookings/reschedule-booking-modal.tsx` and `src/app/api/desktop/v1/bookings/[bookingId]/reschedule/route.ts`:

1. **Change Detection Rule**:
   - A booking is considered changed ONLY when one of the authoritative mutable booking properties changes (`date`, `startTime`, or `homeServiceAddress`/`homeServiceAccessNote`).
   - Entering only a CRM note does NOT qualify as a booking reschedule; the Save button remains disabled.
2. **Conditional CRM Reason Requirement**:
   - Hosted behavior requires a CRM reason when changing operationally meaningful properties such as `time` or `address`.
   - If `time` or `address` changes, `note.trim()` is strictly required before submission.
   - For a `date`-only change, CRM note remains optional.
3. **Home Service Address Validation**:
   - If the booking is Home Service and the address is modified, the updated address must remain non-empty.
4. **Canonical Metadata Prefill**:
   - Prefills from canonical structure: `metadata.home_service_address.full_address` and `metadata.home_service_address.access_note`.
   - Bounded fallback to legacy `metadata.home_service` ensures backward compatibility with existing Desktop fixture data.
5. **Operational Summary Context**:
   - Displays Customer Name, Service & Duration, Current Schedule, Mode (In-spa or Home Service), Therapist, and Location / Current Address.
6. **Therapist Reassignment Boundary**:
   - Hosted web executes therapist reassignment via Next.js server actions (`getTherapistRecommendationsAction`, `assignBookingTherapistAction`).
   - Hosted `/api/desktop/v1/bookings/` routes currently expose no therapist assignment endpoint.
   - To respect the project security boundary (no client-side direct table mutations and no fabricated recommendations), therapist reassignment is classified as `BLOCKED — HOSTED ENDPOINT REQUIRED` (Stage 12).
   - The modal explicitly displays the current therapist with a clear notice: _"Therapist reassignment requires an authoritative Desktop backend action (Stage 12). Existing therapist assignment remains preserved."_

### 3.2 Customer Endpoint Reconciliation

Corrected documentation across the matrix and evidence to state exact authoritative endpoints:

- Directory List: `GET /api/desktop/v1/customers?branchId=:branchId&tab=:tab&q=:q&page=:page&pageSize=:pageSize`
- Detail Profile: `GET /api/desktop/v1/customers/:customerId?branchId=:branchId`
- Neither operation uses `POST`, nor does Desktop call `/api/branch-customers`.

### 3.3 Staff Security Boundary Classification

Evaluated Staff mutations against project security boundaries:

- `StaffCapabilityModal`: Uses database RPC `replace_staff_service_capabilities` under authenticated session (**PARITY COMPLETE**).
- Application Review, System Role, Staff Schedule, and Offboarding currently rely on client-driven Supabase table updates. While protected by RLS, these lack a dedicated server-authoritative Desktop REST endpoint (`/api/desktop/v1/staff/...`) and are truthfully classified as **`BLOCKED — HOSTED ENDPOINT REQUIRED`** for Stage 12.

---

## 4. Verification Evidence & Quality Gates

### 4.1 Automated Test Execution

| Test Suite                                     | Tests Run | Result   | Duration   |
| :--------------------------------------------- | :-------- | :------- | :--------- |
| `tests/bookings-service.test.ts`               | 45        | **PASS** | 20ms       |
| `tests/bookings-components.test.tsx`           | 31        | **PASS** | 2042ms     |
| **Full Repository Test Suite (23 test files)** | **478**   | **PASS** | **27.53s** |

- Baseline test count: 450 tests.
- Initial Stage 11 test count: 473 tests (+23 new tests).
- Stage 11 correction test count: **478 tests (+5 new tests, +28 net)**.

### 4.2 Quality Checks

1. **Typecheck (`pnpm run typecheck`)**:
   - Execution: `tsc --noEmit` exited with code `0` (0 errors).
2. **Lint (`pnpm run lint`)**:
   - Execution: `eslint . --max-warnings 0` exited with code `0` (0 errors, 0 warnings).
3. **Format Check (`pnpm run format:check`)**:
   - Execution: `prettier --check .` exited with code `0` (all files formatted).
4. **Vite Production Build (`pnpm run build`)**:
   - Execution: `tsc --noEmit && vite build` exited with code `0`.
   - Emitted assets: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`.
5. **Git Whitespace & Formatting (`git diff --check`)**:
   - Execution: exited with code `0` (no whitespace errors, no merge markers).

---

## 5. Evidence Classification & Risk Disclosure

### 5.1 Evidence Classification

- **REPOSITORY-RECORDED PRODUCTION EVIDENCE**: Does not prove deployed production behavior.
- **LOCAL TEST EVIDENCE**: Verified via Vitest in JSDOM environment; does not prove native Windows runtime.
- **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE**: Remains **`PENDING OWNER INSPECTION`** (1024×768, 1366×768, 1440×900) until the owner executes the native Windows binary.

### 5.2 Factual Risk Statement

Stage 11 adds authenticated Desktop calls to existing hosted booking mutation endpoints. Native runtime and deployed-host behavior remain pending owner verification.

---

## 6. Changed Files Discipline (Correction Pass)

Changed files since starting correction HEAD `dd7d0183486c721cc099f166d69dff5febdb0f31`:

1. `src/components/bookings/RescheduleBookingModal.tsx`:
   - Updated change-detection logic (note alone does not satisfy `hasChanges`).
   - Added conditional CRM reason requirement for time and address changes.
   - Enforced non-empty address when home service address is modified.
   - Updated prefill to canonical `home_service_address` metadata.
   - Added full operational summary items and clear therapist reassignment backend boundary notice.
2. `tests/bookings-components.test.tsx`:
   - Added 5 new automated tests covering disabled state on note-only change, CRM reason requirement on time change, non-empty home service address requirement, date-only change submission, and canonical metadata prefill.
3. `docs/20-design/STAGE_11_MODAL_PARITY_MATRIX.md`:
   - Updated canonical reference to hosted `origin/main` (`ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`).
   - Reconciled contracts, endpoints, and statuses across all 8 modules.
4. `docs/30-delivery/STAGE_11_EVIDENCE.md`:
   - Fully updated evidence artifact with reconciled test counts, factual risk wording, and evidence classifications.

---

## 7. Conclusion & Handoff

```text
STATUS: READY FOR INDEPENDENT RE-REVIEW
NOT ACCEPTED
NOT MERGED
STAGE 12 NOT AUTHORIZED
```
