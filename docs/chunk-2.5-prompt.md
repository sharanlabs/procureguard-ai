# Claude Code Prompt: Production Rework Chunk 2.5 — Brand Identity, Navigation, Chart, and Table Polish

## Role

You are a senior frontend engineer who has shipped dashboards at Linear, Vercel, and Stripe. You apply Anthropic's design quality bar: quiet, deliberate, dense without being noisy, premium without being decorative. Your work is held to the standard of the Anthropic Console, the Linear product app, the Vercel dashboard, and the OpenAI Platform.

## Context

You are working on ProcureGuard AI, a React procurement exception dashboard. Read `CLAUDE.md` for full project context. Stage 6 Production Rework chunks 2.1, 2.1R, 2.2, 2.3, and 2.4 are complete:

- 2.1 / 2.1R established the typography foundation (Inter, design tokens, tabular numerics)
- 2.2 added the lucide-react icon system
- 2.3 fixed correctness and accessibility (badge gap, dark mode parity, aria-hidden, prefers-reduced-motion, color-scheme meta, transition-colors)
- 2.4 added entry animations, skeleton loading, card hover elevation, tab crossfade, upload zone, topbar bottom border

This chunk closes the remaining gaps between the current product and an industry-standard premium dashboard. Six surgical changes. CSS and JSX only. Zero new dependencies.

## Critical constraints

- Do NOT change any business logic, pipeline behavior, Claude API integration, view models, or audit trail
- Do NOT add new dependencies
- Do NOT touch `app/lib/`, `api/`, `prompts/`, `data/`, `evals/`, or `package.json`
- The eval suite must remain at 25/25
- All animations must already honor `prefers-reduced-motion` via the global media query from Chunk 2.3
- Preserve HITL labels: no Send buttons, only Approve & Queue
- Preserve the five-surface IA: Start, Executive Summary, Exception Workbench, Supplier & Policy Analytics, Audit & Governance

## What good looks like (reference standards)

- **Linear** — sticky branded header with subtle backdrop blur; tabs use a bottom-border underline that slides; muted iconography
- **Vercel dashboard** — clean tables with right-aligned numerics, header treatment that recedes, row hover at very low opacity
- **Anthropic Console** — restrained color, tier-mapped severity badges, tooltips show a colored dot before the metric
- **Stripe** — minimal chart treatment, gradient fills on bars are subtle (5–15% alpha), axis ticks are muted
- **OpenAI Platform** — empty states pair a muted icon glyph with one short title and one short helper sentence

Match the restraint of these references. If a change feels decorative, cut it.

---

## Change 1: Sticky branded topbar with mark

The current `<header className="pg-topbar ...">` (around line 3020 in `app/ProcureGuard.jsx`) is a plain row with text wordmark and two buttons. Make it the visual anchor of the product.

### CSS (add to `app/styles.css` near the existing `.pg-topbar` block)

```css
.pg-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(248, 250, 252, 0.82);
  backdrop-filter: saturate(140%) blur(10px);
  -webkit-backdrop-filter: saturate(140%) blur(10px);
  margin-inline: -1rem;
  padding-inline: 1rem;
  padding-block: 0.875rem;
}

.dark .pg-topbar {
  background: rgba(2, 6, 23, 0.78);
}

@media (min-width: 640px) {
  .pg-topbar {
    margin-inline: -1.5rem;
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .pg-topbar {
    margin-inline: -2rem;
    padding-inline: 2rem;
  }
}

.pg-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
}

.pg-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.875rem;
  height: 1.875rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.dark .pg-brand-mark {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.pg-version-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.6875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.dark .pg-version-pill {
  background: #1e293b;
  color: #cbd5e1;
}
```

### JSX (replace the topbar block in `app/ProcureGuard.jsx`)

The new topbar groups the mark + wordmark + version on the left, keeps the existing dark mode toggle and Analyze button on the right. The Shield icon from lucide-react is already imported in Chunk 2.2. If it is not, add it to the existing lucide-react import line.

