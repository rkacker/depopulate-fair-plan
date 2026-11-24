# Pipeline conventions (`src/fairplan/`)

Loaded when working on the pipeline. Project-wide rules are in the root `AGENTS.md`.

## Parser Conventions (`parsers.py`)

- Parsers receive a file path and return a list of dataclass instances (defined in `models.py`).
- Use `extract_pdf_lines(path)` to get raw text lines from a PDF page.
- Use `clean_int()` for parsing formatted integer strings (handles commas, dashes).
- Use `normalize_county_name()` to canonicalize county name strings before storing.
- Parsers should raise `ValueError` with a descriptive message if the PDF structure is unrecognized — never silently return partial data.
- The regex patterns are sensitive to column alignment changes in the source PDFs. When a parser fails on a new PDF, read its structure with `extract_pdf_lines()` first.

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
