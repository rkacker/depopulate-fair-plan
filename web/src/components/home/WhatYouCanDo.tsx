import { FACTS } from "@/lib/policy";
import { Cite, Sources } from "@/components/home/Sources";

// Section 6: practical steps for a homeowner. Static.
export function WhatYouCanDo({ asOf }: { asOf: string }) {
  return (
    <section id="act" className="bg-white py-20 scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h1 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            Take action
          </h1>
          <p className="text-lg text-gray-700">
            Homeowners can ask the officials who set the rules to publish the
            record, and can use rights that already exist. This page is not
            legal or insurance advice.
          </p>
        </div>

        <article className="mb-6 rounded-xl border-2 border-navy-blue bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-charcoal">
            Ask for the scorecard to be public
          </h2>
          <p className="mt-2 max-w-3xl text-gray-700">
            No published count of the policies insurers have written against
            their commitments was found as of November 2026, and the state's
            published nonrenewal data ends in 2023. The Department of Insurance has
            said it collects this data from insurers every year. Ask your state senator and
            assemblymember, and the commissioner's office, to publish them
            every quarter.{" "}
            <a
              href="https://findyourrep.legislature.ca.gov/"
              className="font-semibold underline"
              rel="noopener noreferrer"
            >
              Find your legislators
            </a>
          </p>
        </article>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-charcoal">
              If you get a nonrenewal notice
            </h2>
            <p className="mt-2 text-gray-700">
              Your insurer must give you at least{" "}
              <Cite k="nonrenewalNotice">{FACTS.nonrenewalNotice.value}</Cite>{" "}
              of notice, {FACTS.nonrenewalNotice.note}. If your ZIP code is in
              or next to a declared wildfire emergency, insurers cannot drop
              you for wildfire risk for{" "}
              <Cite k="moratorium">{FACTS.moratorium.value}</Cite>, whether or
              not your home was damaged.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-charcoal">
              Before you accept the FAIR Plan
            </h2>
            <p className="mt-2 text-gray-700">
              The Plan is meant for homes that cannot find other coverage. Ask
              your agent or broker which insurers they checked. More insurers
              are writing than a year ago, and the Department's{" "}
              <Cite k="resGuide">{FACTS.resGuide.value}</Cite> links to its
              tool for finding companies that sell in your area.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-charcoal">
              If you are on the FAIR Plan
            </h2>
            <p className="mt-2 text-gray-700">
              Check what your policy leaves out. A FAIR Plan policy does not
              cover <Cite k="fairGaps">{FACTS.fairGaps.value}</Cite>; a
              Difference in Conditions policy from a private insurer fills
              those gaps. Ask your broker to shop your home again at each
              renewal, since insurers that left your area may have returned.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-charcoal">
              Lower your own rate
            </h2>
            <p className="mt-2 text-gray-700">
              Under the state's{" "}
              <Cite k="saferFromWildfires">{FACTS.saferFromWildfires.value}</Cite>{" "}
              rules, insurers and the FAIR Plan must offer discounts for a
              list of home-hardening steps, must tell you your wildfire risk
              score, and must let you appeal it.
            </p>
          </article>
        </div>

        <p className="mt-8 max-w-3xl text-gray-700">
          For help with a notice, a claim or a complaint, the Department of
          Insurance's consumer line is{" "}
          <Cite k="helpLine">{FACTS.helpLine.value}</Cite>.
        </p>

        <Sources
          keys={["nonrenewalNotice", "moratorium", "resGuide", "saferFromWildfires", "helpLine"]}
        />
        <p className="mt-6 border-t border-gray-200 pt-6 text-sm text-gray-600">
          FAIR Plan figures on this site are current through {asOf} and come
          from the Plan's published ZIP-level files. Market-wide figures come
          from the California Department of Insurance and end in 2023. This
          site is an independent project and is not affiliated with the FAIR
          Plan, the Department, or any insurer.
        </p>
      </div>
    </section>
  );
}
