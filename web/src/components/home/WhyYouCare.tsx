import type { HomeStats } from "@/lib/homeStats";
import { fmtBillions } from "@/lib/historyFormat";
import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

// Section 1: the three ways the FAIR Plan's size reaches a household budget.
export function WhyYouCare({ stats }: { stats: HomeStats }) {
  const exposure = fmtBillions(stats.latest.exposure).replace(" B", " billion");
  return (
    <section id="why" className="bg-coastal-beige py-20 scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            Why it matters
          </h2>
          <p className="text-lg text-gray-700">
            The FAIR Plan is not a state agency and is not funded by taxpayers. It
            is a pool that every licensed home insurer in California must
            belong to, and it insures {exposure} in property. Its size affects homeowners in three ways, including those it does
            not insure.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              All policyholders
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              Shortfalls are shared
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
              A state-commissioned study estimates
              that a wildfire season expected once in 100 years would bring{" "}
              <Cite k="bigFireAssessment">
                {FACTS.bigFireAssessment.value} in such bills
              </Cite>
              , or $500 to $550 a year for each policyholder in the state.
            </p>
          </article>

          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              Privately insured homeowners
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              New pricing rules
            </h3>
            <p className="mt-3 text-gray-700">
              Since 2025 the state has let insurers price wildfire risk
              with new tools that can raise rates. Increases approved since
              then include{" "}
              <Cite k="rateApprovals">6.9% for Mercury and for CSAA</Cite>.
            </p>
            <p className="mt-3 text-gray-700">
              The state's stated aim was to bring insurers back and shrink
              the FAIR Plan. The approved rates do not depend on that
              outcome.{" "}
              <a href="#lara-era" className="font-semibold underline">
                The 2019 to 2026 scorecard shows the result
              </a>
              .
            </p>
          </article>

          <article className="rounded-xl bg-white p-6 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-patriot-red">
              FAIR Plan policyholders
            </p>
            <h3 className="mt-2 text-xl font-bold text-charcoal">
              Higher cost, narrower coverage
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
              Difference in Conditions policy, to fill those gaps. The result is two premiums and two insurers for one home.
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
