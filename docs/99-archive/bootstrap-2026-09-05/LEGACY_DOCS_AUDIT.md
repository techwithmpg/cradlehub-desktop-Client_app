# Uploaded Legacy Desktop Docs Audit

Input audited:

`docs.zip` supplied on 2026-09-05.

## Conclusion

The uploaded package has a useful documentation taxonomy and several sound safety principles, but its active-state material cannot be reused as current truth for the greenfield rebuild.

## Useful structure to retain

The directory model remains useful:

- `docs/00-governance`
- `docs/10-architecture`
- `docs/20-product`
- `docs/30-delivery`
- `docs/40-decisions`
- `docs/50-state`
- `docs/99-archive`

Strong concepts worth carrying forward include:

- small mandatory AI context;
- one canonical UI system;
- source-of-truth precedence;
- stage gates;
- definition of done;
- explicit security boundaries;
- evidence records;
- current-state/handoff separation;
- stop-after-gate discipline.

## Why the active package must be reset

The uploaded active docs contain implementation-state assertions from the previous desktop effort, including examples such as:

- `Stage 2 — Native Local-Data Foundation — PASS`;
- `UI-R0`, `UI-R1`, and `UI-R2` complete/PASS;
- old current task pointing to a canonical shell;
- old handoff describing SQLite schema/runtime verification;
- previous Foundation Showcase/runtime history;
- old branch and SHA references;
- old Stage 3 secure-storage/auth/sync work.

Those claims are historical evidence under the new GREENFIELD FUNCTIONAL REBUILD rule.

They must not appear in active `CURRENT_STATE`, `CURRENT_TASK`, `LAST_VERIFIED_GATE`, `ROADMAP`, or stage authorization.

## Migration policy

Preserve the original legacy docs unchanged under:

`docs/99-archive/pre-greenfield-2026-09-05/`

Then create fresh active governance/state documents.

Do not selectively delete old evidence.

Do not silently promote an old desktop ADR into active architecture. If an old decision still appears correct, re-evaluate it against the current hosted system and adopt/supersede it explicitly in the greenfield repository.