Existing block (around line 3020):
```jsx
<header className="pg-topbar border-b border-slate-200/80 dark:border-slate-700/60">
  <div>
    <h1 className="pg-app-title">ProcureGuard AI</h1>
    <p className="pg-app-subtitle">AP Exception Control Tower</p>
  </div>
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    {/* dark mode + Analyze buttons */}
  </div>
</header>
```

Replace with:
```jsx
<header className="pg-topbar border-b border-slate-200/80 dark:border-slate-700/60">
  <div className="pg-brand">
    <span className="pg-brand-mark" aria-hidden="true">
      <Shield className="h-4 w-4" strokeWidth={2.25} />
    </span>
    <div>
      <div className="flex items-center gap-2">
        <h1 className="pg-app-title">ProcureGuard AI</h1>
        <span className="pg-version-pill">v1.0</span>
      </div>
      <p className="pg-app-subtitle">AP Exception Control Tower</p>
    </div>
  </div>
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    {/* keep existing dark mode toggle and Analyze button as-is */}
  </div>
</header>
```

The wordmark size token (`--text-hero`) is 2rem. After this change, reduce it inline only here so the topbar sits tighter: change the `pg-app-title` rule in `styles.css` from `font-size: var(--text-hero);` to `font-size: 1.25rem;` and leave `--text-hero` alone (the token is still used elsewhere).

---

## Change 2: Tab underline indicator (replace heavy fill)

The current `.pg-tab-active` uses a solid `#0f172a` background fill. This reads as a button group, not as navigation. Replace with a clean underline indicator.

### CSS — replace these existing blocks in `app/styles.css`

Find:
```css
.pg-tab {
  border-radius: 0.875rem;
  padding: 0.75rem;
  font-size: var(--text-base);
  line-height: 1.35;
  text-align: left;
  color: #475569;
}

.pg-tab:hover {
  background: #f8fafc;
  color: #0f172a;
}

.pg-tab-active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.pg-tab-active .pg-tab-helper {
  color: rgba(255, 255, 255, 0.78);
}

.dark .pg-tab {
  color: #cbd5e1;
}

.dark .pg-tab:hover {
  background: #1e293b;
  color: #f8fafc;
}

.dark .pg-tab-active {
  background: #f8fafc;
  color: #020617;
}

.dark .pg-tab-active .pg-tab-helper {
  color: rgba(2, 6, 23, 0.66);
}
```

Replace with:
```css
.pg-tab {
  position: relative;
  border-radius: 0.625rem;
  padding: 0.625rem 0.875rem;
  font-size: var(--text-base);
  line-height: 1.35;
  text-align: left;
  color: #64748b;
  transition: color 160ms ease, background-color 160ms ease;
}

.pg-tab:hover {
  background: rgba(15, 23, 42, 0.04);
  color: #0f172a;
}

.pg-tab-active {
  color: #0f172a;
  background: rgba(15, 23, 42, 0.04);
}

.pg-tab-active::after {
  content: "";
  position: absolute;
  left: 0.875rem;
  right: 0.875rem;
  bottom: -0.625rem;
  height: 2px;
  border-radius: 2px;
  background: #2563eb;
}

.dark .pg-tab {
  color: #94a3b8;
}

.dark .pg-tab:hover {
  background: rgba(248, 250, 252, 0.04);
  color: #f8fafc;
}

.dark .pg-tab-active {
  color: #f8fafc;
  background: rgba(248, 250, 252, 0.04);
}

.dark .pg-tab-active::after {
  background: #60a5fa;
}
```

Also adjust the tab list container to allow the underline to be visible: in the same file, find `.pg-tabs-list` and change `gap: 0.5rem;` to `gap: 0.25rem;`. Then update the parent `WorkspaceTabs` `<nav>` wrapper class in `app/ProcureGuard.jsx` from `className="pg-card p-2"` to `className="pg-card p-2 pb-3 overflow-visible"` so the underline is not clipped by `overflow-x: auto` on `.pg-tabs`. If the underline is still clipped by the `pg-tabs` overflow, set the underline `bottom: 0` and reduce `padding-bottom` on `.pg-tab` instead. Verify visually that the underline shows under the active tab.

