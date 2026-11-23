import type { ReactNode } from "react";
import type { HomeStats } from "@/lib/homeStats";

// Static hero. The ZIP lookup island is passed in as children from index.astro
// so the rest of the hero ships no JavaScript.
export function HomeHero({ stats, children }: { stats: HomeStats; children?: ReactNode }) {
  const policies = stats.latest.policy_count ?? 0;
  const rounded = (Math.floor(policies / 1000) * 1000).toLocaleString("en-US");
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-navy-blue py-20 text-white scroll-mt-16 lg:py-28"
    >
      <div className="absolute inset-0">
        <img
          src="/assets/hero.webp"
          alt=""
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-blue/60 via-navy-blue/50 to-navy-blue/70" />
        <div className="absolute bottom-2 right-3 text-[10px] font-light tracking-wide text-white/40">
          Photo: Beth Coller / The New York Times
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-golden-yellow">
          A California community resource
        </p>
        <h1 className="mb-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
          California's insurer of last resort now holds{" "}
          <span className="text-golden-yellow">{rounded} home policies</span>.
          Every homeowner shares the risk.
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-100">
          The FAIR Plan was built as a temporary backstop for homes no insurer
          would cover. It has grown {stats.sinceFirstMultiple.toFixed(1)} times
          over since 2019, and a 2023 deal meant to shrink it has only stopped
          the growth. That is a failure of regulation, and it is measurable.
          When
          the Plan runs short after a major fire, the bill goes to every home
          insurer in California, and part of it can be passed on to their
          customers.
        </p>
        {children}
        <p className="mt-6 text-sm text-gray-200">
          <a href="#why" className="underline hover:text-golden-yellow">
            Why this matters to you
          </a>{" "}
          ·{" "}
          <a href="#lara-era" className="underline hover:text-golden-yellow">
            What eight years of regulation produced
          </a>{" "}
          ·{" "}
          <a href="#kim-era" className="underline hover:text-golden-yellow">
            What the next four could change
          </a>
        </p>
      </div>
    </section>
  );
}
