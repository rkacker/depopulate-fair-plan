export interface SiteStatsCard {
  value: string;
  label: string;
  detail: string;
}

export interface SiteStats {
  hero: {
    total_policies_display: string;
    description: string;
  };
  stats_cards: {
    prior_year: SiteStatsCard;
    current_year: SiteStatsCard;
    growth: SiteStatsCard;
  };
  map: {
    title: string;
    description: string;
    data_source: string;
    total_label: string;
  };
  table: {
    description: string;
    data_source: string;
  };
}

export type Direction = "up" | "down" | "flat" | "new";

export interface CountyRow {
  county: string;
  policies: number;
  priorPolicies: number | null;
  changePct: number | null;
  direction: Direction;
  yoyChangePct: number | null;
  yoyDirection: Direction;
}

export interface CountyData {
  rows: CountyRow[];
  total: number;
  max: number;
  byCountyUpper: Map<string, number>;
}

export interface ZipRow {
  zip: string;
  city: string;
  county: string;
  region: string;
  policies: number;
  priorPolicies: number | null;
  changePct: number | null;
  direction: Direction;
  yoyChangePct: number | null;
  yoyDirection: Direction;
}

export interface ZipData {
  rows: ZipRow[];
  total: number;
  max: number;
  byZip: Map<string, ZipRow>;
}

export interface ZipHistoryRow {
  zip: string;
  city: string;
  county: string;
  fy: Record<2021 | 2022 | 2023 | 2024 | 2025, number | null>;
  series: number[];
}

export interface CountyMarketShareRow {
  county: string;
  fairShareLatest: number;
  fairPifLatest: number;
  totalPifLatest: number;
  fairShareSeries: number[];
  years: number[];
}


// Distressed-flag divergence: the FAIR Plan's own distressed-area marker vs
// CDI's official distressed-ZIP list, per reconciled ZIP.
export interface DistressedMatrix {
  bothFlagged: number; // FAIR flags + CDI lists
  neither: number; // agree: not distressed
  fairOnly: number; // FAIR flags, CDI list misses — the divergence
  cdiOnly: number; // CDI lists, FAIR data doesn't flag
}

export interface DistressedZipRow {
  zip: string;
  county: string;
  policies: number | null; // latest FY policy count
  growthPct: number | null; // first FY → latest FY change, whole percent
  series: number[]; // FY sparkline values
}

export interface DistressedData {
  matrix: DistressedMatrix;
  // ZIPs flagged by FAIR Plan data but absent from CDI's list,
  // sorted by 5-year growth descending.
  fairOnlyRows: DistressedZipRow[];
}
