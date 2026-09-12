# Stage 11 — Canonical Modal Parity Matrix

**Target:** CradleHub Windows Desktop CRM Client
**Stage:** Stage 11 — Canonical Modal Parity (Correction Pass)
**Branch:** `stage/11-canonical-modal-parity`
**BASE_SHA:** `3596493f07aaa61dc9c5e0cc1d7c1b5f31a75ac7`
**Starting Correction HEAD:** `dd7d0183486c721cc099f166d69dff5febdb0f31`
**Current Authoritative Hosted Reference:** `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99` (`https://github.com/techwithmpg/Cradlehub.git` `origin/main`, READ-ONLY)
**Status:** `AUDITED & ACTIVE CONTRACT — CORRECTION RECONCILED`

---

## 1. Correction Rationale & Scope of Engagement

### 1.1 Why the Previous Hosted Reference Was Corrected

The initial Stage 11 audit referenced commit `1ea191f3ebedccda6a2249f3ee8f1b53d5e6791a` solely because the local auxiliary working directory happened to be checked out at that state. That commit was NOT the authoritative `origin/main` of the hosted repository. Following independent review, `git -C "E:\cradlehub" fetch --all --prune` verified that current canonical hosted `origin/main` is `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`. All modal parity evaluations, API schemas, and validation contracts are now audited exclusively against `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`.

### 1.2 Core Rules of Engagement

1. **Functional Truth = Hosted Main**: Triggers, form fields, defaults, requirement flags, validation rules, role and branch boundaries, server APIs, side effects, and error handling mirror the canonical hosted online application at `ed8ae75d2d6fc9f3b8144dcabbe014f676e83a99`.
2. **Presentation = Desktop Canonical**: Modals utilize the Desktop design system (forest/gold/neutral palette, canonical typography, canonical buttons/inputs, `role="dialog"`, `aria-modal="true"`, internal scrolling at 1024×768, 1366×768, and 1440×900).
3. **Authorized Active Modules (8)**: Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings.
4. **Dormant Scope Strictly Excluded**: Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing.
5. **No Fake Writes & No Privileged Secrets**: Every active modal is backed by an authenticated hosted endpoint/RPC or truthfully documented as unavailable / read-only. Privileged service role keys are forbidden in the renderer.
6. **Separation of Concerns**: Unmerged branches, local working trees, or future backend features are not claimed as Stage 11 complete.

---

## 2. Active CRM Modal Parity Matrix (Overview)

