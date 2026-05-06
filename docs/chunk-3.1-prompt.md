# Claude Code Prompt: Production Rework Chunk 3.1 — Pipeline Latency Optimization

## Role

You are a senior backend engineer at Stripe who has shipped high-throughput pipelines in production. You measure before you optimize, you change one thing at a time, and you preserve every existing guarantee (validation, audit trail, retry semantics, partial-result safety) while reducing wall-clock latency. You apply Anthropic's prompt-engineering best practices: prompt caching, structured outputs, model routing, batching that respects token budgets.

## Context

You are working on ProcureGuard AI. Read `CLAUDE.md` for full project context. The Stage 6 production rework UI chunks (2.1 through 2.5) are complete. The product runs a 3-stage Claude prompt chain on procurement CSVs in chunks of 5 invoices each. A live test on the 25-invoice golden batch reported a wall-clock of 7.8 minutes. Cost is acceptable; latency is not.

Read these files end-to-end before changing anything:
- `app/ProcureGuard.jsx` lines 2625–2950 (the three stage runners and `runPipeline`)
- `app/lib/pipeline.js` (chunk validation, run state, merge functions)
- `app/lib/claude.js` (timeouts, model routing, retry policy)
- `prompts/03_action_generation.md` (draft generation prompt — to confirm what "exception" means in the input contract)
- `app/lib/schemas.js` (output schemas)

## What is slow today

Confirmed by code reading at lines 2630, 2724, 2820 of `app/ProcureGuard.jsx`: each of the three stages (`runMatchingChunks`, `runClassificationChunks`, `runActionGenerationChunks`) processes its chunks **sequentially** with a `for (...) await` loop. With 5 chunks × 3 stages, the pipeline is doing 15 sequential network round-trips when most could run in parallel.

## Critical constraints

- Do NOT change the prompt-chain semantics: matching → classification → draft generation, gate-checked
- Do NOT change Structured Outputs schemas, prompt caching headers, or retry policy
- Do NOT change audit trail format, validation, or alignment behavior
- Do NOT add new dependencies
- Eval suite must remain at 25/25
- HITL labels preserved (no Send buttons)
- Cost per run must not increase. The optimizations below are wall-clock-only, with one cost-reducing optimization (skip draft generation for clean rows) that should NEVER drop a row that has a real exception
- Per-chunk audit metadata, retry attempts, and `pipelineRunState` must remain accurate. The UI relies on `markPipelineChunkStarted` / `markPipelineChunkSucceeded` / `markPipelineChunkFailed` calls in the order they happen
- Partial-result saving from Chunk 1.3 must continue to work. If chunk 3 fails while chunks 1, 2, 4, 5 succeed, retry must only re-run chunk 3

## Three optimizations, in order

### Optimization 1: Bounded parallel chunks within each stage

Replace the sequential `for await` loop in each of the three stage runners with a bounded-concurrency parallel runner. The matching stage uses Haiku and can safely run 5 chunks in parallel; classification and draft generation use Sonnet, which has lower per-key concurrency on the Anthropic API. Use a concurrency cap of **3** for Sonnet stages and **5** for the Haiku matching stage. These are conservative defaults; do not raise without measurement.

#### Implementation pattern

Add a small helper `runChunksWithConcurrency(chunks, runOne, concurrency)` to `app/lib/pipeline.js` that:
1. Maintains a worker pool of `concurrency` parallel slots
2. Calls `runOne(chunk, index)` for each chunk
3. Returns results in original chunk-index order (not completion order — downstream merge depends on order)
4. Propagates the first error to the caller after the pool drains in-flight work
5. Does not start new work after the first error is observed (fail-fast)

Suggested signature:
```js
export async function runChunksWithConcurrency(chunks, runOne, concurrency) {
  const results = new Array(chunks.length);
  let nextIndex = 0;
  let firstError = null;

  async function worker() {
    while (firstError === null) {
      const myIndex = nextIndex;
      nextIndex += 1;
      if (myIndex >= chunks.length) return;
      try {
        results[myIndex] = await runOne(chunks[myIndex], myIndex);
      } catch (err) {
        if (firstError === null) firstError = err;
        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, chunks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (firstError) throw firstError;
  return results;
}
```

