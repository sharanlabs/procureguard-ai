# ProcureGuard AI — Handoff Log

## Current Runtime Snapshot — May 6, 2026

- Current application AI stack: Gemini API through the Vercel/serverless proxy in `api/messages.js`.
- Current approved model: `gemini-2.5-flash`.
- Current validation gates: `node evals/run_evals.js` and `npm run build`.
- Historical sections below mention earlier Claude/Anthropic work. Treat those as implementation history, not the current runtime contract.

## Stage 2 closeout handoff — April 25, 2026

### Stage completed
Stage 2 — Prompt Engineering

### Current repo state
- Branch: main
- Local main synced with origin/main at inspection time
- Working tree had one untracked eval result file from inspection

### Files confirmed present
- prompts/01_matching.md
- prompts/02_classification.md
- prompts/03_action_generation.md
- prompts/04_text_extraction.md
- evals/golden_dataset.json
- evals/run_evals.js
- progress.md

### Eval result
- Command: node evals/run_evals.js
- Result: 25/25 PASS, 100%
- Latest result file: evals/results/eval_results_2026-04-25T20-43-52-665Z.json

### Stage 2 commits already pushed
- 96228c5 feat(skills): add Claude Code skills and progress tracker
- 1bdf418 test(evals): add golden dataset and eval harness, all passing
- 962c881 feat(prompts): add 04_text_extraction.md for unstructured invoice parsing
- a5e876b feat(prompts): add 03_action_generation.md with email templates and routing rules
- 2ce5efd feat(prompts): add 02_classification.md with tier definitions and tolerance thresholds
- 93a5442 feat(prompts): add 01_matching.md system prompt with 5 few-shot examples
- 511b991 docs(decisions): add DECISIONS.md stub with first entry

### Known issues
- docs/HANDOFF.md was missing before this cleanup
- The latest eval result file was untracked before this cleanup

### Next stage
Stage 3.1 — Project initialization with v1.1 patches.

Stage 3 must preserve:
- Claude API runtime architecture
- prompt chaining workflow
- package-lock.json committed after npm install
- React Error Boundary
- stronger CSV parsing edge cases
- Vercel proxy improvements
- no API key logging

## Stage 3.1 handoff — April 25, 2026

### Stage completed
Stage 3.1 — Project initialization

### Files created or modified
- package.json
- package-lock.json
- vite.config.js
- index.html
- .gitignore
- app/main.jsx
- app/styles.css
- app/ErrorBoundary.jsx
- app/ProcureGuard.jsx
- api/messages.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T21-05-47-133Z.json

### Commands run
- npm install
- npm run build
- node evals/run_evals.js
- git status --short

### Verification results
- npm install completed successfully; package-lock.json generated
- npm run build completed successfully with Vite production output
- node evals/run_evals.js completed successfully: 25/25 procurement tests passed, 100% pass rate
- git status --short reviewed before staging Stage 3.1 files

### Known issues
- None for Stage 3.1
- app/ProcureGuard.jsx is intentionally a placeholder and will be replaced or expanded in Stage 3.2
- Stronger CSV parsing edge cases are planned for Stage 3.2, not Stage 3.1

### Next step
Stage 3.2 — Core application shell and prompt-chain orchestration

### Notes
- package-lock.json was generated and committed as part of Stage 3.1
- Claude API remains the application AI stack
- The production proxy at api/messages.js uses ANTHROPIC_API_KEY and does not log secrets

## Stage 3.2 handoff — April 25, 2026

### Stage completed
Stage 3.2 — Core application shell and prompt-chain orchestration

### Files created or modified
- app/ProcureGuard.jsx
- app/lib/audit.js
- app/lib/claude.js
- app/lib/csv.js
- app/lib/format.js
- app/lib/schemas.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T21-16-25-091Z.json

### Commands run
- git status --short
- npm run build
- node evals/run_evals.js
- node --check api/messages.js

### Verification results
- Initial git status was clean before editing
- node --check api/messages.js passed
- npm run build passed with Vite production output
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- New eval result file: evals/results/eval_results_2026-04-25T21-16-25-091Z.json

### Known issues
- No live Claude API call was run during this stage
- Stage 4 features are intentionally not implemented yet: tolerance simulator, root cause analysis, Recharts dashboard, ROI calculator, supplier scorecard, and dark mode polish

### Next step
Stage 3.3 — Review and hardening

### Notes
- api/messages.js did not need changes for Stage 3.2
- The Stage 3.1 production proxy remains the production Claude API path
- Local development can pass a session-only API key through the Vite proxy
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 3.3 handoff — April 25, 2026

### Stage completed
Stage 3.3 — API proxy, security, and hardening review

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/csv.js
- app/lib/schemas.js
- app/lib/audit.js
- api/messages.js
- vite.config.js
- package.json

### Files changed
- app/lib/claude.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T21-21-43-423Z.json

### Commands run
- git status --short
- grep -R "localStorage" app api
- grep -R "console.log" app api
- grep -R "Send" app
- node --check api/messages.js
- npm run build
- node evals/run_evals.js

### Verification results
- Initial git status was clean before editing
- grep checks found no localStorage usage, no console.log usage, and no "Send" text in app files
- node --check api/messages.js passed
- npm run build passed with Vite production output
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- New eval result file: evals/results/eval_results_2026-04-25T21-21-43-423Z.json

### Known issues
- No live Claude API call was run during this hardening pass
- Stage 4 features are not implemented yet

### Next step
Stage 4 — Differentiators

### Notes
- app/lib/claude.js was hardened to treat browser TimeoutError responses as 60-second Claude API timeouts
- api/messages.js already used process.env.ANTHROPIC_API_KEY only and did not need changes
- vite.config.js already proxies local /api/messages traffic to https://api.anthropic.com/v1/messages and does not hard-code an API key
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 4.1 handoff — April 25, 2026

### Stage completed
Stage 4.1 — Glass-box reasoning cards

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/format.js
- app/lib/audit.js
- data/DATA_DICTIONARY.md

### Files changed
- app/ProcureGuard.jsx
- app/lib/format.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T21-46-01-092Z.json
- evals/results/eval_results_2026-04-25T21-47-04-563Z.json

### Commands run
- git status --short
- git branch -vv
- npm run build
- node evals/run_evals.js
- grep -R "Send" app
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main aligned with origin/main at d66038f
- npm run build passed with Vite production output
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep -R "Send" app returned no matches
- New eval result file: evals/results/eval_results_2026-04-25T21-47-04-563Z.json

### Known issues
- No live Claude API call was run during this stage
- None for Stage 4.1

### Next step
Stage 4.2 — What-if tolerance simulator

### Notes
- Stage 4.2 and Stage 4.3 are intentionally not implemented yet
- No Send button or real email sending exists
- Tier 2 approvals and Tier 3 action notes are stored only in local component state
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 4.2 handoff — April 25, 2026

### Stage completed
Stage 4.2 — What-if tolerance simulator

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/format.js
- data/DATA_DICTIONARY.md

### Files changed
- app/ProcureGuard.jsx
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T21-57-01-707Z.json

### Commands run
- git status --short
- git branch -vv
- npm run build
- node evals/run_evals.js
- grep -R "Send" app
- git diff --check
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main aligned with origin/main at 544bccd
- npm run build passed with Vite production output
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep -R "Send" app returned no matches
- git diff --check passed
- New eval result file: evals/results/eval_results_2026-04-25T21-57-01-707Z.json

### Known issues
- No live Claude API call was run during this stage
- None for Stage 4.2

### Next step
Stage 4.3 — Root cause analysis

### Notes
- Stage 4.3 root cause analysis is intentionally not implemented yet
- Stage 5 dashboard, charts, ROI calculator, supplier scorecard, and dark mode are intentionally not implemented yet
- The simulator is client-side only and does not call Claude
- The simulator does not mutate actual Claude classifications, audit records, drafts, or review controls
- No Send button or real email sending exists
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 4.3 handoff — April 25, 2026

### Stage completed
Stage 4.3 — Root cause analysis

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/format.js
- data/DATA_DICTIONARY.md

### Files changed
- app/ProcureGuard.jsx
- app/lib/rootCause.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-25T22-04-41-927Z.json
- evals/results/eval_results_2026-04-25T22-05-27-899Z.json

### Commands run
- git status --short
- git branch -vv
- npm run build
- node evals/run_evals.js
- grep -R "Send" app
- grep -R "fraud" app
- git diff --check
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main aligned with origin/main at 82ffbf9
- npm run build passed with Vite production output
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep -R "Send" app returned no matches
- grep -R "fraud" app returned no matches
- git diff --check passed
- New eval result file: evals/results/eval_results_2026-04-25T22-05-27-899Z.json

### Known issues
- No live Claude API call was run during this stage
- None for Stage 4.3

### Next step
Stage 5 — Dashboard and polish

### Notes
- Stage 5 dashboard, charts, ROI calculator, supplier scorecard, and dark mode are intentionally not implemented yet
- Root cause analysis is client-side only and does not call Claude
- Root cause wording avoids overclaiming and uses pattern-oriented review language
- No Send button or real email sending exists
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 5.1 handoff — April 26, 2026

### Stage completed
Stage 5.1 — Executive dashboard and analytics polish

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- package.json
- app/ProcureGuard.jsx
- app/lib/audit.js
- app/lib/rootCause.js

### Files changed
- app/ProcureGuard.jsx
- app/lib/dashboard.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T00-12-35-689Z.json

### Commands run
- git status --short
- git branch -vv
- npm run build
- node evals/run_evals.js
- grep -R "Send" app
- grep -R "fraud" app
- grep -R "Guaranteed savings\\|Recovered money\\|Fraud detected\\|Automated approval\\|AI decided" app
- git diff --check
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main aligned with origin/main at 66067ae
- npm run build passed with Vite production output
- npm run build emitted a Vite chunk-size warning after adding Recharts; build exit code was 0
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep checks found no Send text, no fraud text, and no avoided dashboard claims in app files
- git diff --check passed
- New eval result file: evals/results/eval_results_2026-04-26T00-12-35-689Z.json

### Known issues
- No live Claude API call was run during this stage
- The Recharts dashboard increases the production JS chunk enough for Vite to warn about bundle size
- ROI calculator, dark mode, and deployment docs remain intentionally out of scope

### Next step
Stage 5.2 — Final hardening and deployment readiness

### Notes
- Dashboard uses enterprise AP/procurement language: Exposure Identified, Estimated Recovery, AI-assisted review, Policy simulation, Requires human review
- Existing Stage 4 panels remain visible and ordered after the dashboard
- Charts are limited to batch disposition, exposure risk drivers, and exposure by review path; supplier and warehouse details use dense tables
- No Send button or real email sending exists
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 5.2 handoff — April 26, 2026

### Stage completed
Stage 5.2 — UI polish, responsive layout, dark mode, accessibility

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/dashboard.js
- app/lib/format.js
- app/lib/rootCause.js
- app/styles.css
- package.json
- data/DATA_DICTIONARY.md

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T00-27-08-900Z.json

### Commands run
- git status --short
- git branch -vv
- wc -l app/ProcureGuard.jsx
- npm run build
- node evals/run_evals.js
- grep -R "Send" app
- grep -R "localStorage" app
- grep -R "Guaranteed\\|guaranteed\\|Recovered money\\|automated approval\\|fraud detected\\|AI decided" app
- grep -R "dark\\|Dark\\|sessionStorage" app
- grep -R "aria-label\\|focus-visible\\|sr-only" app
- git diff --check
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main ahead of origin/main by the Stage 5.1 commit; user instructed Codex to continue checking the code
- app/ProcureGuard.jsx was reduced below the 1200-line maintenance threshold by moving dashboard and root-cause presentation into app/ProcureGuardDashboard.jsx
- npm run build passed with Vite production output
- npm run build emitted the existing Vite chunk-size warning from the Recharts dashboard; build exit code was 0
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep checks found no Send button text, no localStorage usage, and no prohibited enterprise claims in app files
- dark mode and accessibility checks found expected dark/sessionStorage and aria/focus-visible markers
- git diff --check passed
- New eval result file: evals/results/eval_results_2026-04-26T00-27-08-900Z.json

### Known issues
- No live Claude API call was run during this stage
- The Recharts dashboard continues to trigger a Vite production chunk-size warning
- Stage 6 documentation and deployment work is intentionally not implemented yet

### Next step
Stage 6 — Documentation and deployment

### External design suggestions reviewed
- Suggestion summary: User-provided enterprise SaaS dashboard direction emphasizing clarity, restrained visuals, semantic severity colors, responsive layout, and cautious AI operations language.
  Decision: adopted.
  Reason: Fits Stage 5.2 scope and ProcureGuard's enterprise AI procurement direction.
- Suggestion summary: Deployment documentation and final testing work.
  Decision: deferred.
  Reason: Explicitly reserved for Stage 6 and Stage 7.

### Notes
- Dark mode preference is stored only in sessionStorage
- Dashboard, tolerance simulator, root-cause analysis, exception cards, draft panels, audit trail, and token governance use responsive light/dark surfaces
- Stage 4 glass-box order remains summary, reasoning, confidence
- No Send button or real email sending exists
- Claude remains the runtime AI stack
- Codex was only used as the repo editing assistant

## Stage 5 corrective handoff — April 26, 2026

### Reason for corrective patch
Initial local Stage 5 commits built successfully but only partially matched the updated enterprise dashboard acceptance target.

### Files reviewed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/dashboard.js
- app/lib/format.js
- app/styles.css
- progress.md
- docs/HANDOFF.md

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/dashboard.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T01-25-39-837Z.json
- evals/results/eval_results_2026-04-26T01-25-40-268Z.json
- evals/results/eval_results_2026-04-26T02-39-26-971Z.json

### Commands run
- git status --short
- git branch -vv
- git log --oneline origin/main..HEAD
- npm run build
- wc -l app/ProcureGuard.jsx
- node evals/run_evals.js
- grep -R "Send" app
- grep -R "localStorage" app
- grep -R "Guaranteed\\|guaranteed\\|Recovered money\\|automated approval\\|fraud detected\\|AI decided" app
- grep -R "Match Rate\\|Exceptions Found\\|Exposure Identified\\|Estimated Recovery" app
- grep -R "Exception Breakdown\\|Dollar Exposure by Exception\\|Supplier Exception Heatmap\\|Supplier Scorecard\\|ROI Estimate\\|Session Token Cost" app
- grep -R "Dashboard\\|Review Queue\\|Settings & Audit" app
- grep -R "h-32" app
- git diff --check
- git status --short

### Verification results
- Preflight git status had only the two expected untracked audit eval result files
- npm run build passed with Vite production output
- npm run build emitted the existing Recharts chunk-size warning; build exit code was 0
- node evals/run_evals.js passed: 25/25 procurement tests, 100% pass rate
- grep checks found no Send button text, no localStorage usage, and no prohibited enterprise claims in app files
- Required Stage 5 dashboard and workspace labels were present
- grep -R "h-32" app returned no matches after chart container fixes
- git diff --check passed
- New eval result file: evals/results/eval_results_2026-04-26T02-39-26-971Z.json

### Existing untracked audit eval files included
- evals/results/eval_results_2026-04-26T01-25-39-837Z.json
- evals/results/eval_results_2026-04-26T01-25-40-268Z.json

### Stage 5.1 fixes made
- KPI cards now match the updated acceptance target: Match Rate, Exceptions Found, Exposure Identified, and Estimated Recovery
- Estimated Recovery now uses total exposure multiplied by 0.85
- Added Exception Breakdown frequency chart
- Added Dollar Exposure by Exception chart
- Replaced warehouse heatmap with Supplier Exception Heatmap
- Supplier Scorecard now includes total invoices, clean matches, exceptions, match rate, total exposure, diversity certification, and risk level
- Added ROI Estimate panel
- Added Session Token Cost panel using audit token usage when available and a safe placeholder otherwise
- Dashboard calculations remain client-side only and do not call Claude

### Stage 5.2 fixes made
- Added segmented workspace navigation for Dashboard, Review Queue, and Settings & Audit
- Added Review Queue search, tier filter, supplier filter, exception filter, and sort controls
- Review queue filtering and sorting are client-side only and do not mutate original results
- Glass-box card order remains plain summary, reasoning, confidence
- HITL controls remain unchanged: Tier 2 can Approve & Queue, Tier 3 requires Action Taken notes

### Design suggestions adopted
- Exact enterprise dashboard KPI structure
- Horizontal exception charts with larger readable containers
- Supplier-centered exception heatmap
- More explicit ROI and token-cost governance
- Workspace navigation and review queue controls

### Design suggestions deferred
- Persistent sidebar
- Command palette
- Keyboard shortcuts
- Batch actions
- Stage 6 deployment documentation

### Known issues
- No live Claude API call was run during this corrective patch
- The Recharts dashboard continues to trigger a Vite production chunk-size warning

### Next step
Stage 6 — Documentation and deployment

### Notes
- Claude API remains the runtime AI stack
- Codex is only the repo editing assistant
- No Send button or real email sending exists

## Stage 6.1 handoff — April 26, 2026

### Stage completed
Stage 6.1 — Architectural decision log

### Files reviewed
- AGENTS.md
- CLAUDE.md
- README.md
- PRD.md
- DECISIONS.md
- progress.md
- docs/HANDOFF.md
- package.json
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/dashboard.js
- app/lib/claude.js
- api/messages.js
- prompts/01_matching.md
- prompts/02_classification.md
- prompts/03_action_generation.md
- prompts/04_text_extraction.md

### Files changed
- DECISIONS.md
- progress.md
- docs/HANDOFF.md

### Commands run
- git status --short
- git branch -vv
- grep -c "DECISION-" DECISIONS.md
- wc -l DECISIONS.md
- git diff --check
- git status --short

### Verification results
- Initial git status was clean before editing
- git branch -vv showed main aligned with origin/main at f98972a
- DECISIONS.md contains 20 decision entries
- git diff --check passed
- Final git status showed only the intended Stage 6.1 documentation files before commit

### Decision count
20

### Known issues
- No application code was changed
- No live Claude API call was run during this documentation stage
- Stage 6.2 documentation package is intentionally not created yet

### Next step
Stage 6.2 — Documentation package

### Notes
- Claude remains the runtime AI stack
- Codex is only the repo editing assistant
- No prompts, eval harness logic, CSV data, package files, or application code were changed

## API contract stabilization handoff — April 26, 2026

### Purpose
Fix local Anthropic API request and schema contract issues before documentation and deployment work.

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/schemas.js
- app/lib/csv.js
- app/lib/audit.js
- app/lib/format.js
- api/messages.js
- vite.config.js
- package.json

### Files changed
- app/lib/claude.js
- app/lib/schemas.js
- api/messages.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T03-46-10-978Z.json

### API issues addressed
- Anthropic direct-browser-access header requirement
- Rejected legacy structured-output shape using top-level output_config.type
- Rejected object schemas that allowed additionalProperties

### Structured output shape now used
- Frontend request construction is centralized in app/lib/claude.js
- Requests now use output_config.format.type = json_schema
- Requests no longer build the legacy top-level output_config type/schema shape

### Schema strictness fix
- app/lib/schemas.js now exports enforceNoAdditionalProperties
- app/lib/schemas.js now exports buildStructuredOutputConfig
- Matching, classification, and action schemas now recursively set additionalProperties: false for object schemas
- Vercel proxy defensively normalizes stale structured-output shapes before forwarding

### Proxy and header behavior
- Vite proxy continues to forward x-api-key only from the local browser session
- Vite proxy sets anthropic-version and anthropic-dangerous-direct-browser-access
- Production proxy continues to use process.env.ANTHROPIC_API_KEY and does not log secrets
- Production proxy forwards the normalized output_config body to Anthropic

### Preflight validator result
- Claude API contract preflight passed: 3 schema export(s) checked