| Module           | Workflow Name                                 | Hosted Source Reference                                               | Desktop Source File                               | Authoritative API / Boundary                                         | Parity Status                                                  | Summary / Scope Notes                                                                                                               |
| :--------------- | :-------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Today**        | Quick Booking                                 | `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx` | `NewBookingModal.tsx`                             | `POST /api/inhouse-booking` or RPC                                   | **PARITY COMPLETE**                                            | Preserved `showFinancialFields={false}` as established in Stage 09B.                                                                |
| **Today**        | Stage Transitions (Arrive / Start / Complete) | `cradle-flow-booking-dialog.tsx`, `cradle-flow-support-dialogs.tsx`   | `TodayQuickActionsCard.tsx`                       | `POST /api/desktop/v1/today/mutations`                               | **PARITY COMPLETE**                                            | Inline action execution with loading/error handling.                                                                                |
| **Bookings**     | Administrative New Booking                    | `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx` | `NewBookingModal.tsx`                             | `createBranchBooking` (`bookings-service.ts`)                        | **PARITY COMPLETE**                                            | Preserved full booking options in Bookings module.                                                                                  |
| **Bookings**     | Cancel Booking                                | `cancel-booking-dialog.tsx`                                           | `CancelBookingModal.tsx`                          | `POST /api/desktop/v1/bookings/:bookingId/cancel`                    | **PARITY COMPLETE**                                            | Canonical cancellation reason dropdown + optional note.                                                                             |
| **Bookings**     | Reschedule: Date, Time & Address              | `reschedule-booking-modal.tsx`                                        | `RescheduleBookingModal.tsx`                      | `POST /api/desktop/v1/bookings/:bookingId/reschedule`                | **PARITY COMPLETE FOR AUTHORITATIVE DESKTOP-SUPPORTED FIELDS** | Strict change detection, CRM reason required for time/address changes, canonical home service address prefill.                      |
| **Bookings**     | Reschedule: Therapist Reassignment            | `reschedule-booking-modal.tsx` (`assignBookingTherapistAction`)       | `RescheduleBookingModal.tsx`                      | Missing Desktop Endpoint                                             | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Web uses server action; no `/api/desktop/v1/bookings/:id/assign-therapist` endpoint exists. Kept read-only with explicit UI notice. |
| **Attendance**   | Review & Resolve Exception                    | `attendance-issue-modal-router.tsx`                                   | `AttendanceView.tsx`                              | `POST /api/desktop/v1/attendance/mutations`                          | **PARITY COMPLETE**                                            | Inline review & resolve mutations supported directly in inspector.                                                                  |
| **Attendance**   | Time Correction                               | `attendance-correction-dialog.tsx`                                    | N/A                                               | `POST /api/desktop/v1/attendance/mutations` (`apply_correction`)     | **PARITY COMPLETE — READ ONLY**                                | Desktop review queue supports resolve/review; manual clock correction managed server-side.                                          |
| **Attendance**   | Device Recovery & QR                          | `recovery-link-dialog.tsx`                                            | N/A                                               | `generate_device_recovery`                                           | **INTENTIONALLY UNAVAILABLE**                                  | Hardware badge scanning uses physical scanner; device link workflows are web-only.                                                  |
| **Customers**    | Customer Directory & Profile Inspection       | `customers-workspace.tsx`, `customer-preview-rail.tsx`                | `CustomersView.tsx`, `CustomerInspectorCard.tsx`  | `GET /api/desktop/v1/customers`, `GET /api/desktop/v1/customers/:id` | **PARITY COMPLETE — READ ONLY**                                | Hosted CRM Customers has zero edit/create modals; customer creation is inside Booking modal.                                        |
| **Customers**    | Waitlist Booking Prefill                      | `customer-preview-rail.tsx`                                           | `CustomerInspectorCard.tsx`                       | `NewBookingModal` with customer prefill                              | **PARITY COMPLETE**                                            | Opens `NewBookingModal` with customer preselected.                                                                                  |
| **Schedule**     | Block Time                                    | `adjust-schedule-dialog.tsx`                                          | `ScheduleActionModal.tsx` (`kind="block"`)        | `POST /api/desktop/v1/schedule/mutations` (`create_blocked_time`)    | **PARITY COMPLETE**                                            | Creates blocked schedule window for therapist.                                                                                      |
| **Schedule**     | Adjust Working Hours / Day Off                | `adjust-schedule-dialog.tsx`                                          | `ScheduleActionModal.tsx` (`kind="adjust"`)       | `POST /api/desktop/v1/schedule/mutations` (`upsert_override`)        | **PARITY COMPLETE**                                            | Upserts daily schedule override.                                                                                                    |
| **Schedule**     | Full Schedule Review                          | `staff-schedule-calendar-modal.tsx`                                   | `ScheduleActionModal.tsx` (`kind="full"`)         | `GET /api/desktop/v1/schedule/staff/:staffId`                        | **PARITY COMPLETE — READ ONLY**                                | Read-only weekly schedule inspector modal.                                                                                          |
| **Schedule**     | Check Availability                            | `check-availability-modal.tsx`                                        | `ScheduleActionModal.tsx` (`kind="availability"`) | `GET /api/desktop/v1/schedule/staff-availability`                    | **PARITY COMPLETE — READ ONLY**                                | Staff availability lookup.                                                                                                          |
| **Home Service** | Dispatch Details & Driver Assignment          | `home-service-dispatch-modal.tsx`                                     | `HomeServiceView.tsx`                             | `POST /api/desktop/v1/home-service/mutations` (`assign_driver`)      | **PARITY COMPLETE**                                            | Canonical `HomeServiceView` dispatch details modal.                                                                                 |
| **Home Service** | Reassign Therapist in Dispatch                | `home-service-dispatch-modal.tsx`                                     | `HomeServiceView.tsx`                             | `POST /api/desktop/v1/home-service/mutations` (`assign_therapist`)   | **PARITY COMPLETE**                                            | Backed by server-side recommendation & assignment API.                                                                              |
| **Staff**        | Service Capabilities                          | `crm-edit-staff-profile-modal.tsx`                                    | `StaffCapabilityModal.tsx`                        | RPC `replace_staff_service_capabilities`                             | **PARITY COMPLETE**                                            | Server-enforced RPC under authenticated session.                                                                                    |
| **Staff**        | Approve Onboarding Application                | `crm-staff-applications-tab.tsx`                                      | `StaffApplicationApprovalModal.tsx`               | Supabase RLS client update                                           | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Requires dedicated server-authoritative Desktop endpoint (Stage 12) to eliminate client DB mutation.                                |
| **Staff**        | Reject Onboarding Application                 | `crm-staff-applications-tab.tsx`                                      | `StaffInspectorCard.tsx`                          | Supabase RLS client update                                           | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Requires dedicated server-authoritative Desktop endpoint (Stage 12).                                                                |
| **Staff**        | Assign System Role                            | `crm-staff-branch-resolution-dialog.tsx`                              | `StaffRoleModal.tsx`                              | Supabase RLS client update                                           | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Requires dedicated server-authoritative Desktop endpoint (Stage 12) to prevent renderer-driven role updates.                        |
| **Staff**        | Staff Shift / Schedule                        | `staff-schedule-calendar-modal.tsx`                                   | `StaffScheduleModal.tsx`                          | Supabase RLS table upsert                                            | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Should route through `/api/desktop/v1/schedule/mutations` in Stage 12.                                                              |
| **Staff**        | Offboarding Notice                            | Administrative Offboarding                                            | `StaffOffboardingNoticeModal.tsx`                 | Supabase RLS client update                                           | **BLOCKED — HOSTED ENDPOINT REQUIRED**                         | Requires dedicated server-authoritative Desktop endpoint (Stage 12).                                                                |
| **Staff**        | Add Staff Guidance                            | Administrative Roster Guidance                                        | `StaffAddGuidanceModal.tsx`                       | N/A (Guidance dialog)                                                | **PARITY COMPLETE — READ ONLY**                                | Informational modal directing operators to web onboarding URL.                                                                      |
| **Settings**     | System / Branch Settings                      | `notification-settings-dialog.tsx`, etc.                              | `CanonicalShell.tsx`                              | N/A                                                                  | **INTENTIONALLY UNAVAILABLE**                                  | Settings remains truthfully unavailable in Desktop CRM first release.                                                               |

