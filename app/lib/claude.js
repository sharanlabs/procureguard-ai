const API_URL = "/api/messages";
const REQUEST_TIMEOUT_MS = 60000;
const MAX_ATTEMPTS = 3;
const DIRECT_BROWSER_ACCESS_ERROR = "CORS requests must set 'anthropic-dangerous-direct-browser-access' header";
const DIRECT_BROWSER_ACCESS_HELP =
  "Anthropic rejected the browser/proxy request because the direct-browser-access header was missing. The app has been patched to send the required header. Restart the dev server and try again.";
const STRUCTURED_OUTPUT_SHAPE_ERROR = "output_config.type: Extra inputs are not permitted";
const STRUCTURED_OUTPUT_SHAPE_HELP =
  "Anthropic rejected the structured-output request shape. The app has been patched to use output_config.format. Restart the dev server and try again.";

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
  return text;
}

function timeoutSignal() {
  if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }

  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return controller.signal;
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractJsonText(data) {
  if (!data || typeof data !== "object") return null;
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
  throw new Error(`Claude response did not include structured JSON output: ${preview}`);
}

function refusalFromResponse(data) {
  if (data?.stop_reason === "refusal") return "Claude refused the request";
  const refusalBlock = data?.content?.find((block) => block?.type === "refusal");
  return refusalBlock ? "Claude refused the request" : null;
}

export async function callClaudeAPI({ systemPrompt, userMessage, model, schema, apiKey, onRetry }) {
  const startedAt = performance.now();
  const headers = {
    "content-type": "application/json",
    "anthropic-version": "2023-06-01"
  };

  if (import.meta.env.DEV && apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const body = {
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    output_config: {
      format: {
        type: "json_schema",
        schema
      }
    }
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: timeoutSignal()
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
        throw new Error("Claude API request timed out after 60 seconds");
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
