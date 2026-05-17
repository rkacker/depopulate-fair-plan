import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VelocityIndicator } from "@/components/VelocityIndicator";
import { titleCaseCounty } from "@/lib/data";
import type { CityData, SiteStats } from "@/types";

type SortField = "city" | "county" | "policies" | "changePct" | "yoyChangePct";
type SortOrder = "asc" | "desc";

const DEFAULT_LIMIT = 25;
const ZIP_DISPLAY_LIMIT = 10;

interface CityTableProps {
  cityData: CityData | null;
  stats: SiteStats | null;
  loading: boolean;
}

export function CityTable({ cityData, stats, loading }: CityTableProps) {
  const [sortField, setSortField] = useState<SortField>("policies");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const total = cityData?.total ?? 0;
  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    const rows = cityData?.rows ?? [];
    if (!trimmedQuery) return rows;
    const q = trimmedQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.city.toLowerCase().includes(q) ||
        r.county.toLowerCase().includes(q) ||
        r.zips.some((z) => z.startsWith(trimmedQuery)),
    );
  }, [cityData, trimmedQuery]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      if (sortField === "city") {
        return sortOrder === "asc"
          ? a.city.localeCompare(b.city)
          : b.city.localeCompare(a.city);
      }
      if (sortField === "county") {
        return sortOrder === "asc"
          ? a.county.localeCompare(b.county)
          : b.county.localeCompare(a.county);
      }
      if (sortField === "changePct" || sortField === "yoyChangePct") {
        const av = a[sortField] ?? Number.NEGATIVE_INFINITY;
        const bv = b[sortField] ?? Number.NEGATIVE_INFINITY;
        return sortOrder === "asc" ? av - bv : bv - av;
      }
      return sortOrder === "asc"
        ? a.policies - b.policies
        : b.policies - a.policies;
    });
    return rows;
  }, [filtered, sortField, sortOrder]);

  const displayed = trimmedQuery || showAll ? sorted : sorted.slice(0, DEFAULT_LIMIT);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "policies" || field === "changePct" ? "desc" : "asc");
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="border-0 lg:p-8">
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-bold text-charcoal">
              City-Level Data
            </h2>
            <p className="text-sm text-gray-600">
              FAIR Plan policies by city, with last-quarter change. Search by
              city, ZIP prefix, or county name.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Note: some recognizable communities — for example{" "}
              <span className="font-medium">Pacific Palisades</span>, Sylmar,
              and Encino — appear in this table but not on the map above,
              because they're neighborhoods within a larger city (typically
              Los Angeles) and don't have their own Census Place boundary.
            </p>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city (e.g. Truckee), ZIP (e.g. 92352), or county"
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm focus:border-patriot-red focus:outline-none focus:ring-1 focus:ring-patriot-red"
                aria-label="Search cities"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="whitespace-nowrap text-sm text-gray-500">
              {trimmedQuery
                ? `${filtered.length.toLocaleString()} match${
                    filtered.length === 1 ? "" : "es"
                  }`
                : `${(cityData?.rows.length ?? 0).toLocaleString()} cities`}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">Loading city data…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("city")}
                        className="flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        City
                        {sortIcon("city")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("county")}
                        className="flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        County
                        {sortIcon("county")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="font-semibold text-charcoal">ZIP(s)</span>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort("policies")}
                        className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        Policies
                        {sortIcon("policies")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort("changePct")}
                        className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        Last Quarter
                        {sortIcon("changePct")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort("yoyChangePct")}
                        className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        Last Year
                        {sortIcon("yoyChangePct")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No cities match "{trimmedQuery}".
                      </td>
                    </tr>
                  )}
                  {displayed.map((row, index) => {
                    const shown = row.zips.slice(0, ZIP_DISPLAY_LIMIT);
                    const more = row.zips.length - shown.length;
                    return (
                      <tr
                        key={row.city}
                        className={`border-b transition-colors hover:bg-blue-50 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-charcoal">
                          {row.city}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.county ? `${titleCaseCounty(row.county)} County` : "—"}
                        </td>
                        <td className="max-w-md px-4 py-3 font-mono text-xs text-gray-600">
                          {shown.join(", ")}
                          {more > 0 && (
                            <span className="ml-1 text-gray-400">+ {more} more</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-patriot-red">
                          {row.policies.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <VelocityIndicator
                            direction={row.direction}
                            changePct={row.changePct}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <VelocityIndicator
                            direction={row.yoyDirection}
                            changePct={row.yoyChangePct}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!trimmedQuery && sorted.length > DEFAULT_LIMIT && (
                <div className="mt-6 text-center">
                  <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                    {showAll
                      ? `Show Top ${DEFAULT_LIMIT} Cities`
                      : `Show All ${sorted.length.toLocaleString()} Cities`}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  {stats?.table.data_source ??
                    "Data source: California FAIR Plan city-level data"}
                </p>
                <p className="mt-1">
                  Total policies statewide:{" "}
                  <span className="font-semibold text-patriot-red">
                    {total.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
