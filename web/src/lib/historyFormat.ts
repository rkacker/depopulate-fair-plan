// Shared display formatters for statewide history data. Consumed by the
// `/data` Statewide-history tab and the merged "Understanding the Crisis"
// section on the home page. Keep these dependency-free — no React, no DOM.

// Em-dash so null cells span a consistent width when combined with
// `tabular-nums` on the cell.
export const EMPTY_CELL = "—";

export function fmtPolicies(n: number | null): string {
  if (n === null) return EMPTY_CELL;
  return n.toLocaleString();
}

export function fmtBillions(n: number | null): string {
  if (n === null) return EMPTY_CELL;
  // Always one decimal place, comma-separated thousands for clean alignment
  // (e.g. "$115.3 B", "$1,000.0 B" should both line up under tabular-nums).
  const billions = n / 1e9;
  const formatted = billions.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `$${formatted} B`;
}

export function fmtCoverage(s: string): string {
  const [y, m, d] = s.split("-");
  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[Number(m)]} ${Number(d)}, ${y}`;
}
