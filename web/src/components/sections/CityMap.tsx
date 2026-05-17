import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChangeIcon } from "@/components/VelocityIndicator";
import { colorForCityPolicies, titleCaseCounty } from "@/lib/data";
import { scrollToSection } from "@/lib/utils";
import type { CityData, CityRow, SiteStats } from "@/types";

const TIERS = [
  { color: "#67000d", label: "Extreme (>5,000)" },
  { color: "#cb181d", label: "High (1,001–5,000)" },
  { color: "#fb6a4a", label: "Moderate (101–1,000)" },
  { color: "#fcbba1", label: "Low (1–100)" },
  { color: "#e5e7eb", label: "No Data" },
];

interface CityMapProps {
  cityData: CityData | null;
  stats: SiteStats | null;
  loading: boolean;
}

export function CityMap({ cityData, stats, loading }: CityMapProps) {
  const [hovered, setHovered] = useState<CityRow | null>(null);

  const total = cityData?.total ?? 0;
  const byCity = cityData?.byCity;

  return (
    <section id="heatmap" className="bg-gray-50 py-20 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            FAIR Plan Crisis Map — City Detail
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Policy concentration across ~1,100 California cities and unincorporated
            communities. Hover a city for its policy count and last-quarter change.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="border-0">
              <h3 className="mb-4 text-center text-lg font-bold text-charcoal">
                Policy Distribution by City
              </h3>

              {loading || !cityData ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-gray-500">Loading city data…</p>
                </div>
              ) : (
                <div className="relative">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ center: [-119.5, 37.5], scale: 2600 }}
                    width={800}
                    height={600}
                  >
                    <Geographies geography="data/california-counties.json">
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={`base-${geo.rsmKey}`}
                            geography={geo}
                            fill="#e5e7eb"
                            stroke="#9ca3af"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none", pointerEvents: "none" },
                              hover: { outline: "none", pointerEvents: "none" },
                              pressed: { outline: "none", pointerEvents: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                    <Geographies geography="data/california-places.json">
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const props = geo.properties as Record<string, unknown>;
                          const name = (props.name as string) ?? "";
                          const row = byCity?.get(name.toLowerCase());
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={colorForCityPolicies(row?.policies)}
                              stroke="#ffffff"
                              strokeWidth={0.4}
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none", fill: "#ffb6c1" },
                                pressed: { outline: "none" },
                              }}
                              onMouseEnter={() => setHovered(row ?? null)}
                              onMouseLeave={() => setHovered(null)}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>

                  {hovered && (
                    <div className="absolute right-4 top-4 rounded border bg-white p-3 shadow-lg">
                      <p className="font-semibold">{hovered.city}</p>
                      {hovered.county && (
                        <p className="text-sm text-gray-600">
                          {titleCaseCounty(hovered.county)} County
                        </p>
                      )}
                      <p className="text-patriot-red">
                        Policies: {hovered.policies.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {total > 0
                          ? ((hovered.policies / total) * 100).toFixed(2)
                          : "0.00"}
                        % of state total
                      </p>
                      {hovered.zipCount > 0 && (
                        <p className="text-xs text-gray-500">
                          {hovered.zipCount} ZIP{hovered.zipCount === 1 ? "" : "s"}
                        </p>
                      )}
                      {hovered.changePct !== null && (
                        <p className="mt-1 inline-flex items-center gap-1 text-sm">
                          <ChangeIcon direction={hovered.direction} />
                          <span>
                            {hovered.changePct > 0 ? "+" : ""}
                            {hovered.changePct.toFixed(1)}% last quarter
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                Total FAIR Plan Policies in California: {total.toLocaleString()}
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
                  Darker red cities hold the largest FAIR Plan concentrations.
                  The crisis is sharpest in mountain and wildland-urban
                  interface communities.
                </p>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  Map coverage is ~80% of cities. See the table below for the
                  full list, including communities without their own Census
                  Place boundary.
                </div>

                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-sm font-semibold text-patriot-red">
                    Data Source
                  </p>
                  <p className="text-xs text-gray-700">
                    {stats?.map.data_source ??
                      "California FAIR Plan city-level data"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full" onClick={() => scrollToSection("signup")}>
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