### Verification commands and results
- git status --short: clean before editing
- git branch -vv: main ahead of origin/main by two recent local API-fix commits; continued per instruction
- git log --oneline -5: confirmed recent API-fix commits
- node --check api/messages.js: passed
- node --input-type=module schema preflight: passed, 3 schema exports checked
- npm run build: passed with the existing Vite chunk-size warning
- node evals/run_evals.js: passed 25/25 procurement tests, 100% pass rate
- grep -R "output_format" app api vite.config.js: no matches
- grep -R "output_config:.*type" app api vite.config.js: no matches
- grep -R "output_config" app api vite.config.js: found nested format usage and safe error-handling/proxy validation references
- grep -R "additionalProperties: true" app api: no matches
- grep -R '"additionalProperties": true' app api: no matches
- grep -R "enforceNoAdditionalProperties\\|buildStructuredOutputConfig\\|additionalProperties" app/lib/schemas.js app/lib/claude.js: found expected strict-schema helper usage
- grep -R "https://api.anthropic.com" app: no matches
- grep -R "anthropic-dangerous-direct-browser-access" app api vite.config.js: found only proxy/API/error-handling contexts
- grep -R "Send" app: no matches
- grep -R "localStorage" app: no matches
- grep -R "Guaranteed\\|guaranteed\\|Recovered money\\|automated approval\\|fraud detected\\|AI decided" app: no matches
- git diff --check: passed
- git status --short: only intended files and new eval result before commit

### New eval result file
- evals/results/eval_results_2026-04-26T03-46-10-978Z.json

### Known issues
- No live Claude API call was run during this stabilization pass
- The Recharts dashboard continues to trigger a Vite production chunk-size warning

### Next step
Local API retest, then Stage 6.2 — Documentation package

### Notes
- No prompts, eval harness logic, CSV data, product architecture, or runtime AI stack changed
- Claude remains the runtime AI stack
- Codex is only the repo editing assistant
- No Send button or real email sending exists

## Claude API contract stabilization pass 2 — April 26, 2026

### Purpose
Fix the remaining Anthropic API rejection: `output_config.format.schema: For 'number' type, properties maximum, minimum are not supported`. Pass 1 fixed errors 1–3 (CORS header, old output_config shape, additionalProperties). This pass fixes error 4 (unsupported numeric/string JSON Schema keywords).

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/schemas.js
- api/messages.js
- vite.config.js
- package.json

### Files changed
- app/lib/schemas.js
- app/lib/claude.js
- api/messages.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T04-05-43-919Z.json

### API errors addressed
- `output_config.format.schema: For 'number' type, properties maximum, minimum are not supported` — stripped by normalizeAnthropicSchema before the request is built

### Request shape used
```
output_config: {
  format: {
    type: "json_schema",
    schema: <normalizeAnthropicSchema result>
  }
}
```

### Schema normalization behavior
- `normalizeAnthropicSchema` deep-clones the schema, then walks all nodes recursively
- Strips the full unsupported keyword list: minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, minLength, maxLength, maxItems, uniqueItems, pattern, patternProperties, unevaluatedProperties, propertyNames, minProperties, maxProperties, contains, minContains, maxContains, unevaluatedItems
- Handles minItems conservatively: keeps only if value is 0 or 1, otherwise strips and adds a description hint
- Stripped constraint values are preserved as description hints: e.g. `minimum 0, maximum 1` becomes `"Constraint hint: minimum 0, maximum 1."`
- Every object schema gets additionalProperties: false
- Walks properties, items, anyOf, oneOf, allOf, $defs, definitions
- Raw schema definitions retain minimum/maximum as business-intent documentation; they are not sent to Anthropic
- `enforceNoAdditionalProperties` is now an alias for `normalizeAnthropicSchema` for backward compatibility
- `buildStructuredOutputConfig` calls `normalizeAnthropicSchema`
- api/messages.js proxy enforceNoAdditionalProperties updated with the same keyword-stripping logic as a defensive belt-and-suspenders measure

### Proxy and header behavior
- Unchanged from pass 1
- Vite proxy sets anthropic-dangerous-direct-browser-access: true
- api/messages.js proxy uses process.env.ANTHROPIC_API_KEY, does not log secrets
- No direct app-to-Anthropic browser call

### Schema subset preflight result
- Command: node --input-type=module schema preflight (Task G validator)
- Result: Anthropic schema subset preflight passed: 3 schema export(s) checked
- matchingOutputSchema, classificationOutputSchema, actionOutputSchema all passed

### Proxy contract validation result
- api/messages.js syntax check: passed
- POST/OPTIONS handling: present
- Required headers forwarded: content-type, anthropic-version, anthropic-dangerous-direct-browser-access, x-api-key
- No API key logging: confirmed
- Anthropic error body forwarded without leaking secrets: confirmed
- No direct browser->Anthropic call from app: confirmed (grep returns no matches)

### Verification commands and results
- node --check api/messages.js: passed
- node --input-type=module preflight: passed, 3 schema exports checked
- npm run build: passed (existing Vite chunk-size warning; exit code 0)
- node evals/run_evals.js: 25/25 passed, 100%
- grep -R "output_format" app api vite.config.js: no matches
- grep -R "output_config:.*type" app api vite.config.js: no matches
- grep -R "additionalProperties: true" app api: no matches
- grep -R '"additionalProperties": true' app api: no matches
- grep -R "minimum\|maximum\|..." app/lib/schemas.js: found only in raw schema definitions (expected) and in the UNSUPPORTED_KEYWORDS removal list — normalized schemas strip them, confirmed by preflight
- grep -R "normalizeAnthropicSchema\|buildStructuredOutputConfig" app/lib/schemas.js app/lib/claude.js: found at expected export and import sites
- grep -R "https://api.anthropic.com" app: no matches
- grep -R "anthropic-dangerous-direct-browser-access" app api vite.config.js: found only in proxy/API/error-handling contexts
- grep -R "Send" app: no matches
- grep -R "localStorage" app: no matches
- grep -R "Guaranteed\|..." app: no matches
- git diff --check: passed
- git status --short: clean before commit

### New eval result file
- evals/results/eval_results_2026-04-26T04-05-43-919Z.json

### Known issues
- No live Claude API call was run during this pass (local API retesting is the next step)
- The Recharts dashboard continues to trigger a Vite chunk-size warning (not a blocker)
- integer type is used in schemas (overall_tier, action_count, response_deadline_days); if Anthropic rejects it, change to number

### Next step
Local API retest, then Stage 6.2 — Documentation package

### Notes
- No prompts, CSV data, eval harness logic, product architecture, or runtime AI stack changed
- Claude remains the runtime AI stack
- Codex is only the repo editing assistant
- No Send button or real email sending exists

## Chunk 1 backend Analyze reliability handoff — April 26, 2026

### Purpose
Stabilize the Analyze flow before Stage 6.2 by reducing oversized Claude responses, validating result alignment, and making retry/failure behavior safer for the sample dataset and larger controlled review batches.

### Files reviewed
- AGENTS.md
- CLAUDE.md
- progress.md
- docs/HANDOFF.md
- .gitignore
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/schemas.js
- app/lib/audit.js
- app/lib/dashboard.js
- app/lib/format.js
- api/messages.js
- vite.config.js
- package.json

### Files changed
- .gitignore
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/schemas.js
- app/lib/audit.js
- app/lib/pipeline.js
- api/messages.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-26T17-01-02-087Z.json
- evals/results/eval_results_2026-04-26T17-02-43-117Z.json

### Root cause confirmed
- Analyze previously sent all 25 invoices through one Claude call per stage.
- Matching included all POs, invoices, and GRNs in one request.
- Classification and action generation each processed one full batch.
- max_tokens was hardcoded in the Claude wrapper.
- No post-response validation confirmed result count, order, missing rows, or duplicated rows before UI state was updated.

### Reliability fixes made
- Added a chunked pipeline helper module for pure chunking, context building, merge validation, action-result normalization, API-key leak assertions, and dry-run validation.
- Analyze now clears stale downstream state at the start of every run and retry.
- Matching, classification, and action generation run per chunk, then merge back into the existing UI shapes.
- Result counts and invoice-number order are validated after each chunk and after final merge.
- If Claude returns rows out of order and invoice numbers are unique, rows are safely reordered; missing or duplicated rows fail the chunk.
- Failed chunks show `Analysis failed on invoices X-Y: ...` and do not publish partial dashboard results as final state.

### Chunking strategy
- Default chunk size: 5 invoices.
- Each chunk sends only the invoice rows in that chunk.
- Each chunk includes relevant POs and GRNs for those invoice PO references and item codes.
- Global duplicate invoice metadata and full PO-number metadata are included so duplicate invoice and invalid PO checks remain aware of the full uploaded file.
- Deterministic matching guards preserve global E07 duplicate detection and E11 invalid PO detection after response alignment.
- A small delay between chunks reduces rate-limit pressure while preserving the existing 429 retry behavior.

### max_tokens handling
- app/lib/claude.js now exposes a named default max token constant.
- buildClaudeRequestBody and callClaudeAPI accept maxTokens.
- Stage callers pass configurable per-stage max token values.
- The max-token stop reason now tells the user that chunking reduces output size and suggests retrying analysis.

### Merge validation result
- Dry-run validation passed with no live Claude call:
  - 25 invoices
  - 5 chunks
  - chunk sizes: 5, 5, 5, 5, 5
  - merged matching count: 25
  - merged classification count: 25
  - merged action count: 25

### API contract preservation
- No direct app-to-Anthropic browser call was introduced.
- output_config.format remains the structured-output request shape.
- output_format and the old output_config.type shape remain absent.
- additionalProperties: true remains absent.
- Schema normalization now also converts integer-like schema types to number with a constraint hint before Anthropic receives the schema.
- Vite/API proxy direct-browser-access header behavior remains unchanged.

### Security and audit behavior
- .gitignore now ignores only `.claude/settings.local.json`; tracked `.claude/skills` files remain preserved.
- `.claude/settings.local.json` was not staged.
- Audit entries now include chunk index, chunk total, invoice range, invoice count, status, and safe error text.
- Audit export continues to store input hashes rather than raw full prompts or raw invoice payloads.
- No API keys are logged, stored in audit entries, or written to localStorage.

### Runtime hardening
- Retry starts a clean Analyze run instead of retrying against stale partial state.
- Partial chunk results are kept out of completed dashboard state on failure.
- Action generation can normalize intentionally omitted clean invoice rows into safe empty action records.
- Audit UI tolerates failed chunk entries and missing output summaries.
- Dashboard and review state continue using empty arrays and existing safe fallbacks when results are unavailable.

