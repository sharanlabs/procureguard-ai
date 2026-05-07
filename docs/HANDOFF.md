# ProcureGuard AI — Runtime Snapshot

Last updated: May 6, 2026

## Current runtime

- **AI stack**: Gemini API through the Vercel serverless proxy in `api/messages.js`.
- **Approved model**: `gemini-2.5-flash`.
- **Validation gates**: `node evals/run_evals.js` (25/25 passing) and `npm run build`.
- **Deployment target**: Vercel with `GEMINI_API_KEY` as a server-side environment variable.
- **Vercel project**: `sharank98-6490s-projects/procureguard-ai`, linked to `sharanlabs/procureguard-ai`.
- **Vercel build config**: `vercel.json` pins Vite, `npm ci`, `npm run build`, and `dist`.
- **CI**: GitHub Actions workflow `.github/workflows/ci.yml` runs `npm ci`, deterministic evals, and production build on `main` pushes and pull requests.

## Pipeline stages

| Stage | Prompt | Schema | Output |
|---|---|---|---|
| Matching | `prompts/01_matching.md` | `matchingOutputSchema` | Exception flags per invoice |
| Classification | `prompts/02_classification.md` | `classificationOutputSchema` | Severity tiers (1–3) |
| Action generation | `prompts/03_action_generation.md` | `actionOutputSchema` | Review-ready communications |

An auxiliary text extraction prompt (`prompts/04_text_extraction.md`) exists but is not wired into the production pipeline.

## Key files

- `app/ProcureGuard.jsx` — Main application component and pipeline orchestration.
- `app/ProcureGuardDashboard.jsx` — Executive Summary dashboard.
- `app/lib/gemini.js` — Gemini API client with retry, rate-limit, and timeout handling.
- `app/lib/pipeline.js` — Chunked invoice processing and pipeline state machine.
- `app/lib/schemas.js` — JSON schemas enforced via Gemini structured output.
- `app/lib/uiModels.js` — View model builders for all five review surfaces.
- `api/messages.js` — Vercel serverless proxy (model allowlist, key gating).
- `evals/run_evals.js` — Deterministic eval harness with golden dataset.
- `vercel.json` — Vercel build settings for the Vite app.
- `.github/workflows/ci.yml` — CI gate for evals and build.
- `docs/METHODOLOGY.md` — Step-by-step procedure, AI guardrails, validation gates, hallucination boundary, and source basis.

## Notes

- The project was originally built against the Claude/Anthropic API and migrated to Gemini 2.5 Flash. Git history reflects both phases.
- All structured output uses `responseMimeType: "application/json"` with `responseJsonSchema`.
- Invoice batches are chunked (default 10 per chunk) with per-chunk retry and partial-result preservation.
- Token and cost telemetry is visible in the Audit & Governance workspace tab.
- Before production verification, add `GEMINI_API_KEY` to the Vercel project environments. The key must remain server-side and must not use a `VITE_` prefix.
- Production UI copy presents generated outputs as review-ready follow-up material rather than internal control labels; the underlying no-send and human-approval controls remain unchanged.
- The Start, Executive Summary, Exception Workbench, Supplier Analytics, and Audit & Governance tabs have been reviewed for professional payment-review language and mobile layout fit.
- Dark mode has been checked against the golden demo path (`?pgDemo=golden&pgTheme=dark`) across all workspace tabs, including 390px and 320px mobile overflow assertions.
- README screenshot assets under `public/live-screenshots/` were regenerated from the current UI after the copy polish pass.
- Start and Audit & Governance now include an in-app methodology and guardrails panel so the live product explains the staged procedure and accuracy boundary before or after a run.
- Production metadata, canonical URL, robots, and sitemap currently target `https://procureguard-ai.vercel.app/`; update them if a custom domain replaces the free Vercel URL.
