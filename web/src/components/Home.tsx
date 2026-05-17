import { useEffect, useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { CrisisStats } from "@/components/sections/CrisisStats";
import { CrisisMap } from "@/components/sections/CrisisMap";
import { CountyTable } from "@/components/sections/CountyTable";
import { CityMap } from "@/components/sections/CityMap";
import { CityTable } from "@/components/sections/CityTable";
import { ZipMap } from "@/components/sections/ZipMap";
import { ZipTable } from "@/components/sections/ZipTable";
import { Solutions } from "@/components/sections/Solutions";
import { Signup } from "@/components/sections/Signup";
import {
  loadCityData,
  loadCountyData,
  loadSiteStats,
  loadZipData,
} from "@/lib/data";
import type { CityData, CountyData, SiteStats, ZipData } from "@/types";

type View = "county" | "city" | "zip";

export function Home() {
  // ?view=city / ?view=zip remain query-string experiments — temporary
  // alternate visualizations that will eventually fold into the main page.
  const [view] = useState<View>(() => {
    if (typeof window === "undefined") return "county";
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "city" || v === "zip" ? v : "county";
  });
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [zipData, setZipData] = useState<ZipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const dataLoader =
      view === "city" ? loadCityData()
      : view === "zip" ? loadZipData()
      : loadCountyData();
    Promise.all([loadSiteStats().catch(() => null), dataLoader])
      .then(([s, d]) => {
        if (cancelled) return;
        setStats(s);
        if (view === "city") setCityData(d as CityData);
        else if (view === "zip") setZipData(d as ZipData);
        else setCountyData(d as CountyData);
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
      <CrisisStats stats={stats} />
      {view === "city" ? (
        <>
          <CityMap cityData={cityData} stats={stats} loading={loading} />
          <CityTable cityData={cityData} stats={stats} loading={loading} />
        </>
      ) : view === "zip" ? (
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
      <Solutions />
      <Signup />
    </>
  );
}
