# Stage 00 — Greenfield initialization evidence

Status: **ACCEPTED / MERGED — CLOSED**. The owner confirmed Stage 00 after independent GitHub review and manual Windows runtime inspection on 2026-09-05, then separately authorized its merge. Main now contains Stage 00 through merge `b16593d6d1ea873b5d4d10eac99d21cbb400e9a6`. Stage 01 and all further product work remain NOT AUTHORIZED. The merge-closure addendum supersedes the prior pending-merge status; original checks and runtime evidence retain their recorded scope.

## Target and immutable references

- Target: Windows desktop, `E:\Cradle-Destop-Client` (the spelling in the revised owner authorization).
- Stage/task: Stage 00 — Greenfield Repository Initialization & Hosted Contract Audit only.
- Desktop repository: https://github.com/techwithmpg/cradlehub-desktop-Client_app.git
- Hosted reference repository: https://github.com/techwithmpg/Cradlehub.git
- Hosted reference directory: `E:\CradleHub-References\Cradlehub-Web`.
- Original stage branch: `stage/00-initialization` (preserved). Current branch after authorized merge: `main`.
- BASE_SHA: `280e4afd5e304c00b7d98f2c1106a016ca484076` — initial greenfield identity/governance baseline, pushed to main before stage work.
- HEAD_SHA (verified implementation snapshot): `2cdedfb1718051bf41c9613ad177d91f6e3af42d`.
- Hosted reference SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`; local hosted HEAD and origin/main both resolved to this SHA, with a clean working tree.

The original reviewed delivery HEAD_SHA is `9ecbbce6343ce2d6208dedceb7b51230c6f2181f`; it added evidence and its changed-file manifest to the implementation snapshot above. The accepted documentation HEAD is `0526bf50ff50a748191dec04a76116cddb649c5d`, preserved on the stage branch. The owner-authorized merge commit is `b16593d6d1ea873b5d4d10eac99d21cbb400e9a6`. Resolve the final main closure HEAD_SHA with `git rev-parse main`; the final merge report records its exact pushed SHA. A tracked record cannot embed the hash of its own containing commit.

The [revised authorization](../../30-delivery/STAGE_00_AUTHORIZATION.md) supersedes the older attached path. [Preflight](stage-00-preflight.md) records the initial empty-target check, empty desktop remote, ZIP presence, tool versions and native prerequisites before target changes. Existing user content was not overwritten. No earlier desktop implementation was imported.

## Created and changed files

The original baseline-to-reviewed-delivery list is [stage-00-changed-files.txt](stage-00-changed-files.txt). Reproduce it with `git diff --name-only 280e4afd5e304c00b7d98f2c1106a016ca484076 9ecbbce6343ce2d6208dedceb7b51230c6f2181f`. The acceptance-update file list is recorded below.

- Root governance: AGENTS.md, CHATGPT_PROJECT_RULES.md, INITIAL_ROADMAP.md, README.md, STAGE_REVIEW_PROTOCOL.md and bootstrap-manifest.json.
- Root tooling: .gitattributes, .npmrc, .prettierignore, .prettierrc.json, eslint.config.js, index.html, package.json, pnpm-lock.yaml, tsconfig.json and vite.config.ts. The initial baseline also created .gitignore.
- `docs/00-governance/`: current source-of-truth and entry-point rules.
- `docs/10-architecture/`: hosted inventory, desktop ownership/security boundary and one UI-system direction.
- `docs/20-product/reference-ui/`: supplied manifest and eight current CRM reference PNGs; their supplied SHA-256 values match. No Customers image was supplied.
- `docs/30-delivery/`: authorization, stage gates and evidence template.
- `docs/50-state/`: Stage 00 state/task/gate/handoff, preflight/build/native evidence and this record; the current status now records owner acceptance pending merge.
- `docs/99-archive/bootstrap-2026-09-05/`: six unchanged bootstrap background documents, retained as historical/reference material only. No previous desktop runtime code was imported.
- `src/`: App.tsx, main.tsx, styles.css — one minimal truthful presentation.
- `src-tauri/`: Cargo.toml, Cargo.lock, build.rs, tauri.conf.json, src/lib.rs, src/main.rs and two icon sources/assets.
- `tests/boundary.test.ts` and `scripts/verify-stage00.mjs`: focused scaffold boundary checks and reproducible repository scans.

The final diff was inspected for unrelated additions, parallel systems and scope drift. Build products, dependencies, generated schemas and environment files are ignored and are not delivered in Git.

## Hosted contract audit

[WEB_CONTRACT_INVENTORY.md](../../10-architecture/WEB_CONTRACT_INVENTORY.md) covers Today, Bookings, Attendance, Customers, Schedule, Home Service, Staff and Settings. It cites immutable source paths/lines and separates **REPOSITORY VERIFIED**, **OWNER-PROVIDED MANUAL RUNTIME EVIDENCE** (none supplied for hosted operations), and **UNVERIFIED / OPEN QUESTION**. It records reads, writes, Server Actions, APIs, RPCs, tables, authorization, Realtime, side effects, consumers and loading/empty/error/offline implications where source proves them.

Source establishes server-derived staff/branch context, cookie-based Next request clients, privileged hosted admin-client ownership, and action-specific authorization. It does not establish a reusable desktop authentication/API contract or deployed RLS correctness. Customer lookup/profile/update boundaries, inactive-staff checks, error-to-empty fallbacks, attendance completion scope and some unfiltered schedule subscriptions need later verification. Home Service maps provisionally to `/crm/dispatch`; Settings maps provisionally to `/crm/setup`, not an existing `/crm/settings` route. These are audit mappings, not accepted product scope.

The hosted checkout is shallow and sparse after slow full clone attempts; required src/, docs/, supabase/, tests and governance source is available. Photo/service-image assets and binary media were omitted. Only clone/fetch/checkout metadata changed; hosted tracked source remained clean. No hosted dependency install, hosted test/build, database connection, migration or production operation was performed.

## Original initialization checks and results

Unless stated otherwise, commands ran from `E:\Cradle-Destop-Client`. Rust commands ran from its `src-tauri` directory. All listed final gates exited 0. Tool versions and prerequisites are recorded in [preflight](stage-00-preflight.md).

| Exact command                                                    | Observed final result                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                 | Exit 0; lockfile current, dependencies already up to date; pnpm 10.33.2.                                                                                                                                                                                                                                  |
| `pnpm format:check`                                              | Exit 0; all matched files use Prettier code style. Historical archive is intentionally excluded.                                                                                                                                                                                                          |
| `pnpm lint`                                                      | Exit 0; ESLint, zero warnings permitted.                                                                                                                                                                                                                                                                  |
| `pnpm typecheck`                                                 | Exit 0; TypeScript compilation check, no diagnostics.                                                                                                                                                                                                                                                     |
| `pnpm test`                                                      | Exit 0; Vitest 5.0.0, one file, three boundary tests passed.                                                                                                                                                                                                                                              |
| `pnpm build`                                                     | Exit 0; TypeScript check and Vite 8.2.2 production renderer build, 1,834 transformed modules.                                                                                                                                                                                                             |
| `cargo fmt --check`                                              | Exit 0; Rust formatting clean.                                                                                                                                                                                                                                                                            |
| `cargo check --locked`                                           | Exit 0; development check completed.                                                                                                                                                                                                                                                                      |
| `cargo test --locked`                                            | Exit 0; library, binary and doc-test targets completed with zero authored Rust tests.                                                                                                                                                                                                                     |
| `cargo clippy --locked --all-targets -- -D warnings`             | Exit 0; strict lint completed without warnings.                                                                                                                                                                                                                                                           |
| `pnpm tauri build --debug --no-bundle`                           | Exit 0; renderer production build plus Windows debug executable with embedded assets. No installer/signing was attempted.                                                                                                                                                                                 |
| `node scripts/verify-stage00.mjs`                                | Exit 0; zero failed checks: bounded secret patterns, excluded env files, fake/demo runtime, Foundation Showcase, sample data, parallel shell/V2, speculative persistence/network, zero capabilities, one token source, active docs, eight image hashes, no SQL/schema additions, branch and exact origin. |
| `git diff --cached --check`                                      | Exit 0 before implementation commit; no active-file whitespace errors.                                                                                                                                                                                                                                    |
| `git diff 280e4afd5e304c00b7d98f2c1106a016ca484076 HEAD --check` | Exit 0 for committed implementation; repeated after final evidence staging.                                                                                                                                                                                                                               |
| `git branch --show-current`                                      | `stage/00-initialization`.                                                                                                                                                                                                                                                                                |
| `git rev-parse HEAD`                                             | Verified implementation: `2cdedfb1718051bf41c9613ad177d91f6e3af42d`; final delivery SHA is resolved after the evidence-only commit.                                                                                                                                                                       |
| `git status --short --branch`                                    | Clean implementation tree: `## stage/00-initialization`; final delivery cleanliness/upstream checked after commit and push.                                                                                                                                                                               |
| `git remote -v`                                                  | Desktop fetch/push origin is exactly `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`.                                                                                                                                                                                                   |

