# Architectural Decision Log - ProcureGuard AI

Decisions are logged as they are made. Later decisions may supersede earlier ones; the superseding entry should reference the original.

---

## DECISION-001: Prompt chaining workflow, not autonomous agent

**Date:** April 22, 2026
**Stage:** Planning
**Status:** Accepted

**Context:** The workflow has a fixed sequence: match, classify, then act. The LLM provides reasoning inside each step, not navigation between steps.

**Decision:** Build ProcureGuard AI as a prompt chaining workflow with gate checks between steps.

**Alternatives considered:**
- Autonomous agent: rejected because the steps are predefined, not dynamic.
- Single monolithic prompt: rejected because debugging is harder and errors compound.

**Rationale:** Prompt chaining is the simplest reliable pattern for a fixed procurement review process.

**Consequences:** Each LLM call has focused scope, intermediate outputs can be validated, and the system remains testable without becoming an agent framework.

---

## DECISION-002: Three LLM calls with gate checks

**Date:** April 25, 2026
**Stage:** Stage 2
**Status:** Accepted

**Context:** Matching, classification, and communications require different instructions, schemas, and failure handling.

**Decision:** Use three separate Gemini prompt-chain calls: matching, classification, and action generation.

**Alternatives considered:**
- One prompt for all work: rejected because a single failure could corrupt the full batch.
- More granular calls per invoice: rejected because it would add latency and cost for the demo scope.

**Rationale:** Three calls match the business workflow and create clear checkpoints between stages.

**Consequences:** The UI can retry failed stages safely and show partial progress after each successful step.

---

## DECISION-003: Model routing by task complexity

**Date:** April 25, 2026
**Stage:** Stage 2
**Status:** Accepted

**Context:** Matching and extraction are structured tasks, while classification and communications require more judgment and writing quality.

**Decision:** Route matching, classification, action generation, and auxiliary text extraction through Gemini 2.5 Flash, with bounded runtime thinking budgets for analysis-heavy stages and strict structured JSON schemas for every output.

**Alternatives considered:**
- Use the same model for every call: rejected because it ignores cost and task complexity.
- Use the largest model for every call: rejected because the portfolio demo does not need that cost profile.

**Rationale:** Gemini 2.5 Flash gives the side-project demo a lower operating cost while preserving the deterministic three-stage prompt chain, schema enforcement, audit trace, and human-review workflow. Runtime thinking budgets are kept small but nonzero for procurement reasoning so quality is not traded away for speed alone.

**Consequences:** The app stays provider-light at the product layer, keeps model/cost/latency visible through the audit/token panels, and relies on evals plus live-run checks to validate that analysis quality remains stable after provider migration.

---

## DECISION-004: Structured Outputs for JSON schema reliability

**Date:** April 25, 2026
**Stage:** Stage 2
**Status:** Accepted

**Context:** The UI needs predictable result shapes for matching, classification, action generation, and text extraction.

**Decision:** Use Gemini structured JSON output (`responseMimeType: "application/json"` with `responseJsonSchema`) for all prompt-chain outputs.

**Alternatives considered:**
- Free-form text parsing: rejected because it increases JSON parse failures and UI fragility.
- Ad hoc regex extraction from model text: rejected because it is brittle and hard to audit.

**Rationale:** Schemas make model outputs easier to validate, render, and evaluate against the golden dataset.

**Consequences:** Prompt design and frontend code must stay aligned with the schema objects in `app/lib/schemas.js`.

---

## DECISION-005: Client-side processing for demo scope

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** The portfolio build needs CSV upload, validation, and analysis without adding an ERP, database, or backend data layer.

**Decision:** Parse CSVs, hold procurement data, and calculate dashboard views in the browser for the session.

**Alternatives considered:**
- Database-backed persistence: rejected as outside the demo scope.
- Python backend processing: rejected because the app is a React/Vite/Vercel workflow.

**Rationale:** Client-side processing keeps the architecture small and transparent while supporting the full demo flow.

**Consequences:** Data is session scoped, no historical persistence exists, and integrations can be added later without changing the prompt-chain concept.

---

## DECISION-006: Progressive rendering via sequential pipeline state

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** Reviewers need visibility into what the AI has completed instead of waiting for a single final response.

**Decision:** Store `matchResults`, `classificationResults`, and `actionResults` separately and render after each stage completes.

**Alternatives considered:**
- Block rendering until all stages finish: rejected because it hides progress and makes failure recovery worse.
- Stream every token to the UI: rejected because the product needs structured review artifacts, not chat output.

**Rationale:** Sequential state mirrors the chain and makes retries simple.

**Consequences:** Dashboard and review cards can use the latest completed stage while preserving the original result arrays.

