from __future__ import annotations

import json
from pathlib import Path

from fairplan.manifest import load_sources
from fairplan.parsers import (
    parse_cdi_county_pdf,
    parse_cdi_zip_xlsx,
    parse_distressed_geographies,
    parse_fair_category_pdf,
)
from fairplan.pipeline import build_exports, build_insights, normalize


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "config" / "sources.toml"
FIXTURES = ROOT / "sources"


def source_by_dataset(dataset: str):
    for source in load_sources(MANIFEST):
        if source.dataset == dataset:
            return source
    raise AssertionError(f"missing dataset {dataset}")


def source_by_id(source_id: str):
    for source in load_sources(MANIFEST):
        if source.id == source_id:
            return source
    raise AssertionError(f"missing source {source_id}")


def test_fair_count_parser_extracts_known_zip_values() -> None:
    source = source_by_id("fair_residential_policy_count_2025_09")
    rows = parse_fair_category_pdf(FIXTURES / "fair" / source.file_name, source, "count")
    target = next(
        row
        for row in rows
        if row["zip"] == "94611"
        and row["risk_band"] == "high"
        and row["policy_category"] == "owner_occupied_single_family"
    )
    assert target["value"] == 709


def test_fair_count_parser_handles_sb_mountains_region() -> None:
    source = source_by_id("fair_residential_policy_count_2025_09")
    rows = parse_fair_category_pdf(FIXTURES / "fair" / source.file_name, source, "count")
    sb_mountains_rows = [r for r in rows if r["region"] == "SB Mountains"]
    assert len(sb_mountains_rows) > 0
    assert sum(int(r["value"]) for r in sb_mountains_rows) > 30_000


def test_fair_premium_parser_handles_decimal_format() -> None:
    source = source_by_id("fair_residential_policy_premium_2025_06")
    rows = parse_fair_category_pdf(FIXTURES / "fair" / source.file_name, source, "premium")
    target = next(
        row
        for row in rows
        if row["zip"] == "94501"
        and row["risk_band"] == "low"
        and row["policy_category"] == "owner_occupied_single_family"
    )
    assert target["value"] == 137_390


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


