# Migration from Uploaded Legacy Desktop Docs

Do not overwrite the old package.

If importing it into the new desktop repo:

1. extract it to a temporary location;
2. copy the full historical contents unchanged to:
   `docs/99-archive/pre-greenfield-2026-09-05/`;
3. do not copy its old `docs/50-state/*` into active state;
4. do not copy old stage PASS claims into active roadmap/gates;
5. do not reuse old desktop implementation code;
6. re-evaluate old ADRs before adopting any of them;
7. keep the new greenfield active docs authoritative.

This preserves evidence without contaminating current implementation truth.
