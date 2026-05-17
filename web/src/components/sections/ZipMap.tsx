import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChangeIcon } from "@/components/VelocityIndicator";
import { colorForZipPolicies, titleCaseCounty } from "@/lib/data";
import { scrollToSection } from "@/lib/utils";
import type { SiteStats, ZipData, ZipRow } from "@/types";

const TIERS = [
  { color: "#67000d", label: "Extreme (>2,500)" },
  { color: "#cb181d", label: "High (501–2,500)" },
  { color: "#fb6a4a", label: "Moderate (101–500)" },
  { color: "#fcbba1", label: "Low (1–100)" },
  { color: "#e5e7eb", label: "No Data" },
];

interface ZipMapProps {
  zipData: ZipData | null;
  stats: SiteStats | null;
  loading: boolean;
}

export function ZipMap({ zipData, stats, loading }: ZipMapProps) {
  const [hovered, setHovered] = useState<ZipRow | null>(null);

  const total = zipData?.total ?? 0;
  const byZip = zipData?.byZip;

  return (
    <section id="heatmap" className="bg-gray-50 py-20 scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            FAIR Plan Crisis Map — ZIP Detail
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Policy concentration across ~1,700 California ZIP codes. The most
            granular view of the FAIR Plan crisis — hover any ZIP for its
            policy count and last-quarter change.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="border-0">
              <h3 className="mb-4 text-center text-lg font-bold text-charcoal">
                Policy Distribution by ZIP Code
              </h3>

              {loading || !zipData ? (
                <div className="flex h-96 items-center justify-center">
                  <p className="text-gray-500">Loading ZIP data…</p>
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
                    <Geographies geography="data/california-zips.json">
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const props = geo.properties as Record<string, unknown>;
                          const zip =
                            (props.zip as string) ?? (props.name as string) ?? "";
                          const row = byZip?.get(zip);
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={colorForZipPolicies(row?.policies)}
                              stroke="#ffffff"
                              strokeWidth={0.25}
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
                      <p className="font-semibold">
                        {hovered.city ? `${hovered.city} ` : ""}ZIP {hovered.zip}
                      </p>
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
                  ZIP-level detail surfaces the wildland-urban interface
                  pattern at the highest resolution available — every dark
                  red ZIP is a community where the standard insurance market
                  has effectively withdrawn.
                </p>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-sm font-semibold text-patriot-red">
                    Data Source
                  </p>
                  <p className="text-xs text-gray-700">
                    {stats?.map.data_source ??
                      "California FAIR Plan ZIP-level data"}
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
