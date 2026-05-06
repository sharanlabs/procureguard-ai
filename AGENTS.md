# ProcureGuard AI — Agent Instructions

## Non-negotiable architecture

ProcureGuard AI uses Gemini API as the application AI stack.

Codex is only the repository editing assistant. Codex may inspect files, edit code, run commands, and verify tests, but it must not change the product AI stack unless the user explicitly requests a provider migration.

Do not:
- Replace Gemini API with OpenAI runtime APIs
- Add LangChain, CrewAI, AutoGen, or other agent frameworks
- Add RAG or vector databases
- Add a Python backend
- Convert this project into an autonomous agent
- Add real email sending
- Add database persistence unless a later stage explicitly requests it

Use:
- Gemini API
- Prompt chaining
- Structured Outputs with JSON schema
- Existing prompt files in /prompts
- Existing eval harness in /evals
- Human-in-the-loop review labels
- DRAFT-only communications

## Workflow

Work stage by stage. Do not skip verification.

Before implementation:
- inspect current repo state
- confirm working tree status
- confirm relevant source files exist

After every completed stage:
- update progress.md
- update docs/HANDOFF.md
- run required checks
- keep git working tree clean

## Verification commands

Use these when relevant:

```bash
node evals/run_evals.js
npm run build
git status --short
```
