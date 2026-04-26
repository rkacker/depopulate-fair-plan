# depopulatefairplan.com

Static site for [depopulatefairplan.com](https://depopulatefairplan.com).
Built once per data refresh, deployed to GitHub Pages.

## What this is

A single-page information hub on the California FAIR Plan crisis, with
two interactive views:

- **Crisis Map** — California county choropleth of FAIR Plan policies in force.
- **County Table** — sortable, top-10 / all-58 toggle, share of state total.

Plus narrative sections (Mission, Crisis stats, Solutions, email signup).

## Architecture

The site is **decoupled from the pipeline**. It lives in `web/` of the
[depopulate-fair-plan](https://github.com/rkacker/depopulate-fair-plan) repo,
but imports nothing from outside `web/`. The contract is three files in
`public/data/`:

| File | Source | Notes |
|---|---|---|
| `site_stats.json` | pipeline `data/exports/site_stats.json` | Headline copy + every stat on the page |
| `california_county_data.csv` | pipeline `data/exports/california_county_data.csv` | County → policies (58 rows) |
| `california-counties.json` | committed once | CA county TopoJSON (static) |

To extract this site to its own repo someday:
`git filter-repo --subdirectory-filter web`.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 ·
`react-simple-maps` · PapaParse · `lucide-react` · Geist Variable.

## Local dev

```bash
cd web
npm install            # respects .npmrc legacy-peer-deps
npm run dev            # http://localhost:5173
npm run typecheck
npm run build          # writes dist/
npm run preview        # serves dist/ at http://localhost:4173
```

## Refreshing data

After regenerating pipeline outputs (`just build` at the repo root):

```bash
cd web
./scripts/sync-data.sh           # cp ../data/exports/* into public/data/
git add public/data
git commit -m "Data refresh: <quarter>"
git push
```

The deploy workflow runs the sync script in CI as well, so as long as
`data/exports/` is up to date when CI runs, the deploy will pick up
fresh data automatically.

## Deployment to GitHub Pages

1. **Push to `main`.** The workflow at
   `.github/workflows/deploy-web.yml` (in the repo root) is path-filtered
   to `web/**` and `data/exports/**`; pushes that don't touch those paths
   don't deploy.
2. **Enable Pages** in the GitHub repo: *Settings → Pages → Source:
   GitHub Actions*. (One-time setup. The workflow uses `actions/deploy-pages`.)
3. **Custom domain handoff** (the only step left after this):
   - `web/public/CNAME` already contains `depopulatefairplan.com`. It
     ships into `dist/CNAME` on every build, which tells GitHub Pages
     to serve the site under that hostname.
   - Update DNS at the domain registrar:
     - Apex (`depopulatefairplan.com`): four A records pointing to
       GitHub Pages IPs (`185.199.108.153`, `.109.153`, `.110.153`,
       `.111.153`) — see GitHub's docs for current values.
     - Optional `www` subdomain: CNAME to `<github-user>.github.io`.
   - In repo *Settings → Pages*, fill in the custom domain field with
     `depopulatefairplan.com` and enable "Enforce HTTPS" once the cert
     provisions (~10 min after DNS).

Until DNS is flipped, the site will be unreachable at the custom domain.
The fallback `<user>.github.io/<repo>/` URL won't help here because the
site is built with `base: "/"` (custom-domain mode). If you need a
short stretch where both work, set `base` to `/depopulate-fair-plan/`
in `vite.config.ts` and remove the CNAME until DNS is ready.

## Source layout

```
web/
├── public/
│   ├── data/                # site_stats.json + 2 CSVs (the data contract)
│   ├── assets/              # hero.webp + any future imagery
│   ├── CNAME                # depopulatefairplan.com
│   └── favicon.svg
├── src/
│   ├── App.tsx              # composes all sections, loads data once
│   ├── main.tsx             # React 19 entry
│   ├── index.css            # Tailwind v4 @theme tokens
│   ├── types.ts             # SiteStats, CountyRow, CountyData
│   ├── lib/
│   │   ├── data.ts          # CSV/JSON loaders, color tier scale
│   │   └── utils.ts         # cn(), scrollToSection()
│   └── components/
│       ├── sections/        # Header, Hero, CrisisStats, CrisisMap,
│       │                    # CountyTable, Solutions, Signup, Footer
│       └── ui/              # Button, Card primitives
├── scripts/sync-data.sh     # copies pipeline exports into public/data/
├── vite.config.ts           # @tailwindcss/vite, base "/"
├── tsconfig.json            # strict, bundler resolution, @/* paths
├── package.json
└── .npmrc                   # legacy-peer-deps=true (react-simple-maps@3
                             # doesn't yet declare React 19 in peer deps)
```

## Known issues

- **`react-simple-maps@3` peer deps lag React 19** — they declare React
  16/17/18 but work fine at runtime. We pin `legacy-peer-deps=true` in
  `.npmrc` so npm tolerates this. Reassess once `react-simple-maps@4`
  ships stable.
- **`react-simple-maps@3` pulls a vulnerable `d3-color`** — `npm audit`
  flags 5 high-severity ReDoS advisories in transitive d3 deps. The
  attack surface is browser-only and bounded; no library upgrade fixes
  it without a breaking downgrade. Re-audit after the next library
  release.
