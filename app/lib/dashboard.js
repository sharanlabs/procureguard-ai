import { EXCEPTION_NAMES } from "./rootCause.js";

const FALLBACK_SUPPLIER = "Unknown supplier";
const FALLBACK_WAREHOUSE = "No GRN";

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function getFinancialValue(classification, key) {
  const value = classification?.financial_summary?.[key];
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
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
      topCodes: {}
    });
  }

  return groups.get(supplier.key);
}

function addExceptionStat(stats, code, invoiceNumber, detail, classification) {
  if (!stats.has(code)) {
    stats.set(code, {
      code,
      name: EXCEPTION_NAMES[code] ?? "Unknown Exception",
      count: 0,
      exposure: 0,
      hold: 0,
      invoiceNumbers: []
    });
  }

  const row = stats.get(code);
  row.count += 1;
  row.exposure += typeof detail?.exposure_amount === "number"
    ? detail.exposure_amount
    : getFinancialValue(classification, "total_exposure");
  row.hold += typeof detail?.hold_amount === "number"
    ? detail.hold_amount
    : getFinancialValue(classification, "total_hold");
  addUnique(row.invoiceNumbers, invoiceNumber);
}

function getTokenValue(tokenUsage, keys) {
  for (const key of keys) {
    const value = tokenUsage?.[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
  }

  return 0;
}

function buildAuditGovernance(auditEntries) {
  const inputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["input_tokens", "prompt_tokens"])
  ), 0);
  const outputTokens = auditEntries.reduce((sum, entry) => (
    sum + getTokenValue(entry.token_usage, ["output_tokens", "completion_tokens"])
  ), 0);
  const totalLatency = auditEntries.reduce((sum, entry) => sum + (entry.latency_ms ?? 0), 0);
  const tokenDataReported = auditEntries.some((entry) => entry.token_usage);

  return {
    auditEntryCount: auditEntries.length,
    models: [...new Set(auditEntries.map((entry) => entry.model).filter(Boolean))],
    promptVersions: [...new Set(auditEntries.map((entry) => entry.prompt_version).filter(Boolean))],
    steps: auditEntries.map((entry) => entry.step),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    tokenDataReported,
    averageLatencyMs: auditEntries.length ? Math.round(totalLatency / auditEntries.length) : 0
  };
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
    const rowExposure = getFinancialValue(classification, "total_exposure");
    const rowHold = getFinancialValue(classification, "total_hold");

    supplier.invoiceCount += 1;
    supplier.exposure += rowExposure;
    supplier.hold += rowHold;

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

  const exceptionDrivers = [...exceptionStats.values()]
    .sort((left, right) => right.exposure - left.exposure || right.count - left.count)
    .slice(0, 8);
  const supplierScorecard = [...supplierGroups.values()]
    .sort((left, right) => right.exposure - left.exposure || right.exceptionRows - left.exceptionRows)
    .slice(0, 8)
    .map((supplier) => ({
      ...supplier,
      topExceptionCodes: Object.entries(supplier.topCodes)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([code]) => code)
    }));
  const heatmapCodes = exceptionDrivers.slice(0, 6).map((item) => item.code);
  const warehouseHeatmap = [...warehouseMap.values()]
    .sort((left, right) => right.total - left.total || right.exposure - left.exposure)
    .slice(0, 6);
  const draftActionCount = (actionResults?.action_results ?? [])
    .reduce((sum, item) => sum + (item.actions ?? []).length, 0);
  const requiresHumanReview = reviewCount + escalateCount;
  const healthyCount = cleanCount + autoApproveCount;

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
    exposureIdentified,
    holdAmount,
    approvedAmount,
    estimatedRecovery: exposureIdentified,
    lowConfidenceCount,
    draftActionCount,
    exceptionDrivers,
    supplierScorecard,
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
      { name: "Auto-approve", exposure: tierExposure.autoApprove, count: autoApproveCount },
      { name: "Review", exposure: tierExposure.review, count: reviewCount },
      { name: "Escalate", exposure: tierExposure.escalate, count: escalateCount }
    ],
    patternCount: rootCauseAnalysis?.patterns?.length ?? 0,
    auditGovernance: buildAuditGovernance(auditEntries)
  };
}
