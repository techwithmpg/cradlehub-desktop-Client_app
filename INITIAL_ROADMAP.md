# Initial Greenfield Roadmap

This is the recommended dependency order, not blanket authorization.

Each stage requires separate owner authorization.

| Stage | Scope                                                   | Why this order                                                          |
| ----- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| 00    | Repository Initialization & Hosted Contract Audit       | Establish trustworthy baseline; no inherited PASS                       |
| 01    | Real Auth + Authorized Branch Context + Canonical Shell | Every real module depends on identity, branch and one UI system         |
| 02    | Bookings                                                | Core operational record and central workflow dependency                 |
| 03    | Customers                                               | Booking/customer inspector and search dependency                        |
| 04    | Staff                                                   | Staff identity, roles, capability/service allocations                   |
| 05    | Schedule                                                | Depends on staff/services/branch context                                |
| 06    | Attendance                                              | Depends on staff + schedules + authoritative scan rules                 |
| 07    | Today                                                   | Aggregate/action workspace only after its source domains are real       |
| 08    | Home Service                                            | Depends heavily on bookings, staff/driver, schedule/dispatch contracts  |
| 09    | Settings                                                | Consolidate only settings that are actually authoritative and supported |
| R1    | First-release integrated release gate                   | Cross-module regression, native Windows QA, packaging/security          |

## Why Today is not first implementation

Today is visually the first navigation item but functionally aggregates other domains.

Building it before its source contracts are real encourages fake metrics, fake activity, and disconnected actions—the exact failure mode prohibited by the project rules.

A minimal shell may show the Today route as unavailable before Stage 07, but it must not fabricate operational data.

## Missing visual authority

No approved `crm-customers.png` was supplied in the 2026-09-05 reference package.

Do not invent a final Customers visual system in Stage 03 without either:

- an owner-approved Customers reference;
- or an explicit owner decision authorizing a derived layout from the shared CRM system.

The shared shell and primitives may still be reused.
