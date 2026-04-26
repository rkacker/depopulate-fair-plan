import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { titleCaseCounty } from "@/lib/data";
import type { CountyData, SiteStats } from "@/types";

type SortField = "county" | "policies";
type SortOrder = "asc" | "desc";

interface CountyTableProps {
  countyData: CountyData | null;
  stats: SiteStats | null;
  loading: boolean;
}

export function CountyTable({ countyData, stats, loading }: CountyTableProps) {
  const [sortField, setSortField] = useState<SortField>("policies");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAll, setShowAll] = useState(false);

  const { sorted, total } = useMemo(() => {
    const rows = countyData?.rows ?? [];
    const t = countyData?.total ?? 0;
    const sortedRows = [...rows].sort((a, b) => {
      if (sortField === "county") {
        return sortOrder === "asc"
          ? a.county.localeCompare(b.county)
          : b.county.localeCompare(a.county);
      }
      return sortOrder === "asc"
        ? a.policies - b.policies
        : b.policies - a.policies;
    });
    return { sorted: sortedRows, total: t };
  }, [countyData, sortField, sortOrder]);

  const displayed = showAll ? sorted : sorted.slice(0, 10);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "policies" ? "desc" : "asc");
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Card className="border-0 lg:p-8">
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-bold text-charcoal">
              County-Level Data
            </h2>
            <p className="text-sm text-gray-600">
              {stats?.table.description ??
                "FAIR Plan policies by county as of September 30, 2025"}
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">Loading county data…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort("county")}
                        className="flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        County Name
                        {sortIcon("county")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort("policies")}
                        className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                      >
                        Number of Policies
                        {sortIcon("policies")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="font-semibold text-charcoal">
                        % of State Total
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((row, index) => (
                    <tr
                      key={row.county}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-charcoal">
                        {titleCaseCounty(row.county)} County
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-patriot-red">
                        {row.policies.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {total > 0
                          ? ((row.policies / total) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll
                    ? "Show Top 10 Counties"
                    : `Show All ${sorted.length} Counties`}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  {stats?.table.data_source ??
                    "Data source: California FAIR Plan through September 30, 2025"}
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
