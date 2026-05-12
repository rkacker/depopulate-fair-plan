from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path

from fairplan.fetch import fetch_sources
from fairplan.io_utils import ensure_directory, read_csv, sha256sum, write_csv, write_json
from fairplan.manifest import load_sources
from fairplan.models import SourceConfig
from fairplan.parsers import (
    parse_cdi_county_pdf,
    parse_cdi_fact_sheet_appendix_a,
    parse_distressed_geographies,
    parse_fair_category_pdf,
    parse_fair_history_pdf,
)


CATEGORY_DATASETS = {
    "residential_policy_count": "count",
    "residential_policy_premium": "premium",
    "residential_policy_exposure": "exposure",
}

CATEGORY_FIELDNAMES = [
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
]


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
    cdi_fact_rows: list[dict[str, object]] = []
    distressed_rows: list[dict[str, object]] = []
    category_rows: list[dict[str, object]] = []

    for source in manifest:
        file_path = source.output_path(raw_dir)
        if not file_path.exists():
            continue
        if source.dataset == "residential_zip_pif_history":
            pif_rows.extend(parse_fair_history_pdf(file_path, source, "zip"))
        elif source.dataset == "residential_county_yearly":
            cdi_county_rows.extend(parse_cdi_county_pdf(file_path, source))
        elif source.dataset == "residential_fact_sheet":
            cdi_fact_rows.extend(parse_cdi_fact_sheet_appendix_a(file_path, source))
        elif source.dataset == "distressed_geographies":
            distressed_rows.extend(parse_distressed_geographies(file_path, source))
        elif source.dataset in CATEGORY_DATASETS:
            metric = CATEGORY_DATASETS[source.dataset]
            category_rows.extend(parse_fair_category_pdf(file_path, source, metric))

    zip_pif_rows = [r for r in pif_rows if r["geography_level"] == "zip"]

    write_csv(processed_dir / "fair" / "zip_pif_history.csv", zip_pif_rows, PIF_FIELDNAMES)

    # --- fair/ category breakdown (zip × county × risk_band × policy_category × metric) ---
    write_csv(processed_dir / "fair" / "category_breakdown.csv", category_rows, CATEGORY_FIELDNAMES)

    # --- fair/ quarterly totals (statewide totals per coverage_end × metric) ---
    totals: dict[tuple[str, str, str], int] = {}
    for r in category_rows:
        key = (str(r["coverage_end"]), str(r["metric"]), str(r["source_id"]))
        totals[key] = totals.get(key, 0) + int(r["value"])
    quarterly_total_rows = [
        {"coverage_end": coverage_end, "metric": metric, "value": value, "source_id": source_id}
        for (coverage_end, metric, source_id), value in sorted(totals.items())
    ]
    write_csv(
        processed_dir / "fair" / "quarterly_totals.csv",
        quarterly_total_rows,
        ["coverage_end", "metric", "value", "source_id"],
    )

    # --- fair/ county_quarterly: per-county totals per coverage_end × metric ---
    county_metric_totals: dict[tuple[str, str, str], int] = {}
    county_source_ids: dict[tuple[str, str], str] = {}
    for r in category_rows:
        key = (str(r["coverage_end"]), str(r["county"]), str(r["metric"]))
        county_metric_totals[key] = county_metric_totals.get(key, 0) + int(r["value"])
        county_source_ids[(str(r["coverage_end"]), str(r["metric"]))] = str(r["source_id"])
    county_quarterly_rows: list[dict[str, object]] = []
    seen_pairs: set[tuple[str, str]] = set()
    for (coverage_end, county, _metric), _value in sorted(county_metric_totals.items()):
        pair = (coverage_end, county)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        county_quarterly_rows.append({
            "coverage_end": coverage_end,
            "county": county,
            "policy_count": county_metric_totals.get((coverage_end, county, "count"), 0),
            "premium": county_metric_totals.get((coverage_end, county, "premium"), 0),
            "exposure": county_metric_totals.get((coverage_end, county, "exposure"), 0),
            "source_id_count": county_source_ids.get((coverage_end, "count"), ""),
            "source_id_premium": county_source_ids.get((coverage_end, "premium"), ""),
            "source_id_exposure": county_source_ids.get((coverage_end, "exposure"), ""),
        })
    write_csv(
        processed_dir / "fair" / "county_quarterly.csv",
        county_quarterly_rows,
        ["coverage_end", "county", "policy_count", "premium", "exposure",
         "source_id_count", "source_id_premium", "source_id_exposure"],
    )

    # --- fair/ county_pif_history: synthetic, residential-only, derived by rolling up
    # the DWE ZIP file using the ZIP -> county mapping baked into the category PDFs. ---
    zip_to_county: dict[str, str] = {}
    for r in category_rows:
        zip_to_county.setdefault(str(r["zip"]), str(r["county"]))
    county_pif_rows = _build_county_pif_from_zip_rollup(zip_pif_rows, zip_to_county)
    write_csv(processed_dir / "fair" / "county_pif_history.csv", county_pif_rows, PIF_FIELDNAMES)
    pif_rows = zip_pif_rows + county_pif_rows

    # --- cdi/ base tables (deduplicate: State rows repeat across PDF pages) ---
    cdi_deduped: dict[tuple, dict] = {}
    for r in cdi_county_rows:
        key = (r["year"], r["county"], r["market_segment"], r["flow_metric"])
        cdi_deduped[key] = r
    cdi_county_deduped = list(cdi_deduped.values())

    write_csv(
        processed_dir / "cdi" / "county_yearly.csv",
        cdi_county_deduped,
        ["year", "county", "market_segment", "flow_metric", "value", "source_id"],
    )

    distressed_county_rows = [r for r in distressed_rows if r["geo_type"] == "county"]
    distressed_zip_rows = [r for r in distressed_rows if r["geo_type"] == "zip"]

    write_csv(processed_dir / "cdi" / "distressed_counties.csv", distressed_county_rows, DISTRESSED_FIELDNAMES)
    write_csv(processed_dir / "cdi" / "distressed_zips.csv", distressed_zip_rows, DISTRESSED_FIELDNAMES)

    # --- cdi/ statewide fact sheet (2015-2023, includes surplus lines) ---
    write_csv(
        processed_dir / "cdi" / "statewide_yearly.csv",
        cdi_fact_rows,
        ["year", "market_segment", "flow_metric", "value", "source_id"],
    )

    # --- cdi/ wide: county market summary (one row per county, columns per segment) ---
    cdi_years = sorted({int(r["year"]) for r in cdi_county_deduped})
    if cdi_years:
        _build_cdi_county_wide(processed_dir, cdi_county_deduped, cdi_years)

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

    # --- fair/ derived: county rankings (latest quarterly snapshot, sorted by policy count) ---
    if county_quarterly_rows:
        latest_coverage_end = max(r["coverage_end"] for r in county_quarterly_rows)
        latest_rows = [r for r in county_quarterly_rows if r["coverage_end"] == latest_coverage_end]
        latest_rows.sort(key=lambda r: int(r["policy_count"]), reverse=True)
        write_csv(
            processed_dir / "fair" / "county_rankings.csv",
            [
                {
                    "county": r["county"],
                    "policy_count": r["policy_count"],
                    "premium": r["premium"],
                    "exposure": r["exposure"],
                    "coverage_end": r["coverage_end"],
                    "source_id": r["source_id_count"],
                }
                for r in latest_rows
            ],
            ["county", "policy_count", "premium", "exposure", "coverage_end", "source_id"],
        )

    # --- analysis/ derived: distressed PIF growth (FAIR PIF + CDI distressed) ---
    distressed_county_set = frozenset(r["geo_name"] for r in distressed_county_rows)
    distressed_zip_set = frozenset(r["geo_id"] for r in distressed_zip_rows)

    fiscal_years = sorted({int(r["fiscal_year"]) for r in pif_rows})
    year_cols = [f"policy_count_{y}" for y in fiscal_years]
    fieldnames = ["geography_name", "is_distressed"] + year_cols

    def _build_distressed_wide(geo_level: str, distressed_set: frozenset[str], id_field: str) -> list[dict]:
        lookup: dict[str, dict] = {}
        for r in pif_rows:
            if r["geography_level"] != geo_level or r["geography_id"] == "Total":
                continue
            name = r["geography_name"]
            if name not in lookup:
                lookup[name] = {
                    "geography_name": name,
                    "is_distressed": int(r[id_field] in distressed_set),
                }
                for col in year_cols:
                    lookup[name][col] = ""
            lookup[name][f"policy_count_{int(r['fiscal_year'])}"] = int(r["value"])
        return sorted(lookup.values(), key=lambda row: row["geography_name"])

    write_csv(
        processed_dir / "analysis" / "distressed_county_pif.csv",
        _build_distressed_wide("county", distressed_county_set, "geography_name"),
        fieldnames,
    )
    write_csv(
        processed_dir / "analysis" / "distressed_zip_pif.csv",
        _build_distressed_wide("zip", distressed_zip_set, "geography_id"),
        fieldnames,
    )

    # --- analysis/ derived: distressed-flag reconciliation (FAIR Plan inline vs CDI list) ---
    if category_rows:
        latest_coverage_end = max(str(r["coverage_end"]) for r in category_rows)
        zip_flags: dict[str, dict[str, object]] = {}
        for r in category_rows:
            if str(r["coverage_end"]) != latest_coverage_end:
                continue
            z = str(r["zip"])
            if z not in zip_flags:
                zip_flags[z] = {
                    "zip": z,
                    "county": str(r["county"]),
                    "fair_plan_flag": int(r["is_distressed_area"]),
                    "cdi_flag": int(z in distressed_zip_set),
                }
        reconciliation_rows = sorted(zip_flags.values(), key=lambda r: r["zip"])
        for r in reconciliation_rows:
            r["agree"] = int(r["fair_plan_flag"] == r["cdi_flag"])
        write_csv(
            processed_dir / "analysis" / "distressed_zip_reconciliation.csv",
            reconciliation_rows,
            ["zip", "county", "fair_plan_flag", "cdi_flag", "agree"],
        )

    # --- analysis/ derived: Senate district PIF estimates ---
    build_senate_district_exports(processed_dir)


