# Stage 11 — Canonical Modal Parity Matrix

**Target:** CradleHub Windows Desktop CRM Client  
**Stage:** Stage 11 — Canonical Modal Parity  
**Branch:** `stage/11-canonical-modal-parity`  
**BASE_SHA:** `3596493f07aaa61dc9c5e0cc1d7c1b5f31a75ac7`  
**Hosted Canonical Reference:** `1ea191f3ebedccda6a2249f3ee8f1b53d5e6791a` (`https://github.com/techwithmpg/Cradlehub.git`)  
**Status:** `AUDITED & ACTIVE CONTRACT`

---

## 1. Scope & Rules of Engagement

1. **Functional Truth = Hosted CradleHub**: Triggers, fields, defaults, requirements, validations, role rules, branch boundaries, server APIs, side effects, and error handling mirror the canonical hosted online application.
2. **Presentation = Desktop Canonical**: Modals utilize the Desktop design system (forest/gold/neutral palette, canonical typography, canonical buttons/inputs, `role="dialog"`, `aria-modal="true"`, internal scrolling at 1024×768 / 1366×768 / 1440×900).
3. **Authorized Active Modules (8)**: Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings.
4. **Dormant Scope Strictly Excluded**: Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing.
5. **No Fake Writes**: Every active modal is backed by an authenticated hosted endpoint/RPC or truthfully documented as unavailable / read-only.

---

## 2. Active CRM Modal Parity Matrix

