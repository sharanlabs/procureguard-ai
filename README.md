# ProcureGuard AI

ProcureGuard AI is an intelligent 3-way procurement matching tool that ingests Purchase Order, Invoice, and Goods Receipt CSVs, runs them through a multi-step Claude API prompt chain, and surfaces every discrepancy with AI-generated severity classifications, chain-of-thought reasoning, what-if tolerance simulation, auto-drafted supplier communications, and an exportable audit trail — all in the browser with no backend required.

## Tech Stack

- **AI** — Claude API (Haiku 4.5, Sonnet 4.6, Opus 4.7) with Structured Outputs and prompt caching
- **Frontend** — React (JSX), single-file artifact pattern
- **Styling** — Tailwind CSS
- **Charts** — Recharts
- **Data** — In-browser CSV parsing (no server)
- **Deployment** — Vercel

## Folder Structure

```
procureguard-ai/
├── app/          # React application
├── data/         # Sample CSVs and data dictionary
├── docs/         # Architecture, security, scaling, user guide
├── evals/        # Golden dataset and evaluation harness
├── prompts/      # System prompts for each pipeline step
├── tests/        # Exception test matrix
├── PRD.md        # Product requirements
└── CLAUDE.md     # AI coding instructions
```

## How to Run

Deployment URL coming in Stage 6.

## Reference

- [DECISIONS.md](DECISIONS.md) — architectural decision log
- [data/DATA_DICTIONARY.md](data/DATA_DICTIONARY.md) — field definitions and exception catalog
