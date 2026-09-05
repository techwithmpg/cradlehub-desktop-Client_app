# CradleHub Desktop — Stage 00 Greenfield Initialization

You are initializing the NEW greenfield Windows desktop repository for CradleHub Desktop.

DESKTOP GITHUB REPOSITORY:
https://github.com/techwithmpg/cradlehub-desktop-Client_app.git

HOSTED CRADLEHUB REFERENCE REPOSITORY:
https://github.com/techwithmpg/Cradlehub.git

This desktop repository is intentionally empty.

This is a GREENFIELD FUNCTIONAL REBUILD effective 2026-09-05.

Previous desktop repositories, prior PASS claims, screenshots, Foundation Showcase work, prior shells, SQLite/session/sync implementations, previous native-runtime evidence, and earlier desktop-stage claims are HISTORICAL ONLY.

Do not treat any previous desktop implementation as current truth.

Do not copy previous desktop implementation code into the new runtime.

Historical material may only be preserved under:

docs/99-archive/

==================================================
LOCAL PATHS
==================================================

DESKTOP_ROOT =
E:\Cradle-Destop-Client

WEB_REFERENCE_DIR =
E:\CradleHub-References\Cradlehub-Web

BOOTSTRAP_ZIP =
C:\Users\eleur\Downloads\CradleHub-Desktop-Greenfield-Bootstrap-2026-09-05.zip

==================================================
AUTHORIZED TASK
==================================================

Perform ONLY:

STAGE 00 — GREENFIELD REPOSITORY INITIALIZATION & HOSTED CONTRACT AUDIT

Do not start Stage 01.

Do not build Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff, Settings, or any other product module.

Do not merge the Stage 00 branch.

Do not modify the hosted CradleHub web repository.

Do not modify production data.

Do not modify database schema.

Do not apply or push migrations.

Do not modify Auth, RLS, Storage policies, or production configuration.

Do not introduce speculative SQLite, local persistence, offline sync, polling, background synchronization, or caching architecture.

When Stage 00 is complete, PUSH and STOP.

==================================================

1. PREFLIGHT
   \==================================================

Before making any change, print and record:

- current working directory;
- operating system;
- Git version;
- Node version;
- pnpm version if available;
- npm version if available;
- Rust version;
- Cargo version;
- rustup version;
- detectable Tauri/Windows development prerequisites.

Never print secret values.

Verify:

DESKTOP_ROOT = E:\Cradle-Destop-Client

The desktop root must either:

- not exist yet; or
- exist and be completely empty.

If E:\Cradle-Destop-Client already exists and contains files:

STOP.

Do not delete it.
Do not reset it.
Do not overwrite it.
Do not attempt to clean it automatically.

Report the conflict instead.

Verify that:

C:\Users\eleur\Downloads\CradleHub-Desktop-Greenfield-Bootstrap-2026-09-05.zip

exists.

If the bootstrap ZIP is missing:

STOP.

================================================== 2. PREPARE THE HOSTED READ-ONLY REFERENCE
==================================================

Hosted repository:

https://github.com/techwithmpg/Cradlehub.git

Reference directory:

E:\CradleHub-References\Cradlehub-Web

This repository is REFERENCE ONLY.

If WEB_REFERENCE_DIR does not exist:

1. create its parent directory if necessary;
2. clone:

   https://github.com/techwithmpg/Cradlehub.git

   into:

   E:\CradleHub-References\Cradlehub-Web

3. checkout main.

If WEB_REFERENCE_DIR already contains a Git repository:

1. inspect:

   git remote -v

2. verify its origin is exactly:

   https://github.com/techwithmpg/Cradlehub.git

3. inspect:

   git status --short --branch

4. if there are local modifications, STOP instead of destroying them;
5. fetch origin with prune;
6. checkout main;
7. fast-forward only to origin/main.

Do not reset destructively.

Do not force checkout over local modifications.

If a full-history clone is slow or unnecessary, a shallow/current-main clone is acceptable.

The resulting working tree must still contain the complete current main source needed for inspection, including relevant src/, docs/, and supabase/ content.

Resolve and record:

git rev-parse HEAD

git rev-parse origin/main

Confirm:

HEAD == origin/main

Record the current hosted origin/main SHA.

Do not assume an older SHA from documentation or conversation is still current.

Treat this hosted repository as READ-ONLY.

Do NOT:

- edit hosted source;
- commit hosted changes;
- push hosted changes;
- copy .env files;
- print environment secrets;
- run production database mutation commands;
- run migration push/apply commands;
- change Auth;
- change RLS;
- change Storage policies.

================================================== 3. INITIALIZE THE EMPTY DESKTOP REPOSITORY
==================================================

Create:

E:\Cradle-Destop-Client

Enter that directory.

Initialize Git:

git init -b main

Create only enough initial content to establish the greenfield desktop repository identity and governance baseline.

At minimum create appropriate initial files such as:

- .gitignore
- README.md
- AGENTS.md
- greenfield governance entry point

Do not create CRM implementation yet.

Create the initial baseline commit:

chore: initialize CradleHub Desktop greenfield repository

Record this commit SHA as:

BASE_SHA

Configure:

origin = https://github.com/techwithmpg/cradlehub-desktop-Client_app.git

Before pushing anything, run:

git remote -v

Verify that origin points exactly to:

https://github.com/techwithmpg/cradlehub-desktop-Client_app.git

It MUST NOT point to:

https://github.com/techwithmpg/Cradlehub.git

It MUST NOT point to an older desktop repository.

If remote identity is uncertain:

STOP.

Never guess the remote.

Push the new greenfield main baseline.

Never force-push.

After the baseline main commit is safely established, create:

stage/00-initialization

All remaining Stage 00 work must happen on:

stage/00-initialization

Do not routinely implement on main.

================================================== 4. IMPORT THE GREENFIELD BOOTSTRAP PACKAGE
==================================================

Bootstrap archive:

C:\Users\eleur\Downloads\CradleHub-Desktop-Greenfield-Bootstrap-2026-09-05.zip

Verify it exists.

Extract it to a temporary/bootstrap working directory if necessary.

Do not use the extracted bootstrap directory itself as the desktop repository.

Import the intended active greenfield governance, state, delivery, architecture, and reference files into:

E:\Cradle-Destop-Client

Approved current CRM reference images belong under:

docs/20-product/reference-ui/current/crm/

Preserve their supplied reference manifest/hashes when available.

The approved images define:

- hierarchy;
- density;
- layout intent;
- interaction intent;
- visual character.

They do NOT define:

- fake records;
- fake counts;
- fake branch state;
- fake Live state;
- fake sync success;
- fake payment totals;
- fake attendance events;
- business authority.

If previous desktop documentation is also imported, preserve it unchanged under:

docs/99-archive/pre-greenfield-2026-09-05/

Do not allow previous desktop PASS claims to remain active.

No previous desktop:

- Stage 1 PASS;
- Stage 2 PASS;
- Stage 3 PASS;
- UI-R0 PASS;
- UI-R1 PASS;
- UI-R2 PASS;
- prior SQLite runtime;
- prior auth/session implementation;
- prior shell;
- prior sync implementation

may appear as current greenfield truth.

================================================== 5. HOSTED CONTRACT AUDIT
==================================================

Before future product-module implementation, establish a current hosted-system contract inventory.

Inspect the CURRENT hosted repository.

At minimum inspect:

AGENTS.md

AI_CONTEXT.md

package.json

relevant active architecture, system-map, production-safety, testing, data/sync, and governance documents.

Inspect:

src/app/(dashboard)/crm/

Inspect relevant domain ownership under:

src/lib/

including where present:

src/lib/auth
src/lib/bookings
src/lib/attendance
src/lib/crm
src/lib/home-service

Also locate current code for:

- customers;
- staff;
- schedules;
- settings;
- branch context;
- role authorization;
- services;
- home service / dispatch.

Inspect relevant:

- Server Actions;
- route handlers;
- APIs;
- RPC usage;
- Supabase client ownership;
- Realtime subscriptions;
- branch filters;
- authorization checks;
- side effects;
- public/server boundaries;
- migrations only as repository evidence.

Do not infer deployed production behavior from static source alone.

Create:

docs/10-architecture/WEB_CONTRACT_INVENTORY.md

The inventory must cover ONLY the active first-release desktop modules:

1. Today
2. Bookings
3. Attendance
4. Customers
5. Schedule
6. Home Service
7. Staff
8. Settings

For each module record, where proven:

- hosted routes;
- primary read source;
- primary mutation/action source;
- Server Actions;
- API routes;
- RPC names;
- relevant data/table names;
- role authorization;
- branch authorization;
- Realtime usage;
- side effects;
- server-only behavior;
- important consumers;
- loading implications;
- empty-state implications;
- error implications;
- offline implications;
- unknowns requiring later verification.

