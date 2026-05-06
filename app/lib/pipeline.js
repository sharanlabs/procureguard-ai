export const DEFAULT_ANALYSIS_CHUNK_SIZE = 25;
export const PIPELINE_STAGES = ["matching", "classification", "action_generation"];

const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]+/i,
  /AIza[0-9A-Za-z_-]{20,}/i,
  /ANTHROPIC_API_KEY/i,
  /GEMINI_API_KEY/i,
  /x-api-key/i
];
const STAGE_OUTPUT_KEYS = {
  matching: "matchingChunkOutputs",
  classification: "classificationChunkOutputs",
  action_generation: "actionGenerationChunkOutputs"
};
const STAGE_MERGED_KEYS = {
  matching: "mergedMatchingResults",
  classification: "mergedClassificationResults",
  action_generation: "mergedActionResults"
};

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyStageMap() {
  return PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = [];
    return acc;
  }, {});
}

function copyStageMap(value = {}) {
  return PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = [...(value[stage] ?? [])];
    return acc;
  }, {});
}

function copyRunState(runState) {
  return {
    ...runState,
    completedChunks: copyStageMap(runState?.completedChunks),
    retryAttempts: copyStageMap(runState?.retryAttempts),
    matchingChunkOutputs: [...(runState?.matchingChunkOutputs ?? [])],
    classificationChunkOutputs: [...(runState?.classificationChunkOutputs ?? [])],
    actionGenerationChunkOutputs: [...(runState?.actionGenerationChunkOutputs ?? [])]
  };
}

function clearFailureFields(runState) {
  return {
    ...runState,
    failedStage: null,
    failedChunkIndex: null,
    failedInvoiceRange: "",
    failedMessage: "",
    failureType: null,
    retryable: false,
    retryDescriptor: null
  };
}

function completedChunkCount(runState, stage) {
  return (runState?.completedChunks?.[stage] ?? []).filter(Boolean).length;
}

function hasCompletedChunks(runState) {
  return PIPELINE_STAGES.some((stage) => completedChunkCount(runState, stage) > 0);
}

function failureTypeFromMessage(message) {
  const text = String(message ?? "");
  const lower = text.toLowerCase();

  if (lower.includes("timed out") || lower.includes("timeout")) return "timeout";
  if (lower.includes("429") || lower.includes("rate limit")) return "rate_limit";
  if (lower.includes("network") || lower.includes("unable to reach")) return "network";
  if (lower.includes("max token") || lower.includes("output token limit")) return "max_tokens";
  if (lower.includes("status 500") || lower.includes("status 502") || lower.includes("status 503") || lower.includes("status 504") || lower.includes("overloaded")) return "api";
  if (
    (lower.includes("returned") && lower.includes("expected")) ||
    lower.includes("missing a result array") ||
    lower.includes("without invoice_number") ||
    lower.includes("out of order") ||
    lower.includes("duplicate invoice") ||
    (lower.includes("missing") && lower.includes("unexpected")) ||
    lower.includes("omitted non-clean invoice") ||
    lower.includes("unexpected invoice")
  ) {
    return "validation";
  }
  if (
    lower.includes("structured-output") ||
    lower.includes("output_config") ||
    lower.includes("additionalproperties") ||
    lower.includes("schema") ||
    lower.includes("authentication") ||
    lower.includes("api key") ||
    lower.includes("not valid json") ||
    lower.includes("valid structured json") ||
    lower.includes("content blocks") ||
    lower.includes("missing required input")
  ) {
    return "api";
  }

  return "unknown";
}

function isRetryableFailureType(failureType, message) {
  if (["timeout", "network", "rate_limit"].includes(failureType)) return true;
  if (failureType === "api") {
    const lower = String(message ?? "").toLowerCase();
    return lower.includes("status 500") || lower.includes("status 502") || lower.includes("status 503") || lower.includes("status 504") || lower.includes("overloaded");
  }
  return false;
}