---

## DECISION-007: Vercel serverless proxy for production Gemini API calls

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** Production browser code must call Gemini without exposing the deployment API key.

**Decision:** Use `api/messages.js` as a Vercel serverless proxy that forwards validated requests to the Gemini `generateContent` API.

**Alternatives considered:**
- Call Gemini directly from production browser code: rejected because it would expose secrets.
- Add a separate backend service: rejected as unnecessary for the demo scope.

**Rationale:** The Vercel proxy fits the existing deployment target and keeps secret handling server-side.

**Consequences:** Production requires `GEMINI_API_KEY` in deployment config and rejects requests when it is missing.

---

## DECISION-008: API key dual-mode handling

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** Local development needs a convenient Gemini key path, while production must use server-side secrets.

**Decision:** In local dev, allow a user-entered key stored only in `sessionStorage`; in production, use `GEMINI_API_KEY` through the proxy.

**Alternatives considered:**
- Store the key in `localStorage`: rejected because it persists beyond the browser session.
- Require a local `.env` for every demo run: rejected because it makes quick review harder.

**Rationale:** The split supports local testing without changing production secret boundaries.

**Consequences:** The app must never log or audit API keys, and production must not accept client-provided keys.

---

## DECISION-009: Tolerance simulator as client-side recalculation

**Date:** April 25, 2026
**Stage:** Stage 4
**Status:** Accepted

**Context:** Reviewers need to test policy thresholds without changing the AI classification record.

**Decision:** Implement the tolerance simulator as a client-side derived view over existing matching and classification results.

**Alternatives considered:**
- Re-call the model on every slider change: rejected because it adds cost, latency, and non-determinism.
- Mutate classification results directly: rejected because it would weaken audit integrity.

**Rationale:** Simulation should be fast, explainable, and clearly separate from accepted classifications.

**Consequences:** Policy changes are visual only until approved outside the simulator.

---

## DECISION-010: DRAFT labels and no Send button as HITL rule

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** Supplier communications and escalation memos must support human review, not autonomous outreach.

**Decision:** Label generated communications as drafts and prohibit any Send button or real email sending behavior.

**Alternatives considered:**
- Add email dispatch: rejected because it would exceed demo scope and weaken human-in-the-loop control.
- Auto-release Tier 2 or Tier 3 actions: rejected because review and escalation require human judgment.

**Rationale:** DRAFT-only communication keeps the AI assistant in a review-support role.

**Consequences:** Tier 2 can use "Approve & Queue" locally, while Tier 3 requires an Action Taken note before review completion.

---

## DECISION-011: Audit trail as in-memory append-only log with CSV export

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** The app needs explainability and governance evidence without adding persistence infrastructure.

**Decision:** Keep an in-memory append-only audit trail with timestamp, step, model, input hash, output summary, usage metadata, latency, and CSV export.

**Alternatives considered:**
- Store full raw prompts and payloads: rejected to avoid exposing procurement data and prompt text.
- Persist audit logs in a database: rejected as outside the demo scope.

**Rationale:** Hashes and summaries provide reviewability while keeping sensitive data out of the log.

**Consequences:** Audit records reset with the session and are exportable before leaving the browser.

---

## DECISION-012: CSV filenames lowercase for cross-platform compatibility

**Date:** April 24, 2026
**Stage:** Stage 1
**Status:** Accepted

**Context:** The sample data and upload flow need predictable filenames across case-sensitive and case-insensitive filesystems.

**Decision:** Standardize the three source files as `purchase_orders.csv`, `invoices.csv`, and `goods_receipts.csv`.

**Alternatives considered:**
- Mixed-case filenames: rejected because they can break shell scripts and upload matching on some systems.
- Accept arbitrary filenames only: rejected because the demo benefits from explicit data contracts.

**Rationale:** Lowercase filenames reduce ambiguity in docs, evals, upload validation, and handoff steps.

**Consequences:** Upload matching can be case-insensitive, but the canonical project data remains lowercase.

---

## DECISION-013: Synthetic data over real procurement data

**Date:** April 24, 2026
**Stage:** Stage 1
**Status:** Accepted

**Context:** The portfolio app needs realistic procurement exceptions without exposing private supplier, invoice, or ERP data.

**Decision:** Use synthetic CSV data and a golden dataset that covers all 17 exception types.

**Alternatives considered:**
- Use real procurement data: rejected due to confidentiality and compliance risk.
- Use tiny toy examples only: rejected because they would not prove exception coverage.

**Rationale:** Synthetic data supports public review while still exercising realistic matching logic.

**Consequences:** The app demonstrates workflow capability but does not claim production calibration on a real customer corpus.

---

