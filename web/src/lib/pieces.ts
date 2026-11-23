// The long-form analysis pieces. One list feeds the /analysis index and the
// home page's "Read deeper" section so the two can't drift.
export interface Piece {
  href: string;
  title: string;
  dek: string;
  date: string;
}

export const PIECES: Piece[] = [
  {
    href: "/analysis/depopulation-promise",
    title: "The Depopulation Promise",
    dek: "California's 2023 deal with insurers promised to shrink the FAIR Plan. In 92% of the state's own designated distressed ZIP codes, enrollment grew instead.",
    date: "July 2026",
  },
  {
    href: "/analysis/sb-1301",
    title: "SB 1301: Nonrenewal Protections Need Nonrenewal Data",
    dek: "Signed in September 2026. Sen. Allen's protections will be hard to verify with today's public data: the state's nonrenewal statistics end in 2023. The reporting that would make the bill verifiable.",
    date: "July 2026 · updated November 2026",
  },
  {
    href: "/analysis/ab-69-ab-1680",
    title: "AB 69 & AB 1680: FAIR Plan Oversight Needs FAIR Plan Data",
    dek: "Signed in September 2026. Asm. Calderon's package strengthens FAIR Plan reporting and oversight. A few reporting details will decide whether the public can see what the Plan is actually doing.",
    date: "July 2026 · updated November 2026",
  },
];