Every important claim must be classified as one of:

REPOSITORY VERIFIED

OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

UNVERIFIED / OPEN QUESTION

Do not invent missing contracts.

Repository source proves repository implementation only.

It does not automatically prove deployed production behavior.

================================================== 6. DESKTOP SCAFFOLD
==================================================

Create one production-oriented Windows desktop scaffold using:

- Tauri 2
- React
- TypeScript
- Vite
- one deliberately selected package manager

Prefer pnpm if it is compatible with the actual scaffold/tooling and document the chosen version.

Use one canonical UI-system direction compatible with:

- Tailwind CSS;
- shadcn conventions where useful;
- Base UI;
- CVA;
- Lucide;
- restrained Motion.

Do not create parallel systems.

Do NOT create:

- *V2 components;
- new-* replacements;
- alternate shell;
- second token system;
- demo component system;
- Foundation Showcase;
- runtime component gallery;
- sample CRM dashboard.

If a generator creates default demo content such as a Tauri counter, sample logos, demo commands, or starter gimmicks:

remove those from the normal application runtime.

The Stage 00 runtime may be minimal.

It may truthfully display states such as:

- CradleHub Desktop;
- application initialized;
- not authenticated;
- connection not established;
- CRM unavailable until authenticated in a later authorized stage.

It MUST NOT display fabricated operational state.

No fake:

- customers;
- bookings;
- staff;
- attendance;
- schedules;
- payments;
- revenue;
- branch;
- Live state;
- sync success;
- scan activity;
- home-service jobs;
- mutation success.

Do not implement product modules during Stage 00.

================================================== 7. SECURITY BOUNDARY
==================================================

Never place privileged secrets in the renderer or desktop bundle.

Do not introduce:

- Supabase service-role key;
- direct Postgres password;
- privileged database credentials;
- signing private keys;
- device secrets;
- privileged server API secrets.

Do not create generic native SQL execution callable from the renderer.

Do not create a generic privileged Tauri command escape hatch.

Do not trust renderer-supplied:

- role;
- branch;
- authorization;
- permission claims.

Do not disable RLS.

Do not bypass server authorization.

Use least-privilege Tauri capabilities.

React owns:

- presentation;
- forms;
- keyboard interaction;
- accessible UI behavior;
- ephemeral UI state.

Tauri/Rust owns native capabilities and persistent local data only when those capabilities are explicitly introduced by an authorized future stage.

Stage 00 must NOT introduce speculative:

- SQLite;
- local cache;
- durable session store;
- offline mutation outbox;
- sync engine;
- polling;
- background workers.

================================================== 8. ACTIVE GREENFIELD STATE FILES
==================================================

Create/update fresh active greenfield state files:

docs/50-state/CURRENT_STATE.md

docs/50-state/CURRENT_TASK.md

docs/50-state/LAST_VERIFIED_GATE.md

docs/50-state/HANDOFF.md

docs/50-state/evidence/stage-00-initialization.md

Before owner acceptance:

CURRENT_STATE must say Stage 00 is active/unaccepted.

CURRENT_TASK must identify only Stage 00.

LAST_VERIFIED_GATE must state that no greenfield implementation gate has yet been owner-accepted.

HANDOFF must point only to independent review of Stage 00.

No historical desktop PASS may appear as current truth.

================================================== 9. STAGE 00 EVIDENCE RECORD
==================================================

Create:

docs/50-state/evidence/stage-00-initialization.md

It must include:

- Target
- Stage/task
- Desktop repository
- Hosted reference repository
- Branch
- BASE_SHA
- HEAD_SHA
- hosted reference SHA
- changed files
- exact checks
- exact results
- runtime evidence actually observed
- security/data impact
- limitations
- open questions
- rollback

Do NOT mark Stage 00 accepted.

Do NOT write PASS solely because tests succeed.

Before owner review, use:

READY FOR INDEPENDENT REVIEW

================================================== 10. REQUIRED CHECKS
==================================================

Run exact checks appropriate to the scaffold.

Record the exact command and result for every check.

Frontend checks should include, where configured:

- formatting check;
- lint;
- TypeScript/type check;
- focused tests;
- production renderer build.

Rust/Tauri checks should include:

cargo fmt --check

cargo check

cargo test

