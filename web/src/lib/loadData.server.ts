// Server-only data loaders. Runs in Astro frontmatter (Node) at build time so
// pages ship with real data baked into the HTML — no client fetch, no
// loading skeletons in view-source. Mirrors the parsing in data.ts but reads
// from Vite `?raw` imports of public/data/, which bundles the file contents
// at build time so we don't depend on the filesystem at runtime.
import Papa from "papaparse";
import siteStatsJson from "../../public/data/site_stats.json";
import countyCsv from "../../public/data/california_county_data.csv?raw";
import zipCsv from "../../public/data/california_zip_data.csv?raw";
import statewideHistoryCsv from "../../public/data/fair_statewide_history.csv?raw";
import marketShareCsv from "../../public/data/cdi_county_market_share.csv?raw";
import zipHistoryCsv from "../../public/data/california_zip_history.csv?raw";
import type {
  CountyData,
  CountyMarketShareRow,
  CountyRow,
  Direction,
  SiteStats,
  ZipData,
  ZipHistoryRow,
  ZipRow,
} from "@/types";

function parseCsv<T>(text: string): T[] {
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}

export function loadSiteStatsServer(): SiteStats {
  return siteStatsJson as SiteStats;
}

interface RawCountyRow {
  county?: string;
  policies?: string;
  prior_policies?: string;
  change_pct?: string;
  direction?: string;
  yoy_change_pct?: string;
  yoy_direction?: string;
}

export function loadCountyDataServer(): CountyData {
  const rows: CountyRow[] = [];
  const byCountyUpper = new Map<string, number>();
  let total = 0;
  let max = 0;
  for (const r of parseCsv<RawCountyRow>(countyCsv)) {
    if (!r.county || !r.policies) continue;
    const policies = parseInt(r.policies, 10);
    if (Number.isNaN(policies)) continue;
    const priorPolicies = r.prior_policies ? parseInt(r.prior_policies, 10) : NaN;
    const changePct = r.change_pct ? parseFloat(r.change_pct) : NaN;
    const direction = (r.direction as Direction) ?? "new";
    const yoyChangePct = r.yoy_change_pct ? parseFloat(r.yoy_change_pct) : NaN;
    const yoyDirection = (r.yoy_direction as Direction) ?? "new";
    rows.push({
      county: r.county,
      policies,
      priorPolicies: Number.isNaN(priorPolicies) ? null : priorPolicies,
      changePct: Number.isNaN(changePct) ? null : changePct,
      direction,
      yoyChangePct: Number.isNaN(yoyChangePct) ? null : yoyChangePct,
      yoyDirection,
    });
    byCountyUpper.set(r.county.toUpperCase(), policies);
    total += policies;
    if (policies > max) max = policies;
  }
  return { rows, total, max, byCountyUpper };
}

interface RawZipRow {
  zip?: string;
  city?: string;
  county?: string;
  region?: string;
  policies?: string;
  prior_policies?: string;
  change_pct?: string;
  direction?: string;
  yoy_change_pct?: string;
  yoy_direction?: string;
}

export function loadZipDataServer(): ZipData {
  const rows: ZipRow[] = [];
  const byZip = new Map<string, ZipRow>();
  let total = 0;
  let max = 0;
  for (const r of parseCsv<RawZipRow>(zipCsv)) {
    if (!r.zip || !r.policies) continue;
    const policies = parseInt(r.policies, 10);
    if (Number.isNaN(policies)) continue;
    const priorPolicies = r.prior_policies ? parseInt(r.prior_policies, 10) : NaN;
    const changePct = r.change_pct ? parseFloat(r.change_pct) : NaN;
    const direction = (r.direction as Direction) ?? "new";
    const yoyChangePct = r.yoy_change_pct ? parseFloat(r.yoy_change_pct) : NaN;
    const yoyDirection = (r.yoy_direction as Direction) ?? "new";
    const row: ZipRow = {
      zip: r.zip,
      city: r.city ?? "",
      county: r.county ?? "",
      region: r.region ?? "",
      policies,
      priorPolicies: Number.isNaN(priorPolicies) ? null : priorPolicies,
      changePct: Number.isNaN(changePct) ? null : changePct,
      direction,
      yoyChangePct: Number.isNaN(yoyChangePct) ? null : yoyChangePct,
      yoyDirection,
    };
    rows.push(row);
    byZip.set(r.zip, row);
    total += policies;
    if (policies > max) max = policies;
  }
  return { rows, total, max, byZip };
}

