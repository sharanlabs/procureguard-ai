async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

const ALLOWED_GEMINI_MODELS = new Set(["gemini-2.5-flash"]);

function sendJson(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function getHeader(req, name) {
  const value = req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getRequestedModel(req) {
  const model = String(getHeader(req, "x-gemini-model") ?? "").trim();
  return ALLOWED_GEMINI_MODELS.has(model) ? model : "";
}

function validateBody(body) {
  if (!body || typeof body !== "object") return "Request body must be a JSON object";
  if (!Array.isArray(body.contents)) return "Request body must include contents array";
  if (!body.generationConfig || typeof body.generationConfig !== "object") {
    return "Request body must include generationConfig";
  }
  if (body.generationConfig.responseMimeType !== "application/json") {
    return "Request body generationConfig.responseMimeType must be application/json";
  }
  if (!body.generationConfig.responseJsonSchema || typeof body.generationConfig.responseJsonSchema !== "object") {
    return "Request body generationConfig.responseJsonSchema must be an object";
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type, x-api-key, x-gemini-model"
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 500, { error: "Server-side AI service key is not configured" });
    return;
  }

  const model = getRequestedModel(req);
  if (!model) {
    sendJson(res, 400, { error: "Unsupported or missing Gemini model" });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch {
    sendJson(res, 400, { error: "Request body must be valid JSON" });
    return;
  }

  const validationError = validateBody(body);
  if (validationError) {
    sendJson(res, 400, { error: validationError });
    return;
  }

  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    });

    const responseBody = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    res.end(responseBody);
  } catch {
    sendJson(res, 502, { error: "Unable to reach AI API" });
  }
}
