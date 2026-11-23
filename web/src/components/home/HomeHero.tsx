import type { HomeStats } from "@/lib/homeStats";
import { fmtLongDate } from "@/lib/homeStats";
import { fmtBillions, fmtCoverage, fmtPolicies } from "@/lib/historyFormat";

// Static hero: the problem and its key facts in one view. Ships no JavaScript.
export function HomeHero({ stats }: { stats: HomeStats }) {
  const { latest, first, marketShare } = stats;
  const rounded = (Math.floor((latest.policy_count ?? 0) / 1000) * 1000).toLocaleString("en-US");

  const facts: Array<{ label: string; value: string; detail: string }> = [
    {
      label: "Policies in force",
      value: fmtPolicies(latest.policy_count),
      detail: `As of ${fmtLongDate(latest.coverage_end)}`,
    },
    {
      label: "Growth in eight years",
      value: `${stats.sinceFirstMultiple.toFixed(1)}×`,
      detail: `Up from ${fmtPolicies(first.policy_count)} in ${fmtCoverage(first.coverage_end)}`,
    },
    {
      label: "Insured value",
      value: fmtBillions(latest.exposure),
      detail: "What the Plan could owe if every insured home were lost",
    },
  ];
  if (marketShare) {
    facts.push({
      label: "Share of all home policies",
      value: `${marketShare.pct.toFixed(1)}%`,
      detail: `${marketShare.year}, latest the state has published`,
    });
  }

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-navy-blue py-16 text-white scroll-mt-16 lg:py-24"
    >
      <div className="absolute inset-0">
        <img
          src="/assets/hero.webp"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-blue/60 via-navy-blue/60 to-navy-blue/80" />
        <div className="absolute bottom-2 right-3 text-[10px] font-light tracking-wide text-white/40">
          Photo: Beth Coller / The New York Times
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            California's insurer of last resort now holds{" "}
            <span className="text-golden-yellow">{rounded} home policies</span>.
            Every homeowner shares the risk.
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-gray-100">
            The FAIR Plan is California's insurer of last resort, built as a
            small backstop for homes no company would cover. Californians
            elect one official to regulate insurance, the insurance
            commissioner, and that office sets the rules that decide how big
            the Plan gets. Under the last commissioner it grew{" "}
            {stats.sinceFirstMultiple.toFixed(1)} times over.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-white/20 bg-navy-blue/60 p-4 backdrop-blur-sm"
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-golden-yellow">
                {f.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">{f.value}</dd>
              <dd className="mt-1 text-xs leading-snug text-gray-200">{f.detail}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-center text-xs text-gray-300">
          Computed from the FAIR Plan's and the Department of Insurance's own
          publications.{" "}
          <a href="/data?tab=statewide_history" className="underline hover:text-golden-yellow">
            Full quarterly table
          </a>
        </p>
      </div>
    </section>
  );
}
