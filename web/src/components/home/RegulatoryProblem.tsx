// Section 4: why the FAIR Plan's size is a regulatory outcome. Static.
export function RegulatoryProblem() {
  return (
    <section id="regulation" className="bg-navy-blue py-20 text-white scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
          It is a regulatory problem
        </h2>
        <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-gray-100">
          <p>
            Wildfire is the pressure on California's home insurance market.
            Regulation decides where that pressure goes. Every rule that
            shapes whether a household keeps a private policy or lands on the
            FAIR Plan is set in Sacramento.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-golden-yellow">
              The commissioner sets the price
            </h3>
            <p className="text-gray-100">
              Under Proposition 103, an insurer cannot change a home insurance
              rate until the elected insurance commissioner approves it. The
              commissioner also approves the FAIR Plan's own rates.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-golden-yellow">
              The rules set the duty to insure
            </h3>
            <p className="text-gray-100">
              Until 2023, insurers were{" "}
              <a
                href="https://www.insurance.ca.gov/01-consumers/180-climate-change/sustainable-insurance-strategy.Cfm"
                className="underline"
                rel="noopener noreferrer"
              >
                not required by law to write policies
              </a>{" "}
              anywhere in the state. The only obligation that exists today
              was written by the Department of Insurance, as a condition on
              insurers that use its new pricing rules.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-golden-yellow">
              The Legislature sets the backstop
            </h3>
            <p className="text-gray-100">
              The FAIR Plan exists by state law. The Legislature decides what
              it must cover, who pays when it runs short, and what it has to
              report. The commissioner oversees how it operates.
            </p>
          </div>
        </div>
        <p className="mt-10 max-w-3xl text-lg leading-relaxed text-gray-100">
          So the size of the FAIR Plan is a measure of how those rules are
          working. The sections below take it one commissioner at a time:
          what each era tried, in regulation and in legislation, and what the
          count did.
        </p>
      </div>
    </section>
  );
}
