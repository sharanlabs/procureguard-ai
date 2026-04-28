import { useMemo, useState } from "react";
import matchingPrompt from "../prompts/01_matching.md?raw";
import classificationPrompt from "../prompts/02_classification.md?raw";
import actionPrompt from "../prompts/03_action_generation.md?raw";
import ExecutiveDashboard from "./ProcureGuardDashboard.jsx";
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
  createIdlePipelineRunState,
  createPipelineRunState,
  chunkInvoices,
  getInvoiceRangeLabel,
  getPipelineCompletedSummary,
  getPipelineStageOutputs,
  markPipelineChunkFailed,
  markPipelineChunkStarted,
  markPipelineChunkSucceeded,
  markPipelineComplete,
  markPipelineRetryStarted,
  markPipelineStageMerged,
  mergeActionChunks,
  mergeClassificationChunks,
  mergeMatchingChunks,
  mergeCompletedPipelineStage,
  normalizeActionChunkResults,
  validateAndAlignResults,
  validateMergedResults
} from "./lib/pipeline.js";
import { analyzeRootCauses } from "./lib/rootCause.js";
import { actionOutputSchema, classificationOutputSchema, matchingOutputSchema } from "./lib/schemas.js";
import {
  buildExceptionWorkbenchViewModel,
  buildGovernanceViewModel,
  buildSupplierPolicyAnalyticsViewModel
} from "./lib/uiModels.js";

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
        <label className="pg-button pg-button-primary cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600">
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
    <section className="pg-card p-4">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="anthropic-key">
        Local Claude API key
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="anthropic-key"
          className="pg-control min-w-0 flex-1"
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
    <section className="pg-card p-4">
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

function formatFailureTypeLabel(value) {
  return {
    timeout: "Timeout",
    rate_limit: "Rate limit",
    network: "Network",
    api: "Claude API",
    validation: "Validation",
    unknown: "Unknown"
  }[value] ?? "Unknown";
}

function retryButtonLabel(descriptor) {
  if (!descriptor) return "Retry failed chunk";
  return `Retry ${formatStageName(descriptor.stage)} chunk ${descriptor.chunkIndex}/${descriptor.totalChunks}`;
}

function getStoppedRunTitle(runState) {
  const descriptor = runState?.retryDescriptor;
  if (!descriptor) return "Analysis did not complete";
  return `Analysis stopped at ${formatStageName(descriptor.stage)} chunk ${descriptor.chunkIndex}/${descriptor.totalChunks}`;
}

