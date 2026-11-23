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
    <div id="where" className="scroll-mt-16">
      <CrisisMap countyData={countyData} stats={stats} loading={false} />
      <CountyTable countyData={countyData} stats={stats} loading={false} />
    </div>
  );
}
