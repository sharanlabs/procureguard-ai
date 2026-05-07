# AI Engineering Methodology

This document explains how ProcureGuard AI is built, why each design choice exists, how the system prevents hallucination, and how outputs are validated. It is written for anyone reviewing the engineering quality of this project — whether you work in AI, procurement, or neither.

---

## 1. Pipeline Design

ProcureGuard uses a three-stage prompt chain, not a single monolithic prompt and not an autonomous agent.

**Stage 1 — Matching.** Compares purchase orders, invoices, and goods receipts line by line. Detects which of 17 exception types apply to each invoice. Outputs structured evidence with confidence scores.

**Stage 2 — Classification.** Receives matching output. Assigns severity tiers (1–3), calculates financial exposure, and recommends actions. Does not re-read raw CSV data — works only from Stage 1 output.

**Stage 3 — Action Generation.** Produces DRAFT communications: supplier emails, escalation memos, approval notes, PO amendment requests. Every output is labeled DRAFT. No send capability exists.

**Why three stages, not one?**

- A single prompt conflates detection with judgment with communication. Errors in one task contaminate the others.
- Three stages create checkpoints. If matching fails, classification never runs on bad data.
- Each stage has a focused schema, focused instructions, and focused evaluation criteria.
- Retry and partial recovery operate at the stage and chunk level, not all-or-nothing.

**Why not an autonomous agent?**

The steps are fixed and sequential. There is no dynamic tool selection, no branching logic, no self-directed exploration. An agent framework would add abstraction without adding capability. The system is a pipeline, so it is built as one.

**References:** `app/lib/pipeline.js` (orchestration), `prompts/01_matching.md`, `prompts/02_classification.md`, `prompts/03_action_generation.md`.

---

## 2. Prompt Engineering

### Design principles

Each prompt follows the same structure:

1. **Role and scope.** What the model is doing and what it must not do.
2. **Input format.** Exact CSV column names and data types it will receive.
3. **Rules.** Numbered, unambiguous instructions with priority ordering.
4. **Output schema.** JSON structure with field descriptions, enum constraints, and required fields.
5. **Few-shot examples.** Worked examples showing correct reasoning for representative cases.

### Few-shot strategy

The matching prompt includes 5 worked examples covering: clean three-way match, price variance, quantity short-ship, missing goods receipt, and duplicate invoice. Each example shows the full reasoning chain from input data to exception code to confidence score.

Few-shot examples were chosen to cover the most common real-world exception patterns and to demonstrate the expected reasoning depth. They are not exhaustive — the 17 exception types are defined by rules, not by example alone.

### Guardrail rules in prompts

The matching prompt contains 11 explicit guardrail rules (lines 545–566 of `prompts/01_matching.md`):

1. Never invent data not present in the source CSVs.
2. No silent skips — every invoice must appear in the output.
3. Use low confidence when evidence is ambiguous.
4. Multiple exceptions are additive — report all that apply.
5. E11 (invalid PO reference) short-circuits dependent checks — without a valid PO, price, quantity, and UOM comparisons have no baseline.
6. E17 (tariff-related price variance) overrides E01 (unexplained price variance) when invoice notes contain a tariff or HS code reference.
7. E06 (missing goods receipt) suppresses E03 (quantity exceeds GRN) because the absence of a GRN makes the GRN-based comparison meaningless.
8. Report the specific field values that triggered each exception.
9. Confidence must reflect data quality, not model certainty.
10. Never assign exception codes outside the E01–E17 enum.
11. Output exactly one result object per input invoice, in the same order.

These rules encode domain knowledge that the model cannot reliably derive from general training. They prevent known failure modes observed during development.

### Exception hierarchy

Not all exception combinations are valid. The prompts encode a priority system:

- **Short-circuit:** E11 (invalid PO reference) stops PO-dependent analysis. Without a valid PO baseline, price, quantity, and UOM checks cannot run — all PO-dependent fields are set to null.
- **Override:** E17 (tariff-related price variance) takes precedence over E01 (unexplained price variance) when invoice notes contain a tariff schedule or HS code reference.
- **Suppression:** E06 (missing goods receipt) suppresses E03 (quantity exceeds GRN) because the absence of a GRN makes the received-quantity comparison meaningless — reporting both would double-count the same gap.

### Thinking budgets

Each stage has a runtime thinking budget that controls how much internal reasoning the model performs before generating output:

| Stage | Budget (tokens) | Rationale |
|---|---|---|
| Matching | 512 | Structured comparison against rules; reasoning is rule-following, not open-ended |
| Classification | 1024 | Requires judgment about severity and business impact |
| Action generation | 1024 | Requires writing quality and contextual awareness |

Budgets are intentionally small. They exist to allow the model to reason through ambiguous cases without generating unbounded chain-of-thought that increases latency and cost.

