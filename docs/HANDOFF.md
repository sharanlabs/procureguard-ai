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
