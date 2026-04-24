# Product Requirements Document — ProcureGuard AI

## Product Overview

ProcureGuard AI is an intelligent 3-way procurement matching tool that ingests Purchase Order, Invoice, and Goods Receipt data and automatically detects, classifies, and explains discrepancies. It surfaces every exception with AI-generated reasoning and severity tiers so AP teams can review, simulate tolerance changes, and approve supplier communications — all without leaving the browser. The product prioritizes transparency and human oversight: every AI decision is logged, every drafted email is labeled as a draft, and no action is taken without explicit user approval.

---

## User Workflow

1. **Upload CSVs** — User uploads `purchase_orders.csv`, `invoices.csv`, and `goods_receipts.csv` via drag-and-drop or file picker; the system validates headers and row counts before proceeding.
2. **System processes with progressive rendering** — The 3-step AI pipeline runs (extraction → classification → drafting); the UI renders each exception card as it arrives rather than waiting for the full batch.
3. **Review exception cards with decision rationale** — Each exception shows matched fields, discrepancy delta, severity tier, confidence, rule triggers, variance calculations, recommended action, and an expandable explainability panel.
4. **Adjust tolerance sliders** — User moves sliders (e.g., price variance %, quantity shortfall %) and the exception list re-evaluates live, showing which items would be auto-approved under the new thresholds.
5. **Review drafted emails marked DRAFT** — For Tier 2 and Tier 3 exceptions, the system generates a supplier communication; user reads the draft, edits if needed, and clicks "Approve & Queue" — there is no "Send" button.
6. **Export audit trail** — User downloads a structured log of every AI decision, severity classification, user action, and timestamp for compliance or ERP upload.

---

## Feature List and Acceptance Criteria

### 1. CSV Upload and Validation
Users can upload three CSVs (PO, Invoice, GRN) via file picker or drag-and-drop.

**Acceptance criteria:**
- Accepts all three files in a single session; rejects missing or malformed files with a descriptive error.
- Validates required column headers against the data dictionary before any AI call.
- Displays row counts and a file summary panel after upload succeeds.

### 2. 3-Way Matching with Fuzzy Name Matching and UOM Conversion
The system joins POs, Invoices, and GRNs on `po_number`/`po_reference` and `item_code`, then checks all 17 exception types.

**Acceptance criteria:**
- Detects all 17 exception types (E01–E17) on the golden dataset.
- Fuzzy supplier-name matching (E08) flags name variants while same `supplier_id` prevents false escalation.
- UOM mismatch detection (E05) correctly applies conversion factors when invoice notes supply them, and confirms totals reconcile.
- Dual exceptions (E03+E12, E04+E15) are both surfaced on the same invoice row.

### 3. Severity Classification
Each exception is assigned Tier 1 (auto-approve), Tier 2 (review), or Tier 3 (escalate) per the exception catalog.

**Acceptance criteria:**
- Tier 1 exceptions are marked auto-approved with a green badge; no email draft is generated.
- Tier 2 exceptions are held with an amber badge; a supplier email draft is generated.
- Tier 3 exceptions are halted with a red badge; an escalation memo is generated and AP supervisor is flagged.
- Classification matches the golden dataset for all 25 rows.

### 4. Glass-Box Reasoning Cards
Every exception card includes an expandable AI reasoning panel showing the explainable decision rationale that led to the classification.

**Acceptance criteria:**
- Reasoning panel is collapsed by default and expands on click.
- Panel shows: field values compared, delta calculation, exception code triggered, tier rationale.
- No exception card appears without a reasoning entry.

### 5. What-If Tolerance Simulator
Users can adjust tolerance thresholds (price variance %, quantity shortfall %, freight surcharge cap) via sliders.

**Acceptance criteria:**
- Sliders update the exception list in real time without re-calling the AI.
- Each slider shows its current value and the number of exceptions that would change tier under the new setting.
- Resetting sliders to defaults restores the original AI classification.

### 6. Root Cause Analysis
For clusters of related exceptions, the system identifies patterns (e.g., same supplier causing multiple Tier 3 exceptions).

