# Stage 09B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 09B — Desktop Today UI (Final Evidence Accuracy Correction)

**Status:** `READY FOR OWNER FINAL VISUAL INSPECTION — NOT ACCEPTED / NOT MERGED`

**Branch:** `stage/09b-desktop-today-ui`

**BASE_SHA:** `c83f5303a83ea9670506a3040050f99404d8b785`

**Starting Correction HEAD:** `f898dc58572c81b5656da2436fd30e9029e92456`

**HOSTED_AUTHORITY_SHA:** `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc` (inspected read-only in repository; not an assertion of deployed production runtime)

**Final Implementation SHA:** Recorded externally after push to prevent self-referential hash skew.

---

## Authorized Scope and Current Implementation Truth

Stage 09B implements the real Desktop Today operational workspace against the accepted hosted Stage 09A contract (`GET /api/desktop/v1/today` and `POST /api/desktop/v1/today/mutations`) using canonical desktop workspace primitives while preserving desktop boundaries:

### 1. Workspace Layout & Composition

- **Header Row**:
  - Title: "Today".
  - Business date and branch name from authoritative context (`data.context.businessDate`, `data.context.branchName`).
  - Helper text: "Prioritized front-desk work, without losing context."
  - Static "Front Desk View" selector (no fake role switcher).
  - Manual "Refresh" button (strict snapshot freshness model; no fake Live/Realtime indicators).
- **Four Upper Action Cards**:
  - `New Booking`: Opens canonical `NewBookingModal` in default mode (`walkin`).
  - `Walk-in`: Opens canonical `NewBookingModal` with `initialMode="walkin"`.
  - `Book for Later`: Opens canonical `NewBookingModal` with `initialMode="standard_future"`.
  - `Home Service`: Opens canonical `NewBookingModal` focused on `home_service`, displaying truthful disabled explanation (_"Home Service booking will be enabled after precise address/location support is connected."_), disabled submit button, and zero dispatch mutation.
- **Active Service Workflow (Primary Operational Card)**:
  - Header with title and active queue count badge.
  - Controls row: Search input and 5 lifecycle filter tabs (`All`, `Waiting`, `In Service`, `Payment Pending`, `Completed`).
  - Adaptive queue table with column headers: `TIME`, `CUSTOMER`, `SERVICE`, `THERAPIST / ROOM`, `STATUS`, `NEXT ACTION`.
  - Contextual server-authorized mutations (`confirm_booking`, `mark_arrived`, `start_service`, `complete_service`). Home Service bookings have zero Today mutations; `ready_to_pay` displays read-only status pill (_"Payment Pending — manage on web"_).
  - Overflow managed via canonical pagination (`ModulePagination`) rather than vertical scrolling.
  - Dynamic page size calculated via `calculateAdaptivePageSize`, measuring table container height via a callback ref to safely support late mounting after initial loading state.
  - No inline Booking Details card or persistent inspector cluttering the workflow.
- **Three-Card Right Rail**:
  - **Activity Card (`TodayActivityCard`)**:
    - Header with "Activity" title and "Snapshot" freshness badge (no fake Live indicator).
    - Tabs: `Recent Scans` and `Recent Activity`.
    - Recent Scans renders up to 4 attendance events with staff initials, time, event type, and source label.
    - Truthful scan outcome fallback: When `scan.outcome` is present, it displays the authoritative outcome. When `scan.outcome` is missing (null/empty), it renders neutral label `"Recorded"` with a neutral gray dot (`.today-status-dot-neutral`) and neutral styling (`.today-scan-status-pill.neutral`), never inventing a green "Success" claim.
    - Degraded notice displayed when `attendance.available === false` without faking empty success.
    - Recent Activity tab displays active operational notifications or truthful empty notice. Degraded notice displayed when `notifications.available === false`.
    - Footer action navigates to the canonical Attendance module.
  - **Quick Actions Card (`TodayQuickActionsCard`)**:
    - Four operational shortcut buttons navigating to canonical modules (`attendance`, `customers`, `schedule`, `staff`).
  - **Today's Money Card (`TodayMoneyCard`)**:
    - Truthful web-only placeholder notice: _"Revenue metrics are managed in the CradleHub Web App."_
    - Zero fake currency figures, zero simulated numbers.
    - Link navigating to the web application.

