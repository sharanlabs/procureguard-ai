export const EXCEPTION_NAMES = {
  E01: "Unit Price Variance",
  E02: "Invoice Quantity Exceeds PO",
  E03: "Invoice Quantity Exceeds GRN",
  E04: "Unauthorized Additional Charge",
  E05: "Unit of Measure Mismatch",
  E06: "Missing Goods Receipt",
  E07: "Duplicate Invoice Number",
  E08: "Supplier Name Mismatch",
  E09: "Item Description Mismatch",
  E10: "Tax Rate Mismatch",
  E11: "Invalid PO Reference",
  E12: "Invoice Predates Goods Receipt",
  E13: "GRN Quantity Exceeds PO",
  E14: "Short Delivery",
  E15: "Invoice Covers Undelivered Goods",
  E16: "Missing Early-Payment Discount",
  E17: "Tariff-Adjusted Price Variance"
};

const PRICE_RELATED_CODES = new Set(["E01", "E10", "E16", "E17"]);
const TIMING_RECEIPT_CODES = new Set(["E03", "E06", "E12", "E15"]);

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function addRow(group, row) {
  group.rows.push(row);
  addUnique(group.invoiceNumbers, row.invoiceNumber);
  group.totalExposure += row.exposureAmount;
}

function getSupplierKey(invoice) {
  return invoice?.supplier_id || invoice?.supplier_name || "unknown_supplier";
}

function getSupplierName(invoice, po) {
  return invoice?.supplier_name || po?.supplier_name || "Unknown supplier";
}

function getExposureAmount(classification) {
  const exposure = classification?.financial_summary?.total_exposure;
  return typeof exposure === "number" && !Number.isNaN(exposure) ? exposure : 0;
}

function getMatchedGrns(parsedFiles, match, invoice) {
  const grnNumbers = new Set(match?.grn_numbers ?? []);
  const goodsReceipts = parsedFiles?.goods_receipts ?? [];

  if (grnNumbers.size > 0) {
    return goodsReceipts.filter((grn) => grnNumbers.has(grn.grn_number));
  }

  return goodsReceipts.filter((grn) => (
    grn.po_reference === (match?.po_number || invoice?.po_reference) &&
    grn.item_code === invoice?.item_code
  ));
}

function createPattern(type, description, group, recommendedAction) {
  return {
    id: `${type}-${group.key}`,
    type,
    description,
    affectedInvoices: group.invoiceNumbers,
    totalExposure: group.totalExposure,
    recommendedAction
  };
}

function buildExceptionRows(parsedFiles, matchResults, classificationResults) {
  const matches = matchResults?.results ?? [];
  const classifications = classificationResults?.classifications ?? [];
  const invoices = parsedFiles?.invoices ?? [];
  const purchaseOrders = parsedFiles?.purchase_orders ?? [];

  return matches
    .map((match, index) => {
      const codes = match?.detected_exceptions ?? [];
      if (!codes.length) return null;

      const invoice = invoices[index] ?? {};
      const classification = classifications[index] ?? {};
      const po = purchaseOrders.find((item) => item.po_number === (match?.po_number || invoice.po_reference)) ?? {};
      const warehouses = getMatchedGrns(parsedFiles, match, invoice)
        .map((grn) => grn.receiving_warehouse)
        .filter(Boolean);

      return {
        invoiceNumber: invoice.invoice_number || match?.invoice_number || "Unknown invoice",
        supplierKey: getSupplierKey(invoice),
        supplierName: getSupplierName(invoice, po),
        exceptionCodes: codes,
        exposureAmount: getExposureAmount(classification),
        warehouses: [...new Set(warehouses)]
      };
    })
    .filter(Boolean);
}

function groupBySupplier(exceptionRows) {
  const groups = new Map();

  exceptionRows.forEach((row) => {
    if (!groups.has(row.supplierKey)) {
      groups.set(row.supplierKey, {
        key: row.supplierKey,
        supplierName: row.supplierName,
        rows: [],
        invoiceNumbers: [],
        totalExposure: 0
      });
    }

    addRow(groups.get(row.supplierKey), row);
  });

  return [...groups.values()];
}