| Module           | Workflow Name                                 | Hosted Source Reference                                               | Hosted Trigger                         | Desktop Trigger                                                  | Authoritative API / RPC                                            | Parity Status                                | Required Desktop Action                                                                              |
| :--------------- | :-------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Today**        | Quick Booking                                 | `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx` | Header / Quick Actions "+ New Booking" | Header "+ New Booking", Quick Actions card buttons               | `POST /api/inhouse-booking` or RPC                                 | **PARITY COMPLETE**                          | Preserved `showFinancialFields={false}` as established in Stage 09B.                                 |
| **Today**        | Stage Transitions (Arrive / Start / Complete) | `cradle-flow-booking-dialog.tsx`, `cradle-flow-support-dialogs.tsx`   | Stage button click                     | Right-rail action buttons in `TodayQuickActionsCard`             | `POST /api/desktop/v1/today/mutations`                             | **PARITY COMPLETE**                          | Inline action execution with loading/error handling.                                                 |
| **Bookings**     | Administrative New Booking                    | `administrative-booking-modal-provider.tsx`, `quick-booking-form.tsx` | Header "+ New Booking"                 | Header "+ New Booking"                                           | `createBranchBooking` (`bookings-service.ts`)                      | **PARITY COMPLETE**                          | Preserved full financial/payment options in Bookings module.                                         |
| **Bookings**     | Cancel Booking                                | `cancel-booking-dialog.tsx`                                           | Inspector "Cancel" quick action        | Inspector "Cancel" quick action (`BookingInspectorCard.tsx`)     | `POST /api/desktop/v1/bookings/:bookingId/cancel`                  | **PARITY INCOMPLETE** _(Disconnected Write)_ | Replace static action notice with canonical `CancelBookingModal` wired to hosted cancellation API.   |
| **Bookings**     | Reschedule Booking                            | `reschedule-booking-modal.tsx`                                        | Inspector "Reschedule" quick action    | Inspector "Reschedule" quick action (`BookingInspectorCard.tsx`) | `POST /api/desktop/v1/bookings/:bookingId/reschedule`              | **PARITY INCOMPLETE** _(Disconnected Write)_ | Replace static action notice with canonical `RescheduleBookingModal` wired to hosted reschedule API. |
| **Attendance**   | Review & Resolve Exception                    | `attendance-issue-modal-router.tsx`                                   | Review queue row inspect               | Review queue inspector buttons in `AttendanceView.tsx`           | `POST /api/desktop/v1/attendance/mutations`                        | **PARITY COMPLETE**                          | Inline review & resolve mutations supported directly in inspector.                                   |
| **Attendance**   | Time Correction                               | `attendance-correction-dialog.tsx`                                    | Review issue "Correct Record"          | Not currently exposed                                            | `POST /api/desktop/v1/attendance/mutations` (`apply_correction`)   | **PARITY COMPLETE — READ ONLY**              | Desktop review queue supports resolve/review; manual clock correction managed server-side.           |
| **Attendance**   | Device Recovery & QR                          | `recovery-link-dialog.tsx`                                            | Attendance settings / devices          | N/A (Desktop in-spa hardware badge scanning)                     | `generate_device_recovery`                                         | **INTENTIONALLY UNAVAILABLE**                | Hardware badge scanning uses physical scanner; device link workflows are web-only.                   |
| **Customers**    | Customer Directory Inspection                 | `customers-workspace.tsx`                                             | Row selection                          | Row selection                                                    | `GET /api/branch-customers`                                        | **PARITY COMPLETE — READ ONLY**              | Hosted CRM Customers has zero edit/create modals; customer creation is inside Booking modal.         |
| **Customers**    | Waitlist Booking Prefill                      | `customer-preview-rail.tsx`                                           | "Book Appointment"                     | Follow-up Inspector "Create Booking"                             | `NewBookingModal` with customer prefill                            | **PARITY COMPLETE**                          | Opens `NewBookingModal` with customer preselected.                                                   |
| **Schedule**     | Block Time                                    | `adjust-schedule-dialog.tsx`                                          | Schedule Board block button            | Inspector / Board "Block Time"                                   | `POST /api/desktop/v1/schedule/mutations` (`create_blocked_time`)  | **PARITY COMPLETE**                          | `ScheduleActionModal` (`kind="block"`).                                                              |
| **Schedule**     | Adjust Working Hours / Day Off                | `adjust-schedule-dialog.tsx`                                          | Schedule Board adjust button           | Inspector / Board "Adjust Schedule"                              | `POST /api/desktop/v1/schedule/mutations` (`upsert_override`)      | **PARITY COMPLETE**                          | `ScheduleActionModal` (`kind="adjust"`).                                                             |
| **Schedule**     | Full Schedule Review                          | `staff-schedule-calendar-modal.tsx`                                   | "View Full Schedule"                   | Inspector "Full Schedule"                                        | `fetchStaffFullSchedule`                                           | **PARITY COMPLETE — READ ONLY**              | `ScheduleActionModal` (`kind="full"`).                                                               |
| **Schedule**     | Check Availability                            | `check-availability-modal.tsx`                                        | "Check Availability"                   | Inspector "Availability"                                         | `GET /api/desktop/v1/schedule/staff-availability`                  | **PARITY COMPLETE — READ ONLY**              | `ScheduleActionModal` (`kind="availability"`).                                                       |
| **Home Service** | Dispatch Details & Driver Assignment          | `home-service-dispatch-modal.tsx`                                     | Dispatch table row click               | Dispatch table row Enter/click                                   | `POST /api/desktop/v1/home-service/mutations` (`assign_driver`)    | **PARITY COMPLETE**                          | Canonical `HomeServiceView` dispatch details modal.                                                  |
| **Home Service** | Reassign Therapist in Dispatch                | `home-service-dispatch-modal.tsx`                                     | Inspector "Change Therapist"           | Inspector therapist selection                                    | `POST /api/desktop/v1/home-service/mutations` (`assign_therapist`) | **PARITY COMPLETE**                          | Backed by server-side recommendation & assignment API.                                               |
| **Staff**        | Approve Onboarding Application                | `crm-staff-applications-tab.tsx`                                      | "Approve" button                       | Applications tab "Approve"                                       | Supabase RLS / `reviewOnboardingRequest`                           | **PARITY COMPLETE**                          | `StaffApplicationApprovalModal.tsx`.                                                                 |
| **Staff**        | Reject Onboarding Application                 | `crm-staff-applications-tab.tsx`                                      | "Reject" button                        | Applications tab "Reject"                                        | Supabase RLS / `reviewOnboardingRequest`                           | **PARITY COMPLETE**                          | Rejection dialog in `StaffInspectorCard.tsx`.                                                        |
| **Staff**        | Service Capabilities                          | `crm-edit-staff-profile-modal.tsx`                                    | Capabilities tab edit                  | Capabilities tab "Manage"                                        | RPC `replace_staff_service_capabilities`                           | **PARITY COMPLETE**                          | `StaffCapabilityModal.tsx`.                                                                          |
| **Staff**        | Assign System Role                            | `crm-staff-branch-resolution-dialog.tsx`                              | Roles tab "Assign"                     | Roles tab "Assign Role"                                          | Supabase RLS / `updateStaffSystemRole`                             | **PARITY COMPLETE**                          | `StaffRoleModal.tsx`.                                                                                |
| **Staff**        | Staff Shift / Schedule                        | `staff-schedule-calendar-modal.tsx`                                   | Schedule tab "Edit Shift"              | Schedule tab "Edit Shift"                                        | `adjustStaffSchedule` (`schedule_overrides`)                       | **PARITY COMPLETE**                          | `StaffScheduleModal.tsx` & `StaffFullScheduleModal.tsx`.                                             |
| **Staff**        | Offboarding Notice                            | Administrative Offboarding                                            | "Offboard Staff"                       | Roster tab "Offboard"                                            | Supabase RLS / status update                                       | **PARITY COMPLETE**                          | `StaffOffboardingNoticeModal.tsx`.                                                                   |
| **Staff**        | Add Staff Guidance                            | Administrative Roster Guidance                                        | "+ Add Staff"                          | Header "+ Add Staff"                                             | N/A (Guidance dialog)                                              | **PARITY COMPLETE**                          | `StaffAddGuidanceModal.tsx`.                                                                         |
| **Settings**     | System / Branch Settings                      | `notification-settings-dialog.tsx`, etc.                              | Settings navigation                    | Shell Settings module                                            | N/A                                                                | **INTENTIONALLY UNAVAILABLE**                | Settings remains truthfully unavailable in Desktop CRM first release.                                |

