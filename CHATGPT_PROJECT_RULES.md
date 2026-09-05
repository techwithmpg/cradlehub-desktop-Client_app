# CradleHub Desktop — ChatGPT Project Rules

**Mode:** GREENFIELD FUNCTIONAL REBUILD

**Effective:** 2026-09-05

## 1. Mission

Build one fast, reliable, production-oriented Windows desktop CRM client for the existing hosted CradleHub system.

The desktop client is a separate client, not a second backend and not a replacement for the hosted web application.

## 2. Current implementation truth

This is a rebuild from scratch.

Previous desktop repositories, old stage PASS claims, old runtime screenshots, prior shell implementations, old local database/session implementations, and historical evidence are **not current implementation truth**.

Historical material may be retained only under `docs/99-archive/`.

No old desktop stage is inherited as passed. The first greenfield gate is Stage 00.

## 3. Active first-release modules

Only these CRM modules are active for the first release:

- Today
- Bookings
- Attendance
- Customers
- Schedule
- Home Service
- Staff
- Settings

Owner, Payments, Finance, Reports, Reconciliation, Payroll, Marketing, and broader surfaces are dormant until separately authorized.

Dormant routes must not be exposed in normal desktop navigation merely because they exist in the hosted web system.

## 4. Reference system

The hosted reference repository is:

`https://github.com/techwithmpg/Cradlehub`

Its current code and accepted business/data contracts must be inspected before implementing each corresponding desktop vertical slice.

Repository source proves repository implementation only. It does not by itself prove deployed production state.

When production behavior is not independently verified, do not convert repository assumptions into production claims.

## 5. No sample workspace rule

Normal runtime must never contain:

- Foundation Showcase;
- preview shell;
- demo dashboard;
- fake admin workspace;
- fake module;
- V2 shell;
- runtime component gallery;
- fabricated bookings/customers/staff;
- fake `Live` state;
- fake sync success;
- fake payment totals;
- fake attendance events;
- simulated mutation success.

Runtime routes must use:

- authoritative connected data;
- truthful loading state;
- truthful empty state;
- truthful error state;
- truthful offline/stale state;
- or an explicitly unavailable/disabled action.

Fixtures are allowed only in automated tests and isolated development harnesses that are unreachable from the normal application runtime and excluded from production behavior.

## 6. One active UI system

There is exactly one active:

- application shell;
- token/color system;
- typography scale;
- spacing/radius/elevation system;
- control family;
- DataGrid/table family;
- dialog/sheet/overlay family;
- inspector/detail pattern;
- status language;
- icon library;
- motion language.

Never create permanent parallel implementations such as:

- `*V2`;
- `new-*`;
- alternate shell;
- alternate token file;
- parallel component library;
- module-specific design system.

New modules extend the canonical system.

Search existing primitives before creating a new primitive.

## 7. UI intent and desktop quality

Approved CRM screenshots define hierarchy, density, layout intent, interaction placement, and product character. They do **not** define fake records, authoritative state, or business rules.

Target character:

- dense;
- calm;
- premium;
- operational;
- keyboard-friendly;
- low-error;
- predictable;
- accessible.

Optimize for fewer clicks, fewer errors, clear next actions, preserved context, and fast scanning.

Required viewport verification for each major module:

- 1440×900 primary;
- 1366×768 minimum production target;
- 1024×768 degraded behavior.

Do not claim responsive/native verification unless it was actually observed.

## 8. Functional-first rule

For every module:

1. inspect the real hosted business/data contract;
2. identify authoritative reads;
3. identify authoritative writes;
4. identify authorization boundaries;
5. identify side effects and current consumers;
6. define loading/empty/error/offline/stale states;
7. reuse the canonical shell/design system;
8. implement the smallest real vertical slice;
9. connect authoritative actions before claiming completion;
10. test keyboard/accessibility/responsive behavior;
11. record evidence;
12. stop.

A beautiful disconnected screen is not complete.

## 9. Authority and data boundaries

Unless superseded by an explicit approved ADR:

- existing CradleHub online services and Supabase are canonical online truth;
- the hosted web application remains independently usable;
- server/RLS authorization remains authoritative;
- local desktop state never grants authorization;
- local/offline state never bypasses final server validation;
- privileged operations remain server-side;
- desktop may cache/index authorized data for speed only when a stage explicitly introduces and proves that capability.

Never expose to the renderer or desktop bundle:

- service-role secrets;
- direct Postgres credentials;
- signing private keys;
- device secrets;
- privileged API secrets.

Never trust renderer-supplied role/branch/authorization claims.

Fail closed for authoritative mutations when identity, authorization, connectivity, or server validation is uncertain.

## 10. Ownership boundary

React owns:

- presentation;
- forms;
- keyboard interaction;
- accessible UI behavior;
- ephemeral UI state.

Tauri/Rust owns native capabilities and persistent local data **when those capabilities are explicitly introduced and approved**.

Do not pre-build speculative native persistence, caching, polling, or sync engines.

## 11. Replacement/refactor safety

Before replacing a subsystem identify:

- consumers;
- source of truth;
- ownership;
- side effects;
- authorization boundaries;
- production dependencies;
- tests;
- safe replacement path.

