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
  if (!tier) return "Not classified";
  return `Tier ${tier}`;
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
