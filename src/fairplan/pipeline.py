from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fairplan.fetch import fetch_sources
from fairplan.io_utils import ensure_directory, read_csv, sha256sum, write_csv, write_json
from fairplan.manifest import load_sources
from fairplan.models import SourceConfig
from fairplan.parsers import (
    parse_cdi_county_pdf,
    parse_distressed_geographies,
    parse_fair_history_pdf,
)


def default_manifest_path() -> Path:
    return Path("config/sources.toml")


def build_source_releases(sources: list[SourceConfig], raw_dir: Path) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for source in sources:
        file_path = source.output_path(raw_dir)
        exists = file_path.exists()
        rows.append(
            {
                "source_id": source.id,
                "family": source.family,
                "dataset": source.dataset,
                "published_date": source.published_date,
                "coverage_end": source.coverage_end,
                "url": source.url,
                "file_path": str(file_path),
                "file_exists": int(exists),
                "size_bytes": file_path.stat().st_size if exists else 0,
                "sha256": sha256sum(file_path) if exists else "",
            }
        )
    return rows


PIF_FIELDNAMES = [
    "coverage_end",
    "fiscal_year",
    "period_end",
    "geography_level",
    "geography_id",
    "geography_name",
    "metric",
    "value",
    "yoy_growth_pct",
    "source_id",
]

DISTRESSED_FIELDNAMES = [
    "effective_date",
    "geo_type",
    "geo_id",
    "geo_name",
    "status",
    "source_id",
]


def normalize(raw_dir: Path, processed_dir: Path, manifest_path: Path | None = None) -> None:
    """Parse PDFs and write analysis-ready CSVs to processed_dir."""
    manifest = load_sources(manifest_path or default_manifest_path())
    pif_rows: list[dict[str, object]] = []
    cdi_county_rows: list[dict[str, object]] = []
    distressed_rows: list[dict[str, object]] = []

    for source in manifest:
        file_path = source.output_path(raw_dir)
        if not file_path.exists():
            continue
        if source.dataset == "residential_county_pif_history":
            pif_rows.extend(parse_fair_history_pdf(file_path, source, "county"))
        elif source.dataset == "residential_zip_pif_history":
            pif_rows.extend(parse_fair_history_pdf(file_path, source, "zip"))
        elif source.dataset == "residential_county_yearly":
            cdi_county_rows.extend(parse_cdi_county_pdf(file_path, source))
        elif source.dataset == "distressed_geographies":
            distressed_rows.extend(parse_distressed_geographies(file_path, source))

    # --- fair/ base tables ---
    county_pif_rows = [r for r in pif_rows if r["geography_level"] == "county"]
    zip_pif_rows = [r for r in pif_rows if r["geography_level"] == "zip"]

    write_csv(processed_dir / "fair" / "county_pif_history.csv", county_pif_rows, PIF_FIELDNAMES)
    write_csv(processed_dir / "fair" / "zip_pif_history.csv", zip_pif_rows, PIF_FIELDNAMES)

    # --- cdi/ base tables ---
    write_csv(
        processed_dir / "cdi" / "county_yearly.csv",
        cdi_county_rows,
        ["year", "county", "market_segment", "flow_metric", "value", "source_id"],
    )

    distressed_county_rows = [r for r in distressed_rows if r["geo_type"] == "county"]
    distressed_zip_rows = [r for r in distressed_rows if r["geo_type"] == "zip"]

    write_csv(processed_dir / "cdi" / "distressed_counties.csv", distressed_county_rows, DISTRESSED_FIELDNAMES)
    write_csv(processed_dir / "cdi" / "distressed_zips.csv", distressed_zip_rows, DISTRESSED_FIELDNAMES)

    # --- metadata ---
    write_csv(
        processed_dir / "source_releases.csv",
        build_source_releases(manifest, raw_dir),
        [
            "source_id",
            "family",
            "dataset",
            "published_date",
            "coverage_end",
            "url",
            "file_path",
            "file_exists",
            "size_bytes",
            "sha256",
        ],
    )

    # --- fair/ derived: county rankings (latest FY, sorted by policy count) ---
    county_pif_no_total = [r for r in county_pif_rows if r["geography_id"] != "Total"]
    if county_pif_no_total:
        latest_county_year = max(int(r["fiscal_year"]) for r in county_pif_no_total)
        county_latest = [r for r in county_pif_no_total if int(r["fiscal_year"]) == latest_county_year]
        county_latest.sort(key=lambda r: int(r["value"]), reverse=True)
        write_csv(
            processed_dir / "fair" / "county_rankings.csv",
            [
                {
                    "county": r["geography_name"],
                    "fiscal_year": r["fiscal_year"],
                    "policy_count": r["value"],
                    "yoy_growth_pct": r["yoy_growth_pct"],
                    "coverage_end": r["coverage_end"],
                    "source_id": r["source_id"],
                }
                for r in county_latest
            ],
            ["county", "fiscal_year", "policy_count", "yoy_growth_pct", "coverage_end", "source_id"],
        )

    # --- analysis/ derived: distressed PIF growth (FAIR PIF + CDI distressed) ---
    distressed_county_set = frozenset(r["geo_name"] for r in distressed_county_rows)
    distressed_zip_set = frozenset(r["geo_id"] for r in distressed_zip_rows)

    distressed_pif_rows = []
    for r in pif_rows:
        geo_id = r["geography_id"]
        if geo_id == "Total":
            continue
        geo_level = r["geography_level"]
        is_distressed = (
            (geo_level == "county" and r["geography_name"] in distressed_county_set)
            or (geo_level == "zip" and geo_id in distressed_zip_set)
        )
        distressed_pif_rows.append(
            {
                "fiscal_year": int(r["fiscal_year"]),
                "geography_level": geo_level,
                "geography_id": geo_id,
                "geography_name": r["geography_name"],
                "is_distressed": int(is_distressed),
                "policy_count": int(r["value"]),
                "yoy_growth_pct": r["yoy_growth_pct"],
                "source_id": r["source_id"],
            }
        )
    write_csv(
        processed_dir / "analysis" / "distressed_pif_growth.csv",
        distressed_pif_rows,
        [
            "fiscal_year",
            "geography_level",
            "geography_id",
            "geography_name",
            "is_distressed",
            "policy_count",
            "yoy_growth_pct",
            "source_id",
        ],
    )


