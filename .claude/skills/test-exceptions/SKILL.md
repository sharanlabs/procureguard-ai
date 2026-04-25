---
name: test-exceptions
description: Verify all 17 exception types are present and correctly embedded in the CSV data
allowed-tools: Bash(grep *), Bash(node *), Read
---
# Instructions for Claude when /test-exceptions is invoked

1. Read `data/DATA_DICTIONARY.md`, especially Section 2 and Section 3.
2. Verify that all exception types E01 through E17 are represented in the dataset.
3. Run `node evals/run_evals.js`.
4. Report:
   - which exceptions are verified
   - which exceptions are missing or incorrect
   - eval pass rate
5. Do not modify CSV files unless explicitly asked.
