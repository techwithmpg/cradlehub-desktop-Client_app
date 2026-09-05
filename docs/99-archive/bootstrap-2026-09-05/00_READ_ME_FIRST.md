# CradleHub Desktop — Greenfield Bootstrap

**Effective:** 2026-09-05  
**Mode:** GREENFIELD FUNCTIONAL REBUILD

This package resets CradleHub Desktop governance without inheriting implementation claims from any previous desktop repository.

## What this package is for

Use it to start a new Windows desktop CRM client that connects to the existing CradleHub online system while preserving server-side authority, Supabase authorization, and the existing web application.

It gives you:

1. a copy/paste initialization prompt for a coding agent;
2. project-chat rules for ChatGPT;
3. a strict build → push → Git review → fix → owner-confirm → stop workflow;
4. fresh current-state documents with **no inherited PASS claims**;
5. an initial stage roadmap;
6. an audit of the uploaded legacy desktop docs;
7. the eight approved CRM reference images supplied on 2026-09-05.

## First use

### A. In this ChatGPT Project
Copy the contents of:

`CHATGPT_PROJECT_RULES.md`

into the Project Instructions / project rules.

### B. On the Windows development machine
Open your coding agent in the parent directory where the new desktop project should live and paste:

`INITIALIZATION_AGENT_PROMPT.md`

Replace the placeholders at the top before running it.

### C. Stop after Stage 00
The agent must push the Stage 00 branch if a desktop remote is configured, report its base/head SHAs, and stop.

Then return to ChatGPT and say, for example:

> Review Stage 00 for `<owner>/<desktop-repo>`, branch `stage/00-initialization`. Do not merge. Compare it to main, inspect the diff and evidence, and tell me whether changes are required or it is acceptable for owner confirmation.

Do not authorize Stage 01 until Stage 00 has passed review and you explicitly confirm it.

## Important reset rule

Anything describing an older desktop Stage 1/2/3/UI-R* PASS, a previous native runtime, a Foundation Showcase, an older shell, or prior local SQLite/session implementation is **historical evidence only**.

The greenfield project's first current implementation truth begins when Stage 00 is actually created and reviewed.