def build_exports(processed_dir: Path, exports_dir: Path) -> None:
    """Generate JSON/CSV exports for website visualization."""
    county_pif = read_csv(processed_dir / "fair" / "county_pif_history.csv")
    county_rankings = read_csv(processed_dir / "fair" / "county_rankings.csv")

    # --- site_stats.json ---
    county_totals: dict[int, int] = {}
    for row in county_pif:
        if row["geography_id"] == "Total":
            county_totals[int(row["fiscal_year"])] = int(row["value"])

    years = sorted(county_totals.keys())
    current_year = years[-1]
    prior_year = years[-2]
    earliest_year = years[0]
    current_value = county_totals[current_year]
    prior_value = county_totals[prior_year]
    earliest_value = county_totals[earliest_year]

    growth_multiple = round(current_value / earliest_value, 1) if earliest_value else 0
    growth_label = f"{growth_multiple:.0f}x" if growth_multiple == int(growth_multiple) else f"{growth_multiple}x"

    period_end_current = f"September 30, {current_year}"
    period_end_prior = f"September 30, {prior_year}"

    site_stats = {
        "hero": {
            "total_policies_display": _format_display(current_value),
            "description": (
                "California's insurance market is broken. The FAIR Plan\u2014meant as a "
                "last resort\u2014now insures over {total_policies_display} homes and "
                "continues growing. We must act now to rebuild a market that works for families."
            ),
        },
        "stats_cards": {
            "prior_year": {
                "value": _format_short(prior_value),
                "label": f"FY {prior_year}",
                "detail": f"Policies as of {period_end_prior}",
            },
            "current_year": {
                "value": _format_short(current_value),
                "label": f"FY {current_year}",
                "detail": f"Policies as of {period_end_current}",
            },
            "growth": {
                "value": growth_label,
                "label": "Growth Rate",
                "detail": f"Since FY {earliest_year}",
            },
        },
        "map": {
            "title": f"FY {current_year} FAIR Plan Crisis Map",
            "description": (
                f"Explore how FAIR Plan policies are distributed across California's "
                f"58 counties. Data current through {period_end_current}."
            ),
            "data_source": f"California FAIR Plan data through {period_end_current}",
            "total_label": f"Total FAIR Plan Policies in California (FY {current_year})",
        },
        "table": {
            "description": f"FAIR Plan policies by county as of {period_end_current}",
            "data_source": f"Data source: California FAIR Plan through {period_end_current}",
        },
    }
    write_json(exports_dir / "site_stats.json", site_stats)

    # --- california_county_data.csv ---
    write_csv(
        exports_dir / "california_county_data.csv",
        [{"county": r["county"], "policies": r["policy_count"]} for r in county_rankings],
        ["county", "policies"],
    )