---

## 3. Contract-Depth Specification by Module

### 3.1 Bookings Module

#### Workflow 1: Cancel Booking Modal

- **Current Hosted Source**: `src/components/features/bookings/cancel-booking-dialog.tsx`
- **Desktop Source File**: `src/components/bookings/CancelBookingModal.tsx`
- **Trigger**: "Cancel" action on `BookingInspectorCard.tsx`
- **Fields**:
  - `cancellationReason` (Dropdown, required): `customer_requested`, `customer_unavailable`, `duplicate_booking`, `scheduling_conflict`, `staff_unavailable`, `payment_issue`, `invalid_booking`, `other`.
  - `note` (Textarea, optional, max 500 characters).
- **Defaults**: `cancellationReason` is unselected (`""`); `note` is empty (`""`).
- **Validation**:
  - `cancellationReason` must be selected from the valid enum.
  - Submit button disabled while submitting or if reason is unselected.
- **Role & Permission Rules**: Authenticated staff member in the same branch as the booking.
- **Branch Rules**: Enforced server-side via session context; must match booking `branch_id`.
- **Authoritative API**: `POST /api/desktop/v1/bookings/:bookingId/cancel`
- **Success Behavior**: Displays success message, closes dialog, refreshes Bookings roster and summary.
- **Error Behavior**: Keeps dialog open, displays server error message, allows operator retry.
- **Side Effects**: Sets booking status to `cancelled`, appends event to `booking_events`.
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Reschedule Booking Modal (Date, Time, Address)

- **Current Hosted Source**: `src/components/features/bookings/reschedule-booking-modal.tsx`
- **Desktop Source File**: `src/components/bookings/RescheduleBookingModal.tsx`
- **Trigger**: "Reschedule" action on `BookingInspectorCard.tsx`
- **Operational Summary Context Displayed**:
  - Customer Full Name
  - Service Name & Duration
  - Current Schedule (date, time, duration)
  - Mode (In-spa or Home Service)
  - Assigned Therapist (Name or "Unassigned")
  - Location (Room name for in-spa; current full address for home service)
