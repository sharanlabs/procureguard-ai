# ProcureGuard AI Methodology and Validation

This document explains how ProcureGuard AI produces a review result, what guardrails are in place, and how the project validates accuracy. It is based on the current repository implementation, not on implied model behavior.

## Goal

ProcureGuard is a payment-review workflow for purchase orders, supplier invoices, and goods receipts. It does not release payments, send supplier communications, or replace AP review. Its job is to prepare structured evidence, exception classifications, follow-up material, and an audit trail for human review.

## Technical Frameworks

- **Frontend:** React `19.2.5`, Vite `8.0.10`, Tailwind CSS `4.2.4`, Lucide icons.
- **AI runtime:** Gemini `2.5 Flash` through the `generateContent` API.
- **Deployment:** Vercel static Vite output plus the `api/messages.js` serverless function.
- **CI:** GitHub Actions running `npm ci`, `node evals/run_evals.js`, and `npm run build`.
- **Validation:** deterministic golden dataset in `evals/golden_dataset.json` and executable checks in `evals/run_evals.js`.

## Step-by-Step Pipeline

### 1. Input contract and CSV validation

The browser accepts three CSV files: `purchase_orders.csv`, `invoices.csv`, and `goods_receipts.csv`. The app parses them in session memory and checks that required file types and data fields are present before analysis starts.

Why this matters: the model receives structured procurement records instead of free-form files. That reduces ambiguity and gives the downstream stages a stable contract.

Relevant code: `app/lib/csv.js`, `app/ProcureGuard.jsx`, `data/DATA_DICTIONARY.md`.

### 2. Matching

The matching prompt compares invoice rows against purchase orders and goods receipts, then emits one structured result per invoice. It covers all 17 exception codes, including unit-price variance, quantity mismatch, missing goods receipt, duplicate invoice number, invalid PO reference, tariff-adjusted variance, and timing issues.

Why this matters: matching is the evidence stage. It records document references, deltas, detected exception codes, confidence, and reasoning before any severity or follow-up work happens.

Relevant code: `prompts/01_matching.md`, `matchingOutputSchema` in `app/lib/schemas.js`.

### 3. Deterministic matching guards

After the model returns matching output, the app applies deterministic guard checks, including global PO-reference checks and duplicate-invoice checks. The app also verifies that each stage returns the expected number of rows and safely aligns results by `invoice_number`.

Why this matters: model output is treated as data that must be checked before it can drive UI state. The pipeline rejects missing, extra, duplicate, or unsafe result rows instead of silently rendering them.

Relevant code: `applyGlobalMatchingGuards`, `validateAndAlignResults`, and `validateMergedResults` in `app/lib/pipeline.js`.

### 4. Classification

The classification prompt turns detected exceptions into severity tiers, financial exposure, hold amounts, approved amounts, recommended actions, and human-review flags.

Why this matters: classification is separated from matching so a reviewer can trace "what was found" separately from "what should happen next."

Relevant code: `prompts/02_classification.md`, `classificationOutputSchema` in `app/lib/schemas.js`.

### 5. Follow-up preparation

The action-generation prompt prepares supplier follow-ups, procurement requests, escalation memos, and audit notes. The UI presents them as review material only. There is no email sending, payment release, or autonomous action execution.

Why this matters: this keeps the AI workflow inside a human-in-the-loop operating model and avoids excessive agency.

Relevant code: `prompts/03_action_generation.md`, `actionOutputSchema` in `app/lib/schemas.js`, `DraftPanel` in `app/ProcureGuard.jsx`.

### 6. Audit and governance

Each completed or failed stage appends audit metadata with timing, model route, chunk range, output summary, token usage when available, and failure state when applicable. Audit export excludes service keys and request payloads.

Why this matters: the run can be reviewed after the fact without exposing API keys or raw request bodies in the audit export.

Relevant code: `app/lib/audit.js`, `buildGovernanceViewModel` in `app/lib/uiModels.js`, `GovernancePanel` in `app/ProcureGuard.jsx`.

## AI Guardrails

- **Prompt chaining, not an autonomous agent:** the stages are fixed: match, classify, prepare follow-up. The model does not decide which tools to call or what action to execute.
- **Structured outputs:** every AI stage requests JSON output using `responseMimeType: "application/json"` and `responseJsonSchema`.
- **Schema normalization:** schemas are normalized to the supported Gemini structured-output subset before being sent.
- **Temperature 0:** requests are configured for deterministic-style output where the provider supports it.
- **Result alignment checks:** every model response must match expected invoice counts and invoice numbers.
- **No automatic external action:** the app does not send email, create payment releases, call ERP systems, or persist approvals to a backend.
- **Server-side production key:** production Gemini access is gated by `GEMINI_API_KEY` in Vercel and the browser does not receive that key.
- **Secret leak detection:** pipeline objects are scanned for known API-key patterns before dry-run validation succeeds.
- **Retry boundaries:** rate limit, timeout, network, and retryable server failures are classified and surfaced instead of being hidden.

## Hallucination and Accuracy Boundary

ProcureGuard reduces hallucination risk; it does not claim to eliminate it.

The project reduces unsupported output through structured CSV inputs, constrained prompts, JSON schemas, deterministic guards, row-count checks, invoice alignment checks, human-review-only actions, and golden-dataset evals. A result is considered review-supporting, not legally certified. A human still validates source documents, supplier context, policy exceptions, and payment decisions before acting.

## Validation Model

### Deterministic evals

`node evals/run_evals.js` loads the sample CSVs and `evals/golden_dataset.json`, then verifies expected exception codes, tiers, clean/exception status, and financial calculations for 25 procurement tests covering all 17 exception types.

Expected result:

```bash
total_procurement_tests: 25
passed: 25
failed: 0
pass_rate: 100%
text_extraction_tests_included: 3
```

### Build validation

`npm run build` runs the Vite production build and produces the deployable `dist/` output.

### CI validation

`.github/workflows/ci.yml` runs the same install, eval, and build gates on pushes and pull requests to `main`.

### Manual production validation

Production checks should verify that:

- The deployed app loads with no console errors.
- The three CSV files can be uploaded and analyzed.
- All five workspaces populate after analysis.
- Prepared follow-up material remains human-review gated.
- No send or payment-release action exists.
- Public assets such as `procureguard-og.png`, `procureguard-mark.svg`, and `procureguard-touch-icon.png` return HTTP 200.

## Source Basis

Repo evidence is the primary source for this document. External references were used only to verify platform and risk-management claims:

- Google AI for Developers: Gemini structured output with `responseMimeType` and `responseJsonSchema`: https://ai.google.dev/gemini-api/docs/structured-output
- Vercel environment variables and deployment environments: https://vercel.com/docs/environment-variables
- Vite production builds: https://vite.dev/guide/build
- npm `ci` behavior for clean automated installs: https://docs.npmjs.com/cli/v11/commands/npm-ci
- GitHub Actions workflow syntax and job model: https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax
- NIST AI Risk Management Framework trustworthiness characteristics: https://www.nist.gov/itl/ai-risk-management-framework/ai-risk-management-framework-faqs
- OWASP Top 10 for LLM Applications risk categories, including prompt injection, insecure output handling, excessive agency, and overreliance: https://owasp.org/www-project-top-10-for-large-language-model-applications/

## What Is Not Proven

- The evals prove behavior on the synthetic golden dataset, not every real supplier, tax, tariff, ERP, or policy scenario.
- The app does not validate against live ERP records.
- The audit export supports review but is not a legal compliance certification.
- The model can still produce incorrect reasoning or wording; schema and guardrails reduce the risk and make failures easier to detect.
