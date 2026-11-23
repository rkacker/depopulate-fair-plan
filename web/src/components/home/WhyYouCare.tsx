import type { HomeStats } from "@/lib/homeStats";
import { fmtBillions } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

// Section 1: the three ways the FAIR Plan's size reaches a household budget.
export function WhyYouCare({ stats }: { stats: HomeStats }) {
  const exposure = fmtBillions(stats.latest.exposure).replace(" B", " billion");
  return (
    <section id="why" className="bg-coastal-beige py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            Why this matters to you
          </h2>
          <p className="text-lg text-gray-700">
            The FAIR Plan is not a state agency and holds no public money. It
            is a pool that every licensed home insurer in California must
            belong to, and it insures {exposure} in property. Its size reaches
            your household in three ways, whether or not you are on it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              If you have any home policy
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              You help cover its shortfalls
            </h3>
            <p className="mt-3 text-gray-700">
              After the January 2025 Los Angeles fires the Plan billed
              insurers <Cite k="assessment">{FACTS.assessment.value}</Cite>.
              State rules let insurers collect{" "}
              <Cite k="recoupRule">{FACTS.recoupRule.value} of that</Cite> from
              their own customers. The Department of Insurance put the median
              homeowner's fee at{" "}
              <Cite k="medianSurcharge">{FACTS.medianSurcharge.value} a year</Cite>.
            </p>
            <p className="mt-3 text-gray-700">
              A larger fire costs more. A state-commissioned study estimates
              that a wildfire season expected once in 100 years would bring{" "}
              <Cite k="bigFireAssessment">
                {FACTS.bigFireAssessment.value} in assessments
              </Cite>
              , or $500 to $550 a year for each policyholder in the state.
            </p>
          </article>

          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              If a private insurer covers you
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              Your rate is set under new rules
            </h3>
            <p className="mt-3 text-gray-700">
              To bring insurers back, the state now lets them price wildfire
              with forward-looking catastrophe models and charge customers for
              the insurers' own reinsurance. Increases approved since include{" "}
              <Cite k="rateApprovals">
                6.9% for Mercury and for CSAA
              </Cite>
              .
            </p>
            <p className="mt-3 text-gray-700">
              In return, those insurers committed to write more policies in
              wildfire-distressed areas. Whether that trade is working is{" "}
              <a href="#deal" className="font-semibold underline">
                the question the scorecard below answers
              </a>
              .
            </p>
          </article>

          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              If you end up on the Plan
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              You pay more for less
            </h3>
            <p className="mt-3 text-gray-700">
              FAIR Plan home rates rose an average of{" "}
              <Cite k="fairRateIncrease">{FACTS.fairRateIncrease.value}</Cite>{" "}
              on October 15, 2026. A FAIR Plan policy covers fire and a short
              list of other perils up to{" "}
              <Cite k="fairLimit">{FACTS.fairLimit.value}</Cite>. It does not
              cover <Cite k="fairGaps">{FACTS.fairGaps.value}</Cite>.
            </p>
            <p className="mt-3 text-gray-700">
              Most households on the Plan buy a second policy, called a
              Difference in Conditions policy, to fill those gaps. That means
              two premiums and two insurers for one home.
            </p>
          </article>
        </div>

        <Sources
          keys={[
            "assessment",
            "bigFireAssessment",
            "rateApprovals",
            "fairRateIncrease",
            "fairLimit",
            "fairGaps",
          ]}
        />
      </div>
    </section>
  );
}
