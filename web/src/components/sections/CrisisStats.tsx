import type { SiteStats } from "@/types";

const FALLBACK = {
  prior_year: { value: "463K", label: "FY 2024", detail: "Policies as of September 30, 2024" },
  current_year: { value: "642K", label: "FY 2025", detail: "Policies as of September 30, 2025" },
  growth: { value: "2.6x", label: "Growth Rate", detail: "Since FY 2021" },
};

export function CrisisStats({ stats }: { stats: SiteStats | null }) {
  const cards = stats?.stats_cards ?? FALLBACK;

  return (
    <section id="crisis" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            Understanding the Crisis
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            California's FAIR Plan was designed as a last-resort safety net, not
            a primary insurance solution.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 text-center">
            <h3 className="mb-2 text-4xl font-bold text-patriot-red">
              {cards.prior_year.value}
            </h3>
            <p className="font-medium text-charcoal">{cards.prior_year.label}</p>
            <p className="mt-1 text-sm text-gray-500">
              {cards.prior_year.detail}
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 text-center">
            <h3 className="mb-2 text-4xl font-bold text-navy-blue">
              {cards.current_year.value}
            </h3>
            <p className="font-medium text-charcoal">{cards.current_year.label}</p>
            <p className="mt-1 text-sm text-gray-500">
              {cards.current_year.detail}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-6 text-center">
            <h3 className="mb-2 text-4xl font-bold text-amber-600">
              {cards.growth.value}
            </h3>
            <p className="font-medium text-charcoal">{cards.growth.label}</p>
            <p className="mt-1 text-sm text-gray-500">{cards.growth.detail}</p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
            <p className="mb-2 font-semibold text-patriot-red">Why This Matters</p>
            <p className="text-gray-700">
              The FAIR Plan's explosive growth doesn't just affect the families
              on it — it creates hidden costs for every homeowner in California.
              Here's how.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
