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

export type CountyDirection = "up" | "down" | "flat" | "new";

export interface CountyRow {
  county: string;
  policies: number;
  priorPolicies: number | null;
  changePct: number | null;
  direction: CountyDirection;
}

export interface CountyData {
  rows: CountyRow[];
  total: number;
  max: number;
  byCountyUpper: Map<string, number>;
}