function chunkRetryStatus(attempt, success) {
  if (attempt <= 1) return success ? "initial_success" : "initial_failed";
  return success ? "retry_success" : "retry_failed";
}

function invoiceNumber(row) {
  return row?.invoice_number ? String(row.invoice_number) : "";
}

function resultRows(resultShape) {
  if (Array.isArray(resultShape?.results)) return { key: "results", rows: resultShape.results };
  if (Array.isArray(resultShape?.classifications)) return { key: "classifications", rows: resultShape.classifications };
  if (Array.isArray(resultShape?.action_results)) return { key: "action_results", rows: resultShape.action_results };
  return { key: null, rows: null };
}

function withRows(resultShape, key, rows) {
  if (!key) throw new Error("Result shape is missing a known result array");
  return {
    ...resultShape,
    [key]: rows
  };
}

function hasDuplicateValues(values) {
  return new Set(values).size !== values.length;
}

function normalizeExceptionList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function addException(row, code, message) {
  const detected = normalizeExceptionList(row.detected_exceptions);
  if (!detected.includes(code)) {
    row.detected_exceptions = [...detected, code];
    row.match_status = code === "E11" ? "no_po_match" : "exception_detected";
    row.reasoning = row.reasoning ? `${row.reasoning} ${message}` : message;
  }
}

function createInvoiceNumberOccurrences(allInvoices) {
  const groups = new Map();
  allInvoices.forEach((invoice, index) => {
    const number = invoiceNumber(invoice);
    if (!number) return;
    if (!groups.has(number)) {
      groups.set(number, {
        invoice_number: number,
        count: 0,
        first_row: index + 1,
        rows: []
      });
    }
    const group = groups.get(number);
    group.count += 1;
    group.rows.push(index + 1);
  });
  return [...groups.values()];
}

function isLaterDuplicate(invoice, allInvoices) {
  const number = invoiceNumber(invoice);
  if (!number) return false;
  const firstIndex = allInvoices.findIndex((row) => invoiceNumber(row) === number);
  const currentIndex = allInvoices.findIndex((row, index) => (
    index >= firstIndex &&
    row === invoice
  ));
  return currentIndex > firstIndex;
}

export function assertNoApiKeyLeak(value) {
  const text = JSON.stringify(value ?? "");
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error("Sensitive API key material was detected in a pipeline object");
    }
  }
}

export function chunkInvoices(invoices = [], chunkSize = DEFAULT_ANALYSIS_CHUNK_SIZE) {
  if (!Array.isArray(invoices)) throw new Error("invoices must be an array");
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error("chunkSize must be a positive integer");
  }

  const chunks = [];
  for (let index = 0; index < invoices.length; index += chunkSize) {
    chunks.push(invoices.slice(index, index + chunkSize).map((invoice, offset) => ({
      invoice,
      originalIndex: index + offset
    })));
  }
  return chunks;
}

export function getInvoiceRangeLabel(chunk, chunkIndex = 0) {
  if (!Array.isArray(chunk) || chunk.length === 0) return "0-0";
  const start = (chunk[0]?.originalIndex ?? chunkIndex * chunk.length) + 1;
  const end = (chunk[chunk.length - 1]?.originalIndex ?? start - 1) + 1;
  return `${start}-${end}`;
}

export function buildChunkContext(parsedFiles, invoiceChunk, allInvoices = parsedFiles?.invoices ?? []) {
  const invoices = invoiceChunk.map((item) => item.invoice);
  const poReferences = new Set(invoices.map((invoice) => invoice.po_reference).filter(Boolean));
  const itemCodes = new Set(invoices.map((invoice) => invoice.item_code).filter(Boolean));
  const purchaseOrders = parsedFiles?.purchase_orders ?? [];
  const goodsReceipts = parsedFiles?.goods_receipts ?? [];
  const occurrences = createInvoiceNumberOccurrences(allInvoices);

  return {
    purchase_orders: purchaseOrders.filter((po) => poReferences.has(po.po_number)),
    invoices,
    goods_receipts: goodsReceipts.filter((grn) => (
      poReferences.has(grn.po_reference) &&
      (!itemCodes.size || itemCodes.has(grn.item_code))
    )),
    duplicate_invoice_numbers: occurrences.filter((item) => item.count > 1).map((item) => item.invoice_number),
    invoice_number_occurrences: occurrences,
    all_purchase_order_numbers: purchaseOrders.map((po) => po.po_number).filter(Boolean),
    original_invoice_indexes: invoiceChunk.map((item) => item.originalIndex),
    all_invoices: allInvoices
  };
}

