# CLAUDE.md — CA FAIR Plan Residential Data Platform

Development context and conventions for accelerated work with Claude Code.

## Start here

- **What to work on next →** [`BACKLOG.md`](BACKLOG.md). Current focus is **redesign-first**
  (see [`docs/redesign-brief.md`](docs/redesign-brief.md)). Read the **Now** items, pick the
  top unblocked one, and follow the session ritual: branch/worktree → implement →
  `just test` (pipeline) and `npm run typecheck` (web) → commit → move to Done → re-rank.
- **Project facts / outputs / quickstart →** [`README.md`](README.md).
- **Website setup →** [`web/README.md`](web/README.md).

## Project Purpose

This is primarily a **data pipeline**. It downloads PDFs from the California FAIR Plan and CDI, extracts tables via regex, normalizes data into canonical CSVs, and produces JSON/CSV exports that feed `depopulatefairplan.com`. The website is an Astro app that lives in `web/` of this repo but is decoupled from the pipeline — it reads only the synced exports in `web/public/data/`. See [`web/README.md`](web/README.md).

## Architecture in One Sentence

`fetch.py` downloads → `parsers.py` extracts text → `pipeline.py` normalizes + aggregates → `data/exports/` is the deliverable.

## Key Files to Know

| File | Role |
|---|---|
| `config/sources.toml` | Single source of truth for all data sources. Add new quarters here. |
| `src/fairplan/parsers.py` | All PDF parsing logic. Most bugs and new parser work happens here. |
| `src/fairplan/pipeline.py` | ETL orchestration: `normalize()`, `build_exports()`, `build_insights()`. |
| `src/fairplan/models.py` | Dataclasses for canonical rows — change schema here first. |
| `tests/golden/expected_metrics.json` | Golden metrics; update when new fixture data changes expected output. |
| `sources/` | Committed source PDFs used by tests and the pipeline. Do not delete. |
| `config/export_contract.json` | The list of website-facing exports `build_exports()` must produce. |
| `web/` | The live website — Astro app deployed to GitHub Pages. See [`web/README.md`](web/README.md). (`site/build.py` is a legacy generator, no longer used by the deploy.) |

## Development Environment

Commands (`just setup` / `just build` / `just test`) are in the [README quickstart](README.md#quickstart). Conventions to follow:

- **`just test` before every commit** — tests use `sources/`, no network needed. Never commit a change that breaks it.
- **Manual local review before pushing to production.** Pushing `main` deploys the live
  site. Before any push that changes user-visible pages — *especially text/copy changes*
  (analysis pages, memos, headlines, methodology disclosures) — start the dev server
  (`npm run dev` in `web/`), tell Rishi the URL(s) to look at, and wait for his OK.
  Automated checks (typecheck, curl greps) verify rendering, not tone or correctness of
  claims; copy on this site gets quoted by press and legislators.
- Python is **3.11 only** (`requires-python = ">=3.11,<3.12"`). Use `uv` for all package operations — never `pip` directly.
- Prefix direct CLI runs with `PYTHONPATH=src`:
  ```bash
  PYTHONPATH=src uv run python -m fairplan.cli <command>
  ```

## Adding a New Quarterly Release

1. Add a new `[[sources]]` block to `config/sources.toml` with a versioned `id` (e.g. `fair_residential_policy_count_2026q1`).
2. Run `just build` to verify the existing pipeline still works.
3. Run `fairplan fetch` to download the new PDF into `sources/`.
4. If the new PDF has a different format than the prior quarter, update the relevant parser in `parsers.py`.
5. Update `tests/golden/expected_metrics.json` to match new expected output.

## Parser Conventions (`parsers.py`)

- Parsers receive a file path and return a list of dataclass instances (defined in `models.py`).
- Use `extract_pdf_lines(path)` to get raw text lines from a PDF page.
- Use `clean_int()` for parsing formatted integer strings (handles commas, dashes).
- Use `normalize_county_name()` to canonicalize county name strings before storing.
- Parsers should raise `ValueError` with a descriptive message if the PDF structure is unrecognized — never silently return partial data.

## Pipeline Conventions (`pipeline.py`)

- `normalize()` routes source files to parsers based on `dataset` field from the manifest.
- All canonical CSVs include a `source_id` column referencing `config/sources.toml`.
- `build_exports()` reads from `data/processed/` only — never re-parses raw PDFs.
- Export files must match the schema in `config/export_contract.json`.
- Every export JSON must include: `as_of_date`, `coverage_start`, `coverage_end`, `generated_at`, `methodology`, `source_urls`.

## Data Model Rules

- Canonical tables are append-friendly: new quarters are new rows, not updates to existing rows.
- The `source_id` column is the join key back to `source_releases.csv` and `config/sources.toml`.
- `geography_level` values: `"county"` or `"zip"`.
- `metric` values in FAIR quarterly: `"policy_count"`, `"premium"`, `"exposure"`.
- `market_segment` values in CDI tables: `"voluntary"`, `"fair"`, `"dic"`, `"surplus_lines"`.

## Testing

- Tests live in `tests/test_parsers.py` — unit tests per parser + one integration test.
- The integration test (`test_fixture_pipeline_matches_golden_metrics`) runs the full pipeline on `sources/` and asserts against `tests/golden/expected_metrics.json`.
- To update golden metrics after a legitimate data change: run `just build`, inspect the outputs, and update `expected_metrics.json` manually.
- Never commit a change that breaks `just test`.

## What Is Out of Scope (v1)

- Commercial property insurance data
- Web API or database backend
- Incremental / delta updates
- ZIP-level CDI data (`cdi_residential_zip_yearly.csv` is scaffolded but intentionally empty)

## Common Tasks for Claude

**"Update for a new quarter's data"** → Add source to `sources.toml`, fetch PDFs, check parsers handle new format, update golden metrics.

**"The parser is failing on a new PDF"** → Read `parsers.py` and the PDF structure via `extract_pdf_lines()`. The regex patterns are sensitive to column alignment changes in the source PDFs.

**"Add a new export field"** → Update `export_contract.json` first, then `build_exports()` in `pipeline.py`, then verify `just build` produces the new field.

**"Add a new canonical table"** → Add dataclass to `models.py`, add parser or pipeline transform, add CSV writer in `pipeline.py`, update `export_contract.json` if it surfaces in exports.

**"Run tests without the network"** → `just test` always works offline. `just build` also works offline. Only `fairplan fetch` requires network access.