Additional integrity check: PowerShell `Get-FileHash -Algorithm SHA256` compared all six archived files with their extracted bootstrap originals; zero mismatches. The eight reference-image hashes are also checked by the repository script. Final changed paths were compared to the manifest. These scans are bounded checks, not a proof that every possible defect or secret pattern is absent.

Raw Rust results: [rust-final-checks.txt](rust-final-checks.txt). Raw successful native build: [native-build.txt](native-build.txt). The initial `cargo check --locked` exited 101 because Tauri required `icons/icon.ico`; a minimal application icon was added and all subsequent Rust/native gates succeeded. The original failure remains in [initial-cargo-check.txt](initial-cargo-check.txt). An initial icon-generation invocation used the wrong relative source path and was corrected before the successful build. Dependency selection was corrected to TypeScript 6.0.3 within typescript-eslint's declared supported range; final frozen install and frontend gates succeeded.

Active Markdown whitespace was normalized. `.gitattributes` exempts unchanged archived originals from whitespace diagnostics; those originals retain their supplied bytes. An automatic approval-review usage-limit interruption delayed the final commit; the later authorized retry succeeded. Neither interruption changes the successful verification results or grants additional scope.

## Native Windows runtime actually observed

The built `E:\Cradle-Destop-Client\src-tauri\target\debug\cradlehub-desktop.exe` was launched as a native Windows application with embedded renderer assets. Observation timestamp: `2026-09-05T10:35:50.545Z` (18:35:50 Singapore time). The native window title was **CradleHub Desktop**, observed window ID 68034, with a 1102 x 792 screenshot.