**Acceptance criteria:**
- Pattern detection runs across all exception rows, not per-row.
- Patterns are surfaced in a dedicated "Root Cause" panel above the exception list.
- Each detected pattern links to the affected invoice rows.

### 7. Auto-Drafted Supplier Emails
For Tier 2 and Tier 3 exceptions, the system drafts a supplier-facing email citing the specific discrepancy and requesting corrective action.

**Acceptance criteria:**
- Every Tier 2 and Tier 3 exception has exactly one draft email.
- All drafts are labeled "DRAFT — awaiting review" in the subject line and body header.
- There is no "Send" button; the only action is "Approve & Queue".
- Draft content references the correct invoice number, PO number, delta amount, and requested resolution.

### 8. Executive Dashboard
A summary view shows aggregate metrics across the uploaded batch.

**Acceptance criteria:**
- Displays: match rate %, total dollar exposure across open exceptions, exception count by tier, and estimated ROI (AP staff-hours saved × hourly rate).
- All metrics recalculate when tolerance sliders are changed.
- Charts render correctly with Recharts; no broken chart states on valid data.

### 9. Supplier Scorecard with Diversity Certs
Each supplier appearing in the batch has a scorecard showing exception history and diversity certification status.

**Acceptance criteria:**
- Scorecard pulls `supplier_diversity_cert` from PO data and displays the certification label.
- Exception count and tier breakdown are shown per supplier.
- Scorecard is accessible from any exception card for that supplier.

### 10. Unstructured Text Parser
The AI parses `invoice.notes` free text to extract structured signals (surcharge amounts, UOM conversion factors, tariff codes, discount refusals).

**Acceptance criteria:**
- Freight surcharge in notes (E04) is detected and dollar amount extracted.
- UOM conversion factor in notes (E05) is extracted and applied to reconcile quantities.
- Tariff HS code in notes (E17) is extracted and routes the exception to procurement rather than supplier dispute.
- Discount refusal in notes (E16) is detected and withheld amount calculated.

### 11. Audit Trail
Every AI decision, user action, and classification is logged with a timestamp.

**Acceptance criteria:**
- Log captures: invoice row, exception code, tier, AI reasoning summary, user action (approve / queue / escalate), and ISO timestamp.
- Audit trail is exportable as a structured file (CSV or JSON).
- Log is append-only within a session; no entry can be deleted from the UI.

---

## Success Criteria

1. All 17 distinct exception types (E01–E17) are identified on the golden dataset.
2. Fuzzy supplier-name matching (E08) correctly resolves name variants using `supplier_id` without false escalation.
3. UOM conversion (E05) applies the correct factor from invoice notes and confirms totals reconcile.
4. Chain-of-thought reasoning is visible and non-empty for every exception card.
5. Tolerance sliders update the exception list live without re-calling the AI.
6. Root cause patterns are detected across supplier-level and exception-type clusters.
7. Supplier emails are drafted for all Tier 2 and Tier 3 exceptions and labeled "DRAFT — awaiting review".
8. Dashboard metrics (match rate, dollar exposure, exception breakdown) are arithmetically correct for the golden dataset.
9. ROI calculator displays a non-zero estimate and updates when slider thresholds change.
10. Audit trail captures all AI decisions and user actions and exports without error.
11. `run_evals.js` returns 100% on the golden dataset.
12. No JSON parse errors occur during any pipeline run on valid input.
13. No "Send" buttons exist; HITL labels ("Approve & Queue") are enforced on all email actions.
14. All documentation files (PRD, README, Architecture, Data Dictionary) are complete and internally consistent.
15. Application loads and runs correctly at the Vercel deployment URL.

---

## Out of Scope

- **Database** — all data is held in-memory per session; no persistence layer.
- **Real-time ERP integration** — data is ingested via CSV upload only; no API connections to SAP, Oracle, or similar systems.
- **Multi-user authentication** — single-user, single-session; no login, roles, or permissions.
- **Actual email sending** — the system drafts and queues emails only; delivery requires a separate system integration outside this product.
