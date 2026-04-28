import { EXCEPTION_NAMES } from "./rootCause.js";
import { formatDiversityCert } from "./format.js";

const FALLBACK_SUPPLIER = "Unknown supplier";
const FALLBACK_WAREHOUSE = "No GRN";
const ESTIMATED_RECOVERY_RATE = 0.85;
const MANUAL_REVIEW_MINUTES_PER_EXCEPTION = 15;
const BASELINE_MISS_RATE = 0.3;
const AI_ASSISTED_MISS_RATE = 0.02;
const CACHE_WRITE_INPUT_MULTIPLIER = 1.25;
const CACHE_READ_INPUT_MULTIPLIER = 0.1;
const RISK_RANK = { High: 0, Medium: 1, Low: 2 };
const MODEL_TOKEN_PRICING = [
  { match: "haiku", inputPerMillion: 1, outputPerMillion: 5 },
  { match: "sonnet", inputPerMillion: 3, outputPerMillion: 15 },
  { match: "opus", inputPerMillion: 5, outputPerMillion: 25 }
];

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function getFinancialValue(classification, key) {
  const value = classification?.financial_summary?.[key];
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

function sumExceptionFinancials(classification, key) {
  return (classification?.exception_details ?? []).reduce((sum, detail) => {
    const value = detail?.[key];
    return typeof value === "number" && !Number.isNaN(value) ? sum + value : sum;
  }, 0);
}

function getRowExposure(classification) {
  const summaryExposure = getFinancialValue(classification, "total_exposure");
  return summaryExposure || sumExceptionFinancials(classification, "exposure_amount");
}

function getRowHold(classification, fallbackExposure) {
  const summaryHold = getFinancialValue(classification, "total_hold");
  return summaryHold || sumExceptionFinancials(classification, "hold_amount") || fallbackExposure || 0;
}

function getInvoiceSupplier(invoice, po) {
  return {
    key: invoice?.supplier_id || invoice?.supplier_name || po?.supplier_id || po?.supplier_name || FALLBACK_SUPPLIER,
    name: invoice?.supplier_name || po?.supplier_name || FALLBACK_SUPPLIER
  };
}

function getMatchedWarehouses(parsedFiles, match, invoice, po) {
  const goodsReceipts = parsedFiles?.goods_receipts ?? [];
  const grnNumbers = new Set(match?.grn_numbers ?? []);

  const matchedReceipts = grnNumbers.size
    ? goodsReceipts.filter((grn) => grnNumbers.has(grn.grn_number))
    : goodsReceipts.filter((grn) => (
      grn.po_reference === (match?.po_number || invoice?.po_reference) &&
      grn.item_code === invoice?.item_code
    ));
  const warehouses = matchedReceipts.map((grn) => grn.receiving_warehouse).filter(Boolean);

  if (warehouses.length) return [...new Set(warehouses)];
  if (po?.warehouse_code) return [po.warehouse_code];
  return [FALLBACK_WAREHOUSE];
}

function ensureSupplier(groups, supplier) {
  if (!groups.has(supplier.key)) {
    groups.set(supplier.key, {
      key: supplier.key,
      supplierName: supplier.name,
      invoiceCount: 0,
      cleanCount: 0,
      autoApproveCount: 0,
      reviewCount: 0,
      escalateCount: 0,
      exceptionRows: 0,
      exposure: 0,
      hold: 0,
      topCodes: {},
      codeCounts: {},
      diversityCerts: []
    });
  }

  return groups.get(supplier.key);
}

function addExceptionStat(stats, code, invoiceNumber, detail, classification) {
  const tier = detail?.individual_tier ?? classification?.overall_tier ?? null;
  if (!stats.has(code)) {
    stats.set(code, {
      code,
      name: EXCEPTION_NAMES[code] ?? "Unknown Exception",
      count: 0,
      exposure: 0,
      hold: 0,
      tier: tier ?? 1,
      invoiceNumbers: []
    });
  }

  const row = stats.get(code);
  row.count += 1;
  row.tier = Math.max(row.tier ?? 1, tier ?? 1);
  row.exposure += typeof detail?.exposure_amount === "number"
    ? detail.exposure_amount
    : getRowExposure(classification);
  row.hold += typeof detail?.hold_amount === "number"
    ? detail.hold_amount
    : getRowHold(classification);
  addUnique(row.invoiceNumbers, invoiceNumber);
}

function getTokenValue(tokenUsage, keys) {
  for (const key of keys) {
    const value = tokenUsage?.[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
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

function buildAuditGovernance(auditEntries) {
  const inputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["input_tokens", "prompt_tokens"])
  ), 0);
  const outputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["output_tokens", "completion_tokens"])
  ), 0);
  const cacheCreationInputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["cache_creation_input_tokens"])
  ), 0);
  const cacheReadInputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["cache_read_input_tokens"])
  ), 0);
  const totalLatency = auditEntries.reduce((sum, entry) => sum + (entry.latency_ms ?? 0), 0);
  const tokenDataReported = auditEntries.some((entry) => entry.token_usage);
  const cacheUsageReported = auditEntries.some((entry) => (
    hasTokenUsageField(entry.token_usage, "cache_creation_input_tokens") ||
    hasTokenUsageField(entry.token_usage, "cache_read_input_tokens")
  ));
  const cost = auditEntries.reduce((sum, entry) => {
    const tokenCost = calculateCacheAwareTokenCost(entry);
    const flatInput = tokenCost.inputTokens;
    const flatOutput = tokenCost.outputTokens;
    const pricing = getTokenPricing(entry.model);
    const fullPriceCost = ((flatInput / 1_000_000) * pricing.inputPerMillion) +
      ((flatOutput / 1_000_000) * pricing.outputPerMillion);

    return {
      fullPrice: sum.fullPrice + fullPriceCost,
      cacheAware: sum.cacheAware + tokenCost.totalCost
    };
  }, { fullPrice: 0, cacheAware: 0 });

  return {
    auditEntryCount: auditEntries.length,
    models: [...new Set(auditEntries.map((entry) => entry.model).filter(Boolean))],
    promptVersions: [...new Set(auditEntries.map((entry) => entry.prompt_version).filter(Boolean))],
    steps: auditEntries.map((entry) => entry.step),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    cacheUsageReported,
    cacheUsageMessage: cacheUsageReported ? "" : "Cache usage not available for this run.",
    tokenDataReported,
    totalLatencyMs: totalLatency,
    estimatedFullPriceCost: cost.fullPrice,
    estimatedPromptCacheCost: cost.cacheAware,
    estimatedCacheAwareCost: cost.cacheAware,
    averageLatencyMs: auditEntries.length ? Math.round(totalLatency / auditEntries.length) : 0
  };
}