The real window displayed **Application initialized**, **Not authenticated**, **Connection — Not established**, and **CRM is unavailable until authentication is introduced in a later authorized stage**. No demo counter, starter logos, fake records, Live indicator or sync-success state appeared. Accessibility inspection exposed a main region, heading and status definition list, with only native title-bar controls. The window was still present on a follow-up inspection; no obvious startup crash was observed.

- [Actual native screenshot](stage-00-native-window.png)
- [Window and accessibility observation](stage-00-native-observation.txt)
- Executable SHA-256: `2F33A0119FC3245A066336AD07E1CE7580C5D54BA2A0F5B2DCCB06183F0798E2`.

This proves only the observed initial native window. Authentication, CRM behavior, production connectivity and synchronization were not implemented or verified.

## Original initialization security and data impact

| Impact                         | Result                                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Production data changed        | NO                                                                                                                                            |
| Database schema changed        | NO                                                                                                                                            |
| Migrations applied/pushed      | NO                                                                                                                                            |
| Auth changed                   | NO                                                                                                                                            |
| RLS changed                    | NO                                                                                                                                            |
| Storage policy changed         | NO                                                                                                                                            |
| Privileged secrets introduced  | NO                                                                                                                                            |
| Hosted web repository modified | NO tracked source changes; reference clone/fetch metadata only                                                                                |
| Tauri capabilities changed     | YES — initial configuration explicitly grants an empty capability set; no plugins, custom commands, SQL interface or privileged escape hatch. |