def test_cdi_zip_xlsx_parser_emits_voluntary_flow_metrics() -> None:
    source = source_by_dataset("residential_zip_yearly")
    rows = parse_cdi_zip_xlsx(FIXTURES / "cdi" / source.file_name, source)
    assert len(rows) > 0
    assert all(isinstance(row["year"], int) for row in rows)
    assert all(isinstance(row["zip"], str) and len(row["zip"]) == 5 for row in rows)
    assert {row["market_segment"] for row in rows} == {"voluntary"}
    assert {row["flow_metric"] for row in rows} == {"new", "renewed", "nonrenewed"}
    assert all(int(row["value"]) >= 0 for row in rows)

    target = next(
        row
        for row in rows
        if row["zip"] == "90001" and row["year"] == 2023 and row["flow_metric"] == "renewed"
    )
    assert target["value"] == 5_569


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
    insights_dir = tmp_path / "insights"

    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)
    insight_path = build_insights(processed_dir, exports_dir, insights_dir)

    expected = json.loads((ROOT / "tests" / "golden" / "expected_metrics.json").read_text(encoding="utf-8"))

    from fairplan.io_utils import read_csv

    zip_pif = read_csv(processed_dir / "fair" / "zip_pif_history.csv")
    cdi_county = read_csv(processed_dir / "cdi" / "county_yearly.csv")
    distressed_counties = read_csv(processed_dir / "cdi" / "distressed_counties.csv")
    distressed_zips = read_csv(processed_dir / "cdi" / "distressed_zips.csv")

    latest_zip_year = max(int(row["fiscal_year"]) for row in zip_pif)
    zip_total_value = next(
        int(row["value"])
        for row in zip_pif
        if row["geography_id"] == "Total"
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

    assert zip_total_value == expected["fair_total_residential_policies_latest_fiscal_year"]
    assert cdi_fair_renewed == expected["cdi_statewide_fair_renewed_latest_year"]
    assert len(distressed_counties) == expected["distressed_counties"]
    assert len(distressed_zips) == expected["distressed_zip_codes"]

    quarterly = read_csv(processed_dir / "fair" / "quarterly_totals.csv")
    count_rows = sorted([r for r in quarterly if r["metric"] == "count"], key=lambda r: r["coverage_end"])
    latest_count = int(count_rows[-1]["value"])
    q3_2025_count = next(int(r["value"]) for r in count_rows if r["coverage_end"] == "2025-09-30")
    assert latest_count == expected["fair_category_policy_count_latest_quarter"]
    assert q3_2025_count == expected["fair_category_policy_count_2025q3"]

    county_quarterly = read_csv(processed_dir / "fair" / "county_quarterly.csv")
    latest_coverage_end = max(r["coverage_end"] for r in county_quarterly)
    alameda_latest = next(
        int(r["policy_count"])
        for r in county_quarterly
        if r["county"] == "Alameda" and r["coverage_end"] == latest_coverage_end
    )
    assert alameda_latest == expected["fair_category_alameda_policy_count_latest_quarter"]

    cdi_zip = read_csv(processed_dir / "cdi" / "zip_yearly.csv")
    assert len(cdi_zip) == expected["cdi_zip_yearly_row_count"]
    voluntary_renewed_total = sum(
        int(r["value"])
        for r in cdi_zip
        if r["market_segment"] == "voluntary" and r["flow_metric"] == "renewed"
    )
    assert voluntary_renewed_total == expected["cdi_zip_yearly_voluntary_renewed_total"]
    zip_90001_2023_renewed = next(
        int(r["value"])
        for r in cdi_zip
        if r["zip"] == "90001"
        and int(r["year"]) == 2023
        and r["flow_metric"] == "renewed"
    )
    assert zip_90001_2023_renewed == expected["cdi_zip_yearly_zip_90001_2023_renewed"]

    # Processed CSVs exist in correct subdirectories
    assert (processed_dir / "fair" / "county_pif_history.csv").exists()
    assert (processed_dir / "fair" / "zip_pif_history.csv").exists()
    assert (processed_dir / "fair" / "county_rankings.csv").exists()
    assert (processed_dir / "cdi" / "county_yearly.csv").exists()
    assert (processed_dir / "cdi" / "distressed_counties.csv").exists()
    assert (processed_dir / "cdi" / "distressed_zips.csv").exists()
    assert (processed_dir / "analysis" / "distressed_county_pif.csv").exists()
    assert (processed_dir / "analysis" / "distressed_zip_pif.csv").exists()

    # Exports exist
    assert (exports_dir / "site_stats.json").exists()
    assert (exports_dir / "california_county_data.csv").exists()
    assert (exports_dir / "california_zip_data.csv").exists()
    assert (processed_dir / "fair" / "zip_quarterly.csv").exists()

    assert insight_path.exists()


def test_zip_quarterly_aggregates_category_breakdown(tmp_path: Path) -> None:
    """zip_quarterly.csv should sum category_breakdown across category/risk_band per ZIP."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    normalize(FIXTURES, processed_dir, MANIFEST)

    category = read_csv(processed_dir / "fair" / "category_breakdown.csv")
    zip_quarterly = read_csv(processed_dir / "fair" / "zip_quarterly.csv")
    assert zip_quarterly, "zip_quarterly.csv must not be empty"

    # The aggregate must equal the sum of count rows for the same ZIP/coverage_end.
    sample = zip_quarterly[0]
    expected = sum(
        int(r["value"])
        for r in category
        if r["zip"] == sample["zip"]
        and r["coverage_end"] == sample["coverage_end"]
        and r["metric"] == "count"
    )
    assert int(sample["policy_count"]) == expected

    # Statewide sums per coverage_end must match the quarterly_totals row.
    quarterly = read_csv(processed_dir / "fair" / "quarterly_totals.csv")
    statewide_count = {
        r["coverage_end"]: int(r["value"])
        for r in quarterly
        if r["metric"] == "count"
    }
    for ce, expected_total in statewide_count.items():
        zip_sum = sum(
            int(r["policy_count"]) for r in zip_quarterly if r["coverage_end"] == ce
        )
        assert zip_sum == expected_total, (
            f"ZIP rollup for {ce} ({zip_sum:,}) must match statewide total ({expected_total:,})"
        )


def test_city_quarterly_aggregates_zip_quarterly(tmp_path: Path) -> None:
    """city_quarterly must equal a regrouping of zip_quarterly by city — totals must match
    (minus the small leakage of ZIPs with no GeoNames city)."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    normalize(FIXTURES, processed_dir, MANIFEST)

    zip_rows = read_csv(processed_dir / "fair" / "zip_quarterly.csv")
    city_rows = read_csv(processed_dir / "fair" / "city_quarterly.csv")
    assert city_rows, "city_quarterly.csv must not be empty"

    # Per-coverage_end: city total = zip total minus ZIPs with no city.
    for ce in {r["coverage_end"] for r in zip_rows}:
        zip_with_city = sum(
            int(r["policy_count"]) for r in zip_rows
            if r["coverage_end"] == ce and r["city"]
        )
        city_sum = sum(
            int(r["policy_count"]) for r in city_rows if r["coverage_end"] == ce
        )
        assert zip_with_city == city_sum, f"city/zip mismatch for {ce}"

    # ZIP coverage by GeoNames must be at least 99% (sanity-check on the mapping).
    latest_ce = max(r["coverage_end"] for r in zip_rows)
    latest_zips = [r for r in zip_rows if r["coverage_end"] == latest_ce]
    with_city = sum(1 for r in latest_zips if r["city"])
    assert with_city / len(latest_zips) >= 0.99


def test_california_city_data_export_schema_and_zips(tmp_path: Path) -> None:
    """california_city_data.csv exposes Q/Q velocity and a comma-separated zips list."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    rows = read_csv(exports_dir / "california_city_data.csv")
    assert rows, "california_city_data.csv must not be empty"

    expected_cols = {"city", "county", "zip_count", "zips",
                     "policies", "prior_policies", "change_pct", "direction",
                     "yoy_change_pct", "yoy_direction"}
    assert expected_cols.issubset(rows[0].keys())

    # Sorted by policies desc.
    policies = [int(r["policies"]) for r in rows]
    assert policies == sorted(policies, reverse=True)

    # ZIPs list is non-empty, comma-separated, and zip_count matches the list length.
    sample = rows[0]
    zips = sample["zips"].split(",")
    assert len(zips) == int(sample["zip_count"])
    assert all(z.isdigit() and len(z) == 5 for z in zips), f"bad ZIPs in {sample}"

    # Known multi-ZIP city Oakland aggregates to a sensible number > any single ZIP.
    oakland = next((r for r in rows if r["city"] == "Oakland"), None)
    assert oakland is not None
    assert int(oakland["zip_count"]) > 1


def test_non_ca_zips_excluded_from_history(tmp_path: Path) -> None:
    """Mailing-address artifacts like 76132 (Fort Worth TX) appear in some
    FAIR Plan 5-year history PDFs but should not enter our processed data."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    normalize(FIXTURES, processed_dir, MANIFEST)
    for name in ("zip_pif_history.csv", "zip_tiv_history.csv", "zip_wide.csv"):
        rows = read_csv(processed_dir / "fair" / name)
        non_ca = [
            r for r in rows
            if r.get("geography_id", r.get("zip", "")) not in ("Total", "")
            and not (r.get("geography_id", r.get("zip", "")).startswith("9"))
        ]
        assert not non_ca, f"non-CA ZIPs leaked into {name}: {non_ca[:3]}"


def test_zip_pif_history_spans_fy2019_through_fy2025(tmp_path: Path) -> None:
    """With the FY2023+FY2024+FY2025 PIF files all ingested, the rolled-up
    zip_pif_history should cover FY2019-FY2025 and statewide Totals must
    match the published values."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    normalize(FIXTURES, processed_dir, MANIFEST)
    rows = read_csv(processed_dir / "fair" / "zip_pif_history.csv")
    fys = sorted({int(r["fiscal_year"]) for r in rows})
    assert fys == [2019, 2020, 2021, 2022, 2023, 2024, 2025]

    totals = {
        int(r["fiscal_year"]): int(r["value"])
        for r in rows
        if r["geography_id"] == "Total" and r["metric"] == "policy_count"
    }
    # Published statewide totals from FAIR Plan PIF history PDFs.
    assert totals[2019] == 155243
    assert totals[2023] == 320572
    assert totals[2025] == 621234


def test_zip_tiv_history_present_and_statewide_match(tmp_path: Path) -> None:
    """FY2024 + FY2025 TIV files should give us exposure history FY2020-FY2025."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    normalize(FIXTURES, processed_dir, MANIFEST)
    rows = read_csv(processed_dir / "fair" / "zip_tiv_history.csv")
    fys = sorted({int(r["fiscal_year"]) for r in rows})
    assert fys == [2020, 2021, 2022, 2023, 2024, 2025]

    totals = {
        int(r["fiscal_year"]): int(r["value"])
        for r in rows
        if r["geography_id"] == "Total" and r["metric"] == "exposure"
    }
    # Sanity-check the statewide exposure at FY2025 ≈ $645B.
    assert 640_000_000_000 < totals[2025] < 650_000_000_000


def test_fair_statewide_history_export(tmp_path: Path) -> None:
    """fair_statewide_history.csv should cover ~15 coverage_ends from 2019 to
    the latest quarter, with granular data winning over snapshots for the
    most recent quarters."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    rows = read_csv(exports_dir / "fair_statewide_history.csv")
    assert len(rows) >= 12, f"expected dense quarterly history; got {len(rows)} rows"

    by_ce = {r["coverage_end"]: r for r in rows}
    # The newest granular quarter wins over any snapshot source.
    latest = by_ce.get("2026-03-31")
    assert latest is not None
    assert int(latest["policy_count"]) == 655204
    assert latest["source"] == "quarterly"

    # Snapshot-only quarter should be tagged correctly.
    snap = by_ce.get("2024-12-31")
    assert snap is not None and snap["source"] == "snapshot"
    assert int(snap["policy_count"]) == 516313


def test_california_zip_history_export_schema(tmp_path: Path) -> None:
    """california_zip_history.csv exposes per-ZIP FY2020-FY2024 policy counts
    with city + county joined in. Sorted by FY2024 desc."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    path = exports_dir / "california_zip_history.csv"
    assert path.exists()
    rows = read_csv(path)
    assert len(rows) >= 1500, f"expected ~1681 ZIPs, got {len(rows)}"

    expected = {"zip", "city", "county", "fy_2021", "fy_2022", "fy_2023", "fy_2024", "fy_2025"}
    assert expected.issubset(rows[0].keys())

    # Sorted by FY2025 desc — first row must have the largest FY2025 value.
    fy2025_values = [int(r["fy_2025"]) if r["fy_2025"] else 0 for r in rows]
    assert fy2025_values == sorted(fy2025_values, reverse=True)

    # Spot-check ZIP 90001 (Los Angeles): FY2024 = 1673, FY2025 jumped to 1976
    # after the wildfire-driven uptick.
    la = next((r for r in rows if r["zip"] == "90001"), None)
    assert la is not None
    assert la["city"] == "Los Angeles"
    assert int(la["fy_2024"]) == 1673
    assert int(la["fy_2025"]) == 1976


def test_cdi_county_market_share_export_schema(tmp_path: Path) -> None:
    """cdi_county_market_share.csv exposes per-county FAIR-share metrics 2020-2023."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    path = exports_dir / "cdi_county_market_share.csv"
    assert path.exists()
    rows = read_csv(path)
    assert rows, "cdi_county_market_share.csv must not be empty"

    expected = {"county", "total_pif_2023", "fair_plan_pif_2023", "fair_plan_share_2023"}
    assert expected.issubset(rows[0].keys())

    # Sanity-check the 2023 share for a well-known county where FAIR has grown materially.
    nevada = next((r for r in rows if r["county"] == "Nevada"), None)
    assert nevada is not None
    assert float(nevada["fair_plan_share_2023"]) > 10.0


def test_yoy_velocity_present_in_all_exports(tmp_path: Path) -> None:
    """county/zip/city exports should expose a Y/Y change for ~99% of rows
    (the small leakage is new geographies that didn't exist in the prior FY)."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    # city_pif_history is a new processed table.
    assert (processed_dir / "fair" / "city_pif_history.csv").exists()

    for name in ("county", "zip", "city"):
        rows = read_csv(exports_dir / f"california_{name}_data.csv")
        with_yoy = [r for r in rows if r["yoy_change_pct"]]
        assert len(with_yoy) / len(rows) >= 0.95, (
            f"{name}: only {len(with_yoy)}/{len(rows)} rows have yoy_change_pct"
        )
        # All yoy_direction values must be from the canonical set.
        assert {r["yoy_direction"] for r in rows} <= {"up", "down", "flat", "new"}


def test_california_zip_data_export_has_quarterly_velocity(tmp_path: Path) -> None:
    """california_zip_data.csv should expose Q/Q change for the latest pair of coverage_ends."""
    from fairplan.io_utils import read_csv

    processed_dir = tmp_path / "processed"
    exports_dir = tmp_path / "exports"
    normalize(FIXTURES, processed_dir, MANIFEST)
    build_exports(processed_dir, exports_dir)

    rows = read_csv(exports_dir / "california_zip_data.csv")
    assert rows, "california_zip_data.csv must not be empty"

    # Schema
    expected_cols = {"zip", "city", "county", "region", "policies", "prior_policies",
                     "change_pct", "direction", "yoy_change_pct", "yoy_direction"}
    assert expected_cols.issubset(rows[0].keys())

    # At least 95% of ZIPs must have a city populated from config/zip_cities.csv.
    populated = sum(1 for r in rows if r.get("city"))
    assert populated / len(rows) >= 0.95, (
        f"only {populated}/{len(rows)} ZIPs got a city — check config/zip_cities.csv coverage"
    )

    # Sorted by policies desc.
    policies = [int(r["policies"]) for r in rows]
    assert policies == sorted(policies, reverse=True)

    # The Q/Q math must match the values in zip_quarterly for a known top ZIP.
    zip_quarterly = read_csv(processed_dir / "fair" / "zip_quarterly.csv")
    coverage_ends = sorted({r["coverage_end"] for r in zip_quarterly})
    latest_ce, prior_ce = coverage_ends[-1], coverage_ends[-2]
    sample = rows[0]
    latest = next(
        int(r["policy_count"])
        for r in zip_quarterly
        if r["zip"] == sample["zip"] and r["coverage_end"] == latest_ce
    )
    prior = next(
        (
            int(r["policy_count"])
            for r in zip_quarterly
            if r["zip"] == sample["zip"] and r["coverage_end"] == prior_ce
        ),
        None,
    )
    assert int(sample["policies"]) == latest
    if prior:
        expected_pct = (latest - prior) / prior * 100
        assert abs(float(sample["change_pct"]) - expected_pct) < 0.05
        if expected_pct > 0.5:
            assert sample["direction"] == "up"
        elif expected_pct < -0.5:
            assert sample["direction"] == "down"
        else:
            assert sample["direction"] == "flat"
