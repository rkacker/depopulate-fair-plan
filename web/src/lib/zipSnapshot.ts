// One ZIP code's figures, assembled the same way at build time (for the
// default ZIP shown on the home page) and in the browser (for a lookup).
import type { ZipHistoryRow, ZipRow } from "@/types";

export interface ZipReconRow {
  zip?: string;
  cdi_flag?: string;
  fhsz_high_pct?: string;
  penetration_pct?: string;
  meets_criteria?: string;
}

export const ZIP_YEARS = [2021, 2022, 2023, 2024, 2025, 2026] as const;
// Growth percentages on a tiny base are noise; below this we leave them blank.
export const ZIP_MIN_BASE = 50;

export interface ZipSnapshot {
  zip: string;
  city: string;
  county: string;
  policies: number;
  yoyChangePct: number | null;
  sinceDealPct: number | null; // fiscal 2023 to fiscal 2026
  sharePct: number | null; // FAIR policies / all residential policies (2023)
  firePct: number | null; // land in CAL FIRE High or Very High zones
  zipListed: boolean;
  countyListed: boolean;
  meetsFireTest: boolean;
  fy: Array<number | null>; // aligned with ZIP_YEARS
}

function num(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function buildZipSnapshot(
  row: ZipRow,
  recon: ZipReconRow | undefined,
  hist: ZipHistoryRow | undefined,
  distressedCounties: string[],
): ZipSnapshot {
  const fy2023 = hist?.fy[2023] ?? null;
  const fy2026 = hist?.fy[2026] ?? null;
  return {
    zip: row.zip,
    city: row.city,
    county: row.county,
    policies: row.policies,
    yoyChangePct: row.yoyChangePct,
    sinceDealPct:
      fy2023 !== null && fy2026 !== null && fy2023 >= ZIP_MIN_BASE
        ? ((fy2026 - fy2023) / fy2023) * 100
        : null,
    sharePct: num(recon?.penetration_pct),
    firePct: num(recon?.fhsz_high_pct),
    zipListed: recon?.cdi_flag === "1",
    countyListed: distressedCounties.includes(row.county),
    meetsFireTest: recon?.meets_criteria === "1",
    fy: ZIP_YEARS.map((y) => hist?.fy[y] ?? null),
  };
}
