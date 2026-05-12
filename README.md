# CA FAIR Plan Residential Data Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Data pipeline that collects, normalizes, and publishes California FAIR Plan residential property insurance market data. Powers [depopulatefairplan.com](https://depopulatefairplan.com).

Browse the data: **[GitHub Pages site](https://rkacker.github.io/depopulate-fair-plan/)**

## Why This Exists

California's homeowners insurance market is in crisis. The FAIR Plan -- the state's insurer of last resort -- has grown from 236,515 residential policies in FY2021 to 655,204 by March 31, 2026, a 2.8x increase in five years. Growth is now running at ~5.5% per quarter and accelerating. Hundreds of thousands of families can no longer find coverage in the voluntary market.

The public data that tracks this crisis is scattered across PDF reports from the [California FAIR Plan](https://www.cfpnet.com/key-statistics-data/) and the [California Department of Insurance](https://www.insurance.ca.gov/01-consumers/200-wrr/DataAnalysisOnWildfiresAndInsurance.cfm), published on different calendars, in inconsistent formats, with significant reporting lags. This pipeline collects those sources, normalizes them into a consistent data model, and produces exports for public analysis and the [depopulatefairplan.com](https://depopulatefairplan.com) website.

## Key Metrics

**Quarterly snapshots** (from FAIR Plan category PDFs, residential only):

| Metric | 2025-06-30 | 2025-09-30 | 2026-03-31 |
|---|---|---|---|
| Residential policies | 587,677 | 621,234 | **655,204** |
| Total exposure | $602.7B | $645.1B | **$691.8B** |
| Total premium | $1.640B | $1.709B | **$1.789B** |

Quarter-over-quarter growth from 2025-09-30 to 2026-03-31: policies +5.5%, exposure +7.2%, premium +4.6%. Premium growing slower than policy count is a signal that new policies are concentrated in lower-rate ZIPs.

**Other context:**

- **236,515** residential FAIR Plan policies at FY2021 end (statewide ZIP Total) — anchors the 2.8x growth multiple
- **232,507** FAIR Plan renewals (CDI, calendar year 2023, carrier-reported)
- **29** distressed counties designated by CDI
- **663** distressed ZIP codes designated by CDI
- **436** additional ZIPs the FAIR Plan flags as distressed but CDI doesn't list (see `data/processed/analysis/distressed_zip_reconciliation.csv`)

Parsed quarterly totals match the FAIR Plan's authoritative methodology summary to within 0.03%.

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
| `fair/category_breakdown.csv` | **Canonical residential source.** Quarterly ZIP × county × risk-band × policy-category breakdown for count / premium / exposure |
| `fair/quarterly_totals.csv` | Statewide totals per (coverage_end, metric) — aggregates `category_breakdown.csv` |
| `fair/county_quarterly.csv` | Per-county totals per coverage_end × metric (count / premium / exposure) — aggregates `category_breakdown.csv` |
| `fair/county_pif_history.csv` | Residential-only county FY history, synthesized by rolling the DWE ZIP file up to county via the ZIP→county map baked into the category PDFs |
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
