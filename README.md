# CA FAIR Plan Residential Data Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Data pipeline that collects, normalizes, and publishes California FAIR Plan residential property insurance market data. Powers [depopulatefairplan.com](https://depopulatefairplan.com).

Browse the data: **[GitHub Pages site](https://rkacker.github.io/depopulate-fair-plan/)**

## Why This Exists

California's homeowners insurance market is in crisis. The FAIR Plan -- the state's insurer of last resort -- has grown from 242,440 policies in FY2021 to 642,010 by September 30, 2025, a 2.6x increase in four years, and continued growing into Q1 2026 (+5.5% in a single quarter on category-PDF totals). Hundreds of thousands of families can no longer find coverage in the voluntary market.

The public data that tracks this crisis is scattered across PDF reports from the [California FAIR Plan](https://www.cfpnet.com/key-statistics-data/) and the [California Department of Insurance](https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm), published on different calendars, in inconsistent formats, with significant reporting lags. This pipeline collects those sources, normalizes them into a consistent data model, and produces exports for public analysis and the [depopulatefairplan.com](https://depopulatefairplan.com) website.

## Key Metrics

**Fiscal year ending September 30, 2025** (annual PIF history):

- **642,010** total residential FAIR Plan policies (county-level Total)
- **621,234** total via ZIP-level Total (slightly different aggregation)
- **232,507** FAIR Plan renewals (CDI, calendar year 2023)
- **29** distressed counties designated by CDI
- **664** distressed ZIP codes designated by CDI

**Latest quarterly snapshot, March 31, 2026** (from FAIR Plan category PDFs, parsed total):

| Metric | 2025-09-30 | 2026-03-31 | Δ |
|---|---|---|---|
| Residential policies | 587,060 | 619,498 | +5.5% |
| Total exposure | $616.95B | $661.56B | +7.2% |
| Total premium | $1.615B | $1.690B | +4.6% |

Category-PDF parsed totals run ~5% below the FAIR Plan's own methodology summary (621,404 at 9/30/2025) — a known parser-coverage gap; see `data/processed/fair/quarterly_totals.csv` for the canonical figures the pipeline emits.

## Data Sources

- **FAIR Plan** -- quarterly policy counts, premiums, exposures, and 5-year PIF history by county and ZIP code (fiscal year ending September 30)
- **CDI** -- California Department of Insurance annual county-level market analysis and statewide residential fact sheet (calendar year, typically 12-18 month reporting lag)
- **CDI Distressed Geographies** -- official list of distressed counties and undermarketed ZIP codes

## Reporting Calendars

| Source | Reporting Period | Typical Publication Lag |
|--------|-----------------|------------------------|
| FAIR Plan | Fiscal year (Oct 1 -- Sep 30) | 2-3 months after quarter end |
| CDI Annual Data | Calendar year (Jan 1 -- Dec 31) | 12-18 months |
| CDI Distressed List | Point-in-time | Updated periodically |

## Outputs

### Normalized Tables (`data/processed/`)

| File | What it contains |
|---|---|
| `fair/county_pif_history.csv` | FAIR Plan policies-in-force by county, 5-year fiscal-year history |
| `fair/zip_pif_history.csv` | FAIR Plan policies-in-force by ZIP code, 5-year fiscal-year history |
| `fair/county_rankings.csv` | Counties ranked by latest-year policy count with YoY growth |
| `fair/category_breakdown.csv` | Quarterly ZIP × county × risk-band × policy-category breakdown for count / premium / exposure |
| `fair/quarterly_totals.csv` | Statewide totals per (coverage_end, metric) — aggregates `category_breakdown.csv` |
| `cdi/county_yearly.csv` | CDI county-level market segments (voluntary, FAIR, DIC) by year |
| `cdi/statewide_yearly.csv` | CDI statewide residential market totals by year |
| `cdi/distressed_counties.csv` | CDI-designated distressed counties |
| `cdi/distressed_zips.csv` | CDI-designated distressed ZIP codes |
| `analysis/distressed_county_pif.csv` | County PIF history with distressed status |
| `analysis/distressed_zip_pif.csv` | ZIP PIF history with distressed status |
| `source_releases.csv` | Metadata and hashes for all source documents |

### Website Exports (`data/exports/`)

| File | Purpose |
|---|---|
| `site_stats.json` | Headline metrics, map labels, and card content for the website |
| `california_county_data.csv` | County policy counts for the interactive map |
| `quarterly_totals.json` | Statewide quarterly totals (count / premium / exposure) per coverage_end |

## Running the Pipeline

**Prerequisites** (Homebrew):

```bash
brew install python@3.11 uv just
```

**Setup:**

```bash
just setup    # create venv, install dependencies
```

**Pipeline stages:**

```bash
just build    # runs Normalize + Export
```

| Stage | Command | What it does |
|---|---|---|
| 1. Fetch | `fairplan fetch` | Downloads source PDFs from cfpnet.com and insurance.ca.gov |
| 2. Normalize | `fairplan normalize` | Parses PDFs into structured CSVs in `data/processed/` |
| 3. Export | `fairplan exports` | Builds website JSON/CSV from processed data |

`just build` runs Normalize + Export (fetch is separate because it requires network and `sources/` PDFs are committed). The CLI also has an `insights` subcommand that emits a Markdown market report to `insights/`; it is not part of `just build` and is run manually with `PYTHONPATH=src uv run python -m fairplan.cli insights`.

## Development

```bash
just test     # run test suite (no network needed)
just clean    # remove all generated output
```

## Project Layout

```
sources/                    # committed source PDFs (also the fetch target)
  fair/                     # FAIR Plan PDFs
  cdi/                      # CDI PDFs

config/
  sources.toml              # registry of upstream PDF sources (URLs, dates, dataset types)
  export_contract.json      # schema for website-facing exports

src/fairplan/
  cli.py                    # CLI entry point (fetch / normalize / exports / insights)
  pipeline.py               # ETL orchestration
  parsers.py                # PDF text extraction and table parsing
  fetch.py                  # source document downloader
  manifest.py               # sources.toml loader
  models.py                 # dataclass definitions for canonical rows
  io_utils.py               # CSV/JSON read-write helpers

site/
  build.py                  # static site generator for GitHub Pages

tests/
  test_parsers.py           # unit + integration tests
  golden/expected_metrics.json
```

## Notes

- Residential-only. Commercial property data appears in source PDFs but is not modeled.
- Full-refresh pipeline. No incremental updates; re-run to pick up new data.
- FAIR Plan sources update quarterly; CDI annual sources typically publish in January.
- Pipeline outputs are rebuilt and deployed to GitHub Pages on every push to main.

## License

[MIT](LICENSE)
