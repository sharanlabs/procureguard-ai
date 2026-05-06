# Claude Code Prompt: Production Rework Chunk 2.3 — Correctness, Accessibility & Documentation

## Context

You are working on ProcureGuard AI, a React procurement exception dashboard. Read `CLAUDE.md` for full project context. The project is in Stage 6 Production Rework. Chunks 2.1, 2.1R, and 2.2 are complete. This chunk fixes correctness bugs and accessibility gaps found during a design audit.

**Critical constraint**: Do NOT change any business logic, pipeline behavior, or Claude API integration. All changes are CSS classes, HTML attributes, meta tags, and documentation. The eval suite (25/25) must remain passing.

---

## Category A: Badge Component Fix + Dark Mode Gaps

### A1. Badge gap fix (both files)

The Badge component uses `inline-flex items-center` but has no `gap` class, causing icons to render flush against text in ProgressPanel badges.

**File: `app/ProcureGuard.jsx`, line 107**

Change:
```jsx
<span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
```
To:
```jsx
<span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
```

**File: `app/ProcureGuardDashboard.jsx`, line 26**

Same change — add `gap-1.5` to the duplicate Badge component.

### A2. Dark mode badge gaps (4 instances)

These badges have light-mode-only classes. Add dark: variants.

**ProcureGuard.jsx line 370** — tolerance slider "affected" badge:
```jsx
// FROM:
<Badge className="border-blue-200 bg-blue-50 text-blue-800">{affectedCount} affected</Badge>
// TO:
<Badge className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200">{affectedCount} affected</Badge>
```

**ProcureGuard.jsx line 409** — "Simulation only" badge:
```jsx
// FROM:
<Badge className="border-blue-300 bg-white text-blue-800">Simulation only</Badge>
// TO:
<Badge className="border-blue-300 bg-white text-blue-800 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-200">Simulation only</Badge>
```

**ProcureGuard.jsx line 947** — policy simulation changed badge:
```jsx
// FROM:
<Badge className="border-blue-300 bg-blue-50 text-blue-800">Policy simulation changed this review path</Badge>
// TO:
<Badge className="border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-200">Policy simulation changed this review path</Badge>
```

**ProcureGuardDashboard.jsx line 230** — decision card outcome badge:
```jsx
// FROM:
<Badge className={`bg-white/70 ${subtleToneClasses(outcome.tone)}`}>{outcome.label}</Badge>
// TO:
<Badge className={`bg-white/70 dark:bg-slate-800/70 ${subtleToneClasses(outcome.tone)}`}>{outcome.label}</Badge>
```

---

## Category B: Accessibility & Web Interface Guidelines Compliance

These fixes come from auditing against the Vercel Web Interface Guidelines and WCAG standards.

### B1. Decorative icon aria-hidden

Every lucide-react icon used as a decorative element (next to visible text) needs `aria-hidden="true"`. Icons that are the sole content of a button (like the dark mode toggle) should NOT get aria-hidden since the button already has `aria-label`.

Add `aria-hidden="true"` to all decorative icons. These are icons that appear alongside visible text labels. Search for patterns like:
- `<Key className="h-4 w-4" />` next to "Local Claude API key" label
- `<Upload className="...` next to "Upload" text
- `<Download className="...` next to "Export audit CSV"
- `<Play className="...` next to "Analyze"
- `<Loader2 className="...` next to "Analyzing..."
- `<CheckCircle2 className="...` next to step labels in ProgressPanel
- `<Circle className="...` next to step labels
- `<AlertCircle className="...` next to alert text
- `<AlertTriangle className="...` in workspace tabs
- `<BarChart3 className="...` in workspace tabs
- `<TrendingUp className="...` in workspace tabs
- `<Shield className="...` in workspace tabs
- Icons in WORKSPACE_TABS array entries

Do NOT add aria-hidden to the Sun/Moon icon in the dark mode toggle button (line 3022) — that button already has `aria-label`.

### B2. prefers-reduced-motion media query

**File: `app/styles.css`** — add at the end of the file, before the closing responsive breakpoint block:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### B3. aria-live on status messages

