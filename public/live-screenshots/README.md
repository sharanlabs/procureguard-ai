# ProcureGuard AI Live Screenshot Set

These PNGs are original browser screenshots captured from the running React app. They use the deterministic golden-batch demo seed exposed in development through `?pgDemo=golden`.

They are not static SVG mockups, and they are not screenshots from a paid Gemini run. This keeps the public image set reproducible without exposing an API key.

## Recommended Assets

| Use case | File | Why it works |
|---|---|---|
| Primary README or LinkedIn hero | `procureguard-live-crop-drafts-killer-feature.png` | Shows the strongest product story: DRAFT-only AI-prepared work, human review, supplier context, and held-dollar evidence. |
| Full product overview | `procureguard-live-executive.png` | Shows the complete Executive Summary narrative from payment decision to drafts, supplier risk, audit replay, and export trail. |
| Invoice-review workflow | `procureguard-live-workbench.png` | Shows the analyst queue and invoice-level review surface. |
| Supplier and policy proof | `procureguard-live-analytics.png` | Shows supplier concentration, scorecard, heatmap, and policy simulation context. |
| Governance proof | `procureguard-live-governance.png` | Shows audit trace, AI service telemetry, schema controls, and export evidence. |
| Dark-mode public preview | `procureguard-live-executive-dark.png` | Shows the tuned dark Executive Summary surface. |

## Focused Crops

- `procureguard-live-crop-executive-hero.png`
- `procureguard-live-crop-ai-checks-evidence.png`
- `procureguard-live-crop-drafts-killer-feature.png`
- `procureguard-live-crop-workbench-queue.png`
- `procureguard-live-crop-supplier-scorecard.png`
- `procureguard-live-crop-audit-governance.png`

Use these when the image needs to stay readable in a social feed, README header, or portfolio card.

## Full-Page Captures

- `procureguard-live-start.png`
- `procureguard-live-start-dark.png`
- `procureguard-live-executive.png`
- `procureguard-live-executive-dark.png`
- `procureguard-live-workbench.png`
- `procureguard-live-workbench-dark.png`
- `procureguard-live-analytics.png`
- `procureguard-live-analytics-dark.png`
- `procureguard-live-governance.png`
- `procureguard-live-governance-dark.png`
- `procureguard-live-executive-desktop-1440.png`
- `procureguard-live-workbench-desktop-1440.png`

## Reproduce Locally

Start the app:

```bash
npm run dev
```

Open deterministic demo URLs:

```text
http://127.0.0.1:5173/?pgDemo=golden&pgTab=executive&pgTheme=light
http://127.0.0.1:5173/?pgDemo=golden&pgTab=workbench&pgTheme=light
http://127.0.0.1:5173/?pgDemo=golden&pgTab=analytics&pgTheme=light
http://127.0.0.1:5173/?pgDemo=golden&pgTab=governance&pgTheme=light
http://127.0.0.1:5173/?pgDemo=golden&pgTab=executive&pgTheme=dark
```

The demo seed is only active in development and only when `pgDemo=golden` is present.

## Public Use Notes

- Keep the DRAFT-only framing visible when using screenshots publicly.
- Do not imply that ProcureGuard sends emails, releases payments, or executes supplier actions automatically.
- Prefer focused crops for LinkedIn and portfolio posts; full-page captures are better for GitHub documentation.
- If the UI changes, regenerate screenshots from the live app instead of editing the PNGs manually.
