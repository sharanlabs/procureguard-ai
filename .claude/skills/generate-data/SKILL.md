---
name: generate-data
description: Regenerate sample CSV data with all 17 exception types
allowed-tools: Bash(*), Write, Read
---
# Instructions for Claude when /generate-data is invoked

1. Read `data/DATA_DICTIONARY.md` for the complete exception specification.
2. Regenerate `data/purchase_orders.csv`, `data/invoices.csv`, and `data/goods_receipts.csv` only if explicitly requested.
3. Preserve all 17 exception types E01 through E17.
4. Verify the cross-reference map remains valid.
5. Run `node evals/run_evals.js` after generation.
6. Report results and any data changes clearly.