Use:

`inspect → isolate → test → improve`

Do not delete uncertain migrations, scripts, assets, records, tooling, or archived design material simply because they look old.

## 12. Git discipline

- `main` is the accepted desktop baseline.
- Do not routinely implement on `main`.
- Use exactly one authorized `stage/*` or `fix/*` branch at a time.
- Never force-push `main`.
- Never merge because tests passed.
- Never merge merely because the coding agent says PASS.
- Review the actual diff and evidence before owner confirmation.
- Completion of a stage never authorizes the next stage.

## 13. Required development loop

For each stage:

1. Owner explicitly authorizes one stage.
2. Agent fetches `origin/main`.
3. Agent records the accepted base SHA.
4. Agent creates exactly one authorized stage branch.
5. Agent implements only that stage.
6. Agent runs exact required checks.
7. Agent records evidence and limitations.
8. Agent pushes the branch.
9. Agent stops.
10. ChatGPT independently reviews GitHub branch/diff/evidence/CI.
11. If defects exist, ChatGPT returns `CHANGES REQUIRED`.
12. Agent fixes on the same branch and pushes again.
13. ChatGPT re-reviews.
14. When review is clean, ChatGPT returns `ACCEPTABLE FOR OWNER CONFIRMATION`.
15. Owner explicitly confirms/saves/accepts the stage.
16. Only then may accepted-state docs be finalized and the stage be merged.
17. Stop.
18. The next stage requires a new explicit owner authorization.

For urgent corrections to accepted work, use `fix/<slug>` and the same review loop.

## 14. ChatGPT Git review requirements

When asked to review a pushed stage, ChatGPT must use the GitHub connection and inspect, where available:

- repository identity;
- base branch;
- stage branch;
- base SHA;
- head SHA;
- compare/diff;
- changed filenames;
- relevant file contents;
- evidence record;
- tests/workflow status;
- unresolved review issues;
- scope drift;
- security/data impact;
- documentation/current-state consistency.

Do not trust an agent's self-reported file list or PASS summary when Git can verify it.

ChatGPT review outcomes are limited to:

`CHANGES REQUIRED`

or

`ACCEPTABLE FOR OWNER CONFIRMATION`

ChatGPT must not claim production verification from repository evidence alone.

## 15. Performance rule

Measure first.

Do not add speculative:

- SQLite;
- persistence;
- caching;
- polling;
- query rewrites;
- Realtime fan-out;
- background workers;
- preload layers.

Performance changes require before/after evidence appropriate to the actual bottleneck.

## 16. Security rule

Use least-privilege Tauri capabilities.

Do not disable RLS.

Do not ship privileged server credentials.

Do not create generic native SQL or generic privileged command escape hatches for renderer use.

Treat an unknown database/environment target as a stop condition.

## 17. Evidence language

Never fabricate browser, native-window, database, deployment, synchronization, or production verification.

Repository-only production-related material must be labelled exactly:

`REPOSITORY-RECORDED PRODUCTION EVIDENCE`

Owner-observed runtime facts must be labelled exactly:

`OWNER-PROVIDED MANUAL RUNTIME EVIDENCE`

Every implementation evidence record must include:

- target;
- task/stage;
- branch;
- base SHA;
- head SHA;
- changed files;
- exact checks and results;
- runtime evidence actually observed;
- security/data impact;
- limitations;
- rollback.

Unknown/unrun checks must be reported as unknown/unrun, never inferred.

## 18. Documentation rule

Active docs describe current truth only.

Use:

- `docs/00-governance/` for active project rules;
- `docs/10-architecture/` for current architecture/contracts;
- `docs/20-product/` for active product/module/reference material;
- `docs/30-delivery/` for stages/gates/testing;
- `docs/40-decisions/` for accepted ADRs;
- `docs/50-state/` for current status/handoff/evidence;
- `docs/99-archive/` for historical desktop material.

Git history records old code.

If docs and implementation conflict, stop and reconcile the baseline instead of guessing.

## 19. Stop conditions

Stop and ask for/record a decision when:

- the target repository is uncertain;
- the production/database target is uncertain;
- an implementation would require new privileged credentials;
- an existing server contract is ambiguous;
- a migration/schema change appears necessary but is not explicitly authorized;
- a stage would cross into a dormant module;
- the approved UI reference is missing and the decision materially affects layout;
- the working tree contains unexplained unrelated changes;
- the stage branch is based on an unaccepted baseline;
- active docs contradict implementation/ADRs;
- a destructive cleanup cannot be proven safe.

## 20. Current stage truth

Stage 00 is OWNER CONFIRMED / ACCEPTED PENDING MERGE on stage/00-initialization. The owner explicitly confirmed the reviewed Stage 00 HEAD 9ecbbce6343ce2d6208dedceb7b51230c6f2181f after independent GitHub review and owner runtime inspection on 2026-09-05. Main remains the pre-merge identity baseline 280e4afd5e304c00b7d98f2c1106a016ca484076; Stage 00 is not merged. Consult docs/50-state for acceptance evidence and review of this documentation update. Merge, Stage 01 and product modules remain unauthorized.
