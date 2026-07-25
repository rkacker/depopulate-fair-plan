import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/Sparkline";
import { loadDistressedData } from "@/lib/data";
import { FY_FIRST, FY_LAST, MIN_GROWTH_BASE } from "@/lib/distressed";
import { EMPTY_CELL, fmtPolicies } from "@/lib/historyFormat";
import type { DistressedData, DistressedSummary } from "@/types";

interface DistressedDivergenceProps {
  summary?: DistressedSummary | null;
}

// Spec §6 "The Map the State Is Missing": a 2×2 agreement matrix between the
// FAIR Plan's own distressed-area marker and CDI's official distressed-ZIP
// list, plus the ranked list of ZIPs the official list misses. The matrix —
// not a map — because the story is a classification disagreement, and the
// asymmetry (hundreds unflagged vs a handful the other way) is legible in
// one glance. Only a preview of the list is server-rendered; the full list
// fetches on expand.
export function DistressedDivergence({ summary = null }: DistressedDivergenceProps) {
  const [expanded, setExpanded] = useState(false);
  const [fullData, setFullData] = useState<DistressedData | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  if (!summary) return null;
  const { matrix, previewRows } = summary;
  const total = matrix.bothFlagged + matrix.neither + matrix.fairOnly + matrix.cdiOnly;
  const rows = expanded && fullData ? fullData.fairOnlyRows : previewRows;

  const toggleExpand = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!fullData && !loadingFull) {
      setLoadingFull(true);
      loadDistressedData()
        .then(setFullData)
        .finally(() => setLoadingFull(false));
    }
  };

  return (
    <section id="distressed" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            The State's Distress Map Doesn't Match the Ground
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            California's official distressed-area list triggers moratoria and
            non-renewal protections. The FAIR Plan's own data flags{" "}
            <span className="font-semibold tabular-nums text-charcoal">
              {matrix.fairOnly.toLocaleString()} ZIP codes
            </span>{" "}
            as distressed that the official list does not — and only{" "}
            {matrix.cdiOnly.toLocaleString()} the other way.
          </p>
        </div>

        {/* 2×2 agreement matrix. Cells are plain DOM so the numbers are the
            accessible fallback; the disagreement cell carries the accent. */}
        <div className="mx-auto mb-10 max-w-3xl">
          <div className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
            {total.toLocaleString()} reconciled ZIP codes
          </div>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-center">
            <div />
            <div className="text-sm font-semibold text-gray-500">
              Not on CDI's list
            </div>
            <div className="text-sm font-semibold text-gray-500">
              On CDI's list
            </div>

            <div className="flex items-center pr-2 text-right text-sm font-semibold text-gray-500">
              FAIR data:
              <br />
              not distressed
            </div>
            <MatrixCell value={matrix.neither} label="agree — not distressed" />
            <MatrixCell
              value={matrix.cdiOnly}
              label="listed, but FAIR data doesn't flag"
            />

            <div className="flex items-center pr-2 text-right text-sm font-semibold text-gray-500">
              FAIR data:
              <br />
              distressed
            </div>
            <MatrixCell
              value={matrix.fairOnly}
              label="unflagged by the state — the gap"
              highlight
            />
            <MatrixCell value={matrix.bothFlagged} label="agree — distressed" />
          </div>
        </div>

        {/* Ranked list of the unflagged-but-distressed ZIPs. */}
        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              ZIP codes the official list misses, by 5-year FAIR Plan growth
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-4 py-2">ZIP</th>
                  <th scope="col" className="px-4 py-2">County</th>
                  <th scope="col" className="px-4 py-2 text-right">Policies</th>
                  <th scope="col" className="px-4 py-2 text-right">5-yr growth</th>
                  <th scope="col" className="px-4 py-2 text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.zip} className="border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-2 font-semibold tabular-nums text-charcoal">
                      {row.zip}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{row.county}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                      {fmtPolicies(row.policies)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-patriot-red">
                      {row.growthPct !== null
                        ? `${row.growthPct >= 0 ? "+" : ""}${row.growthPct}%`
                        : EMPTY_CELL}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Sparkline values={row.series} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center">
            <Button variant="ghost" onClick={toggleExpand}>
              {expanded
                ? loadingFull
                  ? "Loading full list…"
                  : "Show top 10"
                : `Show all ${matrix.fairOnly.toLocaleString()} ZIP codes`}
            </Button>
          </div>
        </div>

        {/* Methodology disclosure — this is an accountability claim, so the
            flag derivation must be explicit and heavier than other sections. */}
        <div className="mx-auto mt-6 max-w-3xl text-xs leading-relaxed text-gray-500">
          <p>
            <span className="font-semibold">How this is measured:</span> "FAIR
            data: distressed" is the FAIR Plan's own distressed-area marker,
            published inline in its quarterly ZIP-level releases — not a
            threshold we derived. "CDI's list" is the Department of Insurance's
            official distressed-ZIP list (2025 release). Growth is the change
            in FAIR Plan policies in force, FY{FY_FIRST} → FY{FY_LAST}, shown
            only for ZIPs with at least {MIN_GROWTH_BASE} policies in FY
            {FY_FIRST} (smaller ZIPs are listed after, by current size).{" "}
            <a
              href="/data/distressed_zip_reconciliation.csv"
              className="underline"
              download
            >
              Download the reconciliation CSV
            </a>{" "}
            or see all sources on the{" "}
            <a href="/data" className="underline">Data &amp; Downloads</a> page.
          </p>
        </div>
      </div>
    </section>
  );
}

interface MatrixCellProps {
  value: number;
  label: string;
  highlight?: boolean;
}

function MatrixCell({ value, label, highlight = false }: MatrixCellProps) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border-2 border-patriot-red bg-red-50 p-4"
          : "rounded-lg border border-gray-200 bg-gray-50 p-4"
      }
    >
      <div
        className={
          "text-2xl font-bold tabular-nums lg:text-3xl " +
          (highlight ? "text-patriot-red" : "text-gray-400")
        }
      >
        {value.toLocaleString()}
      </div>
      <div className={"mt-1 text-xs " + (highlight ? "font-semibold text-patriot-red" : "text-gray-500")}>
        {label}
      </div>
    </div>
  );
}
