import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { PromiseStats } from "@/lib/distressed";
import { FY_LAST } from "@/lib/distressed";
import { fmtPolicies } from "@/lib/historyFormat";

// Static memo page: SB 1301 (Allen) and the data it needs to be auditable.
// Not a letter — a public, linkable summary of the bill and the incremental
// data asks that support depopulating the FAIR Plan. Zero client JS.
const BILL_URL =
  "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB1301";

interface Sb1301MemoProps {
  history: StatewideHistoryRow[];
  stats: PromiseStats;
}

export function Sb1301Memo({ history, stats }: Sb1301MemoProps) {
  const points = history
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));
  const latest = points[points.length - 1] ?? null;
  const { scorecard, criteria } = stats;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-patriot-red">
        Analysis · Legislation
      </p>
      <h1 className="mb-4 text-4xl font-bold leading-tight text-charcoal lg:text-5xl">
        SB 1301: Nonrenewal Protections Need Nonrenewal Data
      </h1>
      <p className="mb-2 text-xl leading-relaxed text-gray-600">
        Senator Allen's bill gives homeowners real protections against being
        dropped by their insurer. Whether those protections work will be hard
        to verify with today's public data: the state's nonrenewal statistics
        end in 2023, and its distressed-area list has not been revised since
        early 2025.
      </p>
      <p className="mb-10 text-sm text-gray-500">
        depopulatefairplan.com · Data through{" "}
        {latest ? fmtDate(latest.coverage_end) : "—"}
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What the bill does
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        <a href={BILL_URL} className="underline" rel="noopener">SB 1301</a>{" "}
        (Allen) requires property insurers to give six months' notice of
        nonrenewal, state the specific reasons, and offer a path to keep
        coverage through repairs and mitigation. It bars dropping a homeowner
        solely for roof age or a prior claim. As of July 2026 it has passed
        the Senate and awaits action in Assembly Appropriations.
      </p>
      <p className="mb-4 leading-relaxed text-gray-700">
        The bill responds to the nonrenewal wave that pushed hundreds of
        thousands of households onto the FAIR Plan — the state's insurer of
        last resort — after the September 2023 regulatory deal with insurers.
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What the data shows
      </h2>
      <div className="mb-4 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
        <p className="text-gray-800">
          <span className="text-2xl font-bold tabular-nums text-patriot-red">
            {scorecard.grew} of {scorecard.total}
          </span>{" "}
          state-designated distressed ZIP codes had <em>more</em> FAIR Plan
          policies in fiscal {FY_LAST} than when the deal was announced.
          Across the named zones, enrollment rose{" "}
          {stats.designated.growthPct}%, from{" "}
          {fmtPolicies(stats.designated.fyDeal)} to{" "}
          {fmtPolicies(stats.designated.fyLast)} policies.
        </p>
      </div>
      <p className="mb-4 leading-relaxed text-gray-700">
        Whether SB 1301's protections work will be a question about
        nonrenewal patterns. The Department of Insurance's count of new,
        renewed, and nonrenewed residential policies was last published for
        calendar <strong>2023</strong>, before the fires and before the wave
        of nonrenewals the bill responds to. The distressed-area list that
        triggers moratoria and protections has also aged: applying the
        state's own qualifying test (10 CCR § 2644.4.8) to current
        enrollment, <strong>{criteria.missedByCriteria} ZIP codes qualify
        today but are missing from the official list</strong>, and{" "}
        {criteria.listedNotQualifying} listed ZIPs no longer meet the
        fire-risk half of the test.
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        The incremental data asks
      </h2>
      <ul className="mb-4 list-disc space-y-3 pl-6 leading-relaxed text-gray-700">
        <li>
          <span className="font-semibold">Codify the nonrenewal series.</span>{" "}
          Require CDI to publish residential new, renewed, and nonrenewed
          counts at state, county, and ZIP level on a fixed schedule
          (quarterly preferred, at least annual), in machine-readable form.
          The series already exists; the most recent public edition covers
          2023.
        </li>
        <li>
          <span className="font-semibold">Reason-code reporting.</span> Once
          insurers must state a reason for each nonrenewal, require aggregated
          reason-code statistics (roof age, prior claim, wildfire model score,
          etc.). Without them, the bill's prohibited-reasons provisions cannot
          be monitored by anyone outside the insurer.
        </li>
        <li>
          <span className="font-semibold">
            Re-run the distressed-area test on a schedule.
          </span>{" "}
          The designation criteria are already in regulation (10 CCR
          § 2644.4.8); require CDI to reapply them to current enrollment on a
          defined cadence and republish the list, so protections attach where
          the distress actually is.
        </li>
      </ul>

      <div className="my-8 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
        <p className="leading-relaxed text-gray-800">
          <span className="font-semibold">
            None of this requires new data collection.
          </span>{" "}
          CDI compiled each of these datasets through 2023 and cites
          near-current figures on its own Sustainable Insurance Strategy
          page. These asks are about schedule, detail, and format: publishing
          what already exists, regularly, in a form the public can use.
        </p>
      </div>

      <p className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-500">
        Every figure on this page is reproducible from the datasets on{" "}
        <a href="/data" className="underline">Data &amp; Downloads</a>.
        Questions, corrections, or data requests:{" "}
        <a href="mailto:info@depopulatefairplan.com" className="underline">
          info@depopulatefairplan.com
        </a>
        .
      </p>
    </article>
  );
}

function fmtDate(iso: string): string {
  const [y, mo] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(mo ?? 1) - 1]} ${y}`;
}