## DECISION-014: Enterprise dashboard and review queue as portfolio differentiator

**Date:** April 26, 2026
**Stage:** Stage 5
**Status:** Accepted

**Context:** After exception cards, the product needed an executive view for AP and procurement leaders.

**Decision:** Add an enterprise dashboard, supplier scorecard, ROI estimate, token-cost panel, workspace tabs, and review queue filters.

**Alternatives considered:**
- Leave only exception cards: rejected because leaders need batch-level health and risk signals.
- Add a generic decorative dashboard: rejected because charts must answer procurement decisions.

**Rationale:** The dashboard makes exposure, review workload, supplier risk, and AI governance visible without hiding the review cards.

**Consequences:** Stage 5 adds Recharts and denser UI, while preserving HITL controls and client-side calculations.

---

## DECISION-015: Main branch workflow for solo portfolio build

**Date:** April 25, 2026
**Stage:** Project workflow
**Status:** Accepted

**Context:** The project is a solo staged portfolio build with explicit handoff logs after each deliverable.

**Decision:** Work on a single `main` branch and commit after each completed stage.

**Alternatives considered:**
- Feature branches for every stage: rejected as unnecessary process overhead for this solo repo.
- Squash all work into one commit: rejected because staged history is useful for review.

**Rationale:** A linear main history makes the build progression easy to audit.

**Consequences:** Each stage must leave the tree clean and update `progress.md` and `docs/HANDOFF.md`.

---

## DECISION-016: React Error Boundary for app-level recovery

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** A browser demo should not white-screen if a React render error occurs.

**Decision:** Wrap the application in a React Error Boundary with a user-friendly reload option.

**Alternatives considered:**
- Let React crash to a blank page: rejected because reviewers need a recoverable UI.
- Add external error monitoring: rejected as outside demo scope.

**Rationale:** A small local boundary improves resilience without adding services or dependencies.

**Consequences:** Render failures show a recovery surface and log only to `console.error`, not to a remote system.

---

## DECISION-017: sessionStorage instead of localStorage

**Date:** April 26, 2026
**Stage:** Stage 5
**Status:** Accepted

**Context:** Local API keys and UI preferences should not persist indefinitely in the browser.

**Decision:** Use `sessionStorage` for the local Gemini API key and dark mode preference.

**Alternatives considered:**
- `localStorage`: rejected because it persists after the browser session.
- Cookies: rejected because no authentication or server session is needed.

**Rationale:** Session-scoped storage supports convenience while reducing persistence risk.

**Consequences:** Preferences reset across new sessions, and the app must avoid `localStorage`.

---

## DECISION-018: No database for demo scope

**Date:** April 25, 2026
**Stage:** Stage 3
**Status:** Accepted

**Context:** The build needs to demonstrate procurement matching, not multi-user persistence or ERP synchronization.

**Decision:** Keep all uploaded data, AI outputs, approvals, notes, and audit entries in browser state for the session.

**Alternatives considered:**
- Add Postgres or another database: rejected as outside the staged product scope.
- Persist files to Vercel storage: rejected because no retention workflow exists yet.

**Rationale:** In-memory state keeps the demo simple and avoids accidental retention of procurement data.

**Consequences:** Refreshing the app clears the session, and persistence can be revisited in a later stage.

---

## DECISION-019: Root cause analysis as client-side pattern detection

**Date:** April 25, 2026
**Stage:** Stage 4
**Status:** Accepted

**Context:** Root cause insights should summarize patterns without adding another model call or overclaiming causality.

**Decision:** Detect supplier, exception type, warehouse, pricing, and timing patterns in the browser from parsed data and AI outputs.

**Alternatives considered:**
- Use another model call for root cause analysis: rejected because the first version can derive patterns deterministically.
- Use stronger accusatory language: rejected because the UI should suggest review, not assign blame.

**Rationale:** Client-side patterns are transparent, fast, and consistent with the demo governance model.

**Consequences:** The panel uses cautious language and does not claim confirmed fraud or final root cause.

---

## DECISION-020: Workspace tabs after Stage 5 correction

**Date:** April 26, 2026
**Stage:** Stage 5
**Status:** Accepted

**Context:** The app had dashboard, review cards, setup controls, and audit panels competing in one long page.

**Decision:** Add three workspace tabs: Dashboard, Review Queue, and Settings & Audit.

**Alternatives considered:**
- Persistent sidebar: rejected as more navigation structure than needed for this demo.
- Command palette and keyboard shortcuts: rejected as later-stage productivity features.

**Rationale:** Tabs clarify the review workflow while keeping the interface lightweight.

**Consequences:** Dashboard analytics, HITL review controls, and setup/audit tasks remain visible but are grouped by reviewer intent.
