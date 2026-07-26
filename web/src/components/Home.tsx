import { useEffect, useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { CrisisStats } from "@/components/sections/CrisisStats";
import { CrisisMap } from "@/components/sections/CrisisMap";
import { CountyTable } from "@/components/sections/CountyTable";
import { ZipMap } from "@/components/sections/ZipMap";
import { ZipTable } from "@/components/sections/ZipTable";
// TODO(future): rebuild a Solutions section with sharper, data-grounded
// content. The previous version (web/src/components/sections/Solutions.tsx)
// is kept in-tree as scaffolding but is intentionally not rendered today.
import { Signup } from "@/components/sections/Signup";
import {
  loadCountyData,
  loadSiteStats,
  loadZipData,
} from "@/lib/data";
import type { CountyData, SiteStats, ZipData } from "@/types";
import type { HistoryRow } from "@/components/sections/StatewideHistoryTab";

type View = "county" | "zip";

interface HomeProps {
  initialStats?: SiteStats | null;
  initialCountyData?: CountyData | null;
  initialStatewideRows?: HistoryRow[] | null;
}

export function Home({
  initialStats = null,
  initialCountyData = null,
  initialStatewideRows = null,
}: HomeProps = {}) {
  // ?view=zip is a query-string experiment — an alternate visualization that
  // will eventually fold into the main page. SSR can't read URL params, so we
  // default to "county" and adopt the requested view after hydration.
  const [view, setView] = useState<View>("county");
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "zip") setView(v);
  }, []);
  const [stats, setStats] = useState<SiteStats | null>(initialStats);
  const [countyData, setCountyData] = useState<CountyData | null>(initialCountyData);
  const [zipData, setZipData] = useState<ZipData | null>(null);
  // If county data was provided server-side and the default county view is
  // active, skip the loading state entirely.
  const [loading, setLoading] = useState(!(view === "county" && initialCountyData));

  useEffect(() => {
    // Initial data covers the default county view — only fetch when the
    // requested view isn't already populated.
    const needsCounty = view === "county" && !countyData;
    const needsZip = view === "zip" && !zipData;
    const needsStats = !stats;
    if (!needsCounty && !needsZip && !needsStats) return;
    // Show the skeleton while the active view's data is in flight — e.g. the
    // ?view=zip swap, where county data is already present but zip isn't.
    // (Stats-only refetches don't blank the already-rendered view.)
    if (needsCounty || needsZip) setLoading(true);

    let cancelled = false;
    const dataLoader = view === "zip" ? loadZipData() : loadCountyData();
    Promise.all([
      needsStats ? loadSiteStats().catch(() => null) : Promise.resolve(stats),
      view === "county" && countyData ? Promise.resolve(countyData) : dataLoader,
    ])
      .then(([s, d]) => {
        if (cancelled) return;
        if (needsStats) setStats(s);
        if (view === "zip") setZipData(d as ZipData);
        else if (needsCounty) setCountyData(d as CountyData);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view]);

  return (
    <>
      <Hero stats={stats} />
      <CrisisStats initialStatewideRows={initialStatewideRows} />
      {view === "zip" ? (
        <>
          <ZipMap zipData={zipData} stats={stats} loading={loading} />
          <ZipTable zipData={zipData} stats={stats} loading={loading} />
        </>
      ) : (
        <>
          <CrisisMap countyData={countyData} stats={stats} loading={loading} />
          <CountyTable countyData={countyData} stats={stats} loading={loading} />
        </>
      )}
      {/* Pointer to the long-form analysis — the deep dive lives on its own
          page rather than as a home section. */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
            <p className="mb-2 font-semibold text-patriot-red">
              Analysis: The Depopulation Promise
            </p>
            <p className="text-gray-700">
              California's 2023 deal with insurers promised to shrink the FAIR
              Plan, starting with a named list of distressed ZIP codes. Our
              analysis of the state's own data: enrollment grew in 93% of
              those very ZIP codes.{" "}
              <a
                href="/analysis/depopulation-promise"
                className="font-semibold underline"
              >
                Read the analysis →
              </a>
            </p>
          </div>
        </div>
      </section>
      <Signup />
    </>
  );
}
