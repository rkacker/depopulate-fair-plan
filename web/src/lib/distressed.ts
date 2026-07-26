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

export interface RawReconciliationRow {
  zip?: string;
  county?: string;
  fair_plan_flag?: string;
  cdi_flag?: string;
  fhsz_high_pct?: string; // % of ZIP land area in CAL FIRE High/Very High zones
  total_policies_2023?: string; // CDI voluntary (new+renewed) 2023 + FAIR FY2023
  fair_policies_current?: string; // FAIR policies, latest quarterly release
  penetration_pct?: string; // fair_policies_current ÷ total_policies_2023
  meets_criteria?: string; // §2644.4.8 fire prong: penetration ≥15% + FHSZ overlap
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

// FY endpoints used for the "since the deal" comparison. The Sept 2023
// insurer deal was announced days before FY2023's Sept 30 close, so
// FY2023 → FY2025 growth reads as "since the deal was announced".
export const DEAL_FY = 2023;

export interface DealGroupGrowth {
  fyDeal: number; // summed policies, FY of the deal
  fyLast: number; // summed policies, latest FY
  growthPct: number; // whole percent
}

export interface FireShareDist {
  matched: number; // ZIPs with a fire-hazard value
  under10: number; // < 10% of land area in High/Very High FHSZ
  underThird: number; // < 33.3%
  over50: number; // >= 50%
}

export interface PromiseStats {
  matrix: DistressedMatrix;
  designated: DealGroupGrowth; // CDI-designated distressed ZIPs
  unlisted: DealGroupGrowth; // everything not on CDI's list
  fireDesignated: FireShareDist; // CDI-designated ZIPs vs fire hazard
  fireMissing: FireShareDist; // the FAIR-only (unflagged) ZIPs vs fire hazard
  scorecard: DesignatedScorecard; // per-ZIP depopulation outcome in named zones
  criteria: CriteriaCounts; // §2644.4.8 fire-prong recomputation
}

function fireShareDist(pcts: number[]): FireShareDist {
  return {
    matched: pcts.length,
    under10: pcts.filter((p) => p < 10).length,
    underThird: pcts.filter((p) => p < 33.3).length,
    over50: pcts.filter((p) => p >= 50).length,
  };
}

// Article-page aggregates: growth since the deal inside vs outside CDI's
// designated ZIPs, and how both the designated list and the ZIPs it misses
// overlap with actual fire-hazard zones.
export function buildPromiseStats(
  reconRows: RawReconciliationRow[],
  zipHistory: ZipHistoryRow[],
): PromiseStats {
  const { matrix } = buildDistressedData(reconRows, zipHistory);
  const historyByZip = new Map(zipHistory.map((r) => [r.zip, r]));

  const sums = {
    designated: { deal: 0, last: 0 },
    unlisted: { deal: 0, last: 0 },
  };
  const firePcts = { designated: [] as number[], missing: [] as number[] };
  const scorecard: DesignatedScorecard = { total: 0, grew: 0, flat: 0, declined: 0 };
  const criteria: CriteriaCounts = {
    scoreable: 0,
    qualify: 0,
    missedByCriteria: 0,
    listedNotQualifying: 0,
  };

  for (const r of reconRows) {
    if (!r.zip) continue;
    const cdi = r.cdi_flag === "1";
    const fairOnly = r.fair_plan_flag === "1" && !cdi;

    const h = historyByZip.get(r.zip);
    const deal = h?.fy[DEAL_FY] ?? null;
    const last = h?.fy[FY_LAST] ?? null;
    if (deal !== null && last !== null) {
      const bucket = cdi ? sums.designated : sums.unlisted;
      bucket.deal += deal;
      bucket.last += last;
      if (cdi) {
        scorecard.total += 1;
        if (last > deal) scorecard.grew += 1;
        else if (last < deal) scorecard.declined += 1;
        else scorecard.flat += 1;
      }
    }

    if (r.meets_criteria === "0" || r.meets_criteria === "1") {
      criteria.scoreable += 1;
      const meets = r.meets_criteria === "1";
      if (meets) {
        criteria.qualify += 1;
        if (!cdi) criteria.missedByCriteria += 1;
      } else if (cdi) {
        criteria.listedNotQualifying += 1;
      }
    }

    const firePct = r.fhsz_high_pct === undefined || r.fhsz_high_pct === ""
      ? null
      : parseFloat(r.fhsz_high_pct);
    if (firePct !== null && !Number.isNaN(firePct)) {
      if (cdi) firePcts.designated.push(firePct);
      if (fairOnly) firePcts.missing.push(firePct);
    }
  }

  const growth = (b: { deal: number; last: number }): DealGroupGrowth => ({
    fyDeal: b.deal,
    fyLast: b.last,
    growthPct: b.deal > 0 ? Math.round(((b.last - b.deal) / b.deal) * 100) : 0,
  });

  return {
    matrix,
    designated: growth(sums.designated),
    unlisted: growth(sums.unlisted),
    fireDesignated: fireShareDist(firePcts.designated),
    fireMissing: fireShareDist(firePcts.missing),
    scorecard,
    criteria,
  };
}

export interface DesignatedScorecard {
  total: number; // designated ZIPs with FY data at both endpoints
  grew: number;
  flat: number;
  declined: number;
}

export interface CriteriaCounts {
  scoreable: number; // ZIPs with penetration + fire inputs
  qualify: number; // meet the §2644.4.8 fire prong today
  missedByCriteria: number; // qualify but absent from the official list
  listedNotQualifying: number; // on the list, don't meet the fire prong now
}