interface RawHistoryRow {
  coverage_end?: string;
  policy_count?: string;
  exposure?: string;
  premium?: string;
  source?: string;
}

export interface StatewideHistoryRow {
  coverage_end: string;
  policy_count: number | null;
  exposure: number | null;
  premium: number | null;
  source: string;
}

function parseIntOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

export function loadStatewideHistoryServer(): StatewideHistoryRow[] {
  const rows: StatewideHistoryRow[] = [];
  for (const r of parseCsv<RawHistoryRow>(statewideHistoryCsv)) {
    if (!r.coverage_end) continue;
    rows.push({
      coverage_end: r.coverage_end,
      policy_count: parseIntOrNull(r.policy_count),
      exposure: parseIntOrNull(r.exposure),
      premium: parseIntOrNull(r.premium),
      source: r.source ?? "",
    });
  }
  rows.sort((a, b) => b.coverage_end.localeCompare(a.coverage_end));
  return rows;
}

export function loadCountyMarketShareServer(): CountyMarketShareRow[] {
  const result = Papa.parse<Record<string, string>>(marketShareCsv, {
    header: true,
    skipEmptyLines: true,
  });
  const fields = result.meta.fields ?? [];
  const years = fields
    .filter((f) => f.startsWith("fair_plan_share_"))
    .map((f) => parseInt(f.replace("fair_plan_share_", ""), 10))
    .filter((y) => !Number.isNaN(y))
    .sort((a, b) => a - b);
  const latest = years[years.length - 1];
  const rows: CountyMarketShareRow[] = [];
  for (const r of result.data) {
    if (!r.county || r.county === "State") continue;
    const series = years.map((y) => parseFloat(r[`fair_plan_share_${y}`] ?? "0"));
    const share = parseFloat(r[`fair_plan_share_${latest}`] ?? "0");
    const fair = parseInt(r[`fair_plan_pif_${latest}`] ?? "0", 10);
    const total = parseInt(r[`total_pif_${latest}`] ?? "0", 10);
    if (Number.isNaN(share) || Number.isNaN(fair) || Number.isNaN(total)) continue;
    rows.push({
      county: r.county,
      fairShareLatest: share,
      fairPifLatest: fair,
      totalPifLatest: total,
      fairShareSeries: series,
      years,
    });
  }
  return rows;
}

interface RawZipHistoryRow {
  zip?: string;
  city?: string;
  county?: string;
  fy_2021?: string;
  fy_2022?: string;
  fy_2023?: string;
  fy_2024?: string;
  fy_2025?: string;
}

export function loadZipHistoryServer(): ZipHistoryRow[] {
  const rows: ZipHistoryRow[] = [];
  for (const r of parseCsv<RawZipHistoryRow>(zipHistoryCsv)) {
    if (!r.zip) continue;
    const fy = {
      2021: parseIntOrNull(r.fy_2021),
      2022: parseIntOrNull(r.fy_2022),
      2023: parseIntOrNull(r.fy_2023),
      2024: parseIntOrNull(r.fy_2024),
      2025: parseIntOrNull(r.fy_2025),
    };
    const series = ([2021, 2022, 2023, 2024, 2025] as const)
      .map((y) => fy[y])
      .filter((v): v is number => v !== null);
    rows.push({
      zip: r.zip,
      city: r.city ?? "",
      county: r.county ?? "",
      fy,
      series,
    });
  }
  return rows;
}
