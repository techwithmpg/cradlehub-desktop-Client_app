# CradleHub Desktop Agent Rules

Read:

1. `docs/00-governance/AI_START_HERE.md`
2. `CHATGPT_PROJECT_RULES.md`
3. `docs/50-state/CURRENT_STATE.md`
4. `docs/50-state/CURRENT_TASK.md`

before substantial work.

Hard rules:

- one explicitly authorized stage at a time;
- no routine implementation on `main`;
- no fake normal-runtime CRM data/status/success;
- no second UI system;
- no privileged secrets in renderer/bundle;
- no schema/production-data mutation without explicit target-aware authorization;
- no inherited PASS from any previous desktop repo;
- push and stop for independent review;
- completion never authorizes the next stage.