def build_exports(processed_dir: Path, exports_dir: Path) -> None:
    """Generate JSON/CSV exports for website visualization."""
    quarterly = read_csv(processed_dir / "fair" / "quarterly_totals.csv")
    county_rankings = read_csv(processed_dir / "fair" / "county_rankings.csv")
    zip_pif = read_csv(processed_dir / "fair" / "zip_pif_history.csv")

    # --- site_stats.json ---
    count_rows = sorted(
        [r for r in quarterly if r["metric"] == "count"],
        key=lambda r: r["coverage_end"],
    )
    current_row = count_rows[-1]
    current_value = int(current_row["value"])

    fy_totals: dict[int, int] = {}
    for row in zip_pif:
        if row["geography_id"] == "Total":
            fy_totals[int(row["fiscal_year"])] = int(row["value"])
    earliest_year = min(fy_totals.keys())
    earliest_value = fy_totals[earliest_year]
    current_date = date.fromisoformat(current_row["coverage_end"])
    target_date = date(current_date.year - 1, current_date.month, current_date.day)
    fy_prior_year = max(y for y in fy_totals if date(y, 9, 30) <= target_date)
    fy_prior_value = fy_totals[fy_prior_year]
    fy_prior_coverage_end = f"{fy_prior_year}-09-30"

    growth_multiple = round(current_value / earliest_value, 1) if earliest_value else 0
    growth_label = f"{growth_multiple:.0f}x" if growth_multiple == int(growth_multiple) else f"{growth_multiple}x"

    current_label = _format_snapshot_label(current_row["coverage_end"])
    prior_label = _format_snapshot_label(fy_prior_coverage_end)
    current_long = _format_snapshot_long(current_row["coverage_end"])
    prior_long = _format_snapshot_long(fy_prior_coverage_end)

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
                "value": _format_short(fy_prior_value),
                "label": prior_label,
                "detail": f"Policies as of {prior_long}",
            },
            "current_year": {
                "value": _format_short(current_value),
                "label": current_label,
                "detail": f"Policies as of {current_long}",
            },
            "growth": {
                "value": growth_label,
                "label": "Growth Rate",
                "detail": f"Since FY {earliest_year}",
            },
        },
        "map": {
            "title": f"FAIR Plan Crisis Map ({current_label})",
            "description": (
                f"Explore how FAIR Plan policies are distributed across California's "
                f"58 counties. Data current through {current_long}."
            ),
            "data_source": f"California FAIR Plan data through {current_long}",
            "total_label": f"Total FAIR Plan Policies in California ({current_label})",
        },
        "table": {
            "description": f"FAIR Plan policies by county as of {current_long}",
            "data_source": f"Data source: California FAIR Plan through {current_long}",
        },
    }
    write_json(exports_dir / "site_stats.json", site_stats)

    # --- california_county_data.csv (with per-county quarterly velocity) ---
    county_quarterly = read_csv(processed_dir / "fair" / "county_quarterly.csv")
    coverage_ends = sorted({r["coverage_end"] for r in county_quarterly})
    latest_ce = coverage_ends[-1] if coverage_ends else ""
    prior_ce = coverage_ends[-2] if len(coverage_ends) >= 2 else ""
    prior_by_county = {
        r["county"]: int(r["policy_count"])
        for r in county_quarterly
        if r["coverage_end"] == prior_ce
    }
    county_rows = []
    for r in county_rankings:
        county = r["county"]
        policies = int(r["policy_count"])
        prior_policies = prior_by_county.get(county)
        if prior_policies is None or prior_policies == 0:
            change_pct = ""
            direction = "new"
        else:
            change = (policies - prior_policies) / prior_policies * 100
            change_pct = f"{change:.1f}"
            if change > 0.5:
                direction = "up"
            elif change < -0.5:
                direction = "down"
            else:
                direction = "flat"
        county_rows.append({
            "county": county,
            "policies": policies,
            "prior_policies": prior_policies if prior_policies is not None else "",
            "change_pct": change_pct,
            "direction": direction,
        })
    write_csv(
        exports_dir / "california_county_data.csv",
        county_rows,
        ["county", "policies", "prior_policies", "change_pct", "direction"],
    )

    # --- quarterly_totals.json (statewide totals by coverage_end × metric) ---
    quarterly_rows = read_csv(processed_dir / "fair" / "quarterly_totals.csv")
    by_period: dict[str, dict[str, object]] = {}
    for row in quarterly_rows:
        entry = by_period.setdefault(
            row["coverage_end"],
            {"coverage_end": row["coverage_end"], "source_ids": {}, "totals": {}},
        )
        entry["totals"][row["metric"]] = int(row["value"])
        entry["source_ids"][row["metric"]] = row["source_id"]
    periods = sorted(by_period.values(), key=lambda r: r["coverage_end"])
    write_json(exports_dir / "quarterly_totals.json", {"periods": periods})



