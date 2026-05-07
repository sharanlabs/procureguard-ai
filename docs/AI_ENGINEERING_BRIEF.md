# AI Engineering Brief

This brief explains the engineering craft behind ProcureGuard AI for reviewers, hiring managers, and AI practitioners. It complements `docs/METHODOLOGY.md`: the methodology document explains how the system works; this document explains why the design choices are credible.

## Reviewer Signal

The project is designed to show that an AI feature can be useful without becoming an uncontrolled automation system. The core signal is not "uses Gemini." The core signal is:

- a clear high-stakes workflow boundary;
- structured inputs and structured outputs;
- deterministic checks around probabilistic model calls;
- human approval for external or financial action;
- documented assumptions, limitations, and validation gates;
- a deployed product that can be reviewed end to end.

## Context

ProcureGuard reviews payment-run evidence across purchase orders, supplier invoices, and goods receipts. It prepares exception evidence, severity classifications, review-ready follow-up material, and audit records.

The workflow is intentionally narrow. It does not connect to ERP systems, move money, send emails, persist approval records, or learn from user behavior. Those constraints are deliberate because procurement payment decisions are financial-control decisions.

## Assumptions

These assumptions are explicit so reviewers can see the system boundary:

- Input data is CSV-based and follows the data dictionary in `data/DATA_DICTIONARY.md`.
- The golden dataset is synthetic and covers representative exception patterns, not every real procurement edge case.
- The model can make reasoning or wording mistakes, so model output is treated as untrusted data until schema, row-count, invoice-alignment, and deterministic guard checks pass.
- Human reviewers remain accountable for payment release, supplier communication, and policy exceptions.
- Production Gemini access is server-side through Vercel. Browser-entered keys are for local development only.
- Audit export supports review and traceability, but it is not a legal compliance certification.

## Design Principles

### 1. Augment, do not automate financial control

The app prepares evidence and review material. It does not send supplier messages, release payments, or write to an ERP. This follows the product principle that high-stakes financial workflows need human control, not opaque automation.

Repo evidence: `prompts/03_action_generation.md`, `app/ProcureGuard.jsx`, `docs/DECISIONS.md`.

### 2. Prefer a fixed chain over an autonomous agent

The business process has a known sequence: match, classify, prepare follow-up, audit. An autonomous agent would add unnecessary action-selection risk. A fixed prompt chain makes each stage easier to test, retry, explain, and audit.

Repo evidence: `docs/DECISIONS.md` decisions 001 and 002.

### 3. Treat model output as data, not truth

Gemini returns structured JSON, but the app still validates row counts, invoice numbers, duplicate invoices, invalid PO references, schema shape, and merge alignment before rendering results.

Repo evidence: `app/lib/schemas.js`, `app/lib/pipeline.js`, `app/lib/gemini.js`.

### 4. Make trust inspectable

The UI exposes evidence, confidence metadata, exception rationale, review routes, workflow trace, runtime telemetry, and audit export. The README and docs explain the procedure and source basis.

Repo evidence: `app/lib/uiModels.js`, `app/ProcureGuard.jsx`, `docs/METHODOLOGY.md`, `README.md`.

### 5. Validate with executable checks

The project uses deterministic golden evals and a production build gate instead of relying on screenshots or subjective inspection alone.

Repo evidence: `evals/run_evals.js`, `evals/golden_dataset.json`, `.github/workflows/ci.yml`.

## Expert-Practice Mapping

This is how the implementation maps to public guidance from leading AI and security organizations:

| Public guidance | Applied in ProcureGuard |
|---|---|
| Google PAIR emphasizes user mental models, feedback, control, and clear expectations for AI systems. | The product explains what the AI does, what it does not do, and keeps the reviewer in control before any payment or supplier action. |
| Google SAIF frames AI systems around security, privacy, and secure-by-default implementation. | Production API keys stay server-side, the Vercel proxy validates request shape and model routing, and audit export excludes service keys and request payloads. |
| OpenAI Evals emphasizes creating evals for the specific LLM workflow being built. | The repo includes a domain-specific golden eval suite for 25 procurement cases across 17 exception types. |
| NIST AI RMF describes trustworthy AI characteristics including validity, reliability, safety, security, resilience, accountability, transparency, explainability, privacy, and fairness. | The app documents validity boundaries, reliability gates, security limits, explainability surfaces, audit records, and what remains unproven. |
| OWASP LLM guidance calls out prompt injection, insecure output handling, excessive agency, sensitive disclosure, and overreliance. | The design avoids autonomous agency, validates outputs before rendering, avoids production browser keys, limits external actions, and states that human review is required. |
| Amazon Bedrock Guardrails documents contextual grounding as a hallucination-control pattern when reference material is available. | ProcureGuard grounds analysis in structured PO, invoice, and goods-receipt records, then validates invoice alignment and source-record evidence before displaying results. |
| Apple's machine-learning interface guidance emphasizes privacy, understandable correction, and clear behavior when results are imperfect. | The UI keeps data session scoped, shows evidence panels, avoids hidden sending behavior, and describes the accuracy boundary. |

