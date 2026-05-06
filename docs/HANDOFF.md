# ProcureGuard AI — Runtime Snapshot

Last updated: May 6, 2026

## Current runtime

- **AI stack**: Gemini API through the Vercel serverless proxy in `api/messages.js`.
- **Approved model**: `gemini-2.5-flash`.
- **Validation gates**: `node evals/run_evals.js` (25/25 passing) and `npm run build`.
- **Deployment target**: Vercel with `GEMINI_API_KEY` as a server-side environment variable.

## Pipeline stages

| Stage | Prompt | Schema | Output |
|---|---|---|---|
| Matching | `prompts/01_matching.md` | `matchingOutputSchema` | Exception flags per invoice |
| Classification | `prompts/02_classification.md` | `classificationOutputSchema` | Severity tiers (1–3) |
| Action generation | `prompts/03_action_generation.md` | `actionOutputSchema` | DRAFT communications |

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

## Notes

- The project was originally built against the Claude/Anthropic API and migrated to Gemini 2.5 Flash. Git history reflects both phases.
- All structured output uses `responseMimeType: "application/json"` with `responseJsonSchema`.
- Invoice batches are chunked (default 10 per chunk) with per-chunk retry and partial-result preservation.
- Token and cost telemetry is visible in the Audit & Governance workspace tab.
