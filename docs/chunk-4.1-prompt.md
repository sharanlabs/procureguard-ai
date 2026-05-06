# Claude Code Prompt: Production Rework Chunk 4.1 — Design System Replacement (Foundation)

## Role

You are a senior design engineer at a top-tier product company. Your work is held to the standard of Linear, Vercel, Stripe, the Anthropic Console, the OpenAI Platform, and the Adobe Spectrum design system. You change visual tokens with surgical precision: existing class names stay where they are, but their visual output shifts to the new design language. You apply Anthropic's prompting principles: clear scope, explicit constraints, exact code, named references, anti-patterns.

## Context

You are working on ProcureGuard AI. Read `CLAUDE.md` for project context. Stage 6 production rework UI chunks 2.1 through 2.5 are complete. Chunk 3.1 (pipeline latency optimization) is independent and may or may not be merged when this runs.

This chunk replaces the **visual foundation** of the application: typography, palette, spacing, and core component tokens. **No layout changes.** No JSX restructuring. The same screens render with new ink. This is the groundwork that lets chunks 4.2 (Executive Summary rebuild) and 4.3 (cross-surface consistency) inherit the right visual language with zero re-work.

The design direction is set by two reference HTML mockups produced by the user. They establish:
- Editorial serif for display headlines (Fraunces)
- Geist sans-serif for body copy
- Geist Mono for data, codes, identifiers
- Warm-tinted near-white background (OKLCH 98.8% lightness, 0.005 chroma, 80 hue)
- Zinc neutrals for ink with a tight 5-step ink scale
- Severity tier colors as the **only** non-neutral hue in the system (clean green, review amber, escalate red, plus an ink-blue accent reserved for one specific use)
- 1680px max content width with fluid gutter
- Card chrome reduced or removed; section dividers via `border-bottom`

Read `app/styles.css` end-to-end before changing anything. Do not delete classes; rebind tokens.

## Critical constraints

- Do NOT change any JSX in `app/ProcureGuard.jsx` or `app/ProcureGuardDashboard.jsx`
- Do NOT change `app/lib/`, `api/`, `prompts/`, `data/`, `evals/`, `package.json` schema, or eval logic
- Do NOT remove or rename any existing CSS class — only change what they emit
- Do NOT change Tailwind utility classes used inline in JSX
- The eval suite must remain at 25/25
- HITL labels preserved
- Build must succeed
- Visual changes only. After this chunk, every screen should look like the new design language but every interaction, every data path, every audit entry behaves identically

## What changes

### 1. Add Fraunces, Geist, and Geist Mono via Google Fonts

Replace the current Inter `<link>` in `index.html` with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Verify Inter is no longer referenced anywhere in `index.html` or `styles.css` (search for `Inter` and remove the import line if present).

### 2. Replace the design tokens at the top of `app/styles.css`

Find the existing `:root { ... }` block and replace its body with:

```css
:root {
  /* Core background and surface tones — warm-tinted near-white */
  --color-bg:           oklch(98.8% 0.005 80);
  --color-bg-soft:      oklch(97.2% 0.005 80);
  --color-surface:      oklch(100% 0 0);
  --color-surface-2:    oklch(98.4% 0.004 80);

  /* Rules and dividers */
  --color-rule:         oklch(91.5% 0.005 80);
  --color-rule-soft:    oklch(94.5% 0.004 80);

  /* Ink scale — zinc-blue cool neutrals, used for type and chrome */
  --color-ink:          oklch(20% 0.022 270);
  --color-ink-2:        oklch(27% 0.020 270);
  --color-ink-soft:     oklch(38% 0.018 270);
  --color-ink-muted:    oklch(56% 0.014 270);
  --color-ink-faint:    oklch(72% 0.010 270);
  --color-ink-ghost:    oklch(85% 0.006 270);

  /* Severity tier colors — the only non-neutral hue, lower chroma than default Tailwind */
  --color-clean:        oklch(56% 0.13 145);
  --color-clean-soft:   oklch(96% 0.025 145);
  --color-review:       oklch(64% 0.16 70);
  --color-review-soft:  oklch(96% 0.035 70);
  --color-escalate:     oklch(54% 0.20 25);
  --color-escalate-soft:oklch(96% 0.025 25);

  /* Reserved accent — used sparingly for primary action affordance only */
  --color-accent:       oklch(42% 0.135 248);
  --color-accent-soft:  oklch(96% 0.022 248);

  /* DRAFT badge — kept neutral so it never reads as a sendable action */
  --color-draft:        oklch(38% 0.022 270);
  --color-draft-soft:   oklch(96% 0.005 270);

  /* Typography */
  --font-display:   "Fraunces", Georgia, serif;
  --font-sans:      "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body:      var(--font-sans);
  --font-mono:      "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Type scale — kept conservative; display sizes come from local rules */
  --text-xs:        0.72rem;
  --text-sm:        0.82rem;
  --text-base:      0.875rem;
  --text-lg:        1rem;
  --text-xl:        1.15rem;
  --text-2xl:       1.4rem;
  --text-display:   2rem;
  --leading-tight:  1.12;
  --leading-snug:   1.32;
  --leading-body:   1.55;

  /* Spacing rhythm */
  --container-max:  1680px;
  --container-pad:  clamp(1.5rem, 4vw, 4rem);

  /* Radius scale */
  --radius-sm:      4px;
  --radius-md:      7px;
  --radius-lg:      10px;
  --radius-xl:      12px;

  /* Existing token aliases for the dark mode shell — keep names for backward compat */
  --color-matched:    var(--color-clean);
  --color-review-old: var(--color-review);
  --color-escalate-old: var(--color-escalate);
  --color-info:       var(--color-accent);
  --color-governance: var(--color-ink-2);
  --color-text:       var(--color-ink);
  --color-surface-dark: oklch(18% 0.020 270);
  --color-text-dark:  oklch(94% 0.005 80);

  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-bg);
}
```

This block establishes every color and font token the rest of the system inherits.

### 3. Replace the body and `.pg-shell` background

```css
body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: var(--color-bg);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

/* Subtle paper grain — fixed, pointer-events: none, very low opacity */
body::before {
  content: "";
  position: fixed; inset: 0; z-index: 100;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.022 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  mix-blend-mode: multiply;
  opacity: 0.6;
}

.pg-shell {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-body);
}
```

The radial-gradient backgrounds on `.pg-shell` are removed. The new background is the flat warm near-white plus the grain overlay.

### 4. Rebind the type scale and key tokens

Update these existing rules in `app/styles.css` to use the new tokens. Class names stay; visual output shifts.

```css
.pg-app-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--color-ink);
}

.pg-app-subtitle {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  letter-spacing: 0.02em;
}

.pg-page-header,
.pg-card,
.pg-card-compact {
  border: 1px solid var(--color-rule);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: none;
}

.dark .pg-page-header,
.dark .pg-card,
.dark .pg-card-compact {
  border-color: oklch(25% 0.018 270);
  background: oklch(22% 0.020 270);
}

.pg-page-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.pg-section-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 500;
  letter-spacing: -0.018em;
  color: var(--color-ink);
}

.pg-kicker {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  color: var(--color-ink-muted);
}

.pg-kicker-neutral { color: var(--color-ink-muted); }
.pg-kicker-governance { color: var(--color-ink-soft); }

.pg-copy {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  color: var(--color-ink-soft);
}

.pg-meta {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-muted);
  letter-spacing: 0.02em;
}

.pg-tabular,
.pg-number,
.pg-metric-value,
.pg-hero-value,
.pg-shell .tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
}

.pg-metric-value {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  letter-spacing: -0.02em;
  font-weight: 500;
}

.pg-hero-value {
  font-family: var(--font-display);
  font-size: var(--text-display);
  letter-spacing: -0.028em;
  font-weight: 500;
}
```

### 5. Rebind buttons