## Validation Strategy

The current validation strategy has three layers:

1. **Deterministic domain evals:** `node evals/run_evals.js` verifies expected exception codes, severity tiers, clean/exception status, and financial fields against a synthetic golden dataset.
2. **Build and CI gates:** `npm run build` and GitHub Actions verify that the deployed Vite app compiles after changes.
3. **Manual production checks:** deployment verification confirms that the app loads, assets return HTTP 200, no send/payment-release controls exist, and the review surfaces populate after analysis.

The evals are intentionally narrow and auditable. They are not presented as a universal accuracy claim.

## Risk Controls

| Risk | Control |
|---|---|
| Hallucinated exception or reasoning | Structured records, JSON schema, row alignment, deterministic duplicate and PO-reference guards, human review. |
| Overreliance on model output | Accuracy boundary in app/docs, evidence panels, no autonomous release or sending. |
| Excessive agency | Fixed prompt chain, no tool-calling agent, no email dispatch, no ERP write, no payment action. |
| Secret exposure | `GEMINI_API_KEY` remains server-side in production; local session key is not audited or exported. |
| Silent partial failure | Pipeline state tracks failed chunks, retryability, failed stage, and preserved partial outputs. |
| Unreviewable AI behavior | Prompts, schemas, evals, decision log, methodology, and audit export are in the repo. |
| Demo overclaiming | Docs state that synthetic evals do not prove all supplier, tax, tariff, ERP, or legal scenarios. |

## What Was Missing Before This Brief

The repo already had methodology, decisions, evals, deployment notes, and UI guardrail copy. The missing piece was a single reviewer-facing narrative that connected those artifacts into an expert engineering story.

The most important additions were:

- **Context and assumptions:** so reviewers know the operating boundary and do not infer unsupported production claims.
- **Principles:** so design choices read as intentional engineering decisions, not incidental implementation.
- **Public practice mapping:** so the work is grounded in recognized AI risk, UX, eval, and security guidance.
- **Risk table:** so the repo shows that hallucination, overreliance, excessive agency, and secret exposure were considered directly.
- **Production gap list:** so a hiring manager can see the next engineering steps and the reason for each.

## Ranked Next Improvements

1. **Add scenario-level eval reporting.** Keep the 25-case pass rate, but publish a small table by exception family, severity tier, and financial calculation. This would make evaluation quality easier to inspect quickly.
2. **Add a threat model document.** A one-page `docs/THREAT_MODEL.md` should cover assets, trust boundaries, abuse cases, mitigations, and residual risk. This is the next strongest credibility signal for a financial-control AI app.
3. **Add a production-readiness checklist.** Separate portfolio-demo readiness from enterprise readiness: auth, roles, persistent audit logs, ERP integration, PII handling, rate limits, monitoring, incident response, and rollback.
4. **Add prompt and schema traceability tables.** Link each prompt output field to the schema, UI surface, eval assertion, and audit field. This would show stronger end-to-end control.
5. **Expand evals beyond the golden dataset.** Add malformed CSV tests, missing-field tests, adversarial invoice notes, duplicate edge cases, and regression snapshots for prompt/schema changes.

## Source Basis

Primary evidence is the current repository. External references used for this expert-practice mapping:

- Google People + AI Guidebook, Mental Models: https://pair.withgoogle.com/guidebook-v2/chapter/mental-models/
- Google People + AI Guidebook, Feedback + Control: https://pair.withgoogle.com/guidebook-v2/chapters/feedback-controls/
- Google Secure AI Framework: https://safety.google/intl/en_us/safety/saif/
- OpenAI Evals: https://github.com/openai/evals
- NIST AI Risk Management Framework FAQ: https://www.nist.gov/itl/ai-risk-management-framework/ai-risk-management-framework-faqs
- OWASP Top 10 for Large Language Model Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- Amazon Bedrock contextual grounding checks: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-contextual-grounding-check.html
- Apple Human Interface Guidelines, Machine Learning: https://developer.apple.com/design/human-interface-guidelines/machine-learning/