- **Editable Fields**:
  - `date` (Date input, required, defaults to current booking date).
  - `startTime` (Time input, required, defaults to current booking start time `HH:MM`).
  - If Home Service:
    - `homeServiceAddress` (Textarea, required if address changed, max 1000 characters).
    - `homeServiceAccessNote` (Textarea, optional, max 500 characters).
  - `note` (CRM Reason, textarea, max 500 characters).
- **Defaults**:
  - Prefilled with booking's current date and time.
  - Home service fields prefilled from canonical metadata: `metadata.home_service_address.full_address` and `metadata.home_service_address.access_note` (with fallback to legacy `metadata.home_service` if present).
- **Validation & Change Detection Rules (Aligned with Hosted Main)**:
  - **Change Detection**: A booking is considered changed ONLY when an operational property changes (`date`, `startTime`, or `homeServiceAddress`/`homeServiceAccessNote`). A free-form CRM note alone is NOT an operational change and does NOT enable Save.
  - **CRM Reason Requirement**: Hosted behavior requires a CRM reason when changing operationally meaningful properties such as `time` or `address`. If `time` or `address` changes, `note.trim()` must be non-empty. For a `date`-only change, CRM note remains optional.
  - **Home Service Address Requirement**: If the booking is Home Service and the address is modified, the updated address must remain non-empty.
- **Role & Permission Rules**: Authenticated staff in the same branch.
- **Branch Rules**: Enforced server-side via session context; must match booking `branch_id`.
- **Authoritative API**: `POST /api/desktop/v1/bookings/:bookingId/reschedule`
- **Success Behavior**: Closes modal, refreshes Bookings roster and inspector.
- **Error Behavior**: Keeps dialog open, displays server error message, allows retry.
- **Side Effects**: Updates booking schedule and metadata; writes audit event.
- **Desktop Status**: **PARITY COMPLETE FOR AUTHORITATIVE DESKTOP-SUPPORTED FIELDS**

#### Workflow 3: Reschedule Booking Modal (Therapist Reassignment Sub-Workflow)

- **Current Hosted Source**: `src/components/features/bookings/reschedule-booking-modal.tsx` (uses `getTherapistRecommendationsAction` and `assignBookingTherapistAction`)
- **Desktop Source File**: `src/components/bookings/RescheduleBookingModal.tsx`
- **Analysis**:
  - Hosted web executes therapist reassignment via Next.js Server Actions with complex availability and conflict verification.
  - Hosted `/api/desktop/v1/bookings/` routes currently expose ONLY `cancel`, `reschedule` (date/time/address), and `[bookingId]` detail. No `/api/desktop/v1/bookings/:bookingId/assign-therapist` endpoint exists in hosted main.
  - Per Security Boundary Rules (Section 6), Desktop will NOT bypass authorization by directly modifying `staff_id` on the database table, nor will it trust renderer authority.
- **Desktop Adaptation**:
  - Displays current therapist name in operational summary.
  - Renders an explicit read-only therapist notice: _"Therapist reassignment requires an authoritative Desktop backend action (Stage 12). Existing therapist assignment remains preserved."_
  - Does NOT render fake recommendations or fabricated candidate staff.
- **Missing Hosted Endpoint Specification (Stage 12 Target)**:
  - **Endpoint**: `POST /api/desktop/v1/bookings/:bookingId/assign-therapist`
  - **Payload**: `{ staffId: string, overrideReason?: string }`
  - **Authorization**: Bearer JWT; validates staff belongs to branch, has capability for service, and is available for booking duration.
  - **Expected Result**: Authoritatively reassigns therapist, recalculates commission eligibility, logs booking event.
- **Desktop Status**: **BLOCKED — HOSTED ENDPOINT REQUIRED**

---

### 3.2 Today Module

#### Workflow 1: Quick Booking / In-Spa Walk-In

- **Hosted Reference**: `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx`
- **Desktop Source File**: `src/components/bookings/NewBookingModal.tsx`
- **Trigger**: Header "+ New Booking", Today quick action cards.
- **Fields**: Customer selection/create, Service selection, Therapist selection, Date/Time, Room selection. Financial inputs suppressed (`showFinancialFields={false}`).
- **Authoritative API**: `POST /api/inhouse-booking` or RPC under authenticated session.
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Stage Transitions (Arrive / Start / Complete)

