import Papa from "papaparse";
import type {
  CityData,
  CityRow,
  CountyData,
  CountyRow,
  Direction,
  SiteStats,
  ZipData,
  ZipRow,
} from "@/types";

export async function loadSiteStats(): Promise<SiteStats> {
  const res = await fetch("data/site_stats.json");
  if (!res.ok) throw new Error(`site_stats.json: ${res.status}`);
  return res.json();
}

interface RawCountyRow {
  county?: string;
  policies?: string;
  prior_policies?: string;
  change_pct?: string;
  direction?: string;
}

export function loadCountyData(): Promise<CountyData> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCountyRow>(
      "data/california_county_data.csv",
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
            rows.push({
              county: r.county,
              policies,
              priorPolicies: Number.isNaN(priorPolicies) ? null : priorPolicies,
              changePct: Number.isNaN(changePct) ? null : changePct,
              direction,
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

// City-scale palette: LA tops at ~42k, p99 city ~5k, median ~50.
// Low band is a visible pale peach so Sacramento Valley / Inland Empire
// cities still register; No Data is transparent so the gray county base
// shows through cleanly for unmatched Census Places.
export function colorForCityPolicies(policies: number | undefined): string {
  if (policies === undefined || policies <= 0) return "transparent";
  if (policies > 5000) return "#67000d";
  if (policies > 1000) return "#cb181d";
  if (policies > 100) return "#fb6a4a";
  return "#fcbba1";
}

// ZIP-scale palette: max ~7,400 / p99 ~3,000 / p50 ~130. Same visual logic
// as city: visible peach for the long tail, transparent No-Data so the
// county base shows through.
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
}

export function loadZipData(): Promise<ZipData> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawZipRow>("data/california_zip_data.csv", {
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
          const row: ZipRow = {
            zip: r.zip,
            city: r.city ?? "",
            county: r.county ?? "",
            region: r.region ?? "",
            policies,
            priorPolicies: Number.isNaN(priorPolicies) ? null : priorPolicies,
            changePct: Number.isNaN(changePct) ? null : changePct,
            direction,
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

interface RawCityRow {
  city?: string;
  county?: string;
  zip_count?: string;
  zips?: string;
  policies?: string;
  prior_policies?: string;
  change_pct?: string;
  direction?: string;
}

export function loadCityData(): Promise<CityData> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCityRow>("data/california_city_data.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CityRow[] = [];
        const byCity = new Map<string, CityRow>();
        let total = 0;
        let max = 0;
        for (const r of results.data) {
          if (!r.city || !r.policies) continue;
          const policies = parseInt(r.policies, 10);
          if (Number.isNaN(policies)) continue;
          const priorPolicies = r.prior_policies
            ? parseInt(r.prior_policies, 10)
            : NaN;
          const changePct = r.change_pct ? parseFloat(r.change_pct) : NaN;
          const direction = (r.direction as Direction) ?? "new";
          const row: CityRow = {
            city: r.city,
            county: r.county ?? "",
            zipCount: r.zip_count ? parseInt(r.zip_count, 10) : 0,
            zips: r.zips ? r.zips.split(",") : [],
            policies,
            priorPolicies: Number.isNaN(priorPolicies) ? null : priorPolicies,
            changePct: Number.isNaN(changePct) ? null : changePct,
            direction,
          };
          rows.push(row);
          byCity.set(r.city.toLowerCase(), row);
          total += policies;
          if (policies > max) max = policies;
        }
        resolve({ rows, total, max, byCity });
      },
      error: (err) => reject(err),
    });
  });
}
