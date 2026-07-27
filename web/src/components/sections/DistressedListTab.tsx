import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Papa from "papaparse";

// CDI's official list of distressed counties and undermarketed ZIP codes —
// the geographies that trigger insurers' writing commitments under the
// Sustainable Insurance Strategy. Shown verbatim from the March 2025 revision.
const DOWNLOAD_HREF = "/data/cdi_distressed_list.csv";
const CDI_LIST_URL =
  "https://www.insurance.ca.gov/01-consumers/180-climate-change/upload/catastrophe-modeling-and-ratemaking-insurer-commitments-to-increase-writing-of-policies-in-high-risk-wildfire-areas-list-of-distressed-counties-and-undermarketed-zip-codes-residential-property-insurance-commitments.pdf";

interface RawListRow {
  effective_date?: string;
  geo_type?: string;
  geo_id?: string;
}

interface RawReconRow {
  zip?: string;
  fair_plan_flag?: string;
}

// null = the ZIP doesn't appear in the FAIR Plan's quarterly reporting.
interface ListedZip {
  zip: string;
  fairFlag: boolean | null;
}

const DEFAULT_LIMIT = 60;
const RECON_HREF = "/data/distressed_zip_reconciliation.csv";

function parseCsvUrl<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

export function DistressedListTab() {
  const [counties, setCounties] = useState<string[] | null>(null);
  const [zips, setZips] = useState<ListedZip[] | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      parseCsvUrl<RawListRow>(DOWNLOAD_HREF),
      parseCsvUrl<RawReconRow>(RECON_HREF),
    ])
      .then(([listRows, reconRows]) => {
        if (cancelled) return;
        const fairFlagByZip = new Map<string, boolean>();
        for (const r of reconRows) {
          if (r.zip) fairFlagByZip.set(r.zip, r.fair_plan_flag === "1");
        }
        const c: string[] = [];
        const z: ListedZip[] = [];
        for (const r of listRows) {
          if (!r.geo_id) continue;
          if (r.geo_type === "county") c.push(r.geo_id);
          else if (r.geo_type === "zip") {
            z.push({ zip: r.geo_id, fairFlag: fairFlagByZip.get(r.geo_id) ?? null });
          }
          if (r.effective_date) setEffectiveDate(r.effective_date);
        }
        setCounties(c.sort());
        setZips(z.sort((a, b) => a.zip.localeCompare(b.zip)));
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const flagCounts = useMemo(() => {
    if (!zips) return { flagged: 0, unflagged: 0, notReported: 0 };
    return {
      flagged: zips.filter((z) => z.fairFlag === true).length,
      unflagged: zips.filter((z) => z.fairFlag === false).length,
      notReported: zips.filter((z) => z.fairFlag === null).length,
    };
  }, [zips]);

  const filteredZips = useMemo(() => {
    if (!zips) return [];
    const q = query.trim();
    return q ? zips.filter((z) => z.zip.startsWith(q)) : zips;
  }, [zips, query]);

  const displayedZips = showAll ? filteredZips : filteredZips.slice(0, DEFAULT_LIMIT);

  if (error) {
    return (
      <p className="py-12 text-center text-gray-500">
        Could not load the distressed list. Please try again later.
      </p>
    );
  }
  if (!counties || !zips) {
    return <p className="py-12 text-center text-gray-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm leading-relaxed text-gray-600">
            The Department of Insurance's official list of distressed counties
            and undermarketed ZIP codes, from{" "}
            <a href={CDI_LIST_URL} className="underline" rel="noopener">
              "Catastrophe Modeling and Ratemaking: Insurer Commitments to
              Increase Writing of Policies in High Risk Wildfire Areas"
            </a>
            . These are the geographies where insurers' writing commitments
            under the Sustainable Insurance Strategy apply. Shown verbatim
            from the {effectiveDate ? fmtDate(effectiveDate) : "March 2025"}{" "}
            revision, the most recent published.
          </p>
        </div>
        <a
          href={DOWNLOAD_HREF}
          download
          className="inline-flex items-center gap-2 self-start rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm transition-colors hover:border-patriot-red hover:text-patriot-red"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </a>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-3xl font-bold tabular-nums text-charcoal">
            {counties.length}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            counties designated distressed in their entirety
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold tabular-nums text-charcoal">
            {zips.length}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            undermarketed ZIP codes
          </div>
        </Card>
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Distressed counties
      </h3>
      <div className="mb-6 flex flex-wrap gap-2">
        {counties.map((c) => (
          <span
            key={c}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
          >
            {c}
          </span>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Undermarketed ZIP codes
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-gray-600">
        Dots show how each listed ZIP appears in the FAIR Plan's most recent
        quarterly release:{" "}
        <span className="whitespace-nowrap">
          <Dot flag={true} /> also marked distressed there ({flagCounts.flagged})
        </span>
        ,{" "}
        <span className="whitespace-nowrap">
          <Dot flag={false} /> not marked ({flagCounts.unflagged})
        </span>
        ,{" "}
        <span className="whitespace-nowrap">
          <Dot flag={null} /> no FAIR Plan policies reported (
          {flagCounts.notReported})
        </span>
        .
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowAll(false);
        }}
        placeholder="Search ZIP codes…"
        aria-label="Search ZIP codes"
        className="mb-3 w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-patriot-red focus:outline-none"
      />
      <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-sm tabular-nums text-gray-700 sm:grid-cols-6 lg:grid-cols-8">
        {displayedZips.map((z) => (
          <span
            key={z.zip}
            className={z.fairFlag === null ? "text-gray-400" : undefined}
          >
            <Dot flag={z.fairFlag} /> {z.zip}
          </span>
        ))}
      </div>
      {filteredZips.length === 0 && (
        <p className="py-6 text-sm text-gray-500">
          No ZIP codes match "{query}".
        </p>
      )}
      {filteredZips.length > DEFAULT_LIMIT && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => setShowAll((s) => !s)}>
            {showAll
              ? `Show first ${DEFAULT_LIMIT}`
              : `Show all ${filteredZips.length.toLocaleString()} ZIP codes`}
          </Button>
        </div>
      )}
    </div>
  );
}

function Dot({ flag }: { flag: boolean | null }) {
  const cls =
    flag === true
      ? "bg-patriot-red"
      : flag === false
        ? "border border-gray-400 bg-transparent"
        : "bg-gray-300";
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full align-middle ${cls}`}
    />
  );
}

function fmtDate(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[(mo ?? 1) - 1]} ${d}, ${y}`;
}
