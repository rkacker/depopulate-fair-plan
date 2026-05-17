import { type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { FairShareTab } from "@/components/sections/FairShareTab";

// GitHub mark — official monochrome logo, inline so we don't depend on a
// lucide-react version that exports `Github`.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="GitHub"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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

const TAB_IDS = TABS.map((t) => t.id);

export function DataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const active: TabId = (TAB_IDS as string[]).includes(requested ?? "")
    ? (requested as TabId)
    : TABS[0].id;
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  function selectTab(id: TabId) {
    if (id === TABS[0].id) {
      // Default tab — strip the query param for a clean /data URL.
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: id }, { replace: false });
    }
  }

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
          <GitHubMark className="mt-0.5 h-6 w-6 flex-shrink-0 text-charcoal" />
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
                onClick={() => selectTab(tab.id)}
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
