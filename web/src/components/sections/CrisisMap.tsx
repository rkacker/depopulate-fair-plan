import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colorForPolicies } from "@/lib/data";
import type { CountyData, SiteStats } from "@/types";

const TIERS = [
  { color: "var(--color-tier-extreme)", label: "Extreme (>50,000)" },
  { color: "var(--color-tier-high)", label: "High (10,001–50,000)" },
  { color: "var(--color-tier-moderate)", label: "Moderate (1,001–10,000)" },
  { color: "var(--color-tier-low)", label: "Low (1–1,000)" },
  { color: "var(--color-tier-none)", label: "No Data" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface CrisisMapProps {
  countyData: CountyData | null;
  stats: SiteStats | null;
  loading: boolean;
}

export function CrisisMap({ countyData, stats, loading }: CrisisMapProps) {
  const [hovered, setHovered] = useState<{ name: string; policies: number } | null>(
    null
  );

  const total = countyData?.total ?? 0;
  const byCountyUpper = countyData?.byCountyUpper;

  function policiesFor(name: string): number | undefined {
    return byCountyUpper?.get(name.toUpperCase());
  }

  return (
    <section id="heatmap" className="bg-gray-50 py-20 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            {stats?.map.title ?? "FY 2025 FAIR Plan Crisis Map"}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            {stats?.map.description ??
              "Explore how FAIR Plan policies are distributed across California's 58 counties."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="border-0">
              <h3 className="mb-4 text-center text-lg font-bold text-charcoal">
                Policy Distribution by County
              </h3>

              {loading || !countyData ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-gray-500">Loading county data…</p>
                </div>
              ) : (
                <div className="relative">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ center: [-119.5, 37.5], scale: 2600 }}
                    width={800}
                    height={600}
                  >
                    <Geographies geography="/data/california-counties.json">
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const props = geo.properties as Record<string, unknown>;
                          const name =
                            (props.NAME as string) ??
                            (props.name as string) ??
                            "";
                          const policies = policiesFor(name);
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={colorForPolicies(policies)}
                              stroke="#ffffff"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none", fill: "#ffb6c1" },
                                pressed: { outline: "none" },
                              }}
                              onMouseEnter={() =>
                                setHovered({ name, policies: policies ?? 0 })
                              }
                              onMouseLeave={() => setHovered(null)}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>

                  {hovered && (
                    <div className="absolute right-4 top-4 rounded border bg-white p-3 shadow-lg">
                      <p className="font-semibold">{hovered.name} County</p>
                      <p className="text-patriot-red">
                        Policies: {hovered.policies.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {total > 0
                          ? ((hovered.policies / total) * 100).toFixed(1)
                          : "0.0"}
                        % of state total
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                {stats?.map.total_label ??
                  "Total FAIR Plan Policies in California (FY 2025)"}
                : {total.toLocaleString()}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-0">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <AlertTriangle className="h-5 w-5 text-patriot-red" />
                Policy Levels
              </h3>

              <div className="space-y-2 text-sm">
                {TIERS.map((tier) => (
                  <div key={tier.label} className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span>{tier.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <p className="mb-4 text-sm text-gray-600">
                  This map shows the concentration of FAIR Plan policies across
                  California counties. Darker red areas indicate counties with
                  more properties unable to obtain standard insurance coverage.
                </p>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-sm font-semibold text-patriot-red">
                    Data Source
                  </p>
                  <p className="text-xs text-gray-700">
                    {stats?.map.data_source ??
                      "California FAIR Plan data through September 30, 2025"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full" onClick={() => scrollTo("signup")}>
                  Stay Informed
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