---

## Change 3: Chart polish (Recharts)

The dashboard charts (`ExceptionBarChart` in `app/ProcureGuardDashboard.jsx`) currently use flat color fills and a basic tooltip. Add gradient fills, refine the tooltip header with a severity dot, and quiet the axis treatment.

### Tooltip refinement (`ChartTooltip` in `app/ProcureGuardDashboard.jsx`, around line 137)

Replace the current `ChartTooltip` body with:
```jsx
function ChartTooltip({ active, payload, label, valueFormatter = formatInteger }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload ?? {};
  const dotColor = row.tier ? exceptionColor(row.tier) : "#64748b";

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/95">
      {label ? (
        <div className="mb-1.5 flex items-center gap-2">
          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
          <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        </div>
      ) : null}
      {row.name && row.name !== label ? (
        <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">{row.name}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300" key={`${item.dataKey}-${item.name}`}>
            <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
            <span className="font-mono font-semibold tabular-nums text-slate-950 dark:text-slate-100">{valueFormatter(item.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
```

### Bar gradient fills (`ExceptionBarChart` around line 344)

The current bar uses `<Cell fill={exceptionColor(entry.tier)} />`. Wrap the BarChart with a `<defs>` block that creates one linear gradient per tier, and switch the Cell `fill` to reference the gradient by id. The keyframe is the bar entry — Recharts handles this with `isAnimationActive`.

Replace the `<BarChart>` block with:
```jsx
<BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 72, bottom: 8, left: 8 }}>
  <defs>
    <linearGradient id="pg-bar-tier1" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stopColor={exceptionColor(1)} stopOpacity={0.55} />
      <stop offset="100%" stopColor={exceptionColor(1)} stopOpacity={1} />
    </linearGradient>
    <linearGradient id="pg-bar-tier2" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stopColor={exceptionColor(2)} stopOpacity={0.55} />
      <stop offset="100%" stopColor={exceptionColor(2)} stopOpacity={1} />
    </linearGradient>
    <linearGradient id="pg-bar-tier3" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stopColor={exceptionColor(3)} stopOpacity={0.55} />
      <stop offset="100%" stopColor={exceptionColor(3)} stopOpacity={1} />
    </linearGradient>
  </defs>
  <CartesianGrid stroke={gridColor(isDarkMode)} horizontal={false} />
  <XAxis ... /> {/* keep existing */}
  <YAxis ... /> {/* keep existing */}
  <Tooltip cursor={{ fill: isDarkMode ? "rgba(148, 163, 184, 0.08)" : "rgba(15, 23, 42, 0.04)" }} content={<ChartTooltip valueFormatter={valueFormatter} />} />
  <Bar dataKey={dataKey} name={valueName} radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={600}>
    {chartData.map((entry) => (
      <Cell fill={`url(#pg-bar-tier${entry.tier})`} key={entry.code} />
    ))}
    <LabelList dataKey={dataKey} position="right" fill={axisColor(isDarkMode)} formatter={valueFormatter} />
  </Bar>
</BarChart>
```

Note: keep the existing `<XAxis>` and `<YAxis>` props as they are. Only the `<defs>`, `<Tooltip cursor>`, `<Bar isAnimationActive animationDuration>`, and `<Cell fill>` change. The `prefers-reduced-motion` global media query does not affect Recharts SVG animations, so also gate the animation via existing `isDarkMode`-style detection: detect the user preference once with `window.matchMedia("(prefers-reduced-motion: reduce)").matches` at the top of `ExceptionBarChart` and pass `isAnimationActive={!prefersReducedMotion}` to the `<Bar>`. Keep this lightweight, no useEffect needed.

---

## Change 4: Table system + consolidation

There are 4 tables across `ProcureGuard.jsx` (lines 1300, 1869, 1950) and `ProcureGuardDashboard.jsx` (lines 486, 529) that all duplicate the same Tailwind classes for header, body, and divider. Extract to CSS so future tables are consistent.

### CSS (add to `app/styles.css` near the existing `.pg-table-wrap` block)

```css
.pg-table-wrap table {
  width: 100%;
}

