import type { StatewideHistoryRow } from "@/lib/loadData.server";
import {
  CHART_DEAL_ANNOUNCED,
  CHART_LIST_REVISED,
  CHART_SIS_OPERATIVE,
} from "@/lib/sisTimeline";

// Shared by the home page and /analysis/depopulation-promise.
// Minimal static line chart: policies over time with the deal's announcement,
// the 16-month rulemaking span, the operative date, and the list revision
// marked. Markers stay sparse on purpose — the shaded band carries the
// "announced ≠ implemented" honesty without crowding the plot.
export function DealTrajectoryChart({ points }: { points: StatewideHistoryRow[] }) {
  if (points.length < 2) return null;
  const W = 640;
  const H = 250;
  // top pad doubles as a label strip: marker labels render above the plot
  // area so they can never collide with the curve.
  const PAD = { top: 46, right: 16, bottom: 28, left: 56 };
  const LABEL_Y1 = 14;
  const LABEL_Y2 = 30;
  const t = (iso: string) => new Date(iso).getTime();
  const t0 = t(points[0].coverage_end);
  const t1 = t(points[points.length - 1].coverage_end);
  const vMax = Math.max(...points.map((p) => p.policy_count ?? 0));
  const x = (iso: string) =>
    PAD.left + ((t(iso) - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (v: number) =>
    PAD.top + (1 - v / vMax) * (H - PAD.top - PAD.bottom);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.coverage_end).toFixed(1)},${y(p.policy_count ?? 0).toFixed(1)}`)
    .join(" ");
  const announcedX = x(CHART_DEAL_ANNOUNCED);
  const operativeX = x(CHART_SIS_OPERATIVE);
  const listX = x(CHART_LIST_REVISED);
  const axisY = H - PAD.bottom;
  const years = Array.from(
    new Set(points.map((p) => p.coverage_end.slice(0, 4))),
  ).filter((_, i) => i % 2 === 0);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-gray-200 bg-gray-50"
        role="img"
        aria-label={`FAIR Plan policies in force over time. Marked: the September 2023 deal announcement, the rulemaking period through January 2025 when the strategy became operative alongside the Los Angeles fires, and the March 2025 distressed-list revision. ${points.length} data points.`}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(vMax * f)}
              y2={y(vMax * f)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text x={PAD.left - 6} y={y(vMax * f) + 4} textAnchor="end" fontSize={11} fill="#6b7280">
              {Math.round((vMax * f) / 1000)}K
            </text>
          </g>
        ))}
        {/* Rulemaking span: announcement → fully operative. Labels live in
            the strip above the plot; marker lines extend up to meet them. */}
        <rect
          x={announcedX}
          y={PAD.top}
          width={operativeX - announcedX}
          height={axisY - PAD.top}
          fill="#f59e0b"
          opacity={0.08}
        />
        <line
          x1={announcedX}
          x2={announcedX}
          y1={LABEL_Y1 + 4}
          y2={axisY}
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text
          x={announcedX - 5}
          y={LABEL_Y1}
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          fill="#374151"
        >
          Sept 2023: deal announced
        </text>
        <text
          x={(announcedX + operativeX) / 2}
          y={LABEL_Y2}
          textAnchor="middle"
          fontSize={10}
          fill="#92400e"
        >
          rules being written
        </text>
        <line
          x1={operativeX}
          x2={operativeX}
          y1={LABEL_Y1 + 4}
          y2={axisY}
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text
          x={operativeX + 5}
          fontSize={11}
          fontWeight={600}
          fill="#374151"
        >
          <tspan x={operativeX + 5} y={LABEL_Y1}>Jan 2025:</tspan>
          <tspan x={operativeX + 5} y={LABEL_Y2}>rules live · LA fires</tspan>
        </text>
        {/* Distressed-list revision: axis tick only; labeled in the caption. */}
        <path
          d={`M${listX - 4},${axisY + 8} L${listX + 4},${axisY + 8} L${listX},${axisY + 1} Z`}
          fill="#6b7280"
        />
        <path d={path} fill="none" stroke="#cb181d" strokeWidth={2.5} strokeLinejoin="round" />
        {years.map((yr) => (
          <text
            key={yr}
            x={x(`${yr}-06-30`)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#6b7280"
          >
            {yr}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-gray-500">
        FAIR Plan residential policies in force. Shaded span: the rulemaking
        period between the deal's announcement (Sept 21, 2023) and the SIS
        becoming fully operative (Jan 2025). ▲ marks the March 2025
        distressed-list revision. Sources mix fiscal-year and quarterly
        releases; the x-axis is a true time axis. Full table on{" "}
        <a href="/data" className="underline">/data</a>.
      </figcaption>
    </figure>
  );
}

// Era chart for the home page: one bar per fiscal year of the Lara era
// (each September 30). Every bar is taller than the last; only the final
// year is in full color. Chosen in review over a line with term markers,
// which read as busy.
export function EraBarChart({ points }: { points: StatewideHistoryRow[] }) {
  const fy = points.filter((p) => p.coverage_end.endsWith("-09-30"));
  if (fy.length < 2) return null;
  const RED = "#cb181d";
  const W = 640;
  const H = 270;
  const PAD = { top: 30, right: 12, bottom: 44, left: 12 };
  const vMax = Math.max(...fy.map((p) => p.policy_count ?? 0));
  const slot = (W - PAD.left - PAD.right) / fy.length;
  const bw = Math.min(46, slot - 14);
  const base = H - PAD.bottom;
  const h = (v: number) => (v / vMax) * (base - PAD.top);
  const fmt = (n: number | null) => (n ?? 0).toLocaleString("en-US");
  const dealYear = CHART_DEAL_ANNOUNCED.slice(0, 4);
  const firstRow = fy[0];
  const lastRow = fy[fy.length - 1];
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-gray-200 bg-white"
        role="img"
        aria-label={`FAIR Plan policies each September from ${firstRow.coverage_end.slice(0, 4)} to ${lastRow.coverage_end.slice(0, 4)}, higher every year: from ${fmt(firstRow.policy_count)} to ${fmt(lastRow.policy_count)}.`}
      >
        <line x1={PAD.left} x2={W - PAD.right} y1={base} y2={base} stroke="#d1d5db" strokeWidth={1} />
        {fy.map((p, i) => {
          const v = p.policy_count ?? 0;
          const cx = PAD.left + slot * i + slot / 2;
          const isLast = i === fy.length - 1;
          const yr = p.coverage_end.slice(0, 4);
          const top = base - h(v);
          const l = cx - bw / 2;
          const r = cx + bw / 2;
          return (
            <g key={yr}>
              <path
                d={`M${l},${base} V${top + 4} Q${l},${top} ${l + 4},${top} H${r - 4} Q${r},${top} ${r},${top + 4} V${base} Z`}
                fill={RED}
                opacity={isLast ? 1 : 0.35}
              />
              <text
                x={cx}
                y={top - 7}
                textAnchor="middle"
                fontSize={isLast ? 14 : 12}
                fontWeight={isLast || i === 0 ? 700 : 500}
                fill="#1f2937"
              >
                {Math.round(v / 1000)}K
              </text>
              <text x={cx} y={base + 17} textAnchor="middle" fontSize={12} fill="#6b7280">
                {yr}
              </text>
              {yr === dealYear && (
                <text x={cx} y={base + 33} textAnchor="middle" fontSize={10} fill="#6b7280">
                  strategy announced
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-xs text-gray-500">
        FAIR Plan residential policies in force each September 30, in
        thousands. Our series begins in September 2019, nine months after
        Commissioner Lara took office. The Sustainable Insurance Strategy was
        announced on September 21, 2023. Quarterly figures are on{" "}
        <a href="/data?tab=statewide_history" className="underline">
          /data
        </a>
        .
      </figcaption>
    </figure>
  );
}
