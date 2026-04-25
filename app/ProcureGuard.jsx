import { useMemo, useState } from "react";
import matchingPrompt from "../prompts/01_matching.md?raw";
import classificationPrompt from "../prompts/02_classification.md?raw";
import actionPrompt from "../prompts/03_action_generation.md?raw";
import { createAuditEntry, exportAuditCsv } from "./lib/audit.js";
import { callClaudeAPI } from "./lib/claude.js";
import { normalizeProcurementFiles } from "./lib/csv.js";
import {
  formatMoney,
  formatPercent,
  plainLanguageSummary,
  renderValue,
  statusLabel,
  tierClass,
  tierLabel
} from "./lib/format.js";
import { actionOutputSchema, classificationOutputSchema, matchingOutputSchema } from "./lib/schemas.js";

const LOCAL_API_KEY_STORAGE = "procureguard_anthropic_session_key";
const MODELS = {
  matching: "claude-haiku-4-5-20251001",
  classification: "claude-sonnet-4-6",
  action_generation: "claude-sonnet-4-6"
};

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Alert({ message, onRetry }) {
  if (!message) return null;
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        {onRetry ? (
          <button
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            type="button"
            onClick={onRetry}
          >
            Retry
          </button>
        ) : null}
      </div>
    </section>
  );
}

