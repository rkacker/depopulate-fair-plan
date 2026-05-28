# CA FAIR Plan Residential Data Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Data pipeline that collects, normalizes, and publishes California FAIR Plan residential
property insurance market data. Powers [depopulatefairplan.com](https://depopulatefairplan.com).

- **The crisis, visualized →** [depopulatefairplan.com](https://depopulatefairplan.com)
- **Browse the data →** [GitHub Pages site](https://rkacker.github.io/depopulate-fair-plan/)

## What this is

This repo is the **data layer** behind depopulatefairplan.com. It downloads public PDF
reports from the [California FAIR Plan](https://www.cfpnet.com/key-statistics-data/) and the
[California Department of Insurance](https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm)
— published on different calendars, in inconsistent formats, with long reporting lags —
parses the tables, normalizes them into a consistent data model, and produces CSV/JSON
exports for public analysis and the website. The FAIR Plan, California's insurer of last
resort, has roughly tripled its residential book in five years; **the website tells that
story with current figures, so this README stays focused on the pipeline.**

## Start here (returning contributors)

- **What to work on next →** [`BACKLOG.md`](BACKLOG.md) — ranked, with a session ritual
- **How the code works / conventions →** [`CLAUDE.md`](CLAUDE.md)
- **The website (Astro app) →** [`web/README.md`](web/README.md)
- **Planned single-page redesign →** [`docs/redesign-brief.md`](docs/redesign-brief.md)

## Quickstart

```bash
brew install python@3.11 uv just   # prerequisites (Homebrew)
just setup                         # create venv, install dependencies
just build                         # Normalize + Export
just test                          # run test suite (no network needed)
```

| Stage | Command | What it does |
|---|---|---|
| 1. Fetch | `fairplan fetch` | Downloads source PDFs from cfpnet.com and insurance.ca.gov |
| 2. Normalize | `fairplan normalize` | Parses PDFs into structured CSVs in `data/processed/` |
| 3. Export | `fairplan exports` | Builds website JSON/CSV from processed data |

`just build` runs Normalize + Export; Fetch is separate because it needs network and the
`sources/` PDFs are committed. The CLI also has an `insights` subcommand that emits a
Markdown market report to `insights/` — run manually, not part of `just build`. Conventions
for running the CLI directly (`PYTHONPATH=src`, `uv`, Python 3.11) are in [`CLAUDE.md`](CLAUDE.md).

## Data Sources

- **FAIR Plan** — quarterly policy counts, premiums, exposures, and 5-year PIF history by
  county and ZIP code (fiscal year ending September 30)
- **CDI** — California Department of Insurance annual county-level market analysis and
  statewide residential fact sheet (calendar year, typically 12–18 month reporting lag)
- **CDI Distressed Geographies** — official list of distressed counties and undermarketed ZIPs

### Reporting Calendars

| Source | Reporting Period | Typical Publication Lag |
|--------|-----------------|------------------------|
| FAIR Plan | Fiscal year (Oct 1 – Sep 30) | 2–3 months after quarter end |
| CDI Annual Data | Calendar year (Jan 1 – Dec 31) | 12–18 months |
| CDI Distressed List | Point-in-time | Updated periodically |

## Outputs

### Normalized tables (`data/processed/`)

| File | What it contains |
|---|---|
| `fair/category_breakdown.csv` | **Canonical residential source.** Quarterly ZIP × county × risk-band × policy-category breakdown for count / premium / exposure |
| `fair/quarterly_totals.csv` | Statewide totals per (coverage_end, metric) — aggregates `category_breakdown.csv` |
| `fair/county_quarterly.csv` | Per-county totals per coverage_end × metric — aggregates `category_breakdown.csv` |
| `fair/county_pif_history.csv` | Residential county FY history, rolled up from the DWE ZIP file via the ZIP→county map in the category PDFs |
| `fair/zip_pif_history.csv` | Residential ZIP-level FY21–FY25 history (FAIR Plan DWE file, parsed directly) |
| `fair/county_rankings.csv` | Counties ranked by latest-quarter policy count |
| `cdi/county_yearly.csv` | CDI county-level market segments (voluntary, FAIR, DIC) by year |
| `cdi/statewide_yearly.csv` | CDI statewide residential market totals by year |
| `cdi/distressed_counties.csv` | CDI-designated distressed counties |
| `cdi/distressed_zips.csv` | CDI-designated distressed ZIP codes |
| `analysis/distressed_county_pif.csv` | County FY history with distressed status |
| `analysis/distressed_zip_pif.csv` | ZIP FY history with distressed status |
| `analysis/distressed_zip_reconciliation.csv` | Per-ZIP comparison of FAIR Plan inline distressed flag vs CDI list |
| `source_releases.csv` | Metadata and hashes for all source documents |

### Website exports (`data/exports/`)

The authoritative list is [`config/export_contract.json`](config/export_contract.json).
`web/scripts/sync-data.sh` copies the subset the site consumes into `web/public/data/`.

| File | Purpose |
|---|---|
| `site_stats.json` | Headline metrics, map labels, and card content for the website |
| `quarterly_totals.json` | Statewide quarterly totals (count / premium / exposure) per coverage_end |
| `california_county_data.csv` | County policy counts + quarter/YoY deltas (map + table) |
| `california_zip_data.csv` | ZIP-level policy counts + quarter/YoY deltas |
| `california_city_data.csv` | City-level aggregates (produced by the pipeline; not currently consumed by the site) |
| `california_zip_history.csv` | ZIP-level FY history (FY21–FY25) |
| `cdi_county_market_share.csv` | County total PIF vs FAIR Plan PIF + FAIR share, 2020–2023 |
| `fair_statewide_history.csv` | Statewide policy count / exposure / premium trajectory |

## Project Layout

```
sources/             # committed source PDFs (also the fetch target): fair/, cdi/
config/
  sources.toml       # registry of upstream PDF sources (URLs, dates, dataset types)
  export_contract.json # the list of website-facing exports
src/fairplan/        # cli.py, pipeline.py, parsers.py, fetch.py, manifest.py,
                     # models.py, io_utils.py  (see CLAUDE.md for which file does what)
web/                 # the live website — Astro app deployed to GitHub Pages (see web/README.md)
tests/               # test_parsers.py + golden/expected_metrics.json
site/build.py        # legacy static generator, superseded by web/ — unused by the deploy
```

## Notes

- Residential-only. Commercial property data appears in source PDFs but is not modeled.
- Full-refresh pipeline. No incremental updates; re-run to pick up new data.
- FAIR Plan sources update quarterly; CDI annual sources typically publish in January.
- Pipeline outputs are rebuilt and deployed to GitHub Pages on every push to `main`.

## License

[MIT](LICENSE)
