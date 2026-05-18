from __future__ import annotations

import shutil
from datetime import UTC, datetime
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


def _is_ca_zip(z: str) -> bool:
    """California ZIPs are 90000-96199. Any 5-digit ZIP starting with '9'
    qualifies. Filters out mailing-address artifacts like 76132 (Fort Worth TX)
    that occasionally appear in the FAIR Plan 5-year history PDFs."""
    return len(z) == 5 and z.isdigit() and z.startswith("9")


def _dedupe_history_rows(rows: list[dict[str, object]], pub_dates: dict[str, str]) -> list[dict[str, object]]:
    """When multiple 5-year history files overlap on the same geography/fiscal_year,
    keep the row from the source with the most recent published_date."""
    best: dict[tuple, dict[str, object]] = {}
    for r in rows:
        key = (r["geography_level"], r["geography_id"], int(r["fiscal_year"]), r["metric"])
        existing = best.get(key)
        if existing is None or pub_dates.get(str(r["source_id"]), "") > pub_dates.get(str(existing["source_id"]), ""):
            best[key] = r
    return list(best.values())


def normalize(raw_dir: Path, processed_dir: Path, manifest_path: Path | None = None) -> None:
    """Parse PDFs and write analysis-ready CSVs to processed_dir."""
    manifest = load_sources(manifest_path or default_manifest_path())
    pub_dates: dict[str, str] = {s.id: s.published_date or "" for s in manifest}
    pif_rows: list[dict[str, object]] = []
    tiv_rows: list[dict[str, object]] = []
    cdi_county_rows: list[dict[str, object]] = []
    cdi_fact_rows: list[dict[str, object]] = []
    distressed_rows: list[dict[str, object]] = []
    category_rows: list[dict[str, object]] = []

    for source in manifest:
        file_path = source.output_path(raw_dir)
        if not file_path.exists():
            continue
        if source.dataset == "residential_zip_pif_history":
            pif_rows.extend(parse_fair_history_pdf(file_path, source, "zip", metric="policy_count"))
        elif source.dataset == "residential_zip_tiv_history":
            tiv_rows.extend(parse_fair_history_pdf(file_path, source, "zip", metric="exposure"))
        elif source.dataset == "residential_county_yearly":
            cdi_county_rows.extend(parse_cdi_county_pdf(file_path, source))
        elif source.dataset == "residential_fact_sheet":
            cdi_fact_rows.extend(parse_cdi_fact_sheet_appendix_a(file_path, source))
        elif source.dataset == "distressed_geographies":
            distressed_rows.extend(parse_distressed_geographies(file_path, source))
        elif source.dataset in CATEGORY_DATASETS:
            metric = CATEGORY_DATASETS[source.dataset]
            category_rows.extend(parse_fair_category_pdf(file_path, source, metric))

    # Dedupe overlapping fiscal years across history files; newer file wins.
    pif_rows = _dedupe_history_rows(pif_rows, pub_dates)
    tiv_rows = _dedupe_history_rows(tiv_rows, pub_dates)
    # Drop non-California ZIPs (mailing-address artifacts in the source PDFs).
    # The "Total" sentinel rows are kept intact.
    def _keep(r: dict[str, object]) -> bool:
        gid = str(r["geography_id"])
        return gid == "Total" or _is_ca_zip(gid)
    zip_pif_rows = [r for r in pif_rows if r["geography_level"] == "zip" and _keep(r)]
    zip_tiv_rows = [r for r in tiv_rows if r["geography_level"] == "zip" and _keep(r)]

    write_csv(processed_dir / "fair" / "zip_pif_history.csv", zip_pif_rows, PIF_FIELDNAMES)
    write_csv(processed_dir / "fair" / "zip_tiv_history.csv", zip_tiv_rows, PIF_FIELDNAMES)

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

    # --- fair/ zip_quarterly: per-ZIP totals per coverage_end × metric ---
    zip_to_city = _load_zip_cities()
    zip_metric_totals: dict[tuple[str, str, str], int] = {}
    zip_meta: dict[str, dict[str, str]] = {}
    zip_source_ids: dict[tuple[str, str], str] = {}
    zip_pairs: set[tuple[str, str]] = set()
    for r in category_rows:
        ce = str(r["coverage_end"])
        z = str(r["zip"])
        zip_metric_totals[(ce, z, str(r["metric"]))] = (
            zip_metric_totals.get((ce, z, str(r["metric"])), 0) + int(r["value"])
        )
        zip_meta.setdefault(z, {"county": str(r["county"]), "region": str(r["region"])})
        zip_source_ids[(ce, str(r["metric"]))] = str(r["source_id"])
        zip_pairs.add((ce, z))
    zip_quarterly_rows: list[dict[str, object]] = [
        {
            "coverage_end": ce,
            "zip": z,
            "city": zip_to_city.get(z, ""),
            "county": zip_meta[z]["county"],
            "region": zip_meta[z]["region"],
            "policy_count": zip_metric_totals.get((ce, z, "count"), 0),
            "premium": zip_metric_totals.get((ce, z, "premium"), 0),
            "exposure": zip_metric_totals.get((ce, z, "exposure"), 0),
            "source_id_count": zip_source_ids.get((ce, "count"), ""),
            "source_id_premium": zip_source_ids.get((ce, "premium"), ""),
            "source_id_exposure": zip_source_ids.get((ce, "exposure"), ""),
        }
        for ce, z in sorted(zip_pairs)
    ]
    write_csv(
        processed_dir / "fair" / "zip_quarterly.csv",
        zip_quarterly_rows,
        ["coverage_end", "zip", "city", "county", "region", "policy_count", "premium", "exposure",
         "source_id_count", "source_id_premium", "source_id_exposure"],
    )

    # --- fair/ zip_wide.csv: one row per ZIP, columns per (metric, period).
    # Combines granular quarterly snapshots (count + exposure) with FY-end
    # annual values from the PIF/TIV history files. Periods present depend on
    # the source files we have ingested; missing values render as empty.
    _write_zip_wide(
        processed_dir,
        zip_quarterly_rows=zip_quarterly_rows,
        zip_pif_rows=zip_pif_rows,
        zip_tiv_rows=zip_tiv_rows,
    )

    # --- fair/ city_quarterly: per-city totals (ZIPs grouped by GeoNames city) ---
    city_metric_totals: dict[tuple[str, str, str], int] = {}
    city_zip_policies: dict[tuple[str, str], dict[str, int]] = {}
    city_county_counts: dict[str, dict[str, int]] = {}
    for row in zip_quarterly_rows:
        city = str(row["city"])
        if not city:
            continue
        ce = str(row["coverage_end"])
        for metric in ("policy_count", "premium", "exposure"):
            key = (ce, city, metric)
            city_metric_totals[key] = city_metric_totals.get(key, 0) + int(row[metric])
        city_zip_policies.setdefault((ce, city), {})[str(row["zip"])] = int(row["policy_count"])
        counties = city_county_counts.setdefault(city, {})
        counties[str(row["county"])] = counties.get(str(row["county"]), 0) + 1

    city_quarterly_rows: list[dict[str, object]] = []
    for ce, city in sorted(city_zip_policies):
        # ZIPs sorted by their own policy count desc so truncation preserves the largest.
        zips_sorted = sorted(
            city_zip_policies[(ce, city)].items(),
            key=lambda kv: (-kv[1], kv[0]),
        )
        counties = city_county_counts[city]
        # Alphabetical tiebreak when a city straddles counties (only ~2 in CA).
        dominant_county = max(sorted(counties), key=counties.get)
        city_quarterly_rows.append({
            "coverage_end": ce,
            "city": city,
            "county": dominant_county,
            "zip_count": len(zips_sorted),
            "zips": ",".join(z for z, _ in zips_sorted),
            "policy_count": city_metric_totals.get((ce, city, "policy_count"), 0),
            "premium": city_metric_totals.get((ce, city, "premium"), 0),
            "exposure": city_metric_totals.get((ce, city, "exposure"), 0),
            "source_id_count": zip_source_ids.get((ce, "count"), ""),
            "source_id_premium": zip_source_ids.get((ce, "premium"), ""),
            "source_id_exposure": zip_source_ids.get((ce, "exposure"), ""),
        })
    write_csv(
        processed_dir / "fair" / "city_quarterly.csv",
        city_quarterly_rows,
        ["coverage_end", "city", "county", "zip_count", "zips",
         "policy_count", "premium", "exposure",
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

    # --- fair/ city_pif_history: rollup of zip_pif_history by GeoNames city ---
    city_pif_rows = _build_city_pif_from_zip_rollup(zip_pif_rows, zip_to_city)
    write_csv(processed_dir / "fair" / "city_pif_history.csv", city_pif_rows, PIF_FIELDNAMES)

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
    earliest_coverage_end = f"{earliest_year}-09-30"

    growth_multiple = round(current_value / earliest_value, 1) if earliest_value else 0
    growth_label = f"{growth_multiple:.0f}x" if growth_multiple == int(growth_multiple) else f"{growth_multiple}x"

    current_label = _format_snapshot_label(current_row["coverage_end"])
    prior_label = _format_snapshot_label(earliest_coverage_end)
    current_long = _format_snapshot_long(current_row["coverage_end"])
    prior_long = _format_snapshot_long(earliest_coverage_end)

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
                "value": _format_short(earliest_value),
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
            "title": "FAIR Plan Crisis Map",
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
    yoy_by_county = _latest_fy_changes(
        read_csv(processed_dir / "fair" / "county_pif_history.csv"),
        "geography_name",
    )
    county_rows = []
    for r in county_rankings:
        county = r["county"]
        policies = int(r["policy_count"])
        prior_policies = prior_by_county.get(county)
        change_pct, direction = _classify_change(policies, prior_policies)
        yoy_latest, yoy_prior = yoy_by_county.get(county, (0, None))
        yoy_change_pct, yoy_direction = _classify_change(yoy_latest, yoy_prior)
        county_rows.append({
            "county": county,
            "policies": policies,
            "prior_policies": prior_policies if prior_policies is not None else "",
            "change_pct": change_pct,
            "direction": direction,
            "yoy_change_pct": yoy_change_pct,
            "yoy_direction": yoy_direction,
        })
    write_csv(
        exports_dir / "california_county_data.csv",
        county_rows,
        ["county", "policies", "prior_policies", "change_pct", "direction",
         "yoy_change_pct", "yoy_direction"],
    )

    # --- california_zip_data.csv (with per-ZIP quarterly + yearly velocity) ---
    zip_quarterly = read_csv(processed_dir / "fair" / "zip_quarterly.csv")
    zip_coverage_ends = sorted({r["coverage_end"] for r in zip_quarterly})
    zip_latest_ce = zip_coverage_ends[-1] if zip_coverage_ends else ""
    zip_prior_ce = zip_coverage_ends[-2] if len(zip_coverage_ends) >= 2 else ""
    prior_by_zip = {
        r["zip"]: int(r["policy_count"])
        for r in zip_quarterly
        if r["coverage_end"] == zip_prior_ce
    }
    yoy_by_zip = _latest_fy_changes(
        read_csv(processed_dir / "fair" / "zip_pif_history.csv"),
        "geography_id",
    )
    zip_rows: list[dict[str, object]] = []
    for r in zip_quarterly:
        if r["coverage_end"] != zip_latest_ce:
            continue
        policies = int(r["policy_count"])
        prior_policies = prior_by_zip.get(r["zip"])
        change_pct, direction = _classify_change(policies, prior_policies)
        yoy_latest, yoy_prior = yoy_by_zip.get(r["zip"], (0, None))
        yoy_change_pct, yoy_direction = _classify_change(yoy_latest, yoy_prior)
        zip_rows.append({
            "zip": r["zip"],
            "city": r.get("city", ""),
            "county": r["county"],
            "region": r["region"],
            "policies": policies,
            "prior_policies": prior_policies if prior_policies is not None else "",
            "change_pct": change_pct,
            "direction": direction,
            "yoy_change_pct": yoy_change_pct,
            "yoy_direction": yoy_direction,
        })
    zip_rows.sort(key=lambda r: int(r["policies"]), reverse=True)
    write_csv(
        exports_dir / "california_zip_data.csv",
        zip_rows,
        ["zip", "city", "county", "region", "policies", "prior_policies",
         "change_pct", "direction", "yoy_change_pct", "yoy_direction"],
    )

    # --- california_city_data.csv (with per-city quarterly + yearly velocity) ---
    city_quarterly = read_csv(processed_dir / "fair" / "city_quarterly.csv")
    city_coverage_ends = sorted({r["coverage_end"] for r in city_quarterly})
    city_latest_ce = city_coverage_ends[-1] if city_coverage_ends else ""
    city_prior_ce = city_coverage_ends[-2] if len(city_coverage_ends) >= 2 else ""
    prior_by_city = {
        r["city"]: int(r["policy_count"])
        for r in city_quarterly
        if r["coverage_end"] == city_prior_ce
    }
    yoy_by_city = _latest_fy_changes(
        read_csv(processed_dir / "fair" / "city_pif_history.csv"),
        "geography_name",
    )
    city_rows: list[dict[str, object]] = []
    for r in city_quarterly:
        if r["coverage_end"] != city_latest_ce:
            continue
        policies = int(r["policy_count"])
        prior_policies = prior_by_city.get(r["city"])
        change_pct, direction = _classify_change(policies, prior_policies)
        yoy_latest, yoy_prior = yoy_by_city.get(r["city"], (0, None))
        yoy_change_pct, yoy_direction = _classify_change(yoy_latest, yoy_prior)
        city_rows.append({
            "city": r["city"],
            "county": r["county"],
            "zip_count": r["zip_count"],
            "zips": r["zips"],
            "policies": policies,
            "prior_policies": prior_policies if prior_policies is not None else "",
            "change_pct": change_pct,
            "direction": direction,
            "yoy_change_pct": yoy_change_pct,
            "yoy_direction": yoy_direction,
        })
    city_rows.sort(key=lambda r: int(r["policies"]), reverse=True)
    write_csv(
        exports_dir / "california_city_data.csv",
        city_rows,
        ["city", "county", "zip_count", "zips", "policies", "prior_policies",
         "change_pct", "direction", "yoy_change_pct", "yoy_direction"],
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

    # --- cdi_county_market_share.csv: FAIR share of total CA homeowners market ---
    # Sourced from CDI annual data (2020-2023). Renamed on copy for friendlier
    # download labelling on the /data page.
    cdi_pif_wide = processed_dir / "cdi" / "county_pif_wide.csv"
    if cdi_pif_wide.exists():
        shutil.copy(cdi_pif_wide, exports_dir / "cdi_county_market_share.csv")

    # --- california_zip_history.csv: ZIP-level FY2021-FY2025 policy counts ---
    # Project the full zip_wide table to just the columns the /data ZIP history
    # tab needs. Sorted by FY2025 descending (latest year, biggest first).
    zip_wide_path = processed_dir / "fair" / "zip_wide.csv"
    if zip_wide_path.exists():
        zip_history_rows = []
        for r in read_csv(zip_wide_path):
            row = {
                "zip": r["zip"],
                "city": r.get("city", ""),
                "county": r.get("county", ""),
            }
            for fy in (2021, 2022, 2023, 2024, 2025):
                row[f"fy_{fy}"] = r.get(f"policy_count_{fy}-09-30", "")
            zip_history_rows.append(row)
        zip_history_rows.sort(
            key=lambda row: int(row["fy_2025"]) if row["fy_2025"] != "" else 0,
            reverse=True,
        )
        write_csv(
            exports_dir / "california_zip_history.csv",
            zip_history_rows,
            ["zip", "city", "county", "fy_2021", "fy_2022", "fy_2023", "fy_2024", "fy_2025"],
        )

    # --- fair_statewide_history.csv: long-running statewide quarterly + annual series ---
    # Merges three sources, newest wins for any (coverage_end, metric):
    #   1. quarterly_totals.csv      — granular DWE files (count + premium + exposure)
    #   2. zip_pif/tiv_history Total — FY-end annual rows from 5-year history PDFs
    #   3. config/fair_statewide_quarterly_history.csv — hand-curated gap quarters
    #      from webpage chart snapshots (Mar 2024 / July 2024 / Aug 2024 /
    #      Mar 2025 / April 2025 captures)
    _write_statewide_history(processed_dir, exports_dir)



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


def _build_city_pif_from_zip_rollup(
    zip_pif_rows: list[dict[str, object]],
    zip_to_city: dict[str, str],
) -> list[dict[str, object]]:
    """Roll up ZIP-level fiscal-year PIF history into per-city totals.

    Skips ZIPs without a city mapping (~0.1%). No state-total row — that
    lives in county_pif_history.csv.
    """
    if not zip_pif_rows:
        return []
    by_city_fy: dict[tuple[str, int], dict[str, object]] = {}
    for r in zip_pif_rows:
        if r["metric"] != "policy_count" or r["geography_id"] == "Total":
            continue
        city = zip_to_city.get(str(r["geography_id"]))
        if not city:
            continue
        fy = int(r["fiscal_year"])
        entry = by_city_fy.get((city, fy))
        if entry is None:
            entry = {
                "coverage_end": r["coverage_end"],
                "fiscal_year": fy,
                "period_end": r["period_end"],
                "geography_level": "city",
                "geography_id": city,
                "geography_name": city,
                "metric": "policy_count",
                "value": 0,
                "yoy_growth_pct": "",
                "source_id": r["source_id"],
            }
            by_city_fy[(city, fy)] = entry
        entry["value"] = int(entry["value"]) + int(r["value"])

    cities = sorted({c for (c, _fy) in by_city_fy})
    years = sorted({fy for (_c, fy) in by_city_fy})
    prior: dict[tuple[str, int], int] = {}
    for fy in years:
        for city in cities:
            entry = by_city_fy.get((city, fy))
            if entry is None:
                continue
            prior_val = prior.get((city, fy - 1))
            if prior_val is not None and prior_val > 0:
                growth = (int(entry["value"]) - prior_val) / prior_val * 100
                entry["yoy_growth_pct"] = f"{growth:.1f}"
            prior[(city, fy)] = int(entry["value"])

    return [
        by_city_fy[(c, fy)]
        for fy in years
        for c in cities
        if (c, fy) in by_city_fy
    ]


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


def _latest_fy_changes(
    pif_rows: list[dict[str, object]],
    key_field: str,
) -> dict[str, tuple[int, int | None]]:
    """For each geography, return (latest_fy_value, prior_fy_value).

    Used to compute year-over-year change off the fiscal-year PIF history.
    Skips the "Total" sentinel rows.
    """
    geo_rows = [r for r in pif_rows if r[key_field] != "Total"]
    if not geo_rows:
        return {}
    fys = sorted({int(r["fiscal_year"]) for r in geo_rows})
    if not fys:
        return {}
    latest = fys[-1]
    prior = fys[-2] if len(fys) >= 2 else None
    latest_map = {r[key_field]: int(r["value"]) for r in geo_rows if int(r["fiscal_year"]) == latest}
    prior_map = {r[key_field]: int(r["value"]) for r in geo_rows if int(r["fiscal_year"]) == prior} if prior else {}
    return {name: (val, prior_map.get(name)) for name, val in latest_map.items()}


def _classify_change(policies: int, prior: int | None) -> tuple[str, str]:
    """Compute (change_pct_str, direction) for the latest vs prior comparison.

    Direction is "new" when there's no prior, otherwise "up"/"down"/"flat"
    against a ±0.5% threshold. Used identically for county, ZIP, and city exports.
    """
    if not prior:
        return "", "new"
    change = (policies - prior) / prior * 100
    direction = "up" if change > 0.5 else "down" if change < -0.5 else "flat"
    return f"{change:.1f}", direction


def _write_statewide_history(processed_dir: Path, exports_dir: Path) -> None:
    """Build fair_statewide_history.csv — one row per coverage_end, columns
    policy_count / exposure / premium / source. Order of precedence per cell:
    granular quarterly > FY history (Total row) > curated snapshot CSV.
    """
    series: dict[str, dict[str, object]] = {}
    sources: dict[str, dict[str, str]] = {}

    def write_cell(ce: str, metric: str, value: int | None, source_label: str) -> None:
        if value in (None, ""):
            return
        row = series.setdefault(
            ce,
            {"coverage_end": ce, "policy_count": "", "exposure": "", "premium": "", "source": ""},
        )
        row[metric] = int(value)
        sources.setdefault(ce, {})[metric] = source_label

    # Curated snapshot rows (lowest precedence — overwritten by anything below)
    curated = Path("config") / "fair_statewide_quarterly_history.csv"
    if curated.exists():
        for r in read_csv(curated):
            for metric in ("policy_count", "exposure", "premium"):
                write_cell(r["coverage_end"], metric, _safe_int(r.get(metric)), "snapshot")

    # FY-end values from history files (Total rows)
    pif = processed_dir / "fair" / "zip_pif_history.csv"
    if pif.exists():
        for r in read_csv(pif):
            if r["geography_id"] != "Total":
                continue
            ce = f"{int(r['fiscal_year'])}-09-30"
            write_cell(ce, "policy_count", _safe_int(r["value"]), "fy_history")
    tiv = processed_dir / "fair" / "zip_tiv_history.csv"
    if tiv.exists():
        for r in read_csv(tiv):
            if r["geography_id"] != "Total":
                continue
            ce = f"{int(r['fiscal_year'])}-09-30"
            write_cell(ce, "exposure", _safe_int(r["value"]), "fy_history")

    # Granular quarterly totals — highest precedence
    quarterly = processed_dir / "fair" / "quarterly_totals.csv"
    if quarterly.exists():
        for r in read_csv(quarterly):
            ce = r["coverage_end"]
            metric_map = {"count": "policy_count", "premium": "premium", "exposure": "exposure"}
            metric = metric_map.get(r["metric"])
            if metric:
                write_cell(ce, metric, _safe_int(r["value"]), "quarterly")

    # Stitch the source provenance per row (compact, comma-joined when mixed).
    for ce, row in series.items():
        provs = sources.get(ce, {})
        unique = sorted(set(provs.values()))
        row["source"] = ",".join(unique)

    ordered = sorted(series.values(), key=lambda r: r["coverage_end"])
    write_csv(
        exports_dir / "fair_statewide_history.csv",
        ordered,
        ["coverage_end", "policy_count", "exposure", "premium", "source"],
    )


def _safe_int(token: object) -> int | None:
    if token is None or token == "":
        return None
    try:
        return int(str(token).replace(",", "").replace("$", "").strip())
    except ValueError:
        return None


def _write_zip_wide(
    processed_dir: Path,
    zip_quarterly_rows: list[dict[str, object]],
    zip_pif_rows: list[dict[str, object]],
    zip_tiv_rows: list[dict[str, object]],
) -> None:
    """Write data/processed/fair/zip_wide.csv — one row per ZIP, columns
    per (metric, period) for both granular quarters and FY-end annuals."""
    meta: dict[str, dict[str, str]] = {}
    counts: dict[tuple[str, str], int] = {}      # (zip, period) -> policy_count
    exposures: dict[tuple[str, str], int] = {}   # (zip, period) -> exposure

    # Granular quarterly snapshots (count + exposure, from category_breakdown).
    for r in zip_quarterly_rows:
        z, ce = str(r["zip"]), str(r["coverage_end"])
        meta.setdefault(z, {"city": str(r.get("city", "")), "county": str(r["county"]), "region": str(r["region"])})
        counts[(z, ce)] = int(r["policy_count"])
        exposures[(z, ce)] = int(r["exposure"])

    # FY-end annual values from history files.
    for r in zip_pif_rows:
        z = str(r["geography_id"])
        if z == "Total":
            continue
        period = str(r["period_end"])
        counts[(z, period)] = int(r["value"])
        meta.setdefault(z, {"city": "", "county": "", "region": ""})

    for r in zip_tiv_rows:
        z = str(r["geography_id"])
        if z == "Total":
            continue
        period = str(r["period_end"])
        exposures[(z, period)] = int(r["value"])
        meta.setdefault(z, {"city": "", "county": "", "region": ""})

    periods = sorted({p for (_z, p) in (*counts.keys(), *exposures.keys())})
    zips = sorted(meta)

    fieldnames = ["zip", "city", "county", "region"]
    for p in periods:
        fieldnames.append(f"policy_count_{p}")
    for p in periods:
        fieldnames.append(f"exposure_{p}")

    rows: list[dict[str, object]] = []
    for z in zips:
        m = meta[z]
        row: dict[str, object] = {"zip": z, "city": m["city"], "county": m["county"], "region": m["region"]}
        for p in periods:
            row[f"policy_count_{p}"] = counts.get((z, p), "")
        for p in periods:
            row[f"exposure_{p}"] = exposures.get((z, p), "")
        rows.append(row)
    write_csv(processed_dir / "fair" / "zip_wide.csv", rows, fieldnames)


def _load_zip_cities(config_dir: Path | None = None) -> dict[str, str]:
    """Return a zip -> city mapping from config/zip_cities.csv (GeoNames-derived)."""
    config_dir = config_dir or Path("config")
    path = config_dir / "zip_cities.csv"
    if not path.exists():
        return {}
    return {r["zip"]: r["city"] for r in read_csv(path)}


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
