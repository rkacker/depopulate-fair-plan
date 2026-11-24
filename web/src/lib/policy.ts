// Hand-entered facts for the home page's policy sections. Anything that is
// not computed from the synced exports lives here, with its source and the
// date we checked it, so a copy review can verify every number in one file.
//
// level: "primary" = read in the issuing agency's own document.
//        "press"   = reported by a named outlet; primary document not located.
// Re-check everything here when the facts move (new commissioner sworn in,
// new CDI dashboard update, new quarterly release). Last full check: 2026-11-23.

export interface Fact {
  value: string;
  note?: string;
  asOf: string; // date of the fact or of the source
  source: string;
  url: string;
  level: "primary" | "press";
}

const CDI = "https://www.insurance.ca.gov";
const SIS_PAGE = `${CDI}/01-consumers/180-climate-change/sustainable-insurance-strategy.Cfm`;
const SB254_STUDY =
  "https://www.cawildfirefund.com/sites/wildfire/files/documents/2026/sb254-natcatresiliencyreport-locked-4-7-26.pdf";
const RECOUP_RELEASE = `${CDI}/0400-news/0100-press-releases/2026/release022-2026.cfm`;
const CALMATTERS_PROGRESS =
  "https://calmatters.org/economy/2026/09/insurance-new-policies-progress/";
const CALMATTERS_ELECTION =
  "https://calmatters.org/politics/2026/11/california-election-2026-insurance-commissioner/";
const RES_GUIDE = `${CDI}/01-consumers/105-type/95-guides/03-res/res-ins-guide.cfm`;

