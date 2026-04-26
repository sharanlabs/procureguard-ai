const exceptionCode = {
  type: "string",
  enum: ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17"]
};

const financialSummary = {
  type: "object",
  required: ["total_invoice_amount", "total_exposure", "total_hold", "total_approved"],
  additionalProperties: false,
  properties: {
    total_invoice_amount: { type: "number" },
    total_exposure: { type: "number" },
    total_hold: { type: "number" },
    total_approved: { type: "number" }
  }
};

export const matchingOutputSchema = {
  type: "object",
  required: ["results"],
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        required: [
          "invoice_number",
          "po_number",
          "grn_numbers",
          "match_status",
          "quantity_match",
          "price_match",
          "uom_match",
          "supplier_match",
          "date_check",
          "notes_signals",
          "detected_exceptions",
          "confidence",
          "reasoning"
        ],
        additionalProperties: false,
        properties: {
          invoice_number: { type: "string" },
          po_number: { type: ["string", "null"] },
          grn_numbers: { type: "array", items: { type: "string" } },
          match_status: {
            type: "string",
            enum: ["clean_match", "exception_detected", "no_po_match", "no_grn"]
          },
          quantity_match: {
            type: "object",
            required: ["po_qty", "invoiced_qty", "grn_qty_total", "delta", "status"],
            additionalProperties: false,
            properties: {
              po_qty: { type: ["number", "null"] },
              invoiced_qty: { type: "number" },
              grn_qty_total: { type: "number" },
              delta: { type: ["number", "null"] },
              status: {
                type: "string",
                enum: [
                  "match",
                  "invoiced_exceeds_po",
                  "invoiced_exceeds_grn",
                  "short_delivery",
                  "grn_exceeds_po",
                  "uom_conversion_applied",
                  "no_grn",
                  "no_po_match"
                ]
              }
            }
          },
          price_match: {
            type: "object",
            required: ["po_price", "invoice_price", "variance_pct", "variance_dollar", "status"],
            additionalProperties: false,
            properties: {
              po_price: { type: ["number", "null"] },
              invoice_price: { type: "number" },
              variance_pct: { type: ["number", "null"] },
              variance_dollar: { type: ["number", "null"] },
              status: {
                type: "string",
                enum: ["match", "price_variance", "tariff_variance", "reconciled_after_uom_conversion", "no_po_match"]
              }
            }
          },
          uom_match: {
            type: "object",
            required: ["po_uom", "invoice_uom", "conversion_factor", "converted_qty", "status"],
            additionalProperties: false,
            properties: {
              po_uom: { type: ["string", "null"] },
              invoice_uom: { type: "string" },
              conversion_factor: { type: ["number", "null"] },
              converted_qty: { type: ["number", "null"] },
              status: {
                type: "string",
                enum: ["match", "converted", "mismatch_no_factor", "no_po_match"]
              }
            }
          },
          supplier_match: {
            type: "object",
            required: ["po_name", "invoice_name", "supplier_id_match", "name_similarity_score", "status"],
            additionalProperties: false,
            properties: {
              po_name: { type: ["string", "null"] },
              invoice_name: { type: "string" },
              supplier_id_match: { type: "boolean" },
              name_similarity_score: { type: "number", minimum: 0, maximum: 1 },
              status: {
                type: "string",
                enum: ["exact", "name_mismatch", "id_mismatch", "no_po_match"]
              }
            }
          },
          date_check: {
            type: "object",
            required: ["invoice_date", "earliest_grn_date", "invoice_predates_grn"],
            additionalProperties: false,
            properties: {
              invoice_date: { type: "string" },
              earliest_grn_date: { type: ["string", "null"] },
              invoice_predates_grn: { type: "boolean" }
            }
          },
          notes_signals: { type: "array", items: { type: "string" } },
          detected_exceptions: { type: "array", items: exceptionCode },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" }
        }
      }
    }
  }
};

