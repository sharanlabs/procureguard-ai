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
import { formatDuration, formatModelName, formatMoney } from "./lib/format.js";
import { buildExecutiveSummaryViewModel } from "./lib/uiModels.js";

const CHART_COLORS = {
  clean: "#22c55e",
  insight: "#3b82f6",
  review: "#f59e0b",
  escalate: "#ef4444",
  indigo: "#6366f1",
  slate: "#64748b"
};

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
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

function axisColor(isDarkMode) {
  return isDarkMode ? "#cbd5e1" : "#475569";
}

function gridColor(isDarkMode) {
  return isDarkMode ? "#334155" : "#e2e8f0";
}

function exceptionColor(tier) {
  if (tier === 3) return CHART_COLORS.escalate;
  if (tier === 2) return CHART_COLORS.review;
  if (tier === 1) return CHART_COLORS.insight;
  return CHART_COLORS.slate;
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

function heatCellClass(count) {
  if (count >= 3) return "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200";
  if (count === 2) return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200";
  if (count === 1) return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200";
  return "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500";
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

function EmptyState({ eyebrow = "No data", title, body, tone = "neutral" }) {
  return (
    <section className={`pg-empty-panel ${toneClasses(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 opacity-80">{body}</p>
    </section>
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
        Decision view for AP leaders, with exception exposure, routing pressure, and deterministic next actions.
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
        body="The Start page is running the prompt-chain workflow. This page avoids showing incomplete or stale summary data while analysis is in flight."
        tone="info"
      />
    );
  }

  return (
    <EmptyState
      eyebrow="Awaiting analysis"
      title="Run analysis from Start to build the decision summary"
      body="Upload purchase orders, invoices, and goods receipts, then run Analyze. Completed results will populate the outcome, exposure, top drivers, and recommended next actions here."
      tone="neutral"
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
        <Badge className={`bg-white/70 ${subtleToneClasses(outcome.tone)}`}>{outcome.label}</Badge>
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
    <article className={`pg-card-compact ${toneClasses(metric.tone)}`}>
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

function RankedExceptionList({ data, valueKey, valueFormatter }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {data.map((item) => (
        <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" key={`${item.code}-${valueKey}`}>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.code}: {item.name}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatInteger(item.count)} exception rows</p>
          </div>
          <p className="font-mono text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-100">
            {valueFormatter(item[valueKey] ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ExceptionBarChart({ data, dataKey, valueName, valueFormatter, isDarkMode }) {
  const chartData = data.map((item) => ({
    ...item,
    label: item.code
  }));
  const tick = { fill: axisColor(isDarkMode), fontSize: 12 };

  return (
    <div className="h-56">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 8 }}>
          <CartesianGrid stroke={gridColor(isDarkMode)} horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={valueFormatter} tick={tick} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={44} tick={tick} />
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Bar dataKey={dataKey} name={valueName} radius={[0, 6, 6, 0]} isAnimationActive={false}>
            {chartData.map((entry) => (
              <Cell fill={exceptionColor(entry.tier)} key={entry.code} />
            ))}
            <LabelList dataKey={dataKey} position="right" fill={axisColor(isDarkMode)} formatter={valueFormatter} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExecutiveChartPanel({ title, takeaway, children }) {
  return (
    <article className="pg-card">
      <h3 className="text-base font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{takeaway}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function ExecutiveCharts({ viewModel, isDarkMode }) {
  const exceptionData = viewModel.chartData.exceptionBreakdown;
  const exposureData = viewModel.chartData.exposureByException;

  if (!exceptionData.length && !exposureData.length) {
    return (
      <EmptyState
        eyebrow="Exception pattern snapshot"
        title="No exception charts needed for this batch"
        body="The batch has no exception rows or exposure concentration to visualize."
        tone="clean"
      />
    );
  }

  const topFrequency = viewModel.chartContext.topFrequencyDriver;
  const topExposure = viewModel.chartContext.topExposureDriver;
  const frequencyTakeaway = topFrequency
    ? `${topFrequency.code} is the most frequent exception type with ${formatInteger(topFrequency.count)} ${topFrequency.count === 1 ? "row" : "rows"}.`
    : "No frequency concentration is visible in this batch.";
  const exposureTakeaway = topExposure
    ? `${topExposure.code} is the largest exposure driver at ${formatMoney(topExposure.exposure)}.`
    : "No exposure concentration is visible in this batch.";

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {exceptionData.length ? (
        <ExecutiveChartPanel title="Exception mix" takeaway={frequencyTakeaway}>
          {exceptionData.length >= 2 ? (
            <ExceptionBarChart
              data={exceptionData}
              dataKey="count"
              valueName="Rows"
              valueFormatter={formatInteger}
              isDarkMode={isDarkMode}
            />
          ) : (
            <RankedExceptionList data={exceptionData} valueKey="count" valueFormatter={formatInteger} />
          )}
        </ExecutiveChartPanel>
      ) : null}

      {exposureData.length ? (
        <ExecutiveChartPanel title="Exposure concentration" takeaway={exposureTakeaway}>
          {exposureData.length >= 2 ? (
            <ExceptionBarChart
              data={exposureData}
              dataKey="exposure"
              valueName="Exposure"
              valueFormatter={formatMoney}
              isDarkMode={isDarkMode}
            />
          ) : (
            <RankedExceptionList data={exposureData} valueKey="exposure" valueFormatter={formatMoney} />
          )}
        </ExecutiveChartPanel>
      ) : null}
    </section>
  );
}

export default function ExecutiveDashboard({ analytics, isDarkMode, isAnalysisRunning = false }) {
  const viewModel = buildExecutiveSummaryViewModel(analytics);

  if (!viewModel.hasData) {
    return <ExecutiveEmptyState isAnalysisRunning={isAnalysisRunning} />;
  }

  return (
    <section className="pg-page-stack">
      <ExecutiveHeader />
      <DecisionCard viewModel={viewModel} analytics={analytics} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {viewModel.heroMetrics.map((metric) => (
          <HeroMetricCard metric={metric} key={metric.id} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <TopDrivers drivers={viewModel.topDrivers} />
        <RecommendedActions actions={viewModel.recommendedActions} />
      </div>
      <ExecutiveCharts viewModel={viewModel} isDarkMode={isDarkMode} />
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
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2" scope="col">Supplier</th>
                  <th className="px-3 py-2 text-right" scope="col">Total Invoices</th>
                  <th className="px-3 py-2 text-right" scope="col">Clean Matches</th>
                  <th className="px-3 py-2 text-right" scope="col">Exceptions</th>
                  <th className="px-3 py-2 text-right" scope="col">Match Rate</th>
                  <th className="px-3 py-2 text-right" scope="col">Total Exposure</th>
                  <th className="px-3 py-2" scope="col">Diversity Certification</th>
                  <th className="px-3 py-2" scope="col">Risk</th>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">AI workflow observability</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Session cost and model trace</h2>
          <p className="mt-1 text-sm leading-6 text-indigo-900 dark:text-indigo-200">
            Governance metadata for model usage, prompt versions, token reporting, and latency.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Browser audit view
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
          Token usage will appear after API responses include usage metadata.
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
        Audit records store hashes, summaries, latency, model, prompt version, and chunk metadata. They do not store API keys,
        raw prompts, or full invoice payloads.
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
            Browser-only pattern review across {analysis.exceptionRowCount} exception rows. Patterns suggest where to
            review controls without assigning responsibility.
          </p>
        </div>
        <Badge className="border-indigo-300 bg-white text-indigo-800 dark:border-indigo-700 dark:bg-slate-900 dark:text-indigo-200">
          Browser-only pattern review
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
