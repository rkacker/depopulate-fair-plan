import type { StatewideHistoryRow } from "@/lib/loadData.server";
import type { PromiseStats } from "@/lib/distressed";
import { DEAL_FY } from "@/lib/distressed";
import { fmtPolicies } from "@/lib/historyFormat";

// Static memo page: AB 69 + AB 1680 (Calderon) and the reporting details
// that make FAIR Plan oversight work. Framed on measurement/transparency
// common ground — does NOT assume the reader favors depopulation. Zero
// client JS.
const AB69_URL =
  "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB69";
const AB1680_URL =
  "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB1680";

interface Ab69Ab1680MemoProps {
  history: StatewideHistoryRow[];
  stats: PromiseStats;
}

export function Ab69Ab1680Memo({ history, stats }: Ab69Ab1680MemoProps) {
  const points = history
    .filter((r) => r.policy_count !== null)
    .sort((a, b) => a.coverage_end.localeCompare(b.coverage_end));
  const deal = points.find((r) => r.coverage_end === `${DEAL_FY}-09-30`) ?? null;
  const latest = points[points.length - 1] ?? null;
  const { scorecard } = stats;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-patriot-red">
        Analysis · Legislation
      </p>
      <h1 className="mb-4 text-4xl font-bold leading-tight text-charcoal lg:text-5xl">
        AB 69 &amp; AB 1680: FAIR Plan Oversight Needs FAIR Plan Data
      </h1>
      <p className="mb-2 text-xl leading-relaxed text-gray-600">
        Assemblymember Calderon's package strengthens FAIR Plan reporting and
        oversight. With the Plan now larger than it has ever been, a handful
        of reporting details will decide whether the public — and the
        Legislature — can see what the Plan is actually doing.
      </p>
      <p className="mb-10 text-sm text-gray-500">
        depopulatefairplan.com · Data through{" "}
        {latest ? fmtDate(latest.coverage_end) : "—"}
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What the bills do
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        <a href={AB69_URL} className="underline" rel="noopener">AB 69</a>{" "}
        (Calderon) builds out the FAIR Plan clearinghouse — the mechanism for
        moving policyholders back to the private market. It requires clear
        notices to policyholders about their options, broker education, and,
        beginning May 2027, quarterly reporting by participating insurers of
        the policies they issue to FAIR Plan policyholders, with aggregated
        public reporting by the association.{" "}
        <a href={AB1680_URL} className="underline" rel="noopener">AB 1680</a>{" "}
        (the "Make It FAIR Act") strengthens Department of Insurance oversight
        of the FAIR Plan itself: corrective-action authority with penalties,
        examination powers, and staffing requirements. As of late July 2026
        both bills have passed the Assembly and sit in Senate Appropriations,
        with final votes ahead before the session ends. The window for
        amendments is now.
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        What the data shows
      </h2>
      {deal && latest && (
        <div className="mb-4 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
          <p className="text-gray-800">
            <span className="text-2xl font-bold tabular-nums text-patriot-red">
              {fmtPolicies(deal.policy_count)} → {fmtPolicies(latest.policy_count)}
            </span>
            <br />
            FAIR Plan policies in force since the September 2023 insurer
            deal, including growth in {scorecard.grew} of the{" "}
            {scorecard.total} ZIP codes the state designated as distressed —
            where the deal itself promised the opposite. The larger the
            Plan's role becomes, the more its reporting matters.
          </p>
        </div>
      )}
      <p className="mb-4 leading-relaxed text-gray-700">
        Today, the public record consists of insurer commitments and rate
        approvals: policies a carrier <em>plans</em> to write. We could find
        no public dataset that counts households actually moving between the
        FAIR Plan and the private market, in either direction. The reporting
        AB 69 creates is the first real chance to change that. Whether it
        does comes down to the details below.
      </p>

      <h2 className="mb-3 mt-10 text-2xl font-bold text-charcoal">
        The amendments
      </h2>
      <p className="mb-4 leading-relaxed text-gray-700">
        Nearly all of this data already exists inside the FAIR Plan and the
        Department of Insurance. The six amendments below — three per bill —
        make it public, regular, and usable, and are small enough to adopt in
        the time the bills have left.
      </p>
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        AB 69 — three amendments to make the clearinghouse count meaningful
      </p>
      <ul className="mb-6 list-disc space-y-3 pl-6 leading-relaxed text-gray-700">
        <li>
          <span className="font-semibold">County and ZIP detail.</span>{" "}
          Publish the aggregated quarterly clearinghouse report at county and
          ZIP level, matching the FAIR Plan's existing quarterly releases.
          One statewide number cannot show <em>where</em> policyholders are
          finding their way back to the private market and where they aren't.
        </li>
        <li>
          <span className="font-semibold">Count both directions.</span>{" "}
          Report policies leaving the FAIR Plan alongside policies entering
          it in the same period, so the Plan's net direction is visible
          rather than inferred from one-way counts.
        </li>
        <li>
          <span className="font-semibold">
            Start the first quarter after enactment.
          </span>{" "}
          A May 2027 start leaves a two-year measurement blackout in the
          middle of the crisis.
        </li>
      </ul>
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        AB 1680 — three amendments to put data duties inside FAIR Plan
        oversight
      </p>
      <ul className="mb-4 list-disc space-y-3 pl-6 leading-relaxed text-gray-700">
        <li>
          <span className="font-semibold">
            Codify the quarterly geographic releases
          </span>{" "}
          (county and ZIP policy, premium, and insured-value figures) as a
          statutory duty subject to the bill's corrective-action provisions,
          with a single, published distressed-area definition. In 2025, the
          FAIR Plan's own quarterly releases switched between an internal set
          of roughly 1,009 ZIP codes and the official 663-ZIP list, with no
          published definition for either.
        </li>
        <li>
          <span className="font-semibold">Financial-health disclosure.</span>{" "}
          Quarterly reporting of total insured value against reserves and
          reinsurance, plus any assessment activity. These are the numbers
          that determine when every insured Californian helps pay for FAIR
          Plan losses, as happened with the $1 billion assessment after the
          2025 fires.
        </li>
        <li>
          <span className="font-semibold">Cost-of-coverage reporting.</span>{" "}
          Average premium per policy by county. Our analysis of the FAIR
          Plan's own releases found a roughly twelve-fold spread across
          counties, from about $621 to $7,234 per policy per year, a figure
          not available in any official publication.
        </li>
      </ul>

      <div className="my-8 rounded-r-lg border-l-4 border-patriot-red bg-red-50 p-5">
        <p className="leading-relaxed text-gray-800">
          <span className="font-semibold">
            None of this requires new data collection.
          </span>{" "}
          The FAIR Plan already produces quarterly county and ZIP data. AB 69
          already creates the reporting channel. The 2023 Sustainable
          Insurance Strategy already committed the FAIR Plan to expanded
          reporting on reducing its policyholder count. These amendments are
          about detail, completeness, timing, and format — publishing data
          the Plan already holds.
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