```css
.pg-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  height: 2.25rem;
  padding: 0 0.95rem;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease, transform 80ms ease;
}

.pg-button:not(:disabled):active { transform: translateY(1px); }

.pg-button-primary {
  background: var(--color-ink);
  color: var(--color-bg);
}

.pg-button-primary:hover:not(:disabled) {
  background: var(--color-ink-2);
}

.pg-button-secondary {
  background: var(--color-surface);
  color: var(--color-ink-soft);
  border-color: var(--color-rule);
}

.pg-button-secondary:hover:not(:disabled) {
  color: var(--color-ink);
  border-color: var(--color-ink-faint);
  background: var(--color-bg-soft);
}

.pg-button-ghost {
  background: transparent;
  color: var(--color-ink-soft);
}

.pg-button-ghost:hover:not(:disabled) {
  background: var(--color-bg-soft);
  color: var(--color-ink);
}

.pg-button-sm {
  height: 2rem;
  padding: 0 0.7rem;
  font-size: var(--text-xs);
}

.dark .pg-button-primary {
  background: var(--color-bg);
  color: var(--color-ink);
}

.dark .pg-button-primary:hover:not(:disabled) {
  background: oklch(94% 0.005 80);
}

.dark .pg-button-secondary {
  background: oklch(20% 0.018 270);
  color: var(--color-ink-ghost);
  border-color: oklch(28% 0.018 270);
}
```

### 6. Rebind tabs

The current tabs are heavy fills or underline indicators from Chunk 2.5. The new direction uses a pill-quiet active state — tabs read as pure navigation, not buttons. Replace the existing `.pg-tab*` block with:

```css
.pg-tabs {
  overflow-x: auto;
  scrollbar-width: thin;
}

.pg-tabs-list {
  display: flex;
  gap: 0.15rem;
  min-width: max-content;
}

.pg-tab {
  position: relative;
  padding: 0.45rem 0.95rem;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-ink-soft);
  text-align: left;
  transition: color 160ms ease, background-color 160ms ease;
}

.pg-tab:hover {
  background: var(--color-bg-soft);
  color: var(--color-ink);
}

.pg-tab-active {
  color: var(--color-ink);
  background: var(--color-bg-soft);
}

.pg-tab-helper {
  display: block;
  margin-top: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--color-ink-faint);
  letter-spacing: 0.02em;
}

.pg-tab-active .pg-tab-helper {
  color: var(--color-ink-muted);
}

.dark .pg-tab { color: var(--color-ink-ghost); }
.dark .pg-tab:hover { background: oklch(24% 0.020 270); color: var(--color-ink-ghost); }
.dark .pg-tab-active { background: oklch(24% 0.020 270); color: var(--color-bg); }
```

The `::after` underline added in Chunk 2.5 is removed. Remove its CSS rule along with the related dark-mode rule.

### 7. Severity tier rebinding

The `[class*="bg-green"]` / `[class*="bg-amber"]` / `[class*="bg-red"]` selector blocks for `.pg-card`, `.pg-card-compact`, and `.pg-empty-panel` should switch to using the new tokens. Replace each color block with the matching new token color:

```css
.pg-card[class*="bg-green"],
.pg-card-compact[class*="bg-green"],
.pg-empty-panel[class*="bg-green"] {
  background: var(--color-clean-soft);
  border-color: oklch(85% 0.05 145);
}

.pg-card[class*="bg-amber"],
.pg-card-compact[class*="bg-amber"],
.pg-empty-panel[class*="bg-amber"] {
  background: var(--color-review-soft);
  border-color: oklch(85% 0.06 70);
}

.pg-card[class*="bg-red"],
.pg-card-compact[class*="bg-red"],
.pg-empty-panel[class*="bg-red"] {
  background: var(--color-escalate-soft);
  border-color: oklch(85% 0.05 25);
}

.pg-card[class*="bg-blue"],
.pg-card-compact[class*="bg-blue"],
.pg-empty-panel[class*="bg-blue"] {
  background: var(--color-accent-soft);
  border-color: oklch(85% 0.04 248);
}

.pg-card[class*="bg-indigo"],
.pg-card-compact[class*="bg-indigo"],
.pg-empty-panel[class*="bg-indigo"] {
  background: var(--color-bg-soft);
  border-color: var(--color-rule);
}
```

Update the corresponding dark-mode block in the same way using darker OKLCH values for each tone.

### 8. Sticky topbar — keep existing pattern, swap colors only

The Chunk 2.5 topbar already has sticky positioning and backdrop-blur. Swap the colors and brand mark gradient to use the new tokens. The brand mark is now ink-on-bg, not gradient blue:

```css
.pg-topbar {
  background: color-mix(in oklch, var(--color-bg) 78%, transparent);
}

.dark .pg-topbar {
  background: color-mix(in oklch, oklch(18% 0.020 270) 78%, transparent);
}

.pg-brand-mark {
  background: var(--color-ink);
  color: var(--color-bg);
  box-shadow: none;
}

.dark .pg-brand-mark {
  background: var(--color-bg);
  color: var(--color-ink);
}

.pg-version-pill {
  background: var(--color-bg-soft);
  color: var(--color-ink-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
```