def build_insights(processed_dir: Path, exports_dir: Path, insights_dir: Path) -> Path:
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
            f"- {row['county']}: {int(row['policy_count']):,} policies as of {row['coverage_end']}."
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
    insight_path = insights_dir / "market_health_report.md"
    ensure_directory(insight_path.parent)
    insight_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return insight_path


def build_senate_district_exports(processed_dir: Path, config_dir: Path | None = None) -> None:
    """Apportion county PIF data to Senate districts using population-weighted crosswalk."""
    config_dir = config_dir or Path("config")
    county_pif = read_csv(processed_dir / "fair" / "county_pif_history.csv")
    crosswalk = read_csv(config_dir / "county_senate_district_crosswalk.csv")
    members = read_csv(config_dir / "senate_members.csv")

    # Build lookups
    senator_lookup = {int(r["senate_district"]): r for r in members}

    # county_name -> [(district, weight), ...]
    from collections import defaultdict
    county_to_districts: dict[str, list[tuple[int, float]]] = defaultdict(list)
    for r in crosswalk:
        county_to_districts[r["county_name"]].append(
            (int(r["senate_district"]), float(r["population_weight"]))
        )

    # county_name -> {fiscal_year -> value}
    county_pif_by_year: dict[str, dict[int, int]] = defaultdict(dict)
    for r in county_pif:
        if r["geography_id"] == "Total":
            continue
        county_pif_by_year[r["geography_name"]][int(r["fiscal_year"])] = int(r["value"])

    fiscal_years = sorted({int(r["fiscal_year"]) for r in county_pif if r["geography_id"] != "Total"})

    # Accumulate district totals
    district_pif: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    for county_name, year_vals in county_pif_by_year.items():
        for district, weight in county_to_districts.get(county_name, []):
            for fy, val in year_vals.items():
                district_pif[district][fy] += val * weight

    # --- CDI total market PIF (2023) apportioned to districts ---
    cdi_pif_wide_path = processed_dir / "cdi" / "county_pif_wide.csv"
    district_total_pif: dict[int, float] = defaultdict(float)
    district_fair_pif: dict[int, float] = defaultdict(float)
    if cdi_pif_wide_path.exists():
        cdi_pif_wide = read_csv(cdi_pif_wide_path)
        for r in cdi_pif_wide:
            county = r["county"]
            if county == "State":
                continue
            total = int(r.get("total_pif_2023", 0))
            fair = int(r.get("fair_plan_pif_2023", 0))
            for district, weight in county_to_districts.get(county, []):
                district_total_pif[district] += total * weight
                district_fair_pif[district] += fair * weight

    # Build wide-format rows
    year_cols = [f"policy_count_{y}" for y in fiscal_years]
    has_cdi = bool(district_total_pif)
    cdi_cols = ["cdi_total_pif_2023", "cdi_fair_plan_pif_2023"] if has_cdi else []

    rows: list[dict[str, object]] = []
    for district in sorted(district_pif.keys()):
        senator = senator_lookup.get(district, {})
        row: dict[str, object] = {
            "senate_district": district,
            "senator_name": senator.get("senator_name", ""),
            "party": senator.get("party", ""),
        }
        for fy in fiscal_years:
            row[f"policy_count_{fy}"] = round(district_pif[district].get(fy, 0))
        if has_cdi:
            row["cdi_total_pif_2023"] = round(district_total_pif.get(district, 0))
            row["cdi_fair_plan_pif_2023"] = round(district_fair_pif.get(district, 0))
        rows.append(row)

    # Sort by latest year descending
    latest_col = f"policy_count_{fiscal_years[-1]}"
    rows.sort(key=lambda r: r[latest_col], reverse=True)

    write_csv(
        processed_dir / "analysis" / "senate_district_pif.csv",
        rows,
        ["senate_district", "senator_name", "party"] + year_cols + cdi_cols,
    )


