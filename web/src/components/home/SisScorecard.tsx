import type { HomeStats } from "@/lib/homeStats";
import { fmtSigned } from "@/lib/homeStats";
import type { PromiseStats } from "@/lib/distressed";
import { fmtCoverage, fmtPolicies } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

interface Row {
  measure: string;
  result: React.ReactNode;
  reading: string;
}

// Section 4: what the 2023 deal traded, and what the record shows. Static.
export function SisScorecard({ stats, promise }: { stats: HomeStats; promise: PromiseStats }) {
  const { latest, deal } = stats;
  const sc = promise.scorecard;
  const grewPct = Math.round((sc.grew / sc.total) * 100);

  const rows: Row[] = [
    {
      measure: "FAIR Plan policies since the deal",
      result: (
        <>
          {fmtPolicies(deal.policy_count)} ({fmtCoverage(deal.coverage_end)}) to{" "}
          {fmtPolicies(latest.policy_count)} ({fmtCoverage(latest.coverage_end)})
        </>
      ),
      reading: `${stats.sinceDealMultiple.toFixed(1)} times larger`,
    },
    {
      measure: "The latest quarter",
      result: stats.quarterIsFlat ? (
        <>Flat. Growth has stopped; the Plan has not shrunk.</>
      ) : (
        <>{fmtSigned(stats.quarterChange)} policies</>
      ),
      reading: stats.quarterIsFlat ? "Stalled" : stats.quarterChange < 0 ? "Declining" : "Growing",
    },
    {
      measure: "ZIP codes the state named as distressed",
      result: (
        <>
          The Plan grew in {sc.grew} of {sc.total} since the deal, and shrank
          in {sc.declined}
        </>
      ),
      reading: `Grew in ${grewPct}%`,
    },
    {
      measure: "Growth inside and outside the state's list",
      result: (
        <>
          +{promise.designated.growthPct}% in listed ZIP codes, +
          {promise.unlisted.growthPct}% everywhere else
        </>
      ),
      reading: "Fastest where no commitment applies",
    },
    {
      measure: "Insurers expanding under the strategy",
      result: (
        <>
          <Cite k="insurersExpanding">
            {FACTS.insurersExpanding.value} insurance groups
          </Cite>
          , by the Department's count ({FACTS.insurersExpanding.note})
        </>
      ),
      reading: "Insurers are returning",
    },
    {
      measure: "Policies written against the commitments",
      result: (
        <>
          <Cite k="noComplianceCount">No published count</Cite>. The first
          two-year deadline falls in{" "}
          <Cite k="firstApproval">December 2027</Cite>
        </>
      ),
      reading: "Not yet measurable",
    },
    {
      measure: "What homeowners pay",
      result: (
        <>
          California's average premium is{" "}
          <Cite k="avgPremium">{FACTS.avgPremium.value}</Cite> against{" "}
          {FACTS.avgPremium.note}, by the Department's figures. Approved
          increases since the rules took effect include{" "}
          <Cite k="rateApprovals">6.9% for Mercury and for CSAA</Cite>
        </>
      ),
      reading: "Near the national average, and rising",
    },
  ];

  return (
    <section id="deal" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-patriot-red">
          The 2023 deal and the new risk models
        </p>
        <h2 className="mb-6 text-3xl font-bold text-charcoal lg:text-4xl">
          Stalled, not reversed
        </h2>

        <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-gray-700">
          <p>
            In September 2023 the Department of Insurance announced a trade
            with insurers that it calls the Sustainable Insurance Strategy.
            Its stated aim was to bring insurers back to wildfire areas and
            move households off the FAIR Plan.
          </p>
          <p>
            Insurers got two things they had asked for. They may price
            wildfire with a catastrophe model, and they may charge customers
            for the cost of the insurers' own reinsurance. In exchange, an
            insurer that uses either tool must commit to write policies in
            distressed areas at{" "}
            <Cite k="commitmentRule">
              85% of its statewide market share, or to grow there by 5%
            </Cite>
            , within two years of its rate approval.
          </p>
        </div>

        <div className="my-10 max-w-3xl rounded-r-lg border-l-4 border-navy-blue bg-gray-50 p-6">
          <h3 className="mb-2 text-lg font-bold text-charcoal">
            What a risk model changes in your rate
          </h3>
          <p className="text-gray-700">
            Under the old rule, the wildfire part of a rate came from an
            insurer's average losses over at least the past 20 years. A
            catastrophe model instead simulates many possible fire seasons
            for each location and prices the expected loss. That can raise
            the rate for a home in a high-hazard area and lower it for one
            that is not. The models belong to private vendors. The
            Department has reviewed{" "}
            <Cite k="modelsReviewed">{FACTS.modelsReviewed.value} of them</Cite>{" "}
            for use in rate filings: {FACTS.modelsReviewed.note}.
          </p>
        </div>

        <h3 className="mb-4 text-xl font-bold text-charcoal">
          The promise against the record
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="py-2 pr-4">Measure</th>
                <th scope="col" className="py-2 pr-4">What the record shows</th>
                <th scope="col" className="py-2">Reading</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.measure} className="border-b border-gray-200 align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold text-charcoal">
                    {r.measure}
                  </th>
                  <td className="py-3 pr-4 text-gray-700">{r.result}</td>
                  <td className="py-3 font-semibold text-charcoal">{r.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 max-w-3xl rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
          <p className="mb-2 font-semibold text-patriot-red">Where that leaves it</p>
          <p className="text-gray-700">
            The FAIR Plan has stopped growing. It has not started shrinking.
            It holds {stats.sinceDealMultiple.toFixed(1)} times the policies it
            did when the deal was announced, and it grew in {grewPct}% of the
            ZIP codes the state named for relief. Insurers are writing again,
            and homeowners are paying the rates that brought them back. The
            return half of the trade, policies moving off the Plan, has not
            shown up in the count, and the state has not published the
            figures that would show whether insurers are meeting their
            commitments.
          </p>
          <p className="mt-3 text-gray-700">
            <a href="/analysis/depopulation-promise" className="font-semibold underline">
              Read the full analysis
            </a>{" "}
            ·{" "}
            <a href="/data?tab=distressed_list" className="font-semibold underline">
              See the state's distressed list
            </a>
          </p>
        </div>

        <Sources
          keys={[
            "commitmentRule",
            "modelsReviewed",
            "insurersExpanding",
            "noComplianceCount",
            "firstApproval",
            "rateApprovals",
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">
          FAIR Plan figures are computed from the Plan's ZIP-level files.
          "Since the deal" compares fiscal years ending September 30, 2023 and{" "}
          {latest.coverage_end.slice(0, 4)}. The ZIP-code scorecard covers
          listed ZIP codes with FAIR Plan policies at both dates.
        </p>
      </div>
    </section>
  );
}