Production CSP uses `connect-src 'none'`. Development CSP permits only the local Vite/HMR endpoints needed for development. React owns this presentation; Rust only starts the application. No Supabase client, credentials, auth/session store, database, cache, outbox, offline sync, polling, background worker or product module exists in this scaffold. No previous desktop implementation or acceptance is active.

## Limitations and open questions

- Source inspection does not verify production behavior, deployed schema/migrations, RLS, RPC grants, Realtime publication rules, Storage ownership, hosted tests or external integrations.
- Future desktop authentication transport, token lifecycle, origin/CORS/CSRF behavior, per-role/per-branch permissions and mutation idempotency remain unresolved and outside Stage 00.
- Customer-sharing rules, attendance cross-branch completion, schedule subscription authorization and failure-versus-empty handling require explicit later verification; see the module inventory.
- Exact Settings/Home Service scope and a missing Customers UI reference need owner decisions during their later authorized stages.
- Only the observed native initial window was checked. Multi-viewport module behavior, extensive keyboard/screen-reader testing, long-running stability, installed/release/signed builds and updater behavior were NOT RUN.
- Three focused frontend boundary tests exist; Rust has no authored tests. Passing checks do not constitute owner acceptance or independent review. Rust 1.98 was tested; the declared minimum Rust version was not separately exercised.
- Binary hosted media and full history were not needed for this source audit. Local Node 25 is outside the hosted project's declared Node 24 range; the hosted application was not run.
- No CI execution, production operation or post-installation environment was observed. Base UI, CVA and Motion are documented as compatible future additions, not unused parallel implementations.

## Original pre-merge rollback record

This paragraph records the pre-merge rollback option; switching to main no longer selects the old baseline after the authorized merge. No post-merge rollback is authorized or executed.

Original pre-merge instructions: after confirming a clean desktop tree with `git -C E:\Cradle-Destop-Client status --short --branch`, the safe local rollback is `git -C E:\Cradle-Destop-Client switch main`. Confirm `git -C E:\Cradle-Destop-Client rev-parse HEAD` equals BASE_SHA `280e4afd5e304c00b7d98f2c1106a016ca484076`.

This selects the already-pushed governance baseline and preserves the unmerged stage branch and commits for review. It neither deletes unrelated user files nor changes the hosted repository or remote history. If there are unexpected local modifications, stop rather than resetting, cleaning or overwriting them. No database rollback is needed because no database operation occurred.

## Owner acceptance addendum — 2026-09-05 (record at acceptance, before merge)

Authority: the owner's explicit Stage 00 Owner Acceptance Recording instruction, identifying reviewed HEAD `9ecbbce6343ce2d6208dedceb7b51230c6f2181f` and BASE_SHA `280e4afd5e304c00b7d98f2c1106a016ca484076`. The instruction records successful independent GitHub review and explicit owner confirmation. This documentation update does not represent a new review performed by the recording agent.

Stage 00 = **OWNER CONFIRMED / ACCEPTED PENDING MERGE**.

### OWNER-PROVIDED MANUAL RUNTIME EVIDENCE

On 2026-09-05 the owner launched and visually inspected the actual CradleHub Desktop Windows application and confirmed the Stage 00 initialization screen. The owner confirmed:

- CradleHub Desktop
- Application initialized
- Authentication — Not authenticated
- Connection — Not established
- CRM unavailable until authentication is introduced in a later authorized stage