All stages run with `temperature: 0` to maximize output consistency across runs. Combined with structured output and thinking budgets, this reduces — but does not eliminate — non-determinism in the pipeline.

**References:** `prompts/01_matching.md` (full prompt with guardrails), `app/lib/gemini.js` (thinking budget configuration).

---

## 3. Anti-Hallucination Architecture

The system uses five layers of defense against hallucinated, malformed, or inconsistent AI output. No single layer is sufficient alone.

### Layer 1 — Schema enforcement

Every AI call uses Gemini structured output with `responseMimeType: "application/json"` and a `responseJsonSchema`. This guarantees:

- Output is valid JSON (no parse failures).
- Required fields are always present.
- Exception codes are constrained to the enum `E01`–`E17` (the model cannot invent exception codes).
- Confidence scores are bounded between 0 and 1.
- Action types are constrained to a fixed enum.
- `additionalProperties: false` is set recursively, preventing the model from adding unexpected fields.

Gemini's structured output supports a subset of JSON Schema. The codebase defines schemas using standard keywords (`minimum`, `maximum`, `integer`, `pattern`), then runs `normalizeStructuredOutputSchema()` before each API call to strip unsupported keywords and convert them to description hints the model can still follow. This means schemas are written for clarity and maintained in standard JSON Schema, while the normalization layer handles provider-specific constraints.

Schema enforcement eliminates an entire class of failures — malformed output — at the API level rather than through post-hoc parsing.

**Reference:** `app/lib/schemas.js` (all three schemas with enum constraints, recursive `additionalProperties: false`, and provider-aware normalization).

### Layer 2 — Prompt-level guardrails

The 11 guardrail rules described above operate inside the prompt. They constrain the model's reasoning before output generation. Key constraints:

- "Never invent data" prevents fabricated invoice numbers or amounts.
- "No silent skips" prevents the model from ignoring invoices it finds difficult.
- Exception hierarchy rules prevent logically contradictory exception combinations.
- "Output exactly one result per input invoice, in the same order" makes alignment verification trivial.

### Layer 3 — Post-AI deterministic validation

After each AI response, deterministic code validates the output against known invariants:

- **`validateAndAlignResults()`** checks that the number of results matches the number of input invoices, that invoice identifiers appear in the correct order, and rejects any response with missing or extra results.
- **`applyGlobalMatchingGuards()`** runs deterministic checks for E11 (invalid PO reference — verifies the invoice's PO number exists in the uploaded purchase order file) and E07 (duplicate invoice number — flags later occurrences of the same invoice number). These checks do not require AI judgment. If the AI missed a case that pure logic can detect, the guard adds it.

These guards catch cases where the model's output passes schema validation but is factually wrong given the input data.

**Reference:** `app/lib/pipeline.js` (validation and guard functions).

### Layer 4 — Evaluation harness

The golden dataset (`evals/golden_dataset.json`) contains 25 procurement test cases with pre-computed expected outputs. The eval harness (`evals/run_evals.js`) implements the same exception detection logic in pure JavaScript — no AI involved — and verifies that expected exceptions, tiers, and financial amounts are correct.

This creates a ground truth independent of the model. If the model's output disagrees with the deterministic eval on a test case, the model is wrong.

### Layer 5 — Human-in-the-loop boundary

Even after all automated validation, no AI output triggers real-world action. All communications are labeled DRAFT. No send button exists. No payment is released. The system's output is a recommendation for human review, not an autonomous decision.

This final layer acknowledges that no automated system — regardless of how many validation layers it has — can guarantee zero errors in a domain with real financial consequences.

---

## 4. Evaluation Methodology

### Why deterministic evals

AI output is non-deterministic. Running the same prompt twice may produce different confidence scores or slightly different reasoning. This makes "run the AI and check the output" an unreliable evaluation method.

Instead, the eval harness implements exception detection as pure deterministic logic. The function `detectExceptions()` in `evals/run_evals.js` encodes all 17 exception rules as JavaScript conditionals operating on the same CSV data the AI receives. The expected output is computed once, stored in the golden dataset, and never changes unless the business rules change.

This approach has a specific advantage: it tests the specification, not the model. If the eval passes, the specification is internally consistent. If the AI's live output matches, the AI is correctly implementing the specification.

### Golden dataset design

The 25 test cases are structured to achieve specific coverage goals:

| Category | Count | Purpose |
|---|---|---|
| Clean three-way matches | 10 | Verify the system does not flag valid invoices |
| Single-exception cases | 11 | One test per exception type for E01–E11 |
| Multi-exception cases | 2 | Test additive exception detection (E03+E12, E04+E15) |
| Edge cases | 2 | Duplicate invoice number (E07 on later occurrence), invalid PO reference (E11 short-circuit) |

### Coverage matrix

All 17 exception types are exercised:

- **Tier 1 (auto-approve threshold):** E08, E09, E13, E14
- **Tier 2 (requires review):** E01, E03, E04, E05, E10, E12, E15, E16, E17
- **Tier 3 (escalation required):** E02, E06, E07, E11

The dataset includes both positive cases (exception correctly detected) and negative cases (clean invoices correctly passed). This prevents a system that flags everything from achieving a perfect score.

### What evals verify

For each test case, the eval checks:

- `match_status` — correctly identified as `clean_match` or `exception_tier_N`
- `detected_exceptions` — correct set of exception codes (order-independent)
- `overall_tier` — correct severity tier (max across all exceptions)
- `is_clean` — boolean consistency with exception list
- `financial_amounts` — exposure, hold, and approved amounts within ±$0.01 rounding tolerance

### Running evals

```bash
node evals/run_evals.js
```

Expected output: `25/25 passed, 100%`. Results are written to `evals/results/` with timestamps for audit purposes.

**References:** `evals/run_evals.js` (harness), `evals/golden_dataset.json` (test cases).

---

## 5. Failure Handling

### Retry with exponential backoff

Each AI call retries up to 4 attempts. General failures use exponential backoff (2s, 4s, 8s, 16s). Rate limit failures use longer provider-aware delays (65–120 seconds, incorporating the provider's recommended retry delay when available). The retry logic distinguishes between:

- **Retryable failures:** Network timeouts, 429 rate limits, 5xx server errors (500, 502, 503, 504).
- **Non-retryable failures:** 400 bad request, 401/403 authentication failure, daily quota exhaustion, safety blocks, MAX_TOKENS truncation.

For 429 responses, the system parses the response body JSON for the provider's `retryDelay` value and quota metadata, and uses the provider-recommended delay instead of the default backoff.

### Stage-aware timeouts

Different stages have different computational complexity:

| Stage | Timeout | Rationale |
|---|---|---|
| Matching | 60s | Structured comparison; should complete quickly |
| Classification | 120s | Requires reasoning about severity and impact |
| Action generation | 120s | Requires generating well-written communications |

If a stage exceeds its timeout, the request is aborted and retried.

### Chunked processing with partial recovery

Large invoice batches are split into chunks (default: 10 invoices per chunk). If one chunk fails after all retry attempts, the system preserves results from chunks that succeeded. The user sees partial results with clear indication of which invoices failed.

This prevents a single problematic invoice from blocking the entire batch.

### Rate limit awareness

The Gemini client enforces a minimum spacing of 12 seconds between requests (`MIN_REQUEST_SPACING_MS = 12000`). This serialization prevents burst traffic that would trigger rate limits on the free tier or low-quota plans.

When a daily quota limit is detected (distinct from per-minute rate limits), the system surfaces this to the user as a non-retryable error rather than waiting indefinitely.

### Secret leak detection

Before any pipeline state is rendered to the UI or written to audit logs, `assertNoApiKeyLeak()` scans the pipeline object against known secret patterns. This guards against a scenario where model output accidentally echoes back an API key that appeared in error messages or debug context.

**Reference:** `app/lib/gemini.js` (retry, timeout, rate limit), `app/lib/pipeline.js` (chunking, partial recovery, leak detection).

---

## 6. Observability

### Audit trail

Every AI call generates an audit entry with:

| Field | Purpose |
|---|---|
| `timestamp` | When the call was made |
| `step` | Which pipeline stage |
| `model` | Which model was used |
| `input_hash` | SHA-256 hash of the input (not the input itself) |
| `status` | Success or failure |
| `chunk` | Which chunk of the batch |
| `output_summary` | Abbreviated result (not full output) |
| `token_usage` | Prompt tokens, completion tokens, thinking tokens (tracked separately) |
| `latency_ms` | Wall-clock time for the call |
| `prompt_version` | Version identifier for the prompt used |

Input hashing (SHA-256 via `crypto.subtle`) provides reproducibility evidence without storing sensitive procurement data in the audit log.

### Token and cost tracking

The UI displays per-stage and cumulative token usage. Cost estimates use published Gemini pricing. This makes the AI's resource consumption transparent to reviewers and budget holders.

### CSV export

The full audit trail is exportable as a 20-column CSV. This supports external analysis, compliance review, and integration with governance tools.

**Reference:** `app/lib/audit.js` (hashing, entry creation, CSV export).

---

## 7. Human-in-the-Loop Boundary

### What AI decides

- Which exceptions apply to each invoice (with evidence and confidence).
- What severity tier each exception belongs to.
- What draft communication would be appropriate.

### What AI does not decide

- Whether to release a payment.
- Whether to send a communication to a supplier.
- Whether to escalate to management.
- Whether to approve or reject an invoice.

### Enforcement

- All generated communications carry the label `DRAFT — AWAITING REVIEW` or `ESCALATION MEMO — DRAFT` (enforced by schema enum).
- No "Send" button exists anywhere in the interface.
- Tier 2 actions show "Approve & Queue" (local staging only).
- Tier 3 actions require a human-written "Action Taken" note before the review can be marked complete.
- The tolerance simulator recalculates thresholds client-side without calling the AI, so policy exploration does not produce new AI outputs that bypass review.

### Why this boundary exists

Procurement exceptions have real financial consequences. A false negative means a problematic invoice gets paid. A false positive means a valid supplier gets an unnecessary query. Both have costs — financial, relational, and operational.

AI is useful for detection and drafting at scale. Humans are necessary for judgment, accountability, and relationship management. This system draws the boundary where detection ends and action begins.

---

## 8. Responsible AI Considerations

### Data handling

- No procurement data is persisted beyond the browser session.
- API keys entered locally are stored in `sessionStorage` (cleared on tab close), never `localStorage`.
- Production API keys are server-side only, gated through the Vercel proxy. The proxy enforces a model allowlist (only `gemini-2.5-flash`) and validates request structure before forwarding to the Gemini API.
- Audit logs hash inputs rather than storing them, preventing accidental data retention.

### Transparency

- Every AI decision includes the evidence that triggered it (specific field values, amounts, dates).
- Confidence scores are required for every exception — the system cannot silently be certain.
- The audit trail records which model, which prompt version, and how many tokens were used for every call.
- Token costs are visible to the user, not hidden.

### Bias and fairness

- The system evaluates invoices against purchase orders and goods receipts — objective document comparison, not subjective judgment about suppliers.
- Exception detection rules are explicit and auditable (both in prompts and in the eval harness).
- The tolerance simulator lets reviewers see how threshold changes affect different suppliers, making policy impact visible before decisions are made.

### Failure transparency

- When the AI fails (timeout, rate limit, safety block), the system reports what happened rather than silently degrading.
- Partial results are clearly labeled as partial.
- The system does not guess or interpolate when data is missing — it reports the gap.

---

## 9. Known Limitations

### What this system does not do

| Limitation | Reason |
|---|---|
| No historical learning | Session-scoped; each run is independent. No model fine-tuning or feedback loop. |
| No ERP integration | Demo scope. Real deployment would read from SAP, Oracle, or similar. |
| No multi-user workflow | Single-user browser session. No role-based access or approval routing. |
| No production persistence | Data resets on page refresh. Audit CSV must be exported manually. |
| No real email sending | HITL boundary. Communications are drafts only. |
| No supplier response tracking | The system generates outbound drafts but does not process inbound replies. |
| No anomaly detection over time | Each batch is analyzed independently. No trend detection across batches. |

### Model limitations

- Gemini 2.5 Flash is optimized for speed and cost, not maximum reasoning depth. Complex multi-exception cases with ambiguous evidence may receive lower confidence scores.
- Structured output constrains the model to the schema but does not guarantee the content is correct — schema enforcement prevents malformed output, not wrong output.
- Thinking budgets are capped. Extremely complex invoices with many line items may benefit from higher budgets at the cost of latency.

### Eval limitations

- The golden dataset covers all 17 exception types but uses synthetic data. Production data may surface edge cases not represented.
- Deterministic evals verify the specification, not the model. A passing eval means the rules are consistent, not that the AI will always follow them perfectly on novel data.
- The eval does not test prompt robustness against adversarial inputs or unusual CSV formatting.

---

## 10. Cost and Performance

### Typical run profile

For a batch of 25 invoices (the golden dataset size):

| Metric | Typical value |
|---|---|
| Total AI calls | 3 (one per stage) |
| Total tokens | ~15,000–25,000 (varies with invoice complexity) |
| Wall-clock time | 30–60 seconds (serialized with 12s spacing) |
| Estimated cost | < $0.01 USD at Gemini 2.5 Flash pricing |

### Cost controls

- Model routing uses Flash for all stages (no premium model calls).
- Thinking budgets cap internal reasoning tokens.
- Chunk size limits per-call token consumption.
- Request serialization prevents burst billing spikes.
- The tolerance simulator and root cause analysis run client-side with zero AI cost.

### Scaling considerations

- Larger batches scale linearly with chunk count (each chunk is one AI call per stage).
- Concurrency is currently set to 1 (sequential processing) to respect rate limits on low-quota API keys.
- The architecture supports concurrent chunk processing by changing a single configuration value, for deployments with higher API quotas.

---

## Summary

ProcureGuard AI is a prompt chaining workflow with five layers of hallucination defense, deterministic evaluation independent of the model, explicit human-in-the-loop boundaries, and full observability of every AI decision.

The system is designed to be auditable, explainable, and safe by construction — not by hoping the model gets it right.
