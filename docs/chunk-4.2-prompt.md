# Claude Code Prompt: Production Rework Chunk 4.2 — Executive Summary Rebuild (The Storytelling Surface)

## Role

You are the senior product designer + front-end engineer pair from a company shipping at the Linear / Vercel / Anthropic Console / OpenAI Platform bar. You read every screen as narrative writing: who is the reader, what is the story, what should they do next. Your visual references for this rebuild are two HTML mockups the product owner shipped (a monochrome zinc V3 and an OKLCH-warm V2) plus Lovable.dev product surfaces, Stripe Sigma reports, and Adobe Spectrum's restraint principles. You apply Anthropic's prompting principles: clear scope, explicit constraints, exact code, named references, verification commands, anti-patterns.

## Context

You are working on ProcureGuard AI. Read `CLAUDE.md` for project context. Stage 6 production rework UI chunks 2.1 through 2.5 are complete. Chunk 3.1 (pipeline latency) and Chunk 4.1 (design system replacement) must be merged before this chunk runs.

This chunk **rebuilds the entire Executive Summary surface** to follow the V3+V2 hybrid mockup. The same view models, the same analytics, the same audit trail — rendered through a new component tree that tells the story top-to-bottom for a non-AP reader (recruiter, hiring manager, AP director seeing the demo).

Read these files end-to-end before changing anything:
- `app/ProcureGuardDashboard.jsx` (the entire current Executive Summary surface)
- `app/lib/uiModels.js` lines 320–490 (`getExecutiveHeroMetrics`, `buildExecutiveSummaryViewModel`)
- `app/lib/uiModels.js` lines 700–790 (rows + `draftsPrepared` aggregation)
- `app/lib/dashboard.js` (analytics shape — `totalInvoices`, `exceptionRows`, `escalateCount`, `exposureIdentified`, `estimatedRecovery`, `exceptionBreakdown`, `dollarExposureByException`)
- `app/lib/format.js` (formatters)
- The two reference mockups (open them in a browser to see the target)

## What ships in this chunk

A complete top-to-bottom rebuild of the Executive Summary surface in this order:

```
1. HEADLINE          Eyebrow + Fraunces serif headline + 3 meta values (closed time, pipeline, wall-clock)
2. RHYTHM STRIP      25 marks, one per invoice, height + color by tier; legend with counts below
3. OUTCOME RIBBON    Bordered ribbon, 3px severity side-stripe, status dot + label, body sentence, hold action; aside with 3 stats
4. KPI TRIO          3-column grid (Batch value processed | Held from payment | Recoverable on resolution)
5. DRAFTS HERO       The killer feature. Surface-bordered with 3px ink top stripe. Headline + helper + CTA. INBOX LIST of all drafts. Summary row.
6. DRIVERS + ACTIONS Side-by-side panels (1.15fr / 0.85fr). Drivers ranked by held dollars; Actions numbered.
7. HTML CHARTS       2-up bar lists (Exception mix by count + Where the dollars are by exposure).
8. TRUST FOOTER      Single mono row: run ID, reviewed by, audit count, eval status, model routing, prompt version, latency, export link
```

The current `DecisionCard`, the duplicated `HeroMetricCard` grid, and the Recharts `ExceptionBarChart` instances on this surface are **replaced**. Recharts itself is not removed in this chunk (Chunk 4.4 handles the dependency removal); the Recharts components on the dashboard surface are no longer rendered after this chunk, so the import is dead-but-present until 4.4.

## Critical constraints

- Do NOT change Claude API integration, schemas, prompt files, or pipeline state machine
- Do NOT change the 5-tab IA — Start | Executive Summary | Exception Workbench | Supplier & Policy Analytics | Audit & Governance
- Do NOT add new dependencies
- Do NOT remove Recharts from `package.json` in this chunk
- Eval suite must remain at 25/25
- HITL labels preserved everywhere — every CTA reads "Open drafts in Workbench" or similar; never "Send"
- All animations honor `prefers-reduced-motion`
- Build must succeed
- Light + dark mode parity required
- Wall-clock latency from Chunk 3.1 must remain intact

## View model additions

Some surface elements need data the current view model does not expose. Add these to `app/lib/uiModels.js` and `app/lib/dashboard.js` as needed.

### 1. Per-invoice rhythm data

Add `getRhythmStripData(rows, totalInvoices)` to `uiModels.js` that returns:

```js
[
  { id: "INV-0001", tier: "clean", hint: "INV-0001 · clean match" },
  { id: "INV-0011", tier: 3,       hint: "INV-0011 · Tier 3 · quantity exceeds PO" },
  ...
]
```

Tier values: `"clean"`, `1`, `2`, `3`. Order is the original invoice order in the parsed CSV. If a row has multiple exception labels, use the highest tier among them. The `hint` becomes the mark's `title` attribute (native browser tooltip).

### 2. Outcome aside counts

Add `getOutcomeAsideCounts(analytics)` returning:

```js
{
  wontPayTonight: safeNumber(analytics.escalateCount),
  heldForReview: safeNumber(analytics.exceptionRows) - safeNumber(analytics.escalateCount),
  cleared: safeNumber(analytics.totalInvoices) - safeNumber(analytics.exceptionRows)
}
```

### 3. KPI trio data

Replace `getExecutiveHeroMetrics` with `getKpiTrio(analytics)` returning exactly 3 cards in this order:

```js
[
  {
    id: "batch-value",
    label: "Batch value processed",
    value: safeNumber(analytics.batchValue ?? analytics.totalInvoiceAmount ?? 0),
    format: "money",
    tone: "neutral",
    helper: `${formatInteger(totalInvoices)} invoices · ${formatInteger(supplierCount)} suppliers · ${formatInteger(warehouseCount)} warehouses`
  },
  {
    id: "held-from-payment",
    label: "Held from payment",
    value: safeNumber(analytics.exposureIdentified),
    format: "money",
    tone: safeNumber(analytics.exposureIdentified) > 0 ? "review" : "neutral",
    helper: `${pctOfBatch}% of batch value, blocked pending validation or escalation`
  },
  {
    id: "recoverable",
    label: "Recoverable on resolution",
    value: safeNumber(analytics.estimatedRecovery),
    format: "money",
    tone: "neutral",
    helper: "Best-case after supplier response and policy application"
  }
]
```

If `analytics.batchValue` does not exist today, add it to `dashboard.js` as the sum of `invoice.amount` (or whichever field carries invoice total) across all parsed invoices. Read `dashboard.js` to find the right field name; do not invent one.

### 4. Drafts inbox view model

Add `getDraftsInboxViewModel(rows)` returning:

```js
{
  hasDrafts: boolean,
  totalDrafts: number,
  byCategory: [
    { id: "escalation", label: "Escalation memos", count, tone: "escalate" },
    { id: "follow-up",   label: "Supplier follow-ups", count, tone: "review" },
    { id: "approval",    label: "Approval requests",    count, tone: "review" }
  ],
  rows: [
    {
      id,
      type: "Escalation" | "Follow-up" | "Approval",
      tier: 2 | 3,
      tierLabel: "T2" | "T3",
      subject: string,         // pulled from the action result; fallback: row.summary
      invoiceNumber: "INV-0005",
      supplierName: "BrightEdge Packaging",
      amount: number           // exposure amount or hold amount
    }
  ]
}
```

Type mapping by tier and route:
- Tier 3 → "Escalation"
- Tier 2 with `recommendedRoute === "supplier"` → "Follow-up"
- Tier 2 with `recommendedRoute === "procurement" || "approval"` → "Approval"
- Tier 1 → not surfaced in the inbox (drafts only matter for review-required cases)

`subject`: prefer the first action result's draft subject if present in the row; fallback to `row.summary` truncated to one sentence; final fallback to the exception label. Do not invent text.

`rows`: ordered by tier descending, then exposure descending. Cap at 20 to keep the inbox scannable; if more, the CTA button shows "Open all 24 drafts in Workbench" with the true count.

### 5. Trust footer view model

Add `getTrustFooterViewModel(runState, analytics, auditEntries)` returning:

```js
{
  runId: runState.runId ?? "—",
  reviewedBy: "session-local",  // user identity is not persisted; this is honest
  invoiceCount: analytics.totalInvoices,
  supplierCount: analytics.supplierCount,
  warehouseCount: analytics.warehouseCount,
  auditEntryCount: auditEntries.length,
  stageCount: 3,
  evalStatus: "25/25 evals passing",
  modelRouting: "Haiku 4.5 + Sonnet 4.6",
  promptVersion: "v1.0",
  latency: formatLatency(runState.totalLatencyMs)
}
```

If `runState.totalLatencyMs` is not currently tracked, add it to the run state during `runPipeline` by recording `Date.now()` at run start and end and storing the delta. Format as `"Xm Ys"` (e.g. `"3m 42s"`).

## Component additions

All new components live in `app/ProcureGuardDashboard.jsx`. Add them above the existing exports.

### `ExecutiveHeadline`

```jsx
function ExecutiveHeadline({ analytics, runMeta }) {
  const wontPay = safeNumber(analytics.escalateCount);
  const review  = safeNumber(analytics.exceptionRows) - wontPay;
  const cleared = safeNumber(analytics.totalInvoices) - safeNumber(analytics.exceptionRows);
  return (
    <header className="pg-headline-wrap">
      <div>
        <p className="pg-kicker pg-kicker-accent">Run summary · {runMeta.dateLabel}</p>
        <h1 className="pg-headline">
          <strong>{formatInteger(wontPay)} invoices held from tonight's payment cycle.</strong>{" "}
          <em>{formatInteger(review)} require supplier or procurement validation before release.</em>{" "}
          {formatInteger(cleared)} cleared without incident.
        </h1>
      </div>
      <dl className="pg-headline-meta">
        <div><dt>Closed</dt><dd>{runMeta.closedTime}</dd></div>
        <div><dt>Pipeline</dt><dd>{runMeta.pipelineSummary}</dd></div>
        <div><dt>Wall clock</dt><dd>{runMeta.latency}</dd></div>
      </dl>
    </header>
  );
}
```

