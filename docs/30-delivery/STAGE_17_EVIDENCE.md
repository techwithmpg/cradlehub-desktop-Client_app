# Stage 17 — Evidence

**Target:** Booking Modal Layout and Workflow Corrections

**Stage / Task:** Stage 17 — Intake Booking Modal Parity Corrections

**Status:** `READY FOR INDEPENDENT REVIEW`

**Branch:** `stage/17-intake-booking-modal`

**BASE_SHA:** `1faa7493de961de3b314b8c1b28409ecdabf91ba`

**HEAD_SHA:** `4452983a457412b06598bd18783b6858a413e036`

**Hosted web reference SHA:** `2b3bab3c9e71274c25d747daf37d7928ee670e2c`

## Authorized scope

- Redesign and correct the existing `NewBookingModal` layout, density, and workflow to match the owner-approved reference (`media_1792744377414.jpg`) without rebuilding from scratch.
- Sizing & scroll behavior:
  - Desktop-centered dialog: max width ~1220px, max height ~86vh, proportional margins.
  - Two-column layout: ~70% left booking configuration / ~30% right booking summary with pinned Save/Cancel actions.
  - Controlled scroll in left column to minimize vertical scrolling for 1–2 guests; modal header, booking-mode selector, and summary remain accessible.
- Customer Information:
  - Single compact card with merged searchable customer name (`#customer-fullname`).
  - Search as operator types, select existing customer to populate phone/email, or continue typing new customer name.
  - Compact phone and optional email row, immediate notes field below.
  - Disabled Home Service location field with clear explanation of required authoritative geolocation contract.
- Self-contained Guest Cards:
  - Group service search, category pills, visual service carousel with ◀/▶ controls, duration pills, therapist override/auto, room override/auto, date, start time, and calculated expected finish time inside each guest card.
  - Support Add Guest, Copy to Guest, Remove Guest, and Clear All up to 4 guests.
  - Preserve single-guest manual therapist/room override while maintaining group booking synchronization (shared start date/time, automatic staff/room allocation on save) per hosted backend constraints.
- Non-financial intake:
  - Respect non-financial intake constraints (`showFinancialFields=false`) without fake payment collection or fabricated monetary totals.

## Changed files

- `src/types/bookings.ts`: Added optional `category`, `description`, `imageUrl` to `QuickBookingOptionService`.
- `src/lib/bookings-service.ts`: Updated `fetchBranchBookingOptionsUnmeasured` to include category, description, imageUrl from service records.
- `src/components/bookings/NewBookingModal.tsx`: Corrected modal geometry, merged customer name/search, integrated self-contained guest cards, category filter pills, service carousel, duration pills, auto/override therapist & room, date/start/finish time, and responsive summary panel.
- `src/styles.css`: Added compact dialog layout, responsive 70/30 split, service carousel styles, duration button groups, and media queries for smaller viewports.
- `tests/booking-preview.test.tsx`: Updated test input helper to target merged `#customer-fullname`.
- `tests/bookings-components.test.tsx`: Updated modal header expectation to match canonical branch format (`Cradle Wellness Living • Makati Branch`).
- `tests/bookings-service.test.ts`: Added unit test verifying group booking payload serialization with stable attendee identities.
- `tests/today-components.test.tsx`: Updated modal title assertion to `New Booking – Walk-in`.
- `tests/booking-modal-layout-corrections.test.tsx`: Added focused test suite covering merged customer input, self-contained guest controls, category carousel, duration pills, walk-in/phone scheduling, and group synchronization.
- `docs/50-state/CURRENT_STATE.md`: Updated active state for Stage 17.
- `docs/50-state/CURRENT_TASK.md`: Updated current task description for Stage 17.
- `docs/50-state/HANDOFF.md`: Updated handoff notes for Stage 17.
- `docs/50-state/LAST_VERIFIED_GATE.md`: Updated gate notes for Stage 17.
- `docs/30-delivery/STAGE_17_EVIDENCE.md`: This evidence record.

## Contract evidence

### Repository verified

- Desktop base commit: `1faa7493de961de3b314b8c1b28409ecdabf91ba`.
- Hosted reference commit: `2b3bab3c9e71274c25d747daf37d7928ee670e2c`.
- Reference design: Owner-provided screenshot `media_1792744377414.jpg`.

### Owner-provided manual runtime evidence

- Owner visually reviewed the desktop modal and requested the layout, sizing, and grouping corrections documented here.

### Unverified / open questions

- Owner visual inspection on actual Windows desktop native application (1440×900, 1366×768, 1024×768) is pending.

## Exact checks

| Command / Check     | Result | Notes                                                                          |
| ------------------- | ------ | ------------------------------------------------------------------------------ |
| `npm run typecheck` | PASSED | `tsc --noEmit` exited 0 with 0 errors                                          |
| `npm run lint`      | PASSED | `eslint . --max-warnings 0` exited 0 with 0 warnings                           |
| `npm run format`    | PASSED | Prettier formatted all source files                                            |
| `npm test`          | PASSED | 748 tests passed across 34 test files (including 6 new modal correction tests) |
| `npm run build`     | PASSED | `tsc --noEmit && vite build` bundled client in 1.95s                           |
| `git diff --check`  | PASSED | 0 whitespace or formatting anomalies                                           |

## Runtime evidence actually observed

- Automated tests in `tests/booking-modal-layout-corrections.test.tsx` verify:
  1. Merged `#customer-fullname` with live customer search dropdown, phone/email row, and notes field within one compact card.
  2. Self-contained guest cards grouping service search, categories, carousel, duration, staff, room, and date/time.
  3. Service category filtering and carousel card selection.
  4. Duration pill selection updating draft duration and finish time.
  5. Walk-in read-only branch business date/time vs. Phone/Future editable date/time.
  6. Multi-guest group synchronization where date/time changes synchronize across all guests and staff/room assignment defaults to automatic allocation on save.
- All existing booking suites (`tests/bookings-components.test.tsx`, `tests/booking-preview.test.tsx`, `tests/bookings-service.test.ts`, `tests/today-components.test.tsx`) pass cleanly without regression.

## Security / data impact

- production data changed? no
- schema/migration changed? no
- Auth/RLS/Storage policy changed? no
- secrets introduced/exposed? no
- privileged server behavior changed? no
- Tauri capabilities changed? no

## Limitations

- Multi-guest group bookings do not support independent per-guest manual therapist or room overrides; the hosted backend requires atomic automatic allocation on save.
- Home Service location entry requires verified geolocation and transportation fee calculation from an authoritative service, currently displayed in an honest disabled state.

## Rollback

- Revert the branch to base commit:
  `git checkout stage/17-intake-booking-modal && git reset --hard 1faa7493de961de3b314b8c1b28409ecdabf91ba`

## Gate

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`
