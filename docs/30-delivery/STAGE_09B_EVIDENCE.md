# Stage 09B — Evidence

**Target:** CradleHub Windows desktop CRM client

**Stage / Task:** Stage 09B — Desktop Today UI (Final Correction Pass)

**Status:** `READY FOR OWNER FINAL VISUAL INSPECTION — NOT ACCEPTED / NOT MERGED`

**Branch:** `stage/09b-desktop-today-ui`

**BASE_SHA:** `c83f5303a83ea9670506a3040050f99404d8b785`

**Starting Correction HEAD:** `4a08847b571a09e3c604b9fc09c9f196d92f0ea5`

**HOSTED_AUTHORITY_SHA:** `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`

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

### 3. Viewport Geometry & Degradation

- **1440×900 and 1366×768**:
  - Contained desktop workspace fitting inside the visible window with `height: 100%`, `overflow: hidden`, and zero page-level vertical scrollbar.
  - Active Service Workflow card flexes to fill available vertical space and approximately aligns with the bottom of Today's Money card.
  - Table container has `overflow-y: hidden` with rows paginated.
- **1024×768 (Degraded Breakpoint)**:
  - Content degrades gracefully without clipping any critical controls.
  - `.today-workspace-content` enables vertical workspace scrolling (`overflow-y: auto; height: auto; min-height: 100%`).
  - `.today-page-grid` stacks into single column (`1fr; height: auto`).
  - Upper action cards reflow to a 2×2 grid (`repeat(2, 1fr)`).
  - Right rail reflows to 3 columns (`repeat(3, 1fr)`), keeping all cards reachable.
  - Horizontal table overflow is contained inside `.today-table-container` (`overflow-x: auto; min-height: 240px`).
  - All four upper action cards, workflow controls, queue rows, pagination buttons, and right-rail cards remain fully accessible.
- **NewBookingModal Viewport Fit**:
  - Modal overlay centers card with `max-width: 980px` and `max-height: 90vh`.
  - Header, mode tabs, and footer remain anchored and visible.
  - Form body grid scrolls internally (`overflow-y: auto`), preventing modal clipping or window spill at 1440×900, 1366×768, and 1024×768.

---

## Changed Implementation Files

### Final Closure Correction Pass Files (vs starting HEAD `4a08847b571a09e3c604b9fc09c9f196d92f0ea5`)

- `src/components/today/TodayView.tsx` (ResizeObserver callback ref for late-mount lifecycle + `showFinancialFields={false}` prop)
- `src/components/bookings/NewBookingModal.tsx` (`showFinancialFields` presentation prop, financial field suppression, `paymentReceived: false` payload enforcement)
- `src/components/today/TodayActivityCard.tsx` (truthful scan outcome with neutral "Recorded" fallback and neutral dot)
- `src/styles.css` (neutral scan pill styling + 1024px unclipped vertical scrolling degradation)
- `tests/today-components.test.tsx` (regression tests for ResizeObserver late-mount lifecycle, Today modal financial suppression, canonical modal backwards compatibility, and neutral scan fallback)
- `docs/30-delivery/STAGE_09B_EVIDENCE.md` (authoritative reconciled stage evidence)

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

Preserved observations reported by the owner from manual visual inspection of the running Windows desktop client:

1. **Approved Workspace Composition**:
   - Today header hierarchy (title, business date, branch context, static Front Desk View indicator, manual Refresh button).
   - Four upper action cards layout and presence.
   - Active Service Workflow visual language, table columns, and lifecycle tabs.
   - Activity right-rail card with Snapshot freshness badge.
   - Quick Actions right-rail card with canonical module navigation.
   - Today's Money card with truthful web-only placeholder notice.
   - Two-column operational workspace structure.

2. **Defects Addressed in Stage 09B Iterations**:
   - Elimination of dead vertical workspace below the workflow.
   - Complete removal of inline Booking Details under the queue table.
   - Workflow height flexing to fill vertical space and approximately aligning with Today's Money bottom.
   - Replacement of vertical queue scrolling with canonical pagination.
   - Integration of the four upper action cards with canonical `NewBookingModal`.
   - Complete suppression of financial/payment presentation in Today-opened booking modal.
   - Safe late-mounting ResizeObserver lifecycle to prevent silent failure after loading state.
   - Neutral "Recorded" fallback for attendance scans missing an authoritative outcome.
   - Graceful degradation at 1024×768 without clipped controls or hidden content.

_Owner final visual inspection of these closure corrections is pending._

---

## Exact Automated Checks & Results

1. **Focused Today Test Suites**:
   - `pnpm vitest run tests/today-service.test.ts tests/today-components.test.tsx`
   - Result: **2 files passed (2)**, **56 tests passed (56)**, 0 failed
     - `tests/today-service.test.ts`: 14 passed
     - `tests/today-components.test.tsx`: 42 passed (including late-mount ResizeObserver lifecycle, financial UI suppression, canonical modal backwards compatibility, and neutral attendance scan fallback)

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

---

## Security and Data Impact

- No database schema, migration, or production database accessed or modified.
- Hosted online repository (`E:\cradlehub`) inspected read-only and remains untouched at SHA `b2b9b6ec7579bbd9b519841cadf612ed133cbfcc`.
- Desktop renderer adheres strictly to the security boundary:
  - Supabase Bearer token used via Tauri HTTP client.
  - Zero privileged secrets, master keys, or service-role keys in renderer bundle.
  - Zero client-selected branch authority or query override (branch is strictly server-resolved).
- Strict payment dormancy on desktop:
  - Zero payment CTAs, payment method selectors, currency values, or collect-payment interactions in Today.
  - NewBookingModal opened from Today suppresses all financial fields and guarantees `paymentReceived: false` and `paymentMethod: undefined` on submission.
  - `ready_to_pay` stage in Today displays read-only status pill: _"Payment Pending — manage on web"_.
- Home Service fail-closed boundary:
  - Home Service bookings are excluded from all Today lifecycle mutations.
  - Home Service creation remains disabled and blocked on desktop.
- Server is the sole authority for all mutations; renderer only presents actions based on authoritative lifecycle states.

---

## Known Limitations

- OWNER-PROVIDED MANUAL RUNTIME EVIDENCE: Previous visual observations preserved; final owner visual re-inspection of these closure corrections is pending.
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
