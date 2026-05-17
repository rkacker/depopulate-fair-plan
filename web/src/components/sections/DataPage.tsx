import { useState, type ReactNode } from "react";
import { ExternalLink, Info } from "lucide-react";
import { FairShareTab } from "@/components/sections/FairShareTab";

// Tab scaffolding: v1 ships one tab. Next iterations add:
//   - "fair_quarterly": FAIR Plan policies per coverage_end (county, ZIP, city)
//   - "fair_fy":        FAIR Plan FY annual history (Sep-30 snapshots, 2021-2025)
type TabId = "fair_share";

interface TabDef {
  id: TabId;
  label: string;
  render: () => ReactNode;
}

const TABS: TabDef[] = [
  {
    id: "fair_share",
    label: "FAIR Share of Total Market",
    render: () => <FairShareTab />,
  },
];

const GITHUB_URL = "https://github.com/rkacker/depopulate-fair-plan";

export function DataPage() {
  const [active, setActive] = useState<TabId>(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-charcoal lg:text-4xl">
            Data &amp; Downloads
          </h1>
          <p className="max-w-2xl text-base text-gray-600">
            Underlying datasets that power this site, available as CSV
            downloads for further analysis.
          </p>
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-start gap-3 rounded-md border-l-4 border-patriot-red bg-blue-50 p-4 transition-colors hover:bg-blue-100"
        >
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-patriot-red" />
          <div className="flex-1 text-sm text-charcoal">
            <p className="font-semibold">
              All datasets here are derived from public sources via an
              open-source pipeline.
            </p>
            <p className="mt-1 text-gray-700">
              See the GitHub repository for source attribution, derivation
              steps, and methodology.
            </p>
          </div>
          <ExternalLink className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
        </a>

        <div
          role="tablist"
          aria-label="Datasets"
          className="mb-6 flex flex-wrap gap-2 border-b border-gray-200"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(tab.id)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-patriot-red text-patriot-red"
                    : "border-transparent text-gray-500 hover:text-charcoal"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {current.render()}
      </div>
    </section>
  );
}