.pg-table-wrap thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafc;
}

.dark .pg-table-wrap thead {
  background: #0f172a;
}

.pg-table-wrap th {
  padding: 0.625rem 0.875rem;
  font-size: var(--text-xs);
  line-height: 1.35;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.dark .pg-table-wrap th {
  color: #94a3b8;
  border-bottom-color: #1e293b;
}

.pg-table-wrap tbody tr {
  transition: background-color 120ms ease;
}

.pg-table-wrap tbody tr:hover {
  background: rgba(15, 23, 42, 0.025);
}

.dark .pg-table-wrap tbody tr:hover {
  background: rgba(248, 250, 252, 0.025);
}

.pg-table-wrap tbody td {
  padding: 0.75rem 0.875rem;
  font-size: var(--text-sm);
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
}

.pg-table-wrap tbody tr:last-child td {
  border-bottom: none;
}

.dark .pg-table-wrap tbody td {
  color: #f1f5f9;
  border-bottom-color: #1e293b;
}

.pg-table-num {
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
}

.pg-table-num-header {
  text-align: right;
}
```

### JSX changes (`app/ProcureGuard.jsx` and `app/ProcureGuardDashboard.jsx`)

For each of the 5 table sites:
1. Remove the duplicated `<thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">` and `<tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">` classes — leave bare `<thead>` and `<tbody>`. The new CSS handles them.
2. For numeric columns (any `<td>` showing a count, percent, dollar amount, or date), add `className="pg-table-num"`. The matching `<th>` gets `className="pg-table-num-header"`.
3. Remove any inline `text-right`, `font-mono`, or `tabular-nums` classes on those cells; the new CSS owns them.

Important: do not remove text alignment classes from non-numeric columns. Leave those alone.

---

## Change 5: EmptyState glyph

The `EmptyState` component in `app/ProcureGuardDashboard.jsx` (around line 127) is text-only. Add an optional muted icon glyph that anchors the panel visually.

### JSX

Replace the `EmptyState` component definition with:
```jsx
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
    </section>
  );
}
```

### Where to add icons

Search `app/ProcureGuard.jsx` and `app/ProcureGuardDashboard.jsx` for every `<EmptyState` usage. Add a context-appropriate lucide icon to each. Suggested mapping:
- Awaiting analysis / Run analysis prompts → `BarChart3`
- No exceptions / clean state → `CheckCircle2`
- No supplier data → `Building2` (add to lucide imports)
- No audit entries → `FileText` (add to lucide imports)
- API status / governance empties → `Shield`

Add `Building2` and `FileText` to the existing lucide-react import in `app/ProcureGuard.jsx` if not already present. Verify they export from lucide-react before committing — both are standard exports as of lucide-react 0.x.

If you cannot confidently map an EmptyState to an icon from context, leave that one without an icon. Do not force it.

---

## Change 6: Button system extension

Add ghost and small variants to the button system. Several inline-styled buttons across the workbench can then migrate to the system.

### CSS (add to `app/styles.css` near the existing `.pg-button-primary` block)

```css
.pg-button-ghost {
  background: transparent;
  color: #475569;
  border: 1px solid transparent;
}

.pg-button-ghost:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.05);
  color: #0f172a;
}

.dark .pg-button-ghost {
  color: #cbd5e1;
}

.dark .pg-button-ghost:hover:not(:disabled) {
  background: rgba(248, 250, 252, 0.06);
  color: #f8fafc;
}

.pg-button-sm {
  min-height: 2rem;
  padding: 0.375rem 0.75rem;
  font-size: var(--text-sm);
  border-radius: 0.5rem;
}

