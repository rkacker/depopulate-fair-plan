import Papa from "papaparse";
import type { CountyData, CountyDirection, CountyRow, SiteStats } from "@/types";

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
            const direction = (r.direction as CountyDirection) ?? "new";
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
