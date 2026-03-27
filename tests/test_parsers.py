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
    assert len(zips) == 664


def test_fixture_pipeline_matches_golden_metrics(tmp_path: Path) -> None:
    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    reports_dir = tmp_path / "reports"

    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)
    report_path = build_report(processed_dir, exports_dir, reports_dir)

    summary = json.loads((exports_dir / "summary.json").read_text(encoding="utf-8"))
    expected = json.loads((ROOT / "tests" / "golden" / "expected_metrics.json").read_text(encoding="utf-8"))

    for key, value in expected.items():
        assert summary["headline_metrics"][key] == value

    assert (exports_dir / "chart_series.json").exists()
    assert (exports_dir / "county_rankings.csv").exists()
    assert (exports_dir / "zip_metrics.csv").exists()
    assert report_path.exists()