def _build_cdi_county_wide(
    processed_dir: Path,
    cdi_county_deduped: list[dict],
    cdi_years: list[int],
) -> None:
    """Build wide-format CDI county files for reuse in analyses.

    Produces two files:
    - cdi/county_pif_wide.csv: one row per county, columns = total PIF per year
      (voluntary new+renewed + fair_plan new+renewed; DIC excluded as supplemental)
    - cdi/county_market_wide.csv: one row per county, columns per segment/flow/year
    """
    # --- county_market_wide.csv: full detail, one row per county ---
    segments = [
        ("voluntary", "new"),
        ("voluntary", "renewed"),
        ("voluntary", "nonrenewed"),
        ("fair_plan", "new"),
        ("fair_plan", "renewed"),
        ("dic", "new"),
        ("dic", "renewed"),
    ]
    # Build lookup: (county, year, segment, flow) -> value
    detail: dict[tuple[str, int, str, str], int] = {}
    for r in cdi_county_deduped:
        detail[(r["county"], int(r["year"]), r["market_segment"], r["flow_metric"])] = int(r["value"])

    counties = sorted({r["county"] for r in cdi_county_deduped})

    # Wide columns: segment_flow_year (e.g. voluntary_new_2020)
    detail_cols: list[str] = []
    for seg, flow in segments:
        for y in cdi_years:
            detail_cols.append(f"{seg}_{flow}_{y}")

    detail_rows: list[dict[str, object]] = []
    for county in counties:
        row: dict[str, object] = {"county": county}
        for seg, flow in segments:
            for y in cdi_years:
                row[f"{seg}_{flow}_{y}"] = detail.get((county, y, seg, flow), 0)
        detail_rows.append(row)

    write_csv(
        processed_dir / "cdi" / "county_market_wide.csv",
        detail_rows,
        ["county"] + detail_cols,
    )

    # --- county_pif_wide.csv: total PIF estimate per county per year ---
    # PIF ≈ new + renewed for voluntary + fair_plan only.
    # DIC excluded: supplemental policies attached to FAIR Plan, not independent coverage.
    pif_segments = [
        ("voluntary", "new"),
        ("voluntary", "renewed"),
        ("fair_plan", "new"),
        ("fair_plan", "renewed"),
    ]
    pif_cols = [f"total_pif_{y}" for y in cdi_years]
    fair_cols = [f"fair_plan_pif_{y}" for y in cdi_years]
    share_cols = [f"fair_plan_share_{y}" for y in cdi_years]

    pif_rows: list[dict[str, object]] = []
    for county in counties:
        row = {"county": county}
        for y in cdi_years:
            total = sum(detail.get((county, y, seg, flow), 0) for seg, flow in pif_segments)
            fair = (
                detail.get((county, y, "fair_plan", "new"), 0)
                + detail.get((county, y, "fair_plan", "renewed"), 0)
            )
            row[f"total_pif_{y}"] = total
            row[f"fair_plan_pif_{y}"] = fair
            row[f"fair_plan_share_{y}"] = round(fair / total * 100, 1) if total else 0
        pif_rows.append(row)

    write_csv(
        processed_dir / "cdi" / "county_pif_wide.csv",
        pif_rows,
        ["county"] + pif_cols + fair_cols + share_cols,
    )


