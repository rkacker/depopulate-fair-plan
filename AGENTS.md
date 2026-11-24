# AGENTS.md — CA FAIR Plan Residential Data Platform

Development context and conventions for accelerated work with Claude Code.

## Start here

- **What to work on next →** [`PLAN.md`](PLAN.md): the single plan and backlog. Current
  focus is the **integrated, homeowner-first homepage**. Read the **Now** items, pick the
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
- **Site copy follows the editorial standards in
  [`.claude/skills/copy-review/SKILL.md`](.claude/skills/copy-review/SKILL.md)**
  (citizen-professional voice, claims scoped to what we verified, state's own numbers
  preferred, no gotchas). Apply them when writing copy; invoke `/copy-review` for a
  structured pass before anything ships.
- Python is **3.11 only** (`requires-python = ">=3.11,<3.12"`). Use `uv` for all package operations — never `pip` directly.
- Prefix direct CLI runs with `PYTHONPATH=src`:
  ```bash
  PYTHONPATH=src uv run python -m fairplan.cli <command>
  ```

Parser, pipeline and data-model conventions live in [`src/fairplan/CLAUDE.md`](src/fairplan/CLAUDE.md)
and load when you work on the pipeline.

## Adding a New Quarterly Release

1. Add a new `[[sources]]` block to `config/sources.toml` with a versioned `id` (e.g. `fair_residential_policy_count_2026q1`).
2. Run `just build` to verify the existing pipeline still works.
3. Run `fairplan fetch` to download the new PDF into `sources/`.
4. If the new PDF has a different format than the prior quarter, update the relevant parser in `parsers.py`.
5. Update `tests/golden/expected_metrics.json` to match new expected output.

## Testing

- Tests live in `tests/test_parsers.py` — unit tests per parser + one integration test.
- The integration test (`test_fixture_pipeline_matches_golden_metrics`) runs the full pipeline on `sources/` and asserts against `tests/golden/expected_metrics.json`.
- To update golden metrics after a legitimate data change: run `just build`, inspect the outputs, and update `expected_metrics.json` manually.

## What Is Out of Scope (v1)

- Commercial property insurance data
- Web API or database backend
- Incremental / delta updates
- ZIP-level CDI data (`cdi_residential_zip_yearly.csv` is scaffolded but intentionally empty)