The owner observed no fake CRM records, fake Live state, fake sync-success state, demo counter, sample dashboard or operational controls. The owner explicitly CONFIRMS Stage 00.

No additional runtime facts are inferred. No screenshot was supplied with this owner instruction; no owner screenshot path is invented. The existing repository-recorded native screenshot and observation remain unchanged and are not relabeled as the owner's capture. Authentication, CRM functionality, production connectivity and synchronization remain unverified and unimplemented.

### Acceptance-update files and checks

Only these nine Markdown files change from the prior reviewed HEAD:

- `docs/50-state/CURRENT_STATE.md`
- `docs/50-state/CURRENT_TASK.md`
- `docs/50-state/LAST_VERIFIED_GATE.md`
- `docs/50-state/HANDOFF.md`
- `docs/50-state/evidence/stage-00-initialization.md`
- `README.md` — align the active status and document the unchanged pre-acceptance scanner limitation.
- `CHATGPT_PROJECT_RULES.md` — align only the current-stage truth paragraph.
- `docs/10-architecture/WEB_CONTRACT_INVENTORY.md` — align only its current desktop status line; source findings unchanged.
- `docs/10-architecture/DESKTOP_BOUNDARY.md` — align only its status line; technical boundary unchanged.

Preflight commands and observed results from `E:\Cradle-Destop-Client`:

| Command                                                    | Result                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `git branch --show-current`                                | `stage/00-initialization`                                                                   |
| `git status --short --branch`                              | Clean: `## stage/00-initialization...origin/stage/00-initialization`                        |
| `git rev-parse HEAD`                                       | `9ecbbce6343ce2d6208dedceb7b51230c6f2181f` before edits                                     |
| `git remote -v`                                            | Fetch/push origin exactly `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git` |
| `git fetch origin --prune`                                 | Exit 0                                                                                      |
| `git rev-parse origin/main origin/stage/00-initialization` | BASE_SHA and prior reviewed HEAD respectively; no unexplained change                        |

Documentation checks: `pnpm format:check` and `git diff --check` exit 0. The final diff is reviewed against the nine-file allowlist, and `git diff --name-only 9ecbbce6343ce2d6208dedceb7b51230c6f2181f...HEAD` is verified after commit. Final status and pushed HEAD are reported after the documentation commit. No application build or runtime test is rerun for this documentation-only update. The unchanged `scripts/verify-stage00.mjs` asserts pre-acceptance state; it is NOT RUN for this update and its earlier successful result applies only to the original reviewed initialization snapshot. Updating that script is outside this documentation-only authorization.

Acceptance-update impact: no runtime/source/Rust, dependency, Tauri configuration/capability, hosted source, production data, database schema/migration, Auth, RLS, Storage or secret change. Existing evidence assets and raw logs are unchanged. Main remains BASE_SHA, and no merge or new branch is created.

## Authorized merge and closure addendum

Authority: the owner's explicit Stage 00 Authorized Merge instruction identifies accepted stage HEAD `0526bf50ff50a748191dec04a76116cddb649c5d` and pre-merge main `280e4afd5e304c00b7d98f2c1106a016ca484076`, permits an explicit merge and documentation closure only, and does not authorize Stage 01.

Preflight confirmed a clean working tree, exact desktop fetch/push origin `https://github.com/techwithmpg/cradlehub-desktop-Client_app.git`, remote main equal to BASE_SHA and remote stage equal to the accepted HEAD after `git fetch origin --prune`. `git log --oneline --decorate --graph --all -n 15` showed only the three reviewed stage commits above the baseline. `git diff --stat origin/main...origin/stage/00-initialization` showed the 65 reviewed Stage 00 paths. `git merge-base origin/main origin/stage/00-initialization` returned BASE_SHA.

