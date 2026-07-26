import type { HistoryRow } from "@/components/sections/StatewideHistoryTab";
import { fmtCoverage, fmtPolicies } from "@/lib/historyFormat";

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

  // Growth multiple spans the full chart range — earliest to latest — so the
  // headline number matches what the curve visually shows.
  const growthMultiple =
    first && last && first.policy_count && last.policy_count
      ? last.policy_count / first.policy_count
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

        {/* Chart card — full width. */}
        <div className="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:p-6">
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
        </div>

        {/* Full data table lives on /data — this section is chart-led. */}

        {/* "Why This Matters" callout — bridges to the map; carries the
            headline multiplier the chart proves. */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
            <p className="mb-2 font-semibold text-patriot-red">Why This Matters</p>
            <p className="text-gray-700">
              {growthMultiple !== null && first && last && (
                <>
                  <span className="text-lg font-bold tabular-nums text-charcoal lg:text-xl">
                    {growthMultiple.toFixed(1)}× growth
                  </span>{" "}
                  since {fmtCoverage(first.coverage_end)} — from{" "}
                  <span className="font-semibold tabular-nums">
                    {fmtPolicies(first.policy_count)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold tabular-nums">
                    {fmtPolicies(last.policy_count)}
                  </span>{" "}
                  policies.{" "}
                </>
              )}
              This explosive growth doesn't just affect the families on it — it
              creates hidden costs for every homeowner in California. Here's how.
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

  // X-axis ticks at Jan 1 of each calendar year whose start falls inside the
  // data range. The on-line dots (below) sit at FY-end rows (Sep 30 — the
  // FAIR Plan's native annual cadence), so the calendar labels and the data
  // markers are intentionally two separate views of time. Today the chart
  // starts Sep 30, 2019, so Jan 1, 2019 is offscreen and naturally skipped.
  const minYear = new Date(xMin).getUTCFullYear();
  const maxYear = new Date(xMax).getUTCFullYear();
  const xTicks: Array<{ x: number; label: string }> = [];
  for (let y = minYear; y <= maxYear; y++) {
    const t = Date.UTC(y, 0, 1);
    if (t < xMin || t > xMax) continue;
    xTicks.push({ x: padL + ((t - xMin) / xRange) * innerW, label: y.toString() });
  }

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
        {`Statewide FAIR Plan policies in force, ${first.coverage_end.slice(0, 4)} to ${last.coverage_end.slice(0, 4)}`}
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

      {/* x-axis baseline + per-year hash marks + labels */}
      <line
        x1={padL}
        x2={VB_W - padR}
        y1={VB_H - padB}
        y2={VB_H - padB}
        stroke="#d1d5db"
        strokeWidth={1}
      />
      {xTicks.map((t, i) => (
        <g key={`x-${i}`}>
          <line
            x1={t.x}
            x2={t.x}
            y1={VB_H - padB}
            y2={VB_H - padB + 6}
            stroke="#9ca3af"
            strokeWidth={1}
          />
          <text
            x={t.x}
            y={VB_H - padB + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            {t.label}
          </text>
        </g>
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

      {/* Dots at FY-end rows (Sep 30) — the FAIR Plan's native annual cadence.
          Calendar-year labels on the x-axis use different x positions; the
          data line and the time-reference labels are two separate views. */}
      {rows
        .filter((r) => r.coverage_end.endsWith("-09-30"))
        .map((r) => {
          if (r === first || r === last) return null; // emphasized endpoints
          return (
            <circle
              key={`pt-${r.coverage_end}`}
              cx={xOf(r.coverage_end)}
              cy={yOf(r.policy_count!)}
              r={3}
              fill="#cb181d"
            />
          );
        })}

      {/* start point — visual anchor; the value + date appear in the
          "Why This Matters" copy below, not on the chart itself. */}
      <circle cx={startX} cy={startY} r={5} fill="#cb181d" />

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
