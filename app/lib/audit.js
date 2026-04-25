const CSV_HEADERS = [
  "timestamp",
  "step",
  "model",
  "input_hash",
  "invoice_count",
  "exception_count",
  "tier_breakdown",
  "latency_ms",
  "prompt_version"
];

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashInput(input) {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(digest);
}

export function summarizeOutput(step, output) {
  if (step === "matching") {
    const results = output?.results ?? [];
    return {
      invoice_count: results.length,
      exception_count: results.filter((item) => (item.detected_exceptions ?? []).length > 0).length,
      tier_breakdown: null
    };
  }

  if (step === "classification") {
    const classifications = output?.classifications ?? [];
    return {
      invoice_count: classifications.length,
      exception_count: classifications.filter((item) => (item.detected_exceptions ?? []).length > 0).length,
      tier_breakdown: classifications.reduce((acc, item) => {
        const tier = `tier_${item.overall_tier ?? "unknown"}`;
        acc[tier] = (acc[tier] ?? 0) + 1;
        return acc;
      }, {})
    };
  }

  const actions = output?.action_results ?? [];
  return {
    invoice_count: actions.length,
    exception_count: actions.reduce((sum, item) => sum + (item.actions ?? []).length, 0),
    tier_breakdown: actions.reduce((acc, item) => {
      const tier = `tier_${item.overall_tier ?? "unknown"}`;
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    }, {})
  };
}

export async function createAuditEntry({ step, model, input, output, tokenUsage, latencyMs, promptVersion }) {
  return {
    timestamp: new Date().toISOString(),
    step,
    model,
    input_hash: await hashInput(input),
    output_summary: summarizeOutput(step, output),
    token_usage: tokenUsage ?? null,
    latency_ms: latencyMs,
    prompt_version: promptVersion
  };
}

function csvValue(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

export function exportAuditCsv(entries) {
  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.step,
    entry.model,
    entry.input_hash,
    entry.output_summary?.invoice_count ?? "",
    entry.output_summary?.exception_count ?? "",
    entry.output_summary?.tier_breakdown ?? "",
    entry.latency_ms,
    entry.prompt_version
  ]);

  return [CSV_HEADERS, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}
