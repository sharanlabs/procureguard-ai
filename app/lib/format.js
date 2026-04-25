export function formatMoney(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

export function tierLabel(tier) {
  if (tier === "clean") return "CLEAN MATCH";
  if (tier === 1) return "AUTO-APPROVE";
  if (tier === 2) return "REVIEW REQUIRED";
  if (tier === 3) return "ESCALATE";
  return "Not classified";
}

export function tierClass(tier) {
  if (tier === 1) return "border-green-200 bg-green-50 text-green-800";
  if (tier === 2) return "border-amber-200 bg-amber-50 text-amber-800";
  if (tier === 3) return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function statusLabel(status) {
  return String(status ?? "pending").replace(/_/g, " ");
}

function lowerFirst(text) {
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : "";
}

function continuationSummary(text) {
  return lowerFirst(text).replace(/^invoice /, "the invoice ");
}

function exceptionSummary(code, match = {}) {
  const quantity = match.quantity_match ?? {};
  const delta = typeof quantity.delta === "number" ? Math.abs(quantity.delta) : null;
  const unitWord = delta === 1 ? "unit" : "units";
  const summaries = {
    E01: "Invoice unit price differs from the PO price.",
    E02: "Invoice quantity exceeds the authorized PO quantity.",
    E03: delta ? `Invoice quantity exceeds confirmed goods received by ${delta} ${unitWord}.` : "Invoice quantity exceeds confirmed goods received.",
    E04: "Invoice includes an unauthorized surcharge or additional charge.",
    E05: "Invoice UOM differs from the PO UOM.",
    E06: "No goods receipt was found for this invoice.",
    E07: "Invoice number appears to be duplicated.",
    E08: "Supplier name differs, but supplier ID confirms the entity.",
    E09: "Item description differs, but item code matches.",
    E10: "Invoice tax total differs from the PO tax terms.",
    E11: "Invoice references an invalid PO.",
    E12: "Invoice date predates goods receipt.",
    E13: "Goods receipt quantity exceeds the PO quantity.",
    E14: "Supplier delivered and invoiced less than the PO quantity.",
    E15: "Invoice covers goods not fully received at invoice date.",
    E16: "Invoice omits the early-payment discount from PO terms.",
    E17: "Invoice price variance is tied to a tariff claim requiring procurement review."
  };

  return summaries[code] ?? `Exception ${code} requires review.`;
}

export function plainLanguageSummary(match = {}) {
  const invoiceNumber = match.invoice_number ?? "this invoice";
  const exceptions = match.detected_exceptions ?? [];
  if (exceptions.length === 0) {
    return `Invoice ${invoiceNumber} is a clean match with no detected exceptions.`;
  }

  const summaries = exceptions.slice(0, 2).map((code) => exceptionSummary(code, match));
  if (summaries.length === 1) return `Invoice ${invoiceNumber}: ${summaries[0]}`;
  return `Invoice ${invoiceNumber}: ${summaries[0]} Also, ${continuationSummary(summaries[1])}`;
}

export function renderValue(value, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return String(value);
}
