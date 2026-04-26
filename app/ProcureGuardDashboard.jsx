import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  escalate: "#ef4444"
};
const LOCKED_TIER_THREE_CODES = new Set(["E02", "E06", "E07", "E11"]);

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

function formatMilliseconds(value) {
  if (!value) return "-";
  return `${formatInteger(value)} ms`;
}

function exceptionColor(code) {
  if (LOCKED_TIER_THREE_CODES.has(code)) return CHART_COLORS.escalate;
  return CHART_COLORS.review;
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950">
      {label ? <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{label}</p> : null}
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
  const riskDriverData = analytics.exceptionDrivers.map((item) => ({
    ...item,
    label: `${item.code}`
  }));
  const tick = { fill: axisColor(isDarkMode), fontSize: 12 };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-100 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
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
          label="Batch Health"
          value={formatPercent(analytics.healthyRate)}
          helper={`${formatInteger(analytics.healthyCount)} clean or auto-approve rows`}
          tone="clean"
        />
        <DashboardKpi
          label="Requires Human Review"
          value={formatInteger(analytics.requiresHumanReview)}
          helper={`${formatInteger(analytics.reviewCount)} review, ${formatInteger(analytics.escalateCount)} escalate`}
          tone={analytics.escalateCount ? "escalate" : "review"}
        />
        <DashboardKpi
          label="Exposure Identified"
          value={formatMoney(analytics.exposureIdentified)}
          helper="Value requiring validation or policy review"
          tone="info"
        />
        <DashboardKpi
          label="Held for Review"
          value={formatMoney(analytics.holdAmount)}
          helper="Amount withheld pending human review"
          tone="review"
        />
        <DashboardKpi
          label="Estimated Recovery"
          value={formatMoney(analytics.estimatedRecovery)}
          helper="Opportunity estimate, not booked recovery"
          tone="neutral"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.25fr]">
        <DashboardSection
          title="Batch disposition by review path"
          helper="How much of the batch can proceed, needs review, or needs escalation?"
        >
          <div className="h-32">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={analytics.dispositionData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <XAxis type="number" hide domain={[0, analytics.totalInvoices]} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="clean" name="Clean" stackId="batch" fill={CHART_COLORS.clean} radius={[6, 0, 0, 6]} isAnimationActive={false} />
                <Bar dataKey="autoApprove" name="Auto-approve" stackId="batch" fill={CHART_COLORS.autoApprove} isAnimationActive={false} />
                <Bar dataKey="review" name="Review" stackId="batch" fill={CHART_COLORS.review} isAnimationActive={false} />
                <Bar dataKey="escalate" name="Escalate" stackId="batch" fill={CHART_COLORS.escalate} radius={[0, 6, 6, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
            <p className="dark:text-slate-300"><span className="font-mono font-semibold tabular-nums text-green-700 dark:text-green-300">{analytics.cleanCount}</span> clean</p>
            <p className="dark:text-slate-300"><span className="font-mono font-semibold tabular-nums text-green-700 dark:text-green-300">{analytics.autoApproveCount}</span> auto-approve</p>
            <p className="dark:text-slate-300"><span className="font-mono font-semibold tabular-nums text-amber-700 dark:text-amber-300">{analytics.reviewCount}</span> review</p>
            <p className="dark:text-slate-300"><span className="font-mono font-semibold tabular-nums text-red-700 dark:text-red-300">{analytics.escalateCount}</span> escalate</p>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Exception types driving exposure"
          helper="Which exception classes create the most financial risk?"
        >
          {riskDriverData.length ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={riskDriverData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke={gridColor(isDarkMode)} vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={56} tick={tick} />
                    <Tooltip content={<ChartTooltip valueFormatter={formatMoney} />} />
                    <Bar dataKey="exposure" name="Exposure" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {riskDriverData.map((entry) => (
                        <Cell fill={exceptionColor(entry.code)} key={entry.code} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2" scope="col">Exception</th>
                      <th className="px-3 py-2 text-right" scope="col">Rows</th>
                      <th className="px-3 py-2 text-right" scope="col">Exposure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                    {riskDriverData.map((item) => (
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={item.code}>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.code}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.name}</p>
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums dark:text-slate-300">{item.count}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums dark:text-slate-300">{formatMoney(item.exposure)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
              No exception exposure identified in this batch.
            </p>
          )}
        </DashboardSection>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardSection
          title="Supplier scorecard"
          helper="Which suppliers show review load, held value, or recurring signals?"
        >
          {analytics.supplierScorecard.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2" scope="col">Supplier</th>
                    <th className="px-3 py-2 text-right" scope="col">Rows</th>
                    <th className="px-3 py-2 text-right" scope="col">Review</th>
                    <th className="px-3 py-2 text-right" scope="col">Escalate</th>
                    <th className="px-3 py-2 text-right" scope="col">Exposure</th>
                    <th className="px-3 py-2 text-right" scope="col">Held</th>
                    <th className="px-3 py-2" scope="col">Signals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {analytics.supplierScorecard.map((supplier) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={supplier.key}>
                      <td className="px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">{supplier.supplierName}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{supplier.invoiceCount}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-700 dark:text-amber-300">{supplier.reviewCount}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-red-700 dark:text-red-300">{supplier.escalateCount}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{formatMoney(supplier.exposure)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums dark:text-slate-300">{formatMoney(supplier.hold)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {supplier.topExceptionCodes.length ? supplier.topExceptionCodes.map((code) => (
                            <Badge className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" key={`${supplier.key}-${code}`}>
                              {code}
                            </Badge>
                          )) : <span className="text-slate-400 dark:text-slate-500">None</span>}
                        </div>
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

        <DashboardSection
          title="Warehouse exception heatmap"
          helper="Where are receiving or GRN-linked signals concentrated?"
        >
          {analytics.warehouseHeatmap.length && analytics.heatmapCodes.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-center text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left" scope="col">Warehouse</th>
                    {analytics.heatmapCodes.map((code) => (
                      <th className="px-3 py-2" key={code} scope="col">{code}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {analytics.warehouseHeatmap.map((row) => (
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800" key={row.warehouse}>
                      <td className="px-3 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">{row.warehouse}</td>
                      {analytics.heatmapCodes.map((code) => {
                        const count = row.codes[code] ?? 0;
                        return (
                          <td className="px-2 py-3" key={`${row.warehouse}-${code}`}>
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
              No warehouse-linked exception concentration is visible in this batch.
            </p>
          )}
        </DashboardSection>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardSection
          title="Exposure by review path"
          helper="How much identified exposure sits in review versus escalation?"
        >
          <div className="h-56">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={analytics.exposureByTierData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={gridColor(isDarkMode)} vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={tick} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={60} tick={tick} />
                <Tooltip content={<ChartTooltip valueFormatter={formatMoney} />} />
                <Bar dataKey="exposure" name="Exposure" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  <Cell fill={CHART_COLORS.clean} />
                  <Cell fill={CHART_COLORS.review} />
                  <Cell fill={CHART_COLORS.escalate} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Token cost and audit governance"
          helper="What did the AI-assisted review execute, and what remains auditable?"
          action={<Badge className="border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{analytics.patternCount} pattern signals</Badge>}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Audit entries" value={formatInteger(governance.auditEntryCount)} />
            <Metric label="Avg latency" value={formatMilliseconds(governance.averageLatencyMs)} />
            <Metric
              label="Token usage"
              value={governance.tokenDataReported ? formatInteger(governance.totalTokens) : "Not reported"}
            />
            <Metric label="Draft actions" value={formatInteger(analytics.draftActionCount)} />
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Models used</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{governance.models.join(", ") || "Not available"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Prompt versions</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{governance.promptVersions.join(", ") || "Not available"}</p>
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