### 2. Today Financial UI Suppression

- Payments remain strictly dormant desktop scope.
- Canonical `NewBookingModal` supports a backwards-compatible `showFinancialFields?: boolean` presentation prop (defaulting to `true` to preserve standard Bookings module behavior).
- `TodayView` invokes `NewBookingModal` with `showFinancialFields={false}`.
- When `showFinancialFields` is `false`:
  - Service prices are omitted from service cards.
  - Section 5 header is simply "Notes" with no credit card / payment icon.
  - "Payment Received in Advance" checkbox and "Payment Method" select are not rendered.
  - Booking Summary omits individual service prices, total amount row, and payment status badges.
  - Zero currency symbols (`₱`) are displayed in the modal.
  - Booking creation payload strictly enforces `paymentReceived: false` and `paymentMethod: undefined`.

### 3. Viewport Geometry & Degradation — Repository Layout Intent

- **1440×900 and 1366×768 — Repository Layout Evidence**:
  - Repository CSS/layout rules are configured to:
    - Keep Today within the available workspace height (`height: 100%`, `min-height: 0`).
    - Use `overflow: hidden` at normal desktop widths.
    - Allow workflow card flex growth (`flex: 1`) to approximate the vertical extent of Today's Money card.
    - Paginate the queue rather than vertically scrolling it (`overflow-y: hidden` on table container).
  - Actual final Windows runtime fit at these dimensions:
    - **NOT YET VERIFIED AFTER FINAL CORRECTION — OWNER VISUAL INSPECTION REQUIRED.**
- **1024×768 — Repository Degraded Layout Evidence**:
  - Repository breakpoint rules configure:
    - Vertical workspace scrolling on `.today-workspace-content` (`overflow-y: auto; height: auto; min-height: 100%`).
    - Single-column Today page grid layout (`grid-template-columns: 1fr`).
    - 2×2 upper action cards grid (`repeat(2, 1fr)`).
    - Three-column right rail layout (`grid-template-columns: repeat(3, 1fr)`).
    - Horizontal table containment inside `.today-table-container` (`overflow-x: auto; min-height: 240px`).
  - Actual clipping/reachability in the final Windows runtime:
    - **NOT YET VERIFIED AFTER FINAL CORRECTION — OWNER VISUAL INSPECTION REQUIRED.**
- **NewBookingModal Viewport Fit — Repository Layout Evidence**:
  - Repository CSS configures the canonical `NewBookingModal` for internal scrolling and viewport containment:
    - Overlay centers card with `max-width: 980px` and `max-height: 90vh`.
    - Modal header, mode tabs, and footer are styled as non-growing header/footer flex rows.
    - Form body grid is configured with `overflow-y: auto` to scroll internally.
  - Final native behavior at 1440×900, 1366×768, and 1024×768:
    - **OWNER VISUAL VERIFICATION PENDING.**

---

## Changed Implementation Files

### Final Evidence Accuracy Correction (vs starting HEAD `f898dc58572c81b5656da2436fd30e9029e92456`)

- `docs/30-delivery/STAGE_09B_EVIDENCE.md` (corrected evidence classification, separating owner runtime evidence from repository/local test evidence)

### Cumulative Stage 09B Changed Files (vs `BASE_SHA` `c83f5303a83ea9670506a3040050f99404d8b785`)

