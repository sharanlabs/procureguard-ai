# ProcureGuard AI

ProcureGuard AI is an intelligent 3-way procurement matching tool that ingests Purchase Order, Invoice, and Goods Receipt CSVs, runs them through a multi-step Claude API prompt chain, and surfaces every discrepancy with AI-generated severity classifications, explainable decision rationale, what-if tolerance simulation, draft supplier communications, and an exportable audit trail.

## Tech Stack

- **AI** — Claude API with runtime routing: Haiku 4.5 for matching, Sonnet 4.6 for classification, and Sonnet 4.6 for action generation
- **Frontend** — React (JSX), single-file artifact pattern
- **Styling** — Tailwind CSS
- **Charts** — Recharts
- **Data** — In-browser CSV parsing (no server)
- **Deployment** — Vercel

## Folder Structure

```
procureguard-ai/
├── api/                 # Vercel serverless Claude proxy
├── app/                 # React application
│   └── lib/             # Claude client, schemas, CSV parsing, pipeline helpers, view models
├── data/                # Sample CSVs and data dictionary
├── docs/                # HANDOFF.md and planned reference docs
├── evals/               # Golden dataset, deterministic harness, and generated results
│   └── results/         # Eval result artifacts
├── prompts/             # Prompt files for matching, classification, action generation, and auxiliary extraction
├── CLAUDE.md            # AI coding instructions
├── DECISIONS.md         # Architectural decision log
├── index.html           # Vite entry HTML
├── package.json         # npm scripts and pinned dependencies
├── package-lock.json    # Locked dependency graph
├── PRD.md               # Product requirements
└── vite.config.js       # Vite configuration
```

## How to Run

Deployment URL: pending. No live deployment URL is recorded in the repo yet.

## Reference

- [DECISIONS.md](DECISIONS.md) — architectural decision log
- [data/DATA_DICTIONARY.md](data/DATA_DICTIONARY.md) — field definitions and exception catalog
