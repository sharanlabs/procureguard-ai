import { useMemo, useState } from "react";
import matchingPrompt from "../prompts/01_matching.md?raw";
import classificationPrompt from "../prompts/02_classification.md?raw";
import actionPrompt from "../prompts/03_action_generation.md?raw";
import ExecutiveDashboard, {
  RootCauseAnalysisPanel,
  SessionGovernancePanel,
  SupplierAnalyticsPanel
} from "./ProcureGuardDashboard.jsx";
import { createAuditEntry, exportAuditCsv } from "./lib/audit.js";
import { callClaudeAPI } from "./lib/claude.js";
import { normalizeProcurementFiles } from "./lib/csv.js";
import { buildDashboardAnalytics } from "./lib/dashboard.js";
import {
  formatDuration,
  formatModelName,
  formatMoney,
  formatPercent,
  formatStageName,
  renderValue,
  statusLabel,
  tierLabel
} from "./lib/format.js";
import {
  DEFAULT_ANALYSIS_CHUNK_SIZE,
  applyGlobalMatchingGuards,
  assertNoApiKeyLeak,
  buildChunkContext,
  chunkInvoices,
  getInvoiceRangeLabel,
  mergeActionChunks,
  mergeClassificationChunks,
  mergeMatchingChunks,
  normalizeActionChunkResults,
  validateAndAlignResults,
  validateMergedResults
} from "./lib/pipeline.js";
import { analyzeRootCauses } from "./lib/rootCause.js";
import { actionOutputSchema, classificationOutputSchema, matchingOutputSchema } from "./lib/schemas.js";
import { buildExceptionWorkbenchViewModel } from "./lib/uiModels.js";

