# Claude Code Prompt: Production Rework Chunk 2.4 — Premium Visual Polish

## Context

You are working on ProcureGuard AI, a React procurement exception dashboard. Read `CLAUDE.md` for full project context. The project is in Stage 6 Production Rework. Chunks 2.1 through 2.3 are complete. This chunk adds motion, loading states, and micro-interactions that elevate the UI from functional to premium-tier — the kind of polish you see on Stripe, Linear, Vercel, and Anthropic dashboards.

**Critical constraints**:
- Do NOT change any business logic, pipeline behavior, or Claude API integration
- ALL new animations MUST respect `prefers-reduced-motion` (the media query was added in Chunk 2.3)
- The eval suite (25/25) must remain passing
- No new dependencies — use CSS animations and existing Tailwind utilities only

---

## Change 1: Content Section Entry Animations

Add a subtle fade-in + slide-up animation to major content sections as they mount. This is the single highest-impact visual upgrade — it makes the app feel alive instead of static.

### CSS (add to `app/styles.css`)

```css
@keyframes pg-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pg-animate-in {
  animation: pg-fade-in 0.3s ease-out both;
}
```

The `prefers-reduced-motion` block added in Chunk 2.3 already handles disabling this for users who prefer reduced motion. Verify that block exists before proceeding.

### JSX — Apply `pg-animate-in` to these containers

Add the `pg-animate-in` class to the outermost wrapper of each workspace surface:

1. **Start workspace** — the container that holds the API key input, file upload zone, and progress panel
2. **Executive Summary** — the `<ProcureGuardDashboard>` wrapper
3. **Exception Workbench** — the main workbench container
4. **Supplier & Policy Analytics** — the analytics section container
5. **Audit & Governance** — the governance section container

Each workspace surface content already renders conditionally based on `activeWorkspace`. Adding the class to the outermost `<div>` or `<section>` of each surface is sufficient — React will trigger the animation on mount when switching tabs.

**Important**: Do NOT add animation to the tab bar itself, the header, or the dark mode toggle. Only content areas animate.

---

## Change 2: Skeleton Loading Placeholders

During Claude API analysis (when `runningStep` is truthy), the Executive Summary and Exception Workbench tabs currently show nothing until results arrive. Add skeleton placeholders that pulse to indicate loading.

### CSS (add to `app/styles.css`)

```css
@keyframes pg-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.pg-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary, #e2e8f0) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: pg-shimmer 1.8s ease-in-out infinite;
  border-radius: 0.5rem;
}

.dark .pg-skeleton {
  background: linear-gradient(
    90deg,
    #1e293b 25%,
    #334155 50%,
    #1e293b 75%
  );
  background-size: 200% 100%;
}
```

### JSX — SkeletonCard component

Create a small internal component (place near the Badge component at the top of `ProcureGuard.jsx`):

```jsx
function SkeletonCard({ className = "" }) {
  return (
    <div className={`pg-card p-5 ${className}`} aria-hidden="true">
      <div className="pg-skeleton h-4 w-1/3 mb-3" />
      <div className="pg-skeleton h-3 w-full mb-2" />
      <div className="pg-skeleton h-3 w-2/3" />
    </div>
  );
}
```

### Where to render skeletons

In the workspace content area, when `runningStep` is truthy and results have not yet loaded:

- **Executive Summary tab**: Show 3 SkeletonCards in a grid layout matching the eventual dashboard cards
- **Exception Workbench tab**: Show 4 SkeletonCards in a vertical stack matching the exception list layout

Use the existing `runningStep` and result-availability checks that are already in place. The skeletons replace the empty space, not the ProgressPanel (which continues to show real step progress).

---

## Change 3: Card Hover Elevation

Add a subtle lift effect on interactive cards — exception cards in the workbench and stat cards in the dashboard.

### CSS (add to `app/styles.css`)

```css
.pg-card-interactive {
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}

.pg-card-interactive:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.07),
    0 2px 4px -2px rgb(0 0 0 / 0.05);
}

.dark .pg-card-interactive:hover {
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.3),
    0 2px 4px -2px rgb(0 0 0 / 0.2);
}
```

### JSX — apply `pg-card-interactive`

