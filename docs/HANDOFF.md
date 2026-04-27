# ProcureGuard AI — Handoff Log

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