- `docs/30-delivery/STAGE_09B_EVIDENCE.md` (new)
- `src/components/CanonicalShell.tsx` (modified)
- `src/components/bookings/NewBookingModal.tsx` (modified)
- `src/components/today/TodayActivityCard.tsx` (new)
- `src/components/today/TodayMoneyCard.tsx` (new)
- `src/components/today/TodayQuickActionsCard.tsx` (new)
- `src/components/today/TodayView.tsx` (new)
- `src/components/today/adaptive-page-size.ts` (new)
- `src/components/workspace/ModulePagination.tsx` (modified)
- `src/lib/today-service.ts` (new)
- `src/styles.css` (modified)
- `src/types/today.ts` (new)
- `tests/components.test.tsx` (modified)
- `tests/today-components.test.tsx` (new)
- `tests/today-service.test.ts` (new)

---

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

Genuine prior observations reported by the owner from earlier manual visual inspection of the running Windows desktop client:

**Approved Workspace Composition Preserved:**

- Today header hierarchy (title, business date, branch context, static Front Desk View indicator, manual Refresh button).
- Four upper action cards layout and presence.
- Active Service Workflow visual language, table columns, and lifecycle tabs.
- Activity right-rail card with Snapshot freshness badge.
- Quick Actions right-rail card with canonical module navigation.
- Today's Money card with truthful web-only placeholder notice.
- Overall two-column operational workspace structure.

_Final visual inspection of the subsequent closure corrections by the owner remains pending._

---

## REPOSITORY-VERIFIED FINAL CORRECTIONS

**Evidence Class:** `REPOSITORY FACT / LOCAL TEST EVIDENCE` (Not owner runtime evidence)

Verification from repository source inspection and automated local test execution confirms:

1. **Inline Booking Details Removed**:
   - Source inspection confirms removal of selection state, automatic first-row selection, row click handlers, and inline details card markup.
   - Verified by test: _Section 33 — Booking Details Removed_ (4/4 tests passing in `tests/today-components.test.tsx`).

2. **Canonical Pagination Implemented**:
   - Table uses canonical `ModulePagination` component with `showPageSizeSelector={false}`.
   - Dynamic page size is calculated by `calculateAdaptivePageSize`.
   - Verified by test: _Section 35 — Today Queue Pagination_ (4/4 tests passing in `tests/today-components.test.tsx`).

3. **ResizeObserver Callback-Ref Lifecycle**:
   - `TodayView` uses `tableContainerCallbackRef` to attach `ResizeObserver` when the table container mounts after initial loading state resolves, disconnecting on element change or component unmount.
   - Verified by test: _Section 36 — Stage 09B Closure Verifications_ (`ResizeObserver attaches when table container mounts after initial loading state resolves, and disconnects on unmount` passing in `tests/today-components.test.tsx`).

4. **Financial Presentation Suppressed for Today**:
   - `TodayView` passes `showFinancialFields={false}` to canonical `NewBookingModal`.
   - Modal suppresses service prices, "Payment Received in Advance" checkbox, payment method selector, total amount row, payment status tags, and currency values, rendering Section 5 as "Notes".
   - Submit payload forces `paymentReceived: false` and `paymentMethod: undefined`.
   - Canonical `NewBookingModal` retains `showFinancialFields = true` default for standard Bookings behavior.
   - Verified by tests: _Today-opened booking modal contains no payment/financial UI_, _Today booking submission sends paymentReceived=false and paymentMethod=undefined_, and _canonical NewBookingModal preserves financial UI by default when showFinancialFields is omitted_ (passing in `tests/today-components.test.tsx`).

5. **Truthful Attendance Scan Outcome Fallback**:
   - `TodayActivityCard` renders authoritative `scan.outcome` when present.
   - When `scan.outcome` is null or empty, it renders neutral label `"Recorded"` with neutral dot (`.today-status-dot-neutral`) and neutral styling (`.today-scan-status-pill.neutral`), never claiming "Success".
   - Verified by test: _renders neutral Recorded status fallback when scan.outcome is missing, and does NOT render Success_ (passing in `tests/today-components.test.tsx`).

6. **Degraded 1024×768 Responsive Rules**:
   - `src/styles.css` defines `@media (max-width: 1024px)` configuring vertical workspace scrolling (`overflow-y: auto`), single-column grid (`1fr`), 2×2 action cards, 3-column right rail, and horizontal table scroll containment (`overflow-x: auto`).

