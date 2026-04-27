import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const EXCEPTION_ORDER = [
  "E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09",
  "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17"
];
const TIER_BY_CODE = {
  E01: 2,
  E02: 3,
  E03: 2,
  E04: 2,
  E05: 2,
  E06: 3,
  E07: 3,
  E08: 1,
  E09: 1,
  E10: 2,
  E11: 3,
  E12: 2,
  E13: 1,
  E14: 1,
  E15: 2,
  E16: 2,
  E17: 2
};
const NUMERIC_FIELDS = new Set([
  "quantity",
  "unit_price",
  "total_amount",
  "quantity_invoiced",
  "quantity_received"
]);
export function parseCsv(text) {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
 for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
   if (inQuotes) {
      if (char === "\"" && source[i + 1] === "\"") {
        field += "\"";
        i += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
   if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
 if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
 const headers = rows.shift()?.map((header) => header.trim().replace(/^\uFEFF/, "")) ?? [];
  return rows.map((cells) => {
    const record = {};
    headers.forEach((header, index) => {
      const value = cells[index] ?? "";
      record[header] = NUMERIC_FIELDS.has(header) ? Number(value) : value;
    });
    return record;
  });
}
function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}
function readCsv(relativePath) {
  return parseCsv(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}
function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function closeMoney(actual, expected) {
  return Math.abs(roundMoney(actual) - roundMoney(expected)) <= 0.01;
}
function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((item) => expected.has(item));
}
function normalizeTier(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const match = String(value).match(/[123]/);
  return match ? Number(match[0]) : null;
}
function orderExceptions(exceptionSet) {
  return EXCEPTION_ORDER.filter((code) => exceptionSet.has(code));
}
function byPoAndItem(records, poNumber, itemCode) {
  return records.filter((record) => record.po_reference === poNumber && record.item_code === itemCode);
}
function findInvoiceForTest(test, invoices) {
  const testNumber = Number(String(test.test_id).replace("TC-", ""));
  const indexedInvoice = invoices[testNumber - 1];
 if (indexedInvoice?.invoice_number === test.invoice_number) {
    return { invoice: indexedInvoice, index: testNumber - 1 };
  }
 const matches = invoices
    .map((invoice, index) => ({ invoice, index }))
    .filter((entry) => entry.invoice.invoice_number === test.invoice_number);
 if (test.test_id === "TC-21" && matches.length > 1) return matches[1];
  return matches[0] ?? null;
}
function hasLaterDuplicate(invoice, index, invoices) {
  const matches = invoices
    .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
    .filter((entry) => entry.candidate.invoice_number === invoice.invoice_number);
 if (matches.length < 2) return false;
 const ordered = [...matches].sort((a, b) => {
    if (a.candidate.invoice_date === b.candidate.invoice_date) {
      return a.candidateIndex - b.candidateIndex;
    }
    return a.candidate.invoice_date.localeCompare(b.candidate.invoice_date);
  });
 return ordered[0].candidateIndex !== index;
}
function extractUomFactor(notes) {
  const match = String(notes ?? "").match(/1\s+\w+\s*=\s*(\d+(?:\.\d+)?)\s+\w+/i);
  return match ? Number(match[1]) : null;
}
function hasTariffNote(notes) {
  return /\b(tariff|hs\s*code|hs\s*\d)/i.test(String(notes ?? ""));
}
function hasSurchargeNote(notes) {
  return /\b(surcharge|freight|fuel|handling)\b/i.test(String(notes ?? ""));
}
function hasDiscountRefusal(notes) {
  return /discount.*not offered|not offered.*discount|discount.*refus/i.test(String(notes ?? ""));
}
function taxRateFromTerms(paymentTerms) {
  const match = String(paymentTerms ?? "").match(/tax\s*(\d+(?:\.\d+)?)%/i);
  return match ? Number(match[1]) : null;
}
function discountPctFromTerms(paymentTerms) {
  const match = String(paymentTerms ?? "").match(/\b(\d+(?:\.\d+)?)\/\d+\s+net\s+\d+/i);
  return match ? Number(match[1]) : null;
}
export function detectExceptions(invoice, index, context) {
  const exceptions = new Set();
  const po = context.purchaseOrders.find((record) => record.po_number === invoice.po_reference);
 if (!po) {
    exceptions.add("E11");
    if (hasLaterDuplicate(invoice, index, context.invoices)) exceptions.add("E07");
    return orderExceptions(exceptions);
  }
 const grns = byPoAndItem(context.goodsReceipts, po.po_number, invoice.item_code);
  const grnTotal = grns.reduce((sum, grn) => sum + grn.quantity_received, 0);
  const factor = invoice.uom !== po.uom ? extractUomFactor(invoice.notes) : null;
  const comparableQty = factor ? invoice.quantity_invoiced / factor : invoice.quantity_invoiced;
  const lineTotal = invoice.quantity_invoiced * invoice.unit_price;
  const uomTotalsReconcile = Boolean(
    factor &&
    closeMoney(comparableQty, po.quantity) &&
    closeMoney(invoice.total_amount, po.total_amount)
  );
 if (invoice.uom !== po.uom) exceptions.add("E05");
  if (invoice.supplier_name !== po.supplier_name && invoice.supplier_id === po.supplier_id) {
    exceptions.add("E08");
  }
  if (invoice.item_description !== po.item_description && invoice.item_code === po.item_code) {
    exceptions.add("E09");
  }
 const hasE02 = comparableQty > po.quantity;
  if (hasE02) exceptions.add("E02");
 if (grns.length === 0) {
    exceptions.add("E06");
  } else {
    const earliestGrn = grns.reduce((earliest, grn) => (
      grn.grn_date < earliest ? grn.grn_date : earliest
    ), grns[0].grn_date);
   if (!hasE02 && comparableQty > grnTotal) exceptions.add("E03");
    // E12 is a date-sequencing exception. It does not require quantity over-delivery.
    if (invoice.invoice_date < earliestGrn) exceptions.add("E12");
    if (grnTotal > po.quantity) exceptions.add("E13");
    if (comparableQty < po.quantity && closeMoney(comparableQty, grnTotal)) exceptions.add("E14");
    if (grns.length > 1 && grns.some((grn) => grn.grn_date > invoice.invoice_date)) exceptions.add("E15");
  }
 if (!uomTotalsReconcile && !closeMoney(invoice.unit_price, po.unit_price)) {
    if (invoice.unit_price > po.unit_price && hasTariffNote(invoice.notes)) {
      exceptions.add("E17");
    } else {
      exceptions.add("E01");
    }
  }
 if (invoice.total_amount > lineTotal && hasSurchargeNote(invoice.notes)) exceptions.add("E04");
 const taxRate = taxRateFromTerms(po.payment_terms);
  if (taxRate !== null) {
    const expectedTaxTotal = po.unit_price * invoice.quantity_invoiced * (1 + taxRate / 100);
    if (!closeMoney(invoice.total_amount, expectedTaxTotal)) exceptions.add("E10");
  }
 if (discountPctFromTerms(po.payment_terms) !== null && hasDiscountRefusal(invoice.notes)) {
    exceptions.add("E16");
  }
 if (hasLaterDuplicate(invoice, index, context.invoices)) exceptions.add("E07");
  return orderExceptions(exceptions);
}
function financialFor(invoice, exceptions, context) {
  const po = context.purchaseOrders.find((record) => record.po_number === invoice.po_reference);
  const total = roundMoney(invoice.total_amount);
 if (exceptions.length === 0) {
    return { exposure_amount: 0, hold_amount: 0, approved_amount: total };
  }
 if (!po) {
    return { exposure_amount: total, hold_amount: total, approved_amount: 0 };
  }
 if (exceptions.includes("E02")) {
    const exposure = roundMoney((invoice.quantity_invoiced - po.quantity) * invoice.unit_price);
    return { exposure_amount: exposure, hold_amount: total, approved_amount: 0 };
  }
 if (exceptions.includes("E06") || exceptions.includes("E07") || exceptions.includes("E11")) {
    return { exposure_amount: total, hold_amount: total, approved_amount: 0 };
  }
 if (exceptions.includes("E17")) {
    const exposure = roundMoney((invoice.unit_price - po.unit_price) * invoice.quantity_invoiced);
    return { exposure_amount: exposure, hold_amount: total, approved_amount: 0 };
  }
 let hold = 0;
  const grns = byPoAndItem(context.goodsReceipts, po.po_number, invoice.item_code);
 if (exceptions.includes("E01")) {
    hold += Math.abs((invoice.unit_price - po.unit_price) * invoice.quantity_invoiced);
  }
  if (exceptions.includes("E03")) {
    const grnTotal = grns.reduce((sum, grn) => sum + grn.quantity_received, 0);
    hold += (invoice.quantity_invoiced - grnTotal) * invoice.unit_price;
  }
  if (exceptions.includes("E04")) {
    hold += invoice.total_amount - invoice.quantity_invoiced * invoice.unit_price;
  }
  if (exceptions.includes("E10")) {
    const taxRate = taxRateFromTerms(po.payment_terms);
    const expectedTaxTotal = po.unit_price * invoice.quantity_invoiced * (1 + taxRate / 100);
    hold += Math.abs(invoice.total_amount - expectedTaxTotal);
  }
  if (exceptions.includes("E15") && !exceptions.includes("E04")) {
    const confirmedQty = grns
      .filter((grn) => grn.grn_date <= invoice.invoice_date)
      .reduce((sum, grn) => sum + grn.quantity_received, 0);
    hold += (invoice.quantity_invoiced - confirmedQty) * invoice.unit_price;
  }
  if (exceptions.includes("E16")) {
    hold += invoice.total_amount * (discountPctFromTerms(po.payment_terms) / 100);
  }
 hold = roundMoney(hold);
  return {
    exposure_amount: hold,
    hold_amount: hold,
    approved_amount: roundMoney(total - hold)
  };
}
function actualTier(exceptions) {
  if (exceptions.length === 0) return null;
  return Math.max(...exceptions.map((exception) => TIER_BY_CODE[exception]));
}
function validateTest(test, context) {
  const details = [];
  const located = findInvoiceForTest(test, context.invoices);
 if (!located) {
    return {
      test_id: test.test_id,
      invoice_number: test.invoice_number,
      status: "FAIL",
      expected_exceptions: test.expected.detected_exceptions,
      validated_exceptions: [],
      details: [`Invoice ${test.invoice_number} not found in CSV data.`]
    };
  }
 const exceptions = detectExceptions(located.invoice, located.index, context);
  const expectedExceptions = test.expected.detected_exceptions;
  const tier = actualTier(exceptions);
  const matchStatus = exceptions.length === 0 ? "clean_match" : `exception_tier_${tier}`;
  const financial = financialFor(located.invoice, exceptions, context);
 if (!sameSet(exceptions, expectedExceptions)) {
    details.push(`Expected exceptions ${JSON.stringify(expectedExceptions)}, got ${JSON.stringify(exceptions)}.`);
  }
  if (matchStatus !== test.expected.match_status) {
    details.push(`Expected match_status ${test.expected.match_status}, got ${matchStatus}.`);
  }
  if (normalizeTier(test.expected.overall_tier) !== tier) {
    details.push(`Expected overall_tier ${test.expected.overall_tier}, got ${tier}.`);
  }
  if (test.expected.is_clean !== (exceptions.length === 0)) {
    details.push(`Expected is_clean ${test.expected.is_clean}, got ${exceptions.length === 0}.`);
  }
 for (const key of ["exposure_amount", "hold_amount", "approved_amount"]) {
    if (!closeMoney(financial[key], test.expected.financial[key])) {
      details.push(`Expected financial.${key} ${test.expected.financial[key]}, got ${financial[key]}.`);
    }
  }
 return {
    test_id: test.test_id,
    invoice_number: test.invoice_number,
    status: details.length === 0 ? "PASS" : "FAIL",
    expected_exceptions: expectedExceptions,
    validated_exceptions: exceptions,
    details
  };
}
function main() {
  const dataset = readJson("evals/golden_dataset.json");
  const context = {
    purchaseOrders: readCsv("data/purchase_orders.csv"),
    invoices: readCsv("data/invoices.csv"),
    goodsReceipts: readCsv("data/goods_receipts.csv")
  };
 if (!Array.isArray(dataset.procurement_tests) || !Array.isArray(dataset.text_extraction_tests)) {
    throw new Error("golden_dataset.json must contain procurement_tests and text_extraction_tests arrays.");
  }
 const results = dataset.procurement_tests.map((test) => validateTest(test, context));
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.length - passed;
  const passRate = results.length === 0 ? 0 : roundMoney((passed / results.length) * 100);
  const timestamp = new Date().toISOString();
  const resultPayload = {
    timestamp,
    total_procurement_tests: results.length,
    passed,
    failed,
    pass_rate: passRate,
    text_extraction_tests_included: dataset.text_extraction_tests.length,
    results
  };
 const resultsDir = path.join(repoRoot, "evals", "results");
  mkdirSync(resultsDir, { recursive: true });
  const filename = `eval_results_${timestamp.replace(/[:.]/g, "-")}.json`;
  writeFileSync(path.join(resultsDir, filename), `${JSON.stringify(resultPayload, null, 2)}\n`);
 console.log(`total_procurement_tests: ${results.length}`);
  console.log(`passed: ${passed}`);
  console.log(`failed: ${failed}`);
  console.log(`pass_rate: ${passRate}%`);
  console.log(`text_extraction_tests_included: ${dataset.text_extraction_tests.length}`);
 if (failed > 0) process.exitCode = 1;
}
main();