function getMatchRateLabel(rate) {
  if (rate > 0.8) return "Strong";
  if (rate >= 0.6) return "Watch";
  return "Needs attention";
}

function getSupplierRisk(exceptionRate, reviewCount, escalateCount) {
  if (exceptionRate >= 0.5 || escalateCount > 0) return "High";
  if (exceptionRate >= 0.25 || reviewCount > 0) return "Medium";
  return "Low";
}

export function buildDashboardAnalytics({
  parsedFiles,
  matchResults,
  classificationResults,
  actionResults,
  auditEntries,
  rootCauseAnalysis
}) {
  const matches = matchResults?.results ?? [];
  const classifications = classificationResults?.classifications ?? [];
  const invoices = parsedFiles?.invoices ?? [];
  const purchaseOrders = parsedFiles?.purchase_orders ?? [];
  const totalInvoices = invoices.length || matches.length;
  const supplierGroups = new Map();
  const exceptionStats = new Map();
  const warehouseMap = new Map();

  let cleanCount = 0;
  let autoApproveCount = 0;
  let reviewCount = 0;
  let escalateCount = 0;
  let exceptionRows = 0;
  let exposureIdentified = 0;
  let holdAmount = 0;
  let approvedAmount = 0;
  let lowConfidenceCount = 0;
  const tierExposure = { autoApprove: 0, review: 0, escalate: 0 };

  matches.forEach((match, index) => {
    const invoice = invoices[index] ?? {};
    const classification = classifications[index] ?? {};
    const po = purchaseOrders.find((item) => item.po_number === (match?.po_number || invoice.po_reference)) ?? {};
    const exceptions = match?.detected_exceptions ?? [];
    const hasExceptions = exceptions.length > 0;
    const tier = classification?.overall_tier;
    const supplier = ensureSupplier(supplierGroups, getInvoiceSupplier(invoice, po));
    const invoiceNumber = invoice.invoice_number || match?.invoice_number || "Unknown invoice";
    const rowExposure = getRowExposure(classification);
    const rowHold = getRowHold(classification, rowExposure);

    supplier.invoiceCount += 1;
    supplier.exposure += rowExposure;
    supplier.hold += rowHold;
    addUnique(supplier.diversityCerts, po.supplier_diversity_cert);

    if (!hasExceptions) {
      cleanCount += 1;
      supplier.cleanCount += 1;
    } else {
      exceptionRows += 1;
      supplier.exceptionRows += 1;
    }

    if (tier === 1 && hasExceptions) {
      autoApproveCount += 1;
      supplier.autoApproveCount += 1;
      tierExposure.autoApprove += rowExposure;
    }
    if (tier === 2) {
      reviewCount += 1;
      supplier.reviewCount += 1;
      tierExposure.review += rowExposure;
    }
    if (tier === 3) {
      escalateCount += 1;
      supplier.escalateCount += 1;
      tierExposure.escalate += rowExposure;
    }

    exposureIdentified += rowExposure;
    holdAmount += rowHold;
    approvedAmount += getFinancialValue(classification, "total_approved");

    if ((classification?.confidence ?? match?.confidence ?? 1) < 0.85) {
      lowConfidenceCount += 1;
    }

    const detailByCode = new Map((classification?.exception_details ?? []).map((detail) => [
      detail.exception_code,
      detail
    ]));

    exceptions.forEach((code) => {
      addExceptionStat(exceptionStats, code, invoiceNumber, detailByCode.get(code), classification);
      supplier.topCodes[code] = (supplier.topCodes[code] ?? 0) + 1;
      supplier.codeCounts[code] = (supplier.codeCounts[code] ?? 0) + 1;
    });

    if (hasExceptions) {
      getMatchedWarehouses(parsedFiles, match, invoice, po).forEach((warehouse) => {
        if (!warehouseMap.has(warehouse)) {
          warehouseMap.set(warehouse, {
            warehouse,
            total: 0,
            exposure: 0,
            codes: {}
          });
        }

        const row = warehouseMap.get(warehouse);
        row.total += 1;
        row.exposure += rowExposure;
        exceptions.forEach((code) => {
          row.codes[code] = (row.codes[code] ?? 0) + 1;
        });
      });
    }
  });

  const exceptionBreakdown = [...exceptionStats.values()]
    .sort((left, right) => right.count - left.count || right.exposure - left.exposure);
  const dollarExposureByException = [...exceptionStats.values()]
    .sort((left, right) => right.exposure - left.exposure || right.count - left.count);
  const supplierScorecard = [...supplierGroups.values()]
    .map((supplier) => {
      const exceptionRate = supplier.invoiceCount ? supplier.exceptionRows / supplier.invoiceCount : 0;
      const riskLevel = getSupplierRisk(exceptionRate, supplier.reviewCount, supplier.escalateCount);
      const diversityCerts = supplier.diversityCerts
        .map(formatDiversityCert)
        .filter((cert) => cert !== "None");

      return {
        ...supplier,
        exceptionRate,
        matchRate: supplier.invoiceCount ? supplier.cleanCount / supplier.invoiceCount : 0,
        riskLevel,
        riskRank: RISK_RANK[riskLevel],
        diversityCertification: diversityCerts.join(", ") || "None",
        topExceptionCodes: Object.entries(supplier.topCodes)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([code]) => code)
      };
    })
    .sort((left, right) => (
      left.riskRank - right.riskRank ||
      right.exposure - left.exposure ||
      right.exceptionRows - left.exceptionRows ||
      left.supplierName.localeCompare(right.supplierName)
    ));
  const heatmapCodes = exceptionBreakdown.map((item) => item.code);
  const supplierExceptionHeatmap = supplierScorecard
    .filter((supplier) => supplier.exceptionRows > 0)
    .map((supplier) => ({
      key: supplier.key,
      supplierName: supplier.supplierName,
      exposure: supplier.exposure,
      codes: supplier.codeCounts
    }));
  const warehouseHeatmap = [...warehouseMap.values()]
    .sort((left, right) => right.total - left.total || right.exposure - left.exposure)
    .slice(0, 6);
  const draftActionCount = (actionResults?.action_results ?? [])
    .reduce((sum, item) => sum + (item.actions ?? []).length, 0);
  const requiresHumanReview = reviewCount + escalateCount;
  const healthyCount = cleanCount + autoApproveCount;
  const matchRate = totalInvoices ? cleanCount / totalInvoices : 0;
  const auditGovernance = buildAuditGovernance(auditEntries);

  return {
    hasData: Boolean(totalInvoices && classifications.length),
    totalInvoices,
    cleanCount,
    autoApproveCount,
    reviewCount,
    escalateCount,
    exceptionRows,
    requiresHumanReview,
    healthyCount,
    healthyRate: totalInvoices ? healthyCount / totalInvoices : 0,
    matchRate,
    matchRateLabel: getMatchRateLabel(matchRate),
    tierCounts: {
      tier1: autoApproveCount,
      tier2: reviewCount,
      tier3: escalateCount
    },
    exposureIdentified,
    holdAmount,
    approvedAmount,
    estimatedRecovery: exposureIdentified * ESTIMATED_RECOVERY_RATE,
    lowConfidenceCount,
    draftActionCount,
    exceptionBreakdown,
    dollarExposureByException,
    exceptionDrivers: dollarExposureByException.slice(0, 8),
    supplierScorecard,
    supplierExceptionHeatmap,
    warehouseHeatmap,
    heatmapCodes,
    dispositionData: [{
      name: "Invoices",
      clean: cleanCount,
      autoApprove: autoApproveCount,
      review: reviewCount,
      escalate: escalateCount
    }],
    exposureByTierData: [
      { name: "Expedited review candidate", exposure: tierExposure.autoApprove, count: autoApproveCount },
      { name: "Human review required", exposure: tierExposure.review, count: reviewCount },
      { name: "Escalation recommended", exposure: tierExposure.escalate, count: escalateCount }
    ],
    patternCount: rootCauseAnalysis?.patterns?.length ?? 0,
    roiEstimate: {
      manualReviewMinutes: exceptionRows * MANUAL_REVIEW_MINUTES_PER_EXCEPTION,
      baselineMissRate: BASELINE_MISS_RATE,
      aiAssistedMissRate: AI_ASSISTED_MISS_RATE,
      potentialUnrecoveredExposure: exposureIdentified * BASELINE_MISS_RATE,
      estimatedRecoveredAmount: exposureIdentified * ESTIMATED_RECOVERY_RATE,
      totalLatencyMs: auditGovernance.totalLatencyMs
    },
    auditGovernance
  };
}
