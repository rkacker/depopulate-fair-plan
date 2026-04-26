# Depopulate the FAIR Plan — website

Static React site, deployed to GitHub Pages from `web/dist/`. Independent of the
pipeline at the code level — it consumes only the two files in `public/data/`
that the pipeline produces.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · `@base-ui/react` ·
`react-simple-maps` · PapaParse · Geist Variable.

## Local dev

```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run build        # produces dist/
npm run preview      # serves dist/ locally
```

## Data refresh

The site reads three files from `public/data/`:

| File | Source | Notes |
|---|---|---|
| `site_stats.json` | pipeline `data/exports/site_stats.json` | All headline copy + stats |
| `california_county_data.csv` | pipeline `data/exports/california_county_data.csv` | County → policies (58 rows) |
| `california-counties.json` | committed once, never changes | CA county TopoJSON |

After regenerating pipeline outputs (`just build` at repo root):

```bash
cd web && ./scripts/sync-data.sh
git add public/data && git commit -m "Data refresh: <quarter>"
git push
```

GitHub Action `.github/workflows/deploy-web.yml` rebuilds and redeploys.

## Architecture

- `src/App.tsx` — composes all sections, loads data once, passes down.
- `src/components/sections/` — Header, Hero, CrisisStats, CrisisMap,
  CountyTable, Solutions, Signup, Footer.
- `src/components/ui/` — shadcn-style primitives on `@base-ui/react`.
- `src/lib/data.ts` — PapaParse loader, JSON fetch, color scale.
- `src/types.ts` — `SiteStats`, `CountyRow`, `CountyData`.

The website never imports anything from outside `web/`.
