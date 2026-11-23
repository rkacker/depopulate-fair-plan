import { useRef, useState } from "react";
import Papa from "papaparse";
import { loadZipData, loadZipHistory } from "@/lib/data";
import { Sparkline } from "@/components/Sparkline";
import {
  buildZipSnapshot,
  ZIP_YEARS,
  type ZipReconRow,
  type ZipSnapshot,
} from "@/lib/zipSnapshot";
import type { ZipData, ZipHistoryRow } from "@/types";

interface Loaded {
  zips: ZipData;
  recon: Map<string, ZipReconRow>;
  history: Map<string, ZipHistoryRow>;
}

function loadRecon(): Promise<Map<string, ZipReconRow>> {
  return new Promise((resolve, reject) => {
    Papa.parse<ZipReconRow>("/data/distressed_zip_reconciliation.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const m = new Map<string, ZipReconRow>();
        for (const r of res.data) if (r.zip) m.set(r.zip, r);
        resolve(m);
      },
      error: (err) => reject(err),
    });
  });
}

type View =
  | { kind: "snapshot"; snap: ZipSnapshot; isDefault: boolean }
  | { kind: "invalid" }
  | { kind: "missing"; zip: string }
  | { kind: "error" };

interface ZipLookupProps {
  initial: ZipSnapshot; // the default ZIP, computed at build time
  distressedCounties: string[];
  asOf: string; // e.g. "September 30, 2026"
}

function pct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "n/a";
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(n >= 100 || n <= -100 ? 0 : 1)}%`;
}

// The ZIP panel. It renders the default ZIP from build-time data, so it is
// populated before any JavaScript runs. The three ZIP-level CSVs load only
// when someone looks up their own.
export function ZipLookup({ initial, distressedCounties, asOf }: ZipLookupProps) {
  const [value, setValue] = useState("");
  const [view, setView] = useState<View>({ kind: "snapshot", snap: initial, isDefault: true });
  const [loading, setLoading] = useState(false);
  const data = useRef<Loaded | null>(null);
  const pending = useRef<Promise<void> | null>(null);

  function ensureLoaded(): Promise<void> {
    if (data.current) return Promise.resolve();
    if (!pending.current) {
      pending.current = Promise.all([loadZipData(), loadRecon(), loadZipHistory()])
        .then(([zips, recon, hist]) => {
          data.current = { zips, recon, history: new Map(hist.map((h) => [h.zip, h])) };
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
      setView({ kind: "invalid" });
      return;
    }
    setLoading(true);
    try {
      await ensureLoaded();
      const d = data.current!;
      const row = d.zips.byZip.get(zip);
      setView(
        row
          ? {
              kind: "snapshot",
              isDefault: false,
              snap: buildZipSnapshot(row, d.recon.get(zip), d.history.get(zip), distressedCounties),
            }
          : { kind: "missing", zip },
      );
    } catch {
      setView({ kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="zip" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-charcoal lg:text-4xl">
          Your ZIP code
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-center text-lg text-gray-600">
          County totals hide large differences inside each county. Look up
          any California ZIP code.
        </p>
        <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
          <label htmlFor="zip-lookup" className="sr-only">
            ZIP code
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
            {loading ? "Loading…" : "Look up"}
          </button>
        </form>

        <div aria-live="polite" className="mt-8">
          {view.kind === "invalid" && (
            <Notice>Enter a five-digit California ZIP code.</Notice>
          )}
          {view.kind === "missing" && (
            <Notice>
              The FAIR Plan's files list no residential policies in {view.zip}{" "}
              as of {asOf}. That can mean the ZIP code has none, is outside
              California, or is a PO-box ZIP code the Plan folds into a
              neighbor.
            </Notice>
          )}
          {view.kind === "error" && (
            <Notice>
              The ZIP code data did not load. The full table is on{" "}
              <a href="/data?tab=zip_history" className="font-semibold underline">
                Data &amp; Downloads
              </a>
              .
            </Notice>
          )}
          {view.kind === "snapshot" && (
            <ZipCard snap={view.snap} isDefault={view.isDefault} asOf={asOf} />
          )}
        </div>
      </div>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-charcoal">
      {children}
    </p>
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

function ZipCard({ snap, isDefault, asOf }: { snap: ZipSnapshot; isDefault: boolean; asOf: string }) {
  const listed = snap.zipListed || snap.countyListed;
  const series = snap.fy.filter((v): v is number => v !== null);
  const fy2023 = snap.fy[ZIP_YEARS.indexOf(2023)];
  const fy2026 = snap.fy[ZIP_YEARS.indexOf(2026)];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-charcoal shadow-lg">
      {isDefault && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-gray-700">
          <span className="font-semibold text-patriot-red">Shown as an example.</span>{" "}
          Of every ZIP code outside the state's distressed list, this one
          added the most FAIR Plan policies since 2023
          {fy2023 !== null && fy2026 !== null && (
            <>
              : from {fy2023.toLocaleString("en-US")} to{" "}
              {fy2026.toLocaleString("en-US")}
            </>
          )}
          .
        </p>
      )}
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {snap.zip} · {snap.city ? `${snap.city}, ` : ""}
        {snap.county} County
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Stat label="FAIR Plan policies" value={snap.policies.toLocaleString("en-US")} />
        <Stat label="Change in one year" value={pct(snap.yoyChangePct)} />
        <Stat label="Change since 2023" value={pct(snap.sinceDealPct)} />
        <Stat
          label="Share of insured homes on the Plan"
          value={snap.sharePct !== null ? `${snap.sharePct.toFixed(1)}%` : "n/a"}
        />
        <Stat
          label="Land in high fire-hazard zones"
          value={snap.firePct !== null ? `${snap.firePct.toFixed(0)}%` : "n/a"}
        />
        <Stat label="On the state's distressed list" value={listed ? "Yes" : "No"} />
      </dl>

      {series.length >= 2 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-charcoal">
              FAIR Plan policies by fiscal year
            </p>
            <Sparkline values={series} width={120} height={28} />
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead>
                <tr className="text-xs text-gray-500">
                  {ZIP_YEARS.map((y) => (
                    <th key={y} scope="col" className="py-1 pr-3 font-normal">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {snap.fy.map((v, i) => (
                    <td key={ZIP_YEARS[i]} className="py-1 pr-3 font-semibold">
                      {v !== null ? v.toLocaleString("en-US") : "n/a"}
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
            This {snap.zipListed ? "ZIP code" : "county"} is on the Department
            of Insurance's list of distressed areas, where insurers that use
            the new pricing rules have committed to write more policies.
          </>
        ) : (
          <>
            This ZIP code is not on the Department of Insurance's list of
            distressed areas, so insurers' commitments to write more policies
            do not apply here.
            {snap.meetsFireTest &&
              " By our calculation it meets the fire-risk half of the state's own qualifying test."}
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-gray-500">
        Policies as of {asOf}, from the FAIR Plan's ZIP-level files. Fiscal
        years end September 30. "Change since 2023" compares fiscal 2023 with
        fiscal 2026 and is left blank for ZIP codes with fewer than 50
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
