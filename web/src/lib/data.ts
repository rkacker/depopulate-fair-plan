import Papa from "papaparse";
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

export async function loadSiteStats(): Promise<SiteStats> {
  const res = await fetch("/data/site_stats.json");
  if (!res.ok) throw new Error(`site_stats.json: ${res.status}`);
  return res.json();
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

export function loadCountyData(): Promise<CountyData> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCountyRow>(
      "/data/california_county_data.csv",
      {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows: CountyRow[] = [];
          const byCountyUpper = new Map<string, number>();
          let total = 0;
          let max = 0;
          for (const r of results.data) {
            if (!r.county || !r.policies) continue;
            const policies = parseInt(r.policies, 10);
            if (Number.isNaN(policies)) continue;
            const priorPolicies = r.prior_policies
              ? parseInt(r.prior_policies, 10)
              : NaN;
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
          resolve({ rows, total, max, byCountyUpper });
        },
        error: (err) => reject(err),
      }
    );
  });
}

export function titleCaseCounty(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function colorForPolicies(policies: number | undefined): string {
  if (policies === undefined || policies <= 0) return "var(--color-tier-none)";
  if (policies > 50000) return "var(--color-tier-extreme)";
  if (policies > 10000) return "var(--color-tier-high)";
  if (policies > 1000) return "var(--color-tier-moderate)";
  return "var(--color-tier-low)";
}

// ZIP-scale palette: max ~7,400 / p99 ~3,000 / p50 ~130. Visible peach for
// the long tail, transparent No-Data so the county base shows through.
export function colorForZipPolicies(policies: number | undefined): string {
  if (policies === undefined || policies <= 0) return "transparent";
  if (policies > 2500) return "#67000d";
  if (policies > 500) return "#cb181d";
  if (policies > 100) return "#fb6a4a";
  return "#fcbba1";
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

export function loadZipData(): Promise<ZipData> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawZipRow>("/data/california_zip_data.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ZipRow[] = [];
        const byZip = new Map<string, ZipRow>();
        let total = 0;
        let max = 0;
        for (const r of results.data) {
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
        resolve({ rows, total, max, byZip });
      },
      error: (err) => reject(err),
    });
  });
}

export function loadCountyMarketShare(): Promise<CountyMarketShareRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>("/data/cdi_county_market_share.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields ?? [];
        const years = fields
          .filter((f) => f.startsWith("fair_plan_share_"))
          .map((f) => parseInt(f.replace("fair_plan_share_", ""), 10))
          .filter((y) => !Number.isNaN(y))
          .sort();
        const latest = years[years.length - 1];
        const rows: CountyMarketShareRow[] = [];
        for (const r of results.data) {
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
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
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

function parseIntOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

export function loadZipHistory(): Promise<ZipHistoryRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawZipHistoryRow>("/data/california_zip_history.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ZipHistoryRow[] = [];
        for (const r of results.data) {
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
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}
