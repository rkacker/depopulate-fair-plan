import { useEffect, useState } from "react";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { CrisisStats } from "@/components/sections/CrisisStats";
import { CrisisMap } from "@/components/sections/CrisisMap";
import { CountyTable } from "@/components/sections/CountyTable";
import { Solutions } from "@/components/sections/Solutions";
import { Signup } from "@/components/sections/Signup";
import { Footer } from "@/components/sections/Footer";
import { loadCountyData, loadSiteStats } from "@/lib/data";
import type { CountyData, SiteStats } from "@/types";

export default function App() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [countyData, setCountyData] = useState<CountyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSiteStats().catch(() => null), loadCountyData()])
      .then(([s, c]) => {
        if (cancelled) return;
        setStats(s);
        setCountyData(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-coastal-beige">
      <Header />
      <main>
        <Hero stats={stats} />
        <CrisisStats stats={stats} />
        <CrisisMap countyData={countyData} stats={stats} loading={loading} />
        <CountyTable countyData={countyData} stats={stats} loading={loading} />
        <Solutions />
        <Signup />
      </main>
      <Footer />
    </div>
  );
}