const LOCAL_API_KEY_STORAGE = "procureguard_anthropic_session_key";
const DARK_MODE_STORAGE = "procureguard_dark_mode";
const MODELS = {
  matching: "claude-haiku-4-5-20251001",
  classification: "claude-sonnet-4-6",
  action_generation: "claude-sonnet-4-6"
};
const ANALYSIS_CHUNK_SIZE = DEFAULT_ANALYSIS_CHUNK_SIZE;
const CHUNK_DELAY_MS = 250;
const STAGE_MAX_TOKENS = {
  matching: 8192,
  classification: 8192,
  action_generation: 8192
};
const DEFAULT_TOLERANCES = {
  pricePct: 2,
  quantityUnits: 1,
  dateBusinessDays: 2
};
const WORKSPACE_TABS = [
  { id: "start", label: "Start" },
  { id: "executive", label: "Executive Summary" },
  { id: "workbench", label: "Exception Workbench" },
  { id: "analytics", label: "Supplier & Policy Analytics" },
  { id: "governance", label: "Audit & Governance" }
];
const DEFAULT_QUEUE_FILTERS = {
  search: "",
  tier: "all",
  supplier: "all",
  exception: "all",
  sort: "severity"
};
const LOCKED_TIER_THREE_CODES = new Set(["E02", "E06", "E07", "E11"]);

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Alert({ message, onRetry }) {
  if (!message) return null;
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 shadow-sm dark:border-red-800 dark:bg-red-950/50 dark:text-red-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        {onRetry ? (
          <button
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-red-500 dark:border-red-700 dark:bg-slate-900 dark:text-red-200 dark:hover:bg-red-950"
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
      className={`rounded-2xl border border-dashed p-6 shadow-sm transition-colors ${isDragging ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Upload procurement CSVs</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add purchase_orders.csv, invoices.csv, and goods_receipts.csv before analysis.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800" key={file.key}>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{file.originalName}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{file.rowCount} rows parsed</p>
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
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
        Production uses the server-side Claude API key configured in deployment.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="anthropic-key">
        Local Claude API key
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="anthropic-key"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="sk-ant-..."
        />
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Stored only in this browser session for local development.
      </p>
    </section>
  );
}

function ProgressPanel({ runningStep, statusMessage, hasMatchResults, hasClassificationResults, hasActionResults }) {
  const steps = [
    ["matching", formatStageName("matching"), hasMatchResults],
    ["classification", formatStageName("classification"), hasClassificationResults],
    ["action_generation", formatStageName("action_generation"), hasActionResults]
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }
            >
              {label}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{statusMessage || "Ready to analyze validated files."}</p>
      </div>
    </section>
  );
}

function ToleranceSlider({ id, label, value, min, max, step, unit, affectedCount, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor={id}>
          {label}
        </label>
        <Badge className="border-blue-200 bg-blue-50 text-blue-800">{affectedCount} affected</Badge>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <input
          id={id}
          className="w-full accent-blue-600"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <p className="min-w-20 text-right text-sm font-semibold text-slate-950 dark:text-slate-100">
          {value}{unit}
        </p>
      </div>
    </div>
  );
}

function ToleranceSimulator({ tolerances, onTolerancesChange, simulation }) {
  if (!simulation.hasClassifications) return null;

  const changedCount = simulation.changedInvoiceCount;
  const summaryText = changedCount
    ? `Adjusting tolerances would reclassify ${changedCount} invoice(s), changing ${tierLabel(2).toLowerCase()} count from ${simulation.originalCounts.tier2} to ${simulation.simulatedCounts.tier2}.`
    : "No invoices would change review path under the current tolerance settings.";

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">What-If Tolerance Simulator</h2>
          <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">
            Adjust policy tolerances locally without changing Claude classifications or audit records.
          </p>
        </div>
        <Badge className="border-blue-300 bg-white text-blue-800">Simulation only</Badge>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <ToleranceSlider
          id="price-tolerance"
          label="Price tolerance"
          value={tolerances.pricePct}
          min="0"
          max="10"
          step="0.5"
          unit="%"
          affectedCount={simulation.affectedByRule.price}
          onChange={(pricePct) => onTolerancesChange((current) => ({ ...current, pricePct }))}
        />
        <ToleranceSlider
          id="quantity-tolerance"
          label="Quantity tolerance"
          value={tolerances.quantityUnits}
          min="0"
          max="10"
          step="1"
          unit=" units"
          affectedCount={simulation.affectedByRule.quantity}
          onChange={(quantityUnits) => onTolerancesChange((current) => ({ ...current, quantityUnits }))}
        />
        <ToleranceSlider
          id="date-tolerance"
          label="Date tolerance"
          value={tolerances.dateBusinessDays}
          min="0"
          max="10"
          step="1"
          unit=" business days"
          affectedCount={simulation.affectedByRule.date}
          onChange={(dateBusinessDays) => onTolerancesChange((current) => ({ ...current, dateBusinessDays }))}
        />
      </div>

      <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{summaryText}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <p>Original {tierLabel(1)}: <span className="font-semibold">{simulation.originalCounts.tier1}</span></p>
          <p>Original {tierLabel(2)}: <span className="font-semibold">{simulation.originalCounts.tier2}</span></p>
          <p>Original {tierLabel(3)}: <span className="font-semibold">{simulation.originalCounts.tier3}</span></p>
          <p>Simulated {tierLabel(1)}: <span className="font-semibold">{simulation.simulatedCounts.tier1}</span></p>
          <p>Simulated {tierLabel(2)}: <span className="font-semibold">{simulation.simulatedCounts.tier2}</span></p>
          <p>Simulated {tierLabel(3)}: <span className="font-semibold">{simulation.simulatedCounts.tier3}</span></p>
        </div>
        <p className="mt-4 text-sm font-semibold text-blue-950 dark:text-blue-100">
          Potential low-risk review shift: {formatMoney(simulation.potentialAutoReviewShift)} in held exposure could be
          routed to expedited human review under this simulated policy.
        </p>
        <p className="mt-2 text-xs text-blue-800 dark:text-blue-300">
          Simulation only. Actual classifications remain unchanged until policy is reviewed.
        </p>
      </div>
    </section>
  );
}

function FieldRow({ label, value }) {
  return (
    <div className="grid gap-1 rounded-lg bg-white p-3 text-sm sm:grid-cols-[10rem_1fr] dark:bg-slate-900">
      <dt className="font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0 text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function formatMoneyValue(value) {
  return typeof value === "number" && !Number.isNaN(value) ? formatMoney(value) : "Not available";
}

function formatPercentValue(value) {
  return typeof value === "number" && !Number.isNaN(value) ? formatPercent(value) : "Not available";
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function toneBadgeClass(tone) {
  return {
    clean: "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/50 dark:text-green-200",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200",
    review: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
    escalate: "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200",
    neutral: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }[tone] ?? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function toneBorderClass(tone) {
  return {
    clean: "border-green-200 dark:border-green-800",
    info: "border-blue-200 dark:border-blue-800",
    review: "border-amber-200 dark:border-amber-800",
    escalate: "border-red-200 dark:border-red-800",
    neutral: "border-slate-200 dark:border-slate-700"
  }[tone] ?? "border-slate-200 dark:border-slate-700";
}

function routeLabelForAction(action) {
  if (action?.action_type === "escalation_memo") return "AP escalation memo";
  if (action?.action_type === "po_amendment_request") return "Procurement review draft";
  if (action?.action_type === "supplier_email") return "Supplier follow-up draft";
  return "No draft needed";
}

function SummaryMetric({ metric }) {
  const value = metric.format === "money" ? formatMoney(metric.value) : formatInteger(metric.value);
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${toneBorderClass(metric.tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{metric.label}</p>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-950 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.helper}</p>
    </article>
  );
}

function WorkbenchSummaryStrip({ summary }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {summary.cards.map((metric) => (
        <SummaryMetric key={metric.id} metric={metric} />
      ))}
    </section>
  );
}

function WorkbenchEmptyState({ eyebrow, title, body, actionLabel, onAction, tone = "neutral" }) {
  return (
    <section className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 ${toneBorderClass(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
      {actionLabel && onAction ? (
        <button
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function WorkbenchHeader({ hasData, isAnalysisRunning }) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Exception Workbench</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Which invoices need human review now?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Analyst queue for triaging invoice exceptions, validating evidence, and reviewing DRAFT-only follow-up material.
          </p>
        </div>
        <Badge className={toneBadgeClass(isAnalysisRunning ? "info" : hasData ? "review" : "neutral")}>
          {isAnalysisRunning ? "Analysis in progress" : hasData ? "Human-in-the-loop" : "Awaiting analysis"}
        </Badge>
      </div>
    </header>
  );
}

function CardFact({ label, value, helper, tone = "neutral", isNumber = false }) {
  return (
    <div className={`rounded-xl border bg-slate-50 p-3 dark:bg-slate-950/50 ${toneBorderClass(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`${isNumber ? "font-mono tabular-nums" : ""} mt-1 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100`}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

function EvidenceConfidence({ row }) {
  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Evidence strength</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{row.evidenceStrength.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.evidenceStrength.helper}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Model confidence</p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-100">
            {formatPercentValue(row.modelConfidence)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Supporting metadata only. Validate source records before action.
          </p>
        </div>
      </div>
    </section>
  );
}

function EvidenceRationalePanel({ row }) {
  const summary = row.evidenceSummary;
  const comparisons = summary.comparisons;

  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">
        Evidence & rationale
      </summary>
      <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">1. What is wrong?</p>
          {row.exceptionLabels.length ? (
            <div className="mt-3 space-y-3">
              {row.exceptionLabels.map((detail) => (
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800" key={`${row.id}-${detail.code}`}>
                  <p className="font-semibold text-slate-950 dark:text-slate-100">{detail.code}: {detail.label}</p>
                  <p className="mt-1">{detail.rationale}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2">No exception rule triggered.</p>
          )}
          {!row.classification ? <p className="mt-3 font-semibold text-amber-700 dark:text-amber-300">Classification not available.</p> : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">2. Which source records prove it?</p>
          <dl className="mt-3 grid gap-2 md:grid-cols-2">
            {row.sourceRecords.map((record) => (
              <FieldRow key={`${row.id}-${record.label}`} label={record.label} value={renderValue(record.value)} />
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">3. What is the dollar impact?</p>
          <dl className="mt-3 grid gap-2 md:grid-cols-2">
            <FieldRow label="Exposure amount" value={formatMoney(row.exposureAmount)} />
            <FieldRow label="Hold amount" value={formatMoney(row.holdAmount)} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">4. What rule was applied?</p>
          <p className="mt-2">{summary.ruleApplied}</p>
          <p className="mt-3 text-slate-600 dark:text-slate-400">{summary.tierRationale}</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">5. What should a human do next?</p>
          <p className="mt-2">{summary.humanNextStep}</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Matched values compared</p>
          <dl className="mt-3 grid gap-2 md:grid-cols-2">
            <FieldRow
              label="Quantity comparison"
              value={`PO ${renderValue(comparisons.quantity.po)} | Invoice ${renderValue(comparisons.quantity.invoice)} | GRN ${renderValue(comparisons.quantity.grn)}`}
            />
            <FieldRow
              label="Price comparison"
              value={`PO ${formatMoneyValue(comparisons.price.po)} | Invoice ${formatMoneyValue(comparisons.price.invoice)}`}
            />
            <FieldRow
              label="UOM comparison"
              value={`PO ${renderValue(comparisons.uom.po)} | Invoice ${renderValue(comparisons.uom.invoice)}`}
            />
            <FieldRow
              label="Date comparison"
              value={`Invoice ${renderValue(comparisons.date.invoice)} | Earliest GRN ${renderValue(comparisons.date.earliestGrn)}`}
            />
          </dl>
          <p className="mt-3 text-slate-600 dark:text-slate-400">{summary.matchRationale}</p>
        </section>
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
    <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200">
        View draft text
      </summary>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className={toneBadgeClass(action.action_type === "escalation_memo" ? "escalate" : "info")}>
              {routeLabelForAction(action)}
            </Badge>
            <Badge className={toneBadgeClass("neutral")}>{action.draft_label || "DRAFT - AWAITING REVIEW"}</Badge>
          </div>
          <h4 className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">{action.subject || "Draft subject not available"}</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {renderValue(action.recipient_type)}
            {action.recipient_name ? `: ${action.recipient_name}` : ""}
          </p>
        </div>
        {tier === 2 ? (
          <button
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-blue-600 disabled:bg-slate-500 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
            type="button"
            disabled={approved}
            onClick={() => onApprove(actionKey)}
          >
            {approved ? "Queued for review" : "Queue for review"}
          </button>
        ) : null}
      </div>
      <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        {action.body || "Draft body not available."}
      </pre>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-400">
        <span>Deadline: {action.response_deadline_days ?? "None"}</span>
        <span>Exposure: {formatMoney(action.financial_reference?.exposure_amount)}</span>
        <span>Hold: {formatMoney(action.financial_reference?.hold_amount)}</span>
      </div>
      {tier === 3 ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <label className="text-sm font-semibold text-red-900 dark:text-red-100" htmlFor={`${actionKey}-note`}>
            Reviewer note
          </label>
          <textarea
            id={`${actionKey}-note`}
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-950 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-red-950"
            value={actionNote}
            onChange={(event) => onTier3NoteChange(actionKey, event.target.value)}
            placeholder="Document supervisor escalation, hold recommendation, or procurement action before marking reviewed."
          />
          <button
            className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-700"
            type="button"
            disabled={!actionNote.trim() || reviewed}
            onClick={() => onTier3Reviewed(actionKey)}
          >
            {reviewed ? "Reviewed" : "Mark reviewed"}
          </button>
        </div>
      ) : null}
    </details>
  );
}

function DraftPanel({
  row,
  approvedActions,
  tier3Notes,
  reviewedTier3,
  onApprove,
  onTier3NoteChange,
  onTier3Reviewed
}) {
  const draftActions = (row.actionResult?.actions ?? []).filter((action) => action.action_type !== "approval_note");

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Draft/action panel</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.draftStatus.detail}</p>
        </div>
        <Badge className={toneBadgeClass(row.draftStatus.tone)}>{row.draftStatus.label}</Badge>
      </div>
      {!row.actionResult ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Draft status not available.
        </p>
      ) : draftActions.length ? (
        <div className="mt-4 space-y-3">
          {draftActions.map((action) => (
            <DraftAction
              action={action}
              invoiceNumber={row.invoiceNumber}
              tier={row.classification?.overall_tier}
              key={`${row.id}-${action.exception_code}-${action.action_type}-${action.subject}`}
              approvedActions={approvedActions}
              tier3Notes={tier3Notes}
              reviewedTier3={reviewedTier3}
              onApprove={onApprove}
              onTier3NoteChange={onTier3NoteChange}
              onTier3Reviewed={onTier3Reviewed}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No draft generated for this invoice.
        </p>
      )}
    </section>
  );
}

function InvoiceCard({
  row,
  approvedActions,
  tier3Notes,
  reviewedTier3,
  onApprove,
  onTier3NoteChange,
  onTier3Reviewed
}) {
  const simulationChanged = row.simulation?.changed;
  const cardClass = simulationChanged
    ? "rounded-2xl border border-blue-300 bg-blue-50 p-5 shadow-sm dark:border-blue-700 dark:bg-blue-950/40"
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <article className={cardClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invoice exception case</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{row.invoiceNumber}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{row.supplierName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={toneBadgeClass(row.reviewPriority.tone)}>{row.reviewPriority.label}</Badge>
            <Badge className={toneBadgeClass(row.tier === "clean" ? "clean" : row.tier === 3 ? "escalate" : row.tier === 2 ? "review" : "info")}>
              {row.tierLabel}
            </Badge>
            <Badge className={toneBadgeClass("neutral")}>{statusLabel(row.match?.match_status)}</Badge>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[22rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">PO</p>
            <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{renderValue(row.match?.po_number, "No PO match")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">GRN</p>
            <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{renderValue(row.match?.grn_numbers, "No GRN")}</p>
          </div>
        </div>
      </div>

      {simulationChanged ? (
        <section className="mt-4 rounded-xl border border-blue-300 bg-white p-4 text-sm text-blue-950 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-100">
          <Badge className="border-blue-300 bg-blue-50 text-blue-800">Policy simulation changed this review path</Badge>
          <p className="mt-3 font-semibold">
            {tierLabel(row.simulation.originalTier)} &rarr; {tierLabel(row.simulation.simulatedTier)}
          </p>
          <p className="mt-1 text-blue-800 dark:text-blue-300">
            This is a what-if view only. The original Claude rationale, draft actions, and review controls remain unchanged.
          </p>
        </section>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <CardFact label="Exposure" value={formatMoney(row.exposureAmount)} tone="info" isNumber />
        <CardFact label="Hold" value={formatMoney(row.holdAmount)} tone={row.holdAmount > 0 ? "review" : "neutral"} isNumber />
        <CardFact label="Recommended route" value={row.recommendedRoute.label} tone={row.recommendedRoute.tone} />
        <CardFact label="Draft status" value={row.draftStatus.label} tone={row.draftStatus.tone} />
        <CardFact label="Evidence" value={row.evidenceStrength.label} helper={formatPercentValue(row.modelConfidence)} tone={row.evidenceStrength.tone} isNumber />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exception labels</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {row.exceptionLabels.length ? (
            row.exceptionLabels.map((item) => (
              <Badge
                key={`${row.id}-${item.code}-badge`}
                className={toneBadgeClass(item.tier === 3 ? "escalate" : item.tier === 2 ? "review" : "info")}
              >
                {item.code}: {item.label}
              </Badge>
            ))
          ) : (
            <Badge className={toneBadgeClass("clean")}>No detected exceptions</Badge>
          )}
        </div>
      </div>

      <EvidenceRationalePanel row={row} />
      <DraftPanel
        row={row}
        approvedActions={approvedActions}
        tier3Notes={tier3Notes}
        reviewedTier3={reviewedTier3}
        onApprove={onApprove}
        onTier3NoteChange={onTier3NoteChange}
        onTier3Reviewed={onTier3Reviewed}
      />
      <EvidenceConfidence row={row} />
    </article>
  );
}

function AuditPanel({ entries, onExport }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Audit & Governance</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{entries.length} entries captured</p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
            <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800" key={`${entry.step}-${entry.timestamp}`}>
              <p className="font-semibold text-slate-950 dark:text-slate-100">
                {formatStageName(entry.step)} | {formatModelName(entry.model)} | {statusLabel(entry.status ?? "success")}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {entry.timestamp} | {formatDuration(entry.latency_ms)} | {entry.output_summary?.invoice_count ?? 0} invoices
                {entry.chunk ? ` | chunk ${entry.chunk.index}/${entry.chunk.total} | invoices ${entry.chunk.invoice_range}` : ""}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function WorkspaceTabs({ activeWorkspace, onChange, dashboardReady, reviewCount, auditEntryCount }) {
  return (
    <nav
      aria-label="Workspace navigation"
      className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = activeWorkspace === tab.id;
          const helper = {
            start: "Upload and analyze",
            executive: dashboardReady ? "Batch summary" : "Appears after analysis",
            workbench: `${reviewCount} invoice cards`,
            analytics: "Supplier and policy views",
            governance: `${auditEntryCount} audit entries`
          }[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              className={`rounded-xl px-3 py-3 text-left transition focus-visible:outline-blue-600 ${
                isActive
                  ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950"
                  : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
              aria-pressed={isActive}
              onClick={() => onChange(tab.id)}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className={`mt-1 block text-xs ${isActive ? "opacity-80" : "text-slate-500 dark:text-slate-400"}`}>
                {helper}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ReviewQueueControls({
  filters,
  onFiltersChange,
  onReset,
  supplierOptions,
  exceptionOptions,
  visibleCount,
  totalCount
}) {
  function updateFilter(key, value) {
    onFiltersChange((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Filter and sort queue</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{visibleCount}</span> of{" "}
            <span className="font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{totalCount}</span> invoices visible. Filters are local and do not change classifications.
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          type="button"
          onClick={onReset}
        >
          Reset filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(16rem,1.35fr)_repeat(4,minmax(9rem,1fr))]">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="queue-search">
            Search
          </label>
          <input
            id="queue-search"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
            type="search"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Invoice, PO, supplier, exception"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="tier-filter">
            Review path
          </label>
          <select
            id="tier-filter"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            value={filters.tier}
            onChange={(event) => updateFilter("tier", event.target.value)}
          >
            <option value="all">All</option>
            <option value="tier3">{tierLabel(3)}</option>
            <option value="tier2">{tierLabel(2)}</option>
            <option value="tier1">{tierLabel(1)}</option>
            <option value="clean">{tierLabel("clean")}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="supplier-filter">
            Supplier
          </label>
          <select
            id="supplier-filter"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            value={filters.supplier}
            onChange={(event) => updateFilter("supplier", event.target.value)}
          >
            <option value="all">All suppliers</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="exception-filter">
            Exception
          </label>
          <select
            id="exception-filter"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            value={filters.exception}
            onChange={(event) => updateFilter("exception", event.target.value)}
          >
            <option value="all">All exceptions</option>
            {exceptionOptions.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="queue-sort">
            Sort
          </label>
          <select
            id="queue-sort"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
            value={filters.sort}
            onChange={(event) => updateFilter("sort", event.target.value)}
          >
            <option value="severity">Priority first</option>
            <option value="exposure">Exposure high to low</option>
            <option value="hold">Hold high to low</option>
            <option value="supplier">Supplier name</option>
            <option value="invoice">Invoice number</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function ExceptionWorkbenchPanel({
  viewModel,
  filters,
  onFiltersChange,
  onResetFilters,
  isAnalysisRunning,
  hasAnalysisFailure,
  onStart,
  approvedActions,
  tier3Notes,
  reviewedTier3,
  onApprove,
  onTier3NoteChange,
  onTier3Reviewed
}) {
  if (isAnalysisRunning) {
    return (
      <section className="grid gap-4">
        <WorkbenchHeader hasData={false} isAnalysisRunning />
        <WorkbenchEmptyState
          eyebrow="Analysis in progress"
          title="Workbench will populate after the prompt chain completes"
          body="The queue is intentionally withheld while matching, classification, or draft generation is running so analysts do not act on partial results."
          tone="info"
        />
      </section>
    );
  }

  if (hasAnalysisFailure) {
    return (
      <section className="grid gap-4">
        <WorkbenchHeader hasData={false} isAnalysisRunning={false} />
        <WorkbenchEmptyState
          eyebrow="Analysis failed"
          title="Exception Workbench is waiting for a successful run"
          body="The previous run did not complete, so no stale completed queue is shown here. Return to Start, resolve the failure, and rerun analysis."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="escalate"
        />
      </section>
    );
  }

  if (!viewModel.hasData) {
    return (
      <section className="grid gap-4">
        <WorkbenchHeader hasData={false} isAnalysisRunning={false} />
        <WorkbenchEmptyState
          eyebrow="Awaiting analysis"
          title="Run analysis from Start to build the exception queue"
          body="Upload purchase orders, invoices, and goods receipts, then run Analyze. Completed results will populate invoice priorities, evidence, exposure, holds, and DRAFT-only follow-up material."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="neutral"
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <WorkbenchHeader hasData={viewModel.hasData} isAnalysisRunning={false} />
      <WorkbenchSummaryStrip summary={viewModel.summary} />
      <ReviewQueueControls
        filters={filters}
        onFiltersChange={onFiltersChange}
        onReset={onResetFilters}
        supplierOptions={viewModel.supplierOptions}
        exceptionOptions={viewModel.exceptionOptions}
        visibleCount={viewModel.visibleRows.length}
        totalCount={viewModel.rows.length}
      />
      {viewModel.visibleRows.length ? (
        <div className="grid gap-4">
          {viewModel.visibleRows.map((row) => (
            <InvoiceCard
              key={row.id}
              row={row}
              approvedActions={approvedActions}
              tier3Notes={tier3Notes}
              reviewedTier3={reviewedTier3}
              onApprove={onApprove}
              onTier3NoteChange={onTier3NoteChange}
              onTier3Reviewed={onTier3Reviewed}
            />
          ))}
        </div>
      ) : (
        <WorkbenchEmptyState
          eyebrow="No filter results"
          title="No invoices match the selected filters."
          body="Adjust search, supplier, review path, exception, or sort controls to bring invoices back into view."
          actionLabel="Reset filters"
          onAction={onResetFilters}
          tone="neutral"
        />
      )}
    </section>
  );
}

function SupplierPolicyAnalyticsPanel({
  dashboardReady,
  analytics,
  tolerances,
  onTolerancesChange,
  toleranceSimulation,
  rootCauseAnalysis
}) {
  return (
    <section className="grid gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Supplier & Policy Analytics</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {dashboardReady
            ? "Supplier concentration, policy simulation, and root-cause views for analyst follow-through."
            : "Run analysis to populate supplier, policy, and root-cause views."}
        </p>
      </section>
      <SupplierAnalyticsPanel analytics={analytics} />
      <ToleranceSimulator
        tolerances={tolerances}
        onTolerancesChange={onTolerancesChange}
        simulation={toleranceSimulation}
      />
      <RootCauseAnalysisPanel analysis={rootCauseAnalysis} />
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

function waitForChunkWindow() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, CHUNK_DELAY_MS);
  });
}

function parseUtcDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function businessDaysBetween(startValue, endValue) {
  const start = parseUtcDate(startValue);
  const end = parseUtcDate(endValue);
  if (!start || !end || start >= end) return null;

  let days = 0;
  const cursor = new Date(start);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function getPriceVariancePct(match) {
  const directVariance = match?.price_match?.variance_pct;
  if (typeof directVariance === "number" && !Number.isNaN(directVariance)) {
    return Math.abs(directVariance);
  }

  const poPrice = match?.price_match?.po_price;
  const invoicePrice = match?.price_match?.invoice_price;
  if (typeof poPrice !== "number" || typeof invoicePrice !== "number" || poPrice === 0) return null;
  return Math.abs(((invoicePrice - poPrice) / poPrice) * 100);
}

function getOriginalExceptionTier(code, classification) {
  const detail = (classification?.exception_details ?? []).find((item) => item.exception_code === code);
  return detail?.individual_tier ?? classification?.overall_tier ?? null;
}

function shouldDowngradeException(code, match, tolerances) {
  if (LOCKED_TIER_THREE_CODES.has(code) || code === "E17") return false;

  if (code === "E01") {
    const variancePct = getPriceVariancePct(match);
    return typeof variancePct === "number" && variancePct <= tolerances.pricePct;
  }

  if (code === "E03") {
    const delta = match?.quantity_match?.delta;
    return typeof delta === "number" && Math.abs(delta) <= tolerances.quantityUnits;
  }

  if (code === "E12") {
    const daysEarly = businessDaysBetween(
      match?.date_check?.invoice_date,
      match?.date_check?.earliest_grn_date
    );
    return typeof daysEarly === "number" && daysEarly <= tolerances.dateBusinessDays;
  }

  return false;
}

function simulateCardTier(match, classification, tolerances) {
  const originalTier = classification?.overall_tier ?? null;
  const exceptionCodes = classification?.detected_exceptions ?? match?.detected_exceptions ?? [];

  if (!classification || !exceptionCodes.length) {
    return {
      originalTier,
      simulatedTier: originalTier,
      changed: false,
      changedCodes: [],
      ruleChanges: []
    };
  }

  const ruleChanges = exceptionCodes.map((code) => {
    const originalExceptionTier = getOriginalExceptionTier(code, classification);
    const simulatedExceptionTier =
      originalExceptionTier === 2 && shouldDowngradeException(code, match, tolerances)
        ? 1
        : originalExceptionTier;

    return {
      code,
      originalTier: originalExceptionTier,
      simulatedTier: simulatedExceptionTier,
      changed: originalExceptionTier !== simulatedExceptionTier
    };
  });
  const simulatedTier = Math.max(...ruleChanges.map((item) => item.simulatedTier ?? originalTier ?? 1));

  return {
    originalTier,
    simulatedTier,
    changed: Boolean(originalTier && simulatedTier && originalTier !== simulatedTier),
    changedCodes: ruleChanges.filter((item) => item.changed).map((item) => item.code),
    ruleChanges
  };
}

function emptyTierCounts() {
  return { tier1: 0, tier2: 0, tier3: 0 };
}

function countTier(counts, tier) {
  if (tier === 1) counts.tier1 += 1;
  if (tier === 2) counts.tier2 += 1;
  if (tier === 3) counts.tier3 += 1;
}

function buildToleranceSimulation(matchResults, classificationResults, tolerances) {
  const matches = matchResults?.results ?? [];
  const classifications = classificationResults?.classifications ?? [];
  const originalCounts = emptyTierCounts();
  const simulatedCounts = emptyTierCounts();
  const affectedByRule = { price: 0, quantity: 0, date: 0 };

  const cards = matches.map((match, index) => {
    const classification = classifications[index];
    const simulation = simulateCardTier(match, classification, tolerances);
    countTier(originalCounts, simulation.originalTier);
    countTier(simulatedCounts, simulation.simulatedTier);

    if (simulation.ruleChanges.some((item) => item.code === "E01" && item.changed)) affectedByRule.price += 1;
    if (simulation.ruleChanges.some((item) => item.code === "E03" && item.changed)) affectedByRule.quantity += 1;
    if (simulation.ruleChanges.some((item) => item.code === "E12" && item.changed)) affectedByRule.date += 1;

    return simulation;
  });

  const changedInvoiceCount = cards.filter((item) => item.changed).length;
  const potentialAutoReviewShift = cards.reduce((sum, simulation, index) => {
    const match = matches[index];
    const classification = classifications[index];
    const hasTariffException = (classification?.detected_exceptions ?? match?.detected_exceptions ?? []).includes("E17");

    if (simulation.originalTier !== 2 || simulation.simulatedTier !== 1 || hasTariffException) return sum;

    const financial = classification?.financial_summary ?? {};
    const exposureAmount = typeof financial.total_exposure === "number" ? financial.total_exposure : 0;
    const heldAmount = typeof financial.total_hold === "number" ? financial.total_hold : exposureAmount;
    return sum + heldAmount;
  }, 0);

  return {
    hasClassifications: classifications.length > 0,
    cards,
    changedInvoiceCount,
    originalCounts,
    simulatedCounts,
    affectedByRule,
    potentialAutoReviewShift
  };
}

export default function App() {
  const [parsedFiles, setParsedFiles] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    if (!import.meta.env.DEV) return "";
    return sessionStorage.getItem(LOCAL_API_KEY_STORAGE) ?? "";
  });
  const [isDarkMode, setIsDarkMode] = useState(() => sessionStorage.getItem(DARK_MODE_STORAGE) === "dark");
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
  const [tolerances, setTolerances] = useState(DEFAULT_TOLERANCES);
  const [activeWorkspace, setActiveWorkspace] = useState("start");
  const [queueFilters, setQueueFilters] = useState(DEFAULT_QUEUE_FILTERS);

  const toleranceSimulation = useMemo(
    () => buildToleranceSimulation(matchResults, classificationResults, tolerances),
    [classificationResults, matchResults, tolerances]
  );
  const rootCauseAnalysis = useMemo(
    () => analyzeRootCauses({ parsedFiles, matchResults, classificationResults }),
    [classificationResults, matchResults, parsedFiles]
  );
  const dashboardAnalytics = useMemo(
    () => buildDashboardAnalytics({
      parsedFiles,
      matchResults,
      classificationResults,
      actionResults,
      auditEntries,
      rootCauseAnalysis
    }),
    [actionResults, auditEntries, classificationResults, matchResults, parsedFiles, rootCauseAnalysis]
  );
  const workbenchViewModel = useMemo(
    () => buildExceptionWorkbenchViewModel({
      parsedFiles,
      matchResults,
      classificationResults,
      actionResults,
      toleranceSimulation,
      filters: queueFilters
    }),
    [actionResults, classificationResults, matchResults, parsedFiles, queueFilters, toleranceSimulation]
  );

  function handleApiKeyChange(value) {
    setApiKey(value);
    sessionStorage.setItem(LOCAL_API_KEY_STORAGE, value);
  }

  function toggleDarkMode() {
    setIsDarkMode((current) => {
      const next = !current;
      sessionStorage.setItem(DARK_MODE_STORAGE, next ? "dark" : "light");
      return next;
    });
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
      setTolerances(DEFAULT_TOLERANCES);
      setQueueFilters(DEFAULT_QUEUE_FILTERS);
      setActiveWorkspace("start");
      setStatusMessage("Files validated. Ready to analyze.");
    } catch (fileError) {
      setParsedFiles(null);
      setUploadError(fileError.message);
    }
  }

  function createChunkMeta(chunk, chunkIndex, totalChunks) {
    return {
      index: chunkIndex + 1,
      total: totalChunks,
      invoice_range: getInvoiceRangeLabel(chunk, chunkIndex),
      invoice_count: chunk.length
    };
  }

  async function recordAuditEntry({
    step,
    model,
    input,
    output,
    response,
    promptVersion,
    chunk,
    status = "success",
    errorMessage = "",
    latencyMs = response?.latency_ms ?? 0
  }) {
    const auditEntry = await createAuditEntry({
      step,
      model,
      input,
      output,
      tokenUsage: response?.token_usage ?? null,
      latencyMs,
      promptVersion,
      chunk,
      status,
      errorMessage
    });
    assertNoApiKeyLeak(auditEntry);
    setAuditEntries((current) => [...current, auditEntry]);
    return auditEntry;
  }

  function matchingPayloadForContext(context) {
    return {
      purchase_orders: context.purchase_orders,
      invoices: context.invoices,
      goods_receipts: context.goods_receipts,
      duplicate_invoice_numbers: context.duplicate_invoice_numbers,
      invoice_number_occurrences: context.invoice_number_occurrences,
      all_purchase_order_numbers: context.all_purchase_order_numbers
    };
  }

  async function runMatchingChunks(chunks) {
    const chunkResults = [];
    setRunningStep("matching");

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const context = buildChunkContext(parsedFiles, chunk, parsedFiles.invoices);
      const userMessage = JSON.stringify(matchingPayloadForContext(context));
      const startedAt = performance.now();

      setStatusMessage(`Matching chunk ${chunkMeta.index}/${chunkMeta.total} (invoices ${chunkMeta.invoice_range})...`);

      try {
        const response = await callClaudeAPI({
          systemPrompt: matchingPrompt,
          userMessage,
          model: MODELS.matching,
          schema: matchingOutputSchema,
          maxTokens: STAGE_MAX_TOKENS.matching,
          apiKey,
          onRetry: ({ attempt }) => setStatusMessage(`Rate limited during matching chunk ${chunkMeta.index}/${chunkMeta.total}. Retry ${attempt + 1} of 3...`)
        });
        const alignedResponse = validateAndAlignResults("matching", context.invoices, response.data, chunkMeta.invoice_range);
        const guarded = applyGlobalMatchingGuards(context, alignedResponse);
        const aligned = validateAndAlignResults("matching", context.invoices, guarded, chunkMeta.invoice_range);
        assertNoApiKeyLeak(aligned);
        await recordAuditEntry({
          step: "matching",
          model: MODELS.matching,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "01_matching_v1",
          chunk: chunkMeta
        });
        chunkResults.push(aligned);
      } catch (chunkError) {
        await recordAuditEntry({
          step: "matching",
          model: MODELS.matching,
          input: `matching:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "01_matching_v1",
          chunk: chunkMeta,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(`Analysis failed on invoices ${chunkMeta.invoice_range}: ${chunkError.message}`);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(parsedFiles.invoices, mergeMatchingChunks(chunkResults), "matching");
    assertNoApiKeyLeak(merged);
    setMatchResults(merged);
    return { merged, chunks: chunkResults };
  }

  async function runClassificationChunks(chunks, matchingChunks) {
    const chunkResults = [];
    setRunningStep("classification");

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const context = buildChunkContext(parsedFiles, chunk, parsedFiles.invoices);
      const userMessage = JSON.stringify({ results: matchingChunks[index].results });
      const startedAt = performance.now();

      setStatusMessage(`Classification chunk ${chunkMeta.index}/${chunkMeta.total} (invoices ${chunkMeta.invoice_range})...`);

      try {
        const response = await callClaudeAPI({
          systemPrompt: classificationPrompt,
          userMessage,
          model: MODELS.classification,
          schema: classificationOutputSchema,
          maxTokens: STAGE_MAX_TOKENS.classification,
          apiKey,
          onRetry: ({ attempt }) => setStatusMessage(`Rate limited during classification chunk ${chunkMeta.index}/${chunkMeta.total}. Retry ${attempt + 1} of 3...`)
        });
        const aligned = validateAndAlignResults("classification", context.invoices, response.data, chunkMeta.invoice_range);
        assertNoApiKeyLeak(aligned);
        await recordAuditEntry({
          step: "classification",
          model: MODELS.classification,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "02_classification_v1",
          chunk: chunkMeta
        });
        chunkResults.push(aligned);
      } catch (chunkError) {
        await recordAuditEntry({
          step: "classification",
          model: MODELS.classification,
          input: `classification:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "02_classification_v1",
          chunk: chunkMeta,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(`Analysis failed on invoices ${chunkMeta.invoice_range}: ${chunkError.message}`);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(parsedFiles.invoices, mergeClassificationChunks(chunkResults), "classification");
    assertNoApiKeyLeak(merged);
    setClassificationResults(merged);
    return { merged, chunks: chunkResults };
  }

  async function runActionGenerationChunks(chunks, matchingChunks, classificationChunks) {
    const chunkResults = [];
    setRunningStep("action_generation");

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const context = buildChunkContext(parsedFiles, chunk, parsedFiles.invoices);
      const userMessage = JSON.stringify({
        batch: buildActionBatch(context, matchingChunks[index], classificationChunks[index])
      });
      const startedAt = performance.now();

      setStatusMessage(`Drafting chunk ${chunkMeta.index}/${chunkMeta.total} (invoices ${chunkMeta.invoice_range})...`);

      try {
        const response = await callClaudeAPI({
          systemPrompt: actionPrompt,
          userMessage,
          model: MODELS.action_generation,
          schema: actionOutputSchema,
          maxTokens: STAGE_MAX_TOKENS.action_generation,
          apiKey,
          onRetry: ({ attempt }) => setStatusMessage(`Rate limited during drafting chunk ${chunkMeta.index}/${chunkMeta.total}. Retry ${attempt + 1} of 3...`)
        });
        const normalized = normalizeActionChunkResults(
          context.invoices,
          response.data,
          classificationChunks[index],
          chunkMeta.invoice_range
        );
        const aligned = validateAndAlignResults("action_generation", context.invoices, normalized, chunkMeta.invoice_range);
        assertNoApiKeyLeak(aligned);
        await recordAuditEntry({
          step: "action_generation",
          model: MODELS.action_generation,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "03_action_generation_v1",
          chunk: chunkMeta
        });
        chunkResults.push(aligned);
      } catch (chunkError) {
        await recordAuditEntry({
          step: "action_generation",
          model: MODELS.action_generation,
          input: `action_generation:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "03_action_generation_v1",
          chunk: chunkMeta,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(`Analysis failed on invoices ${chunkMeta.invoice_range}: ${chunkError.message}`);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(parsedFiles.invoices, mergeActionChunks(chunkResults), "action_generation");
    assertNoApiKeyLeak(merged);
    setActionResults(merged);
    return { merged, chunks: chunkResults };
  }

  async function runPipeline() {
    setError("");
    setFailedStep("");
    if (!parsedFiles) {
      setError("Upload and validate all three CSV files first");
      return;
    }

    const chunks = chunkInvoices(parsedFiles.invoices, ANALYSIS_CHUNK_SIZE);
    let activeStep = "matching";

    setMatchResults(null);
    setClassificationResults(null);
    setActionResults(null);
    setAuditEntries([]);
    setApprovedActions(new Set());
    setTier3Notes({});
    setReviewedTier3(new Set());
    setActiveWorkspace("start");
    setStatusMessage(`Preparing ${parsedFiles.invoices.length} invoices across ${chunks.length} chunks of up to ${ANALYSIS_CHUNK_SIZE}.`);

    try {
      activeStep = "matching";
      const nextMatchResults = await runMatchingChunks(chunks);
      activeStep = "classification";
      const nextClassificationResults = await runClassificationChunks(chunks, nextMatchResults.chunks);
      activeStep = "action_generation";
      await runActionGenerationChunks(chunks, nextMatchResults.chunks, nextClassificationResults.chunks);
      setStatusMessage("Prompt chain complete. Review drafted communications.");
      setActiveWorkspace("executive");
    } catch (pipelineError) {
      setFailedStep(activeStep);
      setMatchResults(null);
      setClassificationResults(null);
      setActionResults(null);
      setError(pipelineError.message);
    } finally {
      setRunningStep("");
    }
  }

  function retryFailedStep() {
    runPipeline();
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
    <main className={`${isDarkMode ? "dark" : ""} min-h-screen bg-slate-50 px-4 py-6 text-slate-950 transition-colors sm:px-6 lg:px-8 dark:bg-slate-950 dark:text-slate-100`}>
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">ProcureGuard AI</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">AP Exception Control Tower</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              type="button"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDarkMode}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? "Light mode" : "Dark mode"}
            </button>
            <button
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400 dark:disabled:bg-slate-700"
              type="button"
              disabled={!parsedFiles || Boolean(runningStep)}
              onClick={runPipeline}
            >
              {runningStep ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </header>

        <Alert message={uploadError} />
        <Alert message={error} onRetry={failedStep ? retryFailedStep : null} />
        <WorkspaceTabs
          activeWorkspace={activeWorkspace}
          onChange={setActiveWorkspace}
          dashboardReady={Boolean(classificationResults)}
          reviewCount={workbenchViewModel.rows.length}
          auditEntryCount={auditEntries.length}
        />

        {activeWorkspace === "start" ? (
          <section className="grid gap-6">
            <ApiKeyPanel apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
            <UploadPanel parsedFiles={parsedFiles} onFilesSelected={handleFilesSelected} isBusy={Boolean(runningStep)} />
            <ProgressPanel
              runningStep={runningStep}
              statusMessage={statusMessage}
              hasMatchResults={Boolean(matchResults)}
              hasClassificationResults={Boolean(classificationResults)}
              hasActionResults={Boolean(actionResults)}
            />
          </section>
        ) : null}

        {activeWorkspace === "executive" ? (
          <ExecutiveDashboard
            analytics={dashboardAnalytics}
            isDarkMode={isDarkMode}
            isAnalysisRunning={Boolean(runningStep)}
          />
        ) : null}

        {activeWorkspace === "workbench" ? (
          <ExceptionWorkbenchPanel
            viewModel={workbenchViewModel}
            filters={queueFilters}
            onFiltersChange={setQueueFilters}
            onResetFilters={() => setQueueFilters(DEFAULT_QUEUE_FILTERS)}
            isAnalysisRunning={Boolean(runningStep)}
            hasAnalysisFailure={Boolean(error && failedStep)}
            onStart={() => setActiveWorkspace("start")}
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
        ) : null}

        {activeWorkspace === "analytics" ? (
          <SupplierPolicyAnalyticsPanel
            dashboardReady={Boolean(classificationResults)}
            analytics={dashboardAnalytics}
            tolerances={tolerances}
            onTolerancesChange={setTolerances}
            toleranceSimulation={toleranceSimulation}
            rootCauseAnalysis={rootCauseAnalysis}
          />
        ) : null}

        {activeWorkspace === "governance" ? (
          <section className="grid gap-4">
            <SessionGovernancePanel analytics={dashboardAnalytics} />
            <AuditPanel entries={auditEntries} onExport={exportAuditTrail} />
          </section>
        ) : null}
      </section>
    </main>
  );
}
