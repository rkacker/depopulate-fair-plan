import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { PromiseStats } from "@/lib/distressed";
import { DEAL_FY, FY_LAST } from "@/lib/distressed";
import { fmtPolicies } from "@/lib/historyFormat";

// Static long-form article: "The Depopulation Promise". Rendered entirely at
// build time (no client directive — zero JS shipped). Cites and extends the
// NYT's Nov 2025 investigation of the Sept 2023 insurer deal with this
// project's own datasets. Primary claim: no depopulation happened in the
// very ZIP codes the state named. Secondary: the list undercounts by the
// state's own criteria. Punchline: designated or not, nothing depopulated.
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

  const { scorecard, criteria, matrix } = stats;
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
        California's 2023 deal with insurers promised to move homeowners off
        the FAIR Plan, starting with a named list of distressed ZIP codes. In{" "}
        {grewPct}% of those very ZIP codes, FAIR Plan enrollment has grown
        since the deal. Distressed or not, listed or not — nothing has
        depopulated.
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
        In September 2023, facing insurer walkouts, the Newsom administration
        and Insurance Commissioner Ricardo Lara struck what was billed as a
        historic bargain: insurers could charge higher, catastrophe-model-based
        rates, and in exchange they would have to write policies in distressed
        areas at no less than 85 percent of their statewide market share. The
        instrument of that promise is a{" "}
        <a href={CDI_LIST_URL} className="underline" rel="noopener">
          published list
        </a>{" "}
        of distressed counties and undermarketed ZIP codes — the places the
        deal was supposed to rescue. A{" "}
        <a href={NYT_URL} className="underline" rel="noopener">
          New York Times investigation (Nov. 1, 2025)
        </a>{" "}
        documented the loopholes insurers negotiated around that commitment.
        Here we ask the outcome question: in the ZIP codes the state itself
        named, did anyone actually leave the FAIR Plan?
      </p>

      {/* ——— PRIMARY: the named zones ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        1. In the named ZIP codes, depopulation never started
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
        Of the {scorecard.total} state-designated distressed ZIP codes that
        appear in the FAIR Plan's reporting, <strong>{scorecard.grew} had
        more FAIR Plan policies in FY{FY_LAST} than at the deal</strong> (FY
        {DEAL_FY}); {scorecard.flat} were flat; {scorecard.declined} declined.
        In aggregate, enrollment in the named zones rose{" "}
        <strong>+{stats.designated.growthPct}%</strong> (
        {fmtPolicies(stats.designated.fyDeal)} →{" "}
        {fmtPolicies(stats.designated.fyLast)}). And the handful of declines
        are not success stories: the largest is a Shasta County burn-area ZIP
        that fell to zero — homes lost, not homes returned to the private
        market.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        This is the deal's own scoreboard. The 85-percent commitment names
        these ZIP codes; the FAIR Plan's quarterly releases count policies in
        them. Two years on, the count went up almost everywhere the promise
        applies.
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
      <TrajectorySvg points={points} dealDate={DEAL_DATE} />
      <p className="mb-4 mt-4 leading-relaxed text-gray-700">
        The Times counted 320,581 → 625,033 through fall 2025. Five more
        months of quarterly releases show the line still climbing, with no
        quarter of decline. Outside the designated ZIP codes, growth since the
        deal (+{stats.unlisted.growthPct}%) has outpaced growth inside them
        (+{stats.designated.growthPct}%) — the crisis is spreading fastest in
        places the list doesn't reach at all.
      </p>

      {/* ——— SECONDARY: the list undercounts by its own test ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        3. And the list misses ZIP codes that pass the state's own test
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        California regulation (10 CCR § 2644.4.8) defines an undermarketed ZIP
        code: FAIR Plan penetration of at least 15 percent, in a ZIP that
        overlaps a CAL FIRE high or very-high fire hazard severity zone. We
        applied that test to current enrollment — using the last denominator
        CDI ever published (2023) and CAL FIRE's current hazard maps.{" "}
        <strong>
          {criteria.qualify} ZIP codes qualify today; {criteria.missedByCriteria}{" "}
          of them are not on the state's list.
        </strong>{" "}
        That count is conservative: we apply only the fire prong (the
        regulation's low-income premium prong could only add ZIPs), and CDI
        stopped publishing the penetration denominator after 2023 — we cannot
        apply the state's own test precisely because the state stopped
        publishing its inputs.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        The FAIR Plan's own releases corroborate the undercount. Its quarterly
        ZIP tables carry an unexplained "Is Distressed Area" column that flags{" "}
        <strong>{matrix.fairOnly + matrix.bothFlagged} ZIP codes — {matrix.fairOnly} more
        than the official list</strong> — and 95 percent of the ZIPs that pass
        the regulatory test are flagged in it. Whatever definition the FAIR
        Plan applies internally, it too finds distress far beyond the state's
        list. Meanwhile {criteria.listedNotQualifying} listed ZIP codes no
        longer meet the fire-prong test at all — the same over-breadth the
        Times documented, measured from the other side.
      </p>

      {/* ——— Punchline ——— */}
      <div className="my-10 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-6">
        <p className="text-lg font-semibold leading-relaxed text-charcoal">
          Designated or not, qualifying or not, fire country or not: there is
          no cohort of ZIP codes — none — where the 2023 deal produced
          depopulation. The list argues about where the promise applies. The
          data says the promise hasn't been kept anywhere.
        </p>
      </div>

      {/* ——— What would fix it ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What would make the promise real
      </h2>
      <ul className="mb-4 list-disc space-y-2 pl-6 leading-relaxed text-gray-700">
        <li>
          <span className="font-semibold">Measure depopulation itself.</span>{" "}
          AB 69's clearinghouse reporting should publish take-out counts at
          county and ZIP level, net of new FAIR Plan entries — one statewide
          number can show "success" while every named ZIP keeps growing.
        </li>
        <li>
          <span className="font-semibold">
            Re-run the undermarketed-ZIP test on a fixed cadence.
          </span>{" "}
          The designation criteria are already in regulation; the state should
          apply them to current data and republish the list, rather than
          leaving a 2025 snapshot to govern a moving crisis.
        </li>
        <li>
          <span className="font-semibold">Reopen the data pipeline.</span>{" "}
          The penetration denominator — total residential policies by ZIP —
          stops at calendar 2023. The 2024 and 2025 editions should be
          published now.
        </li>
      </ul>

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
          <span className="font-semibold">§ 2644.4.8 recomputation:</span>{" "}
          penetration = current FAIR Plan policies (Mar. 2026 release) ÷ total
          residential policies in 2023, where the total is CDI's ZIP-level
          voluntary-market count (new + renewed, 2023 — the latest published)
          plus FAIR Plan FY2023. This assumes the housing stock is roughly
          stable since 2023; policy movement between the voluntary market and
          the FAIR Plan does not change the denominator. Fire overlap = any
          share of ZIP land area in CAL FIRE High/Very High severity zones
          (combined SRA 2024 / LRA 2025 layer). We do not apply the
          regulation's alternative low-income premium prong; applying it could
          only increase the qualifying count.
        </p>
        <p>
          <span className="font-semibold">
            The FAIR Plan's "Is Distressed Area" column:
          </span>{" "}
          printed per ZIP in the FAIR Plan's quarterly releases with no
          published definition. It flagged the same ~1,009 ZIP codes in the
          June 2025, December 2025, and March 2026 releases (drifting by a
          single ZIP), but matched the official 663-ZIP list exactly in the
          September 2025 release — an inconsistency we disclose and have asked
          the FAIR Plan to explain. We treat this column as corroboration, not
          as the primary definition.
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

// Minimal static line chart: policies over time with the deal marked.
function TrajectorySvg({
  points,
  dealDate,
}: {
  points: StatewideHistoryRow[];
  dealDate: string;
}) {
  if (points.length < 2) return null;
  const W = 640;
  const H = 220;
  const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
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
  const dealX = x(dealDate);
  const years = Array.from(
    new Set(points.map((p) => p.coverage_end.slice(0, 4))),
  ).filter((_, i) => i % 2 === 0);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-gray-200 bg-gray-50"
        role="img"
        aria-label={`FAIR Plan policies in force over time, with the September 2023 insurer deal marked. ${points.length} data points.`}
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
        <line
          x1={dealX}
          x2={dealX}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text x={dealX + 5} y={PAD.top + 12} fontSize={11} fontWeight={600} fill="#374151">
          Sept 2023: the deal
        </text>
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
        FAIR Plan residential policies in force. Sources mix fiscal-year and
        quarterly releases; the x-axis is a true time axis. Full table on{" "}
        <a href="/data" className="underline">/data</a>.
      </figcaption>
    </figure>
  );
}