export const FACTS = {
  // --- Department of Insurance dashboard ---
  insurersExpanding: {
    value: "12",
    note: "none in 2025",
    asOf: "2026-11-20",
    source: "CDI, Sustainable Insurance Strategy dashboard",
    url: SIS_PAGE,
    level: "primary",
  },
  avgPremium: {
    value: "$1,655",
    note: "$1,737 nationally",
    asOf: "2026-11-20",
    source: "CDI dashboard, citing NAIC",
    url: SIS_PAGE,
    level: "primary",
  },

  // --- What the FAIR Plan costs people who are not on it ---
  assessment: {
    value: "$1 billion",
    note: "FAIR Plan assessment on insurers after the January 2025 Los Angeles fires",
    asOf: "2025-02-11",
    source: "CDI Bulletin 2025-4 and Order 2025-1",
    url: RECOUP_RELEASE,
    level: "primary",
  },
  recoupRule: {
    value: "half",
    note: "with the commissioner's approval, insurers may recoup half of the first $1 billion of a residential assessment from their own policyholders (CDI, July 26, 2024); the state's 2026 study says amounts above $1 billion are fully recoupable",
    asOf: "2024-07-26",
    source: "CDI press release 031-2024; Bulletin 2025-4",
    url: RECOUP_RELEASE,
    level: "primary",
  },
  medianSurcharge: {
    value: "$28",
    note: "median annual fee for homeowners; a court upheld the surcharges on June 30, 2026",
    asOf: "2026-06-30",
    source: "CDI press release",
    url: RECOUP_RELEASE,
    level: "primary",
  },
  bigFireAssessment: {
    value: "$7 billion",
    note: "$500 to $550 a year per policyholder, for a wildfire season expected once in 100 years",
    asOf: "2026-04-07",
    source: "SB 254 Natural Catastrophe Resiliency Study, p. 98",
    url: SB254_STUDY,
    level: "primary",
  },

  // --- What the FAIR Plan costs people who are on it ---
  fairRateIncrease: {
    value: "29.1%",
    note: "average increase for FAIR Plan home policies, effective October 15, 2026",
    asOf: "2026-10-15",
    source: "KQED",
    url: "https://www.kqed.org/news/12094860/california-fair-plan-announces-29-1-rate-hike-for-homeowners-this-fall",
    level: "press",
  },
  fairLimit: {
    value: "$3 million",
    asOf: "2026-11-23",
    source: "CDI, California FAIR Plan page",
    url: `${CDI}/01-consumers/200-wrr/California-FAIR-Plan.cfm`,
    level: "primary",
  },
  fairGaps: {
    value: "liability, theft and water damage",
    asOf: "2026-11-23",
    source: "CDI, Residential Insurance guide",
    url: RES_GUIDE,
    level: "primary",
  },

  // --- The 2023 deal ---
  commitmentRule: {
    value: "85%",
    note: "of statewide market share in distressed areas, or 5% growth there, within two years (730 days) of the rate approval",
    asOf: "2026-11-23",
    source: "10 CCR § 2644.4.8",
    url: "https://www.law.cornell.edu/regulations/california/10-CCR-2644.4.8",
    level: "primary",
  },
  modelsReviewed: {
    value: "three",
    note: "Verisk (July 24, 2025), Karen Clark & Co. and Moody's RMS (by August 1, 2025)",
    asOf: "2025-08-01",
    source: "CDI press releases 052-2025 and 055-2025",
    url: `${CDI}/0400-news/0100-press-releases/2025/release055-2025.cfm`,
    level: "primary",
  },
  firstApproval: {
    value: "December 2025",
    note: "CDI approved its first rate filing under the strategy, from Mercury, with a growth commitment tied to the catastrophe-modeling rule, and a second from CSAA; the two-year mark falls in December 2027",
    asOf: "2025-12-20",
    source: "CDI announcement",
    url: `${CDI}/0400-news/0102-alerts/2025/Mercury-Insurance-and-CSAA-Expand-Homeow.cfm`,
    level: "primary",
  },
  rateApprovals: {
    value: "6.9%",
    note: "Mercury and CSAA were the first two approvals under the strategy (CDI, Dec. 20, 2025); the 6.9% figures and Farmers' 1.5% are from press reports. State Farm General's 17% (May 2025) was an interim increase on a request filed before the new rules",
    asOf: "2026-09-30",
    source: "San Francisco Chronicle and other press reports; CDI approval lists",
    url: `${CDI}/0250-insurers/0800-rate-filings/0100-rate-filing-lists/rate-filing-approvals/`,
    level: "press",
  },
  noComplianceCount: {
    value: "none",
    note: "as of September 23, 2026 the state had not released the number of new policies written; the Department said it collects the data annually",
    asOf: "2026-09-23",
    source: "CalMatters",
    url: CALMATTERS_PROGRESS,
    level: "press",
  },

  // --- The new commissioner ---
  election: {
    value: "54%",
    note: "Jane Kim over Ben Allen; the Associated Press called the race on November 7, 2026",
    asOf: "2026-11-07",
    source: "CalMatters",
    url: CALMATTERS_ELECTION,
    level: "press",
  },
  takesOffice: {
    value: "January 4, 2027",
    asOf: "2026-11-23",
    source: "California Secretary of State, 2026 qualifications for Insurance Commissioner",
    url: "https://elections.cdn.sos.ca.gov/statewide-elections/2026-primary/qualifications-requirements/2026-insurance-commissioner.pdf",
    level: "primary",
  },
  kimOnSis: {
    value: "we're going to be examining this program",
    asOf: "2026-11-16",
    source: "Insurance Journal",
    url: "https://www.insurancejournal.com/news/west/2026/11/16/892633.htm",
    level: "press",
  },
  ndifaBrief: {
    value: "Natural Disaster Insurance for All",
    asOf: "2026-11-23",
    source: "Jane Kim campaign policy brief",
    url: "https://www.janekim.org/policybrief",
    level: "primary",
  },
  ndifaCost: {
    value: "$25 billion",
    note: "in capital to pay for a very bad year alone; with reinsurance costing $2 to $3 billion a year ($150 to $230 per policy), starting capital falls to about $6 billion. Without reinsurance, a once-in-a-century fire would mean a charge of $1,900 to $2,000 per policyholder",
    asOf: "2026-04-07",
    source: "SB 254 Natural Catastrophe Resiliency Study, pp. 95-98",
    url: SB254_STUDY,
    level: "primary",
  },
  latimesPlan: {
    value: "",
    asOf: "2026-11-15",
    source: "Los Angeles Times",
    url: "https://www.latimes.com/business/story/2026-11-15/new-state-insurance-commissioner-has-plan-to-overhaul-troubled-home-insurance-market-will-it-work",
    level: "press",
  },

  // --- Who regulates ---
  noDutyToWrite: {
    value: "not required by law to write policies",
    note: "the Department's own description of insurers before the 2023 strategy",
    asOf: "2026-11-20",
    source: "CDI, Sustainable Insurance Strategy page",
    url: SIS_PAGE,
    level: "primary",
  },
  sisAnnouncement: {
    value: "September 21, 2023",
    asOf: "2023-09-21",
    source: "CDI press release 051-2023",
    url: `${CDI}/0400-news/0100-press-releases/2023/release051-2023.cfm`,
    level: "primary",
  },
  distressedList: {
    value: "29 counties and 663 ZIP codes",
    note: "published March 6, 2025 and not revised since",
    asOf: "2025-03-06",
    source: "CDI, list of distressed counties and undermarketed ZIP codes",
    url: `${CDI}/01-consumers/180-climate-change/upload/catastrophe-modeling-and-ratemaking-insurer-commitments-to-increase-writing-of-policies-in-high-risk-wildfire-areas-list-of-distressed-counties-and-undermarketed-zip-codes-residential-property-insurance-commitments.pdf`,
    level: "primary",
  },
  bills2026: {
    value: "September 27, 2026",
    note: "SB 1301 (Chapter 693), AB 69 (Chapter 496) and AB 1680 (Chapter 540)",
    asOf: "2026-09-27",
    source: "California Legislative Information",
    url: "https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260AB69",
    level: "primary",
  },
  rateFreeze: {
    value: "a freeze on home insurance premiums",
    note: "proposed by Governor-elect Xavier Becerra; his office says the details are still being worked out",
    asOf: "2026-11-09",
    source: "Sacramento Bee",
    url: "https://www.sacbee.com/news/politics-government/capitol-alert/article317966757.html",
    level: "press",
  },

  // --- Homeowner rights and tools ---
  nonrenewalNotice: {
    value: "75 days",
    note: "rising to 90 days on January 1, 2028 under SB 1301",
    asOf: "2026-09-27",
    source: "Insurance Code § 678; SB 1301 (Chapter 693, Statutes of 2026)",
    url: "https://leginfo.legislature.ca.gov/faces/billStatusClient.xhtml?bill_id=202520260SB1301",
    level: "primary",
  },
  moratorium: {
    value: "one year",
    asOf: "2026-11-23",
    source: "CDI, mandatory one-year moratorium on nonrenewals",
    url: `${CDI}/01-consumers/140-catastrophes/MandatoryOneYearMoratoriumNonRenewals.cfm`,
    level: "primary",
  },
  helpLine: {
    value: "800-927-4357",
    asOf: "2026-11-23",
    source: "CDI consumer help",
    url: `${CDI}/01-consumers/101-help`,
    level: "primary",
  },
  saferFromWildfires: {
    value: "Safer from Wildfires",
    asOf: "2026-11-23",
    source: "CDI",
    url: `${CDI}/01-consumers/200-wrr/Safer-from-Wildfires.cfm`,
    level: "primary",
  },
  resGuide: {
    value: "Residential Insurance guide",
    asOf: "2026-11-23",
    source: "CDI",
    url: RES_GUIDE,
    level: "primary",
  },
} satisfies Record<string, Fact>;

export type FactKey = keyof typeof FACTS;
