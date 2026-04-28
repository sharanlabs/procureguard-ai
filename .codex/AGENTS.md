# ProcureGuard AI — Codex Workflow Guard

- Confirm scope before editing.
- Read the listed files before making changes.
- Keep each stage narrow and avoid unrelated fixes.
- Respect protected files from the prompt.
- Preserve HITL constraints: DRAFT-only communications, no Send button, no automatic approval/payment language, and no fraud accusation language.
- Preserve Claude as the runtime AI stack.
- Preserve the Vercel /api/messages path and server-side production API key handling.
- Preserve 25/25 evals unless the stage explicitly updates test expectations.
- Run required verification before committing.
- Report unexpected repo findings, scope drift risks, and protected-file changes.
- Do not override Codex IDE model, reasoning, sandbox, approval, or execution settings.
