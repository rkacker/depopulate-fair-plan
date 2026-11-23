import type { HomeStats } from "@/lib/homeStats";
import type { PromiseStats } from "@/lib/distressed";
import { fmtBillions, fmtCoverage, fmtPolicies } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

const PROPOSAL: string[] = [
  "A public, nonprofit program would cover wildfire damage for every existing home in California. Participation would be mandatory.",
  "Wildfire would come out of private home policies. Private insurers would keep selling coverage for everything else, and would sell and bill the public wildfire coverage for a fee.",
  "Each home's wildfire premium would have two parts: one priced to that home's own risk, and a small capped share that every home pays toward catastrophic years.",
  "Coverage would be capped at the cost to rebuild a typical California home. Owners of more expensive homes could buy the rest privately.",
  "Money left after claims would go to reserves and to reducing fire risk.",
];

// Section 6: the 2027 era. The starting line, what is proposed, the possible
// benefits and risks, and the scorecard this site will keep. No endorsement.
export function KimEra({ stats, promise }: { stats: HomeStats; promise: PromiseStats }) {
  const { latest } = stats;
  const sc = promise.scorecard;
  const asOf = fmtCoverage(latest.coverage_end);

  const baseline: Array<{ measure: string; start: React.ReactNode; watch: string }> = [
    {
      measure: "FAIR Plan policies",
      start: `${fmtPolicies(latest.policy_count)} (${asOf})`,
      watch: "A count that falls, quarter over quarter",
    },
    {
      measure: "Insured value on the Plan",
      start: `${fmtBillions(latest.exposure)} (${asOf})`,
      watch: "Falling along with the policy count",
    },
    {
      measure: "Distressed ZIP codes where the Plan is growing",
      start: `${sc.grew} of ${sc.total} since 2023`,
      watch: "More ZIP codes shrinking than growing",
    },
    {
      measure: "Insurer commitments",
      start: (
        <>
          <Cite k="noComplianceCount">No published count</Cite>; first
          deadline December 2027
        </>
      ),
      watch: "Published results for each insurer, by ZIP code",
    },
    {
      measure: "What homeowners pay",
      start: (
        <>
          <Cite k="avgPremium">{FACTS.avgPremium.value}</Cite> average
          premium; FAIR Plan rates up{" "}
          <Cite k="fairRateIncrease">{FACTS.fairRateIncrease.value}</Cite>
        </>
      ),
      watch: "Approved rate changes, for insurers and for the Plan",
    },
    {
      measure: "Public data on nonrenewals",
      start: "Ends in 2023",
      watch: "Annual publication resumed",
    },
  ];

  return (
    <section id="kim-era" className="bg-coastal-beige py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-patriot-red">
          2027 to 2030 · Commissioner-elect Jane Kim
        </p>
        <h2 className="mb-6 text-3xl font-bold text-charcoal lg:text-4xl">
          The next four years start here
        </h2>
        <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-gray-700">
          <p>
            California elected Jane Kim insurance commissioner in November
            2026, with about{" "}
            <Cite k="election">{FACTS.election.value} of the vote</Cite>. She
            is due to take office on{" "}
            <Cite k="takesOffice">{FACTS.takesOffice.value}</Cite> for a
            four-year term. She inherits the FAIR Plan at its largest and
            the 2023 strategy mid-course.
          </p>
        </div>

        <h3 className="mb-4 mt-10 text-xl font-bold text-charcoal">
          The starting line
        </h3>
        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs uppercase tracking-wide text-gray-500">
                <th scope="col" className="py-2 pr-4">Measure</th>
                <th scope="col" className="py-2 pr-4">Where it starts</th>
                <th scope="col" className="py-2">What progress would look like</th>
              </tr>
            </thead>
            <tbody>
              {baseline.map((r) => (
                <tr key={r.measure} className="border-b border-gray-200 align-top">
                  <th scope="row" className="py-3 pr-4 font-semibold text-charcoal">
                    {r.measure}
                  </th>
                  <td className="py-3 pr-4 text-gray-700">{r.start}</td>
                  <td className="py-3 text-gray-700">{r.watch}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-gray-600">
            We will fill in a results column each quarter, using the same
            measures we applied to the last eight years.
          </p>
        </div>

        <h3 className="mb-4 mt-12 text-xl font-bold text-charcoal">
          What is on the table
        </h3>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="mb-1 font-bold text-charcoal">
              Regulation, by the commissioner
            </h4>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>
                The 2023 strategy. Kim has said{" "}
                <Cite k="kimOnSis">"{FACTS.kimOnSis.value}."</Cite> She can
                keep, amend or repeal its rules, and she has not said which.
              </li>
              <li>
                Rate requests. Every insurer increase, and every FAIR Plan
                increase, needs her approval.
              </li>
              <li>
                The first commitment deadline, December 2027, falls in her
                first year. Whether insurers met it will be her call to
                enforce and to publish.
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="mb-1 font-bold text-charcoal">
              Legislation, by the Legislature and governor
            </h4>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>
                Natural Disaster Insurance for All, her central proposal,
                described below. It needs a new law.
              </li>
              <li>
                <Cite k="rateFreeze">A freeze on home insurance premiums</Cite>,{" "}
                {FACTS.rateFreeze.note}.
              </li>
              <li>
                The <Cite k="bills2026">2026 laws</Cite> take effect: new
                FAIR Plan reporting and oversight from 2027, and longer
                nonrenewal notice from 2028.
              </li>
            </ul>
          </div>
        </div>

        <h3 className="mb-4 mt-12 text-xl font-bold text-charcoal">
          Natural Disaster Insurance for All
        </h3>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="mb-1 font-bold text-charcoal">What it proposes</h4>
            <p className="mb-3 text-sm text-gray-600">
              From the <Cite k="ndifaBrief">campaign's policy brief</Cite>.
              It is a proposal, not a bill.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              {PROPOSAL.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="mb-3 font-bold text-charcoal">
              What the state's own study says it would cost
            </h4>
            <p className="text-gray-700">
              A study the Legislature ordered, published in April 2026,
              examined a mandatory state-sponsored wildfire insurer as one
              option. It estimated the program would need about{" "}
              <Cite k="ndifaCost">{FACTS.ndifaCost.value}</Cite>{" "}
              {FACTS.ndifaCost.note}.
            </p>
            <p className="mt-3 text-gray-700">
              For comparison, the same study estimates that today's system
              would bill policyholders $500 to $550 a year after a fire of
              that size, through FAIR Plan assessments.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border-t-4 border-navy-blue bg-white p-6 shadow">
            <h4 className="mb-3 font-bold text-charcoal">Possible benefits</h4>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              <li>
                Wildfire risk would leave private policies, removing the
                main reason insurers decline homes. The need for a last
                resort plan for fire could shrink with it.
              </li>
              <li>
                One pool and one set of claim rules after a major fire,
                where survivors now deal with dozens of insurers.
              </li>
              <li>
                A nonprofit holding the risk for decades has a reason to pay
                for prevention. Moira Birss of the Climate and Community
                Institute, who helped write the brief, argues a nonprofit
                plan would cost less, and that insurers' pricing models
                cannot be inspected by the public today.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border-t-4 border-patriot-red bg-white p-6 shadow">
            <h4 className="mb-3 font-bold text-charcoal">Risks</h4>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              <li>
                All of the state's wildfire risk would sit in one program.
                Rex Frazier of the Personal Insurance Federation of
                California asks: "Will taxpayers be backstopping it? What
                happens if it runs out of money?"
              </li>
              <li>
                A program that leans on reinsurance can end up with high
                premiums or high deductibles, as Carmen Balber of Consumer
                Watchdog says the state's earthquake insurer has.
              </li>
              <li>
                A major fire could arrive before reserves are built. The
                study's figure for that case is $1,900 to $2,000 per
                policyholder.
              </li>
              <li>
                The brief does not say what happens to the FAIR Plan and
                its {fmtPolicies(latest.policy_count)} policies, what a
                household would pay, or when coverage would begin.
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Statements as reported by <Cite k="election">CalMatters</Cite> and
          the <Cite k="latimesPlan">Los Angeles Times</Cite>, November 2026.
        </p>

        <div className="mt-10 max-w-3xl rounded-r-lg border-l-4 border-navy-blue bg-white p-6">
          <p className="mb-2 font-semibold text-charcoal">How we will score it</p>
          <p className="text-gray-700">
            We take no position on the proposal. The test for this era is
            the one the last era did not pass: does the FAIR Plan get
            smaller. We will report the count each quarter against the
            starting line above.
          </p>
        </div>

        <Sources
          keys={[
            "election",
            "takesOffice",
            "kimOnSis",
            "rateFreeze",
            "bills2026",
            "ndifaBrief",
            "ndifaCost",
            "latimesPlan",
            "noComplianceCount",
            "avgPremium",
          ]}
        />
      </div>
    </section>
  );
}
