# ProcureGuard AI

Intelligent 3-way procurement matching workflow. Takes PO, Invoice, and GRN data, runs through a 3-step Claude API prompt chain with gate checks, produces exception analysis with reasoning transparency, severity classification, drafted communications, tolerance simulator, root cause analysis, and executive dashboard.

## Tech Stack

- **AI**: Claude API with runtime model routing (Haiku 4.5 / `claude-haiku-4-5-20251001` for matching; Sonnet 4.6 / `claude-sonnet-4-6` for classification and action generation). Opus is not used in the current runtime pipeline.
- **API features**: Structured Outputs (`anthropic-beta: structured-outputs-2025-11-13`), adaptive thinking, prompt caching
- **Frontend**: React (JSX), single-file artifact pattern
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts
- **Data**: JavaScript in-browser CSV parsing
- **Deployment**: Vercel with API key as env var

## Key Directories

- `/data` — sample CSVs and data dictionary
- `/prompts` — system prompts for the 3-stage pipeline plus the auxiliary text extraction prompt
- `/app` — React application
- `/app/lib` — Claude client helpers, schemas, CSV parsing, pipeline utilities, and view models
- `/api` — Vercel serverless Claude proxy
- `/evals` — golden dataset and evaluation harness
- `/docs` — handoff history and planned future reference docs

## Code Style

- ES modules (`import/export`), not CommonJS
- Destructure imports
- Tailwind utility classes, no inline styles
- Conventional commits: `type(scope): message`
- All API calls use Structured Outputs with JSON schema
- All drafted emails labeled "DRAFT - awaiting review"

## Definition of Done

- All evals pass (`run_evals.js` returns 100% on golden dataset)
- No JSON parse errors (Structured Outputs guarantees this)
- HITL labels enforced (no "Send" buttons, only "Approve & Queue")
- Audit trail captures every AI decision
- No linting errors

## Do NOT

- Use LangChain, CrewAI, or any agent framework
- Add a Python backend
- Use RAG or vector databases
- Add unnecessary dependencies
- Over-engineer — this is a prompt chaining workflow, not an agent

## Reference Files

- `@PRD.md` for product requirements
- `@data/DATA_DICTIONARY.md` for data schema
- `@docs/HANDOFF.md` for stage handoff history
- Architecture documentation is planned for the documentation package.

## Git Workflow

- Single main branch
- Commit after each completed deliverable
- Format: `feat|fix|docs|refactor|test|chore(scope): message`
