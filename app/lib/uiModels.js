import { EXCEPTION_NAMES } from "./rootCause.js";

const PRICE_OR_TARIFF_CODES = new Set(["E01", "E10", "E16", "E17"]);
const CONTROL_EXCEPTION_CODES = new Set(["E07", "E11"]);
const RECEIPT_TIMING_CODES = new Set(["E03", "E06", "E12", "E15"]);
const QUANTITY_OR_DELIVERY_CODES = new Set(["E02", "E05", "E13", "E14"]);

const DRIVER_MEANINGS = {
  E01: "Unit price variance is driving supplier pricing validation work.",
  E02: "Invoice quantity exceeds the purchase order and needs escalation review.",
  E03: "Invoice quantity exceeds received goods and needs receiving validation.",
  E04: "Unauthorized charges need policy and contract review.",
  E05: "Unit of measure mismatch needs buying and receiving alignment.",
  E06: "Missing receipt evidence needs receiving confirmation.",
  E07: "Duplicate invoice signal needs invoice control review.",
  E08: "Supplier name mismatch needs vendor master validation.",
  E09: "Item description mismatch needs item master validation.",
  E10: "Tax mismatch needs tax term validation.",
  E11: "Invalid PO reference needs invoice control review.",
  E12: "Invoice timing precedes receipt evidence and needs receiving validation.",
  E13: "Receipt quantity exceeds PO quantity and needs procurement review.",
  E14: "Short delivery needs receipt and supplier follow-up.",
  E15: "Undelivered goods coverage needs receipt confirmation.",
  E16: "Missing discount needs pricing term validation.",
  E17: "Tariff-adjusted pricing needs amendment and pricing validation."
};
const GOVERNANCE_STAGE_LABELS = {
  upload: "Data setup",
  matching: "Matching",
  classification: "Classification",
  action_generation: "Draft generation",
  alignment: "Result alignment",
  review_surface: "Review surface",
  export: "Audit export",
  other: "Other"
};
const GOVERNANCE_STAGE_ORDER = {
  upload: 0,
  matching: 1,
  classification: 2,
  action_generation: 3,
  alignment: 4,
  review_surface: 5,
  export: 6,
  other: 7
};
const MODEL_LABELS = {
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-opus-4-7": "Claude Opus 4.7"
};
const MODEL_TOKEN_PRICING = [
  { match: "haiku", inputPerMillion: 1, outputPerMillion: 5 },
  { match: "sonnet", inputPerMillion: 3, outputPerMillion: 15 },
  { match: "opus", inputPerMillion: 5, outputPerMillion: 25 }
];
const CACHE_WRITE_INPUT_MULTIPLIER = 1.25;
const CACHE_READ_INPUT_MULTIPLIER = 0.1;

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeText(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return String(value);
}