def build_report(processed_dir: Path, exports_dir: Path, reports_dir: Path) -> Path:
    sources = read_csv(processed_dir / "source_releases.csv")
    zip_pif = read_csv(processed_dir / "fair" / "zip_pif_history.csv")
    cdi_county = read_csv(processed_dir / "cdi" / "county_yearly.csv")
    distressed_counties_rows = read_csv(processed_dir / "cdi" / "distressed_counties.csv")
    distressed_zips_rows = read_csv(processed_dir / "cdi" / "distressed_zips.csv")
    county_rankings = read_csv(processed_dir / "fair" / "county_rankings.csv")

    latest_sources = [row for row in sources if row["file_exists"] == "1"]
    latest_sources.sort(key=lambda row: row["published_date"], reverse=True)
    coverage_dates = [row["coverage_end"] for row in latest_sources]
    as_of_date = max(coverage_dates) if coverage_dates else ""

    latest_zip_year = max(int(row["fiscal_year"]) for row in zip_pif)
    zip_total_value = next(
        int(row["value"])
        for row in zip_pif
        if row["geography_id"] == "Total"
        and int(row["fiscal_year"]) == latest_zip_year
    )

    latest_cdi_year = max(int(row["year"]) for row in cdi_county if row["county"] == "State")
    cdi_latest_state = {
        (row["market_segment"], row["flow_metric"]): int(row["value"])
        for row in cdi_county
        if row["county"] == "State" and int(row["year"]) == latest_cdi_year
    }

    distressed_counties = len(distressed_counties_rows)
    distressed_zip_codes = len(distressed_zips_rows)

    top_counties = county_rankings[:5]
    generated_at = datetime.now(UTC).isoformat()

    lines = [
        "# California FAIR Plan Residential Market Report",
        "",
        f"Generated: {generated_at}",
        f"As of: {as_of_date}",
        "",
        "## Highlights",
        "",
        (
            f"- FAIR Plan residential policies across the ZIP-level fiscal-year history reached "
            f"{zip_total_value:,} in {latest_zip_year}."
        ),
        (
            f"- The latest CDI statewide residential market year is "
            f"{latest_cdi_year}, with "
            f"{cdi_latest_state.get(('voluntary', 'renewed'), 0):,} "
            "voluntary-market renewed policies and "
            f"{cdi_latest_state.get(('fair_plan', 'renewed'), 0):,} "
            "FAIR Plan renewed policies."
        ),
        (
            f"- CDI's distressed geography list includes "
            f"{distressed_counties} counties and "
            f"{distressed_zip_codes} ZIP codes."
        ),
        "",
        "## Top Counties",
        "",
    ]
    for row in top_counties:
        lines.append(
            f"- {row['county']}: {int(row['policy_count']):,} policies in fiscal year {row['fiscal_year']}."
        )
    lines.extend(
        [
            "",
            "## Source Freshness",
            "",
        ]
    )
    for row in latest_sources[:5]:
        lines.append(
            f"- `{row['source_id']}` published {row['published_date']} covering data through {row['coverage_end']}."
        )
    lines.extend(
        [
            "",
            "## Methodology Notes",
            "",
            "- FAIR Plan ZIP history and county history PDFs are parsed directly from text-extractable source documents.",
            "- CDI county annual counts provide market context.",
            "- CDI ZIP-level yearly policy data is scaffolded but not populated in v1 because a machine-readable source has not yet been added.",
        ]
    )
    report_path = reports_dir / "market_health_report.md"
    ensure_directory(report_path.parent)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return report_path


def _format_display(value: int) -> str:
    """Round to nearest 10,000 and format with commas (e.g. 642010 -> '640,000')."""
    rounded = round(value, -4)
    return f"{rounded:,}"


def _format_short(value: int) -> str:
    """Format as compact string (e.g. 642010 -> '642K')."""
    return f"{value // 1000}K"


def fetch_command(raw_dir: Path, manifest_path: Path | None = None) -> None:
    sources = load_sources(manifest_path or default_manifest_path())
    fetch_sources(sources, raw_dir)
