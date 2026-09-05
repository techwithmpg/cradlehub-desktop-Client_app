# Stage 02 — Customer Scope and Hosted Write Boundary Evidence

**NOT ACCEPTED / NOT MERGED / AWAITING OWNER AUTHORIZATION FOR HOSTED BOOKING WRITE BOUNDARY.**
Stage 02 is functionally incomplete. This correction awaits independent review. Stage 03 remains **NOT AUTHORIZED**.

## Repository identity and preflight

- Desktop: `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`, local `E:\Cradle-Destop-Client`.
- Same authorized branch: `stage/02-bookings`.
- Reviewed previous HEAD: `51e3c56ef6d2ee3b0b15e083611d28ab3c972a1e`.
- Accepted main BASE_SHA: `c9720805975004dbe11367f1ad9999270ad4ae7c`.
- Hosted reference: `https://github.com/techwithmpg/Cradlehub.git`, actual fetched main `feda4600f37e93084fdb672bd0c2612e9872bb43`.
- Initial desktop/hosted worktrees were clean. Desktop `git fetch origin --prune` confirmed HEAD equals origin/stage/02-bookings and the expected reviewed HEAD; origin/main equals BASE_SHA. Hosted main was fetched, remained at the SHA above, and source was inspected without edits.
- This evidence is carried by the correction commit. Its final SHA and matching pushed remote HEAD are reported with delivery, avoiding a self-referential commit hash here.

## OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

Retain only earlier owner observations: cramped workspace width, weak/invisible New Booking button, resource relation error, tab scrolling and a request for real New Booking behavior. The owner has not approved this correction HEAD. No agent fixture check below is owner runtime evidence.

## INDEPENDENT REPOSITORY REVIEW

The supplied review identifies the remaining global customer lookup at the reviewed HEAD. The previous correction already removed the global service fallback and disabled booking creation, but its customer search still queried arbitrary readable customer rows. This pass removes that lookup. Historical direct-write and layout review findings remain repository review, not owner acceptance.

## REPOSITORY-RECORDED PRODUCTION EVIDENCE

This heading describes the current pinned hosted source, not a claim that deployed production behavior was exercised.

### Hosted customer-search authority

- `src/app/api/customers/search/route.ts`: cookie-backed server Supabase client, `auth.getUser()`, staff lookup by `auth_user_id`, canonicalized `system_role`, and `canAccessCrmWorkspace`. Missing user/staff/eligible role returns 401. This route's staff lookup selects `system_role, branch_id`; it does not itself add an `is_active` filter.
- Queries shorter than two characters return an empty customer array. For owners the route passes `branchId = null`; otherwise it passes the staff branch to `searchCustomers`.
- `src/lib/queries/customers.ts`: `branchCustomerIds` selects non-null `bookings.customer_id` where `branch_id` equals the supplied branch, deduplicates IDs, and skips the customer query when that set is empty. The customer query is constrained by `.in('id', ids)` before it is awaited; it matches phone prefix or name substring, orders by last booking date descending and limits to 20.
- `customers` has no `branch_id`; membership therefore comes from bookings. A customer shared by two branches can belong to both sets; a customer with bookings only in another branch must not appear.
- Exact source caveats: the helper scopes only when the supplied branch is truthy, so owner/null-branch callers take its global path. The route does not explicitly reject a non-owner null branch. The booking-ID helper also does not check its query error; these source behaviors are not recommended patterns and are not copied into Desktop.
- Desktop Stage 01 currently requires an assigned branch even for broad roles. This pass introduces no global-owner lookup or cross-branch search. Any future desktop read should use the selected/authorized branch, intentionally narrower than hosted owner's global search.

### Desktop session and branch provenance

- `src/lib/supabase.ts` creates the public Supabase client with `persistSession: false`, token auto-refresh, and URL session detection disabled.
- `src/lib/auth-service.ts` performs password sign-in, then `auth.getUser()` validation and `resolveStaffAndBranchContext`. Context resolution checks the staff row for the user, active status, canonical role/CRM eligibility and a resolvable assigned branch.
- `src/types/auth.ts` defines that `AuthContext`. `BookingsView` passes `authContext.branchId` and `branchName` into the modal; the form does not author its own branch assignment.
- This renderer context is not sufficient database authorization. A manipulated branch value must still be constrained by live readable booking/customer rows. That enforcement could not be proven here.

## Live RLS inspection and read decision

**Decision: CUSTOMER LOOKUP DISABLED.**

The target was the configured live CradleHub project (`lsrbwqhvzjfpiabeolkv`, from the public project URL only; no key was printed). No unrelated project was queried. The Supabase MCP project inventory did not include this project. A targeted read-only metadata query was attempted:

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('bookings', 'customers')
  and cmd in ('SELECT', 'ALL')
