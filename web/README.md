# depopulatefairplan.com

Static site for [depopulatefairplan.com](https://depopulatefairplan.com).
Built per data refresh, deployed to GitHub Pages.

## What this is

An information hub on the California FAIR Plan crisis. The home page (`/`) carries the
narrative + the interactive county map and table; `/data` exposes the underlying datasets
(statewide history, ZIP history, FAIR market share) as tables and downloads. A single-page
consolidation of these is planned — see [`../docs/redesign-brief.md`](../docs/redesign-brief.md)
and [`../BACKLOG.md`](../BACKLOG.md).

## Architecture

The site is **decoupled from the pipeline**. It lives in `web/` of the
[depopulate-fair-plan](https://github.com/rkacker/depopulate-fair-plan) repo but imports
nothing from outside `web/`. The contract is the files in `public/data/`.

Astro pages hydrate React islands. County-level data and stats are **loaded at build time**
(`src/lib/loadData.server.ts` reads the CSV/JSON via Vite `?raw` imports and bakes the parsed
data into the HTML, so first paint has real data and no loading skeleton). Large datasets
(ZIP-level, ~1,700 rows) **lazy-load on the client** via `src/lib/data.ts` on intent.

| File in `public/data/` | Source | Notes |
|---|---|---|
| `california-counties.json` | committed once | CA county TopoJSON (static) |
| `california-zips.json` | committed once | CA ZIP TopoJSON (static) |
| `site_stats.json` | pipeline export | Headline copy + every stat on the page |
| `quarterly_totals.json` | pipeline export | Statewide quarterly totals |
| `california_county_data.csv` | pipeline export | County → policies + quarter/YoY deltas |
| `california_zip_data.csv` | pipeline export | ZIP → policies + deltas |
| `california_zip_history.csv` | pipeline export | ZIP FY history (FY21–FY25) |
| `cdi_county_market_share.csv` | pipeline export | Total PIF vs FAIR PIF + share, 2020–2023 |
| `fair_statewide_history.csv` | pipeline export | Statewide policy / exposure / premium trajectory |

To extract this site to its own repo someday: `git filter-repo --subdirectory-filter web`.

## Stack

Astro 6 + React 19 islands · TypeScript · Tailwind CSS v4 ·
`react-simple-maps` · PapaParse · `lucide-react` · Geist Variable.

## Local dev

```bash
cd web
npm install            # respects .npmrc legacy-peer-deps
npm run dev            # http://localhost:4321
npm run typecheck      # astro check (also type-checks .astro frontmatter)
npm run build          # writes dist/
npm run preview        # serves dist/
```

## Refreshing data

After regenerating pipeline outputs (`just build` at the repo root):

```bash
cd web
./scripts/sync-data.sh           # cp ../data/exports/<contract files> into public/data/
git add public/data
git commit -m "Data refresh: <quarter>"
git push
```

The deploy workflow also runs `sync-data.sh` in CI (after re-running the pipeline), so a
push to `main` picks up fresh data automatically.

## Deployment to GitHub Pages

Every push to `main` triggers the workflow at `.github/workflows/deploy-web.yml` (repo
root), which runs the **full chain**: Python pipeline → `sync-data.sh` → `astro build` →
upload `web/dist` → deploy to Pages. There is **no path filter** — any push to `main`
rebuilds and redeploys.

One-time setup:

1. **Enable Pages:** *Settings → Pages → Source: GitHub Actions*.
2. **Custom domain:** `public/CNAME` contains `depopulatefairplan.com` and ships into
   `dist/CNAME` on every build. Point DNS at the registrar:
   - Apex (`depopulatefairplan.com`): four A records to GitHub Pages IPs
     (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153` — confirm current values in
     GitHub's docs).
   - Optional `www`: CNAME to `<github-user>.github.io`.
3. In *Settings → Pages*, set the custom domain to `depopulatefairplan.com` and enable
   "Enforce HTTPS" once the cert provisions (~10 min after DNS).

`astro.config.mjs` sets `site: "https://depopulatefairplan.com"` with no `base`, so the
build uses root-absolute asset paths and is served at the **custom domain root**. (It is not
configured to serve under the `rkacker.github.io/depopulate-fair-plan/` project path; with
the custom domain set, Pages serves/redirects to `depopulatefairplan.com`.)

## Source layout

```
web/
├── public/
│   ├── data/                # the data contract (see table above)
│   ├── assets/              # hero imagery
│   ├── CNAME                # depopulatefairplan.com
│   └── favicon.svg
├── src/
│   ├── pages/               # index.astro (home), data.astro (data page)
│   ├── layouts/             # Base.astro (shared shell, <head>, scripts)
│   ├── components/
│   │   ├── Home.tsx         # composes the home-page island
│   │   ├── sections/        # Hero, CrisisStats, CrisisMap, CountyTable,
│   │   │                    # ZipMap, ZipTable, DataPage + tab components
│   │   └── ui/              # Button, Card primitives
│   ├── lib/
│   │   ├── data.ts          # client-side CSV/JSON loaders, color tier scales
│   │   ├── loadData.server.ts # build-time loaders (?raw imports, run in Astro frontmatter)
│   │   └── utils.ts         # cn(), scrollToSection()
│   └── types.ts             # SiteStats, CountyData/Row, ZipData/Row, history row types
├── scripts/sync-data.sh     # copies pipeline exports into public/data/
├── astro.config.mjs         # @astrojs/react, site, @/* alias
├── tsconfig.json
├── package.json
└── .npmrc                   # legacy-peer-deps=true (react-simple-maps@3 peer-dep lag)
```

## Known issues

- **`react-simple-maps@3` peer deps lag React 19** — they declare React 16/17/18 but work
  fine at runtime. We pin `legacy-peer-deps=true` in `.npmrc` so npm tolerates this.
  Reassess once `react-simple-maps@4` ships stable.
- **`react-simple-maps@3` pulls a vulnerable `d3-color`** — `npm audit` flags high-severity
  ReDoS advisories in transitive d3 deps. The attack surface is browser-only and bounded; no
  library upgrade fixes it without a breaking downgrade. Re-audit after the next release.
