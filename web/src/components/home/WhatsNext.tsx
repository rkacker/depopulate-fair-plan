import type { HomeStats } from "@/lib/homeStats";
import { fmtPolicies } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

const PROPOSAL: string[] = [
  "A public, nonprofit program would cover wildfire damage for every existing home in California. Participation would be mandatory.",
  "Wildfire would come out of private home policies. Private insurers would keep selling coverage for everything else, and would sell and bill the public wildfire coverage for a fee.",
  "Each home's wildfire premium would have two parts: one priced to that home's own risk, and a small capped share that every home pays toward catastrophic years.",
  "Coverage would be capped at the cost to rebuild a typical California home. Owners of more expensive homes could buy the rest privately.",
  "Money left after claims would go to reserves and to reducing fire risk, with lower premiums for homes and communities that do the work.",
];

const TRACK: string[] = [
  "The FAIR Plan's policy count each quarter, statewide and in the ZIP codes the state named as distressed.",
  "Whether the 2023 rules on catastrophe models, reinsurance costs and insurer commitments are kept, amended or repealed.",
  "Whether the Department publishes how many policies insurers have written against their commitments before the first deadline in December 2027.",
  "Any bill to create the public wildfire program, and the cost estimates that come with it.",
  "Approved rate changes for home insurers and for the FAIR Plan.",
  "Whether the state resumes publishing nonrenewal data, which currently ends in 2023.",
];

// Section 5: the new commissioner and Natural Disaster Insurance for All.
// A neutral explainer: what is proposed, what the state's own study says it
// would cost, who has said what, and what this site will track.
export function WhatsNext({ stats }: { stats: HomeStats }) {
  return (
    <section id="next" className="bg-coastal-beige py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-patriot-red">
          What changes in 2027
        </p>
        <h2 className="mb-6 text-3xl font-bold text-charcoal lg:text-4xl">
          A new commissioner and a different idea
        </h2>

        <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-gray-700">
          <p>
            California elected Jane Kim insurance commissioner in November
            2026, with about{" "}
            <Cite k="election">{FACTS.election.value} of the vote</Cite>. She
            is due to take office on{" "}
            <Cite k="takesOffice">{FACTS.takesOffice.value}</Cite>, succeeding
            Ricardo Lara, who negotiated the 2023 deal.
          </p>
          <p>
            The commissioner approves or rejects insurers' rate requests and
            writes the regulations that carry out the 2023 deal. Asked about
            that strategy after the election, Kim said{" "}
            <Cite k="kimOnSis">"{FACTS.kimOnSis.value}."</Cite> She has not
            said which rules she would change.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-charcoal">
              What Natural Disaster Insurance for All proposes
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              From the{" "}
              <Cite k="ndifaBrief">campaign's policy brief</Cite>. It is a
              proposal, not a bill.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              {PROPOSAL.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-charcoal">
              What the state's own study says it would cost
            </h3>
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
            <h4 className="mb-2 mt-6 font-bold text-charcoal">
              What it would need
            </h4>
            <p className="text-gray-700">
              A commissioner cannot create the program alone. It requires a
              law passed by the Legislature and signed by the governor. Kim
              has said that financing, claims handling and other details are{" "}
              <Cite k="latimesPlan">still to be worked out</Cite> with
              legislators and consumer groups, and that the result could take
              another form.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-charcoal">
              What supporters and critics say
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>
                <span className="font-semibold">Moira Birss</span>, Climate and
                Community Institute, who helped write the brief: insurers
                price with "black-box models" the public cannot inspect, and a
                nonprofit plan would cost less.
              </li>
              <li>
                <span className="font-semibold">Amy Bach</span>, United
                Policyholders: the plan is ambitious and complicated, and the
                current system for handling catastrophes has serious problems
                worth fixing.
              </li>
              <li>
                <span className="font-semibold">Rex Frazier</span>, Personal
                Insurance Federation of California: "Will taxpayers be
                backstopping it? What happens if it runs out of money?"
              </li>
              <li>
                <span className="font-semibold">Carmen Balber</span>, Consumer
                Watchdog: a program that leans on reinsurance can end up with
                high premiums or high deductibles, as the state's earthquake
                insurer has.
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              As reported by{" "}
              <Cite k="election">CalMatters</Cite> and the{" "}
              <Cite k="latimesPlan">Los Angeles Times</Cite>, November 2026.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-charcoal">
              Questions the proposal has not answered
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              <li>
                What happens to the FAIR Plan and its{" "}
                {fmtPolicies(stats.latest.policy_count)} policies.
              </li>
              <li>What a typical household would pay, by level of fire risk.</li>
              <li>Who covers the shortfall if a major fire comes before reserves are built.</li>
              <li>Where the rebuild-cost cap would be set.</li>
              <li>When coverage would begin.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-xl border-2 border-navy-blue bg-white p-6">
          <h3 className="mb-3 text-xl font-bold text-charcoal">
            What this site will track
          </h3>
          <p className="mb-3 text-gray-700">
            We take no position on the proposal. We will report the same
            measures under the new commissioner that we reported under the
            last one.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-gray-700">
            {TRACK.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </div>

        <Sources
          keys={["election", "takesOffice", "kimOnSis", "ndifaBrief", "ndifaCost", "latimesPlan"]}
        />
      </div>
    </section>
  );
}
