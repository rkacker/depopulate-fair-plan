import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/Sparkline";
import { loadCountyMarketShare, titleCaseCounty } from "@/lib/data";
import type { CountyMarketShareRow } from "@/types";

type SortField = "county" | "fairShareLatest" | "fairPifLatest" | "totalPifLatest";
type SortOrder = "asc" | "desc";

const DEFAULT_LIMIT = 10;
const DOWNLOAD_HREF = "/data/cdi_county_market_share.csv";

export function FairShareTab() {
  const [rows, setRows] = useState<CountyMarketShareRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("fairShareLatest");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCountyMarketShare()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const latestYear = rows?.[0]?.years.at(-1) ?? null;
  const earliestYear = rows?.[0]?.years[0] ?? null;

  const sorted = useMemo(() => {
    if (!rows) return [];
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortField === "county") {
        return sortOrder === "asc"
          ? a.county.localeCompare(b.county)
          : b.county.localeCompare(a.county);
      }
      const av = a[sortField];
      const bv = b[sortField];
      return sortOrder === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortField, sortOrder]);

  const displayed = showAll ? sorted : sorted.slice(0, DEFAULT_LIMIT);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "county" ? "asc" : "desc");
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
    <Card className="border-0 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-charcoal">
            FAIR Share of Total Market
          </h2>
          <p className="max-w-2xl text-sm text-gray-600">
            FAIR Plan policies as a percentage of the total California
            homeowners insurance market, by county. CDI annual data
            {earliestYear && latestYear ? ` (${earliestYear}–${latestYear})` : ""}.
            The Trend column shows how each county's FAIR share has changed
            across the available years.
          </p>
        </div>
        <a
          href={DOWNLOAD_HREF}
          download
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm transition-colors hover:border-patriot-red hover:text-patriot-red"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </a>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load market share data: {error}
        </div>
      )}

      {!rows && !error && (
        <div className="py-8 text-center text-gray-500">
          Loading market share data…
        </div>
      )}

      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("county")}
                    className="flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                  >
                    County
                    {sortIcon("county")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("fairShareLatest")}
                    className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                  >
                    FAIR Share{latestYear ? ` (${latestYear})` : ""}
                    {sortIcon("fairShareLatest")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("fairPifLatest")}
                    className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                  >
                    FAIR Policies
                    {sortIcon("fairPifLatest")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort("totalPifLatest")}
                    className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                  >
                    Total Market
                    {sortIcon("totalPifLatest")}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="font-semibold text-charcoal">Trend</span>
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
                    {row.fairShareLatest.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.fairPifLatest.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.totalPifLatest.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Sparkline values={row.fairShareSeries} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length > DEFAULT_LIMIT && (
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                {showAll
                  ? `Show Top ${DEFAULT_LIMIT} Counties`
                  : `Show All ${sorted.length} Counties`}
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-500">
            Source: California Department of Insurance annual county market
            data. See the GitHub repository for full source attribution and
            derivation.
          </p>
        </div>
      )}
    </Card>
  );
}