.pg-button:not(:disabled):active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .pg-button:not(:disabled):active {
    transform: none;
  }
}
```

### JSX

This is additive only. Do not migrate existing inline-styled buttons in this chunk — that is a separate refactor and risks regressions. The new ghost and sm classes are ready for future use.

---

## Verification checklist

After all changes, run in order:

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed (the existing Recharts large-chunk warning is acceptable)
3. `git diff --stat` — confirm no changes to `app/lib/`, `api/`, `prompts/`, `data/`, `evals/`, `package.json`, `package-lock.json`
4. `grep -n '"latest"' package.json || true` — should return nothing
5. `grep -rn "console.log" app api || true` — should return nothing
6. `grep -rn "Send" app | grep -v "Sender\|Sending\|sendgrid\|//\|/\\*" || true` — confirm no Send buttons
7. Visual checks (light + dark mode):
   - Topbar stays pinned at top when scrolling, with visible backdrop blur
   - Brand mark (gradient square with Shield) renders left of "ProcureGuard AI"
   - Version pill `v1.0` sits next to wordmark
   - Active tab shows underline, not heavy fill
   - Hover over a chart bar: tooltip appears with severity-colored dot before label
   - Bars have subtle gradient (lighter on left, fuller on right)
   - Tables: header is uppercase muted, rows hover at very low opacity, numeric columns are right-aligned and tabular
   - At least one EmptyState shows a muted icon glyph above the eyebrow
   - Reduced motion (devtools): chart bar animation suppressed, button press translate suppressed
8. Commit with: `feat(ui): chunk 2.5 brand identity, navigation, chart, and table polish`

---

## Documentation

After verification:

### `docs/HANDOFF.md`

Append a Chunk 2.5 section in the same format as Chunks 2.3 and 2.4. Cover all 6 changes, files modified, CSS additions, lucide imports added (Building2, FileText), tables migrated to the system, and verification results.

### `progress.md`

Update the "Next" line to:
```
Production Rework Chunk 2.5 Brand identity, navigation, chart, and table polish completed.
Next: Live end-to-end Claude API verification, then Stage 6.2 documentation package, then Vercel deploy
```

---

## Skills referenced

- **impeccable**: Restraint over decoration. No 30%+ alpha drop shadows. No animations longer than 600ms on data UI. No pure white or pure black on tinted surfaces. Hover states subtle, not dramatic. Severity color tokens stay consistent across charts, badges, and table cells.
- **web-design-guidelines**: All animations honor `prefers-reduced-motion`. Sticky elements use `backdrop-filter` with vendor prefix. Tab focus ring stays visible. Touch targets remain at minimum 36×36 (current `pg-button` is 40px). Color contrast preserved on tab underline and brand mark.
- **frontend-design**: Reference Linear, Vercel, Stripe, Anthropic Console, and OpenAI Platform for sticky-shell pattern, tab underline pattern, chart gradient pattern, and table treatment. Match restraint, do not copy ornament.
- **verification-before-completion**: Run evals and build before claiming done. Visual verification in both light and dark mode required. Confirm no business-logic files changed.
- **handoff-summary**: Write complete handoff section for Chunk 2.5 in the established format.

---

## Anti-patterns (do not do these)

- Do not add a backdrop-blur if the browser does not support it (already handled by graceful fallback to solid background)
- Do not animate the tab underline with `transform`-based slide; the `::after` pseudo-element jump is intentional and reads cleaner
- Do not migrate existing inline-styled buttons to the new ghost/sm classes in this chunk (defer to a future chunk to avoid regression risk)
- Do not change the `--text-hero` token; only override `pg-app-title` font-size locally
- Do not introduce a useEffect for the prefers-reduced-motion check in `ExceptionBarChart` — `window.matchMedia(...).matches` at render time is sufficient
- Do not add toast/snackbar UI in this chunk
- Do not refactor the `[class*="bg-green"]` severity selectors to data attributes in this chunk
- Do not touch `app/lib/`, `api/`, `prompts/`, `data/`, `evals/`, `package.json`