---

## Exact Automated Checks & Results (LOCAL TEST EVIDENCE)

**Evidence Class:** `LOCAL TEST EVIDENCE` (Synthetic JSDOM / local node runner; not native Windows desktop verification)

1. **Focused Today Test Suites**:
   - `pnpm vitest run tests/today-service.test.ts tests/today-components.test.tsx`
   - Result: **2 files passed (2)**, **56 tests passed (56)**, 0 failed
     - `tests/today-service.test.ts`: 14 passed
     - `tests/today-components.test.tsx`: 42 passed

2. **Shell Component Suite**:
   - `pnpm vitest run tests/components.test.tsx`
   - Result: **1 file passed (1)**, **20 tests passed (20)**, 0 failed

3. **Bookings Modal Backwards-Compatibility Suites**:
   - `pnpm vitest run tests/bookings-components.test.tsx tests/booking-preview.test.tsx`
   - Result: **2 files passed (2)**, **57 tests passed (57)**, 0 failed

4. **TypeScript Typecheck**:
   - `pnpm run typecheck` (`tsc --noEmit`)
   - Result: **0 errors** (exit code 0)

5. **ESLint**:
   - `pnpm run lint` (`eslint . --max-warnings 0`)
   - Result: **0 warnings, 0 errors** (exit code 0)

6. **Prettier Code Style**:
   - `pnpm run format:check` (`prettier --check .`)
   - Result: **All matched files use Prettier code style** (exit code 0)

7. **Production Build**:
   - `pnpm run build` (`tsc --noEmit && vite build`)
   - Result: **Built successfully in 6.08s** (exit code 0)

8. **Git Diff Whitespace & Syntax Check**:
   - `git diff --check`
   - Result: **0 defects / 0 whitespace errors** (exit code 0)

9. **Full Test Suite Execution**:
   - `pnpm test`
   - Result: **23 test files passed (23)**, **446 tests passed (446)**, 0 failed

_Note: Application tests were not re-executed during this documentation-only correction pass because no runtime or test files were changed._

---

## Security and Data Impact

- No database schema, migration, or production database accessed or modified.
- Hosted online repository (`E:\cradlehub`) inspected read-only in local workspace and remains untouched at SHA `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc` (repository source inspection only; not an assertion regarding deployed production state).
- Desktop renderer adheres strictly to security boundaries:
  - Supabase Bearer token used via Tauri HTTP client.
  - Zero privileged secrets, master keys, or service-role keys in renderer bundle.
  - Zero client-selected branch authority or query override (branch is strictly server-resolved).
- Strict payment dormancy on desktop:
  - Zero payment CTAs, payment method selectors, currency values, or collect-payment interactions in Today.
  - NewBookingModal opened from Today suppresses all financial fields and forces `paymentReceived: false` and `paymentMethod: undefined` on submission.
  - `ready_to_pay` stage in Today displays read-only status pill: _"Payment Pending — manage on web"_.
- Home Service fail-closed boundary:
  - Home Service bookings are excluded from all Today lifecycle mutations.
  - Home Service booking creation remains disabled and blocked on desktop.
- Server is the sole authority for all mutations; renderer only presents actions based on authoritative lifecycle states.

---

## Known Limitations

- OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: Previous visual observations preserved; final owner visual re-inspection of the closure corrections is pending.
- Payments remain dormant on desktop; payment collection must be conducted on the web application.
- Home Service mutations are not executable from Today.
- Freshness model is snapshot + manual refresh (no background polling, timers, or Realtime subscriptions).

---

## Rollback Instructions

- Before merge: abandon/revert branch `stage/09b-desktop-today-ui`.
- After merge: revert the Stage 09B implementation and evidence commits through normal Git history.
- No database rollback required (zero migrations or schema modifications introduced).

---

## Gate

`READY FOR OWNER FINAL VISUAL INSPECTION — NOT ACCEPTED — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
