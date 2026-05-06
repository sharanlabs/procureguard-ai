# Deployment

ProcureGuard AI is a Vite React app with a Vercel serverless proxy at `api/messages.js`. The production proxy calls Gemini with a server-side key and only allows the approved model.

## Prerequisites

- Node.js 22 or compatible Vercel build runtime.
- Vercel project connected to this repository.
- `GEMINI_API_KEY` configured as a Vercel environment variable.

Do not commit real API keys. `.env.example` documents the required variable name only.

## Local Verification

Run these before deploying:

```bash
npm ci
node evals/run_evals.js
npm run build
```

Expected eval result:

```text
total_procurement_tests: 25
passed: 25
failed: 0
pass_rate: 100%
```

## Vercel Configuration

Set the production environment variable named `GEMINI_API_KEY`.

The browser does not need a production API key. Production requests go through `api/messages.js`, which reads `process.env.GEMINI_API_KEY`.

## Deploy

Use the Vercel dashboard or CLI after the environment variable is configured.

Recommended production checks after deployment:

1. Open the deployed URL.
2. Upload `data/purchase_orders.csv`, `data/invoices.csv`, and `data/goods_receipts.csv`.
3. Run **Analyze**.
4. Confirm all tabs populate: Executive Summary, Exception Workbench, Supplier Analytics, and Audit & Governance.
5. Confirm prepared communications remain review-controlled and no send/payment execution action exists.
6. Confirm `/procureguard-og.png`, `/procureguard-mark.svg`, and `/procureguard-touch-icon.png` return HTTP 200.

## Failure Checks

If analysis fails in production:

- Confirm `GEMINI_API_KEY` is set in the correct Vercel environment.
- Confirm the provider quota is not exhausted.
- Confirm browser network requests call `/api/messages`, not Gemini directly.
- Confirm the API response does not include a leaked key or secret.
- Re-run `node evals/run_evals.js` locally to separate data/eval regressions from provider failures.

## Rollback

Use Vercel's previous deployment promotion if a production deploy regresses the UI or analysis path. The app stores no database state, so rollback is limited to code and environment configuration.