export function applyGlobalMatchingGuards(chunkContext, matchingResults) {
  const guarded = cloneJson(matchingResults);
  const rows = guarded.results ?? [];
  const poNumbers = new Set(chunkContext.all_purchase_order_numbers ?? []);
  const allInvoices = chunkContext.all_invoices ?? [];

  rows.forEach((row, index) => {
    const invoice = chunkContext.invoices[index] ?? {};
    if (invoice.po_reference && !poNumbers.has(invoice.po_reference)) {
      row.po_number = null;
      addException(row, "E11", "Global PO reference check found no matching PO in the uploaded purchase order file.");
    }
    if (isLaterDuplicate(invoice, allInvoices)) {
      addException(row, "E07", "Global invoice-number check found this is a later duplicate invoice row.");
    }
  });

  return guarded;
}

export function validateChunkCount(stage, expectedCount, actualCount, rangeLabel) {
  if (expectedCount !== actualCount) {
    throw new Error(`${stage} returned ${actualCount} result(s) for invoices ${rangeLabel}; expected ${expectedCount}`);
  }
}

export function validateAndAlignResults(stage, expectedInvoices, resultShape, rangeLabel = "all invoices") {
  const { key, rows } = resultRows(resultShape);
  if (!key || !Array.isArray(rows)) {
    throw new Error(`${stage} response for invoices ${rangeLabel} is missing a result array`);
  }

  validateChunkCount(stage, expectedInvoices.length, rows.length, rangeLabel);

  const expectedNumbers = expectedInvoices.map(invoiceNumber);
  const rowNumbers = rows.map(invoiceNumber);
  if (rowNumbers.some((number) => !number)) {
    throw new Error(`${stage} response for invoices ${rangeLabel} included a row without invoice_number`);
  }

  const directOrder = expectedNumbers.every((number, index) => number === rowNumbers[index]);
  if (directOrder) return withRows(resultShape, key, rows);

  if (hasDuplicateValues(expectedNumbers) || hasDuplicateValues(rowNumbers)) {
    throw new Error(`${stage} response for invoices ${rangeLabel} is out of order and duplicate invoice numbers prevent safe reordering`);
  }

  const rowByInvoice = new Map(rows.map((row) => [invoiceNumber(row), row]));
  const missing = expectedNumbers.filter((number) => !rowByInvoice.has(number));
  const extra = rowNumbers.filter((number) => !expectedNumbers.includes(number));
  if (missing.length || extra.length) {
    throw new Error(`${stage} response for invoices ${rangeLabel} is missing ${missing.join(", ") || "none"} and includes unexpected ${extra.join(", ") || "none"}`);
  }

  return withRows(resultShape, key, expectedNumbers.map((number) => rowByInvoice.get(number)));
}

export function validateMergedResults(expectedInvoices, mergedResults, stage = "merged results") {
  return validateAndAlignResults(stage, expectedInvoices, mergedResults, "all invoices");
}

export function mergeMatchingChunks(chunks) {
  return { results: chunks.flatMap((chunk) => chunk?.results ?? []) };
}

export function mergeClassificationChunks(chunks) {
  return { classifications: chunks.flatMap((chunk) => chunk?.classifications ?? []) };
}

export function mergeActionChunks(chunks) {
  return { action_results: chunks.flatMap((chunk) => chunk?.action_results ?? []) };
}

