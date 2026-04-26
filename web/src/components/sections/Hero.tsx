import { Button } from "@/components/ui/button";
import type { SiteStats } from "@/types";

const HERO_IMAGE = "/assets/hero.webp";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Hero({ stats }: { stats: SiteStats | null }) {
  const total = stats?.hero.total_policies_display ?? "640,000";
  return (
    <section
      id="mission"
      className="relative overflow-hidden bg-navy-blue py-24 text-white scroll-mt-16 lg:py-36"
    >
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Pacific Palisades California coastline"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-blue/35 via-navy-blue/25 to-navy-blue/40" />
        <div className="absolute bottom-2 right-3 text-[10px] font-light tracking-wide text-white/40">
          Photo: Beth Coller / The New York Times
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-golden-yellow">
          A California Community Resource
        </p>

        <h1 className="mb-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          <span className="text-golden-yellow">Depopulate</span>{" "}
          <span className="text-white">the FAIR Plan</span>
        </h1>

        <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-200 sm:text-xl">
          California's insurance market is broken. The FAIR Plan—meant as a last
          resort—now insures over{" "}
          <strong className="text-golden-yellow">{total} homes</strong> and
          continues growing. Understand the crisis and its impact on every
          California homeowner.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" onClick={() => scrollTo("signup")}>
            Stay Informed
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollTo("heatmap")}
          >
            View Crisis Map
          </Button>
        </div>
      </div>
    </section>
  );
}
