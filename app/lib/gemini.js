import { normalizeStructuredOutputSchema } from "./schemas.js";

const API_URL = "/api/messages";
const MATCHING_TIMEOUT_MS = 60000;
const CLASSIFICATION_TIMEOUT_MS = 120000;
const ACTION_GENERATION_TIMEOUT_MS = 120000;
const DEFAULT_GEMINI_TIMEOUT_MS = 120000;
const GEMINI_TIMEOUTS_BY_STAGE = {
  matching: MATCHING_TIMEOUT_MS,
  classification: CLASSIFICATION_TIMEOUT_MS,
  action_generation: ACTION_GENERATION_TIMEOUT_MS
};
const MAX_ATTEMPTS = 4;
export const DEFAULT_MAX_TOKENS = 32768;
const MIN_SAFE_MAX_TOKENS = 256;
const MAX_SAFE_MAX_TOKENS = 65536;
const MIN_REQUEST_SPACING_MS = 12000;
const RATE_LIMIT_BASE_DELAY_MS = 65000;
const MAX_RATE_LIMIT_DELAY_MS = 120000;
const THINKING_BUDGET_BY_STAGE = {
  matching: 512,
  classification: 1024,
  action_generation: 1024
};
const MAX_TOKENS_HELP =
  "The analysis service reached the output limit before completing structured results. Restart the analysis so the run can use smaller, safer invoice batches.";
let nextAllowedRequestAt = 0;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function reserveProviderQuietPeriod(delayMs = 0) {
  const safeDelayMs = Number.isFinite(delayMs) && delayMs > 0 ? Math.round(delayMs) : 0;
  nextAllowedRequestAt = Math.max(nextAllowedRequestAt, Date.now() + safeDelayMs + MIN_REQUEST_SPACING_MS);
}

async function waitForProviderSlot() {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextAllowedRequestAt);
  nextAllowedRequestAt = scheduledAt + MIN_REQUEST_SPACING_MS;
  if (scheduledAt > now) {
    await wait(scheduledAt - now);
  }
}

function safePreview(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .slice(0, 220);
}

function geminiError(message, metadata = {}) {
  const error = new Error(message);
  Object.assign(error, metadata);
  return error;
}

function normalizeTimeoutMs(timeoutMs) {
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return Math.round(timeoutMs);
  }
  return DEFAULT_GEMINI_TIMEOUT_MS;
}

function resolveGeminiTimeoutMs({ stage, timeoutMs } = {}) {
  if (GEMINI_TIMEOUTS_BY_STAGE[stage]) {
    return GEMINI_TIMEOUTS_BY_STAGE[stage];
  }
  if (timeoutMs !== undefined) {
    return normalizeTimeoutMs(timeoutMs);
  }
  return DEFAULT_GEMINI_TIMEOUT_MS;
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
  return `The analysis service timed out while processing ${stageTimeoutLabel(stage)} after ${seconds} seconds. Retry the analysis. If this repeats, reduce batch size or try again later.`;
}

