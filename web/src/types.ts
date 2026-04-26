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

export interface CountyRow {
  county: string;
  policies: number;
}

export interface CountyData {
  rows: CountyRow[];
  total: number;
  max: number;
  byCountyUpper: Map<string, number>;
}
