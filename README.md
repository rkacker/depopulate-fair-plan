# CA FAIR Plan Residential Data Platform

Local-first Python data tooling for collecting, structuring, and analyzing California FAIR Plan residential market data, with exports shaped for `depopulatefairplan.com`.

## What This Project Does

- Downloads FAIR Plan and California Department of Insurance source documents.
- Normalizes source data into canonical CSV tables.
- Builds website-facing JSON/CSV exports for charts and rankings.
- Generates a short Markdown report describing the latest residential market trends.

## Runtime

- Homebrew `python@3.11`
- Homebrew `uv`
- Python package environment managed with `uv`

## Quick Start

1. Ensure Homebrew tooling is installed:

```bash
brew install git python@3.11 uv jq just
```

2. Make sure Homebrew Python 3.11 is ahead of the Apple or `pyenv` shims for this repo:

```bash
export PATH="/opt/homebrew/opt/python@3.11/libexec/bin:/opt/homebrew/bin:$PATH"
```

3. Create the environment and install project dependencies:

```bash
just setup
```

4. Run the fixture-backed local pipeline:

```bash
just test
just fixture-build
```

5. Run the live pipeline:

```bash
PYTHONPATH=src uv run python -m fairplan.cli fetch
PYTHONPATH=src uv run python -m fairplan.cli normalize
PYTHONPATH=src uv run python -m fairplan.cli build-exports
PYTHONPATH=src uv run python -m fairplan.cli report
```

## Project Layout

- `src/fairplan/`: application code and CLI
- `config/sources.toml`: curated upstream source manifest
- `data/raw/`: downloaded source files
- `data/processed/`: canonical normalized tables
- `data/exports/`: website-facing JSON/CSV outputs
- `reports/`: generated Markdown reports
- `tests/fixtures/raw/`: checked-in real source fixture files

## Canonical Outputs

The pipeline writes these core tables:

- `fair_residential_quarterly.csv`
- `fair_residential_geography_quarterly.csv`
- `cdi_residential_county_yearly.csv`
- `cdi_residential_zip_yearly.csv`
- `distressed_geography.csv`
- `source_releases.csv`

`cdi_residential_zip_yearly.csv` is scaffolded in v1 but will remain empty until a ZIP-level CDI source is added to the manifest.

## Website Export Contract

The first export package is designed for `depopulatefairplan.com` and includes:

- `summary.json`
- `chart_series.json`
- `county_rankings.csv`
- `zip_metrics.csv`

Every export includes source freshness and methodology metadata.

## Commands

- `just setup`: create the virtual environment and install dependencies
- `just test`: run the automated test suite
- `just fixture-build`: build processed outputs using checked-in fixtures
- `just clean`: clear generated processed outputs, exports, and reports

## Notes

- The project is intentionally Python-only in v1.
- Residential analysis is the priority. Commercial data is not modeled beyond incidental metadata in source documents.
- FAIR Plan data can update more frequently than CDI annual residential market data, so output metadata always includes source coverage dates.
