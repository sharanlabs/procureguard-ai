import { formatDuration, formatModelName, formatMoney } from "./lib/format.js";
import {
  AiChecksCompleteIcon,
  AiSparkIcon,
  AuditNavIcon,
  DraftDocumentIcon,
  GoodsReceiptIcon,
  MatchScaleIcon,
  PurchaseOrderIcon,
  ReviewIcon,
  StatusCheckIcon,
  SupplierInvoiceIcon,
  SuppliersNavIcon,
  UploadStageIcon
} from "./ProcureGuardIcons.jsx";
import { buildExecutiveSummaryViewModel } from "./lib/uiModels.js";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Fingerprint,
  Loader2,
  XCircle
} from "lucide-react";

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatPercentOneDecimal(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function formatMilliseconds(value) {
  if (!value) return "-";
  return formatDuration(value);
}

function formatCost(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value);
}

function formatMetricValue(metric) {
  if (metric.format === "money") return formatMoney(metric.value);
  if (metric.format === "percent") return formatPercentOneDecimal(metric.value);
  return formatInteger(metric.value);
}

function formatDriverCount(driver) {
  return `${formatInteger(driver.count)} ${driver.count === 1 ? "row" : "rows"}`;
}

function toneClasses(tone) {
  return {
    clean: "border-green-200 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/60 dark:text-green-100",
    review: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100",
    escalate: "border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950/60 dark:text-red-100",
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-100",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-100",
    neutral: "border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
  }[tone] ?? "border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
}

function subtleToneClasses(tone) {
  return {
    clean: "border-green-200 text-green-800 dark:border-green-800 dark:text-green-200",
    review: "border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-200",
    escalate: "border-red-200 text-red-800 dark:border-red-800 dark:text-red-200",
    info: "border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-200",
    indigo: "border-indigo-200 text-indigo-800 dark:border-indigo-800 dark:text-indigo-200",
    neutral: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
  }[tone] ?? "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300";
}