function formatMoneyText(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(safeNumber(value));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function uniqueCodes(analytics) {
  return new Set((analytics?.exceptionBreakdown ?? []).map((item) => item.code).filter(Boolean));
}

function hasAnyCode(codes, codeSet) {
  return [...codes].some((code) => codeSet.has(code));
}

function getInvoiceCount(driver) {
  const invoiceCount = driver?.invoiceNumbers?.length;
  return typeof invoiceCount === "number" && invoiceCount > 0 ? invoiceCount : safeNumber(driver?.count);
}

function getFinancialValue(classification, key) {
  return safeNumber(classification?.financial_summary?.[key]);
}

function sumExceptionFinancials(classification, key) {
  return (classification?.exception_details ?? []).reduce((sum, detail) => sum + safeNumber(detail?.[key]), 0);
}

function getRowExposure(classification) {
  return getFinancialValue(classification, "total_exposure") || sumExceptionFinancials(classification, "exposure_amount");
}

function getRowHold(classification, fallbackExposure = 0) {
  return getFinancialValue(classification, "total_hold") || sumExceptionFinancials(classification, "hold_amount") || fallbackExposure;
}

function getSupplierName(invoice, match, po) {
  return invoice?.supplier_name || match?.supplier_match?.invoice_name || po?.supplier_name || "Unknown supplier";
}

function getSupplierKey(invoice, match, po) {
  return invoice?.supplier_id || invoice?.supplier_name || match?.supplier_match?.invoice_name || po?.supplier_id || po?.supplier_name || "unknown_supplier";
}

function getConfidence(match, classification) {
  const confidence = classification?.confidence ?? match?.confidence;
  return typeof confidence === "number" && Number.isFinite(confidence) ? confidence : null;
}

function getEvidenceStrength(confidence, classification, match) {
  if (typeof confidence !== "number") {
    return {
      label: "Low",
      tone: "review",
      helper: "Confidence was not returned for this invoice."
    };
  }

  const hasSourceRecords = Boolean(match?.po_number) || Boolean(match?.grn_numbers?.length);
  const hasClassificationDetails = Boolean(classification?.exception_details?.length);

  if (confidence >= 0.9 && (hasSourceRecords || hasClassificationDetails)) {
    return {
      label: "High",
      tone: "info",
      helper: "Source records and classification details are available."
    };
  }

  if (confidence >= 0.75) {
    return {
      label: "Medium",
      tone: "review",
      helper: "Review the source comparison before taking action."
    };
  }

  return {
    label: "Low",
    tone: "review",
    helper: "Evidence needs closer analyst validation."
  };
}

function getExceptionCodes(match, classification) {
  const codes = classification?.detected_exceptions ?? match?.detected_exceptions ?? [];
  return [...new Set(codes.filter(Boolean))];
}

function getExceptionLabels(codes, classification) {
  const detailByCode = new Map((classification?.exception_details ?? []).map((detail) => [
    detail.exception_code,
    detail
  ]));

  return codes.map((code) => ({
    code,
    label: detailByCode.get(code)?.exception_name || EXCEPTION_NAMES[code] || "Unknown Exception",
    tier: detailByCode.get(code)?.individual_tier ?? classification?.overall_tier ?? null,
    rationale: detailByCode.get(code)?.rationale || "Not available",
    recommendedAction: detailByCode.get(code)?.recommended_action || "Human review required before action.",
    actionTarget: detailByCode.get(code)?.action_target || "none",
    exposureAmount: safeNumber(detailByCode.get(code)?.exposure_amount),
    holdAmount: safeNumber(detailByCode.get(code)?.hold_amount)
  }));
}

function getPriorityRank(priority) {
  return {
    escalation: 1,
    review: 2,
    verify: 3,
    clean: 4,
    unavailable: 5
  }[priority.id] ?? 5;
}

function getActionCount(actionResult) {
  return (actionResult?.actions ?? []).length;
}

function getPrimaryAction(actionResult) {
  return actionResult?.actions?.find((action) => action?.action_type === "escalation_memo")
    ?? actionResult?.actions?.find((action) => action?.action_type === "po_amendment_request")
    ?? actionResult?.actions?.find((action) => action?.action_type === "supplier_email")
    ?? actionResult?.actions?.[0]
    ?? null;
}

function getActionTypeRank(actionType) {
  return {
    escalation_memo: 1,
    po_amendment_request: 2,
    supplier_email: 3,
    approval_note: 4
  }[actionType] ?? 5;
}

function getExceptionTone(tier) {
  if (tier === 3) return "escalate";
  if (tier === 2) return "review";
  if (tier === 1) return "info";
  return "neutral";
}

function routeTone(label) {
  if (label === "AP escalation memo") return "escalate";
  if (label === "Procurement review draft") return "review";
  if (label === "Supplier follow-up draft") return "info";
  return "neutral";
}

function buildSourceRecords(match, invoice, po) {
  return [
    { label: "Invoice", value: invoice?.invoice_number || match?.invoice_number },
    { label: "PO", value: match?.po_number || invoice?.po_reference || po?.po_number },
    { label: "GRN", value: match?.grn_numbers },
    { label: "Supplier ID", value: invoice?.supplier_id || po?.supplier_id },
    { label: "Item", value: invoice?.item_code || po?.item_code }
  ];
}

function buildComparisons(match) {
  const quantity = match?.quantity_match ?? {};
  const price = match?.price_match ?? {};
  const uom = match?.uom_match ?? {};
  const date = match?.date_check ?? {};

  return {
    quantity: {
      po: quantity.po_qty,
      invoice: quantity.invoiced_qty,
      grn: quantity.grn_qty_total,
      delta: quantity.delta,
      status: safeText(quantity.status)
    },
    price: {
      po: price.po_price,
      invoice: price.invoice_price,
      variancePct: price.variance_pct,
      varianceDollar: price.variance_dollar,
      status: safeText(price.status)
    },
    uom: {
      po: uom.po_uom,
      invoice: uom.invoice_uom,
      status: safeText(uom.status)
    },
    date: {
      invoice: date.invoice_date,
      earliestGrn: date.earliest_grn_date,
      predatesGrn: Boolean(date.invoice_predates_grn)
    }
  };
}

function driverMeaning(driver, rank) {
  const label = driver?.name || EXCEPTION_NAMES[driver?.code] || "Exception";
  const invoiceCount = getInvoiceCount(driver);
  const invoiceText = `${invoiceCount} ${pluralize(invoiceCount, "invoice")}`;

  if (rank === 0 && safeNumber(driver?.exposure) > 0) {
    return `${label} is the largest exposure driver across ${invoiceText}.`;
  }

  return DRIVER_MEANINGS[driver?.code] ?? `${label} affects ${invoiceText} and needs human review.`;
}

export function getBatchOutcome(analytics = {}) {
  if (!analytics?.hasData) {
    return {
      id: "empty",
      label: "Not analyzed",
      tone: "neutral",
      summary: "Run analysis from Start to produce the executive decision view."
    };
  }

  const escalationCount = safeNumber(analytics.escalateCount);
  const exceptionCount = safeNumber(analytics.exceptionRows);

  if (escalationCount > 0) {
    return {
      id: "escalation",
      label: "Escalation recommended",
      tone: "escalate",
      summary: `${escalationCount} ${pluralize(escalationCount, "case")} should be reviewed before supplier outreach.`
    };
  }

  if (exceptionCount > 0) {
    return {
      id: "review",
      label: "Human review required",
      tone: "review",
      summary: `${exceptionCount} ${pluralize(exceptionCount, "exception")} need documented review before closure.`
    };
  }

  return {
    id: "clean",
    label: "Clean batch",
    tone: "clean",
    summary: "No exception follow-up is required for this batch."
  };
}

export function getExecutiveHeroMetrics(analytics = {}) {
  const exceptionCount = safeNumber(analytics.exceptionRows);
  const escalationCount = safeNumber(analytics.escalateCount);
  const exposureIdentified = safeNumber(analytics.exposureIdentified);

  return [
    {
      id: "invoices-analyzed",
      label: "Invoices analyzed",
      value: safeNumber(analytics.totalInvoices),
      format: "integer",
      tone: "neutral",
      helper: "Validated through the prompt-chain workflow"
    },
    {
      id: "exceptions-requiring-review",
      label: "Exceptions requiring review",
      value: exceptionCount,
      format: "integer",
      tone: escalationCount > 0 ? "escalate" : exceptionCount > 0 ? "review" : "clean",
      helper: "Rows needing human review or escalation"
    },
    {
      id: "exposure-identified",
      label: "Exposure identified",
      value: exposureIdentified,
      format: "money",
      tone: exposureIdentified > 0 ? "info" : "neutral",
      helper: "Value requiring validation or policy review"
    },
    {
      id: "estimated-recoverable-exposure",
      label: "Estimated recoverable exposure",
      value: safeNumber(analytics.estimatedRecovery),
      format: "money",
      tone: "neutral",
      helper: "Estimate based on identified exposure"
    }
  ];
}

export function buildTopExceptionDrivers(analytics = {}) {
  const source = (analytics.dollarExposureByException?.length
    ? analytics.dollarExposureByException
    : analytics.exceptionBreakdown) ?? [];

  return [...source]
    .sort((left, right) => (
      safeNumber(right.exposure) - safeNumber(left.exposure) ||
      safeNumber(right.hold) - safeNumber(left.hold) ||
      safeNumber(right.count) - safeNumber(left.count)
    ))
    .slice(0, 3)
    .map((driver, index) => ({
      id: driver.code || `driver-${index}`,
      code: driver.code ?? "N/A",
      label: driver.name || EXCEPTION_NAMES[driver.code] || "Exception",
      count: safeNumber(driver.count),
      invoiceCount: getInvoiceCount(driver),
      exposure: safeNumber(driver.exposure),
      hold: safeNumber(driver.hold),
      tier: driver.tier ?? null,
      meaning: driverMeaning(driver, index)
    }));
}

export function buildRecommendedNextActions(analytics = {}) {
  if (!analytics?.hasData) {
    return [{
      id: "run-analysis",
      label: "Run analysis from Start to populate review actions.",
      tone: "neutral"
    }];
  }

  const codes = uniqueCodes(analytics);
  const actions = [];

  if (safeNumber(analytics.escalateCount) > 0) {
    actions.push({
      id: "review-escalations",
      label: "Review escalation cases before supplier outreach.",
      tone: "escalate"
    });
  }

  if (hasAnyCode(codes, PRICE_OR_TARIFF_CODES)) {
    actions.push({
      id: "validate-pricing",
      label: "Validate supplier pricing and PO amendment cases.",
      tone: "info"
    });
  }

  if (hasAnyCode(codes, CONTROL_EXCEPTION_CODES)) {
    actions.push({
      id: "clear-controls",
      label: "Clear invoice control exceptions before payment review.",
      tone: "review"
    });
  }

  if (hasAnyCode(codes, RECEIPT_TIMING_CODES)) {
    actions.push({
      id: "confirm-receipts",
      label: "Confirm receiving records before supplier dispute.",
      tone: "review"
    });
  }

  if (!actions.length) {
    actions.push({
      id: safeNumber(analytics.exceptionRows) > 0 ? "review-workbench" : "no-follow-up",
      label: safeNumber(analytics.exceptionRows) > 0
        ? "Review remaining exceptions in the Exception Workbench."
        : "No exception follow-up required for this batch.",
      tone: safeNumber(analytics.exceptionRows) > 0 ? "review" : "clean"
    });
  }

  return actions.slice(0, 4);
}

export function buildExecutiveSummaryViewModel(analytics = {}) {
  const hasData = Boolean(analytics?.hasData);
  const outcome = getBatchOutcome(analytics);
  const heroMetrics = getExecutiveHeroMetrics(analytics);
  const topDrivers = buildTopExceptionDrivers(analytics);
  const recommendedActions = buildRecommendedNextActions(analytics);
  const exceptionBreakdown = analytics?.exceptionBreakdown ?? [];
  const exposureByException = analytics?.dollarExposureByException ?? [];
  const topFrequencyDriver = exceptionBreakdown[0] ?? null;
  const topExposureDriver = exposureByException[0] ?? null;

  return {
    hasData,
    outcome,
    decision: {
      eyebrow: hasData ? "Batch review complete" : "Batch review pending",
      recommendedNextAction: recommendedActions[0]?.label ?? "Not available"
    },
    heroMetrics,
    topDrivers,
    recommendedActions,
    chartData: {
      exceptionBreakdown: exceptionBreakdown.slice(0, 6),
      exposureByException: exposureByException.filter((item) => safeNumber(item.exposure) > 0).slice(0, 6)
    },
    chartContext: {
      topFrequencyDriver,
      topExposureDriver
    }
  };
}

export function getReviewPriority({ tier, exceptionCodes = [], confidence, requiresHumanReview } = {}) {
  if (tier === 3) {
    return {
      id: "escalation",
      label: "Review now",
      detail: "Escalation recommended before supplier follow-up.",
      tone: "escalate",
      rank: 1
    };
  }

  if (tier === 2 || requiresHumanReview) {
    return {
      id: "review",
      label: "Review now",
      detail: "Human review is required before closure.",
      tone: "review",
      rank: 2
    };
  }

  if (exceptionCodes.length || (typeof confidence === "number" && confidence < 0.85)) {
    return {
      id: "verify",
      label: "Verify",
      detail: "Exception evidence should be validated before filing.",
      tone: "info",
      rank: 3
    };
  }

  if (tier === 1) {
    return {
      id: "clean",
      label: "No review required",
      detail: "No exception follow-up is indicated.",
      tone: "clean",
      rank: 4
    };
  }

  return {
    id: "unavailable",
    label: "Classification not available",
    detail: "Classification not available.",
    tone: "neutral",
    rank: 5
  };
}

export function getRecommendedRouteLabel(actionResult, classification) {
  const actions = [...(actionResult?.actions ?? [])].sort((left, right) => (
    getActionTypeRank(left?.action_type) - getActionTypeRank(right?.action_type)
  ));
  const primary = actions[0] ?? null;

  if (primary?.action_type === "escalation_memo" || classification?.overall_tier === 3) {
    return {
      label: "AP escalation memo",
      tone: "escalate",
      actionType: primary?.action_type ?? null
    };
  }

  if (primary?.action_type === "po_amendment_request") {
    return {
      label: "Procurement review draft",
      tone: "review",
      actionType: primary.action_type
    };
  }

  if (primary?.action_type === "supplier_email") {
    return {
      label: "Supplier follow-up draft",
      tone: "info",
      actionType: primary.action_type
    };
  }

  return {
    label: "No draft needed",
    tone: "neutral",
    actionType: primary?.action_type ?? null
  };
}

export function getDraftStatus(actionResult) {
  if (!actionResult) {
    return {
      id: "unavailable",
      label: "Draft status not available",
      detail: "Action generation has not produced a result for this invoice.",
      tone: "neutral",
      count: 0,
      hasDraft: false
    };
  }

  const actions = actionResult.actions ?? [];
  const draftActions = actions.filter((action) => action?.action_type !== "approval_note");

  if (!draftActions.length) {
    return {
      id: "none",
      label: "No draft needed",
      detail: "No draft generated for this invoice.",
      tone: "neutral",
      count: 0,
      hasDraft: false
    };
  }

  const hasEscalationMemo = draftActions.some((action) => action.action_type === "escalation_memo");

  return {
    id: hasEscalationMemo ? "escalation-draft" : "draft-ready",
    label: `${draftActions.length} ${pluralize(draftActions.length, "draft")} prepared`,
    detail: "DRAFT only. Human review is required before any communication.",
    tone: hasEscalationMemo ? "escalate" : "info",
    count: draftActions.length,
    hasDraft: true
  };
}

export function buildInvoiceEvidenceSummary({
  match,
  classification,
  invoice,
  po,
  exceptionLabels,
  exposureAmount,
  holdAmount,
  recommendedRoute
}) {
  const sourceRecords = buildSourceRecords(match, invoice, po);
  const comparisons = buildComparisons(match);
  const wrongSummary = exceptionLabels.length
    ? exceptionLabels.map((item) => `${item.code}: ${item.label}`).join("; ")
    : "No exception rule triggered.";
  const ruleApplied = exceptionLabels.length
    ? exceptionLabels.map((item) => `${item.code} (${item.label})`).join(", ")
    : "No exception rule triggered.";
  const sourceRecordSummary = sourceRecords
    .map((record) => `${record.label}: ${safeText(record.value)}`)
    .join(" | ");
  const nextAction = exceptionLabels.find((item) => item.recommendedAction && item.recommendedAction !== "Not available")
    ?.recommendedAction;

  return {
    whatIsWrong: wrongSummary,
    sourceRecordSummary,
    sourceRecords,
    dollarImpact: {
      exposureAmount,
      holdAmount
    },
    ruleApplied,
    humanNextStep: nextAction || `${recommendedRoute.label}. Human review should validate the evidence before follow-up.`,
    matchRationale: match?.reasoning || "Not available",
    tierRationale: classification?.tier_rationale || "Classification not available.",
    exceptionDetails: exceptionLabels,
    comparisons
  };
}

export function buildWorkbenchRows({
  parsedFiles,
  matchResults,
  classificationResults,
  actionResults,
  toleranceSimulation
} = {}) {
  const matches = matchResults?.results ?? [];
  const classifications = classificationResults?.classifications ?? [];
  const actions = actionResults?.action_results ?? [];
  const invoices = parsedFiles?.invoices ?? [];
  const purchaseOrders = parsedFiles?.purchase_orders ?? [];

  return matches.map((match, index) => {
    const invoice = invoices[index] ?? {};
    const classification = classifications[index] ?? null;
    const actionResult = actions[index] ?? null;
    const po = purchaseOrders.find((item) => item.po_number === (match?.po_number || invoice.po_reference)) ?? {};
    const exceptionCodes = getExceptionCodes(match, classification);
    const exceptionLabels = getExceptionLabels(exceptionCodes, classification);
    const exposureAmount = getRowExposure(classification);
    const holdAmount = getRowHold(classification, exposureAmount);
    const confidence = getConfidence(match, classification);
    const priority = getReviewPriority({
      tier: classification?.overall_tier,
      exceptionCodes,
      confidence,
      requiresHumanReview: Boolean(classification?.requires_human_review)
    });
    const draftStatus = getDraftStatus(actionResult);
    const recommendedRoute = getRecommendedRouteLabel(actionResult, classification);
    const supplierName = getSupplierName(invoice, match, po);
    const invoiceNumber = invoice.invoice_number || match?.invoice_number || "Unknown invoice";
    const tier = exceptionCodes.length ? classification?.overall_tier ?? "unknown" : "clean";
    const evidenceStrength = getEvidenceStrength(confidence, classification, match);
    const evidenceSummary = buildInvoiceEvidenceSummary({
      match,
      classification,
      invoice,
      po,
      exceptionLabels,
      exposureAmount,
      holdAmount,
      recommendedRoute
    });
    const primaryAction = getPrimaryAction(actionResult);

    return {
      id: `${invoiceNumber}-${index}`,
      index,
      invoiceNumber,
      supplierName,
      supplierKey: getSupplierKey(invoice, match, po),
      invoiceRow: invoice,
      match,
      classification,
      actionResult,
      primaryAction,
      simulation: toleranceSimulation?.cards?.[index] ?? null,
      tier,
      tierLabel: tier === "clean" ? "Clean match" : tier === "unknown" ? "Classification not available" : classification?.overall_tier === 1 ? "Expedited review candidate" : classification?.overall_tier === 2 ? "Human review required" : "Escalation recommended",
      reviewPriority: priority,
      exceptionCodes,
      exceptionLabels,
      exposureAmount,
      holdAmount,
      recommendedRoute: {
        ...recommendedRoute,
        tone: routeTone(recommendedRoute.label)
      },
      draftStatus,
      evidenceStrength,
      modelConfidence: confidence,
      sourceRecords: evidenceSummary.sourceRecords,
      evidenceSummary,
      reviewRequired: priority.id === "escalation" || priority.id === "review",
      draftCount: getActionCount(actionResult),
      searchText: [
        invoiceNumber,
        supplierName,
        match?.po_number,
        invoice.po_reference,
        safeText(match?.grn_numbers, ""),
        ...exceptionCodes,
        ...exceptionLabels.map((item) => item.label)
      ].filter(Boolean).join(" ").toLowerCase()
    };
  });
}

export function buildWorkbenchSummary(rows = []) {
  const invoicesAnalyzed = rows.length;
  const exceptionsRequiringReview = rows.filter((row) => row.reviewRequired).length;
  const escalationsRecommended = rows.filter((row) => row.reviewPriority.id === "escalation").length;
  const draftsPrepared = rows.reduce((sum, row) => sum + row.draftStatus.count, 0);
  const totalExposure = rows.reduce((sum, row) => sum + safeNumber(row.exposureAmount), 0);
  const totalHold = rows.reduce((sum, row) => sum + safeNumber(row.holdAmount), 0);

  return {
    invoicesAnalyzed,
    exceptionsRequiringReview,
    escalationsRecommended,
    draftsPrepared,
    totalExposure,
    totalHold,
    cards: [
      {
        id: "invoices-analyzed",
        label: "Invoices analyzed",
        value: invoicesAnalyzed,
        format: "integer",
        tone: "neutral",
        helper: "Rows available for analyst review"
      },
      {
        id: "exceptions-requiring-review",
        label: "Need review now",
        value: exceptionsRequiringReview,
        format: "integer",
        tone: exceptionsRequiringReview > 0 ? "review" : "clean",
        helper: "Human review or escalation"
      },
      {
        id: "escalations-recommended",
        label: "Escalations",
        value: escalationsRecommended,
        format: "integer",
        tone: escalationsRecommended > 0 ? "escalate" : "neutral",
        helper: "AP supervisor route"
      },
      {
        id: "drafts-prepared",
        label: "Drafts prepared",
        value: draftsPrepared,
        format: "integer",
        tone: draftsPrepared > 0 ? "info" : "neutral",
        helper: "DRAFT only"
      },
      {
        id: "exposure-identified",
        label: "Exposure",
        value: totalExposure,
        format: "money",
        tone: totalExposure > 0 ? "info" : "neutral",
        helper: `Hold ${totalHold > 0 ? "available" : "not available"}`
      }
    ]
  };
}

export function filterAndSortWorkbenchRows(rows = [], filters = {}) {
  const query = String(filters.search ?? "").trim().toLowerCase();

  return [...rows]
    .filter((row) => (
      (!query || row.searchText.includes(query)) &&
      matchesWorkbenchTierFilter(row, filters.tier ?? "all") &&
      ((filters.supplier ?? "all") === "all" || row.supplierName === filters.supplier) &&
      ((filters.exception ?? "all") === "all" || row.exceptionCodes.includes(filters.exception))
    ))
    .sort((left, right) => {
      if (filters.sort === "exposure") {
        return safeNumber(right.exposureAmount) - safeNumber(left.exposureAmount)
          || getPriorityRank(left.reviewPriority) - getPriorityRank(right.reviewPriority)
          || left.index - right.index;
      }

      if (filters.sort === "hold") {
        return safeNumber(right.holdAmount) - safeNumber(left.holdAmount)
          || getPriorityRank(left.reviewPriority) - getPriorityRank(right.reviewPriority)
          || left.index - right.index;
      }

      if (filters.sort === "supplier") {
        return left.supplierName.localeCompare(right.supplierName)
          || getPriorityRank(left.reviewPriority) - getPriorityRank(right.reviewPriority)
          || left.index - right.index;
      }

      if (filters.sort === "invoice") {
        return String(left.invoiceNumber).localeCompare(String(right.invoiceNumber));
      }

      return getPriorityRank(left.reviewPriority) - getPriorityRank(right.reviewPriority) || left.index - right.index;
    });
}

function matchesWorkbenchTierFilter(row, tierFilter) {
  if (tierFilter === "all") return true;
  if (tierFilter === "clean") return row.tier === "clean";
  if (tierFilter === "tier1") return row.tier === 1;
  if (tierFilter === "tier2") return row.tier === 2;
  if (tierFilter === "tier3") return row.tier === 3;
  return true;
}

export function buildExceptionWorkbenchViewModel({
  parsedFiles,
  matchResults,
  classificationResults,
  actionResults,
  toleranceSimulation,
  filters
} = {}) {
  const rows = buildWorkbenchRows({
    parsedFiles,
    matchResults,
    classificationResults,
    actionResults,
    toleranceSimulation
  });
  const visibleRows = filterAndSortWorkbenchRows(rows, filters);

  return {
    hasData: Boolean(rows.length && classificationResults?.classifications?.length),
    rows,
    visibleRows,
    summary: buildWorkbenchSummary(rows),
    supplierOptions: [...new Set(rows.map((row) => row.supplierName))].sort((left, right) => left.localeCompare(right)),
    exceptionOptions: [...new Set(rows.flatMap((row) => row.exceptionCodes))].sort()
  };
}

export function getSupplierRiskExplanation(supplier = {}) {
  const riskLevel = supplier.riskLevel || "Low";
  const exceptionRows = safeNumber(supplier.exceptionRows);
  const exposure = safeNumber(supplier.exposure);
  const escalationCount = safeNumber(supplier.escalateCount);
  const reviewCount = safeNumber(supplier.reviewCount);
  const topCodes = supplier.topExceptionCodes ?? [];

  if (!supplier || !supplier.supplierName) return "Risk detail not available.";

  if (!exceptionRows && !exposure) {
    return "Low — no material exceptions in this batch.";
  }

  if (riskLevel === "High" && escalationCount > 0) {
    return `High — ${escalationCount} ${pluralize(escalationCount, "escalation")} and ${formatMoneyText(exposure)} exposure in this batch.`;
  }

  if (riskLevel === "High") {
    return `High — ${exceptionRows} ${pluralize(exceptionRows, "exception row")} and ${formatMoneyText(exposure)} exposure in this batch.`;
  }

  if (riskLevel === "Medium" && topCodes.some((code) => RECEIPT_TIMING_CODES.has(code))) {
    return `Medium — repeated receiving or timing exceptions with ${formatMoneyText(exposure)} exposure.`;
  }

  if (riskLevel === "Medium" && reviewCount > 0) {
    return `Medium — ${reviewCount} ${pluralize(reviewCount, "human review case")} and ${formatMoneyText(exposure)} exposure.`;
  }

  if (riskLevel === "Medium") {
    return `Medium — ${exceptionRows} ${pluralize(exceptionRows, "exception row")} in this batch.`;
  }

  return "Low — no material exceptions in this batch.";
}

export function getSupplierRecommendedAction(supplier = {}) {
  const topCodes = supplier.topExceptionCodes ?? [];
  const exceptionRows = safeNumber(supplier.exceptionRows);

  if (!exceptionRows) return "No supplier follow-up required from this batch.";
  if (topCodes.some((code) => PRICE_OR_TARIFF_CODES.has(code))) {
    return "Validate contracted pricing before the next PO cycle.";
  }
  if (topCodes.some((code) => RECEIPT_TIMING_CODES.has(code))) {
    return "Confirm receiving records before supplier dispute.";
  }
  if (topCodes.some((code) => CONTROL_EXCEPTION_CODES.has(code))) {
    return "Clear invoice control exceptions before payment review.";
  }
  if (topCodes.some((code) => QUANTITY_OR_DELIVERY_CODES.has(code))) {
    return "Review quantity and delivery authorization with procurement.";
  }

  return "Review supplier exception evidence before follow-up.";
}

export function buildSupplierRiskNarratives(analytics = {}) {
  return (analytics.supplierScorecard ?? [])
    .filter((supplier) => safeNumber(supplier.exceptionRows) > 0 || safeNumber(supplier.exposure) > 0)
    .slice(0, 3)
    .map((supplier) => ({
      key: supplier.key,
      supplierName: supplier.supplierName || "Unknown supplier",
      riskLevel: supplier.riskLevel || "Low",
      riskRank: safeNumber(supplier.riskRank),
      exceptionRows: safeNumber(supplier.exceptionRows),
      exposure: safeNumber(supplier.exposure),
      hold: safeNumber(supplier.hold),
      topExceptionCodes: supplier.topExceptionCodes ?? [],
      explanation: getSupplierRiskExplanation(supplier),
      recommendedAction: getSupplierRecommendedAction(supplier)
    }));
}

export function buildSupplierScoreRows(analytics = {}) {
  return (analytics.supplierScorecard ?? []).map((supplier) => ({
    key: supplier.key,
    supplierName: supplier.supplierName || "Unknown supplier",
    diversityCertification: supplier.diversityCertification || "None",
    invoiceCount: safeNumber(supplier.invoiceCount),
    exceptionRows: safeNumber(supplier.exceptionRows),
    reviewCount: safeNumber(supplier.reviewCount),
    escalateCount: safeNumber(supplier.escalateCount),
    exposure: safeNumber(supplier.exposure),
    hold: safeNumber(supplier.hold),
    matchRate: typeof supplier.matchRate === "number" ? supplier.matchRate : null,
    riskLevel: supplier.riskLevel || "Low",
    riskRank: safeNumber(supplier.riskRank),
    riskExplanation: getSupplierRiskExplanation(supplier),
    recommendedAction: getSupplierRecommendedAction(supplier),
    topExceptionCodes: supplier.topExceptionCodes ?? []
  }));
}

export function buildExceptionLegend(analytics = {}) {
  return (analytics.exceptionBreakdown ?? [])
    .filter((item) => item?.code)
    .map((item) => ({
      code: item.code,
      label: item.name || EXCEPTION_NAMES[item.code] || "Unknown Exception",
      tier: item.tier ?? null,
      tone: getExceptionTone(item.tier),
      count: safeNumber(item.count),
      exposure: safeNumber(item.exposure)
    }));
}

export function buildSupplierHeatmapRows(analytics = {}, legend = []) {
  const activeCodes = legend.map((item) => item.code);

  return (analytics.supplierExceptionHeatmap ?? [])
    .map((row) => {
      const cells = activeCodes.map((code) => ({
        code,
        count: safeNumber(row.codes?.[code])
      }));
      const totalExceptions = cells.reduce((sum, cell) => sum + cell.count, 0);

      return {
        key: row.key,
        supplierName: row.supplierName || "Unknown supplier",
        exposure: safeNumber(row.exposure),
        totalExceptions,
        cells
      };
    })
    .filter((row) => row.totalExceptions > 0)
    .sort((left, right) => (
      right.totalExceptions - left.totalExceptions ||
      right.exposure - left.exposure ||
      left.supplierName.localeCompare(right.supplierName)
    ));
}

export function buildPolicySimulationSummary(toleranceSimulation = {}, tolerances = {}) {
  if (!toleranceSimulation?.hasClassifications) {
    return {
      hasData: false,
      headline: "Policy simulation is available after analysis.",
      profileLabel: "Not available",
      profileTone: "neutral",
      profiles: ["Conservative", "Balanced", "High-throughput", "Custom"],
      metrics: []
    };
  }

  const pricePct = safeNumber(tolerances.pricePct);
  const quantityUnits = safeNumber(tolerances.quantityUnits);
  const dateBusinessDays = safeNumber(tolerances.dateBusinessDays);
  const profileLabel = pricePct <= 1 && quantityUnits <= 1 && dateBusinessDays <= 1
    ? "Conservative"
    : pricePct === 2 && quantityUnits === 1 && dateBusinessDays === 2
      ? "Balanced"
      : pricePct >= 5 || quantityUnits >= 3 || dateBusinessDays >= 5
        ? "High-throughput"
        : "Custom";
  const changedCount = safeNumber(toleranceSimulation.changedInvoiceCount);
  const potentialShift = safeNumber(toleranceSimulation.potentialAutoReviewShift);

  return {
    hasData: true,
    headline: changedCount
      ? `${changedCount} ${pluralize(changedCount, "invoice")} would move review path under this simulated policy.`
      : "No invoices would change review path under the current tolerance settings.",
    profileLabel,
    profileTone: profileLabel === "Balanced" ? "info" : profileLabel === "Conservative" ? "review" : profileLabel === "High-throughput" ? "escalate" : "neutral",
    profiles: ["Conservative", "Balanced", "High-throughput", "Custom"],
    potentialShift,
    metrics: [
      {
        id: "price",
        label: "Price tolerance impact",
        value: safeNumber(toleranceSimulation.affectedByRule?.price),
        helper: `${pricePct}% tolerance`
      },
      {
        id: "quantity",
        label: "Quantity tolerance impact",
        value: safeNumber(toleranceSimulation.affectedByRule?.quantity),
        helper: `${quantityUnits} ${pluralize(quantityUnits, "unit")}`
      },
      {
        id: "date",
        label: "Date tolerance impact",
        value: safeNumber(toleranceSimulation.affectedByRule?.date),
        helper: `${dateBusinessDays} ${pluralize(dateBusinessDays, "business day")}`
      },
      {
        id: "review-shift",
        label: "Potential low-risk review shift",
        value: potentialShift,
        format: "money",
        helper: "Held exposure under simulated policy"
      }
    ]
  };
}

function displayRootCauseType(type) {
  if (type === "Supplier concentration") return "Supplier concentration";
  if (type === "Warehouse correlation" || type === "Timing pattern") return "Receiving timing pattern";
  if (type === "Price trend" || type === "Exception type concentration") return "Policy sensitivity";
  return type || "Pattern signal";
}

export function buildRootCauseSummary(rootCauseAnalysis = {}) {
  const patterns = (rootCauseAnalysis.patterns ?? []).map((pattern) => ({
    ...pattern,
    displayType: displayRootCauseType(pattern.type),
    totalExposure: safeNumber(pattern.totalExposure),
    affectedInvoices: pattern.affectedInvoices ?? [],
    description: pattern.description || "Pattern detail not available.",
    recommendedAction: pattern.recommendedAction || "Review exception evidence before taking action."
  }));
  const supplierConcentrationCount = patterns.filter((pattern) => pattern.displayType === "Supplier concentration").length;
  const policySensitivityCount = patterns.filter((pattern) => pattern.displayType === "Policy sensitivity").length;
  const receivingTimingCount = patterns.filter((pattern) => pattern.displayType === "Receiving timing pattern").length;

  return {
    hasData: Boolean(rootCauseAnalysis.hasData),
    exceptionRowCount: safeNumber(rootCauseAnalysis.exceptionRowCount),
    patternCount: patterns.length,
    supplierConcentrationCount,
    policySensitivityCount,
    receivingTimingCount,
    patterns,
    takeaway: patterns.length
      ? `${patterns.length} ${pluralize(patterns.length, "pattern signal")} found across ${safeNumber(rootCauseAnalysis.exceptionRowCount)} exception rows.`
      : "No supplier concentration detected in this batch."
  };
}

export function buildSupplierPolicyAnalyticsViewModel({
  analytics,
  rootCauseAnalysis,
  toleranceSimulation,
  tolerances
} = {}) {
  const hasData = Boolean(analytics?.hasData);
  const supplierScoreRows = buildSupplierScoreRows(analytics);
  const supplierRiskNarratives = buildSupplierRiskNarratives(analytics);
  const exceptionLegend = buildExceptionLegend(analytics);
  const heatmapRows = buildSupplierHeatmapRows(analytics, exceptionLegend);
  const policySimulation = buildPolicySimulationSummary(toleranceSimulation, tolerances);
  const rootCause = buildRootCauseSummary(rootCauseAnalysis);
  const topSupplier = supplierRiskNarratives[0] ?? supplierScoreRows.find((row) => row.exceptionRows > 0) ?? null;
  const topException = exceptionLegend[0] ?? null;
  const topWarehouse = analytics?.warehouseHeatmap?.[0] ?? null;

  return {
    hasData,
    header: {
      eyebrow: "Supplier & Policy Analytics",
      title: "Which suppliers, warehouses, exception types, or policies are driving repeated operational risk?",
      takeaway: hasData
        ? buildSupplierPolicyTakeaway({ topSupplier, topException, topWarehouse, rootCause })
        : "Run analysis from Start to populate supplier risk, exception concentration, policy simulation, and pattern signals."
    },
    summaryCards: [
      {
        id: "suppliers",
        label: "Suppliers analyzed",
        value: supplierScoreRows.length,
        format: "integer",
        tone: "neutral",
        helper: "Batch supplier rows"
      },
      {
        id: "exception-suppliers",
        label: "Suppliers with exceptions",
        value: supplierScoreRows.filter((supplier) => supplier.exceptionRows > 0).length,
        format: "integer",
        tone: supplierScoreRows.some((supplier) => supplier.exceptionRows > 0) ? "review" : "clean",
        helper: "Supplier follow-through candidates"
      },
      {
        id: "supplier-exposure",
        label: "Supplier exposure",
        value: safeNumber(analytics?.exposureIdentified),
        format: "money",
        tone: safeNumber(analytics?.exposureIdentified) > 0 ? "info" : "neutral",
        helper: "Batch exposure tied to exceptions"
      },
      {
        id: "pattern-signals",
        label: "Pattern signals",
        value: rootCause.patternCount,
        format: "integer",
        tone: rootCause.patternCount > 0 ? "indigo" : "neutral",
        helper: "Browser-only review"
      }
    ],
    supplierRiskNarratives,
    supplierScoreRows,
    exceptionLegend,
    heatmapRows,
    heatmapTakeaway: buildHeatmapTakeaway(heatmapRows, exceptionLegend),
    policySimulation,
    rootCause
  };
}

function buildSupplierPolicyTakeaway({ topSupplier, topException, topWarehouse, rootCause }) {
  if (topSupplier) {
    return `${topSupplier.supplierName} is the top supplier follow-through candidate with ${topSupplier.exceptionRows} ${pluralize(topSupplier.exceptionRows, "exception row")} and ${formatMoneyText(topSupplier.exposure)} exposure.`;
  }

  if (topException) {
    return `${topException.code} is the top exception concentration with ${topException.count} ${pluralize(topException.count, "row")}.`;
  }

  if (topWarehouse) {
    return `${topWarehouse.warehouse} has the strongest receiving concentration in this batch.`;
  }

  if (rootCause.patternCount > 0) {
    return rootCause.takeaway;
  }

  return "No repeated supplier, warehouse, exception, or policy concentration is visible in this batch.";
}

function buildHeatmapTakeaway(rows, legend) {
  if (!rows.length || !legend.length) return "No exception concentration data available.";

  const topRow = rows[0];
  const topCell = topRow.cells
    .filter((cell) => cell.count > 0)
    .sort((left, right) => right.count - left.count)[0];
  const topLegend = legend.find((item) => item.code === topCell?.code);

  if (!topCell || !topLegend) {
    return "No exception concentration data available.";
  }

  return `${topRow.supplierName} shows the strongest concentration: ${topCell.count} ${pluralize(topCell.count, "row")} for ${topCell.code} (${topLegend.label}).`;
}

function titleCaseWords(text) {
  return String(text)
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function formatGovernanceStageName(stage) {
  const value = String(stage ?? "").trim();
  if (!value) return "Not available";
  return GOVERNANCE_STAGE_LABELS[value] ?? titleCaseWords(value.replace(/[-_]/g, " "));
}

function formatGovernanceModelName(model) {
  const value = String(model ?? "").trim();
  if (!value) return "Not available";
  if (MODEL_LABELS[value]) return MODEL_LABELS[value];

  const parsed = value.match(/^claude-([a-z]+)-(\d+)-(\d+)/i);
  if (parsed) return `Claude ${titleCaseWords(parsed[1])} ${parsed[2]}.${parsed[3]}`;

  return titleCaseWords(value.replace(/[-_]/g, " "));
}

function getTokenValue(tokenUsage, keys) {
  for (const key of keys) {
    const value = tokenUsage?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return 0;
}

function getTokenPricing(model = "") {
  const normalized = String(model).toLowerCase();
  return MODEL_TOKEN_PRICING.find((pricing) => normalized.includes(pricing.match)) ?? MODEL_TOKEN_PRICING[1];
}

function hasTokenUsageField(tokenUsage, key) {
  const value = tokenUsage?.[key];
  return typeof value === "number" && Number.isFinite(value);
}

function calculateCacheAwareTokenCost(entry) {
  const tokenUsage = entry?.token_usage;
  const inputTokens = getTokenValue(tokenUsage, ["input_tokens", "prompt_tokens"]);
  const outputTokens = getTokenValue(tokenUsage, ["output_tokens", "completion_tokens"]);
  const cacheCreationInputTokens = getTokenValue(tokenUsage, ["cache_creation_input_tokens"]);
  const cacheReadInputTokens = getTokenValue(tokenUsage, ["cache_read_input_tokens"]);
  const normalInputTokens = Math.max(inputTokens - cacheCreationInputTokens - cacheReadInputTokens, 0);
  const pricing = getTokenPricing(entry?.model);
  const inputCost = (normalInputTokens / 1_000_000) * pricing.inputPerMillion;
  const cacheWriteCost = (cacheCreationInputTokens / 1_000_000) * pricing.inputPerMillion * CACHE_WRITE_INPUT_MULTIPLIER;
  const cacheReadCost = (cacheReadInputTokens / 1_000_000) * pricing.inputPerMillion * CACHE_READ_INPUT_MULTIPLIER;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  return {
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    normalInputTokens,
    inputCost,
    cacheWriteCost,
    cacheReadCost,
    outputCost,
    totalCost: inputCost + cacheWriteCost + cacheReadCost + outputCost,
    cacheUsageReported: hasTokenUsageField(tokenUsage, "cache_creation_input_tokens") ||
      hasTokenUsageField(tokenUsage, "cache_read_input_tokens")
  };
}

function normalizeAuditEntries(entries = []) {
  return Array.isArray(entries) ? entries.filter(Boolean) : [];
}

function getEntryStage(entry) {
  return entry?.step || "other";
}

function getEntryChunkKey(entry) {
  if (!entry?.chunk) return null;
  const chunk = entry.chunk;
  return [chunk.index, chunk.total, chunk.invoice_range].filter((value) => value !== undefined && value !== null).join(":");
}

function summarizeChunkRange(entries = []) {
  const chunks = entries.map((entry) => entry.chunk).filter(Boolean);
  if (!chunks.length) return "Not available";

  const first = chunks[0];
  const last = chunks[chunks.length - 1];
  if (chunks.length === 1) return `Chunk ${first.index}/${first.total}`;
  return `Chunks ${first.index}-${last.index} of ${last.total}`;
}

function statusForAuditEntries(entries = []) {
  if (!entries.length) return { id: "pending", label: "Pending", tone: "neutral" };
  if (entries.some((entry) => entry.status === "failed")) {
    return { id: "failed", label: "Failed", tone: "escalate" };
  }
  return { id: "captured", label: "Captured", tone: "clean" };
}

function totalLatency(entries = []) {
  return entries.reduce((sum, entry) => sum + safeNumber(entry?.latency_ms), 0);
}

function totalTokenUsage(entries = [], keys) {
  return entries.reduce((sum, entry) => sum + getTokenValue(entry?.token_usage, keys), 0);
}

function buildUploadedDataSummary(parsedFiles) {
  const summaries = parsedFiles?.summaries ?? [];
  const files = summaries.map((file) => ({
    key: file.key,
    name: file.originalName || file.key || "Uploaded file",
    rowCount: safeNumber(file.rowCount)
  }));
  const invoiceCount = safeNumber(parsedFiles?.invoices?.length);

  return {
    hasFiles: files.length > 0,
    files,
    invoiceCount,
    purchaseOrderCount: safeNumber(parsedFiles?.purchase_orders?.length),
    goodsReceiptCount: safeNumber(parsedFiles?.goods_receipts?.length),
    summary: files.length
      ? `${files.length} ${pluralize(files.length, "file")} parsed with ${invoiceCount} ${pluralize(invoiceCount, "invoice")}.`
      : "Uploaded file summary is available after CSV validation."
  };
}

function getGovernanceRunState({ isAnalysisRunning, runningStep, failedStep, error, auditEntries, analytics, pipelineRunState }) {
  const descriptor = pipelineRunState?.retryDescriptor;

  if (isAnalysisRunning) {
    return {
      id: "running",
      label: "Analysis in progress",
      tone: "info",
      detail: runningStep
        ? `${formatGovernanceStageName(runningStep)} is running. Completed governance claims are withheld until the prompt chain finishes.`
        : "The prompt chain is running. Completed governance claims are withheld until the run finishes."
    };
  }

  if (["partial_failed", "failed"].includes(pipelineRunState?.status)) {
    const stageLabel = descriptor?.stage ? formatGovernanceStageName(descriptor.stage) : formatGovernanceStageName(failedStep);
    const chunkLabel = descriptor ? ` chunk ${descriptor.chunkIndex}/${descriptor.totalChunks}` : "";
    const rangeLabel = descriptor?.invoiceRange ? ` for invoices ${descriptor.invoiceRange}` : "";

    return {
      id: pipelineRunState.status,
      label: pipelineRunState.status === "partial_failed" ? "Partial run stopped" : "Run failed",
      tone: "escalate",
      detail: `${stageLabel}${chunkLabel}${rangeLabel} did not complete. Completed chunks are retained as partial data only and final batch claims are withheld.`
    };
  }

  if (failedStep || error) {
    return {
      id: "failed",
      label: "Run failed",
      tone: "escalate",
      detail: failedStep
        ? `${formatGovernanceStageName(failedStep)} did not complete. Stale completed analytics are not shown as final.`
        : "The latest run did not complete. Stale completed analytics are not shown as final."
    };
  }

  if (analytics?.hasData && auditEntries.length) {
    return {
      id: "complete",
      label: "Audit-supporting run captured",
      tone: "clean",
      detail: "Audit entries, review outputs, and DRAFT-only controls are available for human review."
    };
  }

  return {
    id: "empty",
    label: "Awaiting analysis",
    tone: "neutral",
    detail: "Audit entries appear after analysis runs from Start."
  };
}

export function groupAuditEntriesByStage(entries = []) {
  const groups = new Map();

  normalizeAuditEntries(entries).forEach((entry) => {
    const stage = getEntryStage(entry);
    if (!groups.has(stage)) {
      groups.set(stage, {
        id: stage,
        stage,
        label: formatGovernanceStageName(stage),
        entries: [],
        count: 0,
        successCount: 0,
        failedCount: 0,
        chunkKeys: new Set(),
        chunkCount: 0,
        chunkRangeLabel: "Not available",
        totalLatencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        cacheUsageReported: false,
        totalTokens: 0,
        models: [],
        rawModels: [],
        promptVersions: [],
        status: { id: "pending", label: "Pending", tone: "neutral" }
      });
    }

    const group = groups.get(stage);
    const chunkKey = getEntryChunkKey(entry);
    group.entries.push(entry);
    group.count += 1;
    if (entry.status === "failed") group.failedCount += 1;
    else group.successCount += 1;
    if (chunkKey) group.chunkKeys.add(chunkKey);
    group.totalLatencyMs += safeNumber(entry.latency_ms);
    group.inputTokens += getTokenValue(entry.token_usage, ["input_tokens", "prompt_tokens"]);
    group.outputTokens += getTokenValue(entry.token_usage, ["output_tokens", "completion_tokens"]);
    group.cacheCreationInputTokens += getTokenValue(entry.token_usage, ["cache_creation_input_tokens"]);
    group.cacheReadInputTokens += getTokenValue(entry.token_usage, ["cache_read_input_tokens"]);
    if (
      hasTokenUsageField(entry.token_usage, "cache_creation_input_tokens") ||
      hasTokenUsageField(entry.token_usage, "cache_read_input_tokens")
    ) {
      group.cacheUsageReported = true;
    }
    if (entry.model && !group.rawModels.includes(entry.model)) group.rawModels.push(entry.model);
    if (entry.prompt_version && !group.promptVersions.includes(entry.prompt_version)) group.promptVersions.push(entry.prompt_version);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      chunkKeys: undefined,
      chunkCount: group.chunkKeys.size,
      chunkRangeLabel: summarizeChunkRange(group.entries),
      totalTokens: group.inputTokens + group.outputTokens,
      models: group.rawModels.map(formatGovernanceModelName),
      status: statusForAuditEntries(group.entries)
    }))
    .sort((left, right) => (
      (GOVERNANCE_STAGE_ORDER[left.stage] ?? GOVERNANCE_STAGE_ORDER.other) -
      (GOVERNANCE_STAGE_ORDER[right.stage] ?? GOVERNANCE_STAGE_ORDER.other)
    ));
}

export function buildTokenCostSummary({ auditEntries = [], analytics = {}, totalInvoices = 0 } = {}) {
  const entries = normalizeAuditEntries(auditEntries);
  const governance = analytics?.auditGovernance ?? {};
  const tokenDataReported = Boolean(governance.tokenDataReported || entries.some((entry) => entry.token_usage));
  const inputTokens = safeNumber(governance.inputTokens) || totalTokenUsage(entries, ["input_tokens", "prompt_tokens"]);
  const outputTokens = safeNumber(governance.outputTokens) || totalTokenUsage(entries, ["output_tokens", "completion_tokens"]);
  const cacheCreationInputTokens = safeNumber(governance.cacheCreationInputTokens) || totalTokenUsage(entries, ["cache_creation_input_tokens"]);
  const cacheReadInputTokens = safeNumber(governance.cacheReadInputTokens) || totalTokenUsage(entries, ["cache_read_input_tokens"]);
  const cacheUsageReported = Boolean(governance.cacheUsageReported || entries.some((entry) => (
    hasTokenUsageField(entry.token_usage, "cache_creation_input_tokens") ||
    hasTokenUsageField(entry.token_usage, "cache_read_input_tokens")
  )));
  const estimatedFullPriceCost = typeof governance.estimatedFullPriceCost === "number"
    ? governance.estimatedFullPriceCost
    : entries.reduce((sum, entry) => {
      const input = getTokenValue(entry.token_usage, ["input_tokens", "prompt_tokens"]);
      const output = getTokenValue(entry.token_usage, ["output_tokens", "completion_tokens"]);
      const pricing = getTokenPricing(entry.model);
      return sum + ((input / 1_000_000) * pricing.inputPerMillion) + ((output / 1_000_000) * pricing.outputPerMillion);
    }, 0);
  const estimatedCacheAwareCost = typeof governance.estimatedCacheAwareCost === "number"
    ? governance.estimatedCacheAwareCost
    : entries.reduce((sum, entry) => sum + calculateCacheAwareTokenCost(entry).totalCost, 0);
  const estimatedPromptCacheCost = typeof governance.estimatedPromptCacheCost === "number"
    ? governance.estimatedPromptCacheCost
    : estimatedCacheAwareCost;

  return {
    tokenDataReported,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    cacheUsageReported,
    estimatedFullPriceCost,
    estimatedPromptCacheCost,
    estimatedCacheAwareCost,
    costPerInvoice: totalInvoices > 0 ? estimatedCacheAwareCost / totalInvoices : null,
    emptyMessage: "Token usage not available for this run.",
    cacheUsageMessage: "Cache usage not available for this run."
  };
}

export function buildLatencySummary(auditEntries = []) {
  const entries = normalizeAuditEntries(auditEntries).filter((entry) => safeNumber(entry.latency_ms) > 0);
  const totalLatencyMs = totalLatency(entries);
  const slowestEntry = [...entries].sort((left, right) => safeNumber(right.latency_ms) - safeNumber(left.latency_ms))[0] ?? null;

  return {
    hasLatency: entries.length > 0,
    totalLatencyMs,
    averageLatencyMs: entries.length ? Math.round(totalLatencyMs / entries.length) : null,
    slowest: slowestEntry
      ? {
        stage: formatGovernanceStageName(slowestEntry.step),
        latencyMs: safeNumber(slowestEntry.latency_ms),
        chunkLabel: slowestEntry.chunk ? `Chunk ${slowestEntry.chunk.index}/${slowestEntry.chunk.total}` : "Not available",
        invoiceRange: slowestEntry.chunk?.invoice_range || "Not available"
      }
      : null,
    emptyMessage: "Latency not available for this run."
  };
}

export function buildModelRoutingSummary(auditGroups = []) {
  const rows = auditGroups
    .filter((group) => group.rawModels?.length || group.models?.length)
    .map((group) => ({
      stage: group.stage,
      stageLabel: group.label,
      models: group.models?.length ? group.models : (group.rawModels ?? []).map(formatGovernanceModelName),
      chunkCount: safeNumber(group.chunkCount),
      status: group.status
    }));
  const modelsUsed = [...new Set(rows.flatMap((row) => row.models))];

  return {
    hasData: rows.length > 0,
    rows,
    modelsUsed,
    summary: modelsUsed.length
      ? `${modelsUsed.length} ${pluralize(modelsUsed.length, "Claude model")} used across captured stages.`
      : "Model usage not available for this run."
  };
}

export function buildValidationGateSummary({
  parsedFiles,
  matchResults,
  classificationResults,
  actionResults,
  auditGroups,
  isAnalysisRunning,
  failedStep
} = {}) {
  const hasFiles = Boolean(parsedFiles?.summaries?.length);
  const hasChunkMetadata = auditGroups.some((group) => group.chunkCount > 0);
  const hasMergedResults = Boolean(matchResults && classificationResults && actionResults);
  const failedStageLabel = failedStep ? formatGovernanceStageName(failedStep) : null;

  return {
    hasValidationDetail: hasChunkMetadata || hasMergedResults,
    unavailableMessage: "Validation detail not available for this run.",
    gates: [
      {
        id: "data-inputs",
        label: "Data input validation",
        status: hasFiles ? "available" : "pending",
        statusLabel: hasFiles ? "Available" : "Pending",
        tone: hasFiles ? "clean" : "neutral",
        detail: hasFiles ? "Required CSV inputs were parsed before analysis." : "CSV validation appears after files are uploaded."
      },
      {
        id: "chunk-trace",
        label: "Chunk trace metadata",
        status: hasChunkMetadata ? "available" : "unavailable",
        statusLabel: hasChunkMetadata ? "Available" : "Not available",
        tone: hasChunkMetadata ? "info" : "neutral",
        detail: hasChunkMetadata ? "Captured audit entries include chunk count and invoice-range metadata." : "Validation detail not available for this run."
      },
      {
        id: "result-alignment",
        label: "Result alignment",
        status: hasMergedResults ? "available" : failedStep ? "failed" : isAnalysisRunning ? "running" : "unavailable",
        statusLabel: hasMergedResults ? "Available" : failedStep ? "Failed" : isAnalysisRunning ? "In progress" : "Not available",
        tone: hasMergedResults ? "clean" : failedStep ? "escalate" : isAnalysisRunning ? "info" : "neutral",
        detail: hasMergedResults
          ? "Merged matching, classification, and draft outputs are available to review surfaces."
          : failedStageLabel
            ? `${failedStageLabel} did not complete, so result alignment is not shown as complete.`
            : "Validation detail not available for this run."
      },
      {
        id: "api-key-guard",
        label: "Secret exposure guard",
        status: "active",
        statusLabel: "Active",
        tone: "clean",
        detail: "Audit records exclude raw API keys and request payloads."
      },
      {
        id: "draft-only-controls",
        label: "DRAFT-only controls",
        status: "active",
        statusLabel: "Active",
        tone: "clean",
        detail: "Generated communications remain marked DRAFT and require human review."
      }
    ]
  };
}

function buildTraceStep({ id, stage, status, statusLabel, tone, detail, group, model, latencyMs, chunkCount }) {
  return {
    id,
    stage,
    stageLabel: formatGovernanceStageName(stage),
    status,
    statusLabel,
    tone,
    detail,
    chunkCount: typeof chunkCount === "number" ? chunkCount : safeNumber(group?.chunkCount),
    model: model || group?.models?.join(", ") || "Not available",
    latencyMs: typeof latencyMs === "number" ? latencyMs : group?.totalLatencyMs ?? null
  };
}

function traceStepForStage({ stage, group, result, isAnalysisRunning, runningStep, failedStep }) {
  if (failedStep === stage) {
    return buildTraceStep({
      id: stage,
      stage,
      status: "failed",
      statusLabel: "Failed",
      tone: "escalate",
      detail: `${formatGovernanceStageName(stage)} did not complete.`
    });
  }

  if (isAnalysisRunning && runningStep === stage) {
    return buildTraceStep({
      id: stage,
      stage,
      status: "running",
      statusLabel: "In progress",
      tone: "info",
      detail: `${formatGovernanceStageName(stage)} is running.`,
      group
    });
  }

  if (result || group?.count) {
    return buildTraceStep({
      id: stage,
      stage,
      status: "captured",
      statusLabel: "Captured",
      tone: group?.status?.tone ?? "clean",
      detail: group?.count
        ? `${group.count} ${pluralize(group.count, "audit entry")} captured.`
        : `${formatGovernanceStageName(stage)} output is available.`,
      group
    });
  }

  return buildTraceStep({
    id: stage,
    stage,
    status: "pending",
    statusLabel: "Pending",
    tone: "neutral",
    detail: `${formatGovernanceStageName(stage)} appears after analysis reaches this step.`
  });
}

export function buildWorkflowTraceSummary({
  parsedFiles,
  auditGroups = [],
  analytics,
  isAnalysisRunning,
  runningStep,
  failedStep,
  matchResults,
  classificationResults,
  actionResults
} = {}) {
  const groupByStage = new Map(auditGroups.map((group) => [group.stage, group]));
  const hasFiles = Boolean(parsedFiles?.summaries?.length);
  const hasReviewSurface = Boolean(analytics?.hasData && actionResults);
  const hasExport = auditGroups.length > 0;
  const steps = [
    buildTraceStep({
      id: "upload",
      stage: "upload",
      status: hasFiles ? "captured" : "pending",
      statusLabel: hasFiles ? "Captured" : "Pending",
      tone: hasFiles ? "clean" : "neutral",
      detail: hasFiles ? buildUploadedDataSummary(parsedFiles).summary : "Upload validated CSV files from Start."
    }),
    traceStepForStage({
      stage: "matching",
      group: groupByStage.get("matching"),
      result: matchResults,
      isAnalysisRunning,
      runningStep,
      failedStep
    }),
    traceStepForStage({
      stage: "classification",
      group: groupByStage.get("classification"),
      result: classificationResults,
      isAnalysisRunning,
      runningStep,
      failedStep
    }),
    traceStepForStage({
      stage: "action_generation",
      group: groupByStage.get("action_generation"),
      result: actionResults,
      isAnalysisRunning,
      runningStep,
      failedStep
    }),
    buildTraceStep({
      id: "alignment",
      stage: "alignment",
      status: matchResults && classificationResults && actionResults ? "available" : failedStep ? "failed" : "unavailable",
      statusLabel: matchResults && classificationResults && actionResults ? "Available" : failedStep ? "Failed" : "Not available",
      tone: matchResults && classificationResults && actionResults ? "clean" : failedStep ? "escalate" : "neutral",
      detail: matchResults && classificationResults && actionResults
        ? "Merged outputs are available for review surfaces."
        : "Validation detail not available for this run."
    }),
    buildTraceStep({
      id: "review-surface",
      stage: "review_surface",
      status: hasReviewSurface ? "available" : isAnalysisRunning ? "pending" : "unavailable",
      statusLabel: hasReviewSurface ? "Available" : isAnalysisRunning ? "Pending" : "Not available",
      tone: hasReviewSurface ? "clean" : "neutral",
      detail: hasReviewSurface ? "Human review surfaces have current run data." : "Review queue appears after successful analysis."
    }),
    buildTraceStep({
      id: "audit-export",
      stage: "export",
      status: hasExport ? "ready" : "pending",
      statusLabel: hasExport ? "Ready" : "Pending",
      tone: hasExport ? "info" : "neutral",
      detail: hasExport ? "Audit-supporting export can be generated from captured entries." : "Audit export appears after entries are captured."
    })
  ];

  return {
    steps,
    completedCount: steps.filter((step) => ["captured", "available", "ready"].includes(step.status)).length,
    chunkCount: auditGroups.reduce((sum, group) => sum + safeNumber(group.chunkCount), 0),
    stageCount: auditGroups.length
  };
}

export function getApiExposureStatus({ isDev, apiKey } = {}) {
  if (isDev) {
    const hasLocalKey = Boolean(apiKey);
    return {
      modeLabel: "Local development",
      serviceStatus: hasLocalKey ? "Local Claude key provided" : "Local Claude key not provided",
      serviceTone: hasLocalKey ? "info" : "review",
      clientKeyExposure: hasLocalKey ? "Session-only local key" : "No local key currently present",
      exposureTone: hasLocalKey ? "review" : "neutral",
      detail: hasLocalKey
        ? "Local development uses the browser session key only for the Vite proxy header."
        : "Local development requires a session-only Claude key before analysis can call the local proxy.",
      allowLocalKeyInput: true
    };
  }

  return {
    modeLabel: "Production",
    serviceStatus: "Server-side Claude service",
    serviceTone: "clean",
    clientKeyExposure: "None",
    exposureTone: "clean",
    detail: "Production uses the server-side ANTHROPIC_API_KEY. Public users are not asked for API keys.",
    allowLocalKeyInput: false
  };
}

export function buildAuditExportSummary(auditEntries = []) {
  const entries = normalizeAuditEntries(auditEntries);
  const failedCount = entries.filter((entry) => entry.status === "failed").length;
  const ready = entries.length > 0;

  return {
    ready,
    entryCount: entries.length,
    failedCount,
    statusLabel: ready ? "Ready to export" : "No audit entries captured yet",
    tone: ready ? "info" : "neutral",
    safetyText: "Audit export contains run metadata and AI decision records. It excludes raw API keys and raw request payloads, and supports review without acting as a legal compliance certification."
  };
}

export function buildAiReliabilitySummary({
  runState,
  auditGroups = [],
  auditEntries = [],
  tokenCost,
  latency,
  modelRouting,
  auditExport,
  apiExposure
} = {}) {
  const stageCount = auditGroups.length;
  const chunkCount = auditGroups.reduce((sum, group) => sum + safeNumber(group.chunkCount), 0);

  return {
    runState,
    cards: [
      {
        id: "pipeline-health",
        label: "Pipeline health",
        value: runState?.label ?? "Awaiting analysis",
        tone: runState?.tone ?? "neutral",
        helper: runState?.detail ?? "Run state not available.",
        format: "text"
      },
      {
        id: "stage-completion",
        label: "Stages captured",
        value: stageCount,
        tone: stageCount > 0 ? "info" : "neutral",
        helper: `${chunkCount} ${pluralize(chunkCount, "chunk")} captured`,
        format: "integer"
      },
      {
        id: "audit-entries",
        label: "Audit entries",
        value: auditEntries.length,
        tone: auditEntries.length > 0 ? "info" : "neutral",
        helper: auditExport?.statusLabel ?? "No audit entries captured yet",
        format: "integer"
      },
      {
        id: "latency",
        label: "Total latency",
        value: latency?.totalLatencyMs ?? null,
        tone: latency?.hasLatency ? "neutral" : "neutral",
        helper: latency?.hasLatency ? "Captured API response timing" : "Latency not available for this run.",
        format: "duration"
      },
      {
        id: "token-usage",
        label: "Token usage",
        value: tokenCost?.totalTokens ?? null,
        tone: tokenCost?.tokenDataReported ? "neutral" : "neutral",
        helper: tokenCost?.tokenDataReported ? "Input and output tokens reported" : "Token usage not available for this run.",
        format: "integer-optional"
      },
      {
        id: "model-routing",
        label: "Model usage",
        value: modelRouting?.modelsUsed?.length ?? 0,
        tone: modelRouting?.modelsUsed?.length ? "neutral" : "neutral",
        helper: modelRouting?.summary ?? "Model usage not available for this run.",
        format: "integer"
      },
      {
        id: "draft-controls",
        label: "Draft-only controls",
        value: "Active",
        tone: "clean",
        helper: "No communication action is available from this product surface.",
        format: "text"
      },
      {
        id: "client-key-exposure",
        label: "Client key exposure",
        value: apiExposure?.clientKeyExposure ?? "Not available",
        tone: apiExposure?.exposureTone ?? "neutral",
        helper: apiExposure?.detail ?? "API exposure detail not available.",
        format: "text"
      }
    ]
  };
}

function buildGovernanceHeaderTakeaway({ runState, auditEntries, auditGroups, auditExport }) {
  if (runState?.id === "running") return runState.detail;
  if (["failed", "partial_failed"].includes(runState?.id)) return runState.detail;
  if (auditEntries.length) {
    return `${auditEntries.length} ${pluralize(auditEntries.length, "audit entry")} captured across ${auditGroups.length} ${pluralize(auditGroups.length, "stage")}; ${auditExport.statusLabel.toLowerCase()} for audit-supporting review.`;
  }
  return "Run analysis from Start to populate AI reliability, workflow trace, token usage, latency, and audit export readiness.";
}

export function buildGovernanceViewModel({
  parsedFiles,
  auditEntries = [],
  analytics = {},
  isDev = false,
  apiKey = "",
  isAnalysisRunning = false,
  runningStep = "",
  failedStep = "",
  error = "",
  matchResults,
  classificationResults,
  actionResults,
  pipelineRunState
} = {}) {
  const entries = normalizeAuditEntries(auditEntries);
  const uploadedData = buildUploadedDataSummary(parsedFiles);
  const runState = getGovernanceRunState({
    isAnalysisRunning,
    runningStep,
    failedStep,
    error,
    auditEntries: entries,
    analytics,
    pipelineRunState
  });
  const apiExposure = getApiExposureStatus({ isDev, apiKey });
  const auditGroups = groupAuditEntriesByStage(entries);
  const totalInvoices = safeNumber(analytics?.totalInvoices) || uploadedData.invoiceCount;
  const tokenCost = buildTokenCostSummary({ auditEntries: entries, analytics, totalInvoices });
  const latency = buildLatencySummary(entries);
  const modelRouting = buildModelRoutingSummary(auditGroups);
  const validationGates = buildValidationGateSummary({
    parsedFiles,
    matchResults,
    classificationResults,
    actionResults,
    auditGroups,
    isAnalysisRunning,
    failedStep
  });
  const workflowTrace = buildWorkflowTraceSummary({
    parsedFiles,
    auditGroups,
    analytics,
    isAnalysisRunning,
    runningStep,
    failedStep,
    matchResults,
    classificationResults,
    actionResults
  });
  const auditExport = buildAuditExportSummary(entries);
  const reliabilitySummary = buildAiReliabilitySummary({
    runState,
    auditGroups,
    auditEntries: entries,
    tokenCost,
    latency,
    modelRouting,
    auditExport,
    apiExposure
  });

  return {
    hasData: Boolean(uploadedData.hasFiles || entries.length || analytics?.hasData || isAnalysisRunning || failedStep || error || pipelineRunState?.runId),
    header: {
      eyebrow: "Audit & Governance",
      title: "Can we trust, explain, and export this AI-assisted review process?",
      takeaway: buildGovernanceHeaderTakeaway({ runState, auditEntries: entries, auditGroups, auditExport })
    },
    runState,
    uploadedData,
    apiExposure,
    reliabilitySummary,
    validationGates,
    workflowTrace,
    tokenCost,
    latency,
    modelRouting,
    auditExport,
    auditGroups,
    rawAuditEntries: entries
  };
}