export function createIdlePipelineRunState() {
  return {
    runId: null,
    status: "idle",
    currentStage: null,
    currentChunkIndex: null,
    totalChunks: 0,
    failedStage: null,
    failedChunkIndex: null,
    failedInvoiceRange: "",
    failedMessage: "",
    failureType: null,
    retryable: false,
    runStartedAt: null,
    runCompletedAt: null,
    totalLatencyMs: null,
    completedChunks: emptyStageMap(),
    retryAttempts: emptyStageMap(),
    matchingChunkOutputs: [],
    classificationChunkOutputs: [],
    actionGenerationChunkOutputs: [],
    mergedMatchingResults: null,
    mergedClassificationResults: null,
    mergedActionResults: null,
    finalResultsComplete: false,
    retryDescriptor: null
  };
}

export function createPipelineRunState({ runId, totalChunks = 0 } = {}) {
  const startedAtMs = Date.now();
  return {
    ...createIdlePipelineRunState(),
    runId,
    status: "running",
    totalChunks,
    runStartedAt: new Date(startedAtMs).toISOString(),
    runStartedAtMs: startedAtMs
  };
}

export function getPipelineStageOutputs(runState, stage) {
  const key = STAGE_OUTPUT_KEYS[stage];
  return key ? [...(runState?.[key] ?? [])] : [];
}

export function mergeCompletedPipelineStage(runState, stage) {
  const chunks = getPipelineStageOutputs(runState, stage).filter(Boolean);
  if (!chunks.length) return null;
  if (stage === "matching") return mergeMatchingChunks(chunks);
  if (stage === "classification") return mergeClassificationChunks(chunks);
  if (stage === "action_generation") return mergeActionChunks(chunks);
  return null;
}

export function getPipelineCompletedSummary(runState) {
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    completed: completedChunkCount(runState, stage),
    total: runState?.totalChunks ?? 0
  }));
}

export function classifyPipelineFailure(error) {
  const message = String(error?.message ?? error ?? "Pipeline stage failed");
  const failureType = error?.failureType ?? failureTypeFromMessage(message);
  const retryable = typeof error?.retryable === "boolean"
    ? error.retryable
    : isRetryableFailureType(failureType, message);

  return {
    failureType,
    retryable,
    message
  };
}

export function buildFailedChunkDescriptor({ stage, chunkIndex, totalChunks, chunkMeta, error }) {
  const classified = classifyPipelineFailure(error);
  return {
    stage,
    chunkIndex: chunkIndex + 1,
    totalChunks,
    invoiceRange: chunkMeta?.invoice_range ?? "",
    invoiceCount: chunkMeta?.invoice_count ?? 0,
    failureType: classified.failureType,
    message: classified.message,
    userMessage: `Analysis stopped at ${stage} batch ${chunkIndex + 1}/${totalChunks} for invoices ${chunkMeta?.invoice_range ?? "unknown"}: ${classified.message}`,
    retryable: classified.retryable
  };
}

export function markPipelineRetryStarted(runState, descriptor) {
  return clearFailureFields({
    ...copyRunState(runState),
    status: "running",
    currentStage: descriptor?.stage ?? runState?.currentStage ?? null,
    currentChunkIndex: descriptor?.chunkIndex ?? runState?.currentChunkIndex ?? null,
    finalResultsComplete: false
  });
}

export function markPipelineChunkStarted(runState, { stage, chunkIndex, chunkMeta }) {
  const next = clearFailureFields({
    ...copyRunState(runState),
    status: "running",
    currentStage: stage,
    currentChunkIndex: chunkIndex + 1,
    finalResultsComplete: false
  });
  const attempt = (next.retryAttempts[stage]?.[chunkIndex] ?? 0) + 1;
  next.retryAttempts[stage][chunkIndex] = attempt;

  return {
    runState: next,
    attempt,
    auditChunk: {
      ...chunkMeta,
      attempt,
      retry_count: Math.max(0, attempt - 1),
      retry_status: attempt > 1 ? "retrying" : "initial"
    }
  };
}