export const classificationOutputSchema = {
  type: "object",
  required: ["classifications"],
  additionalProperties: false,
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        required: [
          "invoice_number",
          "detected_exceptions",
          "overall_tier",
          "tier_rationale",
          "exception_details",
          "financial_summary",
          "confidence",
          "requires_human_review"
        ],
        additionalProperties: false,
        properties: {
          invoice_number: { type: "string" },
          detected_exceptions: { type: "array", items: exceptionCode },
          overall_tier: { type: "integer", enum: [1, 2, 3] },
          tier_rationale: { type: "string" },
          exception_details: {
            type: "array",
            items: {
              type: "object",
              required: [
                "exception_code",
                "exception_name",
                "individual_tier",
                "exposure_amount",
                "hold_amount",
                "approved_amount",
                "rationale",
                "recommended_action",
                "action_target"
              ],
              additionalProperties: false,
              properties: {
                exception_code: exceptionCode,
                exception_name: { type: "string" },
                individual_tier: { type: "integer", enum: [1, 2, 3] },
                exposure_amount: { type: "number" },
                hold_amount: { type: "number" },
                approved_amount: { type: "number" },
                rationale: { type: "string" },
                recommended_action: { type: "string" },
                action_target: {
                  type: "string",
                  enum: ["supplier", "procurement", "warehouse", "ap_supervisor", "none"]
                }
              }
            }
          },
          financial_summary: financialSummary,
          confidence: { type: "number", minimum: 0, maximum: 1 },
          requires_human_review: { type: "boolean" }
        }
      }
    }
  }
};

export const actionOutputSchema = {
  type: "object",
  required: ["action_results"],
  additionalProperties: false,
  properties: {
    action_results: {
      type: "array",
      items: {
        type: "object",
        required: ["invoice_number", "overall_tier", "actions", "audit_entry"],
        additionalProperties: false,
        properties: {
          invoice_number: { type: "string" },
          overall_tier: { type: "integer", enum: [1, 2, 3] },
          actions: {
            type: "array",
            items: {
              type: "object",
              required: [
                "exception_code",
                "action_type",
                "subject",
                "recipient_type",
                "recipient_name",
                "body",
                "draft_label",
                "response_deadline_days",
                "financial_reference"
              ],
              additionalProperties: false,
              properties: {
                exception_code: {
                  type: "string",
                  enum: ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "CLEAN"]
                },
                action_type: {
                  type: "string",
                  enum: ["approval_note", "supplier_email", "escalation_memo", "po_amendment_request"]
                },
                subject: { type: "string" },
                recipient_type: {
                  type: "string",
                  enum: ["supplier", "procurement_lead", "ap_supervisor", "audit_trail"]
                },
                recipient_name: { type: ["string", "null"] },
                body: { type: "string" },
                draft_label: {
                  type: "string",
                  enum: ["DRAFT — AWAITING REVIEW", "ESCALATION MEMO — DRAFT"]
                },
                response_deadline_days: { type: ["integer", "null"] },
                financial_reference: {
                  type: "object",
                  required: ["exposure_amount", "hold_amount"],
                  additionalProperties: false,
                  properties: {
                    exposure_amount: { type: "number" },
                    hold_amount: { type: "number" }
                  }
                }
              }
            }
          },
          audit_entry: {
            type: "object",
            required: ["timestamp_placeholder", "prompt_version", "action_count"],
            additionalProperties: false,
            properties: {
              timestamp_placeholder: { type: "string" },
              prompt_version: { type: "string" },
              action_count: { type: "integer" }
            }
          }
        }
      }
    }
  }
};

const UNSUPPORTED_KEYWORDS = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "maxItems",
  "uniqueItems",
  "pattern",
  "patternProperties",
  "unevaluatedProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  "contains",
  "minContains",
  "maxContains",
  "unevaluatedItems",
];

function normalizeNode(node) {
  if (!node || typeof node !== "object") return;

  const hints = [];
  if (node.type === "integer") {
    node.type = "number";
    hints.push("integer-like value expected");
  } else if (Array.isArray(node.type) && node.type.includes("integer")) {
    node.type = [...new Set(node.type.map((type) => (type === "integer" ? "number" : type)))];
    hints.push("integer-like value expected");
  }

  for (const key of UNSUPPORTED_KEYWORDS) {
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
      Object.values(node.properties).forEach(normalizeNode);
    }
  }

  if (node.type === "array" && node.items) {
    normalizeNode(node.items);
  }

  ["anyOf", "oneOf", "allOf"].forEach((key) => {
    if (Array.isArray(node[key])) {
      node[key].forEach(normalizeNode);
    }
  });

  ["$defs", "definitions"].forEach((key) => {
    if (node[key] && typeof node[key] === "object") {
      Object.values(node[key]).forEach(normalizeNode);
    }
  });
}

export function normalizeAnthropicSchema(schema) {
  const clone = JSON.parse(JSON.stringify(schema));
  normalizeNode(clone);
  return clone;
}

export const enforceNoAdditionalProperties = normalizeAnthropicSchema;

export function buildStructuredOutputConfig(schema) {
  return {
    format: {
      type: "json_schema",
      schema: normalizeAnthropicSchema(schema)
    }
  };
}
