# COPY/PASTE PROMPT — CradleHub Desktop Stage 00 Initialization

You are initializing a new **CradleHub Desktop** repository on Windows.

This is a **GREENFIELD FUNCTIONAL REBUILD** effective 2026-09-05.

## Replace these placeholders before execution

- `DESKTOP_ROOT = <ABSOLUTE_EMPTY_WINDOWS_FOLDER_FOR_NEW_DESKTOP_REPO>`
- `DESKTOP_REMOTE = <OPTIONAL_GITHUB_REMOTE_URL_FOR_NEW_DESKTOP_REPO>`
- `BOOTSTRAP_PACKAGE = <ABSOLUTE_PATH_TO_THIS_EXTRACTED_BOOTSTRAP_PACKAGE>`
- `WEB_REFERENCE_PARENT = <ABSOLUTE_PARENT_FOLDER_FOR_READ_ONLY_WEB_REFERENCE_CLONE>`

Hosted web reference repository:

`https://github.com/techwithmpg/Cradlehub.git`

If `DESKTOP_REMOTE` is not available, initialize locally and stop before remote/push operations. Do not invent a remote.

---

# AUTHORIZED TASK

Perform **Stage 00 — Greenfield Repository Initialization & Contract Audit only**.

Do not start Stage 01.
Do not build Bookings or any CRM module.
Do not merge.
Do not modify the hosted CradleHub web repository.
Do not touch a production database.

## Mandatory greenfield reset

Previous desktop repositories and uploaded legacy desktop docs are historical evidence only.

No previous Stage 1/2/3/UI-R* PASS is current truth.

Do not copy old implementation code into the new runtime.

Do not claim prior SQLite, auth/session, sync, shell, or module implementation as already complete.

Historical material may only be preserved under:

`docs/99-archive/`

## Safety before any write

1. Print:
   - current working directory;
   - OS;
   - Git version;
   - Node version;
   - package manager versions available;
   - Rust/Cargo/rustup versions if available;
   - Tauri/Windows prerequisites you can actually detect.
2. Verify `DESKTOP_ROOT`.
3. If `DESKTOP_ROOT` exists and is non-empty:
   - DO NOT delete it;
   - DO NOT reset it;
   - DO NOT overwrite it;
   - STOP and report the conflict.
4. Verify the bootstrap package exists.
5. Verify the web reference URL is reachable.
6. Never print secret environment values.

## Web reference clone

Create or refresh a separate read-only working clone under `WEB_REFERENCE_PARENT`, not inside the new desktop runtime source.

Example logical layout:

```text
<parent>/
  CradleHub-Desktop/          # new greenfield desktop repository
  _reference/
    Cradlehub-Web/            # hosted web repo reference clone
```

For the web reference clone:

- checkout accepted `main`;
- `git fetch --all --prune`;
- fast-forward only;
- record the resolved web `origin/main` SHA;
- do not edit it;
- do not run production database mutation commands;
- do not copy `.env` or secrets into the desktop repository.

## New desktop Git baseline

Create `DESKTOP_ROOT`.

Initialize Git with `main`.

Create a minimal first baseline commit containing only enough material to establish the greenfield repository identity, such as:

- `.gitignore`
- `README.md`
- a greenfield marker / project rules entry

Suggested commit:

`chore: initialize CradleHub Desktop greenfield repository`

Record that commit SHA as the Stage 00 `BASE_SHA`.

Then create:

`stage/00-initialization`

All further Stage 00 work must occur on this branch.

Do not routinely work directly on `main`.

## Import this governance package

Copy the active greenfield docs from `BOOTSTRAP_PACKAGE` into the new desktop repository.

Copy the approved reference images into:

`docs/20-product/reference-ui/current/crm/`

Preserve the supplied SHA-256 manifest.

Do not place old PASS evidence into active state.

If the owner also supplies the old `docs.zip`, preserve its extracted contents under:

`docs/99-archive/pre-greenfield-2026-09-05/`

Do not silently delete or rewrite the historical files.

## Stage 00 hosted-system audit

Inspect the current hosted web repository rather than assuming old desktop contracts are correct.

At minimum inspect:

- `AGENTS.md`
- `AI_CONTEXT.md`
- `package.json`
- current active governance docs relevant to system map, safety, testing, and data architecture;
- `src/app/(dashboard)/crm/`
- `src/lib/`
- auth/Supabase client ownership;
- booking/customer/staff/schedule/attendance/home-service code paths;
- API/Server Action boundaries;
- Supabase migrations/RPCs only as repository evidence;
- Realtime consumers;
- role/branch authorization paths.

Create:

`docs/10-architecture/WEB_CONTRACT_INVENTORY.md`

For each first-release desktop module, record:

- web route(s);
- primary read source(s);
- primary mutation/action source(s);
- branch/role authorization source;
- relevant table/RPC/API names if proven;
- Realtime dependency if proven;
- side effects;
- known server-only behavior;
- unknowns requiring later verification.

Do not invent missing contracts.

Classify each statement as one of:

- `REPOSITORY VERIFIED`
- `OWNER-PROVIDED MANUAL RUNTIME EVIDENCE`
- `UNVERIFIED / OPEN QUESTION`