order by tablename, policyname;
```

The connector returned `MCP error -32600: You do not have permission to perform this action`. No live policy rows, grants or customer records were returned. Consequently, current live RLS was **not verified**; this is lack of proof, not a claim that the policies are definitively unsafe. Repository migrations alone cannot establish live enforcement. The unrelated accessible projects were not used as substitutes, no privileged credentials were requested, and no policy was changed.

Per authorization Section 8, the global `.from('customers')` search is removed. `searchBranchCustomers` preserves its call shape but always rejects with `CustomerLookupUnavailableError`, code `CUSTOMER_LOOKUP_UNAVAILABLE`, without initializing a client or reading bookings/customers. `getCustomerLookupUnavailableReason` returns a fixed reason; it has no environment/user switch. Even if the disabled input is manipulated, the UI guard refuses a lookup, and a direct helper call still makes zero requests.

Exact UI text:

> Customer lookup is unavailable until a branch-scoped hosted read boundary is available.

The input is disabled and linked to that status text by `aria-describedby`. Manual customer fields remain editable preview values; neither customer nor booking is saved.

Future re-enablement requires separate proof/review of an authenticated branch-scoped read. If using the described database strategy, derive unique customer IDs from authorized readable branch bookings, return EMPTY only on a successful zero-ID read, constrain the customer query with those IDs before retrieval, and report errors from either read. Never fetch globally and filter afterwards. The current cookie-based hosted route is not assumed to be a bearer-token desktop endpoint.

## Customer lookup states and async safety

| State       | Current behavior                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| IDLE        | Reserved for an available lookup with fewer than two characters; the fixed unavailable decision takes precedence in normal runtime.           |
| SEARCHING   | Only actual pending lookup work may use this state; none starts in normal runtime.                                                            |
| RESULTS     | No real customer results are fetched/displayed by this preview. Isolated test doubles exercise retained rendering and stale-response guards.  |
| EMPTY       | Only a successful authorized zero-match/zero-ID read may produce this; UNAVAILABLE never returns an empty success array.                      |
| ERROR       | Generic query/network/permission failures remain distinct in the retained guarded lifecycle, exercised only with isolated mocks in this pass. |
| UNAVAILABLE | Normal-runtime state, with the exact text above. A typed boundary rejection also renders as unavailable rather than ERROR/EMPTY.              |

The existing request-version/debounce/unmount guards are preserved. Query changes, closing/reopening and branch changes invalidate old work. Keyed branch remount clears results, errors, selected customer, pending state and manual fields. Tests of available-style async states explicitly mock both the unavailable reason and lookup response; this does not enable a product query or prove live RLS.

Regression scope: no-global-query and no-cross-branch-exposure assertions now prove **zero requests/results** under the disabled fallback, including seeded branch-1/customer-a and branch-2/customer-c test data. Empty-database and failing-client cases remain UNAVAILABLE, not fake successful branch queries. Tests for successful booking-ID-to-customer query sequencing are not applicable because that unproven implementation was deliberately not added. Future re-enablement must supply those tests and database authority evidence.

## Booking creation remains blocked

`Booking Creation Unavailable` stays genuinely disabled. The UI does not invoke `createBranchBooking`; the helper keeps its existing fail-closed result. There is no renderer booking/customer insert path.

Hosted creation still runs from `src/components/features/bookings/quick-booking-form.tsx` through `createInhouseBookingMultiAction` in `src/lib/actions/inhouse-booking.ts`. It validates user/staff/canonical CRM role and branch, validates branch service eligibility/pricing/duration, resolves provider/resource availability, resolves customers, sequences services, handles home-service/payment/audit/notification/logging effects and revalidates operational surfaces. Its production authorization path uses authenticated `getUser`, active staff, `canonicalizeSystemRole`, `canAccessCrmWorkspace` and non-owner branch enforcement; it does not use the previously misreported permission call. Desktop does not adopt the hosted development bypass.

## Proposed future hosted boundary — DOCUMENT ONLY

Proposed endpoint: `POST /api/desktop/v1/bookings`, subject to the separately authorized hosted API convention. No route, Edge Function or server code was implemented here.

1. Desktop sends `Authorization: Bearer <current Supabase user access token>` over HTTPS plus JSON. No shared app secret or privileged token is sent from Tauri/renderer.
2. The hosted route verifies the user token server-side, resolves active staff, canonicalizes the stored role and verifies CRM access. It derives branch authority from server records and validates the requested branch against it. Renderer role/branch claims and development bypass flags cannot grant access.
3. Parse with the same strict `createInhouseBookingMultiSchema`; reuse the same server-only booking domain implementation as the Server Action. Extract the existing canonical orchestration into a server-only function receiving validated input and trusted server-derived actor context; let the cookie-authenticated Server Action and bearer-authenticated API each invoke it. Do not directly invoke a cookie-dependent action from the desktop or duplicate business logic in two boundaries.
4. The shared implementation retains canonical service pricing/duration, customer authorization/resolution, sequencing, exact availability, resource, home-service, payment/audit/notification/logging and operational revalidation behavior. Privileged database access stays entirely server-side. Server-calculated totals, duration and end time must not be trusted from renderer payloads.
5. Return the action's stable discriminated JSON result below. Do not leak credentials or raw internal database errors. HTTP mapping must be defined in the future hosted implementation; none is deployed by this document.

### Proposed request, derived from the actual schema

Source: `src/lib/validations/booking.ts`, `createInhouseBookingMultiSchema`, at the pinned hosted SHA. Reuse its inferred input type instead of maintaining a divergent desktop API schema. Field inventory below records actual schema optionality/defaults, not a claim that all optional fields are necessary for a minimal caller.

```ts
type ProposedBookingRequest = {
  branchId?: string;
  customerId?: string;
  serviceIds: string[];
  staffId?: string;
  resourceId?: string | null;
  date: string;
  startTime: string;
  type?: 'walkin' | 'home_service'; // schema default: walkin
  deliveryType?: 'in_spa' | 'home_service';
  crmBookingMode?: 'walkin' | 'phone' | 'home_service' | 'standard_future';
  markArrived?: boolean;
  travelBufferMins?: number;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  homeServiceAddress?: string;
  homeServiceAddressDetails?: string;
  homeServiceBarangay?: string;
  homeServiceCity?: string;
  homeServiceLandmark?: string;
  homeServiceParkingNotes?: string;
  homeServiceCustomerNotes?: string;
  homeServiceAccessNote?: string;
  homeServiceZone?: string;
  homeServiceLat?: number | null;
  homeServiceLng?: number | null;
  homeServicePlaceId?: string;
  homeServiceFormattedAddress?: string;
  homeServiceAddressComponents?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  homeServiceMapUrl?: string;
  paymentReceived?: boolean;
  paymentMethod?: 'cash' | 'gcash' | 'maya' | 'card' | 'other';
  paymentReference?: string;
  paymentNote?: string;
};
```

- IDs use the schema's GUID validator; service IDs require 1–5 entries. Missing branch defaults to the operator branch in the action; a future desktop caller should send its selected authorized branch explicitly, with server enforcement still required.
- Date format: `YYYY-MM-DD`; start time accepts `HH:MM` or `HH:MM:SS`. Full name: 2–100 characters. Phone: 7–20 characters, restricted to digits, `+`, `-`, whitespace and parentheses. Email may be a valid email or empty string. Notes max 500.
- Travel buffer: integer 0–240. `resourceId` may be omitted or null. Unknown payload keys are rejected by `.strict()`.
- Home address/formatted address max 500; address details, parking notes and access note max 300; barangay/city max 100; landmark max 200; customer notes max 500; zone max 50; place ID max 300; map URL must be a valid URL, max 1000. Address components max 24; each has long name max 200, short name max 100, types max 12 with each type max 80.
- Effective delivery is explicit `deliveryType`, otherwise derived from `type`. Home delivery requires nonblank place ID/formatted address and finite latitude/longitude in the schema refinement, with additional action validation still applying. The current desktop manual address preview does not satisfy an authoritative precise-location workflow by itself.
- `paymentReceived: true` requires a payment method. Payment reference max 100; payment note max 500. The action defaults absent paymentReceived to false. Neither payment amounts nor computed booking prices belong in this request.

### Result contract

Actual `CreateInhouseBookingResult` in `src/lib/actions/inhouse-booking.ts`:

```ts
type ProposedBookingResult =
  | { ok: true; bookingId: string; warning?: string }
  | { ok: false; code: string; message: string };