Add `pg-card-interactive` alongside `pg-card` on:

1. **Exception Workbench** — each exception row card (the clickable card that expands to show details)
2. **Executive Summary** — the stat cards in the dashboard top row (total invoices, matched, review, escalate)

Do NOT apply to:
- The tolerance simulator section (it is a settings panel, not a clickable card)
- The audit trail section (it is an export panel)
- The API key input card (it is a form, not navigational)

---

## Change 4: Tab Content Crossfade

When switching workspace tabs, the content should crossfade rather than hard-cut. This is a small but noticeable polish.

### Implementation approach

The workspace content already switches based on `activeWorkspace` state. Wrap the content rendering area in a container with a CSS transition on opacity. Use a key-based approach:

```css
.pg-tab-content {
  animation: pg-fade-in 0.2s ease-out both;
}
```

Apply this class to the content wrapper, and use `key={activeWorkspace}` on the wrapper so React remounts it on tab change, retriggering the animation. This reuses the `pg-fade-in` keyframe from Change 1.

**Note**: This is intentionally simpler than a true crossfade (which would require rendering both old and new content simultaneously). A fade-in on mount is the right tradeoff — it feels smooth without adding complexity.

---

## Change 5: Upload Zone Refinement

The file upload zone currently uses a dashed border. Refine it to feel more premium.

### Changes to the upload zone styling

1. Replace `border-dashed` with a subtle solid border: `border border-slate-200 dark:border-slate-700`
2. Add a slightly lifted background: `bg-slate-50/50 dark:bg-slate-800/30`
3. Add hover state: `hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/50`
4. Add transition: `transition-colors`
5. Keep the existing rounded corners and padding

The upload icon and text remain as-is. The change is purely to the container styling — removing the "dashed border" pattern that reads as dated, replacing it with a clean, quiet surface that lifts on hover.

---

## Change 6: Topbar Bottom Border

Add a subtle bottom border to the sticky header/topbar to anchor it visually when content scrolls beneath it.

### Implementation

Find the `<header>` element (around line 3010 in ProcureGuard.jsx) and add:

```
border-b border-slate-200/80 dark:border-slate-700/60
```

This creates a thin, semi-transparent rule that separates the header from content without being heavy.

---

## Verification Checklist

After all changes:

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed with no errors
3. Visual checks:
   - Switch between all 5 tabs — content should fade in smoothly
   - Hover over exception cards — subtle lift effect visible
   - Toggle dark mode — all new styles should work in both modes
   - Upload zone should have clean solid border, not dashed
   - Header should have visible bottom border
4. Reduced motion check: Temporarily add `prefers-reduced-motion: reduce` in browser devtools — all animations should be suppressed
5. No new dependencies added to package.json
6. Commit with message: `feat(ui): chunk 2.4 premium visual polish — animations, skeletons, hover elevation`

## Documentation

### Write Chunk 2.4 handoff in `docs/HANDOFF.md`

Follow the existing handoff format. Document all 6 changes, files modified, CSS additions, verification results.

### Update `progress.md`

```
Production Rework Chunk 2.4 Premium visual polish completed.
Next: [whatever comes next — likely Vercel deployment prep or final review]
```

---

## Skills Referenced

- **impeccable**: Motion principles — no animation > 0.3s for UI transitions, ease-out for entries, no bounce/spring on data UI. Hover elevation must be subtle (1px lift max). No pure white or black in dark mode shadows. Skeleton shimmer should use semantic color tokens. Upload zone: "quiet until engaged" principle
- **web-design-guidelines**: Vercel Web Interface Guidelines — all animations must honor `prefers-reduced-motion`. Hover states should be subtle, not dramatic. Dark mode must have parity for all new visual treatments. Touch targets remain compliant (hover effects are visual enhancement only, not functional)
- **dashboard-style-test**: Reviewed for reference. The warm dark palette and ambient orb pattern do not apply here (ProcureGuard has its own established design system with pg-* tokens). However, the card-on-dark-surface pattern and the fade-in animation approach were referenced for consistency
- **verification-before-completion**: Run evals and build before claiming done. Visual verification in both light and dark mode required
- **handoff-summary**: Write complete handoff section for Chunk 2.4