function retryDelayMs(attempt) {
  return 2000 * 2 ** (attempt - 1);
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

function normalizeMaxTokens(maxTokens = DEFAULT_MAX_TOKENS) {
  if (!Number.isInteger(maxTokens)) {
    throw new Error("maxTokens must be an integer");
  }
  if (maxTokens < MIN_SAFE_MAX_TOKENS || maxTokens > MAX_SAFE_MAX_TOKENS) {
    throw new Error(`maxTokens must be between ${MIN_SAFE_MAX_TOKENS} and ${MAX_SAFE_MAX_TOKENS}`);
  }
  return maxTokens;
}

function buildGeminiTextParts(text) {
  return [{ text: String(text ?? "") }];
}

export function buildGeminiRequestBody({ systemPrompt, userMessage, schema, maxTokens = DEFAULT_MAX_TOKENS, thinkingBudget = 0 }) {
  return {
    systemInstruction: {
      parts: buildGeminiTextParts(systemPrompt)
    },
    contents: [
      {
        role: "user",
        parts: buildGeminiTextParts(userMessage)
      }
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: normalizeMaxTokens(maxTokens),
      responseMimeType: "application/json",
      responseJsonSchema: normalizeStructuredOutputSchema(schema),
      thinkingConfig: {
        thinkingBudget
      }
    }
  };
}

function textFromGeminiResponse(raw) {
  const parts = raw?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function parseStructuredOutput(rawData) {
  if (rawData && typeof rawData === "object" && (rawData.results || rawData.classifications || rawData.action_results)) {
    return rawData;
  }

  const text = textFromGeminiResponse(rawData);
  if (!text) {
    const reason = rawData?.promptFeedback?.blockReason || rawData?.candidates?.[0]?.finishReason || "missing content";
    throw new Error(`The analysis response did not include structured result text: ${reason}`);
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    throw new Error(`The analysis service returned text that was not valid structured data: ${safePreview(text)}`);
  }
}

function normalizeGeminiUsage(usageMetadata = {}) {
  const inputTokens = usageMetadata.promptTokenCount;
  const outputTokens = usageMetadata.candidatesTokenCount;
  const thinkingTokens = usageMetadata.thoughtsTokenCount;
  const cacheReadTokens = usageMetadata.cachedContentTokenCount;

  if (![inputTokens, outputTokens, thinkingTokens, cacheReadTokens].some((value) => typeof value === "number")) {
    return null;
  }

  return {
    input_tokens: typeof inputTokens === "number" ? inputTokens : 0,
    output_tokens: (typeof outputTokens === "number" ? outputTokens : 0) +
      (typeof thinkingTokens === "number" ? thinkingTokens : 0),
    completion_tokens: typeof outputTokens === "number" ? outputTokens : 0,
    thoughts_tokens: typeof thinkingTokens === "number" ? thinkingTokens : 0,
    cache_read_input_tokens: typeof cacheReadTokens === "number" ? cacheReadTokens : 0
  };
}

function millisecondsFromRetryDelay(value) {
  const match = String(value ?? "").match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Math.ceil(Number(match[1]) * 1000) : null;
}

function parseRateLimitMetadata(responseText) {
  const result = {
    retryDelayMs: null,
    quotaSummary: "",
    dailyQuota: false
  };

  try {
    const body = JSON.parse(responseText);
    const details = Array.isArray(body?.error?.details) ? body.error.details : [];

    const retryInfo = details.find((detail) => typeof detail?.retryDelay === "string");
    result.retryDelayMs = millisecondsFromRetryDelay(retryInfo?.retryDelay);

    const quotaFailure = details.find((detail) => Array.isArray(detail?.violations));
    const violations = quotaFailure?.violations ?? [];
    const labels = violations
      .map((violation) => violation?.quotaId || violation?.quotaMetric)
      .filter(Boolean);

    result.quotaSummary = labels.length ? labels.map((label) => safePreview(label)).join(", ") : "";
    result.dailyQuota = labels.some((label) => /perday|daily|requestsperday/i.test(String(label)));
  } catch {
    return result;
  }

  return result;
}

function rateLimitDelayMs(metadata, attempt) {
  const providerDelay = metadata?.retryDelayMs;
  const fallbackDelay = RATE_LIMIT_BASE_DELAY_MS + (attempt - 1) * 15000;
  return Math.min(MAX_RATE_LIMIT_DELAY_MS, Math.max(providerDelay ?? 0, fallbackDelay));
}

function rateLimitFailureMessage(metadata, attempts) {
  if (metadata?.dailyQuota) {
    return "Analysis service daily quota is exhausted for this key. Retry after the quota reset or use a billing-enabled key.";
  }

  const quotaText = metadata?.quotaSummary ? ` Last quota signal: ${metadata.quotaSummary}.` : "";
  return `Analysis service rate limit did not clear after ${attempts} attempts.${quotaText} Wait about a minute, then retry the failed batch.`;
}

function userFacingApiError(message) {
  const text = String(message ?? "");
  if (text.toLowerCase().includes("api key")) {
    return "Analysis service authentication failed. Check the service key and try again.";
  }
  return text;
}

export async function callGeminiAPI({
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
    "x-gemini-model": model
  };

  if (import.meta.env.DEV && apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const body = buildGeminiRequestBody({
    systemPrompt,
    userMessage,
    model,
    schema,
    maxTokens,
    thinkingBudget: THINKING_BUDGET_BY_STAGE[stage] ?? 0
  });
  const requestTimeoutMs = resolveGeminiTimeoutMs({ stage, timeoutMs });

  let lastError;
  let lastRateLimitMetadata = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await waitForProviderSlot();
      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: timeoutSignal(requestTimeoutMs)
      });

      const responseText = await response.text();

      if (response.status === 429) {
        const metadata = parseRateLimitMetadata(responseText);
        lastRateLimitMetadata = metadata;

        if (metadata.dailyQuota) {
          throw geminiError(rateLimitFailureMessage(metadata, attempt), {
            failureType: "rate_limit",
            retryable: false,
            status: response.status
          });
        }

        if (attempt >= MAX_ATTEMPTS) {
          throw geminiError(rateLimitFailureMessage(metadata, MAX_ATTEMPTS), {
            failureType: "rate_limit",
            retryable: true,
            status: response.status
          });
        }

        const delayMs = rateLimitDelayMs(metadata, attempt);
        reserveProviderQuietPeriod(delayMs);
        onRetry?.({ attempt, maxAttempts: MAX_ATTEMPTS, delayMs });
        await wait(delayMs);
        continue;
      }

      if (!response.ok) {
        let errorMessage = `Analysis request failed with status ${response.status}`;
        try {
          const errorBody = JSON.parse(responseText);
          if (errorBody?.error?.message) errorMessage = errorBody.error.message;
          if (typeof errorBody?.error === "string") errorMessage = errorBody.error;
        } catch {
          if (responseText) errorMessage = `${errorMessage}: ${safePreview(responseText)}`;
        }

        if (response.status === 401 || response.status === 403) {
          throw geminiError("Analysis service authentication failed. Check the service key and try again.", {
            failureType: "api",
            retryable: false,
            status: response.status
          });
        }

        throw geminiError(userFacingApiError(errorMessage), {
          failureType: "api",
          retryable: response.status >= 500 && response.status < 600,
          status: response.status
        });
      }

      let raw;
      try {
        raw = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Analysis response was not valid structured data: ${safePreview(responseText)}`);
      }

      const finishReason = raw?.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw geminiError(MAX_TOKENS_HELP, {
          failureType: "max_tokens",
          retryable: false
        });
      }
      if (finishReason === "SAFETY" || raw?.promptFeedback?.blockReason) {
        throw new Error("The analysis service blocked the request before returning structured output.");
      }

      return {
        data: parseStructuredOutput(raw),
        raw,
        token_usage: normalizeGeminiUsage(raw.usageMetadata),
        latency_ms: Math.round(performance.now() - startedAt),
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      const errorName = String(error?.name ?? "");
      const errorMessage = String(error?.message ?? "").toLowerCase();
      if (errorName === "AbortError" || errorName === "TimeoutError" || errorMessage.includes("timeout")) {
        const timeoutError = geminiError(timeoutMessage(stage, requestTimeoutMs), {
          failureType: "timeout",
          retryable: true
        });
        lastError = timeoutError;
        if (attempt < MAX_ATTEMPTS) {
          const delayMs = retryDelayMs(attempt);
          onRetry?.({ attempt, maxAttempts: MAX_ATTEMPTS, delayMs });
          await wait(delayMs);
          continue;
        }
        throw timeoutError;
      }
      if (attempt < MAX_ATTEMPTS && (error?.retryable || lastError instanceof TypeError)) {
        const delayMs = retryDelayMs(attempt);
        onRetry?.({ attempt, maxAttempts: MAX_ATTEMPTS, delayMs });
        await wait(delayMs);
        continue;
      }
      break;
    }
  }

  if (String(lastError?.message).includes("429")) {
    throw geminiError(rateLimitFailureMessage(lastRateLimitMetadata, MAX_ATTEMPTS), {
      failureType: "rate_limit",
      retryable: !lastRateLimitMetadata?.dailyQuota
    });
  }

  if (lastError instanceof TypeError) {
    throw geminiError("Network error while contacting the analysis service", {
      failureType: "network",
      retryable: true
    });
  }

  throw lastError ?? new Error("Analysis request failed");
}