def _build_county_pif_from_zip_rollup(
    zip_pif_rows: list[dict[str, object]],
    zip_to_county: dict[str, str],
) -> list[dict[str, object]]:
    if not zip_pif_rows:
        return []
    by_county_fy: dict[tuple[str, int], dict[str, object]] = {}
    state_by_fy: dict[int, dict[str, object]] = {}
    for r in zip_pif_rows:
        if r["metric"] != "policy_count":
            continue
        fy = int(r["fiscal_year"])
        if r["geography_id"] == "Total":
            existing = state_by_fy.get(fy)
            current_total = int(existing["value"]) if existing else 0
            state_by_fy[fy] = {
                "coverage_end": r["coverage_end"],
                "fiscal_year": fy,
                "period_end": r["period_end"],
                "geography_level": "county",
                "geography_id": "Total",
                "geography_name": "Total",
                "metric": "policy_count",
                "value": max(current_total, int(r["value"])),
                "yoy_growth_pct": "",
                "source_id": r["source_id"],
            }
            continue
        county = zip_to_county.get(str(r["geography_id"]))
        if not county:
            continue
        key = (county, fy)
        entry = by_county_fy.get(key)
        if entry is None:
            entry = {
                "coverage_end": r["coverage_end"],
                "fiscal_year": fy,
                "period_end": r["period_end"],
                "geography_level": "county",
                "geography_id": county,
                "geography_name": county,
                "metric": "policy_count",
                "value": 0,
                "yoy_growth_pct": "",
                "source_id": r["source_id"],
            }
            by_county_fy[key] = entry
        entry["value"] = int(entry["value"]) + int(r["value"])

    counties = sorted({county for (county, _fy) in by_county_fy})
    years = sorted({fy for (_county, fy) in by_county_fy})
    prior: dict[tuple[str, int], int] = {}
    for fy in years:
        for county in counties:
            entry = by_county_fy.get((county, fy))
            if entry is None:
                continue
            prior_val = prior.get((county, fy - 1))
            if prior_val is not None and prior_val > 0:
                growth = (int(entry["value"]) - prior_val) / prior_val * 100
                entry["yoy_growth_pct"] = f"{growth:.1f}"
            prior[(county, fy)] = int(entry["value"])

    rows: list[dict[str, object]] = []
    for fy in years:
        for county in counties:
            entry = by_county_fy.get((county, fy))
            if entry is not None:
                rows.append(entry)
        if fy in state_by_fy:
            rows.append(state_by_fy[fy])
    return rows


_MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def _format_snapshot_label(coverage_end: str) -> str:
    year, month, day = coverage_end.split("-")
    return f"{_MONTH_NAMES[int(month)][:3]} {int(day)}, {year}"


def _format_snapshot_long(coverage_end: str) -> str:
    year, month, day = coverage_end.split("-")
    return f"{_MONTH_NAMES[int(month)]} {int(day)}, {year}"


def _format_display(value: int) -> str:
    rounded = (value // 10_000) * 10_000
    return f"{rounded:,}"


def _format_short(value: int) -> str:
    """Format as compact string (e.g. 642010 -> '642K')."""
    return f"{value // 1000}K"


def fetch_command(raw_dir: Path, manifest_path: Path | None = None) -> None:
    sources = load_sources(manifest_path or default_manifest_path())
    fetch_sources(sources, raw_dir)