---

## 3. Deep-Dive Specification for Parity Implementations

### A. Bookings: Cancel Booking Modal (`CancelBookingModal.tsx`)

- **Hosted Reference**: `E:\cradlehub\src\components\features\bookings\cancel-booking-dialog.tsx`
- **Hosted Contract**: `E:\cradlehub\src\app\api\desktop\v1\bookings\[bookingId]\cancel\route.ts`
- **Authoritative Endpoint**: `POST /api/desktop/v1/bookings/:bookingId/cancel`
- **Trigger**: "Cancel" button on `BookingInspectorCard.tsx`
- **Read-Only Information Displayed**:
  - Customer Full Name
  - Service Name
  - Booking Date (formatted)
  - Start Time (formatted 12-hour)
- **Editable Fields**:
  1. `cancellationReason` (Required dropdown):
     - `customer_requested` ("Customer requested cancellation")
     - `customer_unavailable` ("Customer unavailable")
     - `duplicate_booking` ("Duplicate booking")
     - `scheduling_conflict` ("Scheduling conflict")
     - `staff_unavailable` ("Staff unavailable")
     - `payment_issue` ("Payment issue")
     - `invalid_booking` ("Invalid booking")
     - `other` ("Other")
  2. `note` (Optional `<textarea>`, max 500 characters, placeholder: "Add internal context")
- **Validation**:
  - Must select a valid cancellation reason before submission.
  - Submit button disabled while submitting or if reason is unselected.
- **Destructive Confirmation**:
  - Clear warning: _"This keeps the existing cancellation workflow and records the reason in the booking history."_
  - Action buttons: "Keep Booking" (secondary/cancel) and "Cancel Booking" (destructive primary).
- **Post-Success Behavior**:
  - Closes modal.
  - Refreshes Bookings workspace roster and summary.
  - Clears selected inspector state or updates status pill to `cancelled`.

---

### B. Bookings: Reschedule Booking Modal (`RescheduleBookingModal.tsx`)

- **Hosted Reference**: `E:\cradlehub\src\components\features\bookings\reschedule-booking-modal.tsx`
- **Hosted Contract**: `E:\cradlehub\src\app\api\desktop\v1\bookings\[bookingId]\reschedule\route.ts`
- **Authoritative Endpoint**: `POST /api/desktop/v1/bookings/:bookingId/reschedule`
- **Trigger**: "Reschedule" button on `BookingInspectorCard.tsx`
- **Read-Only Information Displayed**:
  - Customer Name
  - Service Name
  - Duration (minutes)
  - Delivery Type (In-spa or Home Service)
  - Current Assigned Room or Home Service Address
- **Editable Fields**:
  1. `date` (Required date input `YYYY-MM-DD`, defaults to current booking date)
  2. `startTime` (Required time input `HH:MM`, defaults to current booking start time)
  3. If Home Service:
     - `homeServiceAddress` (Optional textarea, max 1000 characters)
     - `homeServiceAccessNote` (Optional textarea, max 500 characters)
  4. `note` (Optional textarea, max 500 characters, placeholder: "Reason for rescheduling or adjusting time")
- **Validation**:
  - Valid calendar date and valid time format (`HH:MM`).
  - At least date, time, note, or address must be modified before submission is enabled.
- **Action Buttons**:
  - "Cancel" (secondary)
  - "Save Booking Changes" (primary)
- **Post-Success Behavior**:
  - Closes modal.
  - Refreshes Bookings workspace roster.
  - Refreshes inspector with updated booking time/date.