#### Refactoring each stage runner

For each of `runMatchingChunks`, `runClassificationChunks`, `runActionGenerationChunks`:

1. Extract the **per-chunk body** (the contents of the existing `for` loop) into a local async function `runOneChunk(chunk, index)` that returns the per-chunk audit + state delta.
2. Replace the `for` loop with `runChunksWithConcurrency(chunksToRun, runOneChunk, CONCURRENCY)` where `CONCURRENCY` is `5` for matching and `3` for classification + draft generation.
3. **Critical sequencing**: `markPipelineChunkStarted` and `setStatusMessage` happen at the start of each chunk; `markPipelineChunkSucceeded` and `recordAuditEntry` happen on success; `markPipelineChunkFailed` happens on error. These must still happen but they no longer maintain a strict global order — that is fine because each call already keys by `chunkIndex`. State updates from parallel chunks may interleave; the existing `markPipeline*` reducers must be commutative on chunk-index keys. Verify this by reading their implementations in `pipeline.js` and confirming each one updates a stage-keyed map by chunk index, not an append-only list.
4. **`startIndex` semantics for retry**: the existing signature `runStage(chunks, runState, startIndex = 0)` exists for resume-from-failure. Preserve it: when `startIndex > 0`, only run `chunks.slice(startIndex)` through the parallel runner.
5. **Status messages during parallel execution**: the current "Matching chunk 3/5 (invoices 11-15)..." message describes a specific in-flight chunk. With parallel execution, multiple chunks are in flight. Replace the per-chunk status with a stage-level rolling message: `"Matching ${completed}/${total} chunks complete..."` updated as each chunk resolves.

#### What must be tested after this change

- 25/25 evals still pass: `node evals/run_evals.js`
- The retry path still works: simulate by throwing in `runOneChunk` for a specific chunk index and confirm the pipeline reports failure with the correct chunk index and the partial-result saving keeps the successful chunks
- `pipelineRunState.completedChunks` still tracks correctly (run a clean dry-run with `runPipelineDryRunValidation`)
- Order of merged results is preserved (downstream `validateAndAlignResults` will throw if not — pass means correctness)

### Optimization 2: Skip draft generation for clean rows

The draft generation stage (`runActionGenerationChunks`) currently runs on every invoice including those that classification marked as `clean` (no exception). Generating a "no action needed" draft for a clean row is wasted tokens and wasted wall-clock.

#### Change

Before invoking the action generation Claude call for each chunk, filter the chunk's payload to include only invoices whose classification result has at least one exception. Build the action-generation request body from the filtered subset. After the response returns, **rehydrate** the merged `action_results` so that every original invoice has a row: clean rows get a synthetic `{ invoice_number, drafts: [], action_summary: "No action required; matching is clean." }` entry that conforms to the action-generation schema.

#### Implementation

In `runActionGenerationChunks` per-chunk body:
1. Read the chunk's classification output from `runState.classificationChunkOutputs[index]`
2. Build a list of `exceptionInvoices = chunk.invoices.filter(invoice => isException(invoice, classificationOutput))` where `isException` returns true if the classification has any non-clean exception row for that invoice
3. If `exceptionInvoices.length === 0`: skip the Claude call entirely; produce the synthetic-clean output for every invoice in the chunk; mark chunk succeeded; record an audit entry with `model: "skipped_no_exceptions"`, `input: <empty>`, `output: <synthetic>`, `tokens: 0`. The audit entry signals that this chunk had no Claude call, which is a feature, not a bug
4. If `exceptionInvoices.length < chunk.invoices.length`: call Claude only for `exceptionInvoices`; merge the response back into the full chunk shape by adding synthetic-clean rows for the skipped invoices, in the original chunk order
5. If `exceptionInvoices.length === chunk.invoices.length`: call Claude as before, no filtering needed