export function markPipelineChunkSucceeded(runState, { stage, chunkIndex, chunkMeta, output, attempt }) {
  const next = clearFailureFields({
    ...copyRunState(runState),
    status: "running",
    currentStage: stage,
    currentChunkIndex: chunkIndex + 1,
    finalResultsComplete: false
  });
  const outputKey = STAGE_OUTPUT_KEYS[stage];
  if (!outputKey) throw new Error(`Unknown pipeline stage ${stage}`);

  const safeAttempt = attempt ?? next.retryAttempts[stage]?.[chunkIndex] ?? 1;
  next[outputKey][chunkIndex] = output;
  next.completedChunks[stage][chunkIndex] = {
    ...chunkMeta,
    attempt: safeAttempt,
    retry_count: Math.max(0, safeAttempt - 1),
    retry_status: chunkRetryStatus(safeAttempt, true),
    completed_at: new Date().toISOString()
  };
  return next;
}

export function markPipelineStageMerged(runState, { stage, merged }) {
  const mergedKey = STAGE_MERGED_KEYS[stage];
  if (!mergedKey) throw new Error(`Unknown pipeline stage ${stage}`);
  return {
    ...clearFailureFields(copyRunState(runState)),
    status: "running",
    currentStage: stage,
    currentChunkIndex: runState?.totalChunks ?? null,
    [mergedKey]: merged,
    finalResultsComplete: false
  };
}

export function markPipelineChunkFailed(runState, { stage, chunkIndex, chunkMeta, error, attempt }) {
  const next = copyRunState(runState);
  const descriptor = buildFailedChunkDescriptor({
    stage,
    chunkIndex,
    totalChunks: next.totalChunks,
    chunkMeta,
    error
  });
  const safeAttempt = attempt ?? next.retryAttempts[stage]?.[chunkIndex] ?? 1;

  next.status = hasCompletedChunks(next) ? "partial_failed" : "failed";
  next.currentStage = stage;
  next.currentChunkIndex = chunkIndex + 1;
  next.failedStage = stage;
  next.failedChunkIndex = chunkIndex + 1;
  next.failedInvoiceRange = descriptor.invoiceRange;
  next.failedMessage = descriptor.message;
  next.failureType = descriptor.failureType;
  next.retryable = descriptor.retryable;
  next.finalResultsComplete = false;
  next.retryDescriptor = {
    ...descriptor,
    attempt: safeAttempt,
    retryCount: Math.max(0, safeAttempt - 1),
    retryStatus: chunkRetryStatus(safeAttempt, false)
  };

  return next;
}

export function markPipelineComplete(runState) {
  const completedAtMs = Date.now();
  const startedAtMs = Number.isFinite(runState?.runStartedAtMs) ? runState.runStartedAtMs : completedAtMs;
  return {
    ...clearFailureFields(copyRunState(runState)),
    status: "complete",
    currentStage: null,
    currentChunkIndex: null,
    finalResultsComplete: true,
    runCompletedAt: new Date(completedAtMs).toISOString(),
    totalLatencyMs: Math.max(0, completedAtMs - startedAtMs)
  };
}

export function createDefaultActionResult(invoice, classification) {
  return {
    invoice_number: invoice.invoice_number,
    overall_tier: classification?.overall_tier ?? 1,
    actions: [],
    audit_entry: {
      timestamp_placeholder: "not_generated_clean_invoice",
      prompt_version: "03_action_generation_v1",
      action_count: 0
    }
  };
}

