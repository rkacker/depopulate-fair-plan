import type { HomeStats } from "@/lib/homeStats";
import { fmtLongDate, fmtSigned } from "@/lib/homeStats";
import { fmtBillions, fmtCoverage, fmtPolicies } from "@/lib/historyFormat";

interface NumbersProps {
  stats: HomeStats;
}

// Section 2: the headline metrics. Static; every figure is
// computed at build time from fair_statewide_history.csv.
export function Numbers({ stats }: NumbersProps) {
  const { latest, deal, marketShare } = stats;
  const asOf = fmtLongDate(latest.coverage_end);

  const cards: Array<{ label: string; value: string; detail: string }> = [
    {
      label: "Policies in force",
      value: fmtPolicies(latest.policy_count),
      detail: `Residential policies as of ${asOf}`,
    },
    {
      label: "Insured value",
      value: fmtBillions(latest.exposure),
      detail: "What the Plan could owe if every insured home were lost",
    },
    {
      label: "Since the 2023 deal",
      value: fmtSigned(stats.sinceDealChange),
      detail: `Up from ${fmtPolicies(deal.policy_count)} on ${fmtCoverage(deal.coverage_end)}`,
    },
    {
      label: "Last quarter",
      value: stats.quarterIsFlat ? "Flat" : fmtSigned(stats.quarterChange),
      detail: stats.quarterIsFlat
        ? `${fmtPolicies(stats.prior.policy_count)} to ${fmtPolicies(latest.policy_count)}. Growth has stopped; the Plan has not shrunk`
        : `${fmtCoverage(stats.prior.coverage_end)} to ${fmtCoverage(latest.coverage_end)}`,
    },
  ];
  if (marketShare) {
    cards.push({
      label: "Share of all home policies",
      value: `${marketShare.pct.toFixed(1)}%`,
      detail: `${marketShare.year}, the latest year the state has published`,
    });
  }

  return (
    <section id="numbers" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            The problem: a backstop that became a market
          </h2>
          <p className="text-lg text-gray-600">
            An insurer of last resort is healthy when it is small. Five figures
            from the FAIR Plan's and the Department of Insurance's own
            publications show how far California's has moved from that.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {c.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-charcoal lg:text-3xl">
                {c.value}
              </dd>
              <dd className="mt-1 text-xs leading-snug text-gray-600">{c.detail}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-sm text-gray-600">
          <a href="/data?tab=statewide_history" className="font-semibold underline">
            Full quarterly table and how we count
          </a>
        </p>
      </div>
    </section>
  );
}
