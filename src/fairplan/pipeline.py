from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
import json

from fairplan.fetch import fetch_sources
from fairplan.io_utils import ensure_directory, read_csv, sha256sum, unique_preserving_order, write_csv, write_json
from fairplan.manifest import load_sources
from fairplan.models import SourceConfig
from fairplan.parsers import (
    parse_cdi_county_pdf,
    parse_cdi_fact_sheet_appendix_a,
    parse_distressed_geographies,
    parse_fair_category_pdf,
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


def normalize(raw_dir: Path, processed_dir: Path, manifest_path: Path | None = None) -> None:
    manifest = load_sources(manifest_path or default_manifest_path())
    fair_rows: list[dict[str, object]] = []
    fair_geography_rows: list[dict[str, object]] = []
    cdi_county_rows: list[dict[str, object]] = []
    cdi_fact_rows: list[dict[str, object]] = []
    distressed_rows: list[dict[str, object]] = []

    for source in manifest:
        file_path = source.output_path(raw_dir)
        if not file_path.exists():
            continue
        if source.dataset == "residential_policy_count":
            fair_rows.extend(parse_fair_category_pdf(file_path, source, "count"))
        elif source.dataset == "residential_policy_premium":
            fair_rows.extend(parse_fair_category_pdf(file_path, source, "premium"))
        elif source.dataset == "residential_policy_exposure":
            fair_rows.extend(parse_fair_category_pdf(file_path, source, "exposure"))
        elif source.dataset == "residential_county_pif_history":
            fair_geography_rows.extend(parse_fair_history_pdf(file_path, source, "county"))
        elif source.dataset == "residential_zip_pif_history":
            fair_geography_rows.extend(parse_fair_history_pdf(file_path, source, "zip"))
        elif source.dataset == "residential_county_yearly":
            cdi_county_rows.extend(parse_cdi_county_pdf(file_path, source))
        elif source.dataset == "residential_fact_sheet":
            cdi_fact_rows.extend(parse_cdi_fact_sheet_appendix_a(file_path, source))
        elif source.dataset == "distressed_geographies":
            distressed_rows.extend(parse_distressed_geographies(file_path, source))

    write_csv(
        processed_dir / "fair_residential_quarterly.csv",
        fair_rows,
        [
            "coverage_end",
            "zip",
            "county",
            "is_distressed_area",
            "region",
            "risk_band",
            "policy_category",
            "metric",
            "value",
            "source_id",
        ],
    )
    write_csv(
        processed_dir / "fair_residential_geography_quarterly.csv",
        fair_geography_rows,
        [
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
        ],
    )
    write_csv(
        processed_dir / "cdi_residential_county_yearly.csv",
        cdi_county_rows,
        ["year", "county", "market_segment", "flow_metric", "value", "source_id"],
    )
    write_csv(
        processed_dir / "cdi_residential_zip_yearly.csv",
        [],
        ["year", "zip", "market_segment", "flow_metric", "value", "source_id"],
    )
    write_csv(
        processed_dir / "cdi_statewide_fact_sheet_yearly.csv",
        cdi_fact_rows,
        ["year", "market_segment", "flow_metric", "value", "source_id"],
    )
    write_csv(
        processed_dir / "distressed_geography.csv",
        distressed_rows,
        ["effective_date", "geo_type", "geo_id", "geo_name", "status", "source_id"],
    )
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


def build_exports(processed_dir: Path, exports_dir: Path) -> None:
    fair_quarterly = read_csv(processed_dir / "fair_residential_quarterly.csv")
    fair_geography = read_csv(processed_dir / "fair_residential_geography_quarterly.csv")
    cdi_county = read_csv(processed_dir / "cdi_residential_county_yearly.csv")
    cdi_fact = read_csv(processed_dir / "cdi_statewide_fact_sheet_yearly.csv")
    distressed = read_csv(processed_dir / "distressed_geography.csv")
    sources = read_csv(processed_dir / "source_releases.csv")

    source_urls = unique_preserving_order(row["url"] for row in sources if row["file_exists"] == "1")
    coverage_dates = [row["coverage_end"] for row in sources if row["file_exists"] == "1"]
    coverage_start = "2015-01-01"
    coverage_end = max(coverage_dates) if coverage_dates else ""
    generated_at = datetime.now(UTC).isoformat()

    latest_zip_year = max(
        int(row["fiscal_year"])
        for row in fair_geography
        if row["geography_level"] == "zip"
    )
    latest_county_year = max(
        int(row["fiscal_year"])
        for row in fair_geography
        if row["geography_level"] == "county"
    )

    zip_total_row = next(
        row
        for row in fair_geography
        if row["geography_level"] == "zip"
        and row["geography_id"] == "Total"
        and int(row["fiscal_year"]) == latest_zip_year
    )
    county_rows_latest = [
        row
        for row in fair_geography
        if row["geography_level"] == "county"
        and row["geography_id"] != "Total"
        and int(row["fiscal_year"]) == latest_county_year
    ]
    county_rows_latest.sort(key=lambda row: int(row["value"]), reverse=True)

    latest_cdi_year = max(int(row["year"]) for row in cdi_county if row["county"] == "State")
    cdi_latest_state = [
        row for row in cdi_county if row["county"] == "State" and int(row["year"]) == latest_cdi_year
    ]
    cdi_state_lookup = {
        (row["market_segment"], row["flow_metric"]): int(row["value"]) for row in cdi_latest_state
    }

    zip_lookup: dict[str, dict[str, object]] = defaultdict(
        lambda: {
            "zip": "",
            "county": "",
            "region": "",
            "is_distressed_area": 0,
            "latest_snapshot_policy_count": 0,
            "low_policy_count": 0,
            "medium_policy_count": 0,
            "high_policy_count": 0,
        }
    )
    for row in fair_quarterly:
        if row["metric"] != "count":
            continue
        entry = zip_lookup[row["zip"]]
        entry["zip"] = row["zip"]
        entry["county"] = row["county"]
        entry["region"] = row["region"]
        entry["is_distressed_area"] = int(row["is_distressed_area"])
        entry["latest_snapshot_policy_count"] = int(entry["latest_snapshot_policy_count"]) + int(row["value"])
        risk_key = f"{row['risk_band']}_policy_count"
        entry[risk_key] = int(entry[risk_key]) + int(row["value"])

    history_lookup = {
        row["geography_id"]: row
        for row in fair_geography
        if row["geography_level"] == "zip"
        and row["geography_id"] != "Total"
        and int(row["fiscal_year"]) == latest_zip_year
    }
    zip_metrics = []
    for zip_code, entry in zip_lookup.items():
        history_row = history_lookup.get(zip_code)
        zip_metrics.append(
            {
                "zip": zip_code,
                "county": entry["county"],
                "region": entry["region"],
                "is_distressed_area": entry["is_distressed_area"],
                "latest_snapshot_policy_count": entry["latest_snapshot_policy_count"],
                "latest_fiscal_year_policy_count": history_row["value"] if history_row else "",
                "latest_fiscal_year": latest_zip_year if history_row else "",
                "low_policy_count": entry["low_policy_count"],
                "medium_policy_count": entry["medium_policy_count"],
                "high_policy_count": entry["high_policy_count"],
            }
        )
    zip_metrics.sort(key=lambda row: int(row["latest_snapshot_policy_count"]), reverse=True)

    fair_history_points = [
        {"year": int(row["fiscal_year"]), "value": int(row["value"])}
        for row in fair_geography
        if row["geography_level"] == "zip" and row["geography_id"] == "Total"
    ]
    fair_history_points.sort(key=lambda row: row["year"])

    cdi_history_series = defaultdict(list)
    for row in cdi_fact:
        cdi_history_series[f"{row['market_segment']}_{row['flow_metric']}"].append(
            {"year": int(row["year"]), "value": int(row["value"])}
        )
    for points in cdi_history_series.values():
        points.sort(key=lambda row: row["year"])

    top_counties_points = [
        {"county": row["geography_name"], "value": int(row["value"])}
        for row in county_rows_latest[:10]
    ]
    distressed_snapshot = {"distressed": 0, "non_distressed": 0}
    for row in zip_metrics:
        bucket = "distressed" if int(row["is_distressed_area"]) else "non_distressed"
        distressed_snapshot[bucket] += int(row["latest_snapshot_policy_count"])

    metadata = {
        "as_of_date": coverage_end,
        "coverage_start": coverage_start,
        "coverage_end": coverage_end,
        "generated_at": generated_at,
        "methodology": (
            "FAIR Plan PDF tables are normalized into canonical CSVs and then reshaped into "
            "website-facing exports. CDI annual county and statewide fact-sheet data provide "
            "market context. ZIP-level CDI data is not yet available in v1."
        ),
        "source_urls": source_urls,
    }
    summary = {
        **metadata,
        "headline_metrics": {
            "fair_total_residential_policies_latest_fiscal_year": int(zip_total_row["value"]),
            "fair_total_residential_policies_latest_snapshot": sum(
                int(row["latest_snapshot_policy_count"]) for row in zip_metrics
            ),
            "fair_latest_fiscal_year": latest_zip_year,
            "cdi_latest_year": latest_cdi_year,
            "cdi_statewide_voluntary_renewed_latest_year": cdi_state_lookup.get(("voluntary", "renewed"), 0),
            "cdi_statewide_fair_renewed_latest_year": cdi_state_lookup.get(("fair_plan", "renewed"), 0),
            "distressed_counties": sum(1 for row in distressed if row["geo_type"] == "county"),
            "distressed_zip_codes": sum(1 for row in distressed if row["geo_type"] == "zip"),
        },
        "top_counties_latest_fiscal_year": top_counties_points[:5],
    }
    chart_series = {
        **metadata,
        "charts": [
            {
                "id": "fair_statewide_policy_history",
                "title": "FAIR Plan Residential Policies by Fiscal Year",
                "series": [{"name": "FAIR Plan policies", "points": fair_history_points}],
            },
            {
                "id": "cdi_statewide_market_flows",
                "title": "Statewide Residential Market Flows",
                "series": [
                    {"name": key, "points": points} for key, points in sorted(cdi_history_series.items())
                ],
            },
            {
                "id": "fair_top_counties_latest",
                "title": "Top Counties by FAIR Plan Residential Policies",
                "series": [{"name": str(latest_county_year), "points": top_counties_points}],
            },
            {
                "id": "fair_distressed_vs_non_distressed_snapshot",
                "title": "Latest Snapshot Policies in Distressed vs Non-Distressed ZIPs",
                "series": [
                    {
                        "name": "snapshot_policy_count",
                        "points": [
                            {"label": "distressed", "value": distressed_snapshot["distressed"]},
                            {"label": "non_distressed", "value": distressed_snapshot["non_distressed"]},
                        ],
                    }
                ],
            },
        ],
    }

    write_json(exports_dir / "summary.json", summary)
    write_json(exports_dir / "chart_series.json", chart_series)
    write_csv(
        exports_dir / "county_rankings.csv",
        [
            {
                "county": row["geography_name"],
                "fiscal_year": row["fiscal_year"],
                "policy_count": row["value"],
                "yoy_growth_pct": row["yoy_growth_pct"],
                "coverage_end": row["coverage_end"],
                "source_id": row["source_id"],
            }
            for row in county_rows_latest
        ],
        ["county", "fiscal_year", "policy_count", "yoy_growth_pct", "coverage_end", "source_id"],
    )
    write_csv(
        exports_dir / "zip_metrics.csv",
        zip_metrics,
        [
            "zip",
            "county",
            "region",
            "is_distressed_area",
            "latest_snapshot_policy_count",
            "latest_fiscal_year_policy_count",
            "latest_fiscal_year",
            "low_policy_count",
            "medium_policy_count",
            "high_policy_count",
        ],
    )


def build_report(processed_dir: Path, exports_dir: Path, reports_dir: Path) -> Path:
    summary = read_csv(processed_dir / "source_releases.csv")
    exports_summary = json.loads((exports_dir / "summary.json").read_text(encoding="utf-8"))
    county_rankings = read_csv(exports_dir / "county_rankings.csv")

    latest_sources = [row for row in summary if row["file_exists"] == "1"]
    latest_sources.sort(key=lambda row: row["published_date"], reverse=True)
    top_counties = county_rankings[:5]

    lines = [
        "# California FAIR Plan Residential Market Report",
        "",
        f"Generated: {exports_summary['generated_at']}",
        f"As of: {exports_summary['as_of_date']}",
        "",
        "## Highlights",
        "",
        (
            f"- FAIR Plan residential policies across the ZIP-level fiscal-year history reached "
            f"{exports_summary['headline_metrics']['fair_total_residential_policies_latest_fiscal_year']:,} "
            f"in {exports_summary['headline_metrics']['fair_latest_fiscal_year']}."
        ),
        (
            f"- The latest CDI statewide residential market year is "
            f"{exports_summary['headline_metrics']['cdi_latest_year']}, with "
            f"{exports_summary['headline_metrics']['cdi_statewide_voluntary_renewed_latest_year']:,} "
            "voluntary-market renewed policies and "
            f"{exports_summary['headline_metrics']['cdi_statewide_fair_renewed_latest_year']:,} "
            "FAIR Plan renewed policies."
        ),
        (
            f"- CDI's March 6, 2025 distressed geography list includes "
            f"{exports_summary['headline_metrics']['distressed_counties']} counties and "
            f"{exports_summary['headline_metrics']['distressed_zip_codes']} ZIP codes."
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
            "- FAIR Plan category, ZIP history, and county history PDFs are parsed directly from text-extractable source documents.",
            "- CDI county annual counts and statewide historical fact-sheet tables provide market context.",
            "- CDI ZIP-level yearly policy data is scaffolded but not populated in v1 because a machine-readable source has not yet been added.",
        ]
    )
    report_path = reports_dir / "market_health_report.md"
    ensure_directory(report_path.parent)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return report_path


def fetch_command(raw_dir: Path, manifest_path: Path | None = None) -> None:
    sources = load_sources(manifest_path or default_manifest_path())
    fetch_sources(sources, raw_dir)