The synthetic clean row schema must satisfy the existing action-generation output schema. Read `app/lib/schemas.js` for the exact shape and produce a minimal valid object. Do not invent fields.

#### What must be tested

- Run the 25-invoice golden batch. Compare draft generation token usage before and after; should drop proportional to the clean-row rate
- 25/25 evals still pass
- Synthetic clean rows render correctly in the Workbench: their `draftStatus` should show as "No drafts needed" with neutral tone, the action panel should show the synthetic summary
- Audit trail: confirm the skipped chunk audit entries are visible in the Audit & Governance surface and clearly marked

### Optimization 3: Pipeline early-start (deferred — verify first two before considering)

A more aggressive optimization is to start classification chunk 1 as soon as matching chunk 1 finishes, rather than waiting for all matching chunks to complete. This requires reworking the run state machine to track per-chunk progression across stages rather than per-stage. **Do not implement in this chunk.** It significantly complicates retry semantics and partial-result saving. Document it as future work in the handoff.

## Verification checklist

After both optimizations:

1. `node evals/run_evals.js` — must return 25/25 passing
2. `npx vite build` — must succeed with no new errors
3. `git diff --stat` — confirm changes are limited to: `app/lib/pipeline.js` (new helper), `app/ProcureGuard.jsx` (three stage runners), `app/lib/claude.js` only if a concurrency export is needed there
4. Manually trace one chunk-failure scenario in code: throw a synthetic error inside `runOneChunk` at index 2, confirm the pipeline reports correct chunk index, leaves chunks 0/1/3/4 marked succeeded, and the retry descriptor targets only chunk 2
5. **Wall-clock measurement (the actual deliverable)**: Add a `console.time("pipeline")` / `console.timeEnd("pipeline")` pair around `runPipeline()` for the duration of testing only. Run a clean analysis on the 25-invoice golden batch with a real key, capture the time. Remove the timer before commit. Document the before/after wall-clock in the handoff. Target: ≥ 50% wall-clock reduction
6. **Cost guard**: in the same test run, capture the input/output/cache-read/cache-write token counts from the runtime governance panel. Confirm total token spend is ≤ baseline (allowing rounding noise). Document in handoff
7. Visual check on the Audit & Governance surface: validate per-chunk metadata is intact, retry attempts are 0, all 5 chunks marked complete for each stage
8. Commit with message: `perf(pipeline): chunk 3.1 parallel chunk execution + skip drafts for clean rows`

## Documentation

### `docs/HANDOFF.md`

Append a Chunk 3.1 section. Include: the two optimizations, the concurrency caps chosen and why, the synthetic-clean-row schema decision, the wall-clock and token measurements (before / after), and the deferred Optimization 3.

### `progress.md`

```
Production Rework Chunk 3.1 Pipeline latency optimization completed.
Next: Chunk 3.2 storytelling redesign
```

## Skills referenced

- **systematic-debugging**: Measure before optimizing. Capture baseline wall-clock and token counts before changing anything. Add timing instrumentation, run, remove instrumentation, commit.
- **verification-before-completion**: 25/25 evals + build + manual retry trace + before/after measurement. No "should work" claims.
- **research-before-build**: If the Anthropic API has documented per-key concurrency caps for Haiku 4.5 and Sonnet 4.6, verify the chosen 5/3 caps against current docs. Cite the source URL in the handoff.
- **handoff-summary**: Document optimizations, measurements, deferred work.

## Anti-patterns

- Do not raise concurrency above 5 for Haiku or 3 for Sonnet without empirical data
- Do not change retry attempt counts, retry delays, or backoff
- Do not change prompt caching or Structured Outputs configuration
- Do not change the chunk size of 5 invoices in this chunk (separate optimization)
- Do not implement Optimization 3 (pipeline early-start) in this chunk
- Do not assume "skip drafts for clean rows" applies to rows with any exception, even Tier 1; only invoices with zero classified exceptions skip the call
- Do not silently drop audit entries for skipped chunks — synthetic audit entries are required so reviewers see the skip
