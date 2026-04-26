import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatMoney, formatPercent } from "./lib/format.js";

const CHART_COLORS = {
  clean: "#22c55e",
  autoApprove: "#16a34a",
  review: "#f59e0b",
  escalate: "#ef4444",
  info: "#3b82f6",
  slate: "#64748b"
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-950 dark:text-slate-100">
        {value}
      </p>
    </div>
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
  return `${formatInteger(value)} ms`;
}

function formatReviewTime(minutes) {
  if (!minutes) return "0 min";
  if (minutes < 60) return `${formatInteger(minutes)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hr`;
}

function formatLatencyTime(milliseconds) {
  if (!milliseconds) return "Captured after processing";
  if (milliseconds < 1000) return `${formatInteger(milliseconds)} ms`;
  return `${(milliseconds / 1000).toFixed(1)} sec`;
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

function tierColor(tier) {
  if (tier === 3) return CHART_COLORS.escalate;
  if (tier === 2) return CHART_COLORS.review;
  if (tier === 1) return CHART_COLORS.clean;
  return CHART_COLORS.slate;
}

function riskBadgeClass(riskLevel) {
  if (riskLevel === "High") return "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200";
  if (riskLevel === "Medium") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200";
  return "border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200";
}

function heatCellClass(count) {
  if (count >= 3) return "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200";
  if (count === 2) return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200";
  if (count === 1) return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200";
  return "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500";
}

function axisColor(isDarkMode) {
  return isDarkMode ? "#cbd5e1" : "#475569";
}

function gridColor(isDarkMode) {
  return isDarkMode ? "#334155" : "#e2e8f0";
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

function DashboardKpi({ label, value, helper, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
    clean: "border-green-200 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100",
    review: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100",
    escalate: "border-red-200 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100",
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
  }[tone];

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-5 opacity-80">{helper}</p> : null}
    </article>
  );
}

function ChartTooltip({ active, payload, label, valueFormatter = formatInteger }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload ?? {};

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950">
      {label ? <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{label}</p> : null}
      {row.name ? <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{row.name}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300" key={`${item.dataKey}-${item.name}`}>
            <span className="h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-300" />
            <span>{item.name}: </span>
            <span className="font-mono font-semibold tabular-nums">{valueFormatter(item.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveDashboard({ analytics, isDarkMode }) {
  if (!analytics.hasData) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Executive Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          AI-assisted review operations console
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Upload the three procurement CSVs and run analysis to populate batch health, exposure, supplier, warehouse,
          and audit governance views.
        </p>
      </section>
    );
  }

  const governance = analytics.auditGovernance;
  const exceptionBreakdownData = analytics.exceptionBreakdown.map((item) => ({
    ...item,
    label: item.code
  }));
  const exposureByExceptionData = analytics.dollarExposureByException.map((item) => ({
    ...item,
    label: item.code
  }));
  const tick = { fill: axisColor(isDarkMode), fontSize: 12 };
  const chartHeightClass = "min-h-[280px]";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Executive Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            AI-assisted review operations console
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Batch health, exposure, review load, and governance status for AP and procurement leaders.
          </p>
        </div>
        <Badge className="border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {formatInteger(analytics.totalInvoices)} invoices assessed
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardKpi
          label="Match Rate"
          value={formatPercentOneDecimal(analytics.matchRate)}
          helper={`${analytics.matchRateLabel} - ${formatInteger(analytics.cleanCount)} clean of ${formatInteger(analytics.totalInvoices)}`}
          tone="clean"
        />
        <DashboardKpi
          label="Exceptions Found"
          value={formatInteger(analytics.exceptionRows)}
          helper={`Tier 1: ${analytics.tierCounts.tier1} | Tier 2: ${analytics.tierCounts.tier2} | Tier 3: ${analytics.tierCounts.tier3}`}
          tone={analytics.escalateCount ? "escalate" : "review"}
        />
        <DashboardKpi
          label="Exposure Identified"
          value={formatMoney(analytics.exposureIdentified)}
          helper="Value requiring validation or policy review"
          tone="info"
        />
        <DashboardKpi
          label="Estimated Recovery"
          value={formatMoney(analytics.estimatedRecovery)}
          helper="Estimate based on identified exposure"
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Exception Breakdown"
          helper="Which exception types are most frequent?"
        >
          {exceptionBreakdownData.length ? (
            <div className={chartHeightClass}>
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={exceptionBreakdownData} layout="vertical" margin={{ top: 8, right: 36, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke={gridColor(isDarkMode)} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={tick} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={44} tick={tick} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Rows" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {exceptionBreakdownData.map((entry) => (
                      <Cell fill={tierColor(entry.tier)} key={entry.code} />
                    ))}
                    <LabelList dataKey="count" position="right" fill={axisColor(isDarkMode)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
              No exception rows detected in this batch.
            </p>
          )}
        </DashboardSection>

        <DashboardSection
          title="Dollar Exposure by Exception"
          helper="Which exception types drive dollar risk?"
        >
          {exposureByExceptionData.length ? (
            <div className={chartHeightClass}>
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={exposureByExceptionData} layout="vertical" margin={{ top: 8, right: 76, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke={gridColor(isDarkMode)} horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} tick={tick} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={44} tick={tick} />
                  <Tooltip content={<ChartTooltip valueFormatter={formatMoney} />} />
                  <Bar dataKey="exposure" name="Exposure" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                    {exposureByExceptionData.map((entry) => (
                      <Cell fill={tierColor(entry.tier)} key={entry.code} />
                    ))}
                    <LabelList dataKey="exposure" position="right" fill={axisColor(isDarkMode)} formatter={formatMoney} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
              No exception exposure identified in this batch.
            </p>
          )}
        </DashboardSection>
      </div>

      <div className="mt-6 grid gap-6">
        <DashboardSection
          title="Supplier Exception Heatmap"
          helper="Which suppliers are connected to which exception types?"
        >
          {analytics.supplierExceptionHeatmap.length && analytics.heatmapCodes.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-center text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left" scope="col">Supplier</th>
                    <th className="px-3 py-2 text-right" scope="col">Exposure</th>
                    {analytics.heatmapCodes.map((code) => (
                      <th className="px-3 py-2" key={code} scope="col">{code}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {analytics.supplierExceptionHeatmap.map((row) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={row.key}>
                      <td className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">{row.supplierName}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(row.exposure)}</td>
                      {analytics.heatmapCodes.map((code) => {
                        const count = row.codes[code] ?? 0;
                        return (
                          <td className="px-2 py-3" key={`${row.key}-${code}`}>
                            <span className={`inline-flex min-w-8 justify-center rounded-md border px-2 py-1 font-mono tabular-nums ${heatCellClass(count)}`}>
                              {count}
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
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2" scope="col">Supplier Name</th>
                    <th className="px-3 py-2 text-right" scope="col">Total Invoices</th>
                    <th className="px-3 py-2 text-right" scope="col">Clean Matches</th>
                    <th className="px-3 py-2 text-right" scope="col">Exceptions</th>
                    <th className="px-3 py-2 text-right" scope="col">Match Rate</th>
                    <th className="px-3 py-2 text-right" scope="col">Total Exposure</th>
                    <th className="px-3 py-2" scope="col">Diversity Certification</th>
                    <th className="px-3 py-2" scope="col">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {analytics.supplierScorecard.map((supplier) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={supplier.key}>
                      <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{supplier.supplierName}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{supplier.invoiceCount}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-green-700 dark:text-green-300">{supplier.cleanCount}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-700 dark:text-amber-300">{supplier.exceptionRows}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{formatPercentOneDecimal(supplier.matchRate)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{formatMoney(supplier.exposure)}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{supplier.diversityCertification}</td>
                      <td className="px-3 py-3">
                        <Badge className={riskBadgeClass(supplier.riskLevel)}>{supplier.riskLevel}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Supplier scorecard appears after AI-assisted review completes.
            </p>
          )}
        </DashboardSection>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DashboardSection
          title="ROI Estimate"
          helper="What review effort and recoverable exposure does this batch suggest?"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Manual review time" value={formatReviewTime(analytics.roiEstimate.manualReviewMinutes)} />
            <Metric label="Potential unrecovered exposure" value={formatMoney(analytics.roiEstimate.potentialUnrecoveredExposure)} />
            <Metric label="AI-assisted review time" value={formatLatencyTime(analytics.roiEstimate.totalLatencyMs)} />
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Without ProcureGuard AI</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Estimated miss rate {formatPercent(analytics.roiEstimate.baselineMissRate)} with {formatReviewTime(analytics.roiEstimate.manualReviewMinutes)} of manual review.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">With ProcureGuard AI</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Estimated miss rate {formatPercent(analytics.roiEstimate.aiAssistedMissRate)} with review time captured from audit latency.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
            ProcureGuard AI identified {formatMoney(analytics.exposureIdentified)} in discrepancies and estimates{" "}
            {formatMoney(analytics.roiEstimate.estimatedRecoveredAmount)} recoverable through AI-assisted review.
          </p>
        </DashboardSection>

        <DashboardSection
          title="Session Token Cost"
          helper="What token usage and prompt-cache estimate are visible from this session?"
          action={<Badge className="border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{analytics.patternCount} pattern signals</Badge>}
        >
          {governance.tokenDataReported ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Input tokens" value={formatInteger(governance.inputTokens)} />
              <Metric label="Output tokens" value={formatInteger(governance.outputTokens)} />
              <Metric label="Full-price estimate" value={formatCost(governance.estimatedFullPriceCost)} />
              <Metric label="Prompt-cache estimate" value={formatCost(governance.estimatedPromptCacheCost)} />
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Token usage will appear after API responses include usage metadata.
            </p>
          )}
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Audit entries</p>
              <p className="mt-1 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                {formatInteger(governance.auditEntryCount)} entries | {formatMilliseconds(governance.averageLatencyMs)} avg latency
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Models used</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{governance.models.join(", ") || "Not available"}</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Audit records store hashes, summaries, latency, model, and prompt version. They do not store API keys,
            raw prompts, or full invoice payloads.
          </p>
        </DashboardSection>
      </div>
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
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Root Cause Analysis</h2>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
            Browser-only pattern review across {analysis.exceptionRowCount} exception rows. Patterns suggest where to
            review controls and do not assign blame.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Client-side only
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
