from __future__ import annotations

import json
from pathlib import Path

from fairplan.manifest import load_sources
from fairplan.parsers import (
    parse_cdi_county_pdf,
    parse_distressed_geographies,
    parse_fair_category_pdf,
)
from fairplan.pipeline import build_exports, build_report, normalize


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "config" / "sources.toml"
FIXTURES = ROOT / "tests" / "fixtures" / "raw"


def source_by_dataset(dataset: str):
    for source in load_sources(MANIFEST):
        if source.dataset == dataset:
            return source
    raise AssertionError(f"missing dataset {dataset}")


def test_fair_count_parser_extracts_known_zip_values() -> None:
    source = source_by_dataset("residential_policy_count")
    rows = parse_fair_category_pdf(FIXTURES / "fair" / source.file_name, source, "count")
    target = next(
        row
        for row in rows
        if row["zip"] == "94611"
        and row["risk_band"] == "high"
        and row["policy_category"] == "owner_occupied_single_family"
    )
    assert target["value"] == 709


def test_cdi_county_parser_extracts_statewide_renewals() -> None:
    source = source_by_dataset("residential_county_yearly")
    rows = parse_cdi_county_pdf(FIXTURES / "cdi" / source.file_name, source)
    target = next(
        row
        for row in rows
        if row["county"] == "State"
        and row["year"] == 2023
        and row["market_segment"] == "voluntary"
        and row["flow_metric"] == "renewed"
    )
    assert target["value"] == 7_576_693


def test_distressed_parser_extracts_counties_and_zips() -> None:
    source = source_by_dataset("distressed_geographies")
    rows = parse_distressed_geographies(FIXTURES / "cdi" / source.file_name, source)
    counties = [row for row in rows if row["geo_type"] == "county"]
    zips = [row for row in rows if row["geo_type"] == "zip"]
    assert len(counties) == 29
    assert len(zips) == 663


def test_fixture_pipeline_matches_golden_metrics(tmp_path: Path) -> None:
    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    reports_dir = tmp_path / "reports"

    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)
    report_path = build_report(processed_dir, exports_dir, reports_dir)

    expected = json.loads((ROOT / "tests" / "golden" / "expected_metrics.json").read_text(encoding="utf-8"))

    from fairplan.io_utils import read_csv

    pif_history = read_csv(processed_dir / "pif_history.csv")
    cdi_county = read_csv(processed_dir / "cdi_county_yearly.csv")
    distressed = read_csv(processed_dir / "distressed_geography.csv")

    latest_zip_year = max(
        int(row["fiscal_year"])
        for row in pif_history
        if row["geography_level"] == "zip"
    )
    zip_total_value = next(
        int(row["value"])
        for row in pif_history
        if row["geography_level"] == "zip"
        and row["geography_id"] == "Total"
        and int(row["fiscal_year"]) == latest_zip_year
    )
    latest_cdi_year = max(int(row["year"]) for row in cdi_county if row["county"] == "State")
    cdi_fair_renewed = next(
        int(row["value"])
        for row in cdi_county
        if row["county"] == "State"
        and int(row["year"]) == latest_cdi_year
        and row["market_segment"] == "fair_plan"
        and row["flow_metric"] == "renewed"
    )
    distressed_counties = sum(1 for row in distressed if row["geo_type"] == "county")
    distressed_zip_codes = sum(1 for row in distressed if row["geo_type"] == "zip")

    assert zip_total_value == expected["fair_total_residential_policies_latest_fiscal_year"]
    assert cdi_fair_renewed == expected["cdi_statewide_fair_renewed_latest_year"]
    assert distressed_counties == expected["distressed_counties"]
    assert distressed_zip_codes == expected["distressed_zip_codes"]

    # Processed CSVs exist
    assert (processed_dir / "county_rankings.csv").exists()
    assert (processed_dir / "distressed_pif_growth.csv").exists()

    # JSON exports exist
    assert (exports_dir / "site_stats.json").exists()
    assert (exports_dir / "county_rankings.json").exists()
    assert (exports_dir / "zip_pif_history.json").exists()

    assert report_path.exists()
