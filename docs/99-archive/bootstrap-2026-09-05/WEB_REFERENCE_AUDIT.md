# Hosted CradleHub Reference Audit — 2026-09-05

Reference repository:

`https://github.com/techwithmpg/Cradlehub`

This audit is repository inspection only. It is not deployed-production verification.

## Resolved reference point

At the time of this bootstrap audit, `main` resolved to:

`feda4600f37e93084fdb672bd0c2612e9872bb43`

Future agents must fetch and resolve `origin/main` again. Do not freeze implementation against this SHA.

## Confirmed repository shape

The hosted system is a Next.js application with:

- Next.js 16.2.4
- React 19.2.4
- TypeScript
- pnpm 10.33.2
- Node engine `>=24 <25`
- Supabase JS / SSR libraries
- Base UI
- shadcn
- CVA
- Lucide
- Motion
- Tailwind CSS 4
- Vitest

Relevant source roots include:

- `src/app`
- `src/components`
- `src/features`
- `src/lib`
- `src/types`
- `supabase`

## CRM surface

Repository routes under:

`src/app/(dashboard)/crm/`

include current CRM areas such as:

- Attendance
- Bookings
- Customers
- Dispatch
- availability/control/live operations and other hosted surfaces

The hosted system also contains Owner, Manager, Staff Portal, Driver, and Marketing workspaces.

Desktop first-release scope is intentionally narrower.

## Domain ownership

`src/lib/` contains explicit domain areas including:

- attendance
- auth
- bookings
- crm
- home-service
- and other shared/domain infrastructure

This means desktop work should inspect domain-specific source/actions rather than treating a screenshot or route component as the business contract.

## Backend

The hosted repository uses Supabase and contains:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/operations/`
- `supabase/tests/`

The hosted governance describes Supabase PostgreSQL/Auth/RLS/RPC/Realtime/Storage as the repository-backed online architecture.

It also explicitly warns that historical/local-only migration versions must not be blindly replayed or marked applied.

Stage 00 therefore must not perform schema reconciliation or production mutation.

## Important hosted-governance rule

The hosted repo's own `AGENTS.md` says `main` is production-connected and that merges/pushes may deploy.

Therefore the greenfield desktop agent must treat the web clone as **read-only reference** unless the owner separately authorizes hosted-system changes.

## Desktop consequence

The desktop should not duplicate the Next.js server architecture in the renderer.

Instead:

- reuse authoritative online contracts;
- keep privileged behavior server-side;
- preserve RLS/server authorization;
- introduce native persistence only through separately approved and measured stages;
- audit each module's real read/write path before implementing it.

## Open questions intentionally left for Stage 00

This bootstrap does not yet claim:

- the exact authoritative desktop auth transport;
- a desktop-specific server API contract;
- exact offline policy per mutation;
- exact Realtime invalidation strategy;
- exact local cache schema;
- exact token persistence method;
- exact background sync design.

Those must be derived from current hosted contracts and explicit ADRs rather than inherited from the old desktop implementation.