- **Hosted Reference**: `cradle-flow-booking-dialog.tsx`, `cradle-flow-support-dialogs.tsx`
- **Desktop Source File**: `src/components/today/TodayQuickActionsCard.tsx`
- **Trigger**: Stage action buttons (Arrived, Start Session, Complete Session).
- **Authoritative API**: `POST /api/desktop/v1/today/mutations`
- **Desktop Status**: **PARITY COMPLETE**

---

### 3.3 Customers Module

#### Workflow 1: Directory List & Profile Inspection

- **Hosted Reference**: `src/components/features/customers/customers-workspace.tsx`, `customer-preview-rail.tsx`
- **Desktop Source File**: `src/components/customers/CustomersView.tsx`, `CustomerInspectorCard.tsx`
- **Trigger**: Module navigation, tab selection (`all`, `repeat`, `lapsed`, `followup`), search input, row click.
- **Authoritative API**:
  - Directory: `GET /api/desktop/v1/customers?branchId=:branchId&tab=:tab&q=:q&page=:page&pageSize=:pageSize`
  - Detail Profile: `GET /api/desktop/v1/customers/:customerId?branchId=:branchId`
- **Desktop Status**: **PARITY COMPLETE — READ ONLY** (Hosted CRM Customers has no edit/create modals; customer records are created during booking).

#### Workflow 2: Waitlist Follow-Up Booking Prefill

- **Hosted Reference**: `customer-preview-rail.tsx`
- **Desktop Source File**: `CustomerInspectorCard.tsx` ("Create Booking" action)
- **Trigger**: Inspector action on waitlist customer.
- **Behavior**: Opens `NewBookingModal` with customer preselected.
- **Desktop Status**: **PARITY COMPLETE**

---

### 3.4 Attendance Module

#### Workflow 1: Review & Resolve Exception

- **Hosted Reference**: `src/components/features/attendance/attendance-issue-modal-router.tsx`
- **Desktop Source File**: `src/components/attendance/AttendanceView.tsx`
- **Trigger**: Inspector action on attendance issue queue row.
- **Authoritative API**: `POST /api/desktop/v1/attendance/mutations` (`action: "resolve_issue"`)
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Time Correction

- **Hosted Reference**: `attendance-correction-dialog.tsx`
- **Desktop Source File**: Handled server-side via review issue resolution; manual clock dialog not exposed in Desktop.
- **Authoritative API**: `POST /api/desktop/v1/attendance/mutations` (`apply_correction`)
- **Desktop Status**: **PARITY COMPLETE — READ ONLY**

#### Workflow 3: Device Recovery & QR Link

- **Hosted Reference**: `recovery-link-dialog.tsx`
- **Desktop Source File**: N/A
- **Desktop Status**: **INTENTIONALLY UNAVAILABLE** (Desktop uses physical hardware badge scanner).

---

### 3.5 Schedule Module

#### Workflow 1: Block Time Modal

- **Hosted Reference**: `adjust-schedule-dialog.tsx`
- **Desktop Source File**: `src/components/schedule/ScheduleActionModal.tsx` (`kind="block"`)
- **Trigger**: Inspector / Board "Block Time"
- **Fields**: Staff ID, Date, Start Time, End Time, Reason.
- **Authoritative API**: `POST /api/desktop/v1/schedule/mutations` (`action: "create_blocked_time"`)
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Adjust Working Hours / Day Off Modal

- **Hosted Reference**: `adjust-schedule-dialog.tsx`
- **Desktop Source File**: `src/components/schedule/ScheduleActionModal.tsx` (`kind="adjust"`)
- **Trigger**: Inspector / Board "Adjust Schedule"
- **Fields**: Staff ID, Date, Is Day Off, Start Time, End Time, Reason.
- **Authoritative API**: `POST /api/desktop/v1/schedule/mutations` (`action: "upsert_override"`)
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 3: Full Schedule Review Modal

- **Hosted Reference**: `staff-schedule-calendar-modal.tsx`
- **Desktop Source File**: `ScheduleActionModal.tsx` (`kind="full"`)
- **Trigger**: Inspector "Full Schedule"
- **Authoritative API**: `GET /api/desktop/v1/schedule/staff/:staffId`
- **Desktop Status**: **PARITY COMPLETE — READ ONLY**

#### Workflow 4: Check Availability Modal