### `RhythmStrip`

```jsx
function RhythmStrip({ marks, counts }) {
  return (
    <section className="pg-rhythm-wrap">
      <div className="pg-rhythm-strip" role="img" aria-label="Per-invoice severity in batch order">
        {marks.map((m) => (
          <span
            key={m.id}
            className={`pg-rhythm-mark pg-rhythm-${m.tier === "clean" ? "clean" : `tier${m.tier}`}`}
            title={m.hint}
          />
        ))}
      </div>
      <div className="pg-rhythm-legend">
        <span><i style={{ background: "var(--color-clean)" }} />Clean ({counts.clean})</span>
        <span><i style={{ background: "var(--color-ink-faint)" }} />Tier 1, expedited ({counts.tier1})</span>
        <span><i style={{ background: "var(--color-review)" }} />Tier 2, review required ({counts.tier2})</span>
        <span><i style={{ background: "var(--color-escalate)" }} />Tier 3, escalation ({counts.tier3})</span>
        <span className="pg-rhythm-range">{counts.total} invoices · {counts.firstId} through {counts.lastId}</span>
      </div>
    </section>
  );
}
```

### `OutcomeRibbon`

```jsx
function OutcomeRibbon({ outcome, body, holdAction, aside }) {
  return (
    <section className={`pg-outcome-ribbon pg-outcome-${outcome.tone}`}>
      <div className="pg-outcome-main">
        <div className="pg-outcome-status">
          <span className="pg-outcome-status-dot" />
          {outcome.label}
        </div>
        <h2 className="pg-outcome-title">{outcome.title}</h2>
        <p className="pg-outcome-body">{body}</p>
        {holdAction ? <p className="pg-outcome-action"><strong>Hold:</strong> {holdAction}</p> : null}
      </div>
      <aside className="pg-outcome-aside">
        <div><dt>Won't pay tonight</dt><dd>{aside.wontPayTonight}</dd></div>
        <div><dt>Held for review</dt><dd>{aside.heldForReview}</dd></div>
        <div><dt>Cleared</dt><dd>{aside.cleared}</dd></div>
      </aside>
    </section>
  );
}
```

The 3px side stripe color is keyed off `outcome.tone` via the `pg-outcome-${tone}` class (escalate, review, clean).

### `KpiTrio`

```jsx
function KpiTrio({ trio }) {
  return (
    <section className="pg-kpi-row">
      {trio.map((kpi) => (
        <article key={kpi.id} className="pg-kpi">
          <p className="pg-kpi-label">{kpi.label}</p>
          <p className={`pg-kpi-value ${kpi.tone === "review" ? "pg-kpi-value-review" : ""}`}>
            {formatMetricValue(kpi)}
          </p>
          <p className="pg-kpi-helper">{kpi.helper}</p>
        </article>
      ))}
    </section>
  );
}
```

### `DraftsHero` (the killer feature)

```jsx
function DraftsHero({ vm, onOpenWorkbench }) {
  if (!vm.hasDrafts) {
    return (
      <section className="pg-card">
        <p className="pg-kicker">Supplier follow-up</p>
        <h2 className="pg-section-title mt-1">No drafts needed for this batch</h2>
        <p className="pg-copy mt-2">All invoices matched cleanly. No escalation memos, supplier follow-ups, or approval requests are required.</p>
      </section>
    );
  }
  return (
    <section className="pg-drafts-hero">
      <div className="pg-drafts-hero-head">
        <div>
          <p className="pg-kicker">Supplier follow-up queue</p>
          <h2 className="pg-drafts-title">
            {formatInteger(vm.totalDrafts)} drafts are queued for your review.{" "}
            <em>None will send without your approval.</em>
          </h2>
          <p className="pg-drafts-helper">
            Each draft cites the correct invoice number, dollar amount, exception code, and resolution path.{" "}
            <strong>Estimated time saved: {vm.estimatedHoursSaved} hours</strong> of manual drafting. Every message is marked DRAFT in subject and body. This product has no send capability.
          </p>
        </div>
        <div className="pg-drafts-cta-stack">
          <button type="button" className="pg-button pg-button-primary" onClick={onOpenWorkbench}>
            Open drafts in Workbench →
          </button>
          <span className="pg-drafts-promise">Reviewed by you · sent by you</span>
        </div>
      </div>

      <div className="pg-draft-list">
        {vm.rows.map((row) => (
          <div key={row.id} className="pg-draft-row" onClick={() => onOpenWorkbench(row.invoiceNumber)} role="button" tabIndex={0}>
            <span className="pg-draft-type">{row.type}</span>
            <span className={`pg-draft-tier pg-draft-tier-${row.tier}`}>{row.tierLabel}</span>
            <span className="pg-draft-subject">{row.subject}</span>
            <span className="pg-draft-invoice mono">{row.invoiceNumber}</span>
            <span className="pg-draft-supplier">{row.supplierName}</span>
            <span className="pg-draft-amount mono">{formatMoney(row.amount)}</span>
          </div>
        ))}
      </div>

      <div className="pg-draft-summary">
        {vm.byCategory.map((c) => (
          <div key={c.id} className="pg-draft-summary-item">
            <span className="n">{formatInteger(c.count)}</span> {c.label}
          </div>
        ))}
        <div className="pg-draft-summary-item pg-draft-summary-total">
          <span className="n">{formatInteger(vm.totalDrafts)}</span> total · all marked DRAFT
        </div>
      </div>
    </section>
  );
}
```

