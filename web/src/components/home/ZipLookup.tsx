import { useRef, useState } from "react";
import Papa from "papaparse";
import { loadZipData, loadZipHistory } from "@/lib/data";
import { Sparkline } from "@/components/Sparkline";
import type { ZipData, ZipHistoryRow } from "@/types";

interface ReconRow {
  zip?: string;
  cdi_flag?: string;
  fhsz_high_pct?: string;
  total_policies_2023?: string;
  penetration_pct?: string;
  meets_criteria?: string;
}

interface Loaded {
  zips: ZipData;
  recon: Map<string, ReconRow>;
  history: Map<string, ZipHistoryRow>;
}

function loadRecon(): Promise<Map<string, ReconRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<ReconRow>("/data/distressed_zip_reconciliation.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const m = new Map<string, ReconRow>();
        for (const r of res.data) if (r.zip) m.set(r.zip, r);
        resolve(m);
      },
      error: (err) => reject(err),
    });
  });
}

type Status = "idle" | "loading" | "ready" | "error";
const YEARS = [2021, 2022, 2023, 2024, 2025, 2026] as const;

interface ZipLookupProps {
  distressedCounties: string[];
  asOf: string; // e.g. "September 30, 2026"
}

function pct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "n/a";
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
}

// ZIP lookup above the county map. The three ZIP-level CSVs load on first
// use, not with the page.
export function ZipLookup({ distressedCounties, asOf }: ZipLookupProps) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const data = useRef<Loaded | null>(null);
  const pending = useRef<Promise<void> | null>(null);

  function ensureLoaded(): Promise<void> {
    if (data.current) return Promise.resolve();
    if (!pending.current) {
      pending.current = Promise.all([loadZipData(), loadRecon(), loadZipHistory()])
        .then(([zips, recon, hist]) => {
          data.current = {
            zips,
            recon,
            history: new Map(hist.map((h) => [h.zip, h])),
          };
        })
        .catch((err) => {
          pending.current = null;
          throw err;
        });
    }
    return pending.current;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const zip = value.trim();
    if (!/^\d{5}$/.test(zip)) {
      setQuery(zip);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      await ensureLoaded();
      setQuery(zip);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="where" className="bg-gray-50 pb-4 pt-20 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-charcoal lg:text-4xl">
          Where the FAIR Plan is concentrated
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-gray-600">
          Enter a ZIP code to see what is happening where you live, or explore
          the county map below.
        </p>
        <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
          <label htmlFor="zip-lookup" className="sr-only">
            Your ZIP code
          </label>
          <input
            id="zip-lookup"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="Enter your ZIP code"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            onFocus={() => void ensureLoaded().catch(() => undefined)}
            className="h-12 w-full shrink-0 rounded-md border-2 border-gray-300 bg-white px-4 text-base text-charcoal placeholder:text-gray-500 focus:border-patriot-red focus:outline-none sm:w-auto sm:flex-1 sm:shrink"
          />
          <button
            type="submit"
            className="h-12 rounded-md bg-patriot-red px-6 text-base font-semibold text-white shadow transition-colors hover:bg-patriot-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-patriot-red/50 focus-visible:ring-offset-2"
          >
            See your ZIP code
          </button>
        </form>
        <div aria-live="polite" className="mt-6">
          {status === "loading" && (
            <p className="text-center text-sm text-gray-600">Loading ZIP code data…</p>
          )}
          {status === "error" && (
            <p className="rounded-md bg-white p-4 text-sm text-charcoal shadow">
              The ZIP code data did not load. The full table is on{" "}
              <a href="/data?tab=zip_history" className="font-semibold underline">
                Data &amp; Downloads
              </a>
              .
            </p>
          )}
          {status === "ready" && query !== null && (
            <ZipResult
              zip={query}
              loaded={data.current}
              distressedCounties={distressedCounties}
              asOf={asOf}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function ZipResult({
  zip,
  loaded,
  distressedCounties,
  asOf,
}: {
  zip: string;
  loaded: Loaded | null;
  distressedCounties: string[];
  asOf: string;
}) {
  if (!/^\d{5}$/.test(zip)) {
    return (
      <p className="rounded-md bg-white p-4 text-sm text-charcoal shadow">
        Enter a five-digit California ZIP code.
      </p>
    );
  }
  const row = loaded?.zips.byZip.get(zip);
  if (!row) {
    return (
      <p className="rounded-md bg-white p-4 text-sm text-charcoal shadow">
        The FAIR Plan's files list no residential policies in {zip} as of{" "}
        {asOf}. That can mean the ZIP code has none, is outside California, or
        is a PO-box ZIP code the Plan folds into a neighbor.
      </p>
    );
  }
  const recon = loaded?.recon.get(zip);
  const hist = loaded?.history.get(zip);
  const share = recon?.penetration_pct ? parseFloat(recon.penetration_pct) : null;
  const fire = recon?.fhsz_high_pct ? parseFloat(recon.fhsz_high_pct) : null;
  const zipListed = recon?.cdi_flag === "1";
  const countyListed = distressedCounties.includes(row.county);
  const listed = zipListed || countyListed;
  const meetsFireTest = recon?.meets_criteria === "1";
  const fy2023 = hist?.fy[2023] ?? null;
  const fy2026 = hist?.fy[2026] ?? null;
  const sinceDeal =
    fy2023 && fy2026 !== null && fy2023 >= 50 ? ((fy2026 - fy2023) / fy2023) * 100 : null;
  const hasHistory = hist && hist.series.length >= 2;

  return (
    <div className="rounded-xl bg-white p-6 text-charcoal shadow-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {zip} · {row.city ? `${row.city}, ` : ""}
        {row.county} County
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Stat label="FAIR Plan policies" value={row.policies.toLocaleString("en-US")} />
        <Stat label="Change in one year" value={pct(row.yoyChangePct)} />
        <Stat label="Since the 2023 deal" value={pct(sinceDeal)} />
        <Stat
          label="Share of insured homes on the Plan"
          value={share !== null && !Number.isNaN(share) ? `${share.toFixed(1)}%` : "n/a"}
        />
        <Stat
          label="Land in high fire-hazard zones"
          value={fire !== null && !Number.isNaN(fire) ? `${fire.toFixed(0)}%` : "n/a"}
        />
        <Stat label="On the state's distressed list" value={listed ? "Yes" : "No"} />
      </dl>

      {hasHistory && hist && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-charcoal">
              FAIR Plan policies by fiscal year
            </p>
            <Sparkline values={hist.series} width={120} height={28} />
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-gray-500">
                  {YEARS.map((y) => (
                    <th key={y} scope="col" className="py-1 pr-3 font-normal">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {YEARS.map((y) => (
                    <td key={y} className="py-1 pr-3 font-semibold">
                      {hist.fy[y] !== null ? hist.fy[y]!.toLocaleString("en-US") : "n/a"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-5 text-sm text-gray-700">
        {listed ? (
          <>
            This {zipListed ? "ZIP code" : "county"} is on the Department of
            Insurance's list of distressed areas, where insurers that use the
            new pricing rules have committed to write more policies.
          </>
        ) : meetsFireTest ? (
          <>
            This ZIP code is not on the Department of Insurance's list of
            distressed areas, so insurers' commitments to write more policies
            do not apply here. By our calculation it meets the fire-risk half
            of the state's own qualifying test.
          </>
        ) : (
          <>
            This ZIP code is not on the Department of Insurance's list of
            distressed areas, so insurers' commitments to write more policies
            do not apply here.
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-gray-500">
        Policies as of {asOf}, from the FAIR Plan's ZIP-level files. Fiscal
        years end September 30. "Since the 2023 deal" compares fiscal 2023
        with fiscal 2026 and is left blank for ZIP codes with fewer than 50
        policies in 2023. Share is current FAIR Plan policies divided by all
        residential policies in 2023, the latest year the state has
        published. Fire-hazard share is land area in CAL FIRE High or Very
        High zones.{" "}
        <a href="/data?tab=zip_history" className="underline">
          Every ZIP code
        </a>{" "}
        ·{" "}
        <a href="/data?tab=distressed_list" className="underline">
          The state's list
        </a>
      </p>
    </div>
  );
}