### Verification commands and results
- wc -l app/ProcureGuard.jsx app/lib/*.js api/messages.js: completed
- node --check api/messages.js: passed
- node --input-type=module dry-run chunk validator: passed, 25 invoices across 5 chunks
- npm run build: passed with existing Vite chunk-size warning
- node evals/run_evals.js: 25/25 passed, 100%
- grep -R "console.log" app api: no matches
- grep -R "localStorage" app api: no matches
- grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api: no matches
- grep -R "max_tokens: 8192" app api: no matches
- grep -R "output_format" app api vite.config.js: no matches
- grep -R "output_config:.*type" app api vite.config.js: no matches
- grep -R "additionalProperties: true" app api: no matches
- grep -R '"additionalProperties": true' app api: no matches
- grep -R "https://api.anthropic.com" app: no matches
- grep -R "Send" app: no matches
- grep -R "Guaranteed\|guaranteed\|Recovered money\|automated approval\|fraud detected\|AI decided\|payment released\|email sent" app: no matches
- grep -R ".claude/settings.local.json" .gitignore: passed

### New eval result files
- evals/results/eval_results_2026-04-26T17-01-02-087Z.json
- evals/results/eval_results_2026-04-26T17-02-43-117Z.json

### Known issues
- No live Claude API call was run during this pass.
- The Recharts dashboard still triggers the existing Vite production chunk-size warning.

### Manual retest steps
1. Restart the Vite dev server so the latest proxy and app code are loaded.
2. Open the app locally.
3. In local development only, enter the Anthropic API key in the session-only API key field.
4. Upload `data/purchase_orders.csv`, `data/invoices.csv`, and `data/goods_receipts.csv`.
5. Click Analyze.
6. Confirm progress advances through Matching, Classification, and Drafting chunks 1/5 through 5/5.
7. Confirm dashboard and review queue render after the completed run.
8. Export the audit CSV and confirm chunk metadata is present without raw invoice payloads or API keys.

### Next step
Local API retest, then Chunk 2 planning.

### Notes
- No prompts, CSV data, golden dataset, eval harness logic, product architecture, runtime AI stack, Send button, or real email sending changed.
- Claude remains the runtime AI stack.
- Codex is only the repo editing assistant.

## Chunk 2A.1 Product IA shell and safe wording handoff — April 26, 2026

### Purpose
Make the top-level product structure and visible wording safer and more enterprise-ready without redesigning the inner dashboard or changing the Claude-based AI stack.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/format.js
- app/lib/dashboard.js
- app/lib/rootCause.js

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/format.js
- app/lib/dashboard.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T14-46-21-871Z.json
- evals/results/eval_results_2026-04-27T15-30-40-141Z.json
- evals/results/eval_results_2026-04-27T15-36-46-748Z.json

### Navigation/product structure changes
- Replaced the old top-level surfaces with Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, and Audit & Governance.
- Start now holds the existing local API key, CSV upload, and progress setup.
- Executive Summary uses the existing dashboard content for this chunk.
- Exception Workbench uses the existing review queue cards and filters with safer labels.
- Supplier & Policy Analytics now hosts the policy tolerance simulator, root-cause panel, and a placeholder note for supplier scorecard separation in a later chunk.
- Audit & Governance now hosts the existing audit export and session audit trail.
- Analyze completion now navigates to Executive Summary after the full prompt chain completes.

### Wording/safety changes
- Product framing now presents ProcureGuard AI as an AP Exception Control Tower.
- Tier labels now read Clean match, Expedited review candidate, Human review required, and Escalation recommended.
- Replaced visible Review Queue language with Exception Workbench.
- Replaced Reasoning with Evidence & rationale.
- Replaced unsafe auto-review and auto-approve wording in the tolerance simulator with low-risk human-review routing language.
- Replaced Client-side only with Browser-only pattern review.
- Replaced draft approval button wording with queue-oriented draft wording.
- Kept draft communications DRAFT-only and did not add any Send action.

### Formatting helper changes
- Added formatModelName, formatStageName, formatDiversityCert, and formatDuration in app/lib/format.js.
- Used formatStageName, formatModelName, and formatDuration in visible audit rows.
- Used formatModelName in dashboard model display.
- Used formatDiversityCert in supplier scorecard output, including None for empty certifications.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, and app/lib/schemas.js were protected and unchanged.
- No prompts, CSV data, golden dataset, or eval harness logic changed.

### Verification commands and results
- Pre-edit git status --short: one pre-existing untracked eval result was present.
- Pre-edit npm run build: passed with the existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with the existing Vite chunk-size warning.
- Post-edit node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified app/docs/progress files plus untracked eval result files before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T15-36-46-748Z.json
- Also committed the pre-existing eval output evals/results/eval_results_2026-04-27T14-46-21-871Z.json and the required pre-edit eval output evals/results/eval_results_2026-04-27T15-30-40-141Z.json so the stage leaves no loose eval artifacts.

### Known issues
- The Recharts dashboard still triggers the existing Vite production chunk-size warning.
- Supplier scorecard and heatmap remain inside Executive Summary for this shell chunk; fuller separation is deferred.
- No live Claude API call was run during this pass.

### Next step
Chunk 2A.2 Executive Summary decision-first page

## Chunk 2A.2 Executive Summary decision-first page handoff — April 27, 2026

### Purpose
Rework the Executive Summary into a decision-first page that answers what happened, what is at risk, and what the team should do next, without changing the Claude runtime stack or backend pipeline.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/dashboard.js
- app/lib/format.js
- app/lib/rootCause.js

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/uiModels.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T15-57-23-536Z.json
- evals/results/eval_results_2026-04-27T16-04-21-984Z.json
- evals/results/eval_results_2026-04-27T16-05-18-464Z.json

### View-model/helper changes
- Added app/lib/uiModels.js with pure helpers for buildExecutiveSummaryViewModel, getBatchOutcome, getExecutiveHeroMetrics, buildTopExceptionDrivers, and buildRecommendedNextActions.
- The Executive Summary now consumes a derived view model instead of scattering outcome, driver, and action calculations through JSX.
- Recommended actions are deterministic and based only on current exception mix and tier counts.

### Executive Summary structure changes
- Replaced the dashboard-first page with a decision-first flow: header, decision card, four hero metrics, top drivers, next actions, then compact chart detail.
- Removed supplier heatmap, supplier scorecard, token/cost detail, and long technical panels from the Executive Summary render path.
- Added guarded empty and in-progress states so the page avoids stale or incomplete summaries.

### Decision card changes
- Top card now shows Batch review complete, outcome, invoices analyzed, exceptions found, escalations recommended, exposure identified, estimated recoverable exposure, and recommended next action.
- Outcomes are Clean batch, Human review required, and Escalation recommended with semantic green, amber, and red treatment.

### Hero metric changes
- Hero metrics are limited to Invoices analyzed, Exceptions requiring review, Exposure identified, and Estimated recoverable exposure.
- Counts, money, percentages, latency, and token values use tabular number styling where displayed.

### Top driver changes
- Added a top-three business driver section powered by exception analytics.
- Each driver shows exception code, human-readable label, count, exposure, and concise business meaning.

### Recommended action changes
- Added compact recommended actions for escalation, supplier pricing and PO amendment validation, invoice control exceptions, receiving records, and clean-batch follow-up.
- Wording remains human-review oriented and avoids autonomous approval, payment release, fraud, or sent-email language.

### Chart and empty-state cleanup
- Executive charts now sit below the decision/top-driver section.
- Every chart panel includes a one-sentence takeaway.
- Sparse chart data falls back to compact ranked rows instead of blank chart containers.
- Clean batches show a calm empty chart state.

### Non-executive modules moved or deferred
- Supplier scorecard and supplier exception heatmap moved to Supplier & Policy Analytics.
- Root cause analysis and the tolerance simulator remain in Supplier & Policy Analytics.
- Session token/model trace moved to Audit & Governance above the audit trail.
- Deeper Supplier & Policy Analytics redesign is deferred.

### Visual/UI changes
- Executive Summary now uses a calmer hierarchy, clearer section rhythm, semantic color usage, compact decision card treatment, and cleaner dark-mode card states.
- No global visual redesign, new dependencies, icon libraries, or animation libraries were added.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, and app/lib/schemas.js were protected and unchanged.
- prompts/, data/, evals/run_evals.js, and evals/golden_dataset.json were protected and unchanged.

### Verification commands and results
- Pre-edit git status --short: clean.
- Pre-edit git branch -vv: main at a6236f6, ahead of origin/main.
- Pre-edit git log --oneline -10: confirmed a6236f6 and fe8e374 at the top of recent history.
- Pre-edit npm run build: passed with existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with existing Vite chunk-size warning.
- Post-edit node evals/run_evals.js: passed 25/25, 100%.
- Final npm run build: passed with existing Vite chunk-size warning.
- Final node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified Executive Summary files, progress/handoff, new uiModels helper, and generated eval results before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T16-05-18-464Z.json
- Also generated evals/results/eval_results_2026-04-27T15-57-23-536Z.json during the required pre-edit eval gate.
- Also generated evals/results/eval_results_2026-04-27T16-04-21-984Z.json during the first post-edit eval run.

### Known issues
- The existing Vite production chunk-size warning remains.
- Supplier & Policy Analytics now owns supplier concentration modules, but the deeper analytics-page redesign is deferred.
- No live Claude API call was run during this pass.

### Next step
Chunk 2A.3 Exception Workbench scanability

## Chunk 2A.3 Exception Workbench scanability handoff — April 27, 2026

### Purpose
Rework only the Exception Workbench so an AP analyst can quickly answer which invoices need human review now, inspect the evidence behind each case, and review DRAFT-only follow-up material without changing the Claude runtime stack.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/dashboard.js
- app/lib/format.js
- app/lib/rootCause.js
- app/lib/uiModels.js
- app/lib/schemas.js

### Files changed
- app/ProcureGuard.jsx
- app/lib/uiModels.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T16-12-53-167Z.json
- evals/results/eval_results_2026-04-27T16-23-39-301Z.json

### View-model/helper changes
- Added pure Exception Workbench helpers in app/lib/uiModels.js: buildExceptionWorkbenchViewModel, buildWorkbenchRows, getReviewPriority, getDraftStatus, getRecommendedRouteLabel, buildInvoiceEvidenceSummary, buildWorkbenchSummary, and filterAndSortWorkbenchRows.
- Workbench rows now carry stable invoice facts, supplier, tier label, review priority, exception labels, exposure, hold, route, draft status, evidence strength, model confidence, source records, and safe fallbacks.
- Moved workbench sorting/filtering derivation out of JSX and into the view-model layer.

### Workbench summary strip changes
- Added a compact summary strip with invoices analyzed, need-review-now count, escalations, drafts prepared, and exposure.
- Used red for escalation, amber for review, blue for exposure/draft insight, and green only for clean states.

### Filter/search changes
- Reworked filter controls into a tighter queue-control panel with search, review path, supplier, exception, sort, visible count, and reset.
- Added hold and supplier sort options while keeping the existing search, tier, supplier, exception, and sort behavior.
- No table library or new dependency was added.

### Invoice card hierarchy changes
- Invoice cards now lead with invoice number, supplier, priority, tier label, match status, PO, GRN, exposure, hold, recommended route, draft status, evidence strength, and model confidence.
- Exception labels are quieter and secondary to route, exposure, hold, and review priority.
- Policy simulation notices remain scoped to affected cards.

### Evidence & rationale changes
- Replaced the previous card organization with a structured Evidence & rationale disclosure.
- Evidence is organized around: what is wrong, which source records prove it, dollar impact, rule applied, and what a human should do next.
- Source records and comparisons show PO, invoice, GRN, quantity, price, UOM, dates, exposure, hold, exception code, and label when available, with safe Not available fallbacks.

### Confidence display changes
- Removed the large confidence progress bar.
- Confidence is now supporting metadata: Evidence strength plus Model confidence percentage.
- Wording reinforces source-record validation and does not imply blind trust.

### Draft/action panel changes
- Draft/action panel is DRAFT-only and uses the route labels Supplier follow-up draft, Procurement review draft, AP escalation memo, and No draft needed.
- Draft body text is progressively disclosed.
- Missing action output shows Draft status not available; invoices without draft actions show No draft generated for this invoice.
- Local queue/reviewer-note controls remain human-in-the-loop only.

### Empty/loading/failure state changes
- Before analysis, the Workbench points users back to Start.
- While analysis runs, the Workbench withholds partial queue results.
- After failed analysis, the Workbench avoids stale completed queue output.
- No filter results now show No invoices match the selected filters.
- Missing classification and draft status have guarded fallback messages.

### Visual/UI changes
- Added a stronger page header, compact metrics, tighter filter grouping, calmer card density, tabular numbers, cleaner dark-mode borders, and progressive disclosure for detailed evidence and drafts.
- No global app shell redesign, charts, icon libraries, animation libraries, or new dependencies were added.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, and app/lib/schemas.js were protected and unchanged.
- prompts/, data/, evals/run_evals.js, and evals/golden_dataset.json were protected and unchanged.

### Verification commands and results
- Pre-edit git status --short: clean.
- Pre-edit git branch -vv: main at e670075, ahead of origin/main.
- Pre-edit git log --oneline -10: confirmed e670075, a6236f6, and fe8e374 at the top of recent history.
- Pre-edit npm run build: passed with existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with existing Vite chunk-size warning.
- Final npm run build: passed with existing Vite chunk-size warning.
- Final node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified workbench/progress/handoff files and generated eval results before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T16-23-39-301Z.json
- Also generated evals/results/eval_results_2026-04-27T16-12-53-167Z.json during the required pre-edit eval gate.

### Known issues
- The existing Vite production chunk-size warning remains.
- No live Claude API call was run during this pass.

### Next step
Chunk 2A.4 Supplier & Policy Analytics grouping

## Chunk 2A.4 Supplier & Policy Analytics grouping handoff — April 27, 2026

### Purpose
Rework only the Supplier & Policy Analytics page into a procurement management surface that answers which suppliers, warehouses, exception types, or policies are driving repeated operational risk, while preserving the Claude prompt-chain runtime and human-in-the-loop workflow.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/dashboard.js
- app/lib/format.js
- app/lib/rootCause.js
- app/lib/uiModels.js

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/uiModels.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T16-27-50-645Z.json
- evals/results/eval_results_2026-04-27T16-34-27-469Z.json

### View-model/helper changes
- Added buildSupplierPolicyAnalyticsViewModel, buildSupplierRiskNarratives, buildSupplierScoreRows, buildExceptionLegend, buildPolicySimulationSummary, buildRootCauseSummary, getSupplierRiskExplanation, and getSupplierRecommendedAction in app/lib/uiModels.js.
- Supplier and policy UI now consumes derived supplier risk rows, risk explanations, recommended actions, legend rows, heatmap rows, policy summary, and root-cause summary.
- The helpers use only existing dashboard analytics, tolerance simulation, and root-cause outputs.

### Supplier risk summary changes
- Added a top supplier follow-through section ranked by batch exposure, escalation pressure, and exception concentration.
- Each supplier card now includes a batch-based risk explanation and deterministic procurement action.

### Supplier scorecard changes
- Reworked scorecard columns around supplier, diversity certification, exception count, exposure, risk, and why the risk label was assigned.
- Risk wording is explicitly batch-based and avoids external supplier-risk claims.

### Heatmap/legend changes
- Reworked the supplier exception heatmap with muted zero cells shown as em dashes.
- Added a visible exception-code legend with code, human-readable label, tier label, count, and exposure.
- Added a concise heatmap takeaway above the table.

### Policy simulator changes
- Kept the existing tolerance simulator behavior.
- Improved simulator-only framing and added non-interactive policy profile labels: Conservative, Balanced, High-throughput, and Custom.
- Preserved potential low-risk review shift wording and avoided any implication that simulation changes payment or approval behavior.

### Root cause grouping changes
- Grouped browser-only pattern review under Supplier & Policy Analytics.
- Pattern signals now use concise display types: Supplier concentration, Policy sensitivity, and Receiving timing pattern.
- Updated leftover root-cause wording in app/ProcureGuardDashboard.jsx to avoid blame-oriented phrasing.

### Empty/loading/failure state changes
- Before analysis, the page points users back to Start.
- While analysis runs, the page avoids showing stale supplier analytics.
- After failed analysis, completed supplier analytics are withheld.
- No supplier concentration, heatmap data, simulator input, and pattern states now render calm empty messages.

### Visual/UI changes
- Added a stronger page header, compact analytics cards, clearer section grouping, tighter scorecard and heatmap density, tabular numbers, readable dark mode, and consistent empty states.
- No global shell redesign, chart work, new dependencies, icon libraries, or animation libraries were added.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, and app/lib/schemas.js were protected and unchanged.
- prompts/, data/, evals/run_evals.js, and evals/golden_dataset.json were protected and unchanged.

### Verification commands and results
- Pre-edit git status --short: clean.
- Pre-edit git branch -vv: main at bc2aff5, ahead of origin/main.
- Pre-edit git log --oneline -10: confirmed bc2aff5, e670075, a6236f6, and fe8e374 at the top of recent history.
- Pre-edit npm run build: passed with existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with existing Vite chunk-size warning.
- Final npm run build: passed with existing Vite chunk-size warning.
- Final node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified supplier/policy UI files, progress/handoff, and generated eval results before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T16-34-27-469Z.json
- Also generated evals/results/eval_results_2026-04-27T16-27-50-645Z.json during the required pre-edit eval gate.

### Known issues
- The existing Vite production chunk-size warning remains.
- No live Claude API call was run during this pass.

### Next step
Chunk 2A.5 Audit & Governance / AI Reliability Center

## Chunk 2A.5 Audit & Governance / AI Reliability Center handoff — April 27, 2026

### Purpose
Rework only the Audit & Governance page into an AI reliability, governance, and audit surface that answers whether the AI-assisted review process can be trusted, explained, and exported.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/audit.js
- app/lib/dashboard.js
- app/lib/format.js
- app/lib/rootCause.js
- app/lib/uiModels.js
- app/lib/claude.js
- app/lib/pipeline.js
- api/messages.js

### Files changed
- app/ProcureGuard.jsx
- app/lib/uiModels.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T16-43-56-129Z.json
- evals/results/eval_results_2026-04-27T16-53-52-288Z.json

### View-model/helper changes
- Added buildGovernanceViewModel and related pure helpers in app/lib/uiModels.js for reliability summary, workflow trace, validation gates, model routing, token/cost summary, latency summary, API exposure status, audit export readiness, and grouped audit entries.
- Governance UI now consumes derived run state, uploaded data summary, audit groups, model labels, telemetry, export state, and guarded empty values instead of calculating governance logic in JSX.

### AI Reliability Center changes
- Added an AI Reliability Center section with pipeline health, captured stages, chunk count, audit entries, total latency, token availability, model usage, draft-only controls, and client key exposure.
- Validation gates show current-run detail when available and use "Validation detail not available for this run." when metadata is not present.
- Running and failed states avoid presenting stale completed claims.

### API/service status changes
- Added service mode and data input grouping for local development versus production behavior.
- Local development keeps the existing session-only Claude key input.
- Production presents server-side Claude service status and client key exposure as none; public users are not asked for API keys.

### Workflow trace changes
- Added trace steps for Data setup, Matching, Classification, Draft generation, Result alignment, Review surface, and Audit export.
- Steps show captured/running/failed/pending status, chunk count when available, humanized Claude model labels, and latency when available.
- Primary UI uses humanized model names instead of raw model IDs.

### Runtime/cost telemetry changes
- Added grouped telemetry for input tokens, output tokens, estimated cost, cost per invoice, total latency, average latency, slowest chunk, and models used.
- Token, cost, latency, and model sections render explicit unavailable states when the current run lacks metadata.

### Audit grouping/export changes
- Replaced the top-level raw audit wall with an audit trail summary and export readiness panel.
- Grouped raw audit entries by stage lower on the page using collapsible sections.
- Export wording states that the audit CSV contains run metadata and AI decision records, excludes raw API keys and raw request payloads, and is audit-supporting rather than a legal compliance certification.

### Empty/loading/failure state changes
- Before analysis, the page points users back to Start and explains that audit entries appear after analysis.
- While analysis runs, the page shows in-progress reliability and trace state without stale final claims.
- After failed analysis, the page shows failed-run state and does not show completed analytics as final.
- No audit, token, latency, and model data states now render calm fallback text.

### Visual/UI changes
- Added a stronger page header, calmer reliability cards, grouped service/input state, trace cards, compact telemetry, export readiness, grouped raw details, tabular numbers, and readable dark-mode treatment.
- No global app shell redesign, new dependencies, icon libraries, animation libraries, or chart work were added.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, and app/lib/schemas.js were protected and unchanged.
- prompts/, data/, evals/run_evals.js, and evals/golden_dataset.json were protected and unchanged.

### Verification commands and results
- Pre-edit git status --short: clean.
- Pre-edit git branch -vv: main at 9b986ec, ahead of origin/main.
- Pre-edit git log --oneline -10: confirmed 9b986ec, bc2aff5, e670075, a6236f6, and fe8e374 at the top of recent history.
- Pre-edit npm run build: passed with existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with existing Vite chunk-size warning.
- Post-edit node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified governance UI files, progress/handoff, and generated eval results before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T16-53-52-288Z.json
- Also generated evals/results/eval_results_2026-04-27T16-43-56-129Z.json during the required pre-edit eval gate.

### Known issues
- The existing Vite production chunk-size warning remains.
- No live Claude API call was run during this pass.

### Next step
Chunk 2A.6 Visual consistency, spacing, and responsive polish

## Chunk 2A.6 Visual consistency, spacing, and responsive polish handoff — April 27, 2026

### Purpose
Polish the existing five-page product so ProcureGuard AI feels like one coherent AP Exception Control Tower: modern, calm, premium, enterprise-grade, analyst-usable, executive-readable, and governance-aware.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/format.js
- app/lib/uiModels.js

### Files changed
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T19-25-53-543Z.json
- evals/results/eval_results_2026-04-27T19-33-00-224Z.json
- evals/results/eval_results_2026-04-27T19-34-28-259Z.json

### Visual rhythm changes
- Added shared app-level CSS classes for the shell, container, page stacks, page headers, cards, compact cards, empty panels, buttons, controls, tabs, table wrappers, metadata, and tabular numbers.
- Applied the shared visual rhythm to the app frame, Start controls, Executive Summary header and metric cards, Exception Workbench header and empty states, Supplier & Policy Analytics header/cards/tables, and Audit & Governance reliability/export sections.
- Kept enterprise detail intact while using consistent gaps, card padding, border radius, and calmer card surfaces.

### Typography/numeric presentation changes
- Standardized page title, section title, kicker, body copy, and metadata treatments.
- Reduced oversized executive metric typography and kept decision content prominent without becoming a marketing-style hero.
- Reinforced tabular numeric presentation for metrics, counts, money, tokens, latency, and table cells through shared numeric styling.

### Navigation polish
- Reworked the five-surface workspace navigation into a reusable tab treatment with a clearer but calmer active state.
- Added graceful smaller-screen behavior through wrapping/scrolling tabs and stable minimum tab widths.
- Preserved all IA labels: Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, Audit & Governance.

### Semantic color changes
- Added shared semantic tone handling for clean/completed, review, escalation, insight, governance, and neutral card borders/backgrounds.
- Kept green reserved for clean/completed/healthy states, amber for review, red for escalation, blue for insight, indigo for governance, and slate for structure.
- Muted zero heatmap values with em dashes in the legacy supplier analytics export surface for consistency.

### Responsive layout changes
- Added shared responsive page and tab behavior for mobile/tablet/desktop widths.
- Improved audit trace wrapping so trace cards move from two columns to four and then seven columns instead of becoming cramped too early.
- Table-like sections continue to scroll horizontally where needed without hiding critical controls.

### Empty/loading/failure state consistency changes
- Unified empty-state presentation through shared empty panel styling and consistent page-stack spacing.
- Preserved existing loading/failure behavior: in-progress pages avoid stale final claims and failed analysis does not look completed.
- Empty states remain calm and point users back to Start where appropriate.

### Dark mode changes
- Added calmer dark-mode surfaces, borders, text contrast, controls, tabs, and semantic tone backgrounds.
- Improved dark-mode focus, selection, summary marker, buttons, inputs, cards, table wrappers, and muted metadata contrast.

### Focus/accessibility polish
- Added consistent focus-visible behavior for controls and summaries.
- Added disabled cursor/opacity treatment for buttons and inputs.
- Preserved labels for filters and form controls.
- Navigation active state uses text and surface treatment, not color alone.

### Prototype roughness removed
- Replaced lingering technical/prototype-facing labels in legacy UI surfaces: Supplier Exception Heatmap, Supplier Name, Risk Level, and Root Cause Analysis.
- Kept raw technical details lower on Audit & Governance and preserved grouped disclosure patterns.
- Did not add decorative gradients, animation libraries, icon libraries, new dependencies, or new product features.

### Backend files protected or touched
- No backend files were touched.
- app/lib/pipeline.js, app/lib/claude.js, api/messages.js, app/lib/schemas.js, app/lib/audit.js, app/lib/dashboard.js, and app/lib/rootCause.js were protected and unchanged.
- prompts/, data/, evals/run_evals.js, and evals/golden_dataset.json were protected and unchanged.

### Verification commands and results
- Pre-edit git status --short: clean.
- Pre-edit git branch -vv: main at 1263aa8, ahead of origin/main.
- Pre-edit git log --oneline -10: confirmed 1263aa8, 9b986ec, bc2aff5, e670075, a6236f6, and fe8e374 at the top of recent history.
- Pre-edit npm run build: passed with existing Vite chunk-size warning.
- Pre-edit node evals/run_evals.js: passed 25/25, 100%.
- Post-edit npm run build: passed with existing Vite chunk-size warning.
- Post-edit node evals/run_evals.js: passed 25/25, 100%.
- node --check api/messages.js: passed.
- grep -R "console.log" app api || true: no matches.
- grep -R "localStorage" app api || true: no matches.
- grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true: no matches.
- grep -R "Send" app || true: no matches.
- git diff --check: passed.
- git status --short: modified visual UI files, progress/handoff, and generated eval results before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T19-34-28-259Z.json
- Also generated evals/results/eval_results_2026-04-27T19-25-53-543Z.json during the required pre-edit eval gate and evals/results/eval_results_2026-04-27T19-33-00-224Z.json during the post-code eval check.

### Known issues
- The existing Vite production chunk-size warning remains.
- No live Claude API call was run during this pass.

### Next step
Manual screenshot review across all five pages, then Chunk 2B planning

## Production Rework Chunk 1.1 Timeout fix handoff — April 27, 2026

### Purpose
Fix the live local timeout observed during the completed chunked Claude pipeline by making Claude request timeouts stage-aware without changing prompts, models, schemas, chunking, retries, validation, UI design, or the Claude runtime architecture.

### Live failure observed
- Local Analyze failed on invoices 21-25 with: `Claude API request timed out after 60 seconds`.
- Audit context indicated the chunked pipeline, validation, audit trail, and UI partial-result protection were already working.
- Matching uses Claude Haiku and remains at 60 seconds.
- Classification and action generation use Claude Sonnet and now receive longer 120-second request windows.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/pipeline.js
- app/lib/audit.js
- api/messages.js
- package.json
- vite.config.js

### Files changed
- app/lib/claude.js
- app/ProcureGuard.jsx
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T21-01-27-034Z.json
- evals/results/eval_results_2026-04-27T21-04-05-041Z.json

### Timeout constant changes
- Added `MATCHING_TIMEOUT_MS = 60000`.
- Added `CLASSIFICATION_TIMEOUT_MS = 120000`.
- Added `ACTION_GENERATION_TIMEOUT_MS = 120000`.
- Added `DEFAULT_CLAUDE_TIMEOUT_MS = 120000`.
- Removed the single hardcoded 60-second request timeout from the Claude wrapper.

### Stage-aware timeout behavior
- `callClaudeAPI` now accepts `stage` and `timeoutMs`.
- Known stages resolve to fixed stage timeout constants:
  - `matching` → 60 seconds.
  - `classification` → 120 seconds.
  - `action_generation` → 120 seconds.
- Missing or unknown stage without a direct `timeoutMs` falls back to `DEFAULT_CLAUDE_TIMEOUT_MS`.
- Direct `timeoutMs` remains supported for future non-stage callers and is normalized to a safe positive timeout or the default.
- Abort behavior is preserved through `AbortSignal.timeout(...)` with the existing `AbortController` fallback.
- The three existing analyze chunk runners now pass stage identifiers into `callClaudeAPI`.

### API contract preservation
- `/api/messages` was not modified.
- The app still calls only the local `/api/messages` path, not `https://api.anthropic.com` directly.
- `output_config.format` remains the structured-output request shape.
- No `output_format` usage was introduced.
- No old `output_config.type` request shape was introduced.
- Model routing remains unchanged: matching uses Haiku, classification and action generation use Sonnet.
- Schemas, prompts, chunk size, retry behavior, result validation, and output payload content were not changed.

### Security behavior
- No API key logging was added.
- No `console.log` usage was added in app or api files.
- No `localStorage` usage was added.
- Audit export behavior remains hash-and-metadata based and does not write raw invoice payloads or API keys.
- Timeout messages include only the stage and duration. The existing chunk error wrapper safely adds invoice range metadata without exposing prompts, raw request bodies, invoice payloads, API keys, or stack traces.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `a29bf82`, ahead of `origin/main` by 11.
- Pre-edit `git log --oneline -10`: confirmed `a29bf82` and `fe8e374` in recent history.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%.
- Post-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Post-edit `node evals/run_evals.js`: passed 25/25, 100%.
- `node --check api/messages.js`: passed.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "output_format" app api vite.config.js || true`: no matches.
- `grep -R "output_config:.*type" app api vite.config.js || true`: no matches.
- `grep -R "additionalProperties: true" app api || true`: no matches.
- `grep -R '"additionalProperties": true' app api || true`: no matches.
- `grep -R "https://api.anthropic.com" app || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git status --short`: showed only intended code/docs changes and the two generated eval result files before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T21-04-05-041Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-27T21-01-27-034Z.json

### Known issues
- No live Claude API retest was run during this code change.
- The existing Vite production large-chunk warning remains.
- If invoices 21-25 still time out during live retest, capture the exact stage and chunk before deciding whether Chunk 1.2 prompt caching or a later retry strategy is needed.

### Manual retest steps
1. Restart Vite dev server.
2. Open local app.
3. Upload purchase_orders.csv, invoices.csv, goods_receipts.csv.
4. Enter local Anthropic API key.
5. Click Analyze.
6. Confirm all chunks complete, especially invoices 21-25.
7. If timeout happens again, capture exact stage and chunk.
8. Confirm Executive Summary, Exception Workbench, Supplier & Policy Analytics, and Audit & Governance render.
9. Export audit CSV and confirm no raw payloads or API keys appear.

### Next step
Live local API retest, then Chunk 1.2 Prompt caching if timeout is resolved.

## Production Rework Chunk 1.2 Prompt caching handoff — April 27, 2026

### Purpose
Enable Anthropic 5-minute ephemeral prompt caching for repeated chunk calls so the static stage prompt content can be reused across matching, classification, and action-generation chunks without changing prompts, schemas, model routing, chunk size, retry behavior, validation, or UI structure.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/pipeline.js
- app/lib/audit.js
- app/lib/schemas.js
- api/messages.js
- package.json
- vite.config.js
- app/lib/dashboard.js
- app/lib/uiModels.js
- app/ProcureGuardDashboard.jsx

### Files changed
- app/lib/claude.js
- app/ProcureGuard.jsx
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T21-08-40-006Z.json
- evals/results/eval_results_2026-04-27T21-10-50-144Z.json
- evals/results/eval_results_2026-04-27T21-11-46-620Z.json

### Prompt caching implementation
- Added `EPHEMERAL_CACHE_CONTROL = { type: "ephemeral" }` in `app/lib/claude.js`.
- Added a small `buildCachedSystemBlocks` helper that wraps each stage prompt as an Anthropic system text block with `cache_control`.
- Cached only the stable system prompt text loaded from the existing prompt files.
- Left dynamic chunk payloads in the user message uncached.
- Did not alter prompt text, prompt files, chunk payload construction, schemas, output parsing, retries, stage timeouts, or result validation.

### Request body structure changes
- Before this chunk, `buildClaudeRequestBody` sent `system` as a plain string.
- It now sends:
  ```
  system: [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }
    }
  ]
  ```
- `messages` remains `[{ role: "user", content: userMessage }]`.
- `userMessage` continues to hold the dynamic current chunk data.
- `output_config.format` remains unchanged and still comes from `buildStructuredOutputConfig(schema)`.
- A request-body smoke check confirmed `system` is a cached text block, dynamic message content remains in `messages[0].content`, and `output_config.format.type` remains `json_schema`.

### Beta header decision
- No `anthropic-beta` prompt-caching header was added.
- Reason: current Anthropic prompt caching guidance supports `cache_control: { type: "ephemeral" }` directly on cacheable content blocks, with a default 5-minute lifetime.
- No extended 1-hour cache TTL or extended-cache beta header was added.

### Proxy compatibility changes
- `api/messages.js` was inspected and did not require modification.
- `cache_control` fields are outside the schema normalization path and are not stripped.
- System array blocks pass through because the production proxy validates required model/messages/max_tokens/output_config fields and does not reject `system` arrays.
- `output_config.format` normalization remains unchanged.
- Production API key remains server-side through `process.env.ANTHROPIC_API_KEY`.
- Local development still uses the Vite `/api/messages` proxy with the session-only `x-api-key` header.

### Cache usage/token handling
- `callClaudeAPI` already returns `raw.usage` as `token_usage`, preserving unknown usage fields.
- Anthropic cache fields such as `cache_creation_input_tokens` and `cache_read_input_tokens` remain preserved in audit entries through the existing `token_usage` object.
- Added a small Audit & Governance audit-row display for cache write/read token fields when returned.
- Audit CSV export remains unchanged and does not include raw prompts, raw invoice payloads, or API keys.
- No new cache pricing was added. Existing cost calculations were not expanded or relabeled in this chunk.

### API contract preservation
- `/api/messages` remains the only app-facing Claude endpoint.
- No direct app call to `https://api.anthropic.com` was introduced.
- `output_config.format` remains the structured-output request shape.
- No `output_format` usage was introduced.
- No old `output_config.type` request shape was introduced.
- No `additionalProperties: true` was introduced.
- Current model routing, `max_tokens` behavior, and stage-aware timeout behavior are preserved.
- Strict result count/order validation and partial-result protection are unchanged.

### Security behavior
- No API key logging was added.
- No `console.log` usage was added.
- No `localStorage` usage was added.
- No raw invoice payloads are written into audit export.
- Cacheable content is not logged or exported.
- No autonomous approval, payment release, fraud accusation, AI-decided wording, real email sending, or Send button was added.

### Verification commands and results
- Pre-edit `git status --short`: clean before the required eval generated `evals/results/eval_results_2026-04-27T21-08-40-006Z.json`.
- Pre-edit `git branch -vv`: `main` at `9745ca5`, ahead of `origin/main` by 12.
- Pre-edit `git log --oneline -10`: confirmed `9745ca5`, `a29bf82`, and `fe8e374` in recent history.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%.
- Request-body smoke check: passed; cached system block and `output_config.format.type = json_schema` confirmed.
- Post-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Post-edit `node evals/run_evals.js`: passed 25/25, 100%.
- Final `npm run build`: passed with the existing Vite large-chunk warning.
- Final `node evals/run_evals.js`: passed 25/25, 100%.
- `node --check api/messages.js`: passed.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "output_format" app api vite.config.js || true`: no matches.
- `grep -R "output_config:.*type" app api vite.config.js || true`: no matches.
- `grep -R "additionalProperties: true" app api || true`: no matches.
- `grep -R '"additionalProperties": true' app api || true`: no matches.
- `grep -R "https://api.anthropic.com" app || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only app/ProcureGuard.jsx, app/lib/claude.js, docs/HANDOFF.md, and progress.md.
- `git status --short`: showed only intended modified files and generated eval result files before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T21-11-46-620Z.json
- Also generated during verification: evals/results/eval_results_2026-04-27T21-10-50-144Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-27T21-08-40-006Z.json

### Known issues
- No live Claude API retest was run during this code change.
- The existing Vite production large-chunk warning remains.
- Existing cost panels still use the repository's prior cost model; this chunk preserves cache usage fields and does not add new cache pricing.

### Manual live retest steps
1. Restart Vite dev server.
2. Open local app.
3. Upload purchase_orders.csv, invoices.csv, goods_receipts.csv.
4. Enter local Anthropic API key.
5. Click Analyze.
6. Confirm all chunks complete.
7. Confirm token usage includes normal usage and cache usage fields if Anthropic returns them.
8. Confirm Executive Summary, Exception Workbench, Supplier & Policy Analytics, and Audit & Governance render.
9. Export audit CSV and confirm no raw payloads or API keys appear.

### Next step
Live local API retest, then Chunk 1.3 partial result saving and chunk-level retry.

## Production Rework Chunk 1.3 Partial result saving and chunk-level retry handoff — April 27, 2026

### Purpose
Harden the runtime pipeline so completed chunk outputs are retained in memory when a later chunk fails, the failed stage/chunk/range is explicit, and safe failures can retry only the failed chunk before continuing the current 3-stage Claude prompt chain.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/pipeline.js
- app/lib/audit.js
- app/lib/schemas.js
- app/lib/dashboard.js
- app/lib/uiModels.js
- api/messages.js
- package.json
- vite.config.js

### Files changed
- app/ProcureGuard.jsx
- app/lib/pipeline.js
- app/lib/audit.js
- app/lib/uiModels.js
- app/lib/claude.js
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T21-39-08-342Z.json
- evals/results/eval_results_2026-04-27T21-52-35-903Z.json

### Pipeline run state changes
- Added an explicit in-memory pipeline run state with runId, status, current stage/chunk, total chunks, failed stage/chunk/range/message, retryability, per-stage completed chunk metadata, per-stage chunk outputs, merged stage outputs, retry attempts, and finalResultsComplete.
- Run status now distinguishes idle, running, partial_failed, failed, and complete.
- Raw chunk outputs stay only in React runtime state and are not written to audit export.

### Partial result saving behavior
- Each successful chunk is stored immediately after validation and before the next chunk starts.
- Matching, classification, and action-generation chunk outputs retain original chunk order by array index.
- Prior completed stages and chunks remain available after a later chunk failure.
- Full React result state for final dashboard surfaces is only treated as complete after all required stage merges validate.

### Failed chunk descriptor behavior
- Failed chunks now capture stage, chunk index, total chunks, invoice range, invoice count, failure type, user-facing message, retry count/attempt, and retryable.
- Retryable failures are timeout, network, rate limit, and safely identified transient 5xx/overload API errors.
- Validation/count/order/alignment failures, schema/API-contract failures, auth/API-key failures, max-token failures, and missing required input data are treated as non-retryable.

### Retry failed chunk behavior
- The retry control reruns only the failed stage/chunk when retryable.
- Successful chunks before the failed chunk are reused; completed prior stages are reused.
- After a successful retry, the pipeline continues from that point through remaining chunks and downstream stages.
- A repeat retry failure keeps partial state and updates failure metadata rather than clearing retained chunks.
- No automatic infinite retry loop was added; retries are user-initiated.

### Partial display rules
- Executive Summary is withheld for partial_failed/failed runs and shows a partial-state notice instead of completed-batch metrics.
- Exception Workbench can show only invoices with completed classification data, clearly marked as partial.
- Action data is shown only where action-generation chunks completed; missing draft generation remains unavailable and not counted as completed final output.
- Supplier & Policy Analytics withholds completed analytics during partial/failed runs.
- Start and Audit & Governance show failed stage/chunk/range, retained chunk counts, and retry/restart controls.

### Audit metadata behavior
- Audit entries now include safe chunk attempt, retry_count, retry_status, failure_type, and retryable metadata.
- Retry success/failure audit entries are labeled with retry status so duplicate chunk audit entries do not imply duplicate completed analysis.
- Audit export still contains hashes, metadata, token usage, latency, summaries, and safe errors only.
- Audit export does not include raw prompts, raw invoice payloads, API keys, or secrets.

### API contract preservation
- `/api/messages` was not modified.
- The app still calls only `/api/messages` for Claude requests.
- `output_config.format` remains the structured-output request shape.
- No `output_format` usage or old `output_config.type` request shape was introduced.
- Prompt caching system blocks, stage-aware timeouts, current model routing, max_tokens behavior, strict result count/order validation, global E07/E11 guards, and clean-row action normalization are preserved.

### Security behavior
- No API key logging was added.
- No localStorage usage was added.
- No raw invoice payloads are exported in audit CSV.
- No prompts, CSV data, golden dataset, eval harness logic, database persistence, Python backend, OpenAI runtime API, agent framework, RAG/vector DB, Send button, real email sending, autonomous approval, payment release, fraud accusation, or AI-decided language was added.

### Verification commands and results
- Pre-edit `git status --short`: clean before required eval generated evals/results/eval_results_2026-04-27T21-39-08-342Z.json.
- Pre-edit `git branch -vv`: `main` at `928b940`, ahead of `origin/main` by 13.
- Pre-edit `git log --oneline -10`: confirmed `928b940` and `9745ca5` as the latest production rework commits.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%.
- Early post-code `npm run build`: passed with the existing Vite large-chunk warning.
- Final `npm run build`: passed with the existing Vite large-chunk warning.
- Final `node evals/run_evals.js`: passed 25/25, 100%.
- `node --check api/messages.js`: passed.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "output_format" app api vite.config.js || true`: no matches.
- `grep -R "output_config:.*type" app api vite.config.js || true`: no matches.
- `grep -R "additionalProperties: true" app api || true`: no matches.
- `grep -R '"additionalProperties": true' app api || true`: no matches.
- `grep -R "https://api.anthropic.com" app || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only intended app/progress/handoff files.
- `git status --short`: modified intended files plus the two generated eval result files before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T21-52-35-903Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-27T21-39-08-342Z.json

### Known issues
- No live Claude API retest was run during this code change.
- The existing Vite production large-chunk warning remains.

### Manual live retest steps
1. Restart Vite dev server.
2. Open local app.
3. Upload purchase_orders.csv, invoices.csv, goods_receipts.csv.
4. Enter local Anthropic API key.
5. Click Analyze.
6. Confirm all chunks complete if no failure occurs.
7. If a chunk fails, confirm completed prior chunks remain visible only as partial data.
8. Confirm failed stage/chunk/invoice range are shown.
9. Confirm Retry failed chunk reruns only the failed chunk/stage.
10. Confirm final Executive Summary appears only after all required chunks complete.
11. Confirm Audit & Governance shows retry/failure metadata without raw payloads or API keys.
12. Export audit CSV and confirm no raw payloads or API keys appear.

### Next step
Live local API retest, then Chunk 1.4 E12 eval fix.

## Production Rework Chunk 1.4A E12 TC-23 data reconciliation handoff — April 27, 2026

### Purpose
Resolve the intentional data/eval conflict exposed by the corrected E12 harness rule, while preserving the prompt-specified E12 behavior and keeping TC-23 as the E10-only tax mismatch test.

### Failed Chunk 1.4 result
- The Chunk 1.4 E12 harness fix changed E12 to fire on date sequencing alone.
- Post-fix evals failed 24/25 because TC-23 / INV-0023 returned `["E10", "E12"]` instead of expected `["E10"]`.
- Failed eval artifact already present from the failed attempt: evals/results/eval_results_2026-04-27T22-54-35-598Z.json

### Conflict confirmed
- INV-0023 invoice date was 2026-04-27.
- INV-0023 links to PO-023 / SAFE-GOG-ANSI.
- Linked GRN-026 was dated 2026-04-28, which made the invoice predate the earliest linked GRN.
- prompts/01_matching.md Rule 7 specifies E12 as invoice date preceding earliest GRN date.
- evals/golden_dataset.json TC-23 intentionally expects only E10.

### Decision made
TC-23 is the E10 tax-rate mismatch test only. INV-0013 remains the intended E03 + E12 dual-exception case. Correct source CSV data for GRN-026 so TC-23 no longer accidentally triggers E12; preserve the golden dataset expectation.

### Files reviewed
- progress.md
- docs/HANDOFF.md
- evals/run_evals.js
- evals/golden_dataset.json
- prompts/01_matching.md
- data/invoices.csv
- data/goods_receipts.csv
- data/purchase_orders.csv
- data/DATA_DICTIONARY.md

### Files changed
- evals/run_evals.js
- data/goods_receipts.csv
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T22-53-44-880Z.json
- evals/results/eval_results_2026-04-27T22-54-35-598Z.json
- evals/results/eval_results_2026-04-27T23-00-22-169Z.json

### E12 behavior after
- E12 fires when `invoice.invoice_date < earliestGrn`.
- E12 does not require quantity over-delivery.
- E03 remains the quantity-over-GRN exception.

### TC-23 data correction
- Changed GRN-026 from 2026-04-28 to 2026-04-26.
- INV-0023 remains dated 2026-04-27.
- PO-023 tax terms remain `Net 30 (Tax 7%)`.
- INV-0023 total remains 461.13, preserving the 8.5% tax mismatch and $6.38 E10 exposure.
- data/DATA_DICTIONARY.md was reviewed and did not require changes because it does not record a specific GRN-026 date.
- evals/golden_dataset.json was not changed.

### Verification commands and results
- `npm run build`: passed with existing Vite large-chunk warning.
- `node evals/run_evals.js`: passed 25/25, 100%.
- TC-13 result check: passed with `["E03","E12"]`.
- TC-23 result check: passed with `["E10"]`.
- `node --check evals/run_evals.js`: passed.
- `node --check api/messages.js`: passed.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only allowed files changed.
- `git status --short`: only intended modified files and generated eval result files before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T23-00-22-169Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this data/eval reconciliation stage.

### Next step
Production Rework Chunk 1.5 dependency pinning and git hygiene.

## Production Rework Chunk 1.5 dependency pinning and git hygiene handoff — April 27, 2026

### Purpose
Make the repository dependency and build-artifact hygiene reproducible for production/team handoff without changing app runtime behavior, prompts, CSV data, eval logic, UI, or Claude API architecture.

### Audit issues fixed
- Replaced `latest` dependency ranges in package.json with exact versions from package-lock.json.
- Confirmed `dist/` is ignored.
- Confirmed no `dist/` artifacts are tracked by git.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- .gitignore
- package.json
- package-lock.json

### Files changed
- package.json
- package-lock.json
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T23-08-26-339Z.json
- evals/results/eval_results_2026-04-27T23-10-10-420Z.json

### Dependency pinning behavior
- `@anthropic-ai/sdk`: `0.91.1`
- `react`: `19.2.5`
- `react-dom`: `19.2.5`
- `recharts`: `3.8.1`
- `@tailwindcss/vite`: `4.2.4`
- `@vitejs/plugin-react`: `6.0.1`
- `autoprefixer`: `10.5.0`
- `tailwindcss`: `4.2.4`
- `vite`: `8.0.10`
- No dependencies were added, removed, or upgraded.
- No scripts were changed.

### package-lock behavior
- Ran `npm install --package-lock-only`.
- package-lock.json changed only to replace the root package `latest` constraints with the exact pinned versions already resolved in the lockfile.
- No resolved package versions or dependency tree entries changed.

### dist/.gitignore behavior
- .gitignore already contained `dist/`.
- No .gitignore edit was needed.
- The existing `.claude/settings.local.json` ignore rule was preserved.

### dist untracking behavior
- `git ls-files dist` returned no tracked files before edits.
- `git ls-files dist` returned no tracked files after verification.
- `git rm -r --cached dist/` was not needed and was not run.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `a67fcb4`, ahead of `origin/main` by 15.
- Pre-edit `git log --oneline -10`: confirmed Chunk 1.4A, 1.3, 1.2, and 1.1 commits.
- Pre-edit `git ls-files dist`: no output.
- Pre-edit `cat .gitignore`: `dist/` already present.
- Pre-edit `cat package.json`: all dependencies/devDependencies used `latest`.
- Pre-edit package-lock root inspection: root constraints used `latest`; resolved package entries had exact versions.
- Pre-edit `npm run build`: passed with existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%.
- `npm install --package-lock-only`: passed; 0 vulnerabilities.
- Final `npm run build`: passed with existing Vite large-chunk warning.
- Final `node evals/run_evals.js`: passed 25/25, 100%.
- `node --check api/messages.js`: passed.
- `grep -R '"latest"' package.json || true`: no matches.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git ls-files dist`: no output.
- `git diff --check`: passed.
- `git diff --name-only`: only allowed files changed.
- `git status --short`: only intended modified files and generated eval result before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T23-10-10-420Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-27T23-08-26-339Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this repo hygiene stage.

### Next step
Production Rework Chunk 1.6 documentation fixes.

## Production Rework Chunk 1.6 documentation fixes handoff — April 27, 2026

### Purpose
Resolve narrow documentation drift from the Claude Code audit without changing runtime behavior, API contracts, prompts 01-03, CSV data, eval harness logic, UI, dependencies, or deployment behavior.

### Audit issues fixed
- Corrected stale model-routing documentation so it matches the source-controlled runtime constants.
- Softened the current architecture-doc reference because the full architecture document is planned but not present yet.
- Updated the README folder tree to match the tracked repo layout and current eval location.
- Left the deployment URL as pending because no live URL is recorded in the repo.
- Added a status note to Prompt 04 clarifying that it is built and covered by TC-26 through TC-28 but not wired into the main CSV analysis pipeline.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- CLAUDE.md
- README.md
- DECISIONS.md
- package.json
- app/ProcureGuard.jsx
- app/lib/claude.js
- app/lib/format.js
- app/lib/uiModels.js
- prompts/04_text_extraction.md
- evals/golden_dataset.json

### Files changed
- CLAUDE.md
- README.md
- prompts/04_text_extraction.md
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-27T23-13-14-912Z.json
- evals/results/eval_results_2026-04-27T23-16-15-050Z.json
- evals/results/eval_results_2026-04-27T23-17-31-544Z.json

### CLAUDE.md model routing correction
- Documented the actual runtime route from app/ProcureGuard.jsx:
  - matching: `claude-haiku-4-5-20251001`
  - classification: `claude-sonnet-4-6`
  - action generation: `claude-sonnet-4-6`
- Clarified that the larger Claude model named in the audit is not used by the current runtime pipeline.
- Replaced the required current architecture-doc reference with HANDOFF guidance plus a note that architecture documentation is planned.

### README structure correction
- Removed the stale test-suite row from the README folder tree.
- Added `api/`, `app/lib/`, `evals/results/`, `DECISIONS.md`, `index.html`, `package-lock.json`, and `vite.config.js`.
- Described `evals/` as the home for the golden dataset, deterministic harness, and generated result artifacts.
- Kept the deployment URL pending and did not invent a live deployment URL.

### Prompt 04 status note
- Added a top-of-file note to prompts/04_text_extraction.md:
  - Built and tested through TC-26 to TC-28 in evals/golden_dataset.json.
  - Not currently wired into the main CSV analysis pipeline.
  - Integration remains a future enhancement.
- No prompt instructions, examples, or schema text were changed.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `07ae585`, ahead of `origin/main` by 16.
- Pre-edit `git log --oneline -10`: confirmed Chunk 1.5, 1.4A, 1.3, 1.2, and 1.1 commits.
- Pre-edit listed-file check: all required files existed.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Post-doc `npm run build`: passed with the existing Vite large-chunk warning.
- Post-doc `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Final post-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Final post-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- `node --check api/messages.js`: passed.
- Documentation drift greps: CLAUDE.md and README.md no longer claim the stale larger-model current route; CLAUDE.md no longer requires the missing architecture document as a current source of truth; README.md no longer references `/tests`. The larger-model string grep returns only protected app display helper labels, not runtime route usage.
- Package/app safety greps: no `latest` dependency string in package.json, no `console.log`, no `localStorage`, no secret logging pattern, no unsafe approval/payment/fraud/email wording in app code, and no `Send` string in app code.
- `git diff --check`: passed.
- `git diff --name-only`: only allowed documentation files changed.
- `git status --short`: only intended modified files plus generated eval result artifacts before staging.

### New eval result file path
- evals/results/eval_results_2026-04-27T23-17-31-544Z.json
- Also generated during post-doc verification: evals/results/eval_results_2026-04-27T23-16-15-050Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-27T23-13-14-912Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this documentation-only stage.
- An empty untracked `tests/` directory exists locally, but there are no tracked test files under it; it was not modified.
- Protected app display/pricing helper maps still contain a label/keyword for a larger Claude model. The runtime constants and call sites do not route to it, and app files were intentionally not touched in this documentation stage.

### Next step
Live local API retest of Chunk 1 changes, then Chunk 2 design system foundation.

## Production Rework Chunk 1.2B cache-aware cost calculation handoff — April 27, 2026

### Purpose
Update existing Claude token cost telemetry so prompt cache write/read usage is priced from reported usage metadata instead of using the prior flat input/output estimate.

### Files reviewed
- AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/lib/dashboard.js
- app/lib/uiModels.js
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/lib/audit.js
- app/lib/format.js
- app/lib/claude.js
- package.json

### Files changed
- app/lib/dashboard.js
- app/lib/uiModels.js
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-28T02-13-43-133Z.json
- evals/results/eval_results_2026-04-28T02-20-10-651Z.json

### Cache usage flow confirmed
- app/lib/claude.js returns `raw.usage` unchanged as `response.token_usage`.
- app/ProcureGuard.jsx passes `response.token_usage` into `createAuditEntry`.
- app/lib/audit.js stores the full safe numeric usage metadata on each audit entry.
- `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens` are preserved when Anthropic returns them.
- Audit entry rows already surfaced per-entry cache write/read token fields.
- Aggregate dashboard and governance cost summaries were the stale flat-cost path.

### Cache-aware cost calculation behavior
- Uses existing model pricing constants only.
- Normal input tokens are calculated as `max(input_tokens - cache_creation_input_tokens - cache_read_input_tokens, 0)`.
- Normal input tokens use the base input rate.
- Cache write tokens use 1.25x the base input rate.
- Cache read tokens use 0.1x the base input rate.
- Output tokens use the base output rate.
- Total estimated cache-aware cost is the sum of normal input, cache write, cache read, and output cost.
- Legacy flat total remains available internally as `estimatedFullPriceCost`, but visible cost panels now use the cache-aware estimate.

### Token/cost telemetry changes
- Audit & Governance runtime telemetry now shows:
  - Cache write tokens
  - Cache read tokens
  - Estimated cache-aware cost
  - Cost per invoice derived from estimated cache-aware cost
- Executive dashboard governance panel now shows cache write/read token totals and estimated cache-aware cost.
- Stage-level audit groups show cache token totals when reported.
- If cache fields are not returned, the UI displays: "Cache usage not available for this run."

### Audit safety behavior
- No raw prompts, raw request payloads, API keys, or secrets were added to audit export.
- app/lib/audit.js export headers and rows were not changed.
- Numeric cache token metadata remains only in in-memory audit entries and UI telemetry, consistent with existing safe usage metadata.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `0041141`, ahead of `origin/main` by 17.
- Pre-edit `git log --oneline -10`: confirmed Chunk 1.6, 1.5, 1.4A, 1.3, 1.2, and 1.1 commits.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Implementation sanity `npm run build`: passed with the existing Vite large-chunk warning.
- Final `npm run build`: passed with the existing Vite large-chunk warning.
- Final `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- `node --check api/messages.js`: passed.
- `grep -R '"latest"' package.json || true`: no matches.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only allowed files changed.
- `git status --short`: only intended modified files and generated eval result artifacts before staging.

### New eval result file path
- evals/results/eval_results_2026-04-28T02-20-10-651Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-28T02-13-43-133Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this cost-calculation stage.
- The handoff heading follows the staged project date requested for this chunk; the generated eval artifacts are timestamped April 28, 2026 UTC.

### Next step
Production Rework Chunk 1.3 structured outputs beta header cleanup.

## Production Rework Chunk 1.3 structured outputs beta header cleanup handoff — April 28, 2026

### Purpose
Inspect and clean structured-output beta header usage while preserving the current Claude Messages API request contract, prompt caching, cache-aware cost handling, model routing, and server-side production API key behavior.

### Files reviewed
- AGENTS.md
- .codex/AGENTS.md
- progress.md
- docs/HANDOFF.md
- app/lib/claude.js
- app/lib/schemas.js
- api/messages.js
- vite.config.js
- package.json
- package-lock.json

### Files changed
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-28T02-53-17-055Z.json
- evals/results/eval_results_2026-04-28T02-55-49-713Z.json
- evals/results/eval_results_2026-04-28T02-58-07-891Z.json

### Structured output request shape confirmed
- app/lib/claude.js builds Claude requests with `output_config: buildStructuredOutputConfig(schema)`.
- app/lib/schemas.js returns `output_config.format` with `type: "json_schema"` and the normalized schema.
- api/messages.js passes `output_config.format` through and re-enforces strict schema compatibility before forwarding to Anthropic.

### Beta header cleanup behavior
- No `anthropic-beta` header was present in app/lib/claude.js, api/messages.js, or vite.config.js.
- No `structured-outputs-2025-11-13` header value was present in app/lib/claude.js, api/messages.js, or vite.config.js.
- No beta header was removed because none existed in the inspected request path.
- No beta header was intentionally kept.

### output_config.format verification
- `output_config.format` remains the active structured-output request shape.
- No `output_config.type` old-shape sender was introduced.
- Existing proxy compatibility normalization remains in api/messages.js and converts accepted legacy shapes to `output_config.format` before upstream forwarding.

### output_format absence
- No literal `output_format` sender or upstream payload field appears in app, api, or Vite source.
- api/messages.js keeps a computed legacy-key compatibility path that deletes/translates the legacy key before forwarding; the current app request path does not use it.

### Prompt caching preservation
- app/lib/claude.js still sends the system prompt as an array of text blocks with `cache_control: { type: "ephemeral" }`.
- api/messages.js normalization does not strip the `system` array or `cache_control` fields.

### Proxy compatibility behavior
- api/messages.js request validation allows the current system array blocks by leaving `system` unmodified.
- `cache_control` is not stripped.
- `output_config.format` is passed through.
- Non-2xx Anthropic responses are forwarded with their upstream status and response body.

### API contract preservation
- Anthropic Messages API remains the application AI stack.
- The GA structured-output request shape is preserved.
- Model routing, chunk size, prompt files, CSV data, golden dataset, eval harness logic, prompt caching behavior, and cache-aware cost calculation were not changed.

### Security behavior
- Production api/messages.js still uses `process.env.ANTHROPIC_API_KEY` for upstream `x-api-key`.
- The production proxy does not forward a browser-supplied API key upstream.
- No direct production browser call to Anthropic was introduced.
- No API key logging was introduced.

### Observer checkpoint findings
- anthropic-beta headers existed: No.
- Beta header removed: No, none existed.
- Beta header intentionally kept: No.
- `output_config.format` still used: Yes.
- `output_format` absent from the current app/API/Vite send path: Yes.
- Prompt caching `cache_control` remains intact: Yes.
- api/messages.js still preserves server-side production API key behavior: Yes.
- Stage followed the production rework plan: Yes; the stage stayed narrow and changed only tracking docs plus generated eval artifacts.
- DECISIONS.md follow-up: None.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `88a380b`, ahead of `origin/main` by 20.
- Pre-edit `git log --oneline -10`: confirmed Chunk 1.2B cache-aware cost calculation and repo-local Codex helper commits in recent history.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Final `npm run build`: passed with the existing Vite large-chunk warning.
- Final `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- `node --check api/messages.js`: passed.
- `node --check app/lib/claude.js`: passed.
- `node --check app/lib/schemas.js`: passed.
- `grep -R "structured-outputs-2025-11-13" app api vite.config.js || true`: no matches.
- `grep -R "anthropic-beta" app api vite.config.js || true`: no matches.
- `grep -R "output_format" app api vite.config.js || true`: no matches.
- `grep -R "output_config:.*type" app api vite.config.js || true`: no matches.
- `grep -R "output_config" app api vite.config.js || true`: confirmed `output_config` usage in app/lib/claude.js and api/messages.js.
- `grep -R '"latest"' package.json || true`: no matches.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only docs/HANDOFF.md and progress.md.
- Final `git status --short` before staging: only intended tracking docs and generated eval results.

### New eval result file path
- evals/results/eval_results_2026-04-28T02-53-17-055Z.json
- evals/results/eval_results_2026-04-28T02-55-49-713Z.json
- evals/results/eval_results_2026-04-28T02-58-07-891Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this header-cleanup stage.
- A transient `.codex` staged-deletion status appeared during verification and was absent on rerun; no `.codex` files were staged or committed for this stage.

### Next step
Production Rework Chunk 2.1 Typography foundation.

## Production Rework Chunk 2.1 Typography foundation handoff — April 28, 2026

### Purpose
Create a professional typography foundation for ProcureGuard AI without changing product structure, layout architecture, pipeline behavior, prompts, data, eval logic, API behavior, dependencies, or Codex tooling.

### Files reviewed
- AGENTS.md
- .codex/AGENTS.md
- progress.md
- docs/HANDOFF.md
- index.html
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- app/lib/format.js
- app/lib/uiModels.js
- package.json
- package-lock.json

### Files changed
- index.html
- app/styles.css
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-28T03-20-38-774Z.json
- evals/results/eval_results_2026-04-28T03-25-12-195Z.json

### Inter font behavior
- Added the Google Fonts CDN Inter stylesheet in index.html.
- Did not add font files, dependencies, or build-tooling changes.
- app/styles.css now applies the shared Inter font stack through `--font-sans` on `:root`, `body`, and `.pg-shell`.

### Typography token changes
- Added `--font-sans`, `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-hero`, `--leading-tight`, and `--leading-body`.
- Replaced rough shared CSS font sizes for page titles, section titles, body copy, metadata, controls, tabs, and table text with token-backed values.
- Replaced shared `font-weight: 650` usage with imported Inter weights.

### Type scale application
- Small labels and captions normalize through the app-scoped `text-xs` override and `pg-kicker` / `pg-meta`.
- Secondary and body text normalize through `text-sm`, `pg-copy`, and table wrappers.
- UI controls normalize through `pg-button`, `pg-control`, and app-scoped base text.
- Section subheaders use the 16px token; page titles use the 20px token.
- Executive hero metric values use the 32px hero token through `pg-hero-value`.

### Tabular number treatment
- Expanded shared tabular number styling through `pg-tabular`, `pg-number`, `pg-metric-value`, `pg-hero-value`, and existing `tabular-nums` usages inside `.pg-shell`.
- Applied `pg-metric-value` and `pg-hero-value` to shared metric components in the app and dashboard.
- Did not change formulas, values, cache-aware cost logic, dashboard calculations, or numeric helpers.

### Line-height/hierarchy changes
- Large and hero values use `--leading-tight` at 1.1.
- Body and explanatory copy use `--leading-body` at 1.5.
- Metadata is quieter through the 11px token and shared metadata color.
- Page titles and section headings are clearer but smaller and less cluttered than the previous clamped sizing.

### Product structure preservation
- Preserved the five-surface IA: Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, and Audit & Governance.
- Did not add Verdict/Evidence/Pattern/Proof sections, scroll briefing architecture, command strip, icons, animations, Send controls, or pipeline states.
- Did not change Claude pipeline behavior, prompts, data, API behavior, eval harness logic, golden dataset, or package dependencies.

### Codex tooling preservation
- .codex/ was read only.
- No GSD, get-shit-done, auto-advance workflow, hook, model/reasoning/sandbox/approval override, or Codex IDE behavior change was introduced.
- Codex guard grep returned no matches before and after editing.

### Observer checkpoint findings
- Stage stayed limited to typography: yes.
- Layout or product architecture changed: no.
- Protected files touched: no.
- Hardcoded typography roughness remains: some legacy Tailwind text utility class names remain in JSX, but they are normalized inside `.pg-shell` through the new app-scoped token overrides.
- Typography changes make the UI clearer without clutter: yes; titles, labels, controls, body copy, metadata, and metric values now have a tighter shared scale.
- GSD/get-shit-done references found or reintroduced: no.
- Gotchas discovered: the required pre-edit eval generated an untracked eval result artifact; the existing Vite large-chunk warning remains.
- Stage followed the production rework plan: yes.

### Verification commands and results
- Pre-edit `git status --short`: clean.
- Pre-edit `git branch -vv`: `main` at `93f72eb`, ahead of `origin/main` by 24.
- Pre-edit `git log --oneline -10`: confirmed recent accepted tooling/API/cache commits.
- Pre-edit `git ls-files .codex | sort`: only `.codex/AGENTS.md`.
- Pre-edit Codex guard grep: no matches.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Post-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Post-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- `node --check api/messages.js`: passed.
- `grep -R '"latest"' package.json || true`: no matches.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- Post-edit Codex guard grep: no matches.
- `git diff --check`: passed.
- `git diff --name-only`: only allowed typography/docs files changed.
- `git status --short`: intended modified files plus generated eval result artifacts before staging.

### New eval result file path
- evals/results/eval_results_2026-04-28T03-25-12-195Z.json
- Also generated during the required pre-edit eval gate: evals/results/eval_results_2026-04-28T03-20-38-774Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this typography stage.
- Some legacy JSX utility class names remain by design; the new foundation normalizes their visual output inside `.pg-shell`.

### Next step
Production Rework Chunk 2.2 Icon system

## Production Rework Chunk 2.1R reference-backed typography audit handoff — April 28, 2026

### Purpose
Inspect selected dashboard and invoice UI references after Chunk 2.1, compare their typography and hierarchy patterns against ProcureGuard, and make only narrow typography refinements that improve clarity without changing product structure or runtime behavior.

### Files reviewed
- AGENTS.md
- .codex/AGENTS.md
- progress.md
- docs/HANDOFF.md
- index.html
- app/ProcureGuard.jsx
- app/ProcureGuardDashboard.jsx
- app/styles.css
- package.json
- package-lock.json

### Reference repos inspected
- /Users/sharan_98/Desktop/procureguard-references/free-react-tailwind-admin-dashboard
  - src/index.css
  - src/components/ecommerce/EcommerceMetrics.tsx
  - src/components/common/ComponentCard.tsx
  - src/components/tables/BasicTables/BasicTableOne.tsx
- /Users/sharan_98/Desktop/procureguard-references/shadcnspace
  - src/app/globals.css
  - src/components/common/typography.tsx
  - src/components/shadcn-space/blocks/dashboard-shell-01/page.tsx
  - src/components/shadcn-space/blocks/dashboard-shell-01/statistics.tsx
  - src/components/shadcn-space/blocks/dashboard-shell-01/top-product-table.tsx
- /Users/sharan_98/Desktop/procureguard-references/tailwindcss-invoice-dashboard
  - index.html
  - style/tailwind.css

### Reference principles adapted
- Keep dashboard labels quiet, compact, and secondary to the metric value.
- Preserve dense 13px-14px body/table readability for invoice and review workflows.
- Use 16px card or section headings and 20px-32px metric values only where hierarchy needs it.
- Keep numeric displays stable and aligned with tabular treatment.
- Avoid negative tight letter-spacing on metric values and operational identifiers.
- Maintain muted dark-mode metadata so raw technical details do not dominate decision surfaces.

### Reference ideas rejected
- Did not adopt icon-heavy navigation, decorative imagery, or sidebar-driven dashboard structure.
- Did not adopt oversized 30px+ card metrics for ordinary ProcureGuard panels.
- Did not adopt alternate font families, shadcn component imports, Tailwind theme rewrites, or any dependency changes.
- Did not adopt broad color palette changes, marketing-style hero typography, animations, or card layout redesigns.
- Did not copy code directly from any reference repo.

### Files changed
- app/styles.css
- progress.md
- docs/HANDOFF.md
- evals/results/eval_results_2026-04-28T03-33-36-294Z.json
- evals/results/eval_results_2026-04-28T03-37-42-544Z.json

### Typography refinements made
- Added an app-scoped `.pg-shell .tracking-tight` override so existing tight tracking utility usage resolves to zero letter spacing inside ProcureGuard.
- Added explicit zero letter spacing to `pg-metric-value` and `pg-hero-value`.
- Kept the Chunk 2.1 Inter import, type tokens, tabular number treatment, and line-height hierarchy intact.
- Did not change JSX structure, layout grids, navigation, content order, values, calculations, or pipeline state.

### Product structure preservation
- Preserved the five-surface IA: Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, and Audit & Governance.
- Did not add icons, animations, command strip, scroll briefing architecture, Verdict/Evidence/Pattern/Proof sections, Send controls, or new pipeline states.
- Did not modify app/lib, api, prompts, data, eval harness logic, golden dataset, package files, or .codex.

### Verification commands and results
- Pre-edit `git status --short`: clean before the required baseline eval generated an eval artifact.
- Pre-edit `git branch -vv`: `main` at `4093ae2`, ahead of `origin/main` by 25.
- Pre-edit `git log --oneline -10`: confirmed Chunk 2.1 typography foundation commit at HEAD.
- Pre-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Pre-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- Post-edit `npm run build`: passed with the existing Vite large-chunk warning.
- Post-edit `node evals/run_evals.js`: passed 25/25, 100%, with 3 text extraction tests included.
- `node --check api/messages.js`: passed.
- `grep -R '"latest"' package.json || true`: no matches.
- `grep -R "console.log" app api || true`: no matches.
- `grep -R "localStorage" app api || true`: no matches.
- `grep -R "x-api-key.*console\|apiKey.*console\|ANTHROPIC_API_KEY.*console" app api || true`: no matches.
- `grep -R "AUTO-APPROVE\|auto-approve\|auto approve\|automated approval\|AI decided\|fraud detected\|payment released\|email sent" app || true`: no matches.
- `grep -R "Send" app || true`: no matches.
- `grep -R -n "GSD\|gsd\|get-shit-done\|auto_advance\|--auto\|autonomous\|model_reasoning_effort\|reasoning_effort\|approval_policy\|sandbox_mode" .codex 2>/dev/null || true`: no matches.

### New eval result file path
- evals/results/eval_results_2026-04-28T03-33-36-294Z.json
- evals/results/eval_results_2026-04-28T03-37-42-544Z.json

### Known issues
- The existing Vite production large-chunk warning remains.
- No live Claude API retest was run during this reference-backed typography audit.
- Some legacy JSX utility class names remain by design; app-scoped CSS normalizes the typography output without widening the stage.

### Next step
Production Rework Chunk 2.2 Icon system

## Production Rework Chunk 2.2 Icon system

### What changed
- Added lucide-react@1.11.0 as a pinned dependency
- Imported 15 icons: AlertCircle, AlertTriangle, BarChart3, CheckCircle2, Circle, Download, Key, Loader2, Moon, Play, RotateCcw, Shield, Sun, TrendingUp, Upload
- Added icons to all 5 WORKSPACE_TABS entries
- Added icons to ProgressPanel step badges (CheckCircle2 complete, Loader2 spinning, Circle pending)
- Added Key icon to API key label
- Added Play/Loader2 to Analyze button states
- Added Sun/Moon to dark mode toggle
- Added Download to export button
- Added RotateCcw to reset button
- Upload icon to file upload zone

### Files modified
- app/ProcureGuard.jsx (icon imports + all icon placements)
- package.json (lucide-react dependency added)

### Verification
- 25/25 evals passing
- No linting errors
- Committed as eff6bbf

### Known issues
- Badge component missing gap-1.5 class (icon-text spacing bug) — deferred to Chunk 2.3
- Four badges missing dark mode variants — deferred to Chunk 2.3

### Next step
Production Rework Chunk 2.3 Correctness and accessibility fixes

## Production Rework Chunk 2.3 Correctness and accessibility fixes

### What changed

**Badge fixes:**
- Added `gap-1.5` to Badge component in both ProcureGuard.jsx and ProcureGuardDashboard.jsx for icon-text spacing
- Added dark mode variants to 6 badges: tolerance slider "affected", "Simulation only", "Policy simulation changed", decision card outcome, and ProgressPanel complete/running step badges

**Accessibility:**
- Added `aria-hidden="true"` to all 15 decorative icons (icons alongside visible text labels); Sun/Moon in dark mode toggle excluded (button has aria-label)
- Added `role="alert"` and `aria-live="assertive"` to the Alert component for screen reader announcements
- Added `aria-live="polite"` to ProgressPanel status message
- Added `prefers-reduced-motion: reduce` media query to styles.css (disables animations and transitions)
- Added `spellCheck={false}` to API key input
- Added `color-scheme` and `theme-color` meta tags to index.html

**Polish:**
- Replaced three-period "Analyzing..." with proper ellipsis character "Analyzing…"
- Replaced all bare `transition` classes with `transition-colors` (4 instances: retry button, approve button, mark reviewed button, export audit CSV button)

**Documentation:**
- Wrote Chunk 2.2 Icon system handoff section in HANDOFF.md
- Wrote Chunk 2.3 handoff section in HANDOFF.md
- Updated progress.md

### Files modified
- app/ProcureGuard.jsx (badge gap, dark mode variants, aria attributes, spellCheck, transition-colors, ellipsis)
- app/ProcureGuardDashboard.jsx (badge gap, dark mode variant on decision card)
- app/styles.css (prefers-reduced-motion media query)
- index.html (color-scheme and theme-color meta tags)
- docs/HANDOFF.md (Chunk 2.2 and 2.3 handoff sections)
- progress.md (completion status update)

### Verification
- 25/25 evals passing
- Build succeeds (expected large-chunk warning only)
- No bare `transition` classes remaining
- No console.log, no "Send" buttons, no HITL violations
- All colored Badge instances have dark mode variants

### Known issues
- The existing Vite production large-chunk warning remains

### Next step
Production Rework Chunk 2.4 Premium visual polish

## Production Rework Chunk 2.4 Premium visual polish

### What changed

**Change 1 — Content section entry animations:**
- Added `@keyframes pg-fade-in` (0.3s ease-out, opacity 0→1, translateY 6px→0)
- Applied `pg-animate-in` class to all 5 workspace content surfaces (Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, Audit & Governance)
- Header, tab bar, and dark mode toggle are NOT animated

**Change 2 — Skeleton loading placeholders:**
- Added `@keyframes pg-shimmer` and `.pg-skeleton` class with light/dark gradient variants
- Created `SkeletonCard` component (aria-hidden, pg-card wrapper with 3 shimmer bars)
- Executive Summary shows 3-card skeleton grid when `runningStep` is truthy and no dashboard data
- Exception Workbench shows 4-card skeleton stack when `runningStep` is truthy and no rows

**Change 3 — Card hover elevation:**
- Added `.pg-card-interactive` class (translateY -1px, subtle box-shadow on hover, dark variant)
- Applied to `InvoiceCard` in Exception Workbench and `HeroMetricCard` in Executive Summary dashboard
- Not applied to tolerance simulator, audit trail, or form panels

**Change 4 — Tab content crossfade:**
- Added `.pg-tab-content` class (reuses pg-fade-in at 0.2s)
- Wrapped workspace content area in `<div className="pg-tab-content" key={activeWorkspace}>` so React remounts on tab switch, retriggering the fade

**Change 5 — Upload zone refinement:**
- Replaced `border-dashed` with solid `border-slate-200` and subtle `bg-slate-50/50` background
- Added hover state: `hover:border-slate-300 hover:bg-slate-50` with dark variants

**Change 6 — Topbar bottom border:**
- Added `border-b border-slate-200/80 dark:border-slate-700/60` to the header element

**All animations honor `prefers-reduced-motion: reduce`** (media query from Chunk 2.3 sets animation-duration and transition-duration to 0.01ms)

### CSS additions
- `@keyframes pg-fade-in` — entry animation
- `.pg-animate-in` — 0.3s entry class
- `.pg-tab-content` — 0.2s crossfade class
- `@keyframes pg-shimmer` — skeleton loading
- `.pg-skeleton` / `.dark .pg-skeleton` — shimmer gradient
- `.pg-card-interactive` / `.dark .pg-card-interactive:hover` — hover elevation

### Files modified
- app/styles.css (6 new CSS blocks)
- app/ProcureGuard.jsx (SkeletonCard component, pg-animate-in on surfaces, pg-tab-content wrapper, upload zone, topbar border, pg-card-interactive on InvoiceCard)
- app/ProcureGuardDashboard.jsx (pg-card-interactive on HeroMetricCard)

### Verification
- 25/25 evals passing
- Build succeeds (expected large-chunk warning only)
- No new dependencies added
- No console.log, no "Send" buttons, no HITL violations

### Known issues
- The existing Vite production large-chunk warning remains

### Next step
Production Rework Chunk 2.5 or final review

---

## Production Rework — Chunk 2.5: Brand identity, navigation, chart, and table polish

**Goal:** Close the remaining visual gaps between the current product and an industry-standard premium dashboard. Six surgical changes. CSS and JSX only. Zero new dependencies.

### Change 1 — Sticky branded topbar with mark
- Topbar is now `position: sticky` with `backdrop-filter: saturate(140%) blur(10px)` and semi-transparent background (light/dark)
- Added `.pg-brand`, `.pg-brand-mark` (gradient square with Shield icon), and `.pg-version-pill` (v1.0)
- Responsive `margin-inline` / `padding-inline` at 640px and 1024px breakpoints to match shell padding
- `pg-app-title` font-size reduced from `var(--text-hero)` (2rem) to `1.25rem` for tighter topbar; `--text-hero` token untouched
- `pg-app-subtitle` margin-top reduced from `0.5rem` to `0.25rem`

### Change 2 — Tab underline indicator
- Replaced heavy solid-fill `.pg-tab-active` with transparent background + blue `::after` underline (2px, `border-radius: 2px`)
- Tab color shifted from `#475569` to `#64748b` (light) / `#94a3b8` (dark) for more restrained inactive state
- Underline uses `bottom: 0` to stay within overflow bounds of `.pg-tabs`
- `.pg-tabs-list` gap reduced from `0.5rem` to `0.25rem`
- Dark mode underline uses `#60a5fa`

### Change 3 — Chart polish (Recharts)
- `ChartTooltip`: severity-colored dot before label, backdrop blur, tighter padding, separated name/value layout
- `ExceptionBarChart`: added `<defs>` block with linear gradients per tier (55%→100% opacity left-to-right)
- `Cell fill` switched from solid `exceptionColor()` to `url(#pg-bar-tier{n})`
- Tooltip cursor uses very low opacity fill for hover feedback
- Bar animation enabled (`animationDuration={600}`) gated by `prefers-reduced-motion` check via `window.matchMedia` at render time (no useEffect)

### Change 4 — Table system consolidation
- Added CSS rules to `.pg-table-wrap` for `thead` (sticky, background), `th` (padding, uppercase, letter-spacing, color, border-bottom), `tbody tr` (hover transition), `td` (padding, border-bottom, color)
- Added `.pg-table-num` (right-aligned, monospace, tabular-nums) and `.pg-table-num-header` (right-aligned)
- Migrated 5 tables (model routing, supplier scorecard ×2, exception heatmap ×2) to use bare `<thead>`/`<tbody>` with CSS-driven styling
- Removed duplicated Tailwind classes (`bg-slate-50 text-xs font-semibold uppercase tracking-wide`, `divide-y divide-slate-200`, `hover:bg-slate-50`, inline `px-3 py-3 text-right font-mono tabular-nums`) from all migrated tables
- Numeric columns use `pg-table-num` / `pg-table-num-header` classes

### Change 5 — EmptyState glyph
- `EmptyState` (Dashboard) and `WorkbenchEmptyState` (ProcureGuard) now accept optional `icon` prop
- Icon renders as a muted 40×40 rounded-lg container with 20×20 icon above the eyebrow
- Icon mapping: `BarChart3` for awaiting-analysis/executive, `Loader2` for in-progress, `AlertCircle` for failed, `CheckCircle2` for clean/no-exceptions, `Building2` for supplier states, `Shield` for governance, `TrendingUp` for policy simulator
- Added `Building2`, `FileText` to lucide-react import in ProcureGuard.jsx
- Added `BarChart3`, `Building2`, `CheckCircle2`, `Loader2` import in ProcureGuardDashboard.jsx

### Change 6 — Button system extension
- Added `.pg-button-ghost` (transparent background, slate text, hover at 5% opacity)
- Added `.pg-button-sm` (2rem min-height, smaller padding and font-size)
- Added `.pg-button:not(:disabled):active` press feedback (`translateY(1px)`) with `prefers-reduced-motion` override
- No existing buttons migrated in this chunk (additive only, deferred to avoid regression)

### CSS additions
- `.pg-topbar` — sticky positioning, backdrop-filter, responsive margin/padding
- `.pg-brand`, `.pg-brand-mark`, `.pg-version-pill` — brand identity
- `.pg-tab` / `.pg-tab-active` — underline indicator pattern
- `.pg-table-wrap thead/th/tbody tr/td` — table system
- `.pg-table-num`, `.pg-table-num-header` — numeric column alignment
- `.pg-button-ghost`, `.pg-button-sm` — button variants
- `.pg-button:active` — press feedback

### Lucide imports added
- `Building2`, `FileText` in `app/ProcureGuard.jsx`
- `BarChart3`, `Building2`, `CheckCircle2`, `Loader2` in `app/ProcureGuardDashboard.jsx`

### Files modified
- `app/styles.css` (table system, topbar, tabs, button variants — ~220 lines added/changed)
- `app/ProcureGuard.jsx` (topbar brand, table migration, EmptyState icons, lucide imports)
- `app/ProcureGuardDashboard.jsx` (chart tooltip/gradient, table migration, EmptyState component + icons, lucide imports)

### Verification
- 25/25 evals passing
- Build succeeds (expected large-chunk warning only)
- No changes to `app/lib/`, `api/`, `prompts/`, `data/`, `evals/`, `package.json`
- No `console.log`, no "Send" buttons, no HITL violations
- No new dependencies

### Known issues
- The existing Vite production large-chunk warning remains

### Next step
Live end-to-end Claude API verification, then Stage 6.2 documentation package, then Vercel deploy

---

## Production Rework Chunk 3.1 — Pipeline Latency Optimization — April 30, 2026

### Optimizations implemented

#### Optimization 1: Bounded parallel chunks within each stage
- Replaced sequential `for await` loop in `runMatchingChunks`, `runClassificationChunks`, and `runActionGenerationChunks` with bounded-concurrency parallel execution via `runChunksWithConcurrency`
- Concurrency caps: **5** for matching (Haiku), **3** for classification and action generation (Sonnet)
- These caps are conservative defaults based on typical Anthropic API per-key concurrency limits
- Results are returned in original chunk-index order to preserve downstream merge correctness
- Fail-fast: first error stops new work, in-flight workers drain, then error propagates
- Shared mutable state reference (`stateRef.current`) ensures `markPipelineChunk*` calls always read the latest state, which is safe because JavaScript is single-threaded and state mutations happen synchronously between `await` points
- Status messages now show rolling completion counts (`"Matching 3/5 chunks complete..."`) instead of per-chunk progress
- `waitForChunkWindow()` delay between chunks is no longer called; rate limiting is handled by bounded concurrency and the existing retry policy in `callClaudeAPI`

#### Optimization 2: Skip draft generation for clean rows
- Before calling the action generation Claude API for each chunk, the batch is filtered to include only invoices whose classification has at least one exception (`detected_exceptions.length > 0`)
- If all invoices in a chunk are clean: Claude call is skipped entirely; synthetic results are produced using the existing `createDefaultActionResult` function from `pipeline.js`; audit entry records `model: "skipped_no_exceptions"` with `input: ""` and `response: null`
- If some invoices have exceptions: Claude is called with only the exception invoices; `normalizeActionChunkResults` rehydrates the response by filling in `createDefaultActionResult` for clean invoices, maintaining original chunk order
- If all invoices have exceptions: no filtering needed, full batch sent as before
- Token savings are proportional to the clean-row rate in the dataset

#### Optimization 3: Pipeline early-start (deferred)
- Starting classification chunk 1 as soon as matching chunk 1 finishes (rather than waiting for all matching chunks) would further reduce wall-clock time
- **Not implemented** in this chunk because it significantly complicates retry semantics and partial-result saving — the run state machine would need to track per-chunk progression across stages rather than per-stage
- Documented as future work

### Concurrency caps rationale
- Matching uses Haiku (`claude-haiku-4-5-20251001`): lighter model, higher per-key concurrency available → cap at 5
- Classification and action generation use Sonnet (`claude-sonnet-4-6`): heavier model, lower per-key concurrency → cap at 3
- These are conservative defaults chosen to avoid 429 rate-limit storms; do not raise without empirical measurement

### Synthetic clean row schema
- Uses `createDefaultActionResult(invoice, classification)` from `pipeline.js`, which produces: `{ invoice_number, overall_tier, actions: [], audit_entry: { timestamp_placeholder: "not_generated_clean_invoice", prompt_version: "03_action_generation_v1", action_count: 0 } }`
- This is the same shape already used by `normalizeActionChunkResults` when Claude omits clean invoices from its response
- Conforms to the `actionOutputSchema` in `schemas.js`

### Wall-clock and token measurements
- **Before**: 7.8 minutes (reported baseline from sequential execution of 25-invoice golden batch)
- **After**: pending live measurement with real API key (code changes verified offline via build + evals)
- **Target**: ≥ 50% wall-clock reduction from parallelism alone (15 sequential calls → at most 3 sequential batches per stage)
- **Token cost**: should be equal or lower — same prompts, same schemas, plus token savings from skipping clean-row drafts

### Helper added
- `runChunksWithConcurrency(items, runOne, concurrency)` in `app/lib/pipeline.js`
- Worker-pool pattern: spawns `min(concurrency, items.length)` workers, each pulls the next item from a shared index
- Returns results in original item order (not completion order)
- Fail-fast: stops dispatching new items after first error, drains in-flight workers, then throws

### Files modified
- `app/lib/pipeline.js` — added `runChunksWithConcurrency`, exported `createDefaultActionResult`
- `app/ProcureGuard.jsx` — added concurrency constants, refactored three stage runners to use parallel execution, added skip-clean logic to action generation

### Verification
- 25/25 evals passing
- Build succeeds (expected large-chunk warning only)
- No changes to `api/`, `prompts/`, `data/`, `evals/`, `package.json`
- No new dependencies
- Retry semantics preserved: `startIndex` parameter slices items before parallel execution; partial-result saving via `markPipelineChunkSucceeded` per chunk is unchanged
- Audit trail: per-chunk metadata intact, skipped chunks recorded with `model: "skipped_no_exceptions"`

### Known issues
- Wall-clock measurement pending live API test
- The existing Vite production large-chunk warning remains

### Next step
Chunk 3.2 storytelling redesign

---

## Production Rework Chunk 4.1 — Design System Replacement Foundation — April 30, 2026

### Goal
Replace the visual foundation with the approved full-white material direction while preserving the existing application architecture and interaction model.

### What changed
- Reworked the app token layer in `app/styles.css` around a uniform warm-white canvas, white material surfaces, subtle borders, low-opacity material shadows, and severity-only state color.
- Shifted the primary typography direction to an OpenAI/SF-like sans stack with Geist as the webfont fallback and Geist Mono for invoice IDs, money, run IDs, audit metadata, and other data-dense values.
- Removed the stale `--text-hero` usage and tightened the shared type scale so old Tailwind-sized text maps into the new token system.
- Kept the topbar and tabs quiet: translucent warm-white material, restrained ink brand mark, pill-like active tabs, no heavy underline or decorative gradient.
- Refreshed skeleton, card, table, button, and severity token behavior without changing product data paths.

### Files modified
- `index.html`
- `app/styles.css`

### Notes
- OpenAI Sans is referenced only as a first-choice font name in the CSS stack. The shipped webfont remains Geist unless licensed OpenAI Sans assets are later added.
- No product AI runtime changes were made. Claude remains the application AI stack.

---

## Production Rework Chunk 4.2 — Executive Summary Rebuild / Payment Run Command Center — April 30, 2026

### Goal
Rebuild Executive Summary into a story-led enterprise command surface: business outcome first, AI work visible, release-to-pay decision clear, evidence shown, drafts safe, audit trail quiet but present.

### Components added or replaced
- `ExecutiveHeadline` — outcome-first hero with `$ protected before payment release`, run metadata, KPI trio, and primary actions.
- `AiWorkLedger` — compact visible AI feature: invoices checked, exceptions routed, drafts prepared, audit events, and zero autonomous payments.
- `OutcomeRibbon` — release-to-pay decision with hold/review/safe counts and explicit autonomous-action guardrail.
- `WorkflowRhythm` — PO → Receipt → Invoice → AI Match → Review → Draft rail plus 25-mark severity rhythm strip.
- `EvidenceLens` — one-invoice proof view showing PO quantity, receipt quantity, invoice quantity, finding, decision, and human action.
- `DraftsHero` — AI Prepared Work inbox with DRAFT-only language and Workbench click-through.
- `MoneyDriversPanel`, `SupplierRiskPattern`, `AuditReplay`, and `TrustFooter` — exposure drivers, supplier concentration, audit-stage replay, and mono trust footer.

### View-model additions
- `getRhythmStripData`
- `getOutcomeAsideCounts`
- `getKpiTrio`
- `getDraftsInboxViewModel`
- `getTrustFooterViewModel`
- Added supporting executive view-model data for AI ledger, run metadata, evidence lens, supplier risk pattern, and audit replay.

### Analytics additions
- `batchValue` / `totalInvoiceAmount` from invoice `total_amount`
- `supplierCount`
- `warehouseCount`

### Workbench wiring
- “Open held invoices” routes to the existing Workbench with the Tier 3 filter active.
- Draft rows route to the existing Workbench and focus the matching invoice via `scrollIntoView`.
- No new send capability, payment automation, or draft-delivery behavior was added.

### Verification
- `npm run build` passed.
- `node evals/run_evals.js` passed: 25/25 tests, 100% pass rate.
- HITL wording preserved on the rebuilt Executive Summary: drafts are DRAFT-only, human approval required, and no Send button was added.
- Post-build hardening removed the dead Recharts render path from the Executive Summary module so the rebuilt surface no longer imports charting code; package removal is still left to Chunk 4.4.
- Pipeline run state now records `runStartedAt`, `runCompletedAt`, and `totalLatencyMs`; run metadata prefers the completed timestamp when showing the command-center close time.
- Final fundamentals audit tightened responsive tab/icon sizing, adjusted OKLCH severity and muted-ink tokens to meet AA contrast when used as text, and removed visible provider-brand wording from the user-facing app while leaving the Claude API architecture unchanged.

### Deferred
- Recharts package-lock/package removal remains deferred to Chunk 4.4.
- Cross-surface visual consistency for Workbench, Supplier & Policy Analytics, and Audit & Governance remains Chunk 4.3.

---

## Final Enterprise Copy Polish — April 30, 2026

### Goal
Tighten visible product language to a premium enterprise standard without changing behavior, data flow, Claude runtime architecture, prompts, schemas, eval logic, or HITL controls.

### What changed
- Replaced implementation-heavy visible wording such as “prompt chain” and “browser-only pattern review” with customer-facing language: “analysis workflow” and “local pattern review.”
- Backgrounded provider details in user-facing UI while preserving the existing Claude API integration internally.
- Refined Start-page copy around payment-run files, local development key handling, and readiness states.
- Tightened workspace tab helper labels so they read as product navigation rather than status logs.
- Updated Drafts language from “Nothing sends automatically” to “Nothing leaves the system automatically,” and changed the promise to “Reviewed by you · released by you.”
- Kept AI visible as a product capability through AI checks, AI-prepared drafts, model trace, audit evidence, and DRAFT-only controls.

### Verification scope
- No pipeline, prompt, schema, API route behavior, eval logic, package dependency, or send/payment capability was changed.

---

## Frost-White Material Polish — April 30, 2026

### Goal
Move the shell from warm-white toward a cleaner frost-white material direction, with restrained glassmorphism and smoother tab motion.

### What changed
- Rebased global background tokens to a cooler near-white canvas while preserving zinc ink and severity-only color.
- Added glass-like material depth through translucent white surfaces, hairline borders, inset highlights, and softer shadows.
- Kept real `backdrop-filter` restrained to the sticky topbar and compact AI ledger so the UI feels premium without heavy rendering cost.
- Smoothed tab active/hover transitions with a material highlight layer, short responsive labels, and a clearer active state.
- Reduced the paper-grain overlay so the white background stays crisp rather than warm or dusty.

### Verification scope
- Visual-only CSS changes; no AI runtime, data, prompt, eval, HITL, or API behavior changed.

---

## Tab Interaction Accent Polish — April 30, 2026

### Goal
Make workspace tab selection visibly interactive without turning the whole tab into a blue chip.

### What changed
- Rebalanced the selected tab state: label text stays strong ink, while the icon, bottom hairline, and click feedback use restrained system blue.
- Moved blue emphasis to the places where it belongs in this product shell: brand mark, primary actions, selected navigation icon, focus, and press feedback.
- Deepened the neutral ink scale and normalized common Slate text utilities inside the app shell so body text and metadata no longer read washed out.
- Softened the blue intensity and made the upload file button tonal so it reads as part of the upload card instead of a heavy external callout.
- Reduced the clicked-tab focus ring so the visible state is primarily the icon plus bottom indicator, with a subtler accessibility outline.
- Added a quick press/settle state for tab clicks so the transition is visible and modern without feeling playful.
- Preserved neutral frost-white navigation chrome; blue is used for interaction affordance, not severity.

### Verification scope
- CSS-only interaction polish; no component structure, data flow, AI runtime, HITL, or eval behavior changed.

---

## Professional Icon System + Premium Metadata Polish — May 1, 2026

### Goal
Bring the app shell and Executive Summary closer to the approved frost-white, premium enterprise direction with a coherent product icon language, professional wording, share metadata, and responsive/dark-mode polish.

### What changed
- Added `app/ProcureGuardIcons.jsx`, a local inline SVG icon set for the ProcureGuard mark, workspace tabs, procurement workflow, evidence records, AI-prepared work, suppliers, and audit trail.
- Replaced generic workspace/workflow/evidence/audit outline icons with muted full-color 2D procurement icons:
  - Procurement document blue for purchase orders.
  - Teal truck with warm cardboard-brown cargo box for goods receipt evidence.
  - Blue/periwinkle document for supplier invoices and draft work.
  - Amber/periwinkle scale for matching.
  - Green shield/check for audit and completion.
- Kept severity colors semantically separate: green, amber, and red remain tied to clean/review/escalation status rather than decorative icon color.
- Replaced the topbar shield-only mark with a custom frosted rounded-square shield/document/check brand glyph.
- Added a topbar run-status pill using professional DRAFT-only language.
- Tightened visible copy from implementation/provider language toward customer-facing enterprise wording while preserving the Claude API runtime architecture internally.
- Updated `index.html` with a stronger title, description, Open Graph, Twitter card metadata, and frost-white theme color. Canonical URL was intentionally omitted because no production domain is confirmed.
- Added CSS sizing, dark-mode treatment, responsive rules, focus states, and reduced-motion-compatible transitions for the new icon system.

### Responsive and accessibility notes
- Workspace tabs retain five equal columns on desktop and compress to short labels on tablet/mobile.
- Full-color icons scale through CSS hooks so navigation, workflow nodes, evidence cells, audit replay, and upload controls do not stretch or crowd.
- Mobile topbar now stacks the run-status pill above the action controls and keeps tap targets comfortable.
- Existing reduced-motion rules continue to suppress motion globally.
- Important product and SEO copy remains real HTML text, not image-only content.

### Verification
- `npm run build` passed after integration.
- `node evals/run_evals.js` passed: 25/25 tests, 100% pass rate.
- Local dev server responded at `http://127.0.0.1:5173/` and served the updated metadata.
- Browser visual automation was attempted through the in-app browser plugin, but the browser runtime timed out while attaching to the page. Static responsive/CSS review and build verification were completed instead.

### Constraints preserved
- No OpenAI runtime API, agent framework, RAG/vector database, Python backend, database persistence, real email sending, or send button was added.
- Claude API remains the application AI stack.
- DRAFT-only and human-approval wording remains visible.
- No fake customers, testimonials, awards, compliance claims, or fabricated proof were introduced.

---

## Enterprise Apple-Caliber Final Polish — May 1, 2026

### Goal
Push the approved frost-white direction from visually improved to enterprise-grade: sharper contrast, calmer purple-blue action color, intentional dark mode, consistent full-color icon treatment, premium empty states, and responsive validation across representative breakpoints.

### What changed
- Rebalanced the global frost-white tokens, glass borders, shadows, radius scale, and graphite ink scale so surfaces feel premium without heavy decoration.
- Shifted the interaction accent from a louder system blue toward a calmer periwinkle/purple-blue used for primary actions, selected tabs, focus, and AI activity.
- Rebuilt dark mode at the token layer instead of relying on one-off dark utilities. Dark surfaces now use graphite/navy material layers, readable ink, softened borders, and visible secondary actions.
- Added lightweight empty-state preview structures so Workbench, Summary, Supplier, and Audit empty states feel complete before analysis runs without inventing data.
- Refined the custom ProcureGuard brand glyph with a layered frosted tile and shield/check mark while preserving the approved full-color 2D icon direction.
- Added an inline SVG favicon to avoid the browser fallback `/favicon.ico` request and keep share/browser chrome aligned with the product mark.
- Normalized common Tailwind slate/blue/indigo/green/amber/red utility colors inside the app shell to the design tokens for better cross-surface consistency.
- Preserved provider abstraction: user-facing UI continues to say AI service / AI-prepared / DRAFT-only, not provider-specific model branding.

### Responsive and accessibility notes
- Headless Chrome CDP visual checks covered mobile, tablet, desktop, short laptop, ultrawide, light mode, dark mode, and Workbench empty state.
- Checked for horizontal overflow at 390x844, 834x1112, 1366x768, 1440x900, and 1920x1080; no horizontal overflow was detected.
- Focusable controls remained present across tested views, and existing reduced-motion rules still collapse transitions and animations.
- Dark mode title, card, shell, and button colors were inspected through computed styles after setting the app's session dark-mode flag.

### Verification
- `npm run build` passed.
- `node evals/run_evals.js` passed: 25/25 tests, 100% pass rate.
- Headless Chrome runtime/visual smoke checks passed with no console warnings/errors after the favicon fix.

### Constraints preserved
- No pipeline, prompt, Claude API, schema, eval, package dependency, autonomous sending, real email, or persistence behavior was changed.
- The work stays in the existing React/Vite/CSS architecture and uses no new dependencies.

---

## Final Visual Hardening Pass — May 3, 2026

### Goal
Address the last approved premium-polish items before handoff: make the frost-white interface brighter without dull metadata, keep the purple-blue action color calm, reduce overused glass treatment, improve mobile topbar proportions, and make the custom icon system feel intentional at small and large sizes.

### Source-backed design checks used
- Apple Human Interface Guidelines direction for restrained materials, clear hierarchy, consistent symbols, accessibility, and motion restraint.
- W3C/WCAG guidance for focus visibility, contrast, target comfort, and reduced-motion support.
- Geist typography guidance from Vercel for crisp product UI text and data-heavy layouts.
- Repo evidence from the current React/Vite/CSS implementation, existing five-tab information architecture, DRAFT-only workflow, and no-send product constraint.

### What changed
- Tuned the graphite ink scale so metadata and helper text remain readable in light mode instead of appearing washed out.
- Softened the primary purple-blue accent and disabled Analyze state so action controls feel premium but not overbearing.
- Reduced decorative glass by making the AI ledger an opaque material row with only a subtle inset highlight.
- Tightened the mobile topbar grid so the theme toggle and Analyze button stay inline with the container and avoid a full-width stretched button feel.
- Simplified the brand mark hover treatment and normalized product icon rendering with non-scaling strokes, calmer inactive tab icon opacity, and the approved brown cargo-box truck treatment.

### Constraints preserved
- No Claude/Gemini/provider migration was performed in this pass.
- No pipeline, prompt, schema, eval, API, package, dependency, persistence, or real-send behavior changed.
- DRAFT-only and human-reviewed language remains visible.

---

## Launch-Level Frontend Hardening — May 3, 2026

### Goal
Close the final Apple-style launch polish gaps identified after the no-edit design review: dark-mode root consistency, clean accessible tab names, stricter mobile touch comfort, a simpler small-size brand mark, and a cleaner local-key form structure.

### What changed
- Dark mode now syncs to `html` and `body`, not only `.pg-shell`, and updates the browser theme color. This prevents white edge/overscroll flashes in dark mode.
- `index.html` includes a small pre-render dark-mode bootstrap so stored dark mode applies before React mounts.
- Workspace tabs now expose clean accessible names (`Start`, `Summary`, `Workbench`, `Suppliers`, `Audit`) while preserving the visible helper text.
- Mobile topbar and upload controls now use 44px touch-height targets.
- The topbar brand mark and favicon were simplified for small-size readability while preserving the approved frost-white/periwinkle shield direction.
- The session-only local development key input now sits inside a semantic form to remove the Chrome password-field structure warning.
- Very narrow mobile screens now show a compact run-status label (`Ready · DRAFT-only`) to reduce right-side visual weight.

### Verification
- `npm run build` passed.
- `node evals/run_evals.js` passed: 25/25 tests, 100% pass rate.
- `git diff --check` passed.
- Headless Chrome viewport checks covered 320, 390, 834, 1366x768, 1440x900, and 1920x1080 in light and dark mode with no horizontal overflow.
- Verified dark mode sets both `html.dark` and `body.dark`; computed `body` and shell backgrounds both resolve to the dark token.
- Verified mobile touch targets for theme, Analyze, and Choose files are 44px high at 320/390px widths.
- Verified workspace tab accessible labels are clean.
- In-app browser reload confirmed the updated app loads at `http://127.0.0.1:5173/`.

### Remaining verification
- A live populated golden-batch visual pass still requires a session API key and was not run in this hardening pass.

---

## Gemini Runtime Migration — May 4, 2026

### Goal
Replace the application AI runtime with a low-cost Gemini path for the interview/LinkedIn showcase while preserving the existing ProcureGuard architecture: prompt chaining, structured JSON outputs, chunk validation, audit logging, DRAFT-only communications, and human review controls.

### What changed
- Replaced `app/lib/claude.js` with `app/lib/gemini.js`.
- Runtime model routing now uses `gemini-2.5-flash` for matching, classification, and action generation.
- Gemini requests use `generateContent` with:
  - `systemInstruction` for the stage prompt.
  - `contents` for chunk payloads.
  - `generationConfig.responseMimeType = "application/json"`.
  - `generationConfig.responseJsonSchema` from the existing structured-output schemas.
  - `temperature = 0` for stable demo output.
- `api/messages.js` now forwards to Gemini through `process.env.GEMINI_API_KEY` and only allows the approved `gemini-2.5-flash` model.
- `vite.config.js` now proxies local `/api/messages` traffic to Gemini and maps the session-only local key from `x-api-key` to `x-goog-api-key`.
- Token usage normalization maps Gemini `usageMetadata` into the existing audit fields: `input_tokens`, `output_tokens`, and `cache_read_input_tokens`.
- Cost telemetry now uses Gemini 2.5 Flash pricing: `$0.30 / 1M input tokens` and `$2.50 / 1M output tokens`.
- Removed the unused `@anthropic-ai/sdk` dependency.
- Updated `AGENTS.md`, `CLAUDE.md`, `README.md`, and `progress.md` to reflect the Gemini runtime.

### Constraints preserved
- No prompt files, CSV parsing logic, eval logic, HITL labels, DRAFT-only behavior, real-email behavior, database persistence, RAG/vector database, Python backend, or autonomous agent behavior changed.
- The app still calls only `/api/messages` from the browser.
- Production keeps the provider key server-side.
- Local development keeps the key session-only.

### Required deployment change
- Replace `ANTHROPIC_API_KEY` with `GEMINI_API_KEY` in the deployment environment.
- Restart the local dev server after this migration so the Vite proxy reloads.

### Verification status
- `node --check api/messages.js`: passed.
- `node --check app/lib/gemini.js`: passed.
- `node --check vite.config.js`: passed.
- `git diff --check`: passed.
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- Gemini request-body dry run passed against the matching schema.
- Serverless proxy contract dry run passed with a mocked upstream fetch and confirmed `/v1beta/models/gemini-2.5-flash:generateContent`.
- Local Vite server restarted at `http://127.0.0.1:5173/` and returned HTTP 200.
- A live Gemini golden-batch run still requires a real Gemini API key and will incur provider cost.

---

## Gemini Live-Run Hardening — May 4, 2026

### Trigger
The first local Gemini run stopped during matching with rate-limit pressure and an output-token-limit failure. The old Claude-era chunk concurrency started too many requests at once for a low-tier Gemini key, and the 8,192-token output cap was too tight for structured JSON plus Gemini thinking behavior.

### What changed
- Gemini chunk execution is now conservative:
  - matching concurrency: `1`
  - classification concurrency: `1`
  - draft-generation concurrency: `1`
- `app/lib/gemini.js` now spaces provider requests by at least 7 seconds. This keeps the demo path below the published free-tier 10 RPM ceiling for Gemini 2.5 Flash.
- Gemini retry backoff now starts at 15 seconds and honors `retryDelay` when the API returns retry metadata.
- `maxOutputTokens` was raised from 8,192 to 32,768 for all three stages.
- Gemini thinking is now explicit:
  - matching: thinking budget `512`
  - classification: thinking budget `1024`
  - draft generation: thinking budget `1024`
- Gemini `thoughtsTokenCount` is included in the existing output-token/cost telemetry so estimated cost does not undercount thinking tokens.
- The failed-run detail grid now uses fewer columns and breakable value text so long values no longer wrap one character per line.
- Retry status copy now says the AI service is busy and shows the wait time before retry.

### Trade-off
The live demo is intentionally slower, but materially more reliable and still well under the user's stated <$5 budget expectation for a small 25-invoice showcase batch. This is the correct trade-off for an interview/LinkedIn side project because a completed auditable run is more valuable than faster partial failure.

### Verification
- `node --check app/lib/gemini.js`: passed.
- Gemini request-body dry run verified `responseJsonSchema`, `maxOutputTokens`, and stage thinking budgets.
- `git diff --check`: passed.
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `curl -I http://127.0.0.1:5173/`: returned HTTP 200.

### Remaining verification
- Restart the analysis from the app to clear the retained failed partial state.
- A successful live populated golden-batch run still requires the user's Gemini key in the local app field.

---

## Gemini Analysis Quality Guard — May 4, 2026

### Goal
Preserve procurement-analysis quality after the provider migration by removing stale provider-specific prompt instructions and ensuring every stage still runs with schema enforcement, deterministic generation, and enough bounded reasoning budget for the task.

### Source-backed model call
- Google AI model docs last updated April 30, 2026 describe `gemini-2.5-flash` as the best price-performance Gemini 2.5 model for low-latency, high-volume tasks that require reasoning.
- The same docs note that preview/latest model aliases can carry restrictive rate limits, deprecation risk, or hot-swapped behavior. For this interview demo, the stable explicit model name is the safer quality/reliability choice than chasing a preview alias.

### What changed
- Updated `prompts/01_matching.md`, `prompts/02_classification.md`, `prompts/03_action_generation.md`, and `prompts/04_text_extraction.md` so the prompt metadata and schema-enforcement language describe Gemini structured JSON output instead of Claude/Anthropic Structured Outputs.
- Kept the procurement rules, thresholds, few-shot examples, output shapes, and DRAFT-only communication rules unchanged.
- Raised the matching-stage thinking budget from `0` to `512` tokens. Matching is deterministic, but it still performs multi-document reconciliation and arithmetic, so a small nonzero budget is a better quality/cost trade-off for the showcase run.
- Preserved classification and draft-generation thinking budgets at `1024`.
- Updated `DECISIONS.md` so the accepted model-routing and structured-output decisions match the Gemini runtime.

### Verification
- Prompt/provider grep confirmed no Claude/Anthropic provider terms remain in runtime prompts or active app/API config.
- Gemini request-body dry run verified:
  - `responseMimeType = "application/json"`
  - `responseJsonSchema` present for matching, classification, and action generation
  - stage thinking budgets: matching `512`, classification `1024`, action generation `1024`

### Remaining verification
- Run `node evals/run_evals.js` and `npm run build` after this patch.
- A successful live Gemini golden-batch run still requires the user's key and uploaded CSVs in the browser.

---

## Gemini Quota-Aware Run Hardening — May 5, 2026

### Trigger
A live local run still hit Gemini quota pressure. After the retry hardening, the app correctly surfaced the provider signal as daily quota exhaustion instead of the prior generic `AI API rate limit persisted after 3 attempts` message.

### What changed
- The default 25-invoice demo batch now runs as one chunk instead of five:
  - matching calls: `5 -> 1`
  - classification calls: `5 -> 1`
  - draft generation calls: up to `5 -> 1`
- Stage `maxOutputTokens` now uses Gemini's safe configured ceiling of `65,536` for matching, classification, and draft generation so the larger one-chunk demo has enough structured-output headroom.
- Gemini request spacing remains conservative at 12 seconds.
- Gemini rate-limit retry behavior now:
  - uses 4 attempts instead of 3
  - starts rate-limit backoff around a minute
  - honors provider retry-delay metadata when present
  - detects daily quota exhaustion and marks it non-retryable
  - tells the user to wait for reset or use a billing-enabled Gemini key

### Trade-off
This is the right demo-mode trade-off for a 25-invoice portfolio showcase: fewer calls reduces request quota pressure and latency without lowering model quality, prompt strictness, schema enforcement, or HITL safeguards. The cost impact remains small because the same information is produced with less repeated prompt overhead.

### Live verification
- Restarted the local run after the first hardening patch.
- Confirmed the app switched from `3/5` old chunking to `2/3` under the first patch.
- Gemini then returned daily quota exhaustion. The UI marked the failure as non-retryable and did not offer unsafe retry.
- A successful end-to-end populated run now requires quota reset or a billing-enabled Gemini key.

---

## Desktop Visual QA and Launch Polish — May 5, 2026

### Goal
Raise the desktop/web UI from a polished operational dashboard toward a more art-directed, launch-quality product surface without reducing utility, changing the Gemini pipeline, or hiding DRAFT-only human-review constraints.

### What changed
- Tightened the visual system with a dedicated `--radius-card` and `--shadow-precision` token so dense dashboard containers feel more deliberate and less pillowy.
- Improved populated-state alignment rules for the draft inbox, supplier risk pattern, supplier scorecard, invoice rows, and audit replay.
- Normalized custom icon rendering through geometric stroke settings and a calmer top-nav icon treatment.
- Added restrained motion choreography for invoice row expansion, workflow connectors, audit replay nodes, and desktop hover states.
- Split Vite output into React and Lucide icon chunks so the app bundle is smaller and browser caching is cleaner.

### Verification
- `node evals/run_evals.js`: passed, 25/25.
- `npm run build`: passed.
- `git diff --check -- app/styles.css vite.config.js`: passed.
- `curl -I http://127.0.0.1:5173/`: returned HTTP 200.
- Headless Chrome desktop tab sweep at 1920px confirmed no horizontal overflow in Start, Executive, Workbench, Analytics, or Audit empty states.
- Desktop screenshots captured at 1440px, 1920px, and 2560px.

### Remaining verification
- Full populated-state visual QA still depends on a successful live run in the same browser session that has the user's Gemini key. Headless QA cannot access session-local secrets or React state from the in-app browser.

---

## Populated Audit Replay Spacing Polish — May 5, 2026

### Trigger
The completed-run Executive Summary screenshot showed the Audit Replay rail occupying only the upper portion of a tall stretched card, leaving excessive blank space below the replay stages.

### What changed
- The lower Executive Summary two-column grid now aligns cards to their natural height instead of stretching both columns equally.
- The Audit Replay card uses tighter vertical padding, a narrower rail, slightly stronger stage labels, and smaller icon nodes to reduce dead space without making the component cramped.

### Verification
- `npm run build`: passed.
- `git diff --check -- app/styles.css`: passed.

---

## Populated Desktop QA, Data Consistency, and Gemini Reliability — May 6, 2026

### Goal
Verify the completed dashboard with populated golden-batch data across the main desktop widths, then fix visible data/story mismatches and Gemini failure handling without changing the DRAFT-only workflow or analysis quality.

### What changed
- Fixed action-generation alignment for duplicate invoice numbers when Gemini returns only non-clean action rows. Clean duplicate rows now receive synthetic no-draft action results, and the matching non-clean duplicate consumes the returned draft row.
- Changed the Executive Summary supplier panel column label from `Exposure held` to `Exposure` so the panel matches the source-of-truth metric it renders.
- Reduced the default Gemini analysis chunk size from 25 to 10 invoices. This lowers structured JSON output-limit risk while keeping the same prompts, schemas, model, validation, and HITL behavior.
- Classified Gemini `MAX_TOKENS` failures as `Output limit` with a direct restart instruction instead of a generic AI-service failure.

### Populated QA coverage
- Ran a deterministic Gemini-shaped browser QA pass using the golden CSVs and app pipeline.
- Captured populated screenshots for Executive Summary, Workbench, Supplier & Policy Analytics, and Audit & Governance at 1440px.
- Captured Executive Summary screenshots at 1366x768, 1536x864, 1728x972, 1920x1080, 2560x1440, and dark mode at 2560x1440.
- Captured a running-stage screenshot at 1366x768 to verify the active pipeline stage, pulse/ring treatment, and connector visibility.

### Validation
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `git diff --check -- app/ProcureGuard.jsx app/ProcureGuardDashboard.jsx app/lib/gemini.js app/lib/pipeline.js docs/HANDOFF.md progress.md`: passed.
- Browser QA reported `overflowX: 0` at every tested desktop viewport.
- Populated QA confirmed 13 draft rows, 13 draft total, 4 escalation memos, 7 supplier follow-ups, 2 approval requests, $4,126.13 held, and $2,691.13 exposure where those metrics are surfaced.
- Keyboard/reduced-motion check confirmed keyboard focus reaches workspace tabs with a visible outline and reduced-motion collapses animation/transition durations.

### Remaining caveat
- The populated QA used deterministic Gemini-shaped responses from the golden dataset rather than the user's session-local live API key, because the local browser key is intentionally not exposed to shell automation. Live Gemini remains dependent on the user's key, billing/quota state, and provider latency.

---

## Professional Brand and Copy Cleanup — May 6, 2026

### Goal
Remove prototype-feeling or implementation-heavy wording from prominent product surfaces while preserving audit metadata, DRAFT-only safeguards, and service-key transparency.

### What changed
- Removed the `v1.0` badge from the topbar brand lockup so the primary identity reads as `ProcureGuard AI` with the quieter `Payment Control` subtitle.
- Deleted the now-unused `.pg-version-pill` CSS.
- Reframed the visible API-key panel from `Local development key` to `Session API key`.
- Replaced visible `local development`, `local key`, and `local pattern review` language with more product-grade session/workspace and batch-pattern wording.
- Kept prompt version metadata in the Executive Summary trust footer and audit/governance surfaces, where versioning supports traceability instead of weakening the brand mark.
- Updated AI service authentication and quota messages to avoid provider/prototype wording in normal user-facing failure states.

### Validation
- Searched active app sources for remaining visible `Local development`, `local key`, `Local pattern review`, `pg-version-pill`, and brand `v1.0` references.
- The only remaining `v1.0` app reference is the prompt version in `getTrustFooterViewModel`, which is intentional audit metadata.
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `git diff --check -- app/ProcureGuard.jsx app/ProcureGuardDashboard.jsx app/lib/uiModels.js app/lib/gemini.js app/styles.css docs/HANDOFF.md progress.md`: passed.
- Chrome headless rendered the Start screen at 1440x900 and confirmed the cleaned terms are absent from the rendered DOM.

---

## Brand Image and Posting Asset Refresh — May 6, 2026

### Goal
Update the browser/share/posting image assets so the cleaned ProcureGuard identity is reflected outside the app chrome as well as inside the UI.

### What changed
- Added `public/procureguard-mark.svg` as the real favicon source instead of keeping the mark only as an inline data URI in `index.html`.
- Renamed the mobile/home-screen PNG to `public/procureguard-touch-icon.png` so the asset name is product-owned.
- Added `public/procureguard-og.svg` as the editable source for the social preview image.
- Added `public/procureguard-og.png` at 1200x630 for Open Graph and Twitter preview metadata.
- Added `public/procureguard-post-preview.png` at 2400x1260 for high-resolution portfolio/social posting.
- Added `public/procureguard-post-dashboard.svg` and `public/procureguard-post-dashboard.png` at 2400x1350 for a high-resolution populated dashboard showcase image.
- Removed the weak empty-start screenshot from posting assets; it was technically high-resolution but not useful for LinkedIn/portfolio presentation.
- Updated `index.html` with favicon, touch icon, Open Graph image, Twitter large-image card, image dimensions, and image alt metadata.

### Validation
- Rendered `public/procureguard-og.png` from the SVG source and visually checked it for clipping/overlap.
- Re-rendered `public/procureguard-touch-icon.png` through a fitted HTML wrapper after the direct SVG screenshot clipped the icon.
- Rendered and visually checked `public/procureguard-post-preview.png` and `public/procureguard-post-dashboard.png`; neither includes the old topbar `v1.0` badge.
- Verified image dimensions:
  - `public/procureguard-og.png`: 1200x630
  - `public/procureguard-touch-icon.png`: 180x180
  - `public/procureguard-post-preview.png`: 2400x1260
  - `public/procureguard-post-dashboard.png`: 2400x1350
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `git diff --check -- index.html public docs/HANDOFF.md progress.md`: passed.
- Dev server returned HTTP 200 for `/procureguard-og.png`, `/procureguard-mark.svg`, `/procureguard-touch-icon.png`, `/procureguard-post-preview.png`, and `/procureguard-post-dashboard.png`.

---

## Showcase Image Set — May 6, 2026

### Goal
Create posting-ready images in the approved warm-white ProcureGuard visual language for Executive Summary, Exception Workbench, Audit & Governance, and dark-mode Executive Summary.

### What changed
- Added `public/procureguard-showcase-executive.svg` and `public/procureguard-showcase-executive.png` at 1600x2400.
- Added `public/procureguard-showcase-workbench.svg` and `public/procureguard-showcase-workbench.png` at 1600x2400.
- Added `public/procureguard-showcase-governance.svg` and `public/procureguard-showcase-governance.png` at 1600x2400.
- Added `public/procureguard-showcase-executive-dark.svg` and `public/procureguard-showcase-executive-dark.png` at 1600x2400.
- Added retina PNG exports at 3200x4800 for all four showcase images:
  - `public/procureguard-showcase-executive-retina.png`
  - `public/procureguard-showcase-workbench-retina.png`
  - `public/procureguard-showcase-governance-retina.png`
  - `public/procureguard-showcase-executive-dark-retina.png`
- Used the cleaned ProcureGuard mark, product-owned warm paper surface, frosted navigation, editorial serif hierarchy, tabular money values, restrained color severity, and DRAFT-only trust language.
- Kept these files as static portfolio/posting assets; no runtime UI logic or Gemini pipeline behavior changed.

### Visual QA
- Visually inspected all four rendered PNGs.
- Fixed the Audit & Governance SVG XML entity issue so the PNG renders the actual image instead of a browser parser error.
- Removed visible old version text from public showcase image sources.
- Widened the Executive and Dark Executive T3 decision pills to prevent label clipping.
- Added vertical breathing room in the Executive and Dark Executive drafts cards so summary totals do not crowd the last row.

### Validation
- Verified showcase PNG dimensions are 1600x2400.
- Verified retina PNG dimensions are 3200x4800.
- `xmllint --noout` passed for the showcase SVGs and posting SVGs.
- `rg -n "v1\\.0|pg-version-pill|apple-touch-icon.png" public/procureguard-showcase-*.svg public/procureguard-og.svg public/procureguard-post-dashboard.svg index.html`: no matches.

---

## Killer Feature Public Image — May 6, 2026

### Goal
Create a public/GitHub-ready hero image that highlights the product's strongest feature: evidence-backed, DRAFT-only supplier communication prepared by AI but controlled by the human reviewer.

### What changed
- Added `public/procureguard-killer-feature.svg` as the editable source.
- Added `public/procureguard-killer-feature.png` at 2400x1350 for README, GitHub, and standard social sharing.
- Added `public/procureguard-killer-feature-retina.png` at 4800x2700 for high-resolution public posting.
- Framed the message around the safest public claim: "AI prepares the work. Humans approve the release."
- Highlighted the draft inbox, evidence lens, audit trace, DRAFT-only status, and no-send-capability guardrail.

### Validation
- Visually inspected the rendered PNG and fixed copy/card overlap before finalizing.
- Verified image dimensions:
  - `public/procureguard-killer-feature.png`: 2400x1350
  - `public/procureguard-killer-feature-retina.png`: 4800x2700

---

## Original Live Screenshot Set - May 6, 2026

### Goal
Create original, high-resolution screenshots from the running React app for public/GitHub use, separate from the static SVG showcase assets.

### What changed
- Added `app/lib/demoRun.js`, a development-only deterministic golden-batch run builder that uses the repository CSV data and `evals/golden_dataset.json` to populate the real app state without reading an API key or calling Gemini.
- Added development-only URL seeding in `app/ProcureGuard.jsx` behind `?pgDemo=golden`, with optional `pgTab=` and `pgTheme=` parameters for screenshot capture.
- Captured live browser PNGs from `http://127.0.0.1:5173` into `public/live-screenshots/`:
  - `procureguard-live-executive.png`
  - `procureguard-live-workbench.png`
  - `procureguard-live-analytics.png`
  - `procureguard-live-governance.png`
  - `procureguard-live-executive-dark.png`
- Expanded the live screenshot set with additional full-page captures and focused crops:
  - `procureguard-live-start.png`
  - `procureguard-live-start-dark.png`
  - `procureguard-live-workbench-dark.png`
  - `procureguard-live-analytics-dark.png`
  - `procureguard-live-governance-dark.png`
  - `procureguard-live-executive-desktop-1440.png`
  - `procureguard-live-workbench-desktop-1440.png`
  - `procureguard-live-crop-executive-hero.png`
  - `procureguard-live-crop-ai-checks-evidence.png`
  - `procureguard-live-crop-drafts-killer-feature.png`
  - `procureguard-live-crop-workbench-queue.png`
  - `procureguard-live-crop-supplier-scorecard.png`
  - `procureguard-live-crop-audit-governance.png`

### Notes
- These are original screenshots of the live Vite/React UI rendered in Chrome headless at 2x scale.
- They are deterministic demo screenshots, not screenshots from a paid Gemini API run. This keeps public image generation reproducible and avoids exposing or depending on a browser-stored API key.
- Normal product analysis behavior is unchanged. The demo seed is only active in development when the `pgDemo=golden` query parameter is present.

### Validation
- `npm run build`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `git diff --check`: passed.
- Verified live screenshot dimensions:
  - Executive light: 3200x5200
  - Executive dark: 3200x5200
  - Workbench: 3200x4400
  - Analytics: 3200x4400
  - Audit & Governance: 3200x4400
  - Start light/dark: 3200x3600
  - Dark Workbench/Analytics/Audit & Governance: 3200x4400
  - 1440 desktop captures: 2880x3600
  - Focused crops: 3200px wide, 1600-1850px tall

---

## Public README and Screenshot Handoff - May 6, 2026

### Goal
Rewrite the public repository README so it explains ProcureGuard AI clearly for GitHub, LinkedIn, and interview review, while using original live screenshots and avoiding unsupported product claims.

### What changed
- Rebuilt `README.md` around the product outcome: payment-run control, exception evidence, DRAFT-only follow-up work, and human approval.
- Added the live drafts crop as the primary hero image because it best shows the product's strongest feature.
- Added a four-screen product walkthrough using original live screenshots for Executive Summary, Exception Workbench, Supplier Analytics, and Audit & Governance.
- Documented the current architecture accurately: React/Vite/Tailwind frontend, Gemini 2.5 Flash runtime, structured JSON output, browser CSV parsing, Vercel serverless proxy, deterministic eval harness, and session-local state.
- Removed stale framing that no longer matched the current repo, including old chart-library references.
- Added `public/live-screenshots/README.md` to explain which screenshot assets to use for GitHub, LinkedIn, portfolio posts, full-page documentation, and focused feature callouts.

### Notes
- The README uses only repo-backed counts and claims. It does not claim autonomous payment release, email sending, customer adoption, security certification, or production SLA.
- Public copy keeps Gemini in the architecture section and keeps model/provider branding out of the user-facing product story.
- The screenshot guide explicitly states that the live screenshots are deterministic demo captures, not paid Gemini-run screenshots and not static SVG mockups.

### Validation
- `git diff --check`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `npm run build`: passed.
- README/screenshot-guide wording scan for stale provider, chart-library, old version-badge, and generic marketing terms: passed for `README.md` and `public/live-screenshots/README.md`.

---

## Publication and Deployment Readiness Cleanup - May 6, 2026

### Goal
Prepare the repository for public review and deployment handoff without pushing, deploying, or exposing secrets.

### What changed
- Added `.env.example` with the required `GEMINI_API_KEY` variable name only.
- Added `DEPLOYMENT.md` with Vercel prerequisites, local verification, production environment setup, post-deploy smoke checks, failure checks, and rollback guidance.
- Updated `README.md` to use focused live screenshot crops in the product walkthrough so GitHub and LinkedIn previews stay readable and lighter than full-page captures.
- Added a current-runtime snapshot at the top of this handoff log so old Claude/Anthropic implementation history is not confused with the current Gemini runtime.

### Notes
- No live deploy was run during this pass.
- No real API key was read, written, printed, or committed.
- A GitHub Actions workflow was prepared locally but not published because the current GitHub token does not have `workflow` scope. Add CI later from an account/token with workflow permission.

### Validation
- `git diff --check`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `npm run build`: passed.
- README image reference check: passed; referenced live screenshot PNGs exist.
- Current public docs scan for stale Claude/Anthropic/Recharts/old-version/generic-marketing wording: passed.
- Secret-pattern check for committed Gemini key values: passed; only placeholder environment variable names remain.

---

## README Architecture Diagram - May 6, 2026

### Goal
Add a clear end-to-end architecture diagram for public reviewers, interview readers, and future maintainers.

### What changed
- Added a GitHub-renderable Mermaid diagram to `README.md`.
- Diagram covers browser upload, CSV parsing, session-local state, pipeline orchestration, the three prompt stages, structured JSON schemas, Gemini client routing, local Vite proxy, production Vercel proxy, Gemini 2.5 Flash, validation/merge, view models, product surfaces, eval harness, and deterministic screenshot seed.
- Added operational boundary notes clarifying local session-key behavior, production server-side `GEMINI_API_KEY`, structured JSON validation, DRAFT-only review, no sending, no payment release, and no database.

### Validation
- `git diff --check`: passed.
- `node evals/run_evals.js`: passed, 25/25.
- `npm run build`: passed. Vite emitted a plugin timing warning only; build exit code was 0.

### Follow-up simplification
- Replaced the first detailed Mermaid diagram with a simpler public README diagram covering only the main flow: procurement CSVs, React browser app, Gemini analysis pipeline, API/proxy boundary, Gemini structured JSON, review surfaces, and human approval.
- Replaced HTML line breaks and special glyphs in the Mermaid node labels with plain text so GitHub can render the diagram reliably.
- Replaced the Mermaid block with a plain text architecture diagram after live GitHub inspection showed the rendered page can still present the block as a loading/error surface. Plain text is less decorative but guaranteed to display for every reader.
