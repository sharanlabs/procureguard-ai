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

const LEGACY_OUTPUT_FORMAT_KEY = ["output", "format"].join("_");

function sendJson(res, status, payload) {
  res.status(status).setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

const UNSUPPORTED_SCHEMA_KEYWORDS = [
  "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf",
  "minLength", "maxLength", "maxItems", "uniqueItems", "pattern", "patternProperties",
  "unevaluatedProperties", "propertyNames", "minProperties", "maxProperties",
  "contains", "minContains", "maxContains", "unevaluatedItems",
];

function enforceNoAdditionalProperties(schema) {
  const strictSchema = cloneJson(schema);

  function walk(node) {
    if (!node || typeof node !== "object") return;

    const hints = [];
    if (node.type === "integer") {
      node.type = "number";
      hints.push("integer-like value expected");
    } else if (Array.isArray(node.type) && node.type.includes("integer")) {
      node.type = [...new Set(node.type.map((type) => (type === "integer" ? "number" : type)))];
      hints.push("integer-like value expected");
    }

    for (const key of UNSUPPORTED_SCHEMA_KEYWORDS) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        hints.push(`${key} ${node[key]}`);
        delete node[key];
      }
    }
    if (Object.prototype.hasOwnProperty.call(node, "minItems")) {
      if (node.minItems !== 0 && node.minItems !== 1) {
        hints.push(`minItems ${node.minItems}`);
        delete node.minItems;
      }
    }
    if (hints.length > 0) {
      const hint = `Constraint hint: ${hints.join(", ")}.`;
      node.description = node.description ? `${node.description} ${hint}` : hint;
    }

    if (node.type === "object") {
      node.additionalProperties = false;
      if (node.properties) {
        Object.values(node.properties).forEach(walk);
      }
    }

    if (node.type === "array" && node.items) {
      walk(node.items);
    }

    ["anyOf", "oneOf", "allOf"].forEach((key) => {
      if (Array.isArray(node[key])) {
        node[key].forEach(walk);
      }
    });

    ["$defs", "definitions"].forEach((key) => {
      if (node[key] && typeof node[key] === "object") {
        Object.values(node[key]).forEach(walk);
      }
    });
  }

  walk(strictSchema);
  return strictSchema;
}

function normalizeStructuredOutputBody(body) {
  const normalized = { ...body };
  const outputConfig =
    normalized.output_config && typeof normalized.output_config === "object"
      ? normalized.output_config
      : null;

  if (outputConfig?.format) {
    normalized.output_config = { format: cloneJson(outputConfig.format) };
  } else if (outputConfig?.type && outputConfig?.schema) {
    normalized.output_config = {
      format: {
        type: outputConfig.type,
        schema: outputConfig.schema
      }
    };
  } else if (normalized[LEGACY_OUTPUT_FORMAT_KEY]) {
    normalized.output_config = {
      format: cloneJson(normalized[LEGACY_OUTPUT_FORMAT_KEY])
    };
  }

  delete normalized[LEGACY_OUTPUT_FORMAT_KEY];

  if (normalized.output_config?.format?.schema) {
    normalized.output_config = {
      format: {
        ...normalized.output_config.format,
        schema: enforceNoAdditionalProperties(normalized.output_config.format.schema)
      }
    };
  }

  return normalized;
}

function validateBody(body) {
  if (!body || typeof body !== "object") return "Request body must be a JSON object";
  if (!body.model || typeof body.model !== "string") return "Request body must include model";
  if (!Array.isArray(body.messages)) return "Request body must include messages array";
  if (typeof body.max_tokens !== "number") return "Request body must include numeric max_tokens";
  if (body.output_config) {
    if (body.output_config?.format?.type !== "json_schema") {
      return "Request body output_config.format.type must be json_schema";
    }
    if (!body.output_config?.format?.schema || typeof body.output_config.format.schema !== "object") {
      return "Request body output_config.format.schema must be an object";
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("access-control-allow-methods", "POST, OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type, anthropic-version, x-api-key, anthropic-dangerous-direct-browser-access"
  );

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

  body = normalizeStructuredOutputBody(body);

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
        "anthropic-dangerous-direct-browser-access": "true",
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
