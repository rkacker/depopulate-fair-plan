import { CrisisMap } from "@/components/sections/CrisisMap";
import { CountyTable } from "@/components/sections/CountyTable";
import type { CountyData, SiteStats } from "@/types";

// Section 3 island: the county map and table are the only interactive part of
// the page body, so they hydrate on their own when scrolled into view.
export function WhereIsland({
  countyData,
  stats,
}: {
  countyData: CountyData;
  stats: SiteStats;
}) {
  return (
    <div id="where" className="scroll-mt-28 lg:scroll-mt-16 bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
          The impact
        </h2>
        <p className="text-lg text-gray-600">
          FAIR Plan policies by county, then by ZIP code.
        </p>
      </div>
      <CrisisMap countyData={countyData} stats={stats} loading={false} showHeader={false} />
      <CountyTable countyData={countyData} stats={stats} loading={false} />
    </div>
  );
}