export function normalizeActionChunkResults(expectedInvoices, actionResults, classificationResults, rangeLabel) {
  const rows = actionResults?.action_results ?? [];
  if (rows.length === expectedInvoices.length) {
    return validateAndAlignResults("action_generation", expectedInvoices, actionResults, rangeLabel);
  }

  const rowNumbers = rows.map(invoiceNumber);
  const rowQueuesByInvoice = new Map();
  rows.forEach((row) => {
    const number = invoiceNumber(row);
    if (!number) return;
    if (!rowQueuesByInvoice.has(number)) rowQueuesByInvoice.set(number, []);
    rowQueuesByInvoice.get(number).push(row);
  });
  const classifications = classificationResults?.classifications ?? [];
  const normalizedRows = expectedInvoices.map((invoice, index) => {
    const number = invoiceNumber(invoice);
    const classification = classifications[index];
    const isClean = (classification?.detected_exceptions ?? []).length === 0;
    if (isClean) return createDefaultActionResult(invoice, classification);

    const rowQueue = rowQueuesByInvoice.get(number) ?? [];
    const row = rowQueue.shift();
    if (row) return row;

    throw new Error(`action_generation omitted non-clean invoice ${number} for invoices ${rangeLabel}`);
  });
  const unusedRows = [...rowQueuesByInvoice.values()].flat().map(invoiceNumber);
  if (unusedRows.length) {
    throw new Error(`action_generation returned unused invoice row(s) for invoices ${rangeLabel}: ${unusedRows.join(", ")}`);
  }
  const unexpected = rowNumbers.filter((number) => !expectedInvoices.some((invoice) => invoiceNumber(invoice) === number));
  if (unexpected.length) {
    throw new Error(`Communication preparation returned unexpected invoices for range ${rangeLabel}: ${unexpected.join(", ")}`);
  }

  return { action_results: normalizedRows };
}

export function runPipelineDryRunValidation(invoiceCount = 25, chunkSize = DEFAULT_ANALYSIS_CHUNK_SIZE) {
  const invoices = Array.from({ length: invoiceCount }, (_, index) => ({
    invoice_number: `INV-${String(index + 1).padStart(4, "0")}`,
    po_reference: `PO-${String(index + 1).padStart(3, "0")}`,
    item_code: `ITEM-${String(index + 1).padStart(3, "0")}`
  }));
  const chunks = chunkInvoices(invoices, chunkSize);
  const matchingChunks = chunks.map((chunk) => ({
    results: chunk.map(({ invoice }) => ({
      invoice_number: invoice.invoice_number,
      detected_exceptions: [],
      confidence: 0.99
    }))
  }));
  const classificationChunks = chunks.map((chunk) => ({
    classifications: chunk.map(({ invoice }) => ({
      invoice_number: invoice.invoice_number,
      detected_exceptions: [],
      overall_tier: 1
    }))
  }));
  const actionChunks = chunks.map((chunk) => ({
    action_results: chunk.map(({ invoice }) => ({
      invoice_number: invoice.invoice_number,
      overall_tier: 1,
      actions: [],
      audit_entry: {
        timestamp_placeholder: "dry_run",
        prompt_version: "03_action_generation_v1",
        action_count: 0
      }
    }))
  }));

  const matching = validateMergedResults(invoices, mergeMatchingChunks(matchingChunks), "dry-run matching");
  const classification = validateMergedResults(invoices, mergeClassificationChunks(classificationChunks), "dry-run classification");
  const actions = validateMergedResults(invoices, mergeActionChunks(actionChunks), "dry-run action_generation");
  assertNoApiKeyLeak({ matching, classification, actions, audit: { chunk_count: chunks.length } });

  return {
    invoice_count: invoices.length,
    chunk_count: chunks.length,
    chunk_sizes: chunks.map((chunk) => chunk.length),
    matching_count: matching.results.length,
    classification_count: classification.classifications.length,
    action_count: actions.action_results.length
  };
}

export async function runChunksWithConcurrency(items, runOne, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let firstError = null;

  async function worker() {
    while (firstError === null) {
      const myIndex = nextIndex;
      nextIndex += 1;
      if (myIndex >= items.length) return;
      try {
        results[myIndex] = await runOne(items[myIndex], myIndex);
      } catch (err) {
        if (firstError === null) firstError = err;
        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (firstError) throw firstError;
  return results;
}
