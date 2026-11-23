import { PIECES } from "@/lib/pieces";

const DATASETS: Array<{ href: string; title: string; dek: string }> = [
  {
    href: "/data?tab=statewide_history",
    title: "Statewide history",
    dek: "Policies, insured value and premium by quarter since 2019.",
  },
  {
    href: "/data?tab=zip_history",
    title: "Every ZIP code",
    dek: "FAIR Plan policies by ZIP code for the last six fiscal years.",
  },
  {
    href: "/data?tab=fair_share",
    title: "Share of the market",
    dek: "The FAIR Plan's share of all home policies in each county.",
  },
  {
    href: "/data?tab=distressed_list",
    title: "The state's distressed list",
    dek: "The 29 counties and 663 ZIP codes the insurer commitments apply to.",
  },
];

// Section 7: the deep links. Static.
export function ReadDeeper({ asOf }: { asOf: string }) {
  return (
    <section id="more" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
          Read deeper
        </h2>
        <p className="mb-10 max-w-3xl text-lg text-gray-600">
          Everything above is a summary. The analysis and the tables behind it
          are public, and every figure can be reproduced from the downloads.
        </p>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Analysis
            </h3>
            <ul className="space-y-6">
              {PIECES.map((p) => (
                <li key={p.href} className="border-l-4 border-patriot-red pl-4">
                  <a href={p.href} className="text-lg font-bold text-charcoal hover:underline">
                    {p.title}
                  </a>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{p.dek}</p>
                  <p className="mt-1 text-xs text-gray-500">{p.date}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Data and downloads
            </h3>
            <ul className="space-y-6">
              {DATASETS.map((d) => (
                <li key={d.href} className="border-l-4 border-navy-blue pl-4">
                  <a href={d.href} className="text-lg font-bold text-charcoal hover:underline">
                    {d.title}
                  </a>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{d.dek}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-600">
          FAIR Plan figures are current through {asOf} and come from the Plan's
          published ZIP-level files. Market-wide figures come from the
          California Department of Insurance and end in 2023. This site is an
          independent community project and is not affiliated with the FAIR
          Plan, the Department, or any insurer.
        </p>
      </div>
    </section>
  );
}
