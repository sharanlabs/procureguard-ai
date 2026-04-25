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

function sendJson(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function validateBody(body) {
  if (!body || typeof body !== "object") return "Request body must be a JSON object";
  if (!body.model || typeof body.model !== "string") return "Request body must include model";
  if (!Array.isArray(body.messages)) return "Request body must include messages array";
  if (typeof body.max_tokens !== "number") return "Request body must include numeric max_tokens";
  return null;
}

export default async function handler(req, res) {
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, anthropic-version");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    sendJson(res, 500, { error: "ANTHROPIC_API_KEY is not configured" });
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
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify(body)
    });

    const responseBody = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("content-type", upstream.headers.get("content-type") || "application/json");
    res.end(responseBody);
  } catch {
    sendJson(res, 502, { error: "Unable to reach Claude API" });
  }
}