- **Hosted Reference**: `check-availability-modal.tsx`
- **Desktop Source File**: `ScheduleActionModal.tsx` (`kind="availability"`)
- **Trigger**: Inspector "Availability"
- **Authoritative API**: `GET /api/desktop/v1/schedule/staff-availability`
- **Desktop Status**: **PARITY COMPLETE — READ ONLY**

---

### 3.6 Home Service Module

#### Workflow 1: Dispatch Details & Driver Assignment

- **Hosted Reference**: `home-service-dispatch-modal.tsx`
- **Desktop Source File**: `src/components/home-service/HomeServiceView.tsx`
- **Trigger**: Dispatch table row click / Enter.
- **Authoritative API**: `POST /api/desktop/v1/home-service/mutations` (`action: "assign_driver"`)
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Reassign Therapist in Dispatch

- **Hosted Reference**: `home-service-dispatch-modal.tsx`
- **Desktop Source File**: `HomeServiceView.tsx` dispatch inspector.
- **Trigger**: Inspector therapist selection in dispatch view.
- **Authoritative API**: `POST /api/desktop/v1/home-service/mutations` (`action: "assign_therapist"`)
- **Desktop Status**: **PARITY COMPLETE**

---

### 3.7 Staff Module

#### Workflow 1: Service Capabilities Modal

- **Hosted Reference**: `crm-edit-staff-profile-modal.tsx`
- **Desktop Source File**: `src/components/staff/modals/StaffCapabilityModal.tsx`
- **Trigger**: Capabilities tab "Manage"
- **Fields**: Multi-select service checklist.
- **Authoritative API**: Supabase RPC `replace_staff_service_capabilities` under authenticated session.
- **Authority Verification**: Audited in hosted migration `supabase/migrations/20260806132402_service_catalog_unification_repair.sql`. Function is `SECURITY DEFINER`, verifies `auth.uid()`, enforces caller role (`owner`, `manager`, `assistant_manager`, `store_manager`, `crm`), validates branch match, prevents privilege escalation, checks branch service assignability, and revokes public/anon access.
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 2: Approve Onboarding Application

- **Hosted Reference**: `crm-staff-applications-tab.tsx`
- **Desktop Source File**: `StaffApplicationApprovalModal.tsx`
- **Current Desktop Runtime**: **FAIL-CLOSED / NO WRITE** (Unsafe direct Supabase writes disconnected; shows truthful unavailable notice; approve CTA disabled).
- **Security Assessment**: Direct client mutations carry security risks without dedicated server validation.
- **Required Hosted Endpoint (Stage 12)**: `POST /api/desktop/v1/staff/onboarding/review`
- **Desktop Status**: **BLOCKED — HOSTED ENDPOINT REQUIRED**

#### Workflow 3: Reject Onboarding Application

- **Hosted Reference**: `crm-staff-applications-tab.tsx`
- **Desktop Source File**: `StaffInspectorCard.tsx`
- **Current Desktop Runtime**: **FAIL-CLOSED / NO WRITE** (Unsafe direct Supabase writes disconnected; shows truthful unavailable notice; confirm rejection CTA disabled).
- **Security Assessment**: Direct client mutations carry security risks without dedicated server validation.
- **Required Hosted Endpoint (Stage 12)**: `POST /api/desktop/v1/staff/onboarding/review`
- **Desktop Status**: **BLOCKED — HOSTED ENDPOINT REQUIRED**

#### Workflow 4: Assign System Role

- **Hosted Reference**: `crm-staff-branch-resolution-dialog.tsx`
- **Desktop Source File**: `StaffRoleModal.tsx`
- **Current Desktop Runtime**: **FAIL-CLOSED / NO WRITE** (Unsafe direct Supabase writes disconnected; shows truthful unavailable notice; save role CTA disabled).
- **Security Assessment**: Bypasses server-authoritative role transition logic.
- **Required Hosted Endpoint (Stage 12)**: `POST /api/desktop/v1/staff/:staffId/role`
- **Desktop Status**: **BLOCKED — HOSTED ENDPOINT REQUIRED**

#### Workflow 5: Staff Schedule Adjustment