Repository source does not equal deployed-production proof.

## Migration warning

The hosted web repository records a Supabase migration history that includes historical/local-only entries.

Do not:

- replay old migrations;
- mark old migrations applied;
- push migrations;
- normalize migration history;
- modify production schema;

during Stage 00.

Any future schema/migration work requires separate, target-aware owner authorization.

## Desktop scaffold

Create one production-oriented Windows desktop scaffold using:

- Tauri 2;
- React;
- TypeScript;
- Vite;
- one package manager chosen deliberately and recorded.

Prefer compatibility with the hosted project's current frontend ecosystem where reasonable, but do not blindly clone its Next.js server architecture into the desktop renderer.

No demo counter.
No sample dashboard.
No fake CRM data.
No Foundation Showcase.
No alternate shell.

If a scaffold generator creates demo UI, remove demo runtime content before Stage 00 is presented for review.

The Stage 00 runtime may contain only a minimal truthful application entry such as:

- product identity;
- startup state;
- `Not authenticated` / `Not connected` state;
- an unavailable placeholder for later authenticated CRM routing.

Do not display fake `Live`, fake sync, fake branch, fake staff, fake bookings, fake totals, or fake success.

## Canonical design-system foundation

Stage 00 may install and wire the minimal packages needed to establish one UI foundation, but do not spend Stage 00 building product screens.

Use one coherent family compatible with the project direction:

- Tailwind CSS;
- shadcn conventions where useful;
- Base UI / CVA as chosen canonical primitives;
- Lucide as the icon library;
- Motion only for restrained operational motion.

Do not create a component showcase route.

Do not create `V2` components.

Document chosen package versions.

## Security boundary

The renderer must never receive privileged secrets.

Do not add:

- service-role key;
- database password;
- signing private key;
- direct privileged Postgres connection;
- generic native SQL execution;
- generic privileged Tauri command;
- fake role/branch authorization.

Use least-privilege Tauri capability configuration.

Do not introduce local persistent auth/session/cache/sync architecture in Stage 00 unless the owner separately authorizes a bounded architecture decision.

Stage 00 is initialization and contract audit, not speculative offline engineering.

## Required fresh state files

Ensure these files describe ONLY the new greenfield truth:

- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/LAST_VERIFIED_GATE.md`
- `docs/50-state/HANDOFF.md`

Before Stage 00 is accepted:

- CURRENT_STATE must say Stage 00 is active/unaccepted;
- LAST_VERIFIED_GATE must say no greenfield implementation gate has yet been owner-accepted;
- no old PASS may appear as current truth.

## Required checks

Choose exact commands that match the actual scaffold and record them.

At minimum attempt, where applicable:

Frontend:
- format check;
- lint;
- type check;
- focused tests;
- production renderer build.

Rust/Tauri:
- `cargo fmt --check`;
- `cargo check`;
- `cargo test`;
- `cargo clippy -- -D warnings` or an equivalent strict clippy gate if feasible.

Repository:
- secret-pattern scan;
- forbidden demo/fake runtime scan;
- forbidden `V2`/parallel-shell scan;
- docs/current-state consistency check;
- `git status --short --branch`.

Native runtime:
- if running on the Windows machine with prerequisites available, launch the real Tauri app and record what was actually observed;
- if not run, state `NOT RUN` and do not infer success.

Viewport:
- Stage 00 does not need completed module viewport evidence;
- if a minimal shell exists, record only what was actually observed.

## Evidence file

Create:

`docs/50-state/evidence/stage-00-initialization.md`

It must include:

- Target
- Stage/task
- Branch
- `BASE_SHA`
- `HEAD_SHA`
- hosted web reference SHA
- changed files
- exact commands run
- exact results
- runtime evidence actually observed
- security/data impact
- limitations / unverified items
- rollback

Do not write `PASS` merely because the build succeeds.

Use `READY FOR INDEPENDENT REVIEW` until owner review is complete.

## Remote/push

If `DESKTOP_REMOTE` was supplied:

1. configure `origin`;
2. verify it points to the intended desktop repository, not the hosted web repository;
3. push `main` only if establishing the empty greenfield baseline is explicitly safe for that new repository;
4. push `stage/00-initialization`;
5. do not merge the stage branch.

Never force-push.

If remote identity is ambiguous, stop before push.

## Final response format

Return exactly these sections:

### A — Target
Desktop root, desktop remote, hosted web reference path + resolved SHA.

### B — Git State
`main` baseline SHA, stage branch, stage head SHA, status.

### C — Created / Changed
Exact file list or grouped exact paths.

### D — Hosted Contract Audit
What was proven from repository source and what remains unknown.

### E — Checks
Exact commands and exact results.

### F — Runtime Evidence
Only runtime behavior actually observed.

### G — Security / Data Impact
State whether any schema, production data, Auth/RLS/Storage policy, secrets, or privileged behavior changed.

### H — Limitations
Every unverified item.

### I — Rollback
Exact safe rollback path.

### J — Gate
Write:

`READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED`

Then STOP.

Do not start Stage 01.
