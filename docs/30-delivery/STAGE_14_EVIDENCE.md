# Stage 14 — Performance Baseline & Local Data Contract

| Field                | Value                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Target               | CradleHub Desktop                                                                                                  |
| Branch               | `stage/14-performance-local-data-contract`                                                                         |
| BASE_SHA             | `ce517b8ac8e1c12b2184082f95d3c7cadca30fdf`                                                                         |
| HOSTED_REFERENCE_SHA | `03242a0bfbcfe6c4b1b03ba624510004cae7cc6a`                                                                         |
| HEAD_SHA             | Report the final Stage 14 evidence commit SHA after push; a commit cannot self-encode its own SHA.                 |
| Evidence class       | **REPOSITORY-RECORDED PRODUCTION EVIDENCE** for the inspected source and repository checks, not deployed behavior. |

## Scope and source findings

The two active historical Stage 00 documents were moved intact to `docs/99-archive/stage-00/`; the one live Markdown link to the old inventory path was repaired. Current truth is in [`CURRENT_DESKTOP_DATA_BOUNDARY.md`](../10-architecture/CURRENT_DESKTOP_DATA_BOUNDARY.md). The future, non-authoritative contract is in [`LOCAL_DATA_CACHE_CONTRACT.md`](../10-architecture/LOCAL_DATA_CACHE_CONTRACT.md). The scenario matrix, source-derived counts and owner measurement procedure are in [`STAGE_14_PERFORMANCE_BASELINE.md`](STAGE_14_PERFORMANCE_BASELINE.md).

Current reads are a mix of hosted Desktop APIs and authenticated direct Supabase/PostgREST queries. Hosted CradleHub remains the sole canonical online business authority. No local persistent business cache exists. Deployed RLS or native runtime behavior was not inferred from repository text. The hosted `main` reference exactly matched the expected SHA at preflight and was inspected read-only.

| Module        | Static initial topology                                                                                                       | Notable follow-on calls                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Today         | 1 hosted aggregate `GET /api/desktop/v1/today`                                                                                | Manual refresh, successful mutation and remount reread                                           |
| Bookings      | 1 direct branch `bookings` read, nested relations, limit 500                                                                  | New Booking options 4 parallel direct reads; customer search adds hosted Customers API calls     |
| Customers     | 1 hosted list; populated first selection adds 1 hosted detail = typically 2                                                   | Search, tab, page and page-size changes reread; selection can reread detail                      |
| Attendance    | 1 hosted workspace                                                                                                            | History week adds 1 hosted history read; existing 5s session/60s read timeouts unchanged         |
| Schedule day  | 1 hosted daily + 1 hosted availability = 2                                                                                    | Date/mode/refresh repeat                                                                         |
| Schedule week | 7 hosted daily + 1 availability = 8                                                                                           | Another week repeats; aggregate `schedule.week` timing overlaps its seven `schedule.day` timings |
| Home Service  | Queue and drivers = 2 hosted; selected detail + recommendations can raise populated initial path to ~4                        | Empty queue omits selection; dispatch/context reload and post-mutation refresh can add calls     |
| Staff         | 4 logical groups: roster 1, assignable services 1–2, applications 1, schedule week 2 = 5 minimum / 6 conditional direct reads | Rules query only when home-only candidate exists; manual refresh repeats                         |
| Settings      | Unavailable; no business-data read                                                                                            | None                                                                                             |

`CanonicalShell` unmounts the previous active module; Today → Bookings → Today can repeat the Today initial read. `fetchBranchScheduleWeek` passes an unused branch argument and uses date-only filters for `schedule_overrides` and `blocked_times`. Hosted source contains front-desk RLS policies joining those rows through staff/branch, but deployment and complete branch isolation of the desktop result were not verified. The service also lacks error/ownership validation before mapping/coercing rows. **Staff schedule-week: CACHE BLOCKED — BRANCH ISOLATION REQUIRES RECONCILIATION.** No query, authorization or UI behavior was changed to mask this gap.

## Instrumentation and privacy

`src/lib/read-performance.ts` is one bounded (200 metrics) in-memory, development/test-only recorder using monotonic `performance.now()` when available. It has a fixed operation-name union, durations, success/error outcome and timestamp. It records resolved `{ok:false}` service results as errors and rejected reads as errors, while preserving the exact result or thrown error. `getReadPerformanceSnapshot()` returns detached objects; `clearReadPerformanceMetrics()` resets it. Its only diagnostic output is `[CradlePerf] <fixed operation> <duration>ms <outcome>`. No arguments, payload, ID, query URL, token, name or address enter a metric or log. The production bundle has no `CradlePerf` literal after the successful build; production `import.meta.env.DEV` selects a no-op wrapper. There is no automatic network telemetry.

Twenty named **read** boundaries in the seven existing service files are wrapped. Function parameters, transport, query, validation, timeout, return/error behavior and UI consumers were otherwise left intact. Mutation functions were not wrapped. Existing service regressions and the source diff confirm no mutation call is routed through the recorder.