function PipelineRunStatusPanel({ runState, isRunning, onRetry, onRestart }) {
  if (!runState?.runId) return null;

  const completedSummary = getPipelineCompletedSummary(runState);
  const descriptor = runState.retryDescriptor;
  const hasFailure = ["partial_failed", "failed"].includes(runState.status);

  return (
    <section className={`pg-card p-4 ${hasFailure ? "border-amber-300 dark:border-amber-700" : ""}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pipeline run state</p>
          <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
            {hasFailure ? getStoppedRunTitle(runState) : runState.status === "complete" ? "Analysis complete" : "Analysis in progress"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {hasFailure
              ? "Completed chunks are retained in memory, but this run is not a completed batch analysis."
              : isRunning
                ? `Running ${formatStageName(runState.currentStage)} chunk ${runState.currentChunkIndex ?? "-"} of ${runState.totalChunks}.`
                : "Chunk-level progress is captured for the current run."}
          </p>
        </div>
        <Badge className={toneBadgeClass(hasFailure ? "review" : runState.status === "complete" ? "clean" : "info")}>
          {runState.status === "partial_failed" ? "Partial data retained" : runState.status === "failed" ? "Run failed" : runState.status === "complete" ? "Complete" : "Running"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {completedSummary.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" key={item.stage}>
            <p className="font-semibold text-slate-950 dark:text-slate-100">{formatStageName(item.stage)}</p>
            <p className="mt-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {item.completed}/{item.total} chunks retained
            </p>
          </div>
        ))}
      </div>

      {descriptor ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FieldRow label="Failed stage" value={formatStageName(descriptor.stage)} />
            <FieldRow label="Failed chunk" value={`${descriptor.chunkIndex}/${descriptor.totalChunks}`} />
            <FieldRow label="Invoice range" value={descriptor.invoiceRange || "Not available"} />
            <FieldRow label="Failure type" value={formatFailureTypeLabel(descriptor.failureType)} />
            <FieldRow label="Retryable" value={descriptor.retryable ? "Yes" : "No"} />
          </dl>
          <p className="mt-3 rounded-lg border border-amber-200 bg-white p-3 leading-6 text-amber-950 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100">
            {descriptor.message}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {descriptor.retryable ? (
              <button
                className="pg-button pg-button-primary"
                type="button"
                disabled={isRunning}
                onClick={onRetry}
              >
                {retryButtonLabel(descriptor)}
              </button>
            ) : (
              <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100">
                Retry is unavailable for this failure type.
              </p>
            )}
            <button
              className="pg-button pg-button-secondary"
              type="button"
              disabled={isRunning}
              onClick={onRestart}
            >
              Restart full analysis
            </button>
          </div>
        </div>
      ) : null}
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

function ToleranceSimulator({ tolerances, onTolerancesChange, simulation, policySummary }) {
  if (!simulation.hasClassifications) return null;

  const changedCount = simulation.changedInvoiceCount;
  const summaryText = changedCount
    ? `Adjusting tolerances would reclassify ${changedCount} invoice(s), changing ${tierLabel(2).toLowerCase()} count from ${simulation.originalCounts.tier2} to ${simulation.simulatedCounts.tier2}.`
    : "No invoices would change review path under the current tolerance settings.";

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Policy simulator</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Tolerance policy sensitivity</h2>
          <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">
            Simulation only. Adjust policy tolerances locally without changing Claude classifications, payment behavior, or audit records.
          </p>
        </div>
        <Badge className="border-blue-300 bg-white text-blue-800">Simulation only</Badge>
      </div>

      {policySummary?.profiles?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {policySummary.profiles.map((profile) => (
            <Badge
              className={
                profile === policySummary.profileLabel
                  ? toneBadgeClass(policySummary.profileTone)
                  : toneBadgeClass("neutral")
              }
              key={profile}
            >
              {profile}
            </Badge>
          ))}
        </div>
      ) : null}

      {policySummary?.metrics?.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {policySummary.metrics.map((metric) => (
            <SummaryMetric metric={{ ...metric, tone: metric.id === "review-shift" ? "info" : "neutral" }} key={metric.id} />
          ))}
        </div>
      ) : null}

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
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{policySummary?.headline || summaryText}</p>
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

function formatOptionalInteger(value) {
  return typeof value === "number" && !Number.isNaN(value) ? formatInteger(value) : "Not available";
}

function formatCostValue(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value);
}

function formatTelemetryDuration(value) {
  return typeof value === "number" && !Number.isNaN(value) && value > 0 ? formatDuration(value) : "Not available";
}

function toneBadgeClass(tone) {
  return {
    clean: "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/50 dark:text-green-200",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200",
    review: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
    escalate: "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200",
    neutral: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }[tone] ?? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function toneBorderClass(tone) {
  return {
    clean: "border-green-200 dark:border-green-800",
    info: "border-blue-200 dark:border-blue-800",
    review: "border-amber-200 dark:border-amber-800",
    escalate: "border-red-200 dark:border-red-800",
    indigo: "border-indigo-200 dark:border-indigo-800",
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
    <article className={`pg-card-compact ${toneBorderClass(metric.tone)}`}>
      <p className="pg-meta font-semibold uppercase tracking-wide">{metric.label}</p>
      <p className="pg-metric-value mt-2 font-mono font-semibold text-slate-950 dark:text-slate-100">{value}</p>
      <p className="pg-meta mt-1">{metric.helper}</p>
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
    <section className={`pg-empty-panel ${toneBorderClass(tone)}`}>
      <p className="pg-kicker pg-kicker-neutral">{eyebrow}</p>
      <h2 className="pg-section-title">{title}</h2>
      <p className="pg-copy mt-2 max-w-3xl">{body}</p>
      {actionLabel && onAction ? (
        <button
          className="pg-button pg-button-secondary mt-4"
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function PartialAnalysisNotice({ runState, onRetry, onStart }) {
  const descriptor = runState?.retryDescriptor;
  if (!descriptor) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Partial analysis</p>
          <h2 className="mt-1 text-lg font-semibold">{getStoppedRunTitle(runState)}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6">
            Completed chunks are retained, but final batch results are not complete. Partial rows below are limited to invoices with completed prerequisite data.
          </p>
          <p className="mt-2 text-sm font-semibold">
            Failed invoices {descriptor.invoiceRange || "not available"}: {descriptor.message}
          </p>
        </div>
        <Badge className={toneBadgeClass("review")}>Not complete</Badge>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {descriptor.retryable ? (
          <button className="pg-button pg-button-primary" type="button" onClick={onRetry}>
            {retryButtonLabel(descriptor)}
          </button>
        ) : null}
        <button className="pg-button pg-button-secondary" type="button" onClick={onStart}>
          Go to Start
        </button>
      </div>
    </section>
  );
}

function WorkbenchHeader({ hasData, isAnalysisRunning, isPartial = false }) {
  return (
    <header className="pg-page-header">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="pg-kicker">Exception Workbench</p>
          <h2 className="pg-page-title">
            Which invoices need human review now?
          </h2>
          <p className="pg-copy mt-2 max-w-3xl">
            Analyst queue for triaging invoice exceptions, validating evidence, and reviewing DRAFT-only follow-up material.
          </p>
        </div>
        <Badge className={toneBadgeClass(isAnalysisRunning ? "info" : isPartial ? "review" : hasData ? "review" : "neutral")}>
          {isAnalysisRunning ? "Analysis in progress" : isPartial ? "Partial data retained" : hasData ? "Human-in-the-loop" : "Awaiting analysis"}
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
    ? "pg-card border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40"
    : "pg-card";

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

function governanceMetricValue(metric) {
  if (metric.format === "text") return metric.value || "Not available";
  if (metric.format === "duration") return formatTelemetryDuration(metric.value);
  if (metric.format === "integer-optional") return formatOptionalInteger(metric.value);
  if (metric.format === "money") return formatMoney(metric.value);
  return formatInteger(metric.value);
}

function GovernanceMetric({ label, value, helper, tone = "neutral", isNumber = true }) {
  return (
    <article className={`pg-card-compact ${toneBorderClass(tone)}`}>
      <p className="pg-meta font-semibold uppercase tracking-wide">{label}</p>
      <p className={`${isNumber ? "font-mono pg-metric-value" : "text-lg leading-6"} mt-2 font-semibold text-slate-950 dark:text-slate-100`}>
        {value}
      </p>
      {helper ? <p className="pg-meta mt-2">{helper}</p> : null}
    </article>
  );
}

function GovernanceHeader({ viewModel }) {
  return (
    <header className="pg-page-header">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="pg-kicker pg-kicker-governance">{viewModel.header.eyebrow}</p>
          <h2 className="pg-page-title">
            {viewModel.header.title}
          </h2>
          <p className="pg-copy mt-2 max-w-4xl">
            {viewModel.header.takeaway}
          </p>
        </div>
        <Badge className={toneBadgeClass(viewModel.runState.tone)}>{viewModel.runState.label}</Badge>
      </div>
    </header>
  );
}

function AiReliabilityCenter({ viewModel }) {
  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">AI Reliability Center</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Run health, controls, and audit readiness</h3>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
            Reliability metadata for the current AI-assisted review process. Claims are based on captured run data only.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Audit-supporting
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {viewModel.reliabilitySummary.cards.map((metric) => (
          <GovernanceMetric
            key={metric.id}
            label={metric.label}
            value={governanceMetricValue(metric)}
            helper={metric.helper}
            tone={metric.tone}
            isNumber={!["text"].includes(metric.format)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-indigo-200 bg-white p-4 dark:border-indigo-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Validation gates</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {viewModel.validationGates.hasValidationDetail
                ? "Available gate detail is shown from current run metadata."
                : viewModel.validationGates.unavailableMessage}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {viewModel.validationGates.gates.map((gate) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800" key={gate.id}>
              <div className="flex flex-col gap-2">
                <Badge className={toneBadgeClass(gate.tone)}>{gate.statusLabel}</Badge>
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{gate.label}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{gate.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApiServiceAndDataInputs({ viewModel, apiKey, onApiKeyChange }) {
  const exposure = viewModel.apiExposure;
  const uploaded = viewModel.uploadedData;

  return (
    <section className="pg-card">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI service and data inputs</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Claude service mode and uploaded data</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Production uses server-side Claude configuration. Local development keeps the key session-only when provided.
          </p>
        </div>
        <Badge className={toneBadgeClass(exposure.serviceTone)}>{exposure.modeLabel}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <GovernanceMetric
          label="AI service status"
          value={exposure.serviceStatus}
          helper={exposure.detail}
          tone={exposure.serviceTone}
          isNumber={false}
        />
        <GovernanceMetric
          label="Client key exposure"
          value={exposure.clientKeyExposure}
          helper="Audit export excludes raw API keys."
          tone={exposure.exposureTone}
          isNumber={false}
        />
        <GovernanceMetric
          label="Invoices loaded"
          value={formatInteger(uploaded.invoiceCount)}
          helper={uploaded.hasFiles ? "Parsed from uploaded CSVs" : "Available after upload"}
          tone={uploaded.hasFiles ? "info" : "neutral"}
        />
        <GovernanceMetric
          label="Input files"
          value={formatInteger(uploaded.files.length)}
          helper={uploaded.summary}
          tone={uploaded.hasFiles ? "info" : "neutral"}
        />
      </div>

      {exposure.allowLocalKeyInput ? (
        <div className="mt-5">
          <ApiKeyPanel apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
        </div>
      ) : null}

      {uploaded.files.length ? (
        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {uploaded.files.map((file) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" key={file.key}>
              <p className="font-semibold text-slate-950 dark:text-slate-100">{file.name}</p>
              <p className="mt-1 font-mono tabular-nums text-slate-500 dark:text-slate-400">{formatInteger(file.rowCount)} rows parsed</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Uploaded file summary appears after CSV validation from Start.
        </p>
      )}
    </section>
  );
}

function WorkflowTraceSummary({ trace }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Workflow trace summary</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Prompt-chain trace from data setup to export</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {formatInteger(trace.completedCount)} of {formatInteger(trace.steps.length)} trace steps have current run evidence.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {trace.steps.map((step) => (
          <article className={`rounded-xl border bg-slate-50 p-3 dark:bg-slate-800 ${toneBorderClass(step.tone)}`} key={step.id}>
            <div className="flex flex-col gap-2">
              <Badge className={toneBadgeClass(step.tone)}>{step.statusLabel}</Badge>
              <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-100">{step.stageLabel}</h4>
            </div>
            <p className="mt-2 min-h-10 text-xs leading-5 text-slate-600 dark:text-slate-400">{step.detail}</p>
            <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs dark:border-slate-700">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Chunks</dt>
                <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{step.chunkCount ? formatInteger(step.chunkCount) : "Not available"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Model</dt>
                <dd className="text-right text-slate-800 dark:text-slate-200">{step.model}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">Latency</dt>
                <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{formatTelemetryDuration(step.latencyMs)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function RuntimeCostTelemetry({ viewModel }) {
  const tokenCost = viewModel.tokenCost;
  const latency = viewModel.latency;
  const modelRouting = viewModel.modelRouting;

  return (
    <section className="pg-card">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Runtime and cost telemetry</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Tokens, cost estimate, latency, and model routing</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Token and cost values appear only when usage metadata is returned by the Claude API response.
          </p>
        </div>
        <Badge className={toneBadgeClass(tokenCost.tokenDataReported ? "info" : "neutral")}>
          {tokenCost.tokenDataReported ? "Usage metadata captured" : "Token usage not available"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GovernanceMetric
          label="Input tokens"
          value={tokenCost.tokenDataReported ? formatInteger(tokenCost.inputTokens) : "Not available"}
          helper={tokenCost.tokenDataReported ? "Prompt/input usage" : tokenCost.emptyMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Output tokens"
          value={tokenCost.tokenDataReported ? formatInteger(tokenCost.outputTokens) : "Not available"}
          helper={tokenCost.tokenDataReported ? "Completion/output usage" : tokenCost.emptyMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Cache write tokens"
          value={tokenCost.cacheUsageReported ? formatInteger(tokenCost.cacheCreationInputTokens) : "Not available"}
          helper={tokenCost.cacheUsageReported ? "Prompt cache creation usage" : tokenCost.cacheUsageMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Cache read tokens"
          value={tokenCost.cacheUsageReported ? formatInteger(tokenCost.cacheReadInputTokens) : "Not available"}
          helper={tokenCost.cacheUsageReported ? "Prompt cache read usage" : tokenCost.cacheUsageMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Estimated cache-aware cost"
          value={tokenCost.tokenDataReported ? formatCostValue(tokenCost.estimatedCacheAwareCost) : "Not available"}
          helper={tokenCost.cacheUsageReported ? "Estimated with cache write/read token rates" : tokenCost.cacheUsageMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Cost per invoice"
          value={tokenCost.tokenDataReported ? formatCostValue(tokenCost.costPerInvoice) : "Not available"}
          helper="Derived from estimated cache-aware cost when invoice count is available"
          tone="neutral"
        />
        <GovernanceMetric
          label="Total latency"
          value={latency.hasLatency ? formatDuration(latency.totalLatencyMs) : "Not available"}
          helper={latency.hasLatency ? "Sum of captured API response timings" : latency.emptyMessage}
          tone="neutral"
        />
        <GovernanceMetric
          label="Average latency"
          value={latency.hasLatency ? formatDuration(latency.averageLatencyMs) : "Not available"}
          helper="Average per captured audit entry"
          tone="neutral"
        />
        <GovernanceMetric
          label="Slowest chunk"
          value={latency.slowest ? latency.slowest.chunkLabel : "Not available"}
          helper={latency.slowest ? `${latency.slowest.stage} · ${formatDuration(latency.slowest.latencyMs)} · invoices ${latency.slowest.invoiceRange}` : latency.emptyMessage}
          tone={latency.slowest ? "review" : "neutral"}
          isNumber={false}
        />
        <GovernanceMetric
          label="Models used"
          value={modelRouting.modelsUsed.length ? modelRouting.modelsUsed.join(", ") : "Not available"}
          helper={modelRouting.summary}
          tone="neutral"
          isNumber={false}
        />
      </div>

      {modelRouting.rows.length ? (
        <div className="pg-table-wrap mt-5">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2" scope="col">Stage</th>
                <th className="px-3 py-2" scope="col">Model routing</th>
                <th className="px-3 py-2 text-right" scope="col">Chunks</th>
                <th className="px-3 py-2" scope="col">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {modelRouting.rows.map((row) => (
                <tr className="align-top hover:bg-slate-50 dark:hover:bg-slate-800" key={row.stage}>
                  <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.stageLabel}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{row.models.join(", ")}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{formatInteger(row.chunkCount)}</td>
                  <td className="px-3 py-3"><Badge className={toneBadgeClass(row.status.tone)}>{row.status.label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Model usage not available for this run.
        </p>
      )}
    </section>
  );
}

function AuditTrailSummaryAndExport({ viewModel, onExport }) {
  const auditExport = viewModel.auditExport;

  return (
    <section className="pg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Audit trail summary and export</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{auditExport.statusLabel}</h3>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-400">{auditExport.safetyText}</p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          type="button"
          disabled={!auditExport.ready}
          onClick={onExport}
        >
          Export audit CSV
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GovernanceMetric
          label="Audit entries captured"
          value={formatInteger(auditExport.entryCount)}
          helper={auditExport.ready ? "Run metadata available for export" : "No audit entries captured yet."}
          tone={auditExport.ready ? "info" : "neutral"}
        />
        <GovernanceMetric
          label="Failed audit entries"
          value={formatInteger(auditExport.failedCount)}
          helper="Captured failed-stage entries stay visible for diagnosis"
          tone={auditExport.failedCount ? "escalate" : "neutral"}
        />
        <GovernanceMetric
          label="Export status"
          value={auditExport.ready ? "Audit-ready" : "Not ready"}
          helper="Audit-supporting export, not a legal certification"
          tone={auditExport.tone}
          isNumber={false}
        />
        <GovernanceMetric
          label="Draft-only controls"
          value="Active"
          helper="Communications require human review before use"
          tone="clean"
          isNumber={false}
        />
      </div>
    </section>
  );
}

function AuditEntryRow({ entry, index }) {
  const inputTokens = entry.token_usage?.input_tokens ?? entry.token_usage?.prompt_tokens;
  const outputTokens = entry.token_usage?.output_tokens ?? entry.token_usage?.completion_tokens;
  const cacheCreationTokens = entry.token_usage?.cache_creation_input_tokens;
  const cacheReadTokens = entry.token_usage?.cache_read_input_tokens;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-950 dark:text-slate-100">
            {formatStageName(entry.step)} · {formatModelName(entry.model)} · {statusLabel(entry.status ?? "success")}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{entry.timestamp || `Entry ${index + 1}`}</p>
        </div>
        <Badge className={toneBadgeClass(entry.status === "failed" ? "escalate" : "neutral")}>
          {entry.chunk ? `Chunk ${entry.chunk.index}/${entry.chunk.total}` : "No chunk metadata"}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <FieldRow label="Invoice range" value={entry.chunk?.invoice_range || "Not available"} />
        <FieldRow label="Retry status" value={entry.chunk?.retry_status || "Not available"} />
        <FieldRow label="Attempt" value={entry.chunk?.attempt ? `${entry.chunk.attempt}` : "Not available"} />
        <FieldRow label="Failure type" value={entry.chunk?.failure_type ? formatFailureTypeLabel(entry.chunk.failure_type) : "Not available"} />
        <FieldRow label="Latency" value={formatTelemetryDuration(entry.latency_ms)} />
        <FieldRow label="Tokens" value={`In ${formatOptionalInteger(inputTokens)} · Out ${formatOptionalInteger(outputTokens)}`} />
        <FieldRow label="Cache tokens" value={`Write ${formatOptionalInteger(cacheCreationTokens)} · Read ${formatOptionalInteger(cacheReadTokens)}`} />
        <FieldRow label="Output summary" value={`${entry.output_summary?.invoice_count ?? 0} invoices · ${entry.output_summary?.exception_count ?? 0} exceptions`} />
      </dl>
      {entry.error_message ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {entry.error_message}
        </p>
      ) : null}
    </div>
  );
}

function AuditStageGroups({ groups }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Grouped audit entries</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Raw audit records by stage</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Raw entries sit below the reliability summary so analysts can inspect evidence without starting from a log wall.
        </p>
      </div>

      {groups.length ? (
        <div className="mt-5 space-y-3">
          {groups.map((group) => (
            <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800" key={group.id}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-100">
                {group.label} · {formatInteger(group.count)} {group.count === 1 ? "entry" : "entries"}
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <GovernanceMetric label="Status" value={group.status.label} helper={group.chunkRangeLabel} tone={group.status.tone} isNumber={false} />
                <GovernanceMetric label="Chunks" value={formatInteger(group.chunkCount)} helper="Unique chunk records" tone="neutral" />
                <GovernanceMetric label="Latency" value={formatTelemetryDuration(group.totalLatencyMs)} helper="Total captured latency" tone="neutral" />
                <GovernanceMetric label="Tokens" value={formatInteger(group.totalTokens)} helper="Input plus output tokens" tone="neutral" />
                <GovernanceMetric
                  label="Cache tokens"
                  value={group.cacheUsageReported ? `${formatInteger(group.cacheCreationInputTokens)} write · ${formatInteger(group.cacheReadInputTokens)} read` : "Not available"}
                  helper={group.cacheUsageReported ? "Reported cache usage" : "Cache usage not available for this run."}
                  tone="neutral"
                  isNumber={false}
                />
                <GovernanceMetric label="Models" value={group.models.join(", ") || "Not available"} helper="Humanized model labels" tone="neutral" isNumber={false} />
              </div>
              <div className="mt-4 space-y-2">
                {group.entries.map((entry, index) => (
                  <AuditEntryRow entry={entry} index={index} key={`${group.id}-${entry.timestamp}-${index}`} />
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No audit entries captured yet.
        </p>
      )}
    </section>
  );
}

function GovernancePanel({ viewModel, apiKey, onApiKeyChange, onExport, onStart }) {
  if (!viewModel.hasData) {
    return (
      <section className="pg-page-stack">
        <GovernanceHeader viewModel={viewModel} />
        <ApiServiceAndDataInputs viewModel={viewModel} apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
        <WorkbenchEmptyState
          eyebrow="Awaiting analysis"
          title="Run analysis from Start to capture audit and reliability metadata"
          body="Audit entries, workflow trace, token usage, latency, model routing, and export readiness appear after the Claude prompt-chain workflow runs."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="neutral"
        />
      </section>
    );
  }

  return (
    <section className="pg-page-stack">
      <GovernanceHeader viewModel={viewModel} />
      <AiReliabilityCenter viewModel={viewModel} />
      <ApiServiceAndDataInputs viewModel={viewModel} apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
      <WorkflowTraceSummary trace={viewModel.workflowTrace} />
      <RuntimeCostTelemetry viewModel={viewModel} />
      <AuditTrailSummaryAndExport viewModel={viewModel} onExport={onExport} />
      <AuditStageGroups groups={viewModel.auditGroups} />
    </section>
  );
}

function WorkspaceTabs({ activeWorkspace, onChange, dashboardReady, reviewCount, auditEntryCount }) {
  return (
    <nav
      aria-label="Workspace navigation"
      className="pg-card p-2"
    >
      <div className="pg-tabs">
        <div className="pg-tabs-list">
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
                className={`pg-tab ${isActive ? "pg-tab-active" : ""}`}
                aria-pressed={isActive}
                onClick={() => onChange(tab.id)}
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className="pg-tab-helper">
                  {helper}
                </span>
              </button>
            );
          })}
        </div>
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
    <section className="pg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Filter and sort queue</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{visibleCount}</span> of{" "}
            <span className="font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{totalCount}</span> invoices visible. Filters are local and do not change classifications.
          </p>
        </div>
        <button
          className="pg-button pg-button-secondary"
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
            className="pg-control mt-1"
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
            className="pg-control mt-1"
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
            className="pg-control mt-1"
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
            className="pg-control mt-1"
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
            className="pg-control mt-1"
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
  partialRunState,
  onRetryPartial,
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
      <section className="pg-page-stack">
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

  if (hasAnalysisFailure && !viewModel.hasData) {
    return (
      <section className="pg-page-stack">
        <WorkbenchHeader hasData={false} isAnalysisRunning={false} />
        <WorkbenchEmptyState
          eyebrow="Analysis failed"
          title={partialRunState?.retryDescriptor ? getStoppedRunTitle(partialRunState) : "Exception Workbench is waiting for a successful run"}
          body="Completed chunks are retained, but no completed classification subset is available for the workbench yet. Return to Start, retry the failed chunk when available, or restart the full analysis."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="escalate"
        />
      </section>
    );
  }

  if (!viewModel.hasData) {
    return (
      <section className="pg-page-stack">
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
    <section className="pg-page-stack">
      <WorkbenchHeader hasData={viewModel.hasData} isAnalysisRunning={false} isPartial={Boolean(partialRunState?.retryDescriptor)} />
      {partialRunState?.retryDescriptor ? (
        <PartialAnalysisNotice runState={partialRunState} onRetry={onRetryPartial} onStart={onStart} />
      ) : null}
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
        <div className="pg-page-stack">
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

function analyticsHeatCellClass(count) {
  if (count >= 3) return "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200";
  if (count === 2) return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200";
  if (count === 1) return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200";
  return "border-transparent bg-transparent text-slate-300 dark:text-slate-600";
}

function SupplierPolicyHeader({ viewModel }) {
  return (
    <header className="pg-page-header">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="pg-kicker">{viewModel.header.eyebrow}</p>
          <h2 className="pg-page-title">
            {viewModel.header.title}
          </h2>
          <p className="pg-copy mt-2 max-w-4xl">
            {viewModel.header.takeaway}
          </p>
        </div>
        <Badge className={toneBadgeClass(viewModel.hasData ? "info" : "neutral")}>
          Batch-based operational risk
        </Badge>
      </div>
    </header>
  );
}

function SupplierRiskCard({ supplier }) {
  return (
    <article className="pg-card-compact">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{supplier.supplierName}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{supplier.explanation}</p>
        </div>
        <Badge className={toneBadgeClass(supplier.riskLevel === "High" ? "escalate" : supplier.riskLevel === "Medium" ? "review" : "clean")}>
          {supplier.riskLevel}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3 dark:border-slate-700">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exceptions</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{formatInteger(supplier.exceptionRows)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exposure</dt>
          <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{formatMoney(supplier.exposure)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Top codes</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{supplier.topExceptionCodes.length ? supplier.topExceptionCodes.join(", ") : "Not available"}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <span className="font-semibold text-slate-950 dark:text-slate-100">Recommended procurement action: </span>
        {supplier.recommendedAction}
      </p>
    </article>
  );
}

function SupplierRiskSummary({ suppliers }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Supplier risk summary</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Top supplier follow-through candidates</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Ranked by current batch exposure, escalation pressure, and exception concentration.
        </p>
      </div>
      {suppliers.length ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <SupplierRiskCard supplier={supplier} key={supplier.key} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-700 dark:bg-green-950/50 dark:text-green-200">
          No supplier concentration detected in this batch.
        </p>
      )}
    </section>
  );
}

function SupplierScorecard({ rows }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supplier scorecard</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Batch-based operational risk by supplier</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Risk labels explain the current batch signal only; they do not represent external supplier risk.
        </p>
      </div>
      {rows.length ? (
        <div className="pg-table-wrap mt-5">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2" scope="col">Supplier</th>
                <th className="px-3 py-2" scope="col">Diversity certification</th>
                <th className="px-3 py-2 text-right" scope="col">Exceptions</th>
                <th className="px-3 py-2 text-right" scope="col">Exposure</th>
                <th className="px-3 py-2" scope="col">Risk</th>
                <th className="px-3 py-2" scope="col">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {rows.map((supplier) => (
                <tr className="align-top hover:bg-slate-50 dark:hover:bg-slate-800" key={supplier.key}>
                  <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{supplier.supplierName}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{supplier.diversityCertification}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">{formatInteger(supplier.exceptionRows)}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">{formatMoney(supplier.exposure)}</td>
                  <td className="px-3 py-3">
                    <Badge className={toneBadgeClass(supplier.riskLevel === "High" ? "escalate" : supplier.riskLevel === "Medium" ? "review" : "clean")}>
                      {supplier.riskLevel}
                    </Badge>
                  </td>
                  <td className="max-w-md px-3 py-3 text-slate-700 dark:text-slate-300">
                    <p>{supplier.riskExplanation}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{supplier.recommendedAction}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Supplier scorecard appears after analysis completes.
        </p>
      )}
    </section>
  );
}

function ExceptionLegend({ legend }) {
  if (!legend.length) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        No exception legend available for this batch.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {legend.map((item) => (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800" key={item.code}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{item.code} · {item.label}</p>
            <Badge className={toneBadgeClass(item.tone)}>{tierLabel(item.tier)}</Badge>
          </div>
          <p className="mt-2 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {formatInteger(item.count)} rows · {formatMoney(item.exposure)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ExceptionHeatmap({ rows, legend, takeaway }) {
  return (
    <section className="pg-card">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exception concentration heatmap</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Supplier by exception type</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{takeaway}</p>
        </div>
        <Badge className={toneBadgeClass(rows.length ? "info" : "neutral")}>Batch exceptions only</Badge>
      </div>

      {rows.length && legend.length ? (
        <div className="pg-table-wrap mt-5">
          <table className="min-w-full text-center text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left" scope="col">Supplier</th>
                <th className="px-3 py-2 text-right" scope="col">Exposure</th>
                {legend.map((item) => (
                  <th className="px-3 py-2" key={item.code} scope="col">{item.code}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {rows.map((row) => (
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={row.key}>
                  <td className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">{row.supplierName}</td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(row.exposure)}</td>
                  {row.cells.map((cell) => (
                    <td className="px-2 py-3" key={`${row.key}-${cell.code}`}>
                      <span className={`inline-flex min-w-8 justify-center rounded-md border px-2 py-1 font-mono tabular-nums ${analyticsHeatCellClass(cell.count)}`}>
                        {cell.count > 0 ? cell.count : "—"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No exception concentration data available.
        </p>
      )}

      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exception legend</p>
        <ExceptionLegend legend={legend} />
      </div>
    </section>
  );
}

function PolicySimulatorSection({ policySummary, tolerances, onTolerancesChange, toleranceSimulation }) {
  if (!policySummary.hasData) {
    return (
      <WorkbenchEmptyState
        eyebrow="Policy simulator"
        title="Policy simulation is available after analysis."
        body="Run analysis to enable tolerance sensitivity controls for price, quantity, and receiving timing rules."
        tone="neutral"
      />
    );
  }

  return (
    <ToleranceSimulator
      tolerances={tolerances}
      onTolerancesChange={onTolerancesChange}
      simulation={toleranceSimulation}
      policySummary={policySummary}
    />
  );
}

function RootCausePatternCard({ pattern }) {
  return (
    <article className="pg-card-compact">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge className={toneBadgeClass(pattern.displayType === "Supplier concentration" ? "review" : pattern.displayType === "Policy sensitivity" ? "info" : "neutral")}>
            {pattern.displayType}
          </Badge>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-950 dark:text-slate-100">{pattern.description}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exposure</p>
          <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{formatMoney(pattern.totalExposure)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-slate-950 dark:text-slate-100">Pattern review: </span>
        {pattern.recommendedAction}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Affected invoices: {pattern.affectedInvoices.length ? pattern.affectedInvoices.join(", ") : "Not available"}
      </p>
    </article>
  );
}

function RootCausePatternsSection({ rootCause }) {
  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Browser-only pattern review</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Pattern signals</h3>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">{rootCause.takeaway}</p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Browser-only pattern review
        </Badge>
      </div>

      {rootCause.patterns.length ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryMetric
              metric={{
                id: "supplier-concentration",
                label: "Supplier concentration",
                value: rootCause.supplierConcentrationCount,
                format: "integer",
                tone: "neutral",
                helper: "Repeated supplier signals"
              }}
            />
            <SummaryMetric
              metric={{
                id: "policy-sensitivity",
                label: "Policy sensitivity",
                value: rootCause.policySensitivityCount,
                format: "integer",
                tone: "neutral",
                helper: "Repeated exception rules"
              }}
            />
            <SummaryMetric
              metric={{
                id: "receiving-timing",
                label: "Receiving timing pattern",
                value: rootCause.receivingTimingCount,
                format: "integer",
                tone: "neutral",
                helper: "Warehouse or timing signals"
              }}
            />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {rootCause.patterns.map((pattern) => (
              <RootCausePatternCard pattern={pattern} key={pattern.id} />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-lg border border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-800 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-200">
          No supplier concentration detected in this batch.
        </p>
      )}
    </section>
  );
}

function SupplierPolicyAnalyticsPanel({
  viewModel,
  isAnalysisRunning,
  hasAnalysisFailure,
  onStart,
  tolerances,
  onTolerancesChange,
  toleranceSimulation
}) {
  if (isAnalysisRunning) {
    return (
      <section className="pg-page-stack">
        <SupplierPolicyHeader viewModel={viewModel} />
        <WorkbenchEmptyState
          eyebrow="Analysis in progress"
          title="Supplier & Policy Analytics will appear after validation completes"
          body="The Start page is running the prompt-chain workflow. This page avoids showing stale supplier analytics while analysis is in flight."
          tone="info"
        />
      </section>
    );
  }

  if (hasAnalysisFailure) {
    return (
      <section className="pg-page-stack">
        <SupplierPolicyHeader viewModel={viewModel} />
        <WorkbenchEmptyState
          eyebrow="Analysis failed"
          title="Supplier & Policy Analytics is waiting for a successful run"
          body="The previous run did not complete, so completed supplier analytics are withheld. Return to Start, resolve the failure, and rerun analysis."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="escalate"
        />
      </section>
    );
  }

  if (!viewModel.hasData) {
    return (
      <section className="pg-page-stack">
        <SupplierPolicyHeader viewModel={viewModel} />
        <WorkbenchEmptyState
          eyebrow="Awaiting analysis"
          title="Run analysis from Start to build supplier and policy analytics"
          body="Completed results will populate supplier risk explanations, exception concentration, policy simulation, and browser-only pattern signals."
          actionLabel="Go to Start"
          onAction={onStart}
          tone="neutral"
        />
      </section>
    );
  }

  return (
    <section className="pg-page-stack">
      <SupplierPolicyHeader viewModel={viewModel} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {viewModel.summaryCards.map((metric) => (
          <SummaryMetric metric={metric} key={metric.id} />
        ))}
      </div>
      <SupplierRiskSummary suppliers={viewModel.supplierRiskNarratives} />
      <SupplierScorecard rows={viewModel.supplierScoreRows} />
      <ExceptionHeatmap
        rows={viewModel.heatmapRows}
        legend={viewModel.exceptionLegend}
        takeaway={viewModel.heatmapTakeaway}
      />
      <PolicySimulatorSection
        policySummary={viewModel.policySimulation}
        tolerances={tolerances}
        onTolerancesChange={onTolerancesChange}
        toleranceSimulation={toleranceSimulation}
      />
      <RootCausePatternsSection rootCause={viewModel.rootCause} />
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

function isIncompleteRun(runState) {
  return ["partial_failed", "failed"].includes(runState?.status);
}

function isFinalRunComplete(runState, matchResults, classificationResults, actionResults) {
  return Boolean(
    runState?.status === "complete" &&
    runState.finalResultsComplete &&
    matchResults &&
    classificationResults &&
    actionResults
  );
}

function buildPartialWorkbenchResults(runState) {
  const classificationResults = mergeCompletedPipelineStage(runState, "classification");
  const completedClassificationCount = classificationResults?.classifications?.length ?? 0;
  if (!completedClassificationCount) {
    return {
      matchResults: null,
      classificationResults: null,
      actionResults: null
    };
  }

  const matchResults = mergeCompletedPipelineStage(runState, "matching");
  const actionResults = mergeCompletedPipelineStage(runState, "action_generation");

  return {
    matchResults: matchResults?.results
      ? { results: matchResults.results.slice(0, completedClassificationCount) }
      : null,
    classificationResults,
    actionResults: actionResults?.action_results
      ? { action_results: actionResults.action_results.slice(0, completedClassificationCount) }
      : null
  };
}

function auditChunkForAttempt(chunkMeta, attempt, retryStatus, failureDescriptor = null) {
  return {
    ...chunkMeta,
    attempt,
    retry_count: Math.max(0, attempt - 1),
    retry_status: retryStatus,
    failure_type: failureDescriptor?.failureType ?? "",
    retryable: failureDescriptor?.retryable ?? ""
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
  const [pipelineRunState, setPipelineRunState] = useState(() => createIdlePipelineRunState());

  const finalResultsComplete = isFinalRunComplete(pipelineRunState, matchResults, classificationResults, actionResults);
  const partialWorkbenchResults = useMemo(
    () => isIncompleteRun(pipelineRunState)
      ? buildPartialWorkbenchResults(pipelineRunState)
      : { matchResults: null, classificationResults: null, actionResults: null },
    [pipelineRunState]
  );
  const workbenchMatchResults = finalResultsComplete ? matchResults : partialWorkbenchResults.matchResults;
  const workbenchClassificationResults = finalResultsComplete ? classificationResults : partialWorkbenchResults.classificationResults;
  const workbenchActionResults = finalResultsComplete ? actionResults : partialWorkbenchResults.actionResults;
  const toleranceSimulation = useMemo(
    () => buildToleranceSimulation(
      finalResultsComplete ? matchResults : null,
      finalResultsComplete ? classificationResults : null,
      tolerances
    ),
    [classificationResults, finalResultsComplete, matchResults, tolerances]
  );
  const workbenchToleranceSimulation = useMemo(
    () => buildToleranceSimulation(workbenchMatchResults, workbenchClassificationResults, tolerances),
    [workbenchClassificationResults, workbenchMatchResults, tolerances]
  );
  const rootCauseAnalysis = useMemo(
    () => analyzeRootCauses({
      parsedFiles,
      matchResults: finalResultsComplete ? matchResults : null,
      classificationResults: finalResultsComplete ? classificationResults : null
    }),
    [classificationResults, finalResultsComplete, matchResults, parsedFiles]
  );
  const dashboardAnalytics = useMemo(
    () => buildDashboardAnalytics({
      parsedFiles,
      matchResults: finalResultsComplete ? matchResults : null,
      classificationResults: finalResultsComplete ? classificationResults : null,
      actionResults: finalResultsComplete ? actionResults : null,
      auditEntries,
      rootCauseAnalysis
    }),
    [actionResults, auditEntries, classificationResults, finalResultsComplete, matchResults, parsedFiles, rootCauseAnalysis]
  );
  const supplierPolicyViewModel = useMemo(
    () => buildSupplierPolicyAnalyticsViewModel({
      analytics: dashboardAnalytics,
      rootCauseAnalysis,
      toleranceSimulation,
      tolerances
    }),
    [dashboardAnalytics, rootCauseAnalysis, toleranceSimulation, tolerances]
  );
  const workbenchViewModel = useMemo(
    () => buildExceptionWorkbenchViewModel({
      parsedFiles,
      matchResults: workbenchMatchResults,
      classificationResults: workbenchClassificationResults,
      actionResults: workbenchActionResults,
      toleranceSimulation: workbenchToleranceSimulation,
      filters: queueFilters
    }),
    [parsedFiles, queueFilters, workbenchActionResults, workbenchClassificationResults, workbenchMatchResults, workbenchToleranceSimulation]
  );
  const governanceViewModel = useMemo(
    () => buildGovernanceViewModel({
      parsedFiles,
      auditEntries,
      analytics: dashboardAnalytics,
      isDev: import.meta.env.DEV,
      apiKey,
      isAnalysisRunning: Boolean(runningStep),
      runningStep,
      failedStep,
      error,
      matchResults,
      classificationResults,
      actionResults,
      pipelineRunState
    }),
    [actionResults, apiKey, auditEntries, classificationResults, dashboardAnalytics, error, failedStep, matchResults, parsedFiles, pipelineRunState, runningStep]
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
      setPipelineRunState(createIdlePipelineRunState());
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

  async function runMatchingChunks(chunks, initialRunState, startIndex = 0) {
    let runState = initialRunState;
    setRunningStep("matching");

    for (let index = startIndex; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const started = markPipelineChunkStarted(runState, { stage: "matching", chunkIndex: index, chunkMeta });
      runState = started.runState;
      setPipelineRunState(runState);
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
          stage: "matching",
          apiKey,
          onRetry: ({ attempt }) => setStatusMessage(`Rate limited during matching chunk ${chunkMeta.index}/${chunkMeta.total}. Retry ${attempt + 1} of 3...`)
        });
        const alignedResponse = validateAndAlignResults("matching", context.invoices, response.data, chunkMeta.invoice_range);
        const guarded = applyGlobalMatchingGuards(context, alignedResponse);
        const aligned = validateAndAlignResults("matching", context.invoices, guarded, chunkMeta.invoice_range);
        assertNoApiKeyLeak(aligned);
        const auditChunk = auditChunkForAttempt(
          chunkMeta,
          started.attempt,
          started.attempt > 1 ? "retry_success" : "initial_success"
        );
        runState = markPipelineChunkSucceeded(runState, {
          stage: "matching",
          chunkIndex: index,
          chunkMeta: auditChunk,
          output: aligned,
          attempt: started.attempt
        });
        setPipelineRunState(runState);
        await recordAuditEntry({
          step: "matching",
          model: MODELS.matching,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "01_matching_v1",
          chunk: auditChunk
        });
      } catch (chunkError) {
        const failedRunState = markPipelineChunkFailed(runState, {
          stage: "matching",
          chunkIndex: index,
          chunkMeta,
          error: chunkError,
          attempt: started.attempt
        });
        const descriptor = failedRunState.retryDescriptor;
        const auditChunk = auditChunkForAttempt(chunkMeta, started.attempt, descriptor.retryStatus, descriptor);
        setPipelineRunState(failedRunState);
        setFailedStep("matching");
        await recordAuditEntry({
          step: "matching",
          model: MODELS.matching,
          input: `matching:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "01_matching_v1",
          chunk: auditChunk,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(descriptor.userMessage);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(
      parsedFiles.invoices,
      mergeMatchingChunks(getPipelineStageOutputs(runState, "matching")),
      "matching"
    );
    assertNoApiKeyLeak(merged);
    runState = markPipelineStageMerged(runState, { stage: "matching", merged });
    setPipelineRunState(runState);
    setMatchResults(merged);
    return runState;
  }

  async function runClassificationChunks(chunks, initialRunState, startIndex = 0) {
    let runState = initialRunState;
    setRunningStep("classification");
    const matchingChunks = getPipelineStageOutputs(runState, "matching");

    for (let index = startIndex; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const started = markPipelineChunkStarted(runState, { stage: "classification", chunkIndex: index, chunkMeta });
      runState = started.runState;
      setPipelineRunState(runState);
      const context = buildChunkContext(parsedFiles, chunk, parsedFiles.invoices);
      const startedAt = performance.now();

      setStatusMessage(`Classification chunk ${chunkMeta.index}/${chunkMeta.total} (invoices ${chunkMeta.invoice_range})...`);

      try {
        if (!matchingChunks[index]) {
          throw new Error(`Missing required input data for classification chunk ${chunkMeta.index}/${chunkMeta.total}`);
        }
        const userMessage = JSON.stringify({ results: matchingChunks[index].results });
        const response = await callClaudeAPI({
          systemPrompt: classificationPrompt,
          userMessage,
          model: MODELS.classification,
          schema: classificationOutputSchema,
          maxTokens: STAGE_MAX_TOKENS.classification,
          stage: "classification",
          apiKey,
          onRetry: ({ attempt }) => setStatusMessage(`Rate limited during classification chunk ${chunkMeta.index}/${chunkMeta.total}. Retry ${attempt + 1} of 3...`)
        });
        const aligned = validateAndAlignResults("classification", context.invoices, response.data, chunkMeta.invoice_range);
        assertNoApiKeyLeak(aligned);
        const auditChunk = auditChunkForAttempt(
          chunkMeta,
          started.attempt,
          started.attempt > 1 ? "retry_success" : "initial_success"
        );
        runState = markPipelineChunkSucceeded(runState, {
          stage: "classification",
          chunkIndex: index,
          chunkMeta: auditChunk,
          output: aligned,
          attempt: started.attempt
        });
        setPipelineRunState(runState);
        await recordAuditEntry({
          step: "classification",
          model: MODELS.classification,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "02_classification_v1",
          chunk: auditChunk
        });
      } catch (chunkError) {
        const failedRunState = markPipelineChunkFailed(runState, {
          stage: "classification",
          chunkIndex: index,
          chunkMeta,
          error: chunkError,
          attempt: started.attempt
        });
        const descriptor = failedRunState.retryDescriptor;
        const auditChunk = auditChunkForAttempt(chunkMeta, started.attempt, descriptor.retryStatus, descriptor);
        setPipelineRunState(failedRunState);
        setFailedStep("classification");
        await recordAuditEntry({
          step: "classification",
          model: MODELS.classification,
          input: `classification:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "02_classification_v1",
          chunk: auditChunk,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(descriptor.userMessage);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(
      parsedFiles.invoices,
      mergeClassificationChunks(getPipelineStageOutputs(runState, "classification")),
      "classification"
    );
    assertNoApiKeyLeak(merged);
    runState = markPipelineStageMerged(runState, { stage: "classification", merged });
    setPipelineRunState(runState);
    setClassificationResults(merged);
    return runState;
  }

  async function runActionGenerationChunks(chunks, initialRunState, startIndex = 0) {
    let runState = initialRunState;
    setRunningStep("action_generation");
    const matchingChunks = getPipelineStageOutputs(runState, "matching");
    const classificationChunks = getPipelineStageOutputs(runState, "classification");

    for (let index = startIndex; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const chunkMeta = createChunkMeta(chunk, index, chunks.length);
      const started = markPipelineChunkStarted(runState, { stage: "action_generation", chunkIndex: index, chunkMeta });
      runState = started.runState;
      setPipelineRunState(runState);
      const context = buildChunkContext(parsedFiles, chunk, parsedFiles.invoices);
      const startedAt = performance.now();

      setStatusMessage(`Drafting chunk ${chunkMeta.index}/${chunkMeta.total} (invoices ${chunkMeta.invoice_range})...`);

      try {
        if (!matchingChunks[index] || !classificationChunks[index]) {
          throw new Error(`Missing required input data for draft generation chunk ${chunkMeta.index}/${chunkMeta.total}`);
        }
        const userMessage = JSON.stringify({
          batch: buildActionBatch(context, matchingChunks[index], classificationChunks[index])
        });
        const response = await callClaudeAPI({
          systemPrompt: actionPrompt,
          userMessage,
          model: MODELS.action_generation,
          schema: actionOutputSchema,
          maxTokens: STAGE_MAX_TOKENS.action_generation,
          stage: "action_generation",
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
        const auditChunk = auditChunkForAttempt(
          chunkMeta,
          started.attempt,
          started.attempt > 1 ? "retry_success" : "initial_success"
        );
        runState = markPipelineChunkSucceeded(runState, {
          stage: "action_generation",
          chunkIndex: index,
          chunkMeta: auditChunk,
          output: aligned,
          attempt: started.attempt
        });
        setPipelineRunState(runState);
        await recordAuditEntry({
          step: "action_generation",
          model: MODELS.action_generation,
          input: userMessage,
          output: aligned,
          response,
          promptVersion: "03_action_generation_v1",
          chunk: auditChunk
        });
      } catch (chunkError) {
        const failedRunState = markPipelineChunkFailed(runState, {
          stage: "action_generation",
          chunkIndex: index,
          chunkMeta,
          error: chunkError,
          attempt: started.attempt
        });
        const descriptor = failedRunState.retryDescriptor;
        const auditChunk = auditChunkForAttempt(chunkMeta, started.attempt, descriptor.retryStatus, descriptor);
        setPipelineRunState(failedRunState);
        setFailedStep("action_generation");
        await recordAuditEntry({
          step: "action_generation",
          model: MODELS.action_generation,
          input: `action_generation:${chunkMeta.invoice_range}:${chunkMeta.invoice_count}`,
          output: null,
          promptVersion: "03_action_generation_v1",
          chunk: auditChunk,
          status: "failed",
          errorMessage: chunkError.message,
          latencyMs: Math.round(performance.now() - startedAt)
        });
        throw new Error(descriptor.userMessage);
      }

      if (index < chunks.length - 1) await waitForChunkWindow();
    }

    const merged = validateMergedResults(
      parsedFiles.invoices,
      mergeActionChunks(getPipelineStageOutputs(runState, "action_generation")),
      "action_generation"
    );
    assertNoApiKeyLeak(merged);
    runState = markPipelineStageMerged(runState, { stage: "action_generation", merged });
    setPipelineRunState(runState);
    setActionResults(merged);
    return runState;
  }

  async function continuePipelineFrom({ chunks, initialRunState, startStage, startIndex }) {
    let runState = initialRunState;

    if (startStage === "matching") {
      runState = await runMatchingChunks(chunks, runState, startIndex);
      startStage = "classification";
      startIndex = 0;
    }

    if (startStage === "classification") {
      runState = await runClassificationChunks(chunks, runState, startIndex);
      startStage = "action_generation";
      startIndex = 0;
    }

    if (startStage === "action_generation") {
      runState = await runActionGenerationChunks(chunks, runState, startIndex);
    }

    runState = markPipelineComplete(runState);
    setPipelineRunState(runState);
    return runState;
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
    let runState = createPipelineRunState({
      runId: `run-${Date.now()}`,
      totalChunks: chunks.length
    });

    setMatchResults(null);
    setClassificationResults(null);
    setActionResults(null);
    setAuditEntries([]);
    setPipelineRunState(runState);
    setApprovedActions(new Set());
    setTier3Notes({});
    setReviewedTier3(new Set());
    setActiveWorkspace("start");
    setStatusMessage(`Preparing ${parsedFiles.invoices.length} invoices across ${chunks.length} chunks of up to ${ANALYSIS_CHUNK_SIZE}.`);

    try {
      activeStep = "matching";
      runState = await continuePipelineFrom({
        chunks,
        initialRunState: runState,
        startStage: "matching",
        startIndex: 0
      });
      setStatusMessage("Prompt chain complete. Review drafted communications.");
      setActiveWorkspace("executive");
    } catch (pipelineError) {
      setFailedStep((current) => current || activeStep);
      setError(pipelineError.message);
    } finally {
      setRunningStep("");
    }
  }

  async function retryFailedChunk() {
    const descriptor = pipelineRunState.retryDescriptor;
    if (!parsedFiles || !descriptor?.retryable || runningStep) return;

    const chunks = chunkInvoices(parsedFiles.invoices, ANALYSIS_CHUNK_SIZE);
    let runState = markPipelineRetryStarted(pipelineRunState, descriptor);
    setPipelineRunState(runState);
    setError("");
    setFailedStep("");
    setActiveWorkspace("start");
    setStatusMessage(`Retrying ${formatStageName(descriptor.stage)} chunk ${descriptor.chunkIndex}/${descriptor.totalChunks} (invoices ${descriptor.invoiceRange})...`);

    try {
      runState = await continuePipelineFrom({
        chunks,
        initialRunState: runState,
        startStage: descriptor.stage,
        startIndex: descriptor.chunkIndex - 1
      });
      setStatusMessage("Prompt chain complete after retry. Review drafted communications.");
      setActiveWorkspace("executive");
    } catch (retryError) {
      setFailedStep((current) => current || descriptor.stage);
      setError(retryError.message);
    } finally {
      setRunningStep("");
    }
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
    <main className={`${isDarkMode ? "dark" : ""} pg-shell px-4 py-5 sm:px-6 lg:px-8`}>
      <section className="pg-container">
        <header className="pg-topbar">
          <div>
            <h1 className="pg-app-title">ProcureGuard AI</h1>
            <p className="pg-app-subtitle">AP Exception Control Tower</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              className="pg-button pg-button-secondary"
              type="button"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDarkMode}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? "Light mode" : "Dark mode"}
            </button>
            <button
              className="pg-button pg-button-primary"
              type="button"
              disabled={!parsedFiles || Boolean(runningStep)}
              onClick={runPipeline}
            >
              {runningStep ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </header>

        <Alert message={uploadError} />
        <Alert message={error} />
        <WorkspaceTabs
          activeWorkspace={activeWorkspace}
          onChange={setActiveWorkspace}
          dashboardReady={finalResultsComplete}
          reviewCount={workbenchViewModel.rows.length}
          auditEntryCount={auditEntries.length}
        />

        {activeWorkspace === "start" ? (
          <section className="pg-page-stack">
            <ApiKeyPanel apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
            <UploadPanel parsedFiles={parsedFiles} onFilesSelected={handleFilesSelected} isBusy={Boolean(runningStep)} />
            <ProgressPanel
              runningStep={runningStep}
              statusMessage={statusMessage}
              hasMatchResults={Boolean(matchResults)}
              hasClassificationResults={Boolean(classificationResults)}
              hasActionResults={Boolean(actionResults)}
            />
            <PipelineRunStatusPanel
              runState={pipelineRunState}
              isRunning={Boolean(runningStep)}
              onRetry={retryFailedChunk}
              onRestart={runPipeline}
            />
          </section>
        ) : null}

        {activeWorkspace === "executive" && isIncompleteRun(pipelineRunState) ? (
          <section className="pg-page-stack">
            <PartialAnalysisNotice
              runState={pipelineRunState}
              onRetry={retryFailedChunk}
              onStart={() => setActiveWorkspace("start")}
            />
            <WorkbenchEmptyState
              eyebrow="Executive Summary withheld"
              title="Final batch summary is available only after all stages complete"
              body="This run has retained partial chunks, but Executive Summary metrics, estimated recovery, and completed-batch wording stay hidden until matching, classification, draft generation, and merge validation all pass."
              actionLabel="Go to Start"
              onAction={() => setActiveWorkspace("start")}
              tone="review"
            />
          </section>
        ) : activeWorkspace === "executive" ? (
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
            hasAnalysisFailure={Boolean(error && failedStep) || isIncompleteRun(pipelineRunState)}
            partialRunState={isIncompleteRun(pipelineRunState) ? pipelineRunState : null}
            onRetryPartial={retryFailedChunk}
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
            viewModel={supplierPolicyViewModel}
            isAnalysisRunning={Boolean(runningStep)}
            hasAnalysisFailure={Boolean(error && failedStep) || isIncompleteRun(pipelineRunState)}
            onStart={() => setActiveWorkspace("start")}
            tolerances={tolerances}
            onTolerancesChange={setTolerances}
            toleranceSimulation={toleranceSimulation}
          />
        ) : null}

        {activeWorkspace === "governance" ? (
          <GovernancePanel
            viewModel={governanceViewModel}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            onExport={exportAuditTrail}
            onStart={() => setActiveWorkspace("start")}
          />
        ) : null}
      </section>
    </main>
  );
}