- **Hosted Reference**: `adjust-schedule-dialog.tsx`, `staff-schedule-calendar-modal.tsx`
- **Desktop Source File**: `StaffScheduleModal.tsx`
- **Current Desktop Runtime**: Authoritative route dispatch via `scheduleService.mutateSchedule(...)`.
- **Authoritative API**: `POST /api/desktop/v1/schedule/mutations`
  - Working Hours: `action: "upsert_override"` (`isDayOff: false`, `shiftType: "single"`, `startTime`, `endTime`, `reason`)
  - Day Off: `action: "upsert_override"` (`isDayOff: true`, `reason`)
  - Block Time: `action: "create_blocked_time"` (`startTime`, `endTime`, `reason: "break"|"leave"|"training"|"other"`)
  - Clear Override: `action: "delete_override"` (`overrideId`)
  - Remove Block: `action: "delete_blocked_time"` (`blockId`)
- **Desktop Status**: **PARITY COMPLETE**

#### Workflow 6: Offboarding Notice

- **Hosted Reference**: Administrative Offboarding flow
- **Desktop Source File**: `StaffOffboardingNoticeModal.tsx`
- **Current Desktop Runtime**: **READ-ONLY INFORMATIONAL / NO WRITE** (Modal presents informational notice regarding server offboarding contract requirements; does not execute any writes).
- **Required Hosted Endpoint (Stage 12)**: `POST /api/desktop/v1/staff/:staffId/offboard`
- **Desktop Status**: **BLOCKED — HOSTED ENDPOINT REQUIRED**

#### Workflow 7: Add Staff Guidance Modal

- **Hosted Reference**: Administrative Roster Guidance
- **Desktop Source File**: `StaffAddGuidanceModal.tsx`
- **Trigger**: Header "+ Add Staff"
- **Behavior**: Informational modal directing operators to canonical web onboarding URL. Zero write mutations.
- **Desktop Status**: **PARITY COMPLETE — READ ONLY**

---

### 3.8 Settings Module

#### Workflow 1: System / Branch Settings

- **Hosted Reference**: `notification-settings-dialog.tsx`, etc.
- **Desktop Source File**: Shell Settings module (`CanonicalShell.tsx`)
- **Desktop Status**: **INTENTIONALLY UNAVAILABLE** (Settings remains intentionally unavailable in Desktop CRM first release).

---

## 4. Summary of Parity Classifications

- **PARITY COMPLETE**:
  - Today: Quick Booking / In-Spa Walk-In
  - Today: Stage Transitions (Arrive / Start / Complete)
  - Bookings: Administrative New Booking
  - Bookings: Cancel Booking Modal
  - Bookings: Reschedule Booking (Date, Time, Address)
  - Attendance: Review & Resolve Exception
  - Customers: Waitlist Booking Prefill
  - Schedule: Block Time Modal
  - Schedule: Adjust Working Hours / Day Off Modal
  - Home Service: Dispatch Details & Driver Assignment
  - Home Service: Reassign Therapist in Dispatch
  - Staff: Service Capabilities Modal (`replace_staff_service_capabilities` RPC)
  - Staff: Schedule Adjustment (`POST /api/desktop/v1/schedule/mutations`)

- **PARITY COMPLETE — READ ONLY**:
  - Attendance: Time Correction
  - Customers: Directory List & Profile Inspection
  - Schedule: Full Schedule Review Modal
  - Schedule: Check Availability Modal
  - Staff: Add Staff Guidance Modal

- **INTENTIONALLY UNAVAILABLE**:
  - Attendance: Device Recovery & QR Link (Hardware scanner used on Desktop)
  - Settings: Desktop CRM Settings

- **BLOCKED — HOSTED ENDPOINT REQUIRED (STAGE 12)**:
  - Bookings: Reschedule Booking (Therapist Reassignment) — requires `POST /api/desktop/v1/bookings/:id/assign-therapist` (Runtime: FAIL-CLOSED / NO WRITE)
  - Staff: Approve Onboarding Application — requires `POST /api/desktop/v1/staff/onboarding/review` (Runtime: FAIL-CLOSED / NO WRITE)
  - Staff: Reject Onboarding Application — requires `POST /api/desktop/v1/staff/onboarding/review` (Runtime: FAIL-CLOSED / NO WRITE)
  - Staff: Assign System Role — requires `POST /api/desktop/v1/staff/:staffId/role` (Runtime: FAIL-CLOSED / NO WRITE)
  - Staff: Offboarding Notice — requires `POST /api/desktop/v1/staff/:staffId/offboard` (Runtime: READ-ONLY INFORMATIONAL / NO WRITE)

- **OUT OF SCOPE**:
  - Dormant financial modules (Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing).
