import { buildStructuredOutputConfig } from "./schemas.js";

const API_URL = "/api/messages";
const MATCHING_TIMEOUT_MS = 60000;
const CLASSIFICATION_TIMEOUT_MS = 120000;
const ACTION_GENERATION_TIMEOUT_MS = 120000;
const DEFAULT_CLAUDE_TIMEOUT_MS = 120000;
const CLAUDE_TIMEOUTS_BY_STAGE = {
  matching: MATCHING_TIMEOUT_MS,
  classification: CLASSIFICATION_TIMEOUT_MS,
  action_generation: ACTION_GENERATION_TIMEOUT_MS
};
const MAX_ATTEMPTS = 3;
export const DEFAULT_MAX_TOKENS = 8192;
const MIN_SAFE_MAX_TOKENS = 256;
const MAX_SAFE_MAX_TOKENS = 8192;
const DIRECT_BROWSER_ACCESS_ERROR = "CORS requests must set 'anthropic-dangerous-direct-browser-access' header";
const DIRECT_BROWSER_ACCESS_HELP =
  "Anthropic rejected the browser/proxy request because the direct-browser-access header was missing. Restart the dev server and try again.";
const STRUCTURED_OUTPUT_SHAPE_ERROR = ["output_config", "type: Extra inputs are not permitted"].join(".");
const STRUCTURED_OUTPUT_SHAPE_HELP =
  "Anthropic rejected the structured-output request shape. The app now uses output_config.format. Restart the dev server and try again.";
const STRICT_SCHEMA_ERROR_HELP =
  "Anthropic rejected the structured-output schema because object schemas must disallow extra fields. The app now sends strict schemas with additionalProperties: false.";
const NUMERIC_CONSTRAINT_ERROR_HELP =
  "Anthropic rejected the schema because number types do not support minimum/maximum/multipleOf constraints. The app now strips these automatically. Restart the dev server and try again.";
const MAX_TOKENS_HELP =
  "Claude reached the output token limit before completing structured JSON. The app analyzes invoices in smaller chunks to reduce output size. Retry the analysis.";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function safePreview(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

function userFacingApiError(message) {
  const text = String(message ?? "");
  if (text.includes(DIRECT_BROWSER_ACCESS_ERROR)) {
    return DIRECT_BROWSER_ACCESS_HELP;
  }
  if (text.includes(STRUCTURED_OUTPUT_SHAPE_ERROR)) {
    return STRUCTURED_OUTPUT_SHAPE_HELP;
  }
  if (text.includes("additionalProperties")) {
    return STRICT_SCHEMA_ERROR_HELP;
  }
  if ((text.includes("minimum") || text.includes("maximum") || text.includes("multipleOf")) && text.includes("not supported")) {
    return NUMERIC_CONSTRAINT_ERROR_HELP;
  }
  return text;
}

function normalizeTimeoutMs(timeoutMs) {
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Math.round(timeoutMs);
  }
  return DEFAULT_CLAUDE_TIMEOUT_MS;
}

function resolveClaudeTimeoutMs({ stage, timeoutMs } = {}) {
  if (CLAUDE_TIMEOUTS_BY_STAGE[stage]) {
    return CLAUDE_TIMEOUTS_BY_STAGE[stage];
  }
  if (timeoutMs !== undefined) {
    return normalizeTimeoutMs(timeoutMs);
  }
  return DEFAULT_CLAUDE_TIMEOUT_MS;
}

function stageTimeoutLabel(stage) {
  return {
    matching: "matching",
    classification: "classification",
    action_generation: "action generation"
  }[stage] ?? "the request";
}

function timeoutMessage(stage, timeoutMs) {
  const seconds = Math.ceil(normalizeTimeoutMs(timeoutMs) / 1000);
  return `Claude timed out while processing ${stageTimeoutLabel(stage)} after ${seconds} seconds. Retry the analysis. If this repeats, reduce batch size or try again later.`;
}

function timeoutSignal(timeoutMs) {
  const safeTimeoutMs = normalizeTimeoutMs(timeoutMs);
  if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    return AbortSignal.timeout(safeTimeoutMs);
  }

  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), safeTimeoutMs);
  return controller.signal;
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractJsonText(data) {
  if (!data || typeof data !== "object") return null;
  if (Array.isArray(data)) return data;
  if (data.results || data.classifications || data.action_results) return data;
  if (!Array.isArray(data.content)) return null;

  for (const block of data.content) {
    if (block?.type === "text" && typeof block.text === "string") {
      return block.text;
    }
    if (block?.type === "json" && block.json) {
      return block.json;
    }
    if (block?.input && typeof block.input === "object") {
      return block.input;
    }
  }

  return null;
}

