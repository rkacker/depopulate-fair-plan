import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { PromiseStats } from "@/lib/distressed";
import { DEAL_FY, FY_LAST } from "@/lib/distressed";
import { fmtPolicies } from "@/lib/historyFormat";
import {
  CHART_DEAL_ANNOUNCED,
  CHART_LIST_REVISED,
  CHART_SIS_OPERATIVE,
  SIS_TIMELINE,
} from "@/lib/sisTimeline";

// Static long-form article: "The Depopulation Promise". Rendered entirely at
// build time (no client directive — zero JS shipped). Cites and extends the
// NYT's Nov 2025 investigation of the Sept 2023 insurer deal with this
// project's own datasets. Core claim: no depopulation happened in the very
// ZIP codes the state named, and the regulatory record never counts it.
const NYT_URL =
  "https://www.nytimes.com/2025/11/01/us/los-angeles-california-fire-insurance-regulations.html";
const CDI_LIST_URL =
  "https://www.insurance.ca.gov/01-consumers/180-climate-change/upload/catastrophe-modeling-and-ratemaking-insurer-commitments-to-increase-writing-of-policies-in-high-risk-wildfire-areas-list-of-distressed-counties-and-undermarketed-zip-codes-residential-property-insurance-commitments.pdf";
const DEAL_DATE = "2023-09-30"; // FY close nearest the Sept 21, 2023 announcement

interface DepopulationPromiseProps {
  history: StatewideHistoryRow[]; // descending by coverage_end
  stats: PromiseStats;
}