`git switch main` succeeded; `git pull --ff-only origin main` exited 0, already up to date. `git merge --no-ff origin/stage/00-initialization -m "merge: accept Stage 00 greenfield initialization"` exited 0 without conflicts, squash or rebase. Merge commit: **`b16593d6d1ea873b5d4d10eac99d21cbb400e9a6`**. Its parents are BASE_SHA and accepted stage HEAD respectively. `git diff --exit-code 0526bf50ff50a748191dec04a76116cddb649c5d b16593d6d1ea873b5d4d10eac99d21cbb400e9a6` exited 0: the merged tree exactly equals the accepted tree before closure documentation.

Only these post-merge documentation files change: `README.md`, `CHATGPT_PROJECT_RULES.md`, `docs/10-architecture/DESKTOP_BOUNDARY.md`, `docs/10-architecture/WEB_CONTRACT_INVENTORY.md`, `docs/50-state/CURRENT_STATE.md`, `docs/50-state/CURRENT_TASK.md`, `docs/50-state/LAST_VERIFIED_GATE.md`, `docs/50-state/HANDOFF.md`, and this evidence record. The extra active-document status lines are aligned without changing technical findings, runtime, configuration or dependencies.

### Post-merge check results

The following checks were newly run after the authorized merge. Frontend/Git commands ran from `E:\Cradle-Destop-Client`; Cargo commands ran from `E:\Cradle-Destop-Client\src-tauri`.

| Exact command                                        | Observed result                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `git diff --check`                                   | Exit 0; No whitespace errors.                                                                    |
| `pnpm format:check`                                  | Exit 0; All matched files use Prettier code style.                                               |
| `pnpm lint`                                          | Exit 0; ESLint completed with zero warnings permitted.                                           |
| `pnpm typecheck`                                     | Exit 0; TypeScript check completed without diagnostics.                                          |
| `pnpm test`                                          | Exit 0; Vitest 5.0.0: one file, three tests passed.                                              |
| `pnpm build`                                         | Exit 0; Vite 8.2.2 production renderer build: 1,834 modules transformed.                         |
| `cargo fmt --check`                                  | Exit 0; Rust formatting clean.                                                                   |
| `cargo check --locked`                               | Exit 0; Development check completed.                                                             |
| `cargo test --locked`                                | Exit 0; Library, binary and doc-test targets completed; zero authored Rust tests, zero failures. |
| `cargo clippy --locked --all-targets -- -D warnings` | Exit 0; Strict all-targets Clippy completed without warnings.                                    |

`git status --short --branch` before the closure commit showed `main...origin/main [ahead 4]` with exactly the nine intended Markdown modifications and no untracked files. `git log --oneline --decorate -n 10` showed merge `b16593d`, accepted stage `0526bf5`, its reviewed predecessors and baseline `280e4af`. The closure diff was inspected; all non-document source/configuration/dependency/evidence-asset files remain identical to accepted stage HEAD. Formatting and whitespace checks are repeated after this results entry before the documentation commit. Commit/push and final remote SHA verification are reported in the delivery response.

No new visual runtime observation is made or inferred; accepted runtime files are unchanged. The original scanner's pre-acceptance state/stage-branch assertions do not apply to main; it is not rerun or changed during this closure.

### Closure impact and delivery

Stage 00 is **ACCEPTED / MERGED** on main. Production data, database/schema, migrations, Auth, RLS, Storage, hosted source, runtime implementation after acceptance, dependencies, Tauri capabilities and privileged secrets: **NO changes** in this merge/closure task. Prior native evidence assets and owner observation text remain unchanged. The stage branch is preserved, with no deletion or force-push. Final remote main SHA is recorded in the delivery report after committing closure documentation and pushing main.

## Gate and next permitted action

Stage 00 is closed. Stop after the authorized merge/closure is pushed and reported. Stage 01, a new stage branch, authentication, branch context, canonical shell work and every product module remain **NOT AUTHORIZED**. The next action requires new explicit owner authorization.

STAGE 00 MERGED AND CLOSED — MAIN UPDATED — STAGE 01 NOT AUTHORIZED
