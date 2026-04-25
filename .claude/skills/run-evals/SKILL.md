---
name: run-evals
description: Run the evaluation harness against the golden dataset
allowed-tools: Bash(node *)
---
# Instructions for Claude when /run-evals is invoked

1. Run `node evals/run_evals.js` from the project root.
2. Parse the latest result JSON in `evals/results/`.
3. Report pass rate and any failures.
4. If failures exist, diagnose root cause:
   - golden dataset issue
   - CSV data issue
   - eval harness logic issue
5. Do not modify files unless explicitly asked.