The Stage 14 source/diff scan found no new `sqlite`, `tauri-plugin-sql`, `rusqlite`, `sqlx`, `indexedDB`, `localStorage` business-data cache, filesystem persistence, background sync, `setInterval` polling, Realtime channel, service worker or offline mutation queue. The security-string sweep of the new helper/test/docs found only contract text saying credentials must **not** be persisted; no new privileged secret, token persistence, business-data persistence, polling, Realtime, service worker, native capability or runtime dependency was introduced. Existing service files still legitimately use bearer tokens for established authenticated reads; Stage 14 does not log them.

## Runtime evidence and owner gate

**RUNTIME PERFORMANCE BASELINE: NOT OBSERVED — owner authenticated runtime measurement required.** No real native authenticated timing samples were captured by the implementation agent. The existing port `127.0.0.1:1420` listener was PID `8876` (`node.exe`), started 2026-09-27 16:33:40, before this Stage 14 branch. Its command line/branch could not be established; it was neither killed nor used as Stage 14 evidence. `pnpm tauri dev` was not launched into that occupied strict port. No credentials were requested or invented. No `OWNER-PROVIDED MANUAL RUNTIME EVIDENCE` was supplied yet. Owner should capture at least three authenticated samples per core initial-load scenario and record min/median/max as described in the baseline document. Unit-test timings and static counts are not runtime observations.

## Future contract, not implementation

Cache classifications cover Today strict-stale; Bookings and separate options; exact-page Customers; Attendance strict-stale; Schedule day/availability/staff-full; Home Service queue/drivers/detail/recommendations; Staff roster/services/applications; blocked Staff schedule-week; and unavailable Settings. Future keys include user, branch, dataset, query/window and version. Authenticated reads must validate before replacing snapshots; failed reads cannot become fake empties. Logout must purge or prevent access; restart requires authentication and starts snapshots stale. Unknown/corrupt versions fall back to hosted reads. Concurrent refreshes must be single-flight with newest validated result winning. Booking, Staff, Schedule, Attendance and Home Service mutation families have explicit cross-module invalidation relationships. These are architectural rules only, not Stage 14 cache code or authority for offline writes.

**TARGETS — NOT CURRENT OBSERVATIONS:** future local lookup/validation P95 ≤ 100 ms and useful cached navigation P95 ≤ 250 ms on target Windows hardware; validated response snapshots first, not a hosted relational clone. Physical database technology and implementation remain for a separately authorized stage.

## Verification

| Gate                                         | Result                                                                |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Focused recorder + seven service suites      | PASS — 326 tests / 8 files                                            |
| Full `pnpm test`                             | PASS — 706 tests / 27 files                                           |
| `pnpm typecheck`                             | PASS                                                                  |
| `pnpm lint`                                  | PASS — zero warnings                                                  |
| `pnpm format:check`                          | PASS                                                                  |
| `pnpm build`                                 | PASS — 1,965 modules; existing nonfatal >500 kB chunk warning         |
| `git diff --check`                           | PASS (working and staged changes; recheck before commit)              |
| Native/authenticated performance measurement | NOT OBSERVED — occupied port/unverified listener; owner gate required |

No Rust/native build was required for this JS/docs-only stage. `src-tauri/capabilities/desktop-api.json`, `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, package manifests and dependency set remain unchanged. Hosted source, production business data/mutations, schema and migrations remain unchanged. No SQLite/local database, local business-data persistence, Realtime, polling, background sync or production telemetry was added.

## Exact intended changed files

1. `docs/10-architecture/DESKTOP_BOUNDARY.md` → `docs/99-archive/stage-00/DESKTOP_BOUNDARY.md` (rename, no content change)
2. `docs/10-architecture/WEB_CONTRACT_INVENTORY.md` → `docs/99-archive/stage-00/WEB_CONTRACT_INVENTORY.md` (rename, no content change)
3. `docs/50-state/evidence/stage-00-initialization.md` (one repaired link)
4. `docs/10-architecture/CURRENT_DESKTOP_DATA_BOUNDARY.md`
5. `docs/10-architecture/LOCAL_DATA_CACHE_CONTRACT.md`
6. `docs/30-delivery/STAGE_14_PERFORMANCE_BASELINE.md`
7. `docs/30-delivery/STAGE_14_EVIDENCE.md`
8. `src/lib/read-performance.ts`
9. `src/lib/today-service.ts`
10. `src/lib/bookings-service.ts`
11. `src/lib/customers-service.ts`
12. `src/lib/attendance-service.ts`
13. `src/lib/schedule-service.ts`
14. `src/lib/home-service-service.ts`
15. `src/lib/staff-service.ts`
16. `tests/read-performance.test.ts`

**Known limitations:** No real native/authenticated durations, UI paint timing, deployed RLS check or target-hardware P95; existing Staff week isolation/error-coercion gap remains cache-blocked; static request counts cannot expose hosted internal SQL traffic. The owner authenticated measurement gate is outstanding. Rollback is a revert of the Stage 14 branch commit; no schema, data or hosted rollback is required.
