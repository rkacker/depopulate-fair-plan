# CA FAIR Plan Residential Data Platform

Local-first Python data pipeline for collecting, normalizing, and publishing California FAIR Plan residential property insurance market data. Powers `depopulatefairplan.com`.

## Overview

The California FAIR Plan (Fair Access to Insurance Requirements) is the insurer of last resort for homeowners who cannot obtain coverage in the voluntary market. This pipeline tracks residential market data across three sources:

- **FAIR Plan** — quarterly policy counts, premiums, exposures, and 5-year PIF history (county + ZIP)
- **CDI** — California Department of Insurance annual county analysis and statewide residential fact sheet
- **CDI Distressed Geographies** — official list of distressed counties and undermarketed ZIPs

Pipeline stages: `fetch → normalize → build-exports → report`

## Quick Start

**Prerequisites** (Homebrew):

```bash
brew install python@3.11 uv just jq
```

**Setup and test:**

```bash
just setup          # create venv, install dependencies
just test           # run test suite (uses fixture PDFs, no network needed)
just fixture-build  # run full pipeline against checked-in fixtures
```

**Live pipeline** (downloads current PDFs from cfpnet.com and insurance.ca.gov):

```bash
PYTHONPATH=src uv run python -m fairplan.cli fetch
PYTHONPATH=src uv run python -m fairplan.cli normalize
PYTHONPATH=src uv run python -m fairplan.cli build-exports
PYTHONPATH=src uv run python -m fairplan.cli report
```

## Project Layout

```
config/
  sources.toml              # curated source manifest (9 sources, versioned by id)
  export_contract.json      # schema for website-facing export outputs

src/fairplan/
  cli.py                    # argparse CLI (fetch / normalize / build-exports / report)
  pipeline.py               # core ETL orchestration (~679 lines)
  parsers.py                # PDF text extraction and table parsing (~243 lines)
  fetch.py                  # downloads sources from manifest, writes SHA256 metadata
  manifest.py               # parses sources.toml into typed Source objects
  models.py                 # dataclass definitions for canonical rows
  io_utils.py               # CSV/JSON read-write helpers

data/
  raw/                      # downloaded PDFs (git-ignored)
  processed/                # canonical normalized CSVs (git-ignored)
  exports/                  # website-facing JSON/CSV outputs (git-ignored)

reports/                    # generated Markdown reports (git-ignored)

tests/
  test_parsers.py           # unit + integration tests
  fixtures/raw/             # real PDFs committed for reproducible testing
    fair/                   # FAIR Plan fixture PDFs
    cdi/                    # CDI fixture PDFs
  golden/
    expected_metrics.json   # golden test assertions
```

## Canonical Data Model

Six normalized tables written to `data/processed/`:

| File | Grain | Notes |
|---|---|---|
| `fair_residential_quarterly.csv` | ZIP × risk_band × policy_category × metric × quarter | Primary FAIR Plan data |
| `fair_residential_geography_quarterly.csv` | geography × metric × quarter | County and ZIP PIF history |
| `cdi_residential_county_yearly.csv` | county × market_segment × flow_metric × year | CDI county analysis |
| `cdi_residential_zip_yearly.csv` | ZIP × year | Scaffolded; empty until ZIP-level CDI source added |
| `cdi_statewide_fact_sheet_yearly.csv` | market_segment × flow_metric × year | Statewide aggregates |
| `distressed_geography.csv` | county or ZIP | Distress designations |
| `source_releases.csv` | source_id | Metadata, hashes, coverage dates for all sources |

## Website Export Contract

Outputs in `data/exports/` for `depopulatefairplan.com`:

| File | Purpose |
|---|---|
| `summary.json` | Headline metrics (total policies, distressed counts, top counties) |
| `chart_series.json` | Time series for 4 charts (statewide history, market flows, top counties, distressed split) |
| `county_rankings.csv` | Counties ranked by policy count with YoY growth |
| `zip_metrics.csv` | ZIP-level counts by risk band, distressed status, fiscal year |

All exports include `as_of_date`, `coverage_start`, `coverage_end`, `generated_at`, `methodology`, and `source_urls`.

## Source Manifest

`config/sources.toml` defines 9 sources. Each entry has:

```toml
[[sources]]
id = "fair_residential_policy_count_2025q4"   # unique, versioned identifier
family = "fair"                                # "fair" or "cdi"
dataset = "residential_policy_count"           # routes to specific parser
format = "pdf"
url = "https://..."
published_date = "2025-12-11"
coverage_end = "2025-09-30"
file_name = "residential_policy_count_2025q4.pdf"
```

To add a new quarterly release: add a new `[[sources]]` block with an incremented `id` (e.g. `_2026q1`). The pipeline is additive — existing canonical rows are preserved.

## Commands Reference

| Command | Description |
|---|---|
| `just setup` | Create venv and install all dependencies |
| `just test` | Run pytest (fixture-based, no network) |
| `just fixture-build` | Full normalize → exports → report using checked-in fixtures |
| `just clean` | Remove `data/processed/`, `data/exports/`, `reports/` contents |
| `fairplan fetch` | Download all sources listed in manifest |
| `fairplan normalize` | Parse PDFs → write canonical CSVs |
| `fairplan build-exports` | Canonical CSVs → website JSON/CSV exports |
| `fairplan report` | Exports → Markdown market report |

## Golden Test Metrics (v1 fixtures)

The integration test validates end-to-end pipeline output against:

- **621,234** total residential FAIR Plan policies (latest FY)
- **232,507** FAIR renewals (CDI latest, 2023)
- **29** distressed counties
- **664** distressed ZIPs

## Notes

- Python-only in v1. No JS, no database, no external APIs beyond source document downloads.
- Residential-only. Commercial property data appears incidentally in source PDFs but is not modeled.
- Full-refresh pipeline. No incremental update logic; re-run to pick up new data.
- FAIR Plan sources update quarterly; CDI annual sources typically publish in January.
- All `data/` and `reports/` output directories are git-ignored. Fixture PDFs in `tests/fixtures/raw/` are committed.
