// The long-form analysis pieces, each filed under the step of the site's
// argument it supports (see PLAN.md). Feeds the /analysis index.
export type Step = "problem" | "impact" | "responsible" | "lara" | "kim";

export const STEPS: Array<{ id: Step; label: string; home: string; empty: string }> = [
  {
    id: "lara",
    label: "Scorecard: 2019 to 2026, Commissioner Lara",
    home: "/#lara-era",
    empty: "",
  },
  {
    id: "kim",
    label: "Scorecard: 2027 onward, Commissioner Kim",
    home: "/#kim-era",
    empty:
      "Nothing yet. The first piece will follow the first quarterly FAIR Plan release of the new term.",
  },
];

export interface Piece {
  step: Step;
  href: string;
  title: string;
  dek: string;
  date: string;
}

export const PIECES: Piece[] = [
  {
    step: "lara",
    href: "/analysis/depopulation-promise",
    title: "The Depopulation Promise",
    dek: "California's 2023 deal with insurers promised to shrink the FAIR Plan. In 92% of the state's own designated distressed ZIP codes, enrollment grew instead.",
    date: "July 2026",
  },
  {
    step: "lara",
    href: "/analysis/sb-1301",
    title: "SB 1301: Nonrenewal Protections Need Nonrenewal Data",
    dek: "Signed in September 2026. Sen. Allen's protections will be hard to verify with today's public data: the state's nonrenewal statistics end in 2023. The reporting that would make the bill verifiable.",
    date: "July 2026 · updated November 2026",
  },
  {
    step: "lara",
    href: "/analysis/ab-69-ab-1680",
    title: "AB 69 & AB 1680: FAIR Plan Oversight Needs FAIR Plan Data",
    dek: "Signed in September 2026. Asm. Calderon's package strengthens FAIR Plan reporting and oversight. A few reporting details will decide whether the public can see what the Plan is actually doing.",
    date: "July 2026 · updated November 2026",
  },
];