### 9. Skeleton, fade-in, hover elevation — keep behavior, refresh palette

```css
.pg-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-soft) 25%,
    var(--color-rule-soft) 50%,
    var(--color-bg-soft) 75%
  );
  background-size: 200% 100%;
  animation: pg-shimmer 1.8s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.dark .pg-skeleton {
  background: linear-gradient(
    90deg,
    oklch(22% 0.018 270) 25%,
    oklch(28% 0.018 270) 50%,
    oklch(22% 0.018 270) 75%
  );
  background-size: 200% 100%;
}
```

Keep `@keyframes pg-fade-in`, `.pg-animate-in`, `.pg-tab-content`, `.pg-card-interactive`, and the `prefers-reduced-motion` media query unchanged. They are token-agnostic.

## Verification checklist

After all changes:

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed (existing Recharts warning still acceptable)
3. `git diff --stat` — confirm changes are limited to: `app/styles.css`, `index.html`. No JSX, no `app/lib/`, no `api/`, no `package.json`
4. Visual smoke test (light + dark, full screen and 1280px) on every workspace tab:
   - Topbar wordmark renders in Fraunces or Geist (whichever the rule says); brand mark is ink-on-bg, not gradient
   - Active tab is a quiet pill, no underline, no heavy fill
   - Section titles render in Fraunces serif
   - Body copy in Geist sans
   - Numbers, codes, identifiers in Geist Mono
   - Background is warm near-white with subtle grain
   - Severity-toned cards (green / amber / red) use lower-chroma OKLCH variants
   - Skeleton shimmer renders in the new palette
5. Network panel: confirm Fraunces, Geist, Geist Mono load from fonts.googleapis.com; Inter does NOT load
6. Reduced motion: confirm shimmer + fade-in + button press translate are suppressed when the OS preference is set
7. Commit message: `style(design): chunk 4.1 design system replacement — Fraunces + Geist + OKLCH palette + severity-only color`

## Documentation

### `docs/HANDOFF.md`

Append a Chunk 4.1 section. Document: the typeface change, the OKLCH palette introduction, the severity-only color rule, the topbar color rebind, why no JSX changed.

### `progress.md`

```
Production Rework Chunk 4.1 Design system replacement (foundation) completed.
Next: Chunk 4.2 Executive Summary rebuild
```

## Skills referenced

- **frontend-design**: Token-first redesign. Class names stay, visual output shifts. References: Linear (zinc + Inter Display), Vercel (Geist family in production), Anthropic Console (Fraunces in marketing surfaces), Stripe (severity-only color discipline).
- **theme-factory**: Multi-token palette swap with light + dark parity, tested at the token layer not the component layer.
- **web-design-guidelines**: Color contrast preserved on every ink/background pair (ink on bg ≥ 14:1, ink-soft on bg ≥ 7:1, ink-muted on bg ≥ 4.5:1). All color is OKLCH for perceptually uniform tone steps.
- **verification-before-completion**: Eval pass, build pass, visual smoke test in both modes, font network check, reduced-motion check.
- **handoff-summary**: Document the change with examples.

## Anti-patterns

- Do not change any JSX in this chunk; if you find yourself reaching for `app/ProcureGuard.jsx` or `app/ProcureGuardDashboard.jsx`, stop and revert — that work belongs in Chunk 4.2 or 4.3
- Do not delete classes that JSX still references; rebind their tokens instead
- Do not add new dependencies — Fraunces and Geist load from Google Fonts, no npm package needed
- Do not introduce two accent colors; the system has one accent (ink-blue) and three severity colors (clean, review, escalate). Anything else is wrong
- Do not lower the contrast on ink-muted or ink-soft below WCAG AA against `--color-bg`
- Do not change Tailwind utility behavior; if a class like `bg-blue-50` is used inline in JSX, it still uses Tailwind's default blue-50 — do not try to redirect Tailwind utilities to the new tokens (that is Tailwind 4 theme work, separate scope)
- Do not remove Inter from the Google Fonts URL only; remove the entire Inter import line in `index.html`