function parseStructuredOutput(rawData) {
  const extracted = extractJsonText(rawData);
  if (extracted && typeof extracted === "object") return extracted;

  if (typeof extracted === "string") {
    try {
      return JSON.parse(stripCodeFence(extracted));
    } catch {
      throw new Error(`Claude returned text that was not valid JSON: ${safePreview(extracted)}`);
    }
  }

  const preview = safePreview(JSON.stringify(rawData));
  if (!rawData?.content) {
    throw new Error(`Claude response did not include content blocks with structured JSON: ${preview}`);
  }
  throw new Error(`Claude response content did not include valid structured JSON text: ${preview}`);
}

function refusalFromResponse(data) {
  if (data?.stop_reason === "refusal") return "Claude refused the request";
  const refusalBlock = data?.content?.find((block) => block?.type === "refusal");
  return refusalBlock ? "Claude refused the request" : null;
}

function normalizeMaxTokens(maxTokens = DEFAULT_MAX_TOKENS) {
  if (!Number.isInteger(maxTokens)) {
    throw new Error("maxTokens must be an integer");
  }
  if (maxTokens < MIN_SAFE_MAX_TOKENS || maxTokens > MAX_SAFE_MAX_TOKENS) {
    throw new Error(`maxTokens must be between ${MIN_SAFE_MAX_TOKENS} and ${MAX_SAFE_MAX_TOKENS}`);
  }
  return maxTokens;
}

export function buildClaudeRequestBody({ systemPrompt, userMessage, model, schema, maxTokens = DEFAULT_MAX_TOKENS }) {
  return {
    model,
    max_tokens: normalizeMaxTokens(maxTokens),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    output_config: buildStructuredOutputConfig(schema)
  };
}

export async function callClaudeAPI({
  systemPrompt,
  userMessage,
  model,
  schema,
  apiKey,
  maxTokens = DEFAULT_MAX_TOKENS,
  stage,
  timeoutMs,
  onRetry
}) {
  const startedAt = performance.now();
  const headers = {
    "content-type": "application/json",
    "anthropic-version": "2023-06-01"
  };

  if (import.meta.env.DEV && apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const body = buildClaudeRequestBody({ systemPrompt, userMessage, model, schema, maxTokens });
  const requestTimeoutMs = resolveClaudeTimeoutMs({ stage, timeoutMs });

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: timeoutSignal(requestTimeoutMs)
      });

      const responseText = await response.text();

      if (response.status === 429 && attempt < MAX_ATTEMPTS) {
        const delayMs = 750 * 2 ** (attempt - 1);
        onRetry?.({ attempt, delayMs });
        await wait(delayMs);
        continue;
      }

      if (response.status === 429) {
        throw new Error("Claude API rate limit persisted after 3 attempts");
      }

      if (!response.ok) {
        let errorMessage = `Claude API request failed with status ${response.status}`;
        try {
          const errorBody = JSON.parse(responseText);
          if (errorBody?.error?.message) errorMessage = errorBody.error.message;
          if (typeof errorBody?.error === "string") errorMessage = errorBody.error;
        } catch {
          if (responseText) errorMessage = `${errorMessage}: ${safePreview(responseText)}`;
        }

        if (response.status === 401) {
          throw new Error("Claude API authentication failed. Check the API key and try again.");
        }

        throw new Error(userFacingApiError(errorMessage));
      }

      let raw;
      try {
        raw = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Claude API response was not valid JSON: ${safePreview(responseText)}`);
      }

      const refusal = refusalFromResponse(raw);
      if (refusal) throw new Error(refusal);
      if (raw?.stop_reason === "max_tokens") {
        throw new Error(MAX_TOKENS_HELP);
      }

      return {
        data: parseStructuredOutput(raw),
        raw,
        token_usage: raw.usage ?? null,
        latency_ms: Math.round(performance.now() - startedAt),
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      const errorName = String(error?.name ?? "");
      const errorMessage = String(error?.message ?? "").toLowerCase();
      if (errorName === "AbortError" || errorName === "TimeoutError" || errorMessage.includes("timeout")) {
        throw new Error(timeoutMessage(stage, requestTimeoutMs));
      }
      if (attempt === MAX_ATTEMPTS || !String(error?.message).includes("429")) {
        break;
      }
    }
  }

  if (String(lastError?.message).includes("429")) {
    throw new Error("Claude API rate limit persisted after 3 attempts");
  }

  if (String(lastError?.message).includes(DIRECT_BROWSER_ACCESS_ERROR)) {
    throw new Error(DIRECT_BROWSER_ACCESS_HELP);
  }

  if (String(lastError?.message).includes(STRUCTURED_OUTPUT_SHAPE_ERROR)) {
    throw new Error(STRUCTURED_OUTPUT_SHAPE_HELP);
  }

  if (lastError instanceof TypeError) {
    throw new Error("Network error while contacting Claude API");
  }

  throw lastError ?? new Error("Claude API request failed");
}