export function DepopulationPromise({ history, stats }: DepopulationPromiseProps) {
  const points = history
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));
  const deal = points.find((r) => r.coverage_end === DEAL_DATE) ?? null;
  const latest = points[points.length - 1] ?? null;

  const { scorecard } = stats;
  const grewPct = scorecard.total
    ? Math.round((100 * scorecard.grew) / scorecard.total)
    : 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-patriot-red">
        Analysis
      </p>
      <h1 className="mb-4 text-4xl font-bold leading-tight text-charcoal lg:text-5xl">
        The Depopulation Promise
      </h1>
      <p className="mb-2 text-xl leading-relaxed text-gray-600">
        In 2023, California struck a deal with insurance companies that was
        supposed to move homeowners off the FAIR Plan, starting with a
        published list of ZIP codes where the market had broken down. So far,
        the numbers point the other way. In {grewPct}% of those ZIP codes,
        more homes are on the FAIR Plan today than when the deal was
        announced.
      </p>
      <p className="mb-10 text-sm text-gray-500">
        By depopulatefairplan.com · Data through{" "}
        {latest ? fmtDate(latest.coverage_end) : "—"} · All figures reproducible
        from the datasets on <a href="/data" className="underline">Data &amp; Downloads</a>
      </p>

      {/* ——— The promise ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        The promise
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        In September 2023, with major insurers refusing to write new policies
        in California, the Newsom administration and Insurance Commissioner
        Ricardo Lara announced a bargain. Insurers would be allowed to charge
        higher rates based on catastrophe models. In return, they would have
        to sell policies in the hardest-hit areas at close to their normal
        share of the market. The state published a{" "}
        <a href={CDI_LIST_URL} className="underline" rel="noopener">
          list
        </a>{" "}
        of the counties and ZIP codes the deal was meant to help. A{" "}
        <a href={NYT_URL} className="underline" rel="noopener">
          New York Times investigation
        </a>{" "}
        later documented loopholes that weakened that commitment. We asked a
        simpler question: in the ZIP codes the state itself named, are fewer
        households on the FAIR Plan today?
      </p>

      {/* ——— PRIMARY: the named zones ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        1. Distressed ZIP codes, no evidence of depopulation
      </h2>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border-2 border-patriot-red bg-red-50 p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-patriot-red">
            {scorecard.grew}
          </div>
          <div className="mt-1 text-xs font-semibold text-patriot-red">grew</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-gray-400">
            {scorecard.flat}
          </div>
          <div className="mt-1 text-xs text-gray-500">flat</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
          <div className="text-3xl font-bold tabular-nums text-gray-400">
            {scorecard.declined}
          </div>
          <div className="mt-1 text-xs text-gray-500">declined</div>
        </div>
      </div>
      <p className="mb-4 leading-relaxed text-gray-700">
        The state's list includes {scorecard.total} ZIP codes that show up in
        the FAIR Plan's reporting. In <strong>{scorecard.grew} of them, the
        FAIR Plan had more policies in fiscal {FY_LAST} than when the deal
        was announced</strong>. {scorecard.flat} stayed flat. Only{" "}
        {scorecard.declined} shrank. Across all the named ZIP codes together,
        enrollment rose {stats.designated.growthPct}%, from{" "}
        {fmtPolicies(stats.designated.fyDeal)} policies to{" "}
        {fmtPolicies(stats.designated.fyLast)}. Even the declines deserve a
        closer look: the largest was in a Shasta County ZIP code that fell to
        zero, a pattern consistent with homes lost to fire rather than
        families finding private coverage.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        These are the deal's own terms. The state chose these ZIP codes in a
        document whose title says exactly what the list is for:{" "}
        <a href={CDI_LIST_URL} className="underline" rel="noopener">
          "Catastrophe Modeling and Ratemaking: Insurer Commitments to
          Increase Writing of Policies in High Risk Wildfire Areas"
        </a>
        . That list was last revised in March 2025 and has not been updated
        since. The FAIR Plan counts its own policies in these ZIP codes every
        quarter. Two years in, the count went up almost everywhere the
        promise applies.
      </p>

      {/* ——— Statewide context ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        2. Statewide, the Plan has more than doubled since the deal
      </h2>
      {deal && latest && (
        <div className="mb-4 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
          <p className="text-gray-800">
            <span className="text-2xl font-bold tabular-nums text-patriot-red">
              {fmtPolicies(deal.policy_count)} → {fmtPolicies(latest.policy_count)}
            </span>
            <br />
            residential policies in force, {fmtDate(deal.coverage_end)} to{" "}
            {fmtDate(latest.coverage_end)}.
          </p>
        </div>
      )}
      <TrajectorySvg points={points} />
      <p className="mb-4 mt-4 leading-relaxed text-gray-700">
        The Times counted 320,581 to 625,033 through fall 2025. Five more
        months of quarterly reports show the line still climbing. There has
        not been a single quarter of decline. The shaded band shows the
        sixteen months it took to turn the announcement into working rules;
        enrollment sped up during that stretch and kept climbing after the
        rules took effect. And growth outside the listed ZIP codes (+
        {stats.unlisted.growthPct}%) has outpaced growth inside them (+
        {stats.designated.growthPct}%). The crisis is spreading fastest in
        places the list doesn't cover at all.
      </p>

      {/* ——— Timeline: what CDI did (and didn't do) ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        3. What the state did — and didn't — do along the way
      </h2>
      <p className="mb-6 leading-relaxed text-gray-700">
        Here is the record since the announcement, in one place. One pattern
        is worth noticing: progress is reported in insurer commitments and
        approved rate increases. We could find no published count of
        households that have actually moved off the FAIR Plan.
      </p>
      <ol className="mb-4 space-y-4 border-l-2 border-gray-200 pl-5">
        {[...SIS_TIMELINE]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => (
          <li key={`${e.date}-${e.title.slice(0, 24)}`}>
            <p
              className={
                "text-xs font-semibold uppercase tracking-wide " +
                (e.category === "non_action" ? "text-patriot-red" : "text-gray-500")
              }
            >
              {e.dateLabel} · {e.actor}
            </p>
            <p
              className={
                "mt-0.5 leading-relaxed " +
                (e.category === "non_action"
                  ? "font-medium text-charcoal"
                  : "text-gray-700")
              }
            >
              {e.title}
              {e.sourceUrl && (
                <>
                  {" "}
                  <a href={e.sourceUrl} className="underline" rel="noopener">
                    [source]
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>

      {/* ——— Punchline ——— */}
      <div className="my-10 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
        <p className="text-lg font-semibold leading-relaxed text-charcoal">
          On the list or off it, we found no group of ZIP codes where FAIR
          Plan enrollment has fallen since the deal. The list decides where
          the promise applies. The data, so far, shows no place where it has
          been delivered.
        </p>
      </div>

      {/* ——— Methodology ——— */}
      <h2 className="mb-3 mt-10 text-xl font-bold text-charcoal">Methodology</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600">
        <p>
          <span className="font-semibold">The official list:</span> CDI's
          "List of Distressed Counties and Undermarketed ZIP Codes" (March
          2025), 663 ZIP codes, of which {scorecard.total} appear in the FAIR
          Plan's ZIP-level reporting.
        </p>
        <p>
          <span className="font-semibold">Named-zone scorecard:</span> FAIR
          Plan policies in force per designated ZIP, FY{DEAL_FY} (ending Sept.
          30, 2023 — nine days after the deal was announced) vs. FY{FY_LAST}.
        </p>
        <p>
          <span className="font-semibold">Regulatory timeline:</span> curated
          from CDI press releases, bulletins, and orders. Dates are shown to
          the day where the exact date matters and to the month otherwise.
          Corrections are welcome; the timeline is maintained as a structured
          source in the site's open repository.
        </p>
        <p>
          All inputs are published, cited, and downloadable on{" "}
          <a href="/data" className="underline">Data &amp; Downloads</a>,
          including the{" "}
          <a href="/data/distressed_zip_reconciliation.csv" className="underline" download>
            per-ZIP reconciliation table
          </a>{" "}
          with penetration, fire-hazard share, and qualification flags. The
          pipeline is open source.
        </p>
      </div>
    </article>
  );
}

function fmtDate(iso: string): string {
  const [y, mo] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(mo ?? 1) - 1]} ${y}`;
}

// Minimal static line chart: policies over time with the deal's announcement,
// the 16-month rulemaking span, the operative date, and the list revision
// marked. Markers stay sparse on purpose — the shaded band carries the
// "announced ≠ implemented" honesty without crowding the plot.
function TrajectorySvg({ points }: { points: StatewideHistoryRow[] }) {
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
