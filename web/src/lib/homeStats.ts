// Build-time headline figures for the home page, all derived from the synced
// exports so the page can't drift from /data.
import Papa from "papaparse";
import marketShareCsv from "../../public/data/cdi_county_market_share.csv?raw";
import distressedListCsv from "../../public/data/cdi_distressed_list.csv?raw";
import type { StatewideHistoryRow } from "@/lib/loadData.server";

// A quarterly change under this share of the base is reported as "flat".
export const FLAT_THRESHOLD = 0.005;

// Fiscal-year close nearest the Sept 21, 2023 deal announcement.
export const DEAL_COVERAGE_END = "2023-09-30";

export interface HomeStats {
  latest: StatewideHistoryRow;
  prior: StatewideHistoryRow; // previous quarter
  yearAgo: StatewideHistoryRow | null;
  deal: StatewideHistoryRow;
  quarterChange: number;
  // True when the quarterly move is too small to read as a direction. The
  // Plan's own publications differ by more than this from one another.
  quarterIsFlat: boolean;
  sinceDealChange: number;
  sinceDealMultiple: number;
  marketShare: { year: number; pct: number; fair: number; total: number } | null;
}

export function buildHomeStats(history: StatewideHistoryRow[]): HomeStats {
  const rows = history
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => b.coverage_end.localeCompare(a.coverage_end));
  const latest = rows[0];
  const prior = rows[1];
  const deal = rows.find((r) => r.coverage_end === DEAL_COVERAGE_END);
  if (!latest || !prior || !deal) {
    throw new Error("statewide history is missing the latest, prior or deal-year row");
  }
  const yearAgoDate = `${Number(latest.coverage_end.slice(0, 4)) - 1}${latest.coverage_end.slice(4)}`;
  const yearAgo = rows.find((r) => r.coverage_end === yearAgoDate) ?? null;
  const n = (r: StatewideHistoryRow) => r.policy_count ?? 0;
  return {
    latest,
    prior,
    yearAgo,
    deal,
    quarterChange: n(latest) - n(prior),
    quarterIsFlat: Math.abs(n(latest) - n(prior)) / n(prior) < FLAT_THRESHOLD,
    sinceDealChange: n(latest) - n(deal),
    sinceDealMultiple: n(latest) / n(deal),
    marketShare: loadStateMarketShare(),
  };
}

function loadStateMarketShare(): HomeStats["marketShare"] {
  const result = Papa.parse<Record<string, string>>(marketShareCsv, {
    header: true,
    skipEmptyLines: true,
  });
  const state = result.data.find((r) => r.county === "State");
  if (!state) return null;
  const years = (result.meta.fields ?? [])
    .filter((f) => f.startsWith("fair_plan_share_"))
    .map((f) => parseInt(f.replace("fair_plan_share_", ""), 10))
    .sort((a, b) => a - b);
  const year = years[years.length - 1];
  if (!year) return null;
  return {
    year,
    pct: parseFloat(state[`fair_plan_share_${year}`] ?? "0"),
    fair: parseInt(state[`fair_plan_pif_${year}`] ?? "0", 10),
    total: parseInt(state[`total_pif_${year}`] ?? "0", 10),
  };
}

// The 29 counties on the Department of Insurance's distressed list. ZIP-level
// membership is read client-side from the reconciliation export.
export function loadDistressedCounties(): { counties: string[]; effectiveDate: string } {
  const result = Papa.parse<Record<string, string>>(distressedListCsv, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = result.data.filter((r) => r.geo_type === "county");
  return {
    counties: rows.map((r) => r.geo_name).sort(),
    effectiveDate: rows[0]?.effective_date ?? "",
  };
}

export function fmtSigned(n: number): string {
  const s = Math.abs(n).toLocaleString("en-US");
  return n < 0 ? `−${s}` : `+${s}`;
}

export function fmtLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[(m ?? 1) - 1]} ${d}, ${y}`;
}
