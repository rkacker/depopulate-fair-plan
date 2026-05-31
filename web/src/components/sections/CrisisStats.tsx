import type { HistoryRow } from "@/components/sections/StatewideHistoryTab";
import { fmtBillions, fmtCoverage, fmtPolicies } from "@/lib/historyFormat";

// The site's chosen baseline for the "since X" growth framing. The full chart
// extends back to 2019-09-30, but the headline multiple is anchored here so
// the section still reads conservatively even if earlier data shifts.
const GROWTH_BASELINE = "2021-09-30";

interface CrisisStatsProps {
  initialStatewideRows?: HistoryRow[] | null;
}

export function CrisisStats({ initialStatewideRows = null }: CrisisStatsProps = {}) {
  // Rows arrive descending (latest first) from loadStatewideHistoryServer.
  // Chart + endpoint logic want chronological ascending, with only rows that
  // actually have a populated policy_count.
  const chronological = (initialStatewideRows ?? [])
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));

  const first = chronological[0] ?? null;
  const last = chronological[chronological.length - 1] ?? null;

  // Growth-stat baseline: prefer the curated anchor (2021-09-30); fall back to
  // the earliest populated row if the manifest ever drops that point.
  const baselineRow =
    chronological.find((r) => r.coverage_end === GROWTH_BASELINE) ?? first;
  const growthMultiple =
    baselineRow && last && baselineRow.policy_count && last.policy_count
      ? last.policy_count / baselineRow.policy_count
      : null;

  return (
    <section id="crisis" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            Understanding the Crisis
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            California's FAIR Plan was designed as an insurer of last resort,
            not a primary insurance solution.
          </p>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Chart card spans 2/3 on desktop, full-width on mobile. */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 lg:col-span-2 lg:p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Statewide FAIR Plan policies in force
              {first && last && (
                <>
                  {" "}
                  · {first.coverage_end.slice(0, 4)} → {last.coverage_end.slice(0, 4)}
                </>
              )}
            </h3>
            {chronological.length >= 2 && first && last ? (
              <TrajectoryChart rows={chronological} first={first} last={last} />
            ) : (
              <p className="py-12 text-center text-gray-500">
                Trajectory data unavailable.
              </p>
            )}
            <p className="mt-3 text-xs italic text-gray-500">
              Blends true quarterly DWE PDFs (2025-06 →), fiscal-year-end PIF
              history (2019–2024), and archived FAIR Plan webpage chart
              snapshots for gap quarters. Full per-row provenance on the{" "}
              <a className="underline hover:text-patriot-red" href="/data#statewide_history">
                data page
              </a>.
            </p>
          </div>

          {/* Growth-stat callout (replaces the old prior_year / current_year / growth cards). */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 text-center lg:flex lg:flex-col lg:justify-center">
            <p className="text-4xl font-bold text-navy-blue tabular-nums lg:text-5xl">
              {growthMultiple !== null ? `${growthMultiple.toFixed(1)}×` : "—"}
            </p>
            <p className="mt-2 font-medium text-charcoal">growth since</p>
            <p className="text-sm text-gray-600">
              {baselineRow ? fmtCoverage(baselineRow.coverage_end) : "Sep 30, 2021"}
            </p>
            {baselineRow && last && (
              <p className="mt-4 text-sm tabular-nums text-gray-700">
                <span className="font-semibold">{fmtPolicies(baselineRow.policy_count)}</span>
                {" → "}
                <span className="font-semibold">{fmtPolicies(last.policy_count)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Collapsed data table — always in the DOM for a11y; visually behind a disclosure. */}
        {chronological.length > 0 && (
          <details className="mx-auto mb-10 max-w-3xl rounded-lg border border-gray-200 bg-white">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium text-charcoal hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patriot-red focus-visible:ring-offset-2">
              <span>Show data table ({initialStatewideRows?.length ?? 0} rows)</span>
              <span aria-hidden className="text-gray-400">▾</span>
            </summary>
            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-charcoal">
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Coverage end</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Policies</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Exposure</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {(initialStatewideRows ?? []).map((r) => (
                    <tr key={r.coverage_end} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-charcoal">{fmtCoverage(r.coverage_end)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                        {fmtPolicies(r.policy_count)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                        {fmtBillions(r.exposure)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">
                        {fmtBillions(r.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* "Why This Matters" callout — bridges to the map. */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
            <p className="mb-2 font-semibold text-patriot-red">Why This Matters</p>
            <p className="text-gray-700">
              The FAIR Plan's explosive growth doesn't just affect the families
              on it — it creates hidden costs for every homeowner in California.
              Here's how.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Trajectory chart (inline; one caller, no need to extract) ---------------

interface TrajectoryChartProps {
  rows: HistoryRow[]; // chronological ascending, policy_count non-null
  first: HistoryRow;
  last: HistoryRow;
}

function TrajectoryChart({ rows, first, last }: TrajectoryChartProps) {
  // ViewBox stays constant; CSS scales the rendered size (h-60 → h-80).
  const VB_W = 720;
  const VB_H = 320;
  const padL = 56;
  const padR = 16;
  const padT = 28;
  const padB = 40;
  const innerW = VB_W - padL - padR;
  const innerH = VB_H - padT - padB;

  // Time scale on x — real dates, not categorical.
  const xMin = Date.parse(first.coverage_end);
  const xMax = Date.parse(last.coverage_end);
  const xRange = xMax - xMin || 1;
  const xOf = (s: string) => padL + ((Date.parse(s) - xMin) / xRange) * innerW;

  // Linear y-scale on policy_count. Let yMin breathe slightly above the data
  // floor so the slope reads against a small buffer; yMax extends slightly
  // above the peak so the end-point label has room.
  const counts = rows.map((r) => r.policy_count!) as number[];
  const yDataMin = Math.min(...counts);
  const yDataMax = Math.max(...counts);
  const yMin = Math.max(0, yDataMin - (yDataMax - yDataMin) * 0.08);
  const yMax = yDataMax + (yDataMax - yDataMin) * 0.08;
  const yRange = yMax - yMin || 1;
  const yOf = (v: number) => padT + innerH - ((v - yMin) / yRange) * innerH;

  const polyline = rows
    .map((r) => `${xOf(r.coverage_end).toFixed(1)},${yOf(r.policy_count!).toFixed(1)}`)
    .join(" ");

  // Four evenly-spaced time ticks on the x-axis (years).
  const xTicks = [0, 1, 2, 3].map((i) => {
    const t = xMin + (i / 3) * xRange;
    const x = padL + (i / 3) * innerW;
    return { x, label: new Date(t).getUTCFullYear().toString() };
  });

  // Four evenly-spaced y ticks. Round labels to the nearest 100k for cleanliness.
  const yTickRaw = [0, 1, 2, 3].map((i) => yMin + (i / 3) * yRange);
  const yTicks = yTickRaw.map((v) => ({
    y: yOf(v),
    label: fmtPolicies(Math.round(v / 1e5) * 1e5),
  }));

  const startX = xOf(first.coverage_end);
  const startY = yOf(first.policy_count!);
  const endX = xOf(last.coverage_end);
  const endY = yOf(last.policy_count!);

  const directionLabel =
    first.policy_count! < last.policy_count! ? "rose" : "fell";
  const desc =
    `Statewide FAIR Plan residential policies in force ${directionLabel} ` +
    `from ${fmtPolicies(first.policy_count)} on ${fmtCoverage(first.coverage_end)} ` +
    `to ${fmtPolicies(last.policy_count)} on ${fmtCoverage(last.coverage_end)}.`;

  return (
    <svg
      role="img"
      aria-labelledby="traj-title traj-desc"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-60 w-full sm:h-72 lg:h-80"
    >
      <title id="traj-title">
        Statewide FAIR Plan policies in force, {first.coverage_end.slice(0, 4)} to {last.coverage_end.slice(0, 4)}
      </title>
      <desc id="traj-desc">{desc}</desc>

      {/* y-axis gridlines + labels */}
      {yTicks.map((t, i) => (
        <g key={`y-${i}`}>
          <line
            x1={padL}
            x2={VB_W - padR}
            y1={t.y}
            y2={t.y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={t.y}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="12"
            fill="#6b7280"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* x-axis baseline + year labels */}
      <line
        x1={padL}
        x2={VB_W - padR}
        y1={VB_H - padB}
        y2={VB_H - padB}
        stroke="#d1d5db"
        strokeWidth={1}
      />
      {xTicks.map((t, i) => (
        <text
          key={`x-${i}`}
          x={t.x}
          y={VB_H - padB + 20}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
        >
          {t.label}
        </text>
      ))}

      {/* the trajectory itself */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#cb181d"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* start point + labels (to the right of the dot, above + below) */}
      <circle cx={startX} cy={startY} r={5} fill="#cb181d" />
      <text
        x={startX + 10}
        y={startY - 6}
        textAnchor="start"
        fontSize="13"
        fontWeight="600"
        fill="#1f2937"
      >
        {fmtPolicies(first.policy_count)}
      </text>
      <text
        x={startX + 10}
        y={startY + 8}
        textAnchor="start"
        dominantBaseline="hanging"
        fontSize="11"
        fill="#6b7280"
      >
        {fmtCoverage(first.coverage_end)}
      </text>

      {/* end point + labels (to the left of the dot, above + below — emphasized) */}
      <circle cx={endX} cy={endY} r={6} fill="#cb181d" />
      <text
        x={endX - 10}
        y={endY - 8}
        textAnchor="end"
        fontSize="15"
        fontWeight="700"
        fill="#1f2937"
      >
        {fmtPolicies(last.policy_count)}
      </text>
      <text
        x={endX - 10}
        y={endY + 8}
        textAnchor="end"
        dominantBaseline="hanging"
        fontSize="11"
        fill="#6b7280"
      >
        {fmtCoverage(last.coverage_end)}
      </text>
    </svg>
  );
}
