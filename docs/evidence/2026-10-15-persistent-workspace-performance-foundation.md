# Persistent Workspace Performance Foundation — Fix Evidence

## Identification

- Target: CradleHub Desktop Client
- Stage: foundation correction before Stage 16
- Branch: fix/persistent-workspace-performance-foundation
- BASE_SHA: 413d20fd35d589622899c08243f7400ce13d6421
- HEAD_SHA: 348f94d7e85430b851b65e5446c458bee35323d5
- Evidence date: 2026-10-15
- Note: HEAD_SHA is the corrected validated code/test checkpoint. An evidence-only commit follows this checkpoint.

## Scope

This fix improves desktop workspace navigation and authoritative read lifecycle behavior without changing hosted CradleHub business authority.

Implemented:

- lazy mount on first module visit;
- retained visited module UI state;
- module scroll restoration;
- user + canonical role + branch workspace isolation;
- scope-safe single-flight authoritative reads;
- generation-safe read coordination;
- stale/obsolete response rejection;
- retained-data lifecycle for Today and Bookings;
- dirty-state invalidation after successful authoritative mutations;
- no invalidation after failed authoritative mutations;
- hidden dirty workspaces remain quiet until activation;
- background reconciliation while retaining previously validated data;
- bounded automatic reconciliation: a failed dirty generation is not retried repeatedly while the workspace remains active;
- activation-aware lifecycle subscriptions for retained workspaces;
- all visited operational modules remain mounted during ordinary navigation;
- non-lifecycle-aware retained modules remount/revalidate only when an invalidation generation is observed on reactivation;
- canonical booking-domain invalidation targets.

Not introduced:

- React Activity effect pausing;
- SQLite business snapshot wiring;
- offline mutation queues;
- polling;
- Realtime changes;
- database/schema/migration changes;
- hosted authorization changes;
- new desktop business authority.

## Changed implementation/test files

- `src/App.tsx`
- `src/components/CanonicalShell.tsx`
- `src/components/bookings/BookingsView.tsx`
- `src/components/today/TodayView.tsx`
- `src/components/workspace/RetainedModuleWorkspace.tsx`
- `src/components/workspace/WorkspaceLifecycle.tsx`
- `src/components/workspace/index.ts`
- `src/components/workspace/useWorkspaceLifecycle.ts`
- `src/components/workspace/workspace-lifecycle-context.ts`
- `src/lib/single-flight.ts`
- `src/lib/workspace-invalidation.ts`
- `src/lib/workspace-lifecycle.ts`
- `src/lib/workspace-read-coordinator.ts`
- `tests/bookings-components.test.tsx`
- `tests/bookings-workspace-lifecycle.test.tsx`
- `tests/components.test.tsx`
- `tests/single-flight.test.ts`
- `tests/today-components.test.tsx`
- `tests/today-workspace-lifecycle.test.tsx`
- `tests/workspace-cross-module-invalidation.test.tsx`
- `tests/workspace-lifecycle.test.ts`
- `tests/workspace-read-coordinator.test.ts`

- `docs/evidence/2026-10-15-persistent-workspace-performance-foundation.md` — evidence-only record added after the validated implementation commit.

## Verification

- `git diff --check` — PASS
- `pnpm typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm format:check` — PASS
- focused workspace/performance suite — PASS, 9 files / 121 tests
- `pnpm test` — PASS, 33 files / 729 tests
- `pnpm build` — PASS
- production build transformed 1973 modules
- production JS bundle: 899.40 kB minified / 217.80 kB gzip
- Vite emitted a non-blocking >500 kB chunk-size warning
- `cargo test --manifest-path .\src-tauri\Cargo.toml` — PASS, 7 tests / 0 failures

## Functional evidence

Automated coverage proves:

- visited Bookings retains state across navigation;
- Bookings scroll position restores on revisit;
- hidden dirty Bookings does not issue an authoritative request;
- dirty Bookings reconciles when activated;
- Today retains validated data while hidden;
- dirty Today reconciles when activated;
- identical scope + generation reads share one in-flight operation;
- a new invalidation generation does not reuse an older in-flight request;
- obsolete responses cannot overwrite newer validated state;
- successful Today operational writes invalidate affected workspaces;
- failed authoritative writes do not invalidate dependent workspaces;
- failed Today and Bookings background reconciliation does not create an automatic same-generation retry loop;
- leaving and reactivating a still-dirty Today or Bookings workspace permits one new retry;
- automated coverage proves the retained Customers instance survives ordinary navigation;
- automated coverage proves hidden Customers invalidation causes no authoritative read, and reactivation performs exactly one generation-bound authoritative revalidation.

## Runtime evidence

OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

On 2026-10-15 the owner performed the requested desktop runtime/navigation inspection and reported that all was well.

Earlier owner observation during this correction: navigation felt instant.

After the correction review, the owner specifically verified that persistence was restored across Attendance, Customers, Schedule, Home Service and Staff. Ordinary navigation no longer reloads those workspaces, while Today and Bookings continue to preserve their retained lifecycle behavior.

No real production business mutation was required for this manual verification.

## Security and data impact

- Hosted CradleHub remains canonical business authority.
- No RLS changes.
- No service-role credentials or privileged secrets introduced.
- No renderer authorization boundary changes.
- No schema or migration changes.
- No new Tauri capabilities.
- No business-domain data was added to SQLite.
- Retained workspace state is session-memory behavior.
- Read coordination is scoped by user, canonical role, branch, dataset, lifecycle generation and request parameters.

## Limitations / deferred work

- Today and Bookings are the first modules using the full dirty/background-reconciliation lifecycle.
- Attendance, Customers, Schedule, Home Service and Staff remain persistently mounted during ordinary navigation but have not yet been migrated to that full lifecycle; when invalidated, they use an activation-aware generation remount to force authoritative revalidation.
- React Activity is intentionally deferred until module read effects are safe to pause/recreate.
- SQLite remains a non-authoritative foundation only; business snapshot integration is deferred.
- The 899.40 kB production JS chunk warning remains for a future measured code-splitting optimization slice.
- No production behavior claim is derived solely from repository source.

## Rollback

Before merge, abandon this branch and return to:

`413d20fd35d589622899c08243f7400ce13d6421`

After merge, revert the implementation and evidence commits. No database, migration, hosted-service or persistent business-data rollback is required.