cargo clippy -- -D warnings

or the closest strict Clippy gate supported by the actual workspace.

If a command cannot run, record:

- command;
- reason;
- result as NOT RUN or BLOCKED.

Do not infer success.

Repository checks must include:

- secret-pattern scan;
- fake/demo normal-runtime scan;
- Foundation Showcase scan;
- sample-data scan;
- parallel shell/V2 scan;
- active documentation consistency;
- current branch;
- current SHA;
- git status --short --branch.

Inspect the final diff before push.

Ensure there are no unexplained unrelated files.

================================================== 11. NATIVE WINDOWS RUNTIME CHECK
==================================================

If this Windows development environment has the required prerequisites:

launch the actual Tauri desktop application.

Record ONLY what was actually observed.

At Stage 00, verify basic facts such as:

- application launches;
- native window appears;
- no demo counter/sample application is visible;
- displayed state is truthful;
- no fake Live/sync/CRM records appear;
- no obvious startup crash occurs.

Do not claim authentication works.

Do not claim CRM works.

Do not claim production connectivity works.

Do not claim sync works.

Those are later-stage responsibilities unless genuinely introduced and verified.

If the native app is not launched:

write:

NOT RUN

and explain why.

================================================== 12. SCOPE REVIEW
==================================================

Before committing/pushing the final Stage 00 work, verify:

- no Stage 01 implementation exists;
- no product module was implemented;
- no hosted web source was changed;
- no production DB was touched;
- no migration/schema change occurred;
- no Auth/RLS/Storage policy changed;
- no secret was introduced;
- no fake normal-runtime data exists;
- no second UI system exists;
- no historical desktop PASS became active;
- no speculative SQLite/offline/sync architecture exists.

If any of these conditions fail:

correct them before presenting Stage 00 for review.

================================================== 13. COMMIT AND PUSH
==================================================

Commit Stage 00 changes on:

stage/00-initialization

Use clear commit messages appropriate to the work.

Resolve:

HEAD_SHA

Push:

stage/00-initialization

to:

https://github.com/techwithmpg/cradlehub-desktop-Client_app.git

Never force-push.

Do NOT merge into main.

Do NOT create Stage 01.

Do NOT start another branch.

================================================== 14. FINAL REPORT FORMAT
==================================================

Return exactly these sections:

### A — Target

Include:

- DESKTOP_ROOT
- desktop remote
- WEB_REFERENCE_DIR
- hosted reference repository
- resolved hosted origin/main SHA

### B — Git State

Include:

- main baseline SHA / BASE_SHA
- stage branch
- HEAD_SHA
- git status
- remote identity

### C — Created / Changed

List exact changed files or exact grouped paths.

### D — Hosted Contract Audit

Summarize:

- what was proven from repository source;
- what remains unverified;
- important authorization/server boundaries;
- any contract risks discovered.

Do not claim deployed production verification unless actually observed.

### E — Exact Checks and Results

Show each command and its exact result.

### F — Runtime Evidence Actually Observed

State exactly what was observed in the real native Windows runtime.

If it was not run, say:

NOT RUN

Do not infer anything unobserved.

### G — Security / Data Impact

Explicitly state:

- production data changed: YES/NO
- database schema changed: YES/NO
- migrations applied/pushed: YES/NO
- Auth changed: YES/NO
- RLS changed: YES/NO
- Storage policy changed: YES/NO
- privileged secrets introduced: YES/NO
- hosted web repository modified: YES/NO
- Tauri capabilities changed: YES/NO, with details

### H — Limitations / Open Questions

List all important unverified items.

### I — Rollback

Give the exact safe rollback path for Stage 00.

Do not delete unrelated user files.

### J — Gate

The final line MUST be exactly:

READY FOR INDEPENDENT REVIEW — NOT MERGED — NEXT STAGE NOT AUTHORIZED

================================================== 15. STOP CONDITION
==================================================

After pushing stage/00-initialization and producing the report:

STOP.

Do not:

- merge;
- implement Stage 01;
- build a CRM module;
- redesign anything further;
- start auth;
- start bookings;
- start Today;
- start Customers;
- start Staff;
- start Schedule;
- start Attendance;
- start Home Service;
- start Settings.

The owner will send the pushed branch to ChatGPT for independent GitHub review.

Only after independent review and explicit owner confirmation can Stage 00 be accepted.

Completion of Stage 00 NEVER authorizes Stage 01.
