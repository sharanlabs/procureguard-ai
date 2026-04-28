# ProcureGuard Codex Workflow Guard

- Use GSD-style staged execution: confirm scope, read the listed files, implement narrowly, verify, then commit only after checks pass.
- Use Superpowers-style verification before completion: test the claimed behavior, inspect diffs, and report any unverified risk plainly.
- Run PEEC/Observer-style gotcha checks for protected files, hidden product behavior changes, unsafe wording, secret exposure, and scope drift.
- Respect each stage's protected files. Do not touch `app/`, `api/`, `prompts/`, `data/`, eval harness/data, package files, Vite config, or docs outside scope unless the stage explicitly allows it.
- Preserve ProcureGuard invariants: Claude runtime stack, Anthropic Messages API, Vercel `/api/messages`, current prompt chain, prompt caching, strict evals at 25/25, and human-in-the-loop review labels.
- Preserve HITL constraints: DRAFT-only communications, no Send button, no autonomous approval/payment language, and no fraud accusation language.
- Keep unexpected repo findings separate as Known issues instead of silently fixing them.
- Before committing, verify product checks requested by the stage and confirm no runtime product files changed during tooling-only work.
