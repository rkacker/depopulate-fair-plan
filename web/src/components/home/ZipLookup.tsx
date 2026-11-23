import { useRef, useState } from "react";
import Papa from "papaparse";
import { loadZipData } from "@/lib/data";
import type { ZipData } from "@/types";

interface ReconRow {
  zip?: string;
  cdi_flag?: string;
  fhsz_high_pct?: string;
  total_policies_2023?: string;
  penetration_pct?: string;
}

interface Loaded {
  zips: ZipData;
  recon: Map<string, ReconRow>;
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

interface ZipLookupProps {
  distressedCounties: string[];
  asOf: string; // e.g. "September 30, 2026"
}

// Hero ZIP lookup. The two ZIP-level CSVs load on first use, not with the page.
export function ZipLookup({ distressedCounties, asOf }: ZipLookupProps) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const data = useRef<Loaded | null>(null);
  const pending = useRef<Promise<void> | null>(null);

  function ensureLoaded(): Promise<void> {
    if (data.current) return Promise.resolve();
    if (!pending.current) {
      pending.current = Promise.all([loadZipData(), loadRecon()])
        .then(([zips, recon]) => {
          data.current = { zips, recon };
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
    <div className="mx-auto max-w-xl">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
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
          className="h-12 w-full shrink-0 rounded-md sm:w-auto sm:flex-1 sm:shrink border-2 border-white/40 bg-white px-4 text-base text-charcoal placeholder:text-gray-500 focus:border-golden-yellow focus:outline-none"
        />
        <button
          type="submit"
          className="h-12 rounded-md bg-patriot-red px-6 text-base font-semibold text-white shadow transition-colors hover:bg-patriot-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden-yellow"
        >
          See your ZIP code
        </button>
      </form>
      <div aria-live="polite" className="mt-4 text-left">
        {status === "loading" && (
          <p className="text-sm text-gray-200">Loading ZIP code data…</p>
        )}
        {status === "error" && (
          <p className="rounded-md bg-white p-4 text-sm text-charcoal">
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
      <p className="rounded-md bg-white p-4 text-sm text-charcoal">
        Enter a five-digit California ZIP code.
      </p>
    );
  }
  const row = loaded?.zips.byZip.get(zip);
  if (!row) {
    return (
      <p className="rounded-md bg-white p-4 text-sm text-charcoal">
        The FAIR Plan's files list no residential policies in {zip} as of{" "}
        {asOf}. That can mean the ZIP code has none, is outside California, or
        is a PO-box ZIP code the Plan folds into a neighbor.
      </p>
    );
  }
  const recon = loaded?.recon.get(zip);
  const share = recon?.penetration_pct ? parseFloat(recon.penetration_pct) : null;
  const fire = recon?.fhsz_high_pct ? parseFloat(recon.fhsz_high_pct) : null;
  const zipListed = recon?.cdi_flag === "1";
  const countyListed = distressedCounties.includes(row.county);
  const yearDelta =
    row.yoyChangePct !== null
      ? `${row.yoyChangePct > 0 ? "+" : row.yoyChangePct < 0 ? "−" : ""}${Math.abs(row.yoyChangePct).toFixed(1)}%`
      : null;

  return (
    <div className="rounded-md bg-white p-5 text-charcoal shadow-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {zip} · {row.city ? `${row.city}, ` : ""}
        {row.county} County
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <dt className="text-xs text-gray-500">FAIR Plan policies</dt>
          <dd className="text-2xl font-bold tabular-nums">
            {row.policies.toLocaleString("en-US")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Change in one year</dt>
          <dd className="text-2xl font-bold tabular-nums">{yearDelta ?? "n/a"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">
            Share of insured homes on the Plan
          </dt>
          <dd className="text-2xl font-bold tabular-nums">
            {share !== null && !Number.isNaN(share) ? `${share.toFixed(1)}%` : "n/a"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">
            Land in high fire-hazard zones
          </dt>
          <dd className="text-2xl font-bold tabular-nums">
            {fire !== null && !Number.isNaN(fire) ? `${fire.toFixed(0)}%` : "n/a"}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-gray-700">
        {zipListed || countyListed ? (
          <>
            This {zipListed ? "ZIP code" : "county"} is on the Department of
            Insurance's list of distressed areas, where insurers that use the
            new pricing rules have committed to write more policies.
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
        Policies as of {asOf}, from the FAIR Plan's ZIP-level files. Share is
        current FAIR Plan policies divided by all residential policies in
        2023, the latest year the state has published. Fire-hazard share is
        land area in CAL FIRE High or Very High zones.{" "}
        <a href="/data?tab=zip_history" className="underline">
          Five-year history for every ZIP code
        </a>
        .
      </p>
    </div>
  );
}
