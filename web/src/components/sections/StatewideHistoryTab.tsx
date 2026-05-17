import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/Sparkline";

interface RawHistoryRow {
  coverage_end?: string;
  policy_count?: string;
  exposure?: string;
  premium?: string;
  source?: string;
}

interface HistoryRow {
  coverage_end: string;
  policy_count: number | null;
  exposure: number | null;
  premium: number | null;
  source: string;
}

const DOWNLOAD_HREF = "/data/fair_statewide_history.csv";

function parseIntOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function loadHistory(): Promise<HistoryRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawHistoryRow>(DOWNLOAD_HREF, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: HistoryRow[] = [];
        for (const r of results.data) {
          if (!r.coverage_end) continue;
          rows.push({
            coverage_end: r.coverage_end,
            policy_count: parseIntOrNull(r.policy_count),
            exposure: parseIntOrNull(r.exposure),
            premium: parseIntOrNull(r.premium),
            source: r.source ?? "",
          });
        }
        rows.sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

const SOURCE_LABEL: Record<string, string> = {
  quarterly: "Granular DWE PDF (per-ZIP)",
  fy_history: "5-year fiscal-year PIF/TIV PDF",
  snapshot: "FAIR Plan webpage chart snapshot",
};

const SOURCE_COLOR: Record<string, string> = {
  quarterly: "bg-red-100 text-red-800",
  fy_history: "bg-blue-100 text-blue-800",
  snapshot: "bg-amber-100 text-amber-800",
};

function fmtPolicies(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString();
}

function fmtBillions(n: number | null): string {
  if (n === null) return "—";
  return `$${(n / 1e9).toFixed(1)}B`;
}

function fmtCoverage(s: string): string {
  const [y, m, d] = s.split("-");
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m)]} ${Number(d)}, ${y}`;
}

function sourceBadges(source: string) {
  return source.split(",").map((s) => (
    <span
      key={s}
      title={SOURCE_LABEL[s] ?? s}
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        SOURCE_COLOR[s] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {s}
    </span>
  ));
}

export function StatewideHistoryTab() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHistory()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const countSeries = rows
    ? rows.map((r) => r.policy_count).filter((v): v is number => v !== null)
    : [];
  const exposureSeries = rows
    ? rows.map((r) => r.exposure).filter((v): v is number => v !== null)
    : [];

  const latest = rows && rows.length > 0 ? rows[rows.length - 1] : null;
  const earliest = rows && rows.length > 0 ? rows[0] : null;

  return (
    <Card className="border-0 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-charcoal">
            FAIR Plan Statewide History
          </h2>
          <p className="max-w-2xl text-sm text-gray-600">
            Quarterly statewide policy count, total exposure, and written
            premium going back to fiscal year 2019. Granular quarters come
            from FAIR Plan DWE category PDFs; gap quarters are filled from
            5-year history PDFs (fiscal year ends) and webpage chart
            captures preserved on the Internet Archive.
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

      {rows && earliest && latest && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Policy count trajectory
            </p>
            <p className="mt-1 text-2xl font-bold text-charcoal">
              {fmtPolicies(earliest.policy_count)} → {fmtPolicies(latest.policy_count)}
            </p>
            <p className="text-xs text-gray-500">
              {fmtCoverage(earliest.coverage_end)} to {fmtCoverage(latest.coverage_end)}
            </p>
            <div className="mt-2">
              <Sparkline values={countSeries} width={180} height={28} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total exposure trajectory
            </p>
            <p className="mt-1 text-2xl font-bold text-charcoal">
              {fmtBillions(earliest.exposure)} → {fmtBillions(latest.exposure)}
            </p>
            <p className="text-xs text-gray-500">
              {fmtCoverage(earliest.coverage_end)} to {fmtCoverage(latest.coverage_end)}
            </p>
            <div className="mt-2">
              <Sparkline values={exposureSeries} width={180} height={28} />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Data points
            </p>
            <p className="mt-1 text-2xl font-bold text-charcoal">{rows.length}</p>
            <p className="text-xs text-gray-500">
              {countSeries.length} with policy count · {exposureSeries.length} with exposure
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load statewide history: {error}
        </div>
      )}

      {!rows && !error && (
        <div className="py-8 text-center text-gray-500">Loading history…</div>
      )}

      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-charcoal">
                  Coverage End
                </th>
                <th className="px-4 py-3 text-right font-semibold text-charcoal">
                  Policies
                </th>
                <th className="px-4 py-3 text-right font-semibold text-charcoal">
                  Exposure
                </th>
                <th className="px-4 py-3 text-right font-semibold text-charcoal">
                  Premium
                </th>
                <th className="px-4 py-3 text-left font-semibold text-charcoal">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.coverage_end}
                  className={`border-b transition-colors hover:bg-blue-50 ${
                    i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {fmtCoverage(row.coverage_end)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {fmtPolicies(row.policy_count)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {fmtBillions(row.exposure)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {fmtBillions(row.premium)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sourceBadges(row.source)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 text-center text-xs text-gray-500">
            Sources: California FAIR Plan DWE quarterly PDFs (granular);
            CFP 5-year PIF + TIV history PDFs (fiscal year ends); FAIR
            Plan webpage chart snapshots from the Internet Archive (gap
            quarters). See the GitHub repository for full derivation.
          </p>
        </div>
      )}
    </Card>
  );
}
