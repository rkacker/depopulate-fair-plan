// Shared distressed-flag divergence logic: classifies each reconciled ZIP by
// FAIR Plan flag vs CDI list and ranks the ZIPs the official list misses.
// Pure — used by the build-time server loader (preview) and the lazy client
// loader (full list) so the two can never disagree.
import type {
  DistressedData,
  DistressedMatrix,
  DistressedZipRow,
  ZipHistoryRow,
} from "@/types";

// Growth percentages on a tiny base (a ZIP going 2 → 90 policies) are noise
// and would dominate the ranking; below this FY floor we omit the percentage
// and rank by current size instead. Quoted in the section's methodology copy.
export const MIN_GROWTH_BASE = 50;

// FY window of the ZIP history export; endpoints drive the growth calc and
// the section's methodology copy.
export const FY_FIRST = 2021;
export const FY_LAST = 2025;

// Rows serialized into the homepage HTML; the full list lazy-loads on intent
// per the site's performance budget.
export const DISTRESSED_PREVIEW_COUNT = 10;

export interface RawReconciliationRow {
  zip?: string;
  county?: string;
  fair_plan_flag?: string;
  cdi_flag?: string;
}

export function buildDistressedData(
  reconRows: RawReconciliationRow[],
  zipHistory: ZipHistoryRow[],
): DistressedData {
  const historyByZip = new Map(zipHistory.map((r) => [r.zip, r]));
  const matrix: DistressedMatrix = {
    bothFlagged: 0,
    neither: 0,
    fairOnly: 0,
    cdiOnly: 0,
  };
  const fairOnlyRows: DistressedZipRow[] = [];
  for (const r of reconRows) {
    if (!r.zip) continue;
    const fair = r.fair_plan_flag === "1";
    const cdi = r.cdi_flag === "1";
    if (fair && cdi) {
      matrix.bothFlagged += 1;
    } else if (fair) {
      matrix.fairOnly += 1;
      const history = historyByZip.get(r.zip);
      const first = history?.fy[FY_FIRST] ?? null;
      const last = history?.fy[FY_LAST] ?? null;
      fairOnlyRows.push({
        zip: r.zip,
        county: r.county ?? "",
        policies: last,
        growthPct:
          first !== null && first >= MIN_GROWTH_BASE && last !== null
            ? Math.round(((last - first) / first) * 100)
            : null,
        series: history?.series ?? [],
      });
    } else if (cdi) {
      matrix.cdiOnly += 1;
    } else {
      matrix.neither += 1;
    }
  }
  // Ranked growth first; small-base ZIPs follow, ordered by current size.
  fairOnlyRows.sort((a, b) => {
    if (a.growthPct !== null || b.growthPct !== null) {
      return (b.growthPct ?? -Infinity) - (a.growthPct ?? -Infinity);
    }
    return (b.policies ?? 0) - (a.policies ?? 0);
  });
  return { matrix, fairOnlyRows };
}