```

Success returns the first created booking ID from the sequential service rows; an availability warning may be included. Failure retains canonical codes/messages (for example validation, unauthorized/branch denial or slot unavailable). This proposal does not add transactional/idempotency guarantees beyond the current canonical action; those would need explicit design/review in the authorized hosted work.

## Preserved work and exact changed files

No redesign: wide workspace, three-card hierarchy, distributed tabs, high-contrast New Booking entry button, `branch_resources!bookings_resource_id_fkey`, branch-only catalog, delivery filtering, conservative explicit provider capability, option errors and canonical shell remain unchanged. The modal keeps the compact write notice and disabled creation CTA; only its lookup availability presentation/guard is added.

- `src/lib/bookings-service.ts`
- `src/components/bookings/NewBookingModal.tsx`
- `tests/booking-options.test.ts`
- `tests/booking-preview.test.tsx`
- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/evidence/stage-02-bookings.md`

## Exact local validation

CURRENT_CHECK_RESULTS

All results are local, not GitHub CI. No previous-stage result is inherited. Browser fixtures and mock lifecycle tests do not establish production RLS or owner acceptance.

## Security/data impact and gate

Production data, schema, migrations, RLS, Auth configuration, secrets and hosted source changes: **NO**. The only attempted live database operation was the denied read-only policy metadata query. Source scanning found no `.from('customers')` search, booking/customer inserts or privileged-client/key patterns in the Bookings renderer path. No dependency changes or bypass options were added.

Full diff reviewed against `51e3c56ef6d2ee3b0b15e083611d28ab3c972a1e`, with scope limited to the seven files above. Commit/push is on `stage/02-bookings` only, without force. Stop for independent review; no merge or Stage 03.

Stage 02 cannot be accepted until the owner separately authorizes and the hosted repository implements a safe desktop-callable authoritative booking creation boundary.