function riskBadgeClass(riskLevel) {
  if (riskLevel === "High") return "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200";
  if (riskLevel === "Medium") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200";
  return "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200";
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="pg-metric-value mt-2 font-mono font-semibold text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function EmptyPreview({ tone = "neutral" }) {
  return (
    <div className={`pg-empty-preview pg-empty-preview-${tone}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function EmptyState({ eyebrow = "No data", title, body, tone = "neutral", icon: Icon }) {
  return (
    <section className={`pg-empty-panel ${toneClasses(tone)}`}>
      {Icon ? (
        <span aria-hidden="true" className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">{body}</p>
      <EmptyPreview tone={tone} />
    </section>
  );
}

function DashboardSection({ title, helper, children, action }) {
  return (
    <section className="border-t border-slate-200 pt-5 dark:border-slate-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
          {helper ? <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{helper}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ExecutiveHeader() {
  return (
    <header className="pg-page-header">
      <p className="pg-kicker">Executive Summary</p>
      <h2 className="pg-page-title">
        What happened, what is at risk, and what to do next
      </h2>
      <p className="pg-copy mt-2 max-w-3xl">
        Decision view for AP leaders, with exception exposure, routing pressure, and rule-backed next actions.
      </p>
    </header>
  );
}

function ExecutiveEmptyState({ isAnalysisRunning }) {
  if (isAnalysisRunning) {
    return (
      <EmptyState
        eyebrow="Analysis in progress"
        title="Executive Summary will appear after validation completes"
        body="The Start page is running the analysis workflow. This page avoids showing incomplete or stale summary data while analysis is in flight."
        tone="info"
        icon={Loader2}
      />
    );
  }

  return (
    <EmptyState
      eyebrow="Awaiting analysis"
      title="Run analysis from Start to build the decision summary"
      body="Upload purchase orders, invoices, and goods receipts, then run Analyze. Completed results will populate the outcome, exposure, top drivers, and recommended next actions here."
      tone="neutral"
      icon={BarChart3}
    />
  );
}

function DecisionCard({ viewModel, analytics }) {
  const outcome = viewModel.outcome;
  const stats = [
    { label: "Invoices analyzed", value: formatInteger(analytics.totalInvoices) },
    { label: "Exceptions found", value: formatInteger(analytics.exceptionRows) },
    { label: "Escalations recommended", value: formatInteger(analytics.escalateCount) },
    { label: "Exposure identified", value: formatMoney(analytics.exposureIdentified) },
    { label: "Estimated recoverable exposure", value: formatMoney(analytics.estimatedRecovery) }
  ];

  return (
    <section className={`rounded-2xl border p-6 shadow-sm ${toneClasses(outcome.tone)}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{viewModel.decision.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{outcome.label}</h3>
          <p className="mt-3 text-sm leading-6 opacity-85">{outcome.summary}</p>
          <p className="mt-4 text-sm font-semibold">
            Recommended next action: <span className="font-normal">{viewModel.decision.recommendedNextAction}</span>
          </p>
        </div>
        <Badge className={`bg-white/70 dark:bg-slate-800/70 ${subtleToneClasses(outcome.tone)}`}>{outcome.label}</Badge>
      </div>
      <dl className="mt-6 grid gap-4 border-t border-current/15 pt-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">{stat.label}</dt>
            <dd className="pg-metric-value mt-1 font-mono font-semibold">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HeroMetricCard({ metric }) {
  return (
    <article className={`pg-card-compact pg-card-interactive ${toneClasses(metric.tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{metric.label}</p>
      <p className="pg-hero-value mt-3 font-mono font-semibold tracking-tight">{formatMetricValue(metric)}</p>
      <p className="mt-2 text-sm leading-5 opacity-80">{metric.helper}</p>
    </article>
  );
}

function TopDrivers({ drivers }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Top drivers</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Largest business drivers</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Ranked by exposure, then hold amount and frequency.
        </p>
      </div>
      {drivers.length ? (
        <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-700">
          {drivers.map((driver) => (
            <article className="py-4 first:pt-0 last:pb-0" key={driver.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {driver.code}: {driver.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{driver.meaning}</p>
                </div>
                <div className="grid min-w-44 grid-cols-2 gap-3 text-right text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Count</p>
                    <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">
                      {formatDriverCount(driver)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exposure</p>
                    <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">
                      {formatMoney(driver.exposure)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
          No exception drivers detected in this batch.
        </p>
      )}
    </section>
  );
}

function RecommendedActions({ actions }) {
  return (
    <section className="pg-card">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Next actions</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Recommended review sequence</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Deterministic recommendations based on the current exception mix.
        </p>
      </div>
      <ol className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <li className="flex gap-3" key={action.id}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${subtleToneClasses(action.tone)}`}>
              {index + 1}
            </span>
            <p className="text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">{action.label}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const WORKFLOW_STEPS = [
  { id: "po", label: "PO", icon: PurchaseOrderIcon },
  { id: "receipt", label: "Receipt", icon: GoodsReceiptIcon },
  { id: "invoice", label: "Invoice", icon: SupplierInvoiceIcon },
  { id: "match", label: "AI Match", icon: MatchScaleIcon },
  { id: "review", label: "Review", icon: ReviewIcon },
  { id: "followup", label: "Follow-up", icon: DraftDocumentIcon }
];

const AUDIT_ICONS = {
  upload: UploadStageIcon,
  matching: MatchScaleIcon,
  classification: AiSparkIcon,
  action_generation: DraftDocumentIcon,
  review_surface: AuditNavIcon
};

function ExecutiveHeadline({ headline, runMeta, kpis, onOpenHeldInvoices, onOpenDrafts }) {
  const heroKpi = kpis.find((kpi) => kpi.id === "held-from-payment") ?? kpis[0];
  const supportingKpis = kpis.filter((kpi) => kpi.id !== heroKpi?.id);

  return (
    <header className="pg-command-hero">
      <div className="pg-command-hero-main">
        <div>
          <p className="pg-kicker">{headline.eyebrow}</p>
          <h1 className="pg-command-title">{headline.title}</h1>
          <p className="pg-command-subtitle">{headline.subtitle}</p>
        </div>
        {heroKpi ? (
          <div className="pg-command-primary-metric" aria-label={`${heroKpi.label}: ${formatMetricValue(heroKpi)}`}>
            <p>{heroKpi.label}</p>
            <strong className={heroKpi.tone === "review" ? "pg-command-kpi-review" : ""}>{formatMetricValue(heroKpi)}</strong>
            <span>{heroKpi.helper}</span>
          </div>
        ) : null}
        <dl className="pg-command-meta" aria-label="Run metadata">
          <div>
            <dt>Closed</dt>
            <dd>{runMeta.closedTime}</dd>
          </div>
          <div>
            <dt>Pipeline</dt>
            <dd>{runMeta.pipelineSummary}</dd>
          </div>
          <div>
            <dt>Wall clock</dt>
            <dd>{runMeta.latency}</dd>
          </div>
        </dl>
      </div>

      <div className="pg-command-hero-bottom">
        <dl className="pg-command-kpis" aria-label="Payment run metrics">
          {supportingKpis.map((kpi) => (
            <div key={kpi.id}>
              <dt>{kpi.label}</dt>
              <dd className={kpi.tone === "review" ? "pg-command-kpi-review" : ""}>{formatMetricValue(kpi)}</dd>
              <p>{kpi.helper}</p>
            </div>
          ))}
        </dl>
        <div className="pg-command-actions">
          <button className="pg-button pg-button-primary" type="button" onClick={() => onOpenHeldInvoices?.()}>
            Open held invoices
          </button>
          <button className="pg-button pg-button-secondary" type="button" onClick={() => onOpenDrafts?.()}>
            Review follow-ups
          </button>
          <span>Human approval required</span>
        </div>
      </div>
    </header>
  );
}

function AiWorkLedger({ items }) {
  return (
    <section className="pg-ai-ledger" aria-label="AI checks completed">
      <div className="pg-ai-ledger-label">
        <AiChecksCompleteIcon aria-hidden="true" className="h-5 w-5" />
        <span>AI checks completed</span>
      </div>
      <div className="pg-ai-ledger-grid">
        {items.map((item) => (
          <div className={`pg-ai-ledger-item pg-ai-ledger-${item.tone}`} key={item.id}>
            <StatusCheckIcon aria-hidden="true" className="h-4 w-4" />
            <strong>{formatInteger(item.value)}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OutcomeRibbon({ outcome, aside }) {
  return (
    <section className={`pg-release-decision pg-release-${outcome.tone}`}>
      <div className="pg-release-copy">
        <div className="pg-release-status">
          <span className="pg-release-dot" />
          {outcome.label}
        </div>
        <h2>{outcome.title}</h2>
        <p>{outcome.summary}</p>
        <p className="pg-release-control">0 autonomous payments · 0 communications released automatically</p>
      </div>
      <dl className="pg-release-stats">
        <div>
          <dt><XCircle aria-hidden="true" className="h-5 w-5" />Won't pay tonight</dt>
          <dd className="pg-release-danger">{formatInteger(aside.wontPayTonight)}</dd>
        </div>
        <div>
          <dt><AlertTriangle aria-hidden="true" className="h-5 w-5" />Held for review</dt>
          <dd className="pg-release-count-review">{formatInteger(aside.heldForReview)}</dd>
        </div>
        <div>
          <dt><CheckCircle2 aria-hidden="true" className="h-5 w-5" />Safe to release</dt>
          <dd className="pg-release-count-clean">{formatInteger(aside.cleared)}</dd>
        </div>
      </dl>
    </section>
  );
}

function WorkflowRhythm({ rhythm }) {
  return (
    <section className="pg-workflow-panel">
      <div className="pg-workflow-rail" aria-label="Payment run path">
        {WORKFLOW_STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div className={`pg-workflow-step ${step.id === "match" ? "pg-workflow-ai" : ""}`} key={step.id}>
              <span className="pg-workflow-icon">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span>{step.label}</span>
              {index < WORKFLOW_STEPS.length - 1 ? <i aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
      <div className="pg-rhythm-layout">
        <div className="pg-rhythm-axis" aria-hidden="true">
          <span>High</span>
          <span>Med</span>
          <span>Low</span>
        </div>
        <div
          className="pg-rhythm-strip"
          role="img"
          aria-label="Per-invoice severity in batch order"
          style={{ "--rhythm-count": rhythm.marks.length }}
        >
          {rhythm.marks.map((mark, index) => (
            <span
              key={`${mark.id}-${index}`}
              className={`pg-rhythm-mark pg-rhythm-${mark.tier === "clean" ? "clean" : `tier${mark.tier}`}`}
              title={mark.hint}
            />
          ))}
        </div>
        <div className="pg-rhythm-legend">
          <span><i className="pg-rhythm-legend-clean" />Clean {formatInteger(rhythm.counts.clean)}</span>
          <span><i className="pg-rhythm-legend-review" />Review {formatInteger(rhythm.counts.tier2)}</span>
          <span><i className="pg-rhythm-legend-escalate" />Escalation {formatInteger(rhythm.counts.tier3)}</span>
          <span className="pg-rhythm-range">{formatInteger(rhythm.counts.total)} invoices</span>
        </div>
      </div>
    </section>
  );
}

function EvidenceLens({ evidence }) {
  if (!evidence) return null;

  const evidenceItems = [
    { id: "po", label: "Purchase Order", value: `${evidence.purchaseOrder} units`, icon: PurchaseOrderIcon },
    { id: "receipt", label: "Goods Receipt", value: `${evidence.goodsReceipt} accepted`, icon: GoodsReceiptIcon },
    { id: "invoice", label: "Supplier Invoice", value: `${evidence.supplierInvoice} billed`, icon: SupplierInvoiceIcon }
  ];

  return (
    <section className="pg-evidence-card">
      <div className="pg-panel-heading">
        <p className="pg-kicker">Evidence Lens</p>
        <h2>{evidence.invoiceNumber}</h2>
        <p>{evidence.supplierName}</p>
      </div>
      <div className="pg-evidence-grid">
        {evidenceItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id}>
              <p>{item.label}</p>
              <Icon aria-hidden="true" className="h-5 w-5" />
              <strong>{item.value}</strong>
            </article>
          );
        })}
      </div>
      <dl className="pg-evidence-bottom">
        <div>
          <dt>Finding</dt>
          <dd>{evidence.finding}</dd>
        </div>
        <div>
          <dt>Decision</dt>
          <dd><span className={`pg-evidence-pill pg-evidence-${evidence.tone}`}>{evidence.decision}</span></dd>
        </div>
        <div>
          <dt>Human action</dt>
          <dd>{evidence.humanAction}</dd>
        </div>
      </dl>
    </section>
  );
}

function MoneyDriversPanel({ drivers }) {
  return (
    <section className="pg-material-card pg-driver-ledger-card">
      <div className="pg-panel-heading">
        <p className="pg-kicker">Why money is held</p>
        <h2>What drove the exposure</h2>
        <p>Ranked by held dollars, then by frequency.</p>
      </div>
      {drivers.length ? (
        <div className="pg-driver-ledger" role="list" aria-label="Largest exposure drivers">
          {drivers.map((driver) => (
            <article className={`pg-driver-ledger-row pg-driver-tier-${driver.tier ?? "neutral"}`} key={driver.id} role="listitem">
              <span className="pg-driver-rule" aria-hidden="true" />
              <div className="pg-driver-ledger-copy">
                <p className="pg-driver-code"><span>{driver.code}</span>{driver.tier ? `Tier ${driver.tier}` : "Exception"} · {driver.label}</p>
                <h3>{driver.meaning}</h3>
                {driver.route ? <p>{driver.route}</p> : null}
              </div>
              <dl className="pg-driver-ledger-stat">
                <div>
                  <dt>Rows</dt>
                  <dd>{formatInteger(driver.count)}</dd>
                </div>
                <div>
                  <dt>Held</dt>
                  <dd>{formatMoney(driver.exposure)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="pg-empty-inline">No exception exposure is visible in this batch.</p>
      )}
    </section>
  );
}

function DraftsHero({ vm, onOpenWorkbench }) {
  if (!vm.hasDrafts) {
    return (
      <section className="pg-drafts-hero">
        <div className="pg-panel-heading">
          <p className="pg-kicker">Prepared follow-up</p>
          <h2>No follow-up needed for this batch</h2>
          <p>All invoices matched cleanly. No escalation memos, supplier follow-ups, or approval requests are required.</p>
        </div>
      </section>
    );
  }

  function handleKeyDown(event, invoiceNumber) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenWorkbench?.(invoiceNumber);
    }
  }

  return (
    <section className="pg-drafts-hero">
      <div className="pg-drafts-head">
        <div className="pg-panel-heading">
          <p className="pg-kicker">Prepared follow-up</p>
          <h2>{formatInteger(vm.totalDrafts)} items ready for review</h2>
          <p>
            Human approval required. Estimated time saved: {vm.estimatedHoursSaved} hours.
            Nothing leaves the system automatically.
          </p>
        </div>
        <div className="pg-drafts-actions">
          <button className="pg-button pg-button-primary" type="button" onClick={() => onOpenWorkbench?.()}>
            Open in Workbench
          </button>
          <span>Reviewed by you · actioned by you</span>
        </div>
      </div>

      <div className="pg-draft-table" role="list" aria-label="Prepared follow-up queue preview">
        <div className="pg-draft-row pg-draft-row-head" aria-hidden="true">
          <span>Type</span>
          <span>Tier</span>
          <span>Invoice</span>
          <span>Subject</span>
          <span>Supplier</span>
          <span>Held</span>
        </div>
        {vm.rows.map((row) => (
          <div
            className="pg-draft-row"
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenWorkbench?.(row.invoiceNumber)}
            onKeyDown={(event) => handleKeyDown(event, row.invoiceNumber)}
          >
            <span className="pg-draft-type">{row.type}</span>
            <span className={`pg-draft-tier pg-draft-tier-${row.tier}`}>{row.tierLabel}</span>
            <span className="pg-draft-invoice">{row.invoiceNumber}</span>
            <span className="pg-draft-subject">{row.subject}</span>
            <span className="pg-draft-supplier">{row.supplierName}</span>
            <span className="pg-draft-amount">{formatMoney(row.amount)}</span>
          </div>
        ))}
      </div>

      <div className="pg-draft-summary">
        {vm.byCategory.map((category) => (
          <span key={category.id}>{formatInteger(category.count)} {category.label}</span>
        ))}
        <strong>{formatInteger(vm.totalDrafts)} total · approval required</strong>
      </div>
    </section>
  );
}

function SupplierRiskPattern({ rows }) {
  return (
    <section className="pg-material-card">
      <div className="pg-panel-heading">
        <p className="pg-kicker">Supplier Risk Pattern</p>
        <h2>Where friction concentrates</h2>
      </div>
      {rows.length ? (
        <div className="pg-supplier-risk-table" role="table" aria-label="Supplier risk pattern">
          <div className="pg-supplier-risk-head" role="row">
            <span role="columnheader" aria-label="Supplier icon" />
            <span role="columnheader">Supplier</span>
            <span role="columnheader">Exposure</span>
            <span role="columnheader">Primary pattern</span>
            <span role="columnheader">Signal</span>
          </div>
          {rows.map((row) => (
            <div key={row.key} role="row">
              <span className="pg-supplier-icon" role="cell"><SuppliersNavIcon aria-hidden="true" className="h-4 w-4" /></span>
              <strong role="cell">{row.supplierName}</strong>
              <span role="cell">{formatMoney(row.exposure)}</span>
              <span role="cell">{row.pattern}</span>
              <span className="pg-supplier-signal" role="cell">
                <i className={`pg-severity-dot pg-severity-${row.severity.toLowerCase()}`} aria-label={`${row.severity} severity`} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="pg-empty-inline">Supplier risk patterns appear after exceptions are detected.</p>
      )}
    </section>
  );
}

function AuditReplay({ steps }) {
  return (
    <section className="pg-material-card">
      <div className="pg-panel-heading">
        <p className="pg-kicker">Audit Replay</p>
        <h2>How the decision was produced</h2>
      </div>
      <ol className="pg-audit-replay" aria-label="Audit replay stages">
        {steps.map((step) => {
          const Icon = AUDIT_ICONS[step.id] ?? Fingerprint;
          return (
            <li key={step.id}>
              <span><Icon aria-hidden="true" className="h-4 w-4" /></span>
              <strong>{step.label}</strong>
              <em>{step.time}</em>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TrustFooter({ vm, onExport }) {
  return (
    <footer className="pg-trust-footer">
      <span>{vm.runId}</span>
      <span>
        {formatInteger(vm.invoiceCount)} invoices · {formatInteger(vm.supplierCount)} suppliers · {formatInteger(vm.warehouseCount)} warehouses ·{" "}
        {formatInteger(vm.auditEntryCount)} audit entries across {vm.stageCount} stages · {vm.evalStatus} · {vm.modelRouting} · prompt {vm.promptVersion} · {vm.latency}
      </span>
      <button type="button" onClick={onExport}>Export audit CSV</button>
    </footer>
  );
}

export default function ExecutiveDashboard({
  analytics,
  isDarkMode,
  isAnalysisRunning = false,
  workbenchRows = [],
  auditEntries = [],
  runState = {},
  onOpenDrafts,
  onOpenHeldInvoices,
  onExportAudit
}) {
  const viewModel = buildExecutiveSummaryViewModel(analytics, {
    rows: workbenchRows,
    auditEntries,
    runState
  });

  if (!viewModel.hasData) {
    return <ExecutiveEmptyState isAnalysisRunning={isAnalysisRunning} />;
  }

  return (
    <section className="pg-command-center">
      <ExecutiveHeadline
        headline={viewModel.headline}
        runMeta={viewModel.runMeta}
        kpis={viewModel.kpiTrio}
        onOpenHeldInvoices={onOpenHeldInvoices}
        onOpenDrafts={onOpenDrafts}
      />
      <AiWorkLedger items={viewModel.aiLedger} />
      <OutcomeRibbon outcome={viewModel.outcome} aside={viewModel.asideCounts} />
      <WorkflowRhythm rhythm={viewModel.rhythm} />
      <div className="pg-command-grid">
        <EvidenceLens evidence={viewModel.evidenceLens} />
        <MoneyDriversPanel drivers={viewModel.topDrivers} />
      </div>
      <DraftsHero vm={viewModel.draftsInbox} onOpenWorkbench={onOpenDrafts} />
      <div className="pg-command-grid pg-command-grid-bottom">
        <SupplierRiskPattern rows={viewModel.supplierRiskPattern} />
        <AuditReplay steps={viewModel.auditReplay} />
      </div>
      <TrustFooter vm={viewModel.trustFooter} onExport={onExportAudit} />
    </section>
  );
}

export function SupplierAnalyticsPanel({ analytics }) {
  if (!analytics?.hasData) {
    return (
      <EmptyState
        eyebrow="Supplier analytics"
        title="Supplier concentration appears after analysis"
        body="Run analysis to populate supplier scorecard and supplier exception concentration views."
        tone="neutral"
        icon={SuppliersNavIcon}
      />
    );
  }

  return (
    <section className="pg-page-stack">
      <DashboardSection
        title="Supplier exception concentration"
        helper="Which suppliers are connected to which exception types?"
      >
        {analytics.supplierExceptionHeatmap.length && analytics.heatmapCodes.length ? (
          <div className="pg-table-wrap">
            <table className="min-w-full text-center">
              <thead>
                <tr>
                  <th className="text-left" scope="col">Supplier</th>
                  <th className="pg-table-num-header" scope="col">Exposure</th>
                  {analytics.heatmapCodes.map((code) => (
                    <th key={code} scope="col">{code}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.supplierExceptionHeatmap.map((row) => (
                  <tr key={row.key}>
                    <td className="font-semibold text-slate-900 dark:text-slate-100">{row.supplierName}</td>
                    <td className="pg-table-num">{formatMoney(row.exposure)}</td>
                    {analytics.heatmapCodes.map((code) => {
                      const count = row.codes[code] ?? 0;
                      return (
                        <td className="px-2 py-3" key={`${row.key}-${code}`}>
                          <span className="pg-heat-cell" data-level={Math.min(count, 4)}>
                            {count > 0 ? count : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            No supplier exception concentration is visible in this batch.
          </p>
        )}
      </DashboardSection>

      <DashboardSection
        title="Supplier Scorecard"
        helper="Which suppliers show review load, match quality, diversity status, and exposure?"
      >
        {analytics.supplierScorecard.length ? (
          <div className="pg-table-wrap">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th scope="col">Supplier</th>
                  <th className="pg-table-num-header" scope="col">Total Invoices</th>
                  <th className="pg-table-num-header" scope="col">Clean Matches</th>
                  <th className="pg-table-num-header" scope="col">Exceptions</th>
                  <th className="pg-table-num-header" scope="col">Match Rate</th>
                  <th className="pg-table-num-header" scope="col">Total Exposure</th>
                  <th scope="col">Diversity Certification</th>
                  <th scope="col">Risk</th>
                </tr>
              </thead>
              <tbody>
                {analytics.supplierScorecard.map((supplier) => (
                  <tr key={supplier.key}>
                    <td className="font-semibold text-slate-900 dark:text-slate-100">{supplier.supplierName}</td>
                    <td className="pg-table-num">{supplier.invoiceCount}</td>
                    <td className="pg-table-num text-green-700 dark:text-green-300">{supplier.cleanCount}</td>
                    <td className="pg-table-num text-amber-700 dark:text-amber-300">{supplier.exceptionRows}</td>
                    <td className="pg-table-num">{formatPercentOneDecimal(supplier.matchRate)}</td>
                    <td className="pg-table-num">{formatMoney(supplier.exposure)}</td>
                    <td>{supplier.diversityCertification}</td>
                    <td>
                      <Badge className={riskBadgeClass(supplier.riskLevel)}>{supplier.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Supplier scorecard appears after analysis completes.
          </p>
        )}
      </DashboardSection>
    </section>
  );
}

export function SessionGovernancePanel({ analytics }) {
  const governance = analytics?.auditGovernance ?? {};

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">AI workflow evidence</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Cost and model trace</h2>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
            Governance metadata for model usage, prompt versions, token reporting, and latency.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Audit evidence view
        </Badge>
      </div>

      {governance.tokenDataReported ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Input tokens" value={formatInteger(governance.inputTokens)} />
          <Metric label="Output tokens" value={formatInteger(governance.outputTokens)} />
          <Metric label="Cache write tokens" value={governance.cacheUsageReported ? formatInteger(governance.cacheCreationInputTokens) : "Not available"} />
          <Metric label="Cache read tokens" value={governance.cacheUsageReported ? formatInteger(governance.cacheReadInputTokens) : "Not available"} />
          <Metric label="Estimated cache-aware cost" value={formatCost(governance.estimatedCacheAwareCost)} />
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-indigo-200 bg-white p-4 text-sm text-indigo-900 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200">
          Token usage will appear after service responses include usage metadata.
        </p>
      )}

      {governance.tokenDataReported && !governance.cacheUsageReported ? (
        <p className="mt-3 rounded-lg border border-indigo-200 bg-white p-3 text-sm text-indigo-900 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-200">
          Cache usage not available for this run.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-indigo-200 bg-white p-3 dark:border-indigo-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Audit entries</p>
          <p className="mt-1 font-mono tabular-nums text-slate-600 dark:text-slate-400">
            {formatInteger(governance.auditEntryCount)} entries | {formatMilliseconds(governance.averageLatencyMs)} avg latency
          </p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white p-3 dark:border-indigo-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Models used</p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {(governance.models ?? []).map(formatModelName).join(", ") || "Not available"}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-indigo-900/70 dark:text-indigo-200/80">
        Audit records store hashes, summaries, latency, model, prompt version, and chunk metadata. They do not store service keys,
        full prompt text, or full invoice payloads.
      </p>
    </section>
  );
}

function RootCausePatternCard({ pattern }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
            {pattern.type}
          </Badge>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-950 dark:text-slate-100">
            {pattern.description}
          </p>
        </div>
        {pattern.totalExposure > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exposure</p>
            <p className="mt-1 font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">
              {formatMoney(pattern.totalExposure)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pattern.affectedInvoices.map((invoiceNumber) => (
          <Badge className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" key={invoiceNumber}>
            {invoiceNumber}
          </Badge>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-slate-100">Suggested review: </span>
        {pattern.recommendedAction}
      </p>
    </article>
  );
}

export function RootCauseAnalysisPanel({ analysis }) {
  if (!analysis.hasData) return null;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/40">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Pattern signals</h2>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
            Batch pattern review across {analysis.exceptionRowCount} exception rows. Patterns suggest where to
            review controls without assigning responsibility.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Batch pattern review
        </Badge>
      </div>

      {analysis.patterns.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {analysis.patterns.map((pattern) => (
            <RootCausePatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-800 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-200">
          No systemic patterns detected in this batch. Exceptions appear isolated.
        </div>
      )}
    </section>
  );
}