The Alert component (`app/ProcureGuard.jsx`, line 113) should announce errors to screen readers. Add `role="alert"` and `aria-live="assertive"` to the Alert's root element.

Also add `aria-live="polite"` to the ProgressPanel status area so step changes are announced.

### B4. Meta tags in index.html

**File: `index.html`** — add two meta tags inside `<head>`:

```html
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#f8fafc" />
```

### B5. spellCheck on API key input

**File: `app/ProcureGuard.jsx`, line 206-214** — add `spellCheck={false}` to the API key input element, alongside the existing `autoComplete="off"`.

### B6. Ellipsis character

**File: `app/ProcureGuard.jsx`, line 3030** — replace the three periods in "Analyzing..." with a proper ellipsis character:

```jsx
// FROM:
Analyzing...
// TO:
Analyzing…
```

### B7. Bare transition class replacement

Two buttons use `transition` (bare) instead of the more specific `transition-colors`. This avoids unintended layout shift animations per Web Interface Guidelines.

**Line 841**: Replace `transition` with `transition-colors` in the "Mark reviewed" button className.
**Line 1332**: Replace `transition` with `transition-colors` in the "Export audit CSV" button className.

---

## Category C: Documentation

### C1. Write Chunk 2.2 handoff

**File: `docs/HANDOFF.md`** — the section at line 2633 is empty (just the title). Write a complete handoff section following the format of the Chunk 2.1R handoff above it. Content for Chunk 2.2:

```markdown
## Production Rework Chunk 2.2 Icon system

### What changed
- Added lucide-react@1.11.0 as a pinned dependency
- Imported 15 icons: AlertCircle, AlertTriangle, BarChart3, CheckCircle2, Circle, Download, Key, Loader2, Moon, Play, RotateCcw, Shield, Sun, TrendingUp, Upload
- Added icons to all 5 WORKSPACE_TABS entries
- Added icons to ProgressPanel step badges (CheckCircle2 complete, Loader2 spinning, Circle pending)
- Added Key icon to API key label
- Added Play/Loader2 to Analyze button states
- Added Sun/Moon to dark mode toggle
- Added Download to export button
- Added RotateCcw to reset button
- Upload icon to file upload zone

### Files modified
- app/ProcureGuard.jsx (icon imports + all icon placements)
- package.json (lucide-react dependency added)

### Verification
- 25/25 evals passing
- No linting errors
- Committed as eff6bbf

### Known issues
- Badge component missing gap-1.5 class (icon-text spacing bug) — deferred to Chunk 2.3
- Four badges missing dark mode variants — deferred to Chunk 2.3

### Next step
Production Rework Chunk 2.3 Correctness and accessibility fixes
```

### C2. Write Chunk 2.3 handoff

After completing all changes above, write a Chunk 2.3 handoff section in the same format. Include all files modified, all changes made, verification results.

### C3. Update progress.md

**File: `progress.md`** — update line 38 to reflect completion:

After Chunk 2.2 line, add:
```
Production Rework Chunk 2.2 Icon system completed.
Production Rework Chunk 2.3 Correctness and accessibility fixes completed.
Next: Production Rework Chunk 2.4 Premium visual polish
```

---

## Verification Checklist

After all changes, verify:

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed with no errors (the existing large-chunk warning is acceptable)
3. Dark mode toggle — confirm all 4 fixed badges render correctly in dark mode
4. Badge gap — confirm ProgressPanel badges have visible spacing between icon and text
5. Search the entire codebase for any remaining `<Badge` that lacks dark: classes on colored backgrounds
6. Confirm no `transition` (bare) remains — all should be `transition-colors` or more specific
7. Commit with message: `fix(ui): chunk 2.3 correctness, accessibility, and documentation`

---

## Skills Referenced

- **impeccable**: No pure `bg-white` on tinted surfaces (A2 fixes `bg-white` badge in dark mode); icon-text spacing standards
- **web-design-guidelines**: Vercel Web Interface Guidelines — `aria-hidden` on decorative icons, `prefers-reduced-motion`, `transition-colors` over bare `transition`, `color-scheme` meta, dark mode parity
- **verification-before-completion**: Run evals and build before claiming done
- **handoff-summary**: Write complete handoff sections for both 2.2 and 2.3
