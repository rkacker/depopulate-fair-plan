import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { PromiseStats } from "@/lib/distressed";
import { DEAL_FY, FY_LAST, MIN_GROWTH_BASE } from "@/lib/distressed";
import { fmtPolicies } from "@/lib/historyFormat";

// Static long-form article: "The Depopulation Promise". Rendered entirely at
// build time (no client directive — zero JS shipped). Cites and extends the
// NYT's Nov 2025 investigation of the Sept 2023 insurer deal with this
// project's own datasets.
const NYT_URL =
  "https://www.nytimes.com/2025/11/01/us/los-angeles-california-fire-insurance-regulations.html";
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
  const sinceDealPct =
    deal?.policy_count && latest?.policy_count
      ? Math.round(((latest.policy_count - deal.policy_count) / deal.policy_count) * 100)
      : null;

  const m = stats.matrix;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-patriot-red">
        Analysis
      </p>
      <h1 className="mb-4 text-4xl font-bold leading-tight text-charcoal lg:text-5xl">
        The Depopulation Promise
      </h1>
      <p className="mb-2 text-xl leading-relaxed text-gray-600">
        California's 2023 deal with insurers promised to shrink the FAIR Plan
        and bring coverage back to "distressed" areas. The state's own data
        shows the opposite happened — and that the distressed-area map at the
        center of the deal fails in both directions.
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
        rates, and in exchange they would have to write policies in
        "distressed" areas at no less than 85 percent of their statewide market
        share. The deal's stated goal was to move homeowners <em>off</em> the
        FAIR Plan — to depopulate it.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        A{" "}
        <a href={NYT_URL} className="underline" rel="noopener">
          New York Times investigation (Nov. 1, 2025)
        </a>{" "}
        found that quietly negotiated loopholes all but eliminated that
        guarantee: the "distressed" designations sprawl far beyond the state's
        actual fire-hazard zones, letting insurers meet their targets by
        writing policies on the safest blocks of nominally distressed ZIP
        codes; offramps let companies qualify for higher rates anyway; and a
        wave of pre-regulation nonrenewals was grandfathered in. The Times
        counted FAIR Plan policies nearly doubling from 320,581 to 625,033 by
        fall 2025.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        Our datasets — built from the FAIR Plan's and the Department of
        Insurance's own published data — let us extend that account past the
        Times' publication date, and test the deal's central instrument: the
        distressed-area list itself.
      </p>

      {/* ——— Finding 1: still doubling ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        1. The FAIR Plan has kept growing since the Times published
      </h2>
      {deal && latest && (
        <div className="mb-4 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
          <p className="text-gray-800">
            <span className="text-2xl font-bold tabular-nums text-patriot-red">
              {fmtPolicies(deal.policy_count)} → {fmtPolicies(latest.policy_count)}
            </span>
            <br />
            residential policies in force, {fmtDate(deal.coverage_end)} (the
            deal) to {fmtDate(latest.coverage_end)} — up{" "}
            <span className="font-bold">{sinceDealPct}%</span>.
          </p>
        </div>
      )}
      <TrajectorySvg points={points} dealDate={DEAL_DATE} />
      <p className="mb-4 mt-4 leading-relaxed text-gray-700">
        The Times' count ended in fall 2025. Five more months of the FAIR
        Plan's own quarterly releases show the line still climbing — the
        program the deal promised to shrink has more than doubled since the
        deal was announced, with no quarter of decline.
      </p>

      {/* ——— Finding 2: growth outran the list ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        2. Growth is now fastest <em>outside</em> the designated areas
      </h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="text-3xl font-bold tabular-nums text-charcoal">
            +{stats.designated.growthPct}%
          </div>
          <div className="mt-1 text-sm text-gray-600">
            FAIR Plan growth <span className="font-semibold">inside</span>{" "}
            CDI-designated distressed ZIPs, FY{DEAL_FY} → FY{FY_LAST} (
            {fmtPolicies(stats.designated.fyDeal)} →{" "}
            {fmtPolicies(stats.designated.fyLast)})
          </div>
        </div>
        <div className="rounded-lg border-2 border-patriot-red bg-red-50 p-5">
          <div className="text-3xl font-bold tabular-nums text-patriot-red">
            +{stats.unlisted.growthPct}%
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Growth <span className="font-semibold">outside</span> the
            designated ZIPs over the same period (
            {fmtPolicies(stats.unlisted.fyDeal)} →{" "}
            {fmtPolicies(stats.unlisted.fyLast)})
          </div>
        </div>
      </div>
      <p className="mb-4 leading-relaxed text-gray-700">
        The 85-percent rule points insurers at the designated distressed areas.
        But since the deal, FAIR Plan enrollment has grown roughly{" "}
        <span className="font-semibold">
          {ratioLabel(stats.unlisted.growthPct, stats.designated.growthPct)} as
          fast in ZIP codes the list doesn't cover
        </span>
        . The crisis has outrun the map that is supposed to target the remedy.
      </p>

      {/* ——— Finding 3: the list fails both ways ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        3. The distressed list fails in both directions
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        The Times showed the list is too <em>broad</em> where breadth helps
        insurers: vast stretches of designated ZIP codes lie outside the
        state's high fire-hazard zones, so policies written there earn credit
        toward the 85-percent promise without touching a high-risk home. Our
        area analysis of CAL FIRE's current hazard maps reproduces that
        finding:{" "}
        <span className="font-semibold">
          {stats.fireDesignated.under10} of {stats.fireDesignated.matched}{" "}
          designated ZIPs have less than 10% of their land in High or Very High
          hazard zones
        </span>{" "}
        ({stats.fireDesignated.underThird} are under one-third).
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        But the list is simultaneously too <em>narrow</em> where narrowness
        hurts homeowners. Reconciling it against the FAIR Plan's own
        distressed-area markers,{" "}
        <span className="font-semibold text-patriot-red">
          {m.fairOnly} ZIP codes are flagged as distressed in the FAIR Plan's
          data but appear nowhere on the state's list
        </span>{" "}
        — against exactly {m.cdiOnly} in the other direction. And{" "}
        {stats.fireMissing.under10} of those {stats.fireMissing.matched}{" "}
        missing ZIPs have less than 10% of their land in high hazard zones: the
        distress the state isn't seeing is largely not in fire country at all.
        It is a market failure, not a fire map.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        A list that is over-inclusive where it relieves insurers and
        under-inclusive where it would protect homeowners is not a neutral
        imperfection — it is the loophole, mapped. See the full{" "}
        <a href="/#distressed" className="underline">
          divergence analysis
        </a>{" "}
        for every missing ZIP.
      </p>

      {/* ——— What would fix it ——— */}
      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What would make the promise real
      </h2>
      <ul className="mb-4 list-disc space-y-2 pl-6 leading-relaxed text-gray-700">
        <li>
          <span className="font-semibold">Measure depopulation itself.</span>{" "}
          AB 69's clearinghouse reporting should publish take-out counts at
          county and ZIP level, net of new FAIR Plan entries — one statewide
          number can show "success" while the Plan keeps growing.
        </li>
        <li>
          <span className="font-semibold">
            Recalibrate the distressed list against enrollment data.
          </span>{" "}
          The state should reconcile its designations against FAIR Plan growth
          on a fixed cadence — the data to do it is already public.
        </li>
        <li>
          <span className="font-semibold">Reopen the data pipeline.</span>{" "}
          Every CDI market dataset that would test the deal's outcomes stops at
          calendar 2023. The 2024 and 2025 editions should be published now.
        </li>
      </ul>

      {/* ——— Methodology ——— */}
      <h2 className="mb-3 mt-10 text-xl font-bold text-charcoal">Methodology</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600">
        <p>
          <span className="font-semibold">Statewide trajectory:</span> FAIR
          Plan quarterly and fiscal-year releases (policies in force),
          September 2019 – {latest ? fmtDate(latest.coverage_end) : "present"}.
          The "deal" point is FY {DEAL_FY} close (Sept. 30, 2023), nine days
          after the September 21, 2023 announcement.
        </p>
        <p>
          <span className="font-semibold">Inside/outside growth:</span> FAIR
          Plan policies in force summed by ZIP over the state's distressed-ZIP
          list, FY{DEAL_FY} → FY{FY_LAST}; ZIPs missing either endpoint are
          excluded.
        </p>
        <p>
          <span className="font-semibold">Fire-hazard overlap:</span> share of
          each ZIP's land area inside CAL FIRE Fire Hazard Severity Zones
          rated High or Very High (combined SRA 2024 / LRA 2025 layer,
          geometry simplified to 50 m). Unlike the Times' analysis, which
          counted homes via FEMA building footprints, ours measures land area —
          a coarser proxy that does not weight where structures sit within a
          ZIP.
        </p>
        <p>
          <span className="font-semibold">Divergence matrix:</span> the FAIR
          Plan's own distressed-area marker from its quarterly ZIP releases,
          reconciled against CDI's official distressed-ZIP list across{" "}
          {(m.bothFlagged + m.neither + m.fairOnly + m.cdiOnly).toLocaleString()}{" "}
          ZIPs. Growth rankings shown elsewhere use a {MIN_GROWTH_BASE}-policy
          FY2021 floor.
        </p>
        <p>
          All inputs are published, cited, and downloadable on{" "}
          <a href="/data" className="underline">Data &amp; Downloads</a>,
          including the{" "}
          <a href="/data/distressed_zip_reconciliation.csv" className="underline" download>
            ZIP reconciliation table
          </a>{" "}
          with per-ZIP fire-hazard shares. The pipeline is open source.
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

function ratioLabel(fast: number, slow: number): string {
  if (slow <= 0) return "far faster";
  const ratio = fast / slow;
  const rounded = Math.round(ratio);
  return Math.abs(ratio - rounded) < 0.25 ? `${rounded}× as fast` : `${ratio.toFixed(1)}× as fast`;
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
