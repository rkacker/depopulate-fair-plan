// Section: who decides. A short civics panel so the rest of the page does
// not assume the reader knows there is an elected insurance commissioner.
// It also states why the site scores that one office. Static.
export function WhoIsInCharge() {
  return (
    <section id="regulation" className="bg-navy-blue py-20 text-white scroll-mt-28 lg:scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-3xl font-bold lg:text-4xl">Who is responsible</h2>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-100">
          Three sets of elected officials regulate home insurance in
          California. The insurance commissioner holds the most direct
          authority.
        </p>

        <div className="mt-10 rounded-xl border-2 border-golden-yellow bg-white/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-golden-yellow">
            The office this site tracks
          </p>
          <h3 className="mt-1 text-2xl font-bold">The insurance commissioner</h3>
          <p className="mt-3 max-w-3xl text-gray-100">
            California voters elect one person statewide to regulate
            insurance. The commissioner serves a four-year term, can serve
            two, and runs the Department of Insurance. No insurer can change
            a home insurance price until the commissioner approves it. The
            commissioner also writes the rules insurers must follow, approves
            the FAIR Plan's rates, and oversees how the Plan operates.
          </p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-golden-yellow">The Legislature</h3>
            <p className="text-gray-100">
              The 80-member Assembly and the 40-member Senate write
              California's insurance laws. A bill must pass both houses. The
              FAIR Plan itself exists by state law: the Legislature decides
              what it must cover, who pays when it runs short, and what it
              has to report.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-6">
            <h3 className="mb-2 text-lg font-bold text-golden-yellow">The governor</h3>
            <p className="text-gray-100">
              The governor signs or vetoes the bills the Legislature passes
              and can direct state agencies by executive order. The governor
              does not set insurance rates and does not choose the
              commissioner, except to fill a vacancy with the Legislature's
              confirmation.
            </p>
          </div>
        </div>

        <p className="mt-10 max-w-3xl text-lg leading-relaxed text-gray-100">
          This site keeps one scorecard for each commissioner's term. The
          measure is whether the FAIR Plan got smaller. Laws passed by the
          Legislature are listed under the term in which they passed.
        </p>
      </div>
    </section>
  );
}
