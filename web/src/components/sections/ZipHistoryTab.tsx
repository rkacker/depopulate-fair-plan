import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/Sparkline";
import { loadZipHistory, titleCaseCounty } from "@/lib/data";
import type { ZipHistoryRow } from "@/types";

type SortField = "zip" | "city" | "county" | "fy_2020" | "fy_2021" | "fy_2022" | "fy_2023" | "fy_2024";
type SortOrder = "asc" | "desc";

const DEFAULT_LIMIT = 25;
const DOWNLOAD_HREF = "/data/california_zip_history.csv";
const YEARS = [2020, 2021, 2022, 2023, 2024] as const;

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString();
}

export function ZipHistoryTab() {
  const [rows, setRows] = useState<ZipHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("fy_2024");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadZipHistory()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedQuery = query.trim();

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!trimmedQuery) return rows;
    const q = trimmedQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.zip.startsWith(trimmedQuery) ||
        r.city.toLowerCase().includes(q) ||
        r.county.toLowerCase().includes(q),
    );
  }, [rows, trimmedQuery]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortField === "zip") {
        return sortOrder === "asc" ? a.zip.localeCompare(b.zip) : b.zip.localeCompare(a.zip);
      }
      if (sortField === "city") {
        return sortOrder === "asc" ? a.city.localeCompare(b.city) : b.city.localeCompare(a.city);
      }
      if (sortField === "county") {
        return sortOrder === "asc" ? a.county.localeCompare(b.county) : b.county.localeCompare(a.county);
      }
      const year = parseInt(sortField.slice(3), 10) as (typeof YEARS)[number];
      const av = a.fy[year] ?? Number.NEGATIVE_INFINITY;
      const bv = b.fy[year] ?? Number.NEGATIVE_INFINITY;
      return sortOrder === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [filtered, sortField, sortOrder]);

  const displayed = trimmedQuery || showAll ? sorted : sorted.slice(0, DEFAULT_LIMIT);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "zip" || field === "city" || field === "county" ? "asc" : "desc");
    }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  }

  return (
    <Card className="border-0 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-charcoal">
            FAIR Plan History (by ZIP)
          </h2>
          <p className="max-w-2xl text-sm text-gray-600">
            Per-ZIP FAIR Plan policy counts at each California fiscal year-end
            (Sep 30), 2020 through 2024. The Trendline shows the 5-year
            trajectory. Search by ZIP prefix, city, or county.
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

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ZIP (e.g. 92352), city (e.g. Truckee), or county"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm focus:border-patriot-red focus:outline-none focus:ring-1 focus:ring-patriot-red"
            aria-label="Search ZIP codes"
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
            ? `${filtered.length.toLocaleString()} match${filtered.length === 1 ? "" : "es"}`
            : `${(rows?.length ?? 0).toLocaleString()} ZIPs`}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load ZIP history: {error}
        </div>
      )}

      {!rows && !error && (
        <div className="py-8 text-center text-gray-500">Loading ZIP history…</div>
      )}

      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort("zip")}
                    className="flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                  >
                    ZIP
                    {sortIcon("zip")}
                  </button>
                </th>
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
                <th className="px-4 py-3 text-right">
                  <span className="font-semibold text-charcoal">Trendline</span>
                </th>
                {YEARS.slice().reverse().map((y) => (
                  <th key={y} className="px-4 py-3 text-right tabular-nums">
                    <button
                      onClick={() => handleSort(`fy_${y}` as SortField)}
                      className="ml-auto flex items-center gap-2 font-semibold text-charcoal transition-colors hover:text-patriot-red"
                    >
                      {y}
                      {sortIcon(`fy_${y}` as SortField)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No ZIPs match "{trimmedQuery}".
                  </td>
                </tr>
              )}
              {displayed.map((row, i) => (
                <tr
                  key={row.zip}
                  className={`border-b transition-colors hover:bg-blue-50 ${
                    i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-medium text-charcoal">
                    {row.zip}
                  </td>
                  <td className="px-4 py-3 text-charcoal">{row.city || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.county ? `${titleCaseCounty(row.county)} County` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.series.length >= 2 ? (
                      <Sparkline values={row.series} />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {YEARS.slice().reverse().map((y) => (
                    <td key={y} className="px-4 py-3 text-right text-gray-700 tabular-nums">
                      {fmt(row.fy[y])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {!trimmedQuery && sorted.length > DEFAULT_LIMIT && (
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                {showAll
                  ? `Show Top ${DEFAULT_LIMIT} ZIPs`
                  : `Show All ${sorted.length.toLocaleString()} ZIPs`}
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-500">
            Source: California FAIR Plan 5-year PIF history PDFs (FY2019–FY2025
            files combined, dedup'd by fiscal year). See the GitHub repository
            for full derivation.
          </p>
        </div>
      )}
    </Card>
  );
}
