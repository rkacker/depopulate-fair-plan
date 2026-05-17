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

export interface CityRow {
  city: string;
  county: string;
  zipCount: number;
  zips: string[];
  policies: number;
  priorPolicies: number | null;
  changePct: number | null;
  direction: Direction;
  yoyChangePct: number | null;
  yoyDirection: Direction;
}

export interface CityData {
  rows: CityRow[];
  total: number;
  max: number;
  byCity: Map<string, CityRow>;
}
