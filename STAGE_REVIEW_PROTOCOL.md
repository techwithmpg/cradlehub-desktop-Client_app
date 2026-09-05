# CradleHub Desktop — Stage Review Protocol

This is the permanent development loop after Stage 00.

## Branch state

Accepted baseline:

`main`

Implementation:

`stage/<nn>-<slug>`

Correction to accepted baseline:

`fix/<slug>`

One authorized working branch at a time.

## Agent cycle

The coding agent:

1. fetches `origin/main`;
2. records the accepted base SHA;
3. creates/continues the one authorized branch;
4. inspects business/data/authorization contracts;
5. implements only authorized scope;
6. runs focused checks;
7. runs stage gate checks;
8. updates evidence;
9. pushes;
10. stops.

## Independent ChatGPT review

After push, the owner asks ChatGPT to review.

ChatGPT checks GitHub itself and does not simply accept the agent's summary.

Minimum review:

- branch identity;
- branch base;
- base/head comparison;
- changed files;
- out-of-scope changes;
- diff;
- relevant contract files;
- tests/workflow state;
- active-state/evidence consistency;
- secrets/authorization impact;
- fake/demo data paths;
- duplicate UI-system risk;
- disabled/unconnected actions;
- rollback quality.

## Review outcomes

Only:

### `CHANGES REQUIRED`

Use when any material problem exists.

The agent fixes the **same branch**, pushes, and stops.

Then ChatGPT reviews again.

### `ACCEPTABLE FOR OWNER CONFIRMATION`

Use only when the branch is internally coherent and the evidence supports the claims.

This does not itself merge anything and does not equal production verification.

## Owner gate

The owner explicitly confirms the stage.

Examples:

- `Confirm Stage 03.`
- `Accept and save this stage.`
- `This gate is approved; prepare merge.`

Only after explicit owner confirmation may accepted-state docs be finalized/merged.

## Merge

A merge is a separate action.

Do not infer permission to merge from:

- green tests;
- agent PASS;
- ChatGPT acceptable review;
- a previous stage's permission.

If the owner asks ChatGPT to merge, re-check head SHA immediately before merging.

## Post-merge

After merge:

1. resolve accepted main SHA;
2. verify branch landed as expected;
3. update/reconcile current-state docs if not already part of the accepted commit strategy;
4. report accepted SHA;
5. stop.

Do not create the next stage branch automatically.

## Suggested owner review prompt

```text
Review CradleHub Desktop Stage <NN> in <owner/repo>, branch <stage-branch>.

Do not merge.

Use GitHub directly. Resolve current main and the branch head, compare them, inspect all changed files and the evidence record, and verify scope, architecture boundaries, security/data impact, tests, truthful runtime claims, and docs consistency.

Treat the coding agent's summary as untrusted until Git confirms it.

Return only one gate outcome:
- CHANGES REQUIRED
- ACCEPTABLE FOR OWNER CONFIRMATION

If changes are required, give a precise fix list for the same branch.
Do not authorize the next stage.
```
