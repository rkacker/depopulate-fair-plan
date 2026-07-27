// Curated timeline of CDI / Sustainable Insurance Strategy actions (and
// non-actions) since the September 2023 insurer deal. This is the single
// structured source for the analysis page's timeline section and the
// trajectory-chart markers; keep entries sourced and dated — this feeds an
// accountability record. Draft provenance: notes/cdi-sis-timeline.md.

export type TimelineCategory =
  | "context"
  | "framework"
  | "rulemaking"
  | "fair_plan"
  | "rate"
  | "enforcement"
  | "list"
  | "market"
  | "non_action";

export interface TimelineEntry {
  date: string; // ISO; month precision where the day isn't load-bearing
  dateLabel: string; // how the page displays it
  actor: string;
  title: string;
  category: TimelineCategory;
  sourceUrl?: string;
}

export const SIS_TIMELINE: TimelineEntry[] = [
  {
    date: "2023-09-21",
    dateLabel: "Sept 21, 2023",
    actor: "Governor / CDI",
    title:
      "The deal is announced. Newsom signs an executive order directing regulatory action, and Lara unveils the Sustainable Insurance Strategy the same day: insurers get catastrophe-model pricing, and in exchange commit to writing at least 85% of their statewide market share in underserved areas. Stated target for finishing the rules: December 2024.",
    category: "framework",
    sourceUrl:
      "https://www.insurance.ca.gov/0400-news/0100-press-releases/2023/release051-2023.cfm",
  },
  {
    date: "2024-07-01",
    dateLabel: "July 2024",
    actor: "CDI",
    title:
      "FAIR Plan Modernization order — including the 50% assessment-recoupment mechanism that lets insurers pass half of FAIR Plan assessments to policyholders.",
    category: "fair_plan",
  },
  {
    date: "2024-09-01",
    dateLabel: "Aug–Sept 2024",
    actor: "CDI",
    title:
      "Rate-review reforms and the final phase of the wildfire catastrophe-modeling regulation — forward-looking models replace the 20-year historical average in ratemaking.",
    category: "rulemaking",
  },
  {
    date: "2024-11-01",
    dateLabel: "Nov 2024",
    actor: "CDI",
    title:
      "Distressed-area availability regulation — the 85% test and the § 2644.4.8 distressed/undermarketed definitions take regulatory form, fourteen months after the announcement.",
    category: "rulemaking",
  },
  {
    date: "2024-12-30",
    dateLabel: "Dec 30, 2024",
    actor: "CDI",
    title:
      "Final net-cost-of-reinsurance regulation — the last core SIS rule; insurers may pass California-specific reinsurance costs into rates if they expand high-risk coverage.",
    category: "rulemaking",
  },
  {
    date: "2025-01-07",
    dateLabel: "Jan 2025",
    actor: "—",
    title:
      "The new system takes full effect, days before the Palisades and Eaton fires destroy roughly $30 billion in insured value and put every piece of it to the test.",
    category: "framework",
  },
  {
    date: "2025-02-11",
    dateLabel: "Feb 2025",
    actor: "CDI / FAIR Plan",
    title:
      "FAIR Plan assessed member insurers $1 billion for fire losses; under Bulletin 2025-4, insurers may seek to recoup 50% from policyholders statewide.",
    category: "fair_plan",
  },
  {
    date: "2025-03-06",
    dateLabel: "Mar 6, 2025",
    actor: "CDI",
    title:
      "Distressed counties / undermarketed-ZIP list revised — the 663-ZIP list this analysis reconciles against. It has not been re-run since.",
    category: "list",
    sourceUrl:
      "https://www.insurance.ca.gov/01-consumers/180-climate-change/upload/catastrophe-modeling-and-ratemaking-insurer-commitments-to-increase-writing-of-policies-in-high-risk-wildfire-areas-list-of-distressed-counties-and-undermarketed-zip-codes-residential-property-insurance-commitments.pdf",
  },
  {
    date: "2025-05-14",
    dateLabel: "May 2025",
    actor: "CDI",
    title:
      "State Farm interim rate decision: ~17% homeowners increase approved, conditioned on a $400 million capital infusion — effective June 1, 2025.",
    category: "rate",
  },
  {
    date: "2025-08-01",
    dateLabel: "2025",
    actor: "CDI",
    title:
      "First rate approvals under the new system (Mercury and CSAA at 6.9%, USAA, Pacific Specialty), announced alongside planned policy counts such as Mercury's 38,000. Completed moves off the FAIR Plan are not part of the reporting.",
    category: "rate",
  },
  {
    date: "2025-06-15",
    dateLabel: "June 2025",
    actor: "CDI",
    title:
      "Claims enforcement arc begins: investigation into State Farm's fire-claims handling, a Smoke Claims Task Force, and legal action against the FAIR Plan over its own smoke-claim practices.",
    category: "enforcement",
  },
  {
    date: "2026-03-09",
    dateLabel: "Mar 2026",
    actor: "CDI",
    title:
      "State Farm rate case settles (subject to approval): homeowners stay at +17.0%, refunds with interest for reduced classes, non-renewal moratorium extended at least a year.",
    category: "rate",
  },
  {
    date: "2026-04-24",
    dateLabel: "Apr 2026",
    actor: "Market",
    title:
      "Travelers announces a California homeowners expansion under the SIS — the first major new commitment from a top-10 carrier since the fires. The FAIR Plan, meanwhile, files for a 35.8% rate increase.",
    category: "market",
  },
];

// Markers for the trajectory chart. Kept deliberately sparse — the band
// between announcement and operative dates carries the "announced ≠
// implemented" honesty without crowding the plot.
export const CHART_DEAL_ANNOUNCED = "2023-09-21";
export const CHART_SIS_OPERATIVE = "2025-01-07";
export const CHART_LIST_REVISED = "2025-03-06";
