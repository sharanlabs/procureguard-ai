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