`vm.estimatedHoursSaved` is computed as `Math.round((vm.totalDrafts * 9 / 60) * 10) / 10` (9 minutes per drafted communication, rounded to 0.1 hours). Add to the view model.

### `DriversPanel` and `ActionsPanel`

Reuse the existing `TopDrivers` and `RecommendedActions` data. Render as side-by-side panels with the new visual chrome:

```jsx
function DriversPanel({ drivers }) {
  return (
    <section className="pg-panel">
      <header className="pg-panel-head">
        <p className="pg-kicker">Largest drivers</p>
        <h2 className="pg-panel-title">What is moving exposure</h2>
        <p className="pg-panel-helper">Ranked by held dollars, then by frequency.</p>
      </header>
      <div className="pg-driver-list">
        {drivers.map((d) => (
          <article key={d.id} className="pg-driver">
            <div>
              <p className="pg-driver-code mono">{d.code} · {d.label}</p>
              <h3 className="pg-driver-name">{d.headline ?? d.meaning}</h3>
              <p className="pg-driver-meaning">{d.meaning}</p>
              {d.route ? <p className="pg-driver-route mono">{d.route}</p> : null}
            </div>
            <div className="pg-driver-stats">
              <div><dt>Rows</dt><dd>{formatInteger(d.count)}</dd></div>
              <div><dt>Held</dt><dd>{formatMoney(d.exposure)}</dd></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionsPanel({ actions }) {
  return (
    <section className="pg-panel">
      <header className="pg-panel-head">
        <p className="pg-kicker">Recommended sequence</p>
        <h2 className="pg-panel-title">What to do, in order</h2>
        <p className="pg-panel-helper">Owners and deadlines reflect this batch only.</p>
      </header>
      <ol className="pg-action-list">
        {actions.map((a, i) => (
          <li key={a.id} className="pg-action-item">
            <span className="pg-action-num mono">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="pg-action-text">{a.label}</p>
              {a.owner ? <p className="pg-action-owner mono">{a.owner}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

If `driver.headline` or `driver.route` are not currently in the view model, add them — pull from the exception catalog or compose from the supplier name and routing target.

### `HtmlBarChart`

Replace `ExceptionBarChart` calls on this surface with HTML bars:

```jsx
function HtmlBarChart({ data, valueFormatter, takeaway }) {
  const max = Math.max(...data.map((d) => safeNumber(d.value)), 1);
  return (
    <div>
      {takeaway ? <p className="pg-chart-takeaway">{takeaway}</p> : null}
      <div className="pg-bar-list">
        {data.map((d) => (
          <div key={d.code} className="pg-bar-row">
            <span className="pg-bar-code mono">{d.code}</span>
            <div className="pg-bar-track">
              <div
                className={`pg-bar-fill pg-bar-tier${d.tier}`}
                style={{ width: `${(safeNumber(d.value) / max) * 100}%` }}
              />
            </div>
            <span className="pg-bar-value mono">{valueFormatter(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `TrustFooter`

```jsx
function TrustFooter({ vm, onExport }) {
  return (
    <footer className="pg-trust-footer">
      <span className="pg-trust-id mono">{vm.runId}</span>
      <span className="pg-trust-meta mono">
        {vm.invoiceCount} invoices · {vm.supplierCount} suppliers · {vm.warehouseCount} warehouses · {" "}
        {vm.auditEntryCount} audit entries across {vm.stageCount} stages · {vm.evalStatus} · {vm.modelRouting} · prompt {vm.promptVersion} · {vm.latency}
      </span>
      <button type="button" className="pg-trust-export" onClick={onExport}>Export audit CSV ↓</button>
    </footer>
  );
}
```

## CSS additions

Append to `app/styles.css`. All new classes are prefixed `pg-`. Use the design tokens from Chunk 4.1.

```css
/* Headline */
.pg-headline-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3rem;
  align-items: end;
  padding-block: 2rem 2.5rem;
  border-bottom: 1px solid var(--color-rule);
}
.pg-kicker-accent { color: var(--color-accent); }
.pg-headline {
  font-family: var(--font-display);
  font-optical-sizing: auto;
  font-weight: 500;
  font-size: clamp(1.85rem, 3.4vw, 3rem);
  line-height: 1.08;
  letter-spacing: -0.026em;
  color: var(--color-ink);
  margin: 0.7rem 0 0;
  max-width: 32ch;
  text-wrap: balance;
}
.pg-headline strong { font-weight: 600; }
.pg-headline em {
  font-style: italic;
  font-weight: 400;
  color: var(--color-ink-soft);
}
.pg-headline-meta {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 1.75rem;
  text-align: right;
  margin: 0;
}
.pg-headline-meta dt {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.pg-headline-meta dd {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-ink);
  margin: 0.25rem 0 0;
}

/* Rhythm strip */
.pg-rhythm-wrap { padding-block: 1.5rem; border-bottom: 1px solid var(--color-rule); }
.pg-rhythm-strip {
  display: grid;
  grid-template-columns: repeat(var(--rhythm-count, 25), 1fr);
  gap: 3px;
  align-items: end;
  height: 38px;
  margin-bottom: 0.65rem;
}
.pg-rhythm-mark {
  border-radius: 1.5px;
  transition: opacity 200ms, transform 200ms;
}
.pg-rhythm-mark:hover { transform: translateY(-2px); opacity: 0.85; }
.pg-rhythm-clean { background: var(--color-clean); height: 28%; opacity: 0.55; }
.pg-rhythm-tier1 { background: var(--color-ink-faint); height: 50%; }
.pg-rhythm-tier2 { background: var(--color-review); height: 75%; }
.pg-rhythm-tier3 { background: var(--color-escalate); height: 100%; }
.pg-rhythm-legend {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  letter-spacing: 0.04em;
  flex-wrap: wrap;
}
.pg-rhythm-legend i {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 1.5px;
  margin-right: 0.4rem;
  vertical-align: middle;
}
.pg-rhythm-range { margin-left: auto; }

/* Outcome ribbon */
.pg-outcome-ribbon {
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) minmax(0, 1fr);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  overflow: hidden;
  margin-block: 2.5rem 0;
}
.pg-outcome-main {
  position: relative;
  padding: 1.85rem 2.15rem;
  border-right: 1px solid var(--color-rule);
}
.pg-outcome-main::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--color-ink-faint);
}
.pg-outcome-escalate .pg-outcome-main::before { background: var(--color-escalate); }
.pg-outcome-review   .pg-outcome-main::before { background: var(--color-review); }
.pg-outcome-clean    .pg-outcome-main::before { background: var(--color-clean); }
.pg-outcome-status {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-escalate);
}
.pg-outcome-review   .pg-outcome-status { color: var(--color-review); }
.pg-outcome-clean    .pg-outcome-status { color: var(--color-clean); }
.pg-outcome-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.pg-outcome-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.4rem;
  line-height: 1.25;
  letter-spacing: -0.018em;
  color: var(--color-ink);
  margin: 0.55rem 0 0.45rem;
  max-width: 50ch;
}
.pg-outcome-body {
  font-size: 0.92rem;
  color: var(--color-ink-soft);
  line-height: 1.55;
  margin: 0 0 0.95rem;
  max-width: 60ch;
}
.pg-outcome-action {
  font-size: 0.86rem;
  color: var(--color-ink);
}
.pg-outcome-action strong {
  font-weight: 500;
  color: var(--color-ink-muted);
  margin-right: 0.4rem;
}
.pg-outcome-aside {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0;
  padding: 1.85rem 2rem;
  background: var(--color-bg-soft);
}
.pg-outcome-aside > div {
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 0.85rem;
  margin-bottom: 0.85rem;
}
.pg-outcome-aside > div:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.pg-outcome-aside dt {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-ink-muted);
  margin-bottom: 0.3rem;
}
.pg-outcome-aside dd {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.5rem;
  color: var(--color-ink);
  letter-spacing: -0.022em;
  font-feature-settings: "tnum" 1, "lnum" 1;
  margin: 0;
}

/* KPI trio */
.pg-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--color-rule);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-top: 2rem;
}
.pg-kpi {
  background: var(--color-surface);
  padding: 1.55rem 1.85rem 1.7rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  transition: background-color 160ms ease;
}
.pg-kpi:hover { background: var(--color-surface-2); }
.pg-kpi-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-ink-muted);
}
.pg-kpi-value {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 2.45rem;
  line-height: 1;
  letter-spacing: -0.028em;
  color: var(--color-ink);
  margin-top: 0.65rem;
  font-feature-settings: "tnum" 1, "lnum" 1;
}
.pg-kpi-value-review { color: var(--color-review); }
.pg-kpi-helper {
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  line-height: 1.45;
  max-width: 32ch;
  margin-top: 0.6rem;
}

/* Drafts hero */
.pg-drafts-hero {
  position: relative;
  margin-top: 3rem;
  padding: 2.4rem 2.4rem 2.2rem;
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-xl);
}
.pg-drafts-hero::before {
  content: "";
  position: absolute;
  top: -1px; left: -1px; right: -1px;
  height: 3px;
  background: var(--color-ink);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}
.pg-drafts-hero-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: end;
  padding-bottom: 1.85rem;
  border-bottom: 1px solid var(--color-rule);
}
.pg-drafts-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.85rem;
  line-height: 1.12;
  letter-spacing: -0.024em;
  color: var(--color-ink);
  margin: 0.55rem 0 0.5rem;
  max-width: 26ch;
  text-wrap: balance;
}
.pg-drafts-title em {
  font-style: italic;
  font-weight: 400;
  color: var(--color-ink-soft);
}
.pg-drafts-helper {
  font-size: 0.95rem;
  color: var(--color-ink-soft);
  line-height: 1.55;
  margin: 0;
  max-width: 64ch;
}
.pg-drafts-helper strong { color: var(--color-ink); font-weight: 500; }
.pg-drafts-cta-stack { display: flex; flex-direction: column; align-items: flex-end; gap: 0.55rem; }
.pg-drafts-promise {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Draft inbox list */
.pg-draft-list {
  margin-top: 1.75rem;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-soft);
}
.pg-draft-row {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.35rem;
  border-bottom: 1px solid var(--color-rule-soft);
  font-size: 0.84rem;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.pg-draft-row:last-child { border-bottom: none; }
.pg-draft-row:hover { background: var(--color-surface); }
.pg-draft-row:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
.pg-draft-type {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-ink-muted);
  padding: 0.18rem 0.5rem;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}
.pg-draft-tier {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.pg-draft-tier::before { content: ""; width: 5px; height: 5px; border-radius: 50%; }
.pg-draft-tier-3 { color: var(--color-escalate); }
.pg-draft-tier-3::before { background: var(--color-escalate); }
.pg-draft-tier-2 { color: var(--color-review); }
.pg-draft-tier-2::before { background: var(--color-review); }
.pg-draft-subject {
  font-weight: 500;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pg-draft-invoice { font-size: 0.78rem; color: var(--color-ink-muted); white-space: nowrap; }
.pg-draft-supplier {
  font-size: 0.82rem;
  color: var(--color-ink-soft);
  white-space: nowrap;
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pg-draft-amount {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-ink);
  text-align: right;
  white-space: nowrap;
}

/* Draft summary row */
.pg-draft-summary {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-rule);
  align-items: baseline;
  flex-wrap: wrap;
}
.pg-draft-summary-item {
  display: flex; align-items: baseline; gap: 0.45rem;
  font-size: 0.82rem;
  color: var(--color-ink-soft);
}
.pg-draft-summary-item .n {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.35rem;
  color: var(--color-ink);
  letter-spacing: -0.018em;
  font-feature-settings: "tnum" 1;
}
.pg-draft-summary-total { margin-left: auto; }

/* Drivers + actions split */
.pg-split-row {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1rem;
  margin-top: 2rem;
}
.pg-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-xl);
  padding: 1.85rem 2.1rem;
}
.pg-panel-head h2,
.pg-panel-title {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.3rem;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  margin: 0.4rem 0 0;
}
.pg-panel-helper {
  font-size: 0.84rem;
  color: var(--color-ink-soft);
  margin: 0.4rem 0 0;
  max-width: 56ch;
}
.pg-driver-list { margin-top: 1.5rem; }
.pg-driver {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem;
  align-items: start;
  padding: 1.15rem 0;
  border-bottom: 1px solid var(--color-rule-soft);
}
.pg-driver:first-child { padding-top: 0; }
.pg-driver:last-child { border-bottom: none; padding-bottom: 0; }
.pg-driver-code {
  font-size: 0.74rem;
  font-weight: 500;
  color: var(--color-ink-muted);
  letter-spacing: 0.06em;
  margin: 0 0 0.3rem;
}
.pg-driver-name {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.05rem;
  letter-spacing: -0.014em;
  color: var(--color-ink);
  margin: 0 0 0.35rem;
}
.pg-driver-meaning {
  font-size: 0.84rem;
  color: var(--color-ink-soft);
  line-height: 1.55;
  margin: 0;
  max-width: 58ch;
}
.pg-driver-route {
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  margin-top: 0.5rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.pg-driver-stats {
  display: flex; gap: 1.5rem;
  text-align: right;
  white-space: nowrap;
}
.pg-driver-stats dt {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink-muted);
  margin-bottom: 0.25rem;
}
.pg-driver-stats dd {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.08rem;
  color: var(--color-ink);
  font-feature-settings: "tnum" 1;
  letter-spacing: -0.012em;
  margin: 0;
}

.pg-action-list {
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
}
.pg-action-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1.1rem;
  padding: 1.05rem 0;
  border-bottom: 1px solid var(--color-rule-soft);
}
.pg-action-item:first-child { padding-top: 0; }
.pg-action-item:last-child { border-bottom: none; padding-bottom: 0; }
.pg-action-num {
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  margin-top: 0.2rem;
  letter-spacing: 0.04em;
  font-weight: 500;
}
.pg-action-text {
  font-size: 0.92rem;
  color: var(--color-ink);
  line-height: 1.5;
  margin: 0;
}
.pg-action-owner {
  font-size: 0.7rem;
  color: var(--color-ink-muted);
  margin: 0.4rem 0 0;
  letter-spacing: 0.04em;
}

/* HTML chart */
.pg-chart-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}
.pg-chart-takeaway {
  font-size: 0.84rem;
  color: var(--color-ink-soft);
  margin: 0.5rem 0 1.5rem;
  max-width: 50ch;
}
.pg-bar-list { display: flex; flex-direction: column; gap: 0.7rem; }
.pg-bar-row {
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.95rem;
  font-size: 0.82rem;
}
.pg-bar-code { font-size: 0.74rem; font-weight: 500; color: var(--color-ink-muted); }
.pg-bar-track {
  height: 6px;
  background: var(--color-bg-soft);
  border-radius: 1.5px;
  overflow: hidden;
}
.pg-bar-fill {
  height: 100%;
  border-radius: 1.5px;
  transition: width 700ms cubic-bezier(0.32, 0.72, 0, 1);
  background: var(--color-ink-faint);
}
.pg-bar-tier1 { background: var(--color-ink-faint); }
.pg-bar-tier2 { background: var(--color-review); }
.pg-bar-tier3 { background: var(--color-escalate); }
.pg-bar-value {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--color-ink);
  font-size: 0.78rem;
  min-width: 4rem;
  text-align: right;
}

/* Trust footer */
.pg-trust-footer {
  margin-top: 3.5rem;
  padding: 1.5rem 1.85rem;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-lg);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-ink-soft);
}
.pg-trust-id { font-weight: 500; color: var(--color-ink); letter-spacing: 0.04em; }
.pg-trust-meta { letter-spacing: 0.04em; }
.pg-trust-meta strong { color: var(--color-ink); font-weight: 500; }
.pg-trust-export {
  font-size: 0.78rem;
  color: var(--color-accent);
  background: transparent;
  border: none;
  cursor: pointer;
  letter-spacing: 0.02em;
  padding: 0;
}
.pg-trust-export:hover { text-decoration: underline; }

/* Responsive */
@media (max-width: 1100px) {
  .pg-headline-wrap, .pg-outcome-ribbon, .pg-split-row, .pg-chart-row { grid-template-columns: minmax(0, 1fr); }
  .pg-outcome-main { border-right: none; border-bottom: 1px solid var(--color-rule); }
  .pg-headline-meta { text-align: left; }
  .pg-kpi-row { grid-template-columns: minmax(0, 1fr); }
  .pg-draft-row { grid-template-columns: auto auto minmax(0, 1fr) auto; }
  .pg-draft-supplier, .pg-draft-invoice { display: none; }
}
@media (max-width: 720px) {
  .pg-headline-wrap, .pg-drafts-hero-head { grid-template-columns: minmax(0, 1fr); }
  .pg-driver { grid-template-columns: minmax(0, 1fr); }
  .pg-driver-stats { justify-content: flex-start; }
  .pg-trust-footer { grid-template-columns: minmax(0, 1fr); gap: 0.85rem; }
  .pg-drafts-cta-stack { align-items: flex-start; margin-top: 1rem; }
}
```

## Wiring in `app/ProcureGuard.jsx`

The Executive Summary tab currently renders `<ProcureGuardDashboard ... />` inside a `<section className="pg-page-stack pg-tab-content">`. After this chunk, the dashboard component returns the new component tree. The shell wrapping does not change.

Add the click-through to Workbench from drafts:

1. Add state in `ProcureGuard.jsx`: `const [workbenchPreset, setWorkbenchPreset] = useState(null);`
2. Pass `onOpenDrafts={(invoiceNumber) => { setWorkbenchPreset({ filter: "drafts-only", focus: invoiceNumber ?? null }); setActiveWorkspace("workbench"); }}` to `<ProcureGuardDashboard>`
3. In the Workbench surface, if `workbenchPreset?.filter === "drafts-only"` on mount, default the existing draft filter chip to active. Reuse the existing Workbench filter system; do not add a new one. If `workbenchPreset.focus` is set, scroll the matching invoice card into view via `scrollIntoView({ behavior: "smooth", block: "center" })` with a fallback if reduced motion is set
4. Pass `onExportAudit` from existing audit export handler down to `TrustFooter`

## Verification checklist

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed (existing Recharts warning still acceptable; Recharts is unused on Exec Summary but still imported)
3. `git diff --stat` — confirm no changes to `app/lib/pipeline.js`, `app/lib/claude.js`, `app/lib/schemas.js`, `api/`, `prompts/`, `data/`, `evals/`, `package.json`. Allowed changes: `app/lib/uiModels.js`, `app/lib/dashboard.js`, `app/ProcureGuardDashboard.jsx`, `app/ProcureGuard.jsx` (workbench preset wiring only), `app/styles.css`
4. Visual check (light + dark, 1280px and full-screen 1680px):
   - Headline reads as a sentence in Fraunces serif with strong + italic emphasis
   - Rhythm strip shows 25 marks at correct heights and colors; hover shows native tooltip
   - Outcome ribbon renders with 3px severity stripe on the left edge of the main column, status dot + label, body sentence, hold action; aside panel shows 3 stats with serif numerals
   - KPI trio: 3 columns at full width, single column under 1100px; "Held from payment" value renders in review tone
   - Drafts hero: top 3px ink stripe; headline with italic "None will send without your approval"; inbox list shows all drafts as one row each; row hover lifts to surface; click routes to Workbench with the matching invoice in view
   - Drivers panel left, Actions panel right, side by side
   - Charts are HTML bars with thin 6px tracks, no Recharts canvas on this surface
   - Trust footer is a single mono row with run ID, audit metadata, export button
5. HITL audit: `grep -rn "Send" app | grep -v "Sender\|Sending\|sendgrid\|//\|/\\*"` — no new Send buttons
6. Reduced motion: rhythm strip hover lift suppressed; bar fill width transition suppressed
7. Keyboard: Tab through draft inbox rows; Enter opens Workbench at that row
8. Eval guard: confirm `analytics.batchValue` (or whatever field name was added in `dashboard.js`) does not break `validateAndAlignResults` or any downstream consumer
9. Commit with message: `feat(ui): chunk 4.2 executive summary rebuild — headline, rhythm strip, outcome ribbon, drafts inbox, html charts, trust footer`

## Documentation

### `docs/HANDOFF.md`

Append a Chunk 4.2 section. Document: every new component, the view-model additions (`getRhythmStripData`, `getOutcomeAsideCounts`, `getKpiTrio`, `getDraftsInboxViewModel`, `getTrustFooterViewModel`), the workbench preset wiring, the analytics field added (`batchValue`), the deferred Recharts removal in 4.4.

### `progress.md`

```
Production Rework Chunk 4.2 Executive Summary rebuild completed.
Next: Chunk 4.3 cross-surface consistency
```

## Skills referenced

- **frontend-design**: V3 + V2 hybrid. Editorial serif headlines for human reading, mono for data and identifiers, sans for body, severity-only color, 3px outcome stripe. References: Linear inbox, Vercel dashboard, Anthropic Console, Stripe Sigma, Lovable.dev product surfaces, Adobe Spectrum restraint, Fraunces type specimens.
- **design:design-critique**: Internal critique pass before commit. The test: a non-AP reader (recruiter, hiring manager) understands within 10 seconds what this product does and why the drafts matter. If not, rewrite the headline and the Drafts hero copy.
- **design:ux-copy**: All copy passes a clarity test — short, specific, no jargon, no marketing voice. "Reviewed by you · sent by you" stays as the Drafts hero promise. "DRAFT only. Human review required." stays prominent in the helper.
- **impeccable**: No card-on-card chrome. No accent color outside the one accent + three severity tiers. No animations longer than 700ms. No decorative duplication.
- **dashboard-style-test**: Reviewed for reference. The data-strip rhythm and the trust-row-as-evidence pattern were adapted; the warm-dark default palette was not used because Chunk 4.1 set the OKLCH-warm-light system.
- **verification-before-completion**: Eval pass, build pass, visual check in both modes, HITL grep, reduced-motion, keyboard nav, analytics field guard.
- **handoff-summary**: Write complete handoff section.

## Anti-patterns

- Do not introduce a sixth tab for "Drafts" — the Drafts hero on Executive Summary plus the existing Workbench filter is enough
- Do not show full draft body text in the inbox list — keep subject only; route to Workbench for full review
- Do not fabricate or paraphrase draft content; if subject text is not in the row view model, plumb it through, don't invent
- Do not add a Send button anywhere, even disabled, even labeled as "Approve & Queue" if it sends — Approve & Queue is the existing pattern in the Workbench, not the Executive Summary
- Do not bring back the duplicated 4-card or 5-card hero metric strip
- Do not animate draft inbox rows individually with stagger — the existing `pg-tab-content` fade is enough
- Do not change the Workbench tab structure in this chunk; only add the preset filter activation path
- Do not remove Recharts in this chunk — it stays imported but unused on Executive Summary
- Do not introduce a second accent color — there is one accent (ink-blue) plus three severity tiers; everything else is ink-scale
- Do not use any pure white surface on the dashboard — use `var(--color-surface)` (which IS white in light mode but darker in dark mode); avoid hardcoded `#ffffff`