function buildSupplierConcentrationPatterns(exceptionRows) {
  return groupBySupplier(exceptionRows)
    .filter((group) => group.rows.length >= 3)
    .map((group) => createPattern(
      "Supplier concentration",
      `Supplier ${group.supplierName} accounts for ${group.rows.length} exception rows and $${group.totalExposure.toFixed(2)} in exposure.`,
      group,
      `Review recent invoices and contract terms with ${group.supplierName}.`
    ));
}

function buildExceptionTypePatterns(exceptionRows) {
  const groups = new Map();

  exceptionRows.forEach((row) => {
    row.exceptionCodes.forEach((code) => {
      if (!groups.has(code)) {
        groups.set(code, {
          key: code,
          rows: [],
          invoiceNumbers: [],
          totalExposure: 0
        });
      }

      addRow(groups.get(code), row);
    });
  });

  return [...groups.entries()]
    .filter(([, group]) => group.rows.length >= 3)
    .map(([code, group]) => {
      const exceptionName = EXCEPTION_NAMES[code] ?? "Unknown Exception";
      return createPattern(
        "Exception type concentration",
        `${code} (${exceptionName}) appears ${group.rows.length} times in this batch.`,
        group,
        `Review process controls related to ${exceptionName}.`
      );
    });
}

function buildWarehousePatterns(exceptionRows) {
  const groups = new Map();

  exceptionRows.forEach((row) => {
    row.warehouses.forEach((warehouse) => {
      if (!groups.has(warehouse)) {
        groups.set(warehouse, {
          key: warehouse,
          rows: [],
          invoiceNumbers: [],
          totalExposure: 0
        });
      }

      addRow(groups.get(warehouse), row);
    });
  });

  return [...groups.entries()]
    .filter(([, group]) => group.rows.length >= 3)
    .map(([warehouse, group]) => createPattern(
      "Warehouse correlation",
      `Warehouse ${warehouse} is associated with ${group.rows.length} exception rows.`,
      group,
      `Review receiving and GRN timing controls for warehouse ${warehouse}.`
    ));
}

function buildSupplierCodePattern(exceptionRows, codeSet, type, descriptionBuilder, actionBuilder) {
  return groupBySupplier(exceptionRows)
    .map((group) => {
      const matchedRows = group.rows.filter((row) => row.exceptionCodes.some((code) => codeSet.has(code)));
      const invoiceNumbers = [];
      let totalExposure = 0;

      matchedRows.forEach((row) => {
        addUnique(invoiceNumbers, row.invoiceNumber);
        totalExposure += row.exposureAmount;
      });

      return {
        key: group.key,
        supplierName: group.supplierName,
        invoiceNumbers,
        totalExposure
      };
    })
    .filter((group) => group.invoiceNumbers.length >= 2)
    .map((group) => createPattern(
      type,
      descriptionBuilder(group),
      {
        key: group.key,
        invoiceNumbers: group.invoiceNumbers,
        totalExposure: group.totalExposure
      },
      actionBuilder(group)
    ));
}

function buildPriceTrendPatterns(exceptionRows) {
  return buildSupplierCodePattern(
    exceptionRows,
    PRICE_RELATED_CODES,
    "Price trend",
    (group) => `Supplier ${group.supplierName} shows repeated pricing exceptions: ${group.invoiceNumbers.join(", ")}.`,
    (group) => `Review pricing terms, tax rules, discount handling, and tariff amendment workflow for ${group.supplierName}.`
  );
}

function buildTimingPatterns(exceptionRows) {
  return buildSupplierCodePattern(
    exceptionRows,
    TIMING_RECEIPT_CODES,
    "Timing pattern",
    (group) => `Supplier ${group.supplierName} has repeated receipt or timing exceptions: ${group.invoiceNumbers.join(", ")}.`,
    (group) => `Review shipment confirmation, receiving cutoff, and invoice timing expectations with ${group.supplierName}.`
  );
}

export function analyzeRootCauses({ parsedFiles, matchResults, classificationResults }) {
  const exceptionRows = buildExceptionRows(parsedFiles, matchResults, classificationResults);

  return {
    hasData: Boolean(matchResults?.results?.length && classificationResults?.classifications?.length),
    exceptionRowCount: exceptionRows.length,
    patterns: [
      ...buildSupplierConcentrationPatterns(exceptionRows),
      ...buildExceptionTypePatterns(exceptionRows),
      ...buildWarehousePatterns(exceptionRows),
      ...buildPriceTrendPatterns(exceptionRows),
      ...buildTimingPatterns(exceptionRows)
    ]
  };
}
