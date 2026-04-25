const exceptionCode = {
  type: "string",
  enum: ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17"]
};

const financialSummary = {
  type: "object",
  required: ["total_invoice_amount", "total_exposure", "total_hold", "total_approved"],
  additionalProperties: true,
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
        required: ["invoice_number", "po_number", "grn_numbers", "match_status", "detected_exceptions", "confidence", "reasoning"],
        additionalProperties: true,
        properties: {
          invoice_number: { type: "string" },
          po_number: { type: ["string", "null"] },
          grn_numbers: { type: "array", items: { type: "string" } },
          match_status: { type: "string" },
          detected_exceptions: { type: "array", items: exceptionCode },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          notes_signals: { type: "array", items: { type: "string" } }
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
        required: ["invoice_number", "detected_exceptions", "overall_tier", "tier_rationale", "exception_details", "financial_summary", "confidence", "requires_human_review"],
        additionalProperties: true,
        properties: {
          invoice_number: { type: "string" },
          detected_exceptions: { type: "array", items: exceptionCode },
          overall_tier: { type: "integer", enum: [1, 2, 3] },
          tier_rationale: { type: "string" },
          exception_details: {
            type: "array",
            items: {
              type: "object",
              required: ["exception_code", "exception_name", "individual_tier", "exposure_amount", "hold_amount", "approved_amount", "rationale", "recommended_action", "action_target"],
              additionalProperties: true,
              properties: {
                exception_code: exceptionCode,
                exception_name: { type: "string" },
                individual_tier: { type: "integer", enum: [1, 2, 3] },
                exposure_amount: { type: "number" },
                hold_amount: { type: "number" },
                approved_amount: { type: "number" },
                rationale: { type: "string" },
                recommended_action: { type: "string" },
                action_target: { type: "string" }
              }
            }
          },
          financial_summary: financialSummary,
          confidence: { type: "number" },
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
        additionalProperties: true,
        properties: {
          invoice_number: { type: "string" },
          overall_tier: { type: "integer", enum: [1, 2, 3] },
          actions: {
            type: "array",
            items: {
              type: "object",
              required: ["exception_code", "action_type", "subject", "recipient_type", "recipient_name", "body", "draft_label", "response_deadline_days", "financial_reference"],
              additionalProperties: true,
              properties: {
                exception_code: { type: "string" },
                action_type: { type: "string" },
                subject: { type: "string" },
                recipient_type: { type: "string" },
                recipient_name: { type: ["string", "null"] },
                body: { type: "string" },
                draft_label: { type: "string" },
                response_deadline_days: { type: ["integer", "null"] },
                financial_reference: {
                  type: "object",
                  additionalProperties: true,
                  properties: {
                    exposure_amount: { type: "number" },
                    hold_amount: { type: "number" }
                  }
                }
              }
            }
          },
          audit_entry: { type: "object", additionalProperties: true }
        }
      }
    }
  }
};
