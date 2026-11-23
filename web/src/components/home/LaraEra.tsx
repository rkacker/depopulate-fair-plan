import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { HomeStats } from "@/lib/homeStats";
import type { PromiseStats } from "@/lib/distressed";
import { fmtBillions, fmtCoverage, fmtPolicies } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";
import { EraBarChart } from "@/components/TrajectoryChart";

interface LaraEraProps {
  stats: HomeStats;
  promise: PromiseStats;
  history: StatewideHistoryRow[]; // descending by coverage_end
}

interface Item {
  when: string;
  what: React.ReactNode;
}

// Section 5: the 2019 to 2026 era. What was tried, and what the count did.
export function LaraEra({ stats, promise, history }: LaraEraProps) {
  const { latest, deal, first, firstExposure, marketShare } = stats;
  const sc = promise.scorecard;
  const grewPct = Math.round((sc.grew / sc.total) * 100);
  const points = history
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));

  const era: Array<{ measure: string; start: string; end: string; reading: string }> = [
    {
      measure: "FAIR Plan policies",
      start: `${fmtPolicies(first.policy_count)} (${fmtCoverage(first.coverage_end)})`,
      end: `${fmtPolicies(latest.policy_count)} (${fmtCoverage(latest.coverage_end)})`,
      reading: `${stats.sinceFirstMultiple.toFixed(1)} times larger`,
    },
  ];
  if (firstExposure && firstExposure.exposure && latest.exposure) {
    era.push({
      measure: "Insured value on the Plan",
      start: `${fmtBillions(firstExposure.exposure)} (${fmtCoverage(firstExposure.coverage_end)})`,
      end: `${fmtBillions(latest.exposure)} (${fmtCoverage(latest.coverage_end)})`,
      reading: `${(latest.exposure / firstExposure.exposure).toFixed(1)} times larger`,
    });
  }
  if (marketShare) {
    era.push({
      measure: "Share of all home policies",
      start: `${marketShare.firstPct.toFixed(1)}% (${marketShare.firstYear})`,
      end: `${marketShare.pct.toFixed(1)}% (${marketShare.year}, latest published)`,
      reading: "Rising each year measured",
    });
  }
  era.push(
    {
      measure: "Since the 2023 strategy",
      start: `${fmtPolicies(deal.policy_count)} (${fmtCoverage(deal.coverage_end)})`,
      end: `${fmtPolicies(latest.policy_count)} (${fmtCoverage(latest.coverage_end)})`,
      reading: `${stats.sinceDealMultiple.toFixed(1)} times larger`,
    },
    {
      measure: "ZIP codes the state named as distressed",
      start: `${sc.total} listed ZIP codes with FAIR Plan policies`,
      end: `The Plan grew in ${sc.grew} and shrank in ${sc.declined}`,
      reading: `Grew in ${grewPct}%`,
    },
    {
      measure: "The latest quarter",
      start: "Growth every year from 2019",
      end: stats.quarterIsFlat ? "Flat" : "Still moving",
      reading: "Stalled, not reversed",
    },
  );

  const regulation: Item[] = [
    {
      when: "2022",
      what: (
        <>
          <Cite k="saferFromWildfires">Safer from Wildfires</Cite> rules
          require insurers to discount for home hardening and disclose
          wildfire risk scores.
        </>
      ),
    },
    {
      when: "Sept 2023",
      what: (
        <>
          The <Cite k="sisAnnouncement">Sustainable Insurance Strategy</Cite>{" "}
          is announced: new pricing tools for insurers in exchange for
          commitments to write in distressed areas.
        </>
      ),
    },
    {
      when: "July 2024",
      what: (
        <>
          FAIR Plan changes, including the rule that lets insurers pass{" "}
          <Cite k="recoupRule">half of an assessment</Cite> to their own
          customers.
        </>
      ),
    },
    {
      when: "Dec 2024",
      what: (
        <>
          Final rules allow catastrophe models and reinsurance costs in
          rates, with the{" "}
          <Cite k="commitmentRule">85% commitment</Cite> attached.
        </>
      ),
    },
    {
      when: "Mar 2025",
      what: (
        <>
          The distressed list is set at{" "}
          <Cite k="distressedList">{FACTS.distressedList.value}</Cite>. It
          has not been revised since.
        </>
      ),
    },
    {
      when: "Aug 2025",
      what: (
        <>
          <Cite k="modelsReviewed">Three wildfire models</Cite> clear the
          Department's review for use in rate filings.
        </>
      ),
    },
    {
      when: "Dec 2025",
      what: (
        <>
          <Cite k="firstApproval">First rate approval</Cite> tied to the
          model rule. Its two-year commitment deadline falls in December
          2027.
        </>
      ),
    },
    {
      when: "Oct 2026",
      what: (
        <>
          A <Cite k="fairRateIncrease">{FACTS.fairRateIncrease.value}</Cite>{" "}
          average increase in FAIR Plan home rates takes effect.
        </>
      ),
    },
  ];

  const legislation: Item[] = [
    {
      when: "2019",
      what: (
        <>
          A <Cite k="moratorium">one-year ban on nonrenewals</Cite> in and
          around declared wildfire disasters takes effect.
        </>
      ),
    },
    {
      when: "2025",
      what: (
        <>
          SB 254 orders the{" "}
          <Cite k="bigFireAssessment">natural catastrophe study</Cite> that
          priced the FAIR Plan's exposure and the alternatives to it.
        </>
      ),
    },
    {
      when: "Sept 2026",
      what: (
        <>
          <Cite k="nonrenewalNotice">SB 1301</Cite> adds nonrenewal
          protections and lengthens notice to 90 days from 2028.
        </>
      ),
    },
    {
      when: "Sept 2026",
      what: (
        <>
          <Cite k="bills2026">AB 69 and AB 1680</Cite> add FAIR Plan
          reporting and give the Department stronger oversight of the Plan.
          Most of it starts in 2027.
        </>
      ),
    },
  ];

  return (
    <section id="lara-era" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-patriot-red">
          Under Commissioner Ricardo Lara · 2019 to 2026
        </p>
        <h2 className="mb-6 text-3xl font-bold text-charcoal lg:text-4xl">
          Eight years: {stats.sinceFirstMultiple.toFixed(1)} times the policies
        </h2>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-700">
          Ricardo Lara took office in January 2019 and leaves in January
          2027. Our FAIR Plan series begins in September 2019, nine months
          into his first term. This is the record of his two terms, measured
          by the size of the insurer of last resort.
        </p>

        <h3 className="mb-4 mt-10 text-xl font-bold text-charcoal">
          The scorecard
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="py-2 pr-4">Measure</th>
                <th scope="col" className="py-2 pr-4">Start</th>
                <th scope="col" className="py-2 pr-4">End</th>
                <th scope="col" className="py-2">Reading</th>
              </tr>
            </thead>
            <tbody>
              {era.map((r) => (
                <tr key={r.measure} className="border-b border-gray-200 align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold text-charcoal">
                    {r.measure}
                  </th>
                  <td className="py-3 pr-4 tabular-nums text-gray-700">{r.start}</td>
                  <td className="py-3 pr-4 tabular-nums text-gray-700">{r.end}</td>
                  <td className="py-3 font-semibold text-charcoal">{r.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <EraBarChart points={points} />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-patriot-red">
              Show the chart as a table
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left tabular-nums">
                <thead>
                  <tr className="border-b border-gray-300 text-xs uppercase tracking-wide text-gray-500">
                    <th scope="col" className="py-2 pr-4">As of</th>
                    <th scope="col" className="py-2 pr-4">Policies in force</th>
                    <th scope="col" className="py-2 pr-4">Insured value</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.coverage_end} className="border-b border-gray-100">
                      <th scope="row" className="py-1.5 pr-4 font-normal">
                        {fmtCoverage(r.coverage_end)}
                      </th>
                      <td className="py-1.5 pr-4">{fmtPolicies(r.policy_count)}</td>
                      <td className="py-1.5 pr-4">{fmtBillions(r.exposure)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <h3 className="mb-4 mt-12 text-xl font-bold text-charcoal">
          What the era tried
        </h3>
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            { title: "Regulation, by the commissioner", items: regulation },
            { title: "Legislation, by the Legislature", items: legislation },
          ].map((col) => (
            <div key={col.title} className="rounded-xl border border-gray-200 p-6">
              <h4 className="mb-4 font-bold text-charcoal">{col.title}</h4>
              <ul className="space-y-3 text-sm text-gray-700">
                {col.items.map((it, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-20 shrink-0 font-semibold text-charcoal">
                      {it.when}
                    </span>
                    <span>{it.what}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="mb-4 mt-12 text-xl font-bold text-charcoal">
          The centerpiece: the Sustainable Insurance Strategy
        </h3>
        <div className="max-w-3xl space-y-4 leading-relaxed text-gray-700">
          <p>
            The strategy was a trade. Insurers got two things they had asked
            for: they may price wildfire with a catastrophe model, and they
            may charge customers for the cost of the insurers' own
            reinsurance. In return, an insurer that uses either tool must
            commit to write policies in distressed areas at{" "}
            <Cite k="commitmentRule">
              85% of its statewide market share, or to grow there by 5%
            </Cite>
            , within two years of its rate approval. The stated aim was to
            move households off the FAIR Plan.
          </p>
        </div>
        <div className="my-6 max-w-3xl rounded-r-lg border-l-4 border-navy-blue bg-gray-50 p-6">
          <h4 className="mb-2 font-bold text-charcoal">
            What a risk model changes in your rate
          </h4>
          <p className="text-gray-700">
            Under the old rule, the wildfire part of a rate came from an
            insurer's average losses over at least the past 20 years. A
            catastrophe model instead simulates many possible fire seasons
            for each location and prices the expected loss. That can raise
            the rate for a home in a high-hazard area and lower it for one
            that is not. The models belong to private vendors:{" "}
            {FACTS.modelsReviewed.note}.
          </p>
        </div>
        <ul className="max-w-3xl list-disc space-y-2 pl-5 text-gray-700">
          <li>
            <span className="font-semibold text-charcoal">What insurers got:</span>{" "}
            approved increases under the new rules, including{" "}
            <Cite k="rateApprovals">6.9% for Mercury and for CSAA</Cite>.
          </li>
          <li>
            <span className="font-semibold text-charcoal">What came back:</span>{" "}
            the Department counts{" "}
            <Cite k="insurersExpanding">
              {FACTS.insurersExpanding.value} insurance groups
            </Cite>{" "}
            expanding in California, against {FACTS.insurersExpanding.note}.
          </li>
          <li>
            <span className="font-semibold text-charcoal">What did not happen:</span>{" "}
            the FAIR Plan did not shrink. It grew in {grewPct}% of the listed
            ZIP codes, and grew faster outside the list (+
            {promise.unlisted.growthPct}%) than inside it (+
            {promise.designated.growthPct}%), where no commitment applies.
          </li>
          <li>
            <span className="font-semibold text-charcoal">What cannot be checked:</span>{" "}
            the Department has published{" "}
            <Cite k="noComplianceCount">no count</Cite> of policies written
            against the commitments.
          </li>
        </ul>

        <div className="mt-10 max-w-3xl rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
          <p className="mb-2 font-semibold text-patriot-red">
            The result of the era
          </p>
          <p className="text-gray-700">
            The FAIR Plan ends these eight years{" "}
            {stats.sinceFirstMultiple.toFixed(1)} times the size it started.
            The strategy meant to shrink it stopped the growth and has not
            brought a decline. Homeowners are paying the higher rates that
            were the price of the deal. The return half of the trade,
            policies moving off the Plan, has not shown up in the count.
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
            "sisAnnouncement",
            "commitmentRule",
            "distressedList",
            "modelsReviewed",
            "firstApproval",
            "insurersExpanding",
            "noComplianceCount",
            "rateApprovals",
            "fairRateIncrease",
            "bills2026",
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">
          FAIR Plan figures are computed from the Plan's ZIP-level files. The
          ZIP-code scorecard compares fiscal years ending September 30, 2023
          and {latest.coverage_end.slice(0, 4)} for listed ZIP codes with
          policies at both dates.
        </p>
      </div>
    </section>
  );
}