function UploadPanel({ parsedFiles, onFilesSelected, isBusy }) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    onFilesSelected(event.dataTransfer.files);
  }

  return (
    <section
      className={`rounded-lg border border-dashed p-6 ${isDragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-white"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upload procurement CSVs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add purchase_orders.csv, invoices.csv, and goods_receipts.csv before analysis.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Choose files
          <input
            className="sr-only"
            disabled={isBusy}
            multiple
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onFilesSelected(event.target.files)}
          />
        </label>
      </div>

      {parsedFiles?.summaries?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {parsedFiles.summaries.map((file) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={file.key}>
              <p className="text-sm font-semibold text-slate-900">{file.originalName}</p>
              <p className="mt-1 text-xs text-slate-500">{file.rowCount} rows parsed</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ApiKeyPanel({ apiKey, onApiKeyChange }) {
  if (!import.meta.env.DEV) {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Production uses the server-side Claude API key configured in deployment.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <label className="text-sm font-semibold text-slate-800" htmlFor="anthropic-key">
        Local Claude API key
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="anthropic-key"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="sk-ant-..."
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Stored only in this browser session for local development.
      </p>
    </section>
  );
}

function ProgressPanel({ runningStep, statusMessage, hasMatchResults, hasClassificationResults, hasActionResults }) {
  const steps = [
    ["matching", "Match", hasMatchResults],
    ["classification", "Classify", hasClassificationResults],
    ["action_generation", "Draft", hasActionResults]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {steps.map(([key, label, complete]) => (
            <Badge
              key={key}
              className={
                complete
                  ? "border-green-200 bg-green-50 text-green-800"
                  : runningStep === key
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }
            >
              {label}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-slate-600">{statusMessage || "Ready to analyze validated files."}</p>
      </div>
    </section>
  );
}

function SummaryMetrics({ metrics }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Total invoices" value={metrics.totalInvoices} />
      <Metric label="Clean matches" value={metrics.cleanMatches} />
      <Metric label="Exception rows" value={metrics.exceptionRows} />
      <Metric label="Total exposure" value={formatMoney(metrics.totalExposure)} />
      <Metric label="Tier 1" value={metrics.tier1} />
      <Metric label="Tier 2" value={metrics.tier2} />
      <Metric label="Tier 3" value={metrics.tier3} />
    </section>
  );
}

function FieldRow({ label, value }) {
  return (
    <div className="grid gap-1 rounded-md bg-white p-3 text-sm sm:grid-cols-[10rem_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}

function formatMoneyValue(value) {
  return typeof value === "number" && !Number.isNaN(value) ? formatMoney(value) : "Not available";
}

function ConfidencePanel({ confidence }) {
  const normalized = typeof confidence === "number" ? Math.max(0, Math.min(1, confidence)) : 0;
  const isLowConfidence = typeof confidence === "number" && confidence < 0.85;

  return (
    <section className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">Confidence</p>
        <p className="text-sm font-semibold text-slate-950">{formatPercent(confidence)}</p>
      </div>
      <progress
        className={`mt-3 h-2 w-full overflow-hidden rounded-full ${isLowConfidence ? "accent-amber-500" : "accent-blue-600"}`}
        max="1"
        value={normalized}
      />
      {isLowConfidence ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          Low confidence. Human review is recommended before taking action.
        </p>
      ) : null}
    </section>
  );
}

function SeverityBadge({ tier, isClean }) {
  const label = isClean ? tierLabel("clean") : tierLabel(tier);
  const badgeClass = isClean ? "border-green-200 bg-green-50 text-green-800" : tierClass(tier);
  return <Badge className={badgeClass}>{label}</Badge>;
}

function FinancialImpact({ classification, isClean }) {
  const financial = classification?.financial_summary;
  if (!financial) return null;

  if (classification.overall_tier >= 2) {
    return (
      <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Financial impact</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-red-100 bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Exposure</p>
            <p className="mt-1 text-lg font-semibold text-red-900">{formatMoney(financial.total_exposure)}</p>
          </div>
          <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Hold</p>
            <p className="mt-1 text-lg font-semibold text-amber-900">{formatMoney(financial.total_hold)}</p>
          </div>
          <div className="rounded-md border border-green-100 bg-green-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Approved</p>
            <p className="mt-1 text-lg font-semibold text-green-900">{formatMoney(financial.total_approved)}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
      <p className="font-semibold">
        {isClean ? "No hold required. Clean match approved amount:" : "No payment hold required. Approved amount:"}{" "}
        {formatMoney(financial.total_approved)}
      </p>
    </section>
  );
}

function MatchedFields({ match, invoiceRow }) {
  const quantity = match.quantity_match ?? {};
  const price = match.price_match ?? {};
  const uom = match.uom_match ?? {};
  const date = match.date_check ?? {};
  const supplier = match.supplier_match ?? {};

  return (
    <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Matched fields</summary>
      <dl className="mt-4 grid gap-2">
        <FieldRow label="PO number" value={renderValue(match.po_number, "No PO match")} />
        <FieldRow label="GRN numbers" value={renderValue(match.grn_numbers, "No GRN")} />
        <FieldRow label="Supplier name" value={renderValue(supplier.invoice_name ?? invoiceRow?.supplier_name)} />
        <FieldRow label="Item code" value={renderValue(invoiceRow?.item_code)} />
        <FieldRow
          label="Quantity comparison"
          value={`PO ${renderValue(quantity.po_qty)} | Invoice ${renderValue(quantity.invoiced_qty)} | GRN ${renderValue(quantity.grn_qty_total)}`}
        />
        <FieldRow
          label="Price comparison"
          value={`PO ${formatMoneyValue(price.po_price)} | Invoice ${formatMoneyValue(price.invoice_price)}`}
        />
        <FieldRow
          label="UOM comparison"
          value={`PO ${renderValue(uom.po_uom)} | Invoice ${renderValue(uom.invoice_uom)}`}
        />
        <FieldRow
          label="Date comparison"
          value={`Invoice ${renderValue(date.invoice_date)} | Earliest GRN ${renderValue(date.earliest_grn_date)}`}
        />
      </dl>
    </details>
  );
}

function ReasoningPanel({ match, classification }) {
  const exceptionDetails = classification?.exception_details ?? [];
  const quantity = match.quantity_match ?? {};
  const price = match.price_match ?? {};
  const uom = match.uom_match ?? {};
  const date = match.date_check ?? {};

  return (
    <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4" open>
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">Reasoning</summary>
      <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
        <section>
          <p className="font-semibold text-slate-900">Step 1 matching reasoning</p>
          <p className="mt-1">{match.reasoning || "Not available"}</p>
        </section>
        {exceptionDetails.length ? (
          <section>
            <p className="font-semibold text-slate-900">Step 2 classification rationale</p>
            <div className="mt-2 space-y-3">
              {exceptionDetails.map((detail) => (
                <div className="rounded-md bg-white p-3" key={`${detail.exception_code}-${detail.exception_name}`}>
                  <p className="font-semibold">{detail.exception_code}: {detail.exception_name}</p>
                  <p className="mt-1">{detail.rationale}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <section>
          <p className="font-semibold text-slate-900">Matched values compared</p>
          <dl className="mt-2 grid gap-2 md:grid-cols-2">
            <FieldRow label="PO quantity" value={renderValue(quantity.po_qty)} />
            <FieldRow label="Invoice quantity" value={renderValue(quantity.invoiced_qty)} />
            <FieldRow label="GRN quantity" value={renderValue(quantity.grn_qty_total)} />
            <FieldRow label="PO unit price" value={formatMoneyValue(price.po_price)} />
            <FieldRow label="Invoice unit price" value={formatMoneyValue(price.invoice_price)} />
            <FieldRow label="PO UOM" value={renderValue(uom.po_uom)} />
            <FieldRow label="Invoice UOM" value={renderValue(uom.invoice_uom)} />
            <FieldRow label="Invoice date" value={renderValue(date.invoice_date)} />
            <FieldRow label="Earliest GRN date" value={renderValue(date.earliest_grn_date)} />
          </dl>
        </section>
        <section>
          <p className="font-semibold text-slate-900">Rule or exception code triggered</p>
          <p className="mt-1">{(match.detected_exceptions ?? []).length ? match.detected_exceptions.join(", ") : "No exception rule triggered"}</p>
        </section>
        {classification?.tier_rationale ? (
          <section>
            <p className="font-semibold text-slate-900">Tier rationale</p>
            <p className="mt-1">{classification.tier_rationale}</p>
          </section>
        ) : null}
      </div>
    </details>
  );
}

function DraftAction({
  action,
  invoiceNumber,
  tier,
  approvedActions,
  tier3Notes,
  reviewedTier3,
  onApprove,
  onTier3NoteChange,
  onTier3Reviewed
}) {
  const actionKey = `${invoiceNumber}-${action.exception_code}-${action.action_type}`;
  const approved = approvedActions.has(actionKey);
  const reviewed = reviewedTier3.has(actionKey);
  const actionNote = tier3Notes[actionKey] ?? "";

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">View Draft</summary>
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge className="border-blue-200 bg-blue-50 text-blue-800">{action.draft_label}</Badge>
          <h4 className="mt-3 text-sm font-semibold text-slate-950">{action.subject}</h4>
          <p className="mt-1 text-xs text-slate-500">
            {action.recipient_type}
            {action.recipient_name ? `: ${action.recipient_name}` : ""}
          </p>
        </div>
        {tier === 2 ? (
          <button
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:bg-green-700"
            type="button"
            disabled={approved}
            onClick={() => onApprove(actionKey)}
          >
            {approved ? "Approved ✓" : "Approve & Queue"}
          </button>
        ) : null}
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-md bg-white p-4 text-sm leading-6 text-slate-700">
        {action.body}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <span>Deadline: {action.response_deadline_days ?? "None"}</span>
        <span>Exposure: {formatMoney(action.financial_reference?.exposure_amount)}</span>
        <span>Hold: {formatMoney(action.financial_reference?.hold_amount)}</span>
      </div>
      {tier === 3 ? (
        <div className="mt-4 rounded-md border border-red-200 bg-white p-4">
          <label className="text-sm font-semibold text-red-900" htmlFor={`${actionKey}-note`}>
            Action Taken note
          </label>
          <textarea
            id={`${actionKey}-note`}
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            value={actionNote}
            onChange={(event) => onTier3NoteChange(actionKey, event.target.value)}
            placeholder="Document supervisor escalation, payment block, or procurement action before marking reviewed."
          />
          <button
            className="mt-3 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="button"
            disabled={!actionNote.trim() || reviewed}
            onClick={() => onTier3Reviewed(actionKey)}
          >
            {reviewed ? "Reviewed ✓" : "Mark reviewed"}
          </button>
        </div>
      ) : null}
    </details>
  );
}

function InvoiceCard({
  match,
  classification,
  actionResult,
  invoiceRow,
  approvedActions,
  tier3Notes,
  reviewedTier3,
  onApprove,
  onTier3NoteChange,
  onTier3Reviewed
}) {
  const exceptions = match?.detected_exceptions ?? [];
  const tier = classification?.overall_tier;
  const isClean = exceptions.length === 0;
  const confidence = classification?.confidence ?? match.confidence;
  const showDrafts = actionResult?.actions?.length && (tier === 2 || tier === 3);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">{plainLanguageSummary(match)}</h3>
          <p className="mt-1 text-sm text-slate-600">
            PO: {match.po_number ?? "No PO match"} | GRNs: {match.grn_numbers?.length ? match.grn_numbers.join(", ") : "None"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge tier={tier} isClean={isClean} />
          <Badge className="border-slate-200 bg-slate-50 text-slate-700">{statusLabel(match.match_status)}</Badge>
        </div>
      </div>

      <ReasoningPanel match={match} classification={classification} />
      <MatchedFields match={match} invoiceRow={invoiceRow} />
      <FinancialImpact classification={classification} isClean={isClean} />

      {showDrafts ? (
        <div className="mt-4 space-y-4">
          {actionResult.actions.map((action) => (
            <DraftAction
              action={action}
              invoiceNumber={match.invoice_number}
              tier={tier}
              key={`${action.exception_code}-${action.action_type}-${action.subject}`}
              approvedActions={approvedActions}
              tier3Notes={tier3Notes}
              reviewedTier3={reviewedTier3}
              onApprove={onApprove}
              onTier3NoteChange={onTier3NoteChange}
              onTier3Reviewed={onTier3Reviewed}
            />
          ))}
        </div>
      ) : null}

      <ConfidencePanel confidence={confidence} />
    </article>
  );
}

function AuditPanel({ entries, onExport }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-600">{entries.length} entries captured</p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={entries.length === 0}
          onClick={onExport}
        >
          Export audit CSV
        </button>
      </div>
      {entries.length ? (
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <div className="rounded-md bg-slate-50 p-3 text-sm" key={`${entry.step}-${entry.timestamp}`}>
              <p className="font-semibold">{entry.step} | {entry.model}</p>
              <p className="mt-1 text-slate-600">
                {entry.timestamp} | {entry.latency_ms} ms | {entry.output_summary.invoice_count} invoices
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildActionBatch(parsedFiles, matchResults, classificationResults) {
  const classifications = classificationResults?.classifications ?? [];
  return (matchResults?.results ?? []).map((match, index) => {
    const invoice = parsedFiles.invoices[index] ?? {};
    const po = parsedFiles.purchase_orders.find((item) => item.po_number === match.po_number) ?? {};
    return {
      match_context: {
        invoice_number: invoice.invoice_number ?? match.invoice_number,
        po_number: match.po_number,
        grn_numbers: match.grn_numbers ?? [],
        supplier_name: invoice.supplier_name,
        supplier_id: invoice.supplier_id,
        item_description: invoice.item_description,
        item_code: invoice.item_code,
        invoice_date: invoice.invoice_date,
        quantity_invoiced: invoice.quantity_invoiced,
        invoice_unit_price: invoice.unit_price,
        invoice_uom: invoice.uom,
        payment_terms: po.payment_terms ?? null,
        notes_signals: match.notes_signals ?? []
      },
      classification: classifications[index] ?? classifications.find((item) => item.invoice_number === match.invoice_number)
    };
  });
}

function computeMetrics(parsedFiles, matchResults, classificationResults) {
  const matches = matchResults?.results ?? [];
  const classifications = classificationResults?.classifications ?? [];
  const totalInvoices = parsedFiles?.invoices?.length ?? matches.length;
  const cleanMatches = matches.filter((item) => (item.detected_exceptions ?? []).length === 0).length;
  const exceptionRows = matches.filter((item) => (item.detected_exceptions ?? []).length > 0).length;

  return {
    totalInvoices,
    cleanMatches,
    exceptionRows,
    tier1: classifications.filter((item) => item.overall_tier === 1).length,
    tier2: classifications.filter((item) => item.overall_tier === 2).length,
    tier3: classifications.filter((item) => item.overall_tier === 3).length,
    totalExposure: classifications.reduce((sum, item) => sum + (item.financial_summary?.total_exposure ?? 0), 0)
  };
}

function renderRank(item) {
  const exceptions = item.match?.detected_exceptions ?? [];
  if (item.classification?.overall_tier === 3) return 1;
  if (item.classification?.overall_tier === 2) return 2;
  if (item.classification?.overall_tier === 1) return 3;
  if (exceptions.length === 0) return 4;
  return 5;
}

export default function App() {
  const [parsedFiles, setParsedFiles] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    if (!import.meta.env.DEV) return "";
    return sessionStorage.getItem(LOCAL_API_KEY_STORAGE) ?? "";
  });
  const [runningStep, setRunningStep] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [failedStep, setFailedStep] = useState("");
  const [matchResults, setMatchResults] = useState(null);
  const [classificationResults, setClassificationResults] = useState(null);
  const [actionResults, setActionResults] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [approvedActions, setApprovedActions] = useState(new Set());
  const [tier3Notes, setTier3Notes] = useState({});
  const [reviewedTier3, setReviewedTier3] = useState(new Set());

  const metrics = useMemo(
    () => computeMetrics(parsedFiles, matchResults, classificationResults),
    [parsedFiles, matchResults, classificationResults]
  );
  const renderedCards = useMemo(() => {
    return (matchResults?.results ?? [])
      .map((match, index) => ({
        match,
        index,
        invoiceRow: parsedFiles?.invoices?.[index],
        classification: classificationResults?.classifications?.[index],
        actionResult: actionResults?.action_results?.[index]
      }))
      .sort((left, right) => renderRank(left) - renderRank(right) || left.index - right.index);
  }, [actionResults, classificationResults, matchResults, parsedFiles]);

  function handleApiKeyChange(value) {
    setApiKey(value);
    sessionStorage.setItem(LOCAL_API_KEY_STORAGE, value);
  }

  async function handleFilesSelected(files) {
    setUploadError("");
    setError("");
    try {
      const normalized = await normalizeProcurementFiles(files);
      setParsedFiles(normalized);
      setMatchResults(null);
      setClassificationResults(null);
      setActionResults(null);
      setAuditEntries([]);
      setApprovedActions(new Set());
      setTier3Notes({});
      setReviewedTier3(new Set());
      setStatusMessage("Files validated. Ready to analyze.");
    } catch (fileError) {
      setParsedFiles(null);
      setUploadError(fileError.message);
    }
  }

  async function runMatching() {
    if (!parsedFiles) throw new Error("Upload and validate all three CSV files first");
    setRunningStep("matching");
    setStatusMessage("Matching invoices against POs and GRNs...");
    const userMessage = JSON.stringify({
      purchase_orders: parsedFiles.purchase_orders,
      invoices: parsedFiles.invoices,
      goods_receipts: parsedFiles.goods_receipts
    });
    const response = await callClaudeAPI({
      systemPrompt: matchingPrompt,
      userMessage,
      model: MODELS.matching,
      schema: matchingOutputSchema,
      apiKey,
      onRetry: ({ attempt }) => setStatusMessage(`Rate limited during matching. Retry ${attempt + 1} of 3...`)
    });
    setMatchResults(response.data);
    const auditEntry = await createAuditEntry({
      step: "matching",
      model: MODELS.matching,
      input: userMessage,
      output: response.data,
      tokenUsage: response.token_usage,
      latencyMs: response.latency_ms,
      promptVersion: "01_matching_v1"
    });
    setAuditEntries((current) => [...current, auditEntry]);
    return response.data;
  }

  async function runClassification(existingMatchResults = matchResults) {
    if (!existingMatchResults?.results) throw new Error("Matching must complete before classification");
    setRunningStep("classification");
    setStatusMessage("Classifying exceptions by severity...");
    const userMessage = JSON.stringify({ results: existingMatchResults.results });
    const response = await callClaudeAPI({
      systemPrompt: classificationPrompt,
      userMessage,
      model: MODELS.classification,
      schema: classificationOutputSchema,
      apiKey,
      onRetry: ({ attempt }) => setStatusMessage(`Rate limited during classification. Retry ${attempt + 1} of 3...`)
    });
    setClassificationResults(response.data);
    const auditEntry = await createAuditEntry({
      step: "classification",
      model: MODELS.classification,
      input: userMessage,
      output: response.data,
      tokenUsage: response.token_usage,
      latencyMs: response.latency_ms,
      promptVersion: "02_classification_v1"
    });
    setAuditEntries((current) => [...current, auditEntry]);
    return response.data;
  }

  async function runActionGeneration(existingMatchResults = matchResults, existingClassificationResults = classificationResults) {
    if (!existingMatchResults?.results || !existingClassificationResults?.classifications) {
      throw new Error("Matching and classification must complete before action generation");
    }
    setRunningStep("action_generation");
    setStatusMessage("Drafting communications...");
    const userMessage = JSON.stringify({
      batch: buildActionBatch(parsedFiles, existingMatchResults, existingClassificationResults)
    });
    const response = await callClaudeAPI({
      systemPrompt: actionPrompt,
      userMessage,
      model: MODELS.action_generation,
      schema: actionOutputSchema,
      apiKey,
      onRetry: ({ attempt }) => setStatusMessage(`Rate limited during drafting. Retry ${attempt + 1} of 3...`)
    });
    setActionResults(response.data);
    const auditEntry = await createAuditEntry({
      step: "action_generation",
      model: MODELS.action_generation,
      input: userMessage,
      output: response.data,
      tokenUsage: response.token_usage,
      latencyMs: response.latency_ms,
      promptVersion: "03_action_generation_v1"
    });
    setAuditEntries((current) => [...current, auditEntry]);
    return response.data;
  }

  async function runPipeline(startAt = "matching") {
    setError("");
    setFailedStep("");
    let activeStep = startAt;
    try {
      let nextMatchResults = matchResults;
      let nextClassificationResults = classificationResults;

      if (startAt === "matching") {
        setMatchResults(null);
        setClassificationResults(null);
        setActionResults(null);
        activeStep = "matching";
        nextMatchResults = await runMatching();
        activeStep = "classification";
        nextClassificationResults = await runClassification(nextMatchResults);
        activeStep = "action_generation";
        await runActionGeneration(nextMatchResults, nextClassificationResults);
      } else if (startAt === "classification") {
        setClassificationResults(null);
        setActionResults(null);
        activeStep = "classification";
        nextClassificationResults = await runClassification(nextMatchResults);
        activeStep = "action_generation";
        await runActionGeneration(nextMatchResults, nextClassificationResults);
      } else {
        setActionResults(null);
        activeStep = "action_generation";
        await runActionGeneration(nextMatchResults, nextClassificationResults);
      }

      setStatusMessage("Prompt chain complete. Review drafted communications.");
    } catch (pipelineError) {
      setFailedStep(activeStep);
      setError(pipelineError.message);
    } finally {
      setRunningStep("");
    }
  }

  function retryFailedStep() {
    runPipeline(failedStep || "matching");
  }

  function exportAuditTrail() {
    const blob = new Blob([exportAuditCsv(auditEntries)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `procureguard-audit-${new Date().toISOString()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Stage 3.2</p>
            <h1 className="mt-2 text-4xl font-semibold">ProcureGuard AI</h1>
            <p className="mt-2 text-lg text-slate-600">Intelligent 3-Way Procurement Matching</p>
          </div>
          <button
            className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
            type="button"
            disabled={!parsedFiles || Boolean(runningStep)}
            onClick={() => runPipeline("matching")}
          >
            {runningStep ? "Analyzing..." : "Analyze"}
          </button>
        </header>

        <ApiKeyPanel apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
        <UploadPanel parsedFiles={parsedFiles} onFilesSelected={handleFilesSelected} isBusy={Boolean(runningStep)} />
        <Alert message={uploadError} />
        <Alert message={error} onRetry={failedStep ? retryFailedStep : null} />
        <ProgressPanel
          runningStep={runningStep}
          statusMessage={statusMessage}
          hasMatchResults={Boolean(matchResults)}
          hasClassificationResults={Boolean(classificationResults)}
          hasActionResults={Boolean(actionResults)}
        />

        {parsedFiles ? <SummaryMetrics metrics={metrics} /> : null}

        {renderedCards.length ? (
          <section className="grid gap-4">
            {renderedCards.map(({ match, index, invoiceRow, classification, actionResult }) => (
              <InvoiceCard
                key={`${match.invoice_number}-${index}`}
                match={match}
                classification={classification}
                actionResult={actionResult}
                invoiceRow={invoiceRow}
                approvedActions={approvedActions}
                tier3Notes={tier3Notes}
                reviewedTier3={reviewedTier3}
                onApprove={(actionKey) => {
                  setApprovedActions((current) => new Set([...current, actionKey]));
                }}
                onTier3NoteChange={(actionKey, value) => {
                  setTier3Notes((current) => ({ ...current, [actionKey]: value }));
                  if (!value.trim()) {
                    setReviewedTier3((current) => {
                      const next = new Set(current);
                      next.delete(actionKey);
                      return next;
                    });
                  }
                }}
                onTier3Reviewed={(actionKey) => {
                  setReviewedTier3((current) => new Set([...current, actionKey]));
                }}
              />
            ))}
          </section>
        ) : null}

        <AuditPanel entries={auditEntries} onExport={exportAuditTrail} />
      </section>
    </main>
  );
}
