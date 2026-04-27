import { EXCEPTION_NAMES } from "./rootCause.js";

const PRICE_OR_TARIFF_CODES = new Set(["E01", "E10", "E16", "E17"]);
const CONTROL_EXCEPTION_CODES = new Set(["E07", "E11"]);
const RECEIPT_TIMING_CODES = new Set(["E03", "E06", "E12", "E15"]);

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

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeText(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return String(value);
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
