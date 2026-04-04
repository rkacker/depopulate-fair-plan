from __future__ import annotations

import re
from pathlib import Path

from pypdf import PdfReader

from fairplan.models import SourceConfig


CA_COUNTIES = frozenset([
    "Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa",
    "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn",
    "Humboldt", "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen",
    "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced",
    "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer",
    "Plumas", "Riverside", "Sacramento", "San Benito", "San Bernardino",
    "San Diego", "San Francisco", "San Joaquin", "San Luis Obispo",
    "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz", "Shasta",
    "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter",
    "Tehama", "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba",
])

FAIR_POLICY_CATEGORIES = [
    "owner_occupied_single_family",
    "tenant_occupied_renters",
    "condo_unit_owners",
    "other",
    "unknown_category_5",
]
FAIR_RISK_BANDS = ["low", "medium", "high"]


def extract_pdf_lines(path: Path) -> list[str]:
    reader = PdfReader(str(path))
    lines: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        lines.extend(text.splitlines())
    return lines


def normalize_county_name(name: str) -> str:
    return " ".join(part.capitalize() for part in name.strip().split())


def clean_int(token: str) -> int:
    cleaned = token.replace(",", "").replace("$", "").strip()
    if cleaned in {"-", ""}:
        return 0
    return int(cleaned)


def parse_fair_category_pdf(path: Path, source: SourceConfig, metric: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    line_pattern = re.compile(
        r"^(?P<zip>\d{5}) (?P<county>[A-Za-z .'-]+?) (?P<distressed>[01]) "
        r"(?P<region>(?:Northern|Central|Southern) CA) (?P<tail>.+)$"
    )
    token_pattern = r"(?:[\d,]+|-)\$" if metric in {"premium", "exposure"} else r"[\d,]+"
    for line in extract_pdf_lines(path):
        if not line or line.startswith("Policy count by category") or line.startswith("Premium by category"):
            continue
        if line.startswith("Exposure by category") or line.startswith("Zip County") or line.startswith("Low Medium High"):
            continue
        match = line_pattern.match(line)
        if not match:
            continue
        value_tokens = re.findall(token_pattern, match.group("tail"))
        if len(value_tokens) != 15:
            continue
        for index, token in enumerate(value_tokens):
            risk_band = FAIR_RISK_BANDS[index // len(FAIR_POLICY_CATEGORIES)]
            category = FAIR_POLICY_CATEGORIES[index % len(FAIR_POLICY_CATEGORIES)]
            rows.append(
                {
                    "coverage_end": source.coverage_end,
                    "zip": match.group("zip"),
                    "county": match.group("county"),
                    "is_distressed_area": int(match.group("distressed")),
                    "region": match.group("region"),
                    "risk_band": risk_band,
                    "policy_category": category,
                    "metric": metric,
                    "value": clean_int(token),
                    "source_id": source.id,
                }
            )
    return rows


def parse_fair_history_pdf(path: Path, source: SourceConfig, geography_level: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    coverage_year = int(source.coverage_end[:4])
    line_pattern = (
        re.compile(r"^(?P<geo>\d{5}|Total)\s+(?P<tail>(?:-?\d+%|[\d,]+).+)$")
        if geography_level == "zip"
        else re.compile(r"^(?P<geo>[A-Za-z .'-]+|Total)\s+(?P<tail>(?:-?\d+%|[\d,]+).+)$")
    )
    for line in extract_pdf_lines(path):
        if not line or line.startswith("Policy Growth by Fiscal Year") or line.startswith("Data by "):
            continue
        if line.startswith("Page ") or line.startswith("County Year") or line.startswith("ZIP Code Year"):
            continue
        if "Report Year" in line:
            line = line.split("Report Year", 1)[0].strip()
        match = line_pattern.match(line)
        if not match:
            continue
        tokens = match.group("tail").split()
        if len(tokens) < 9:
            continue
        years = [coverage_year - offset for offset in range(5)]
        pairs = [
            (years[0], tokens[1], tokens[0]),
            (years[1], tokens[3], tokens[2]),
            (years[2], tokens[5], tokens[4]),
            (years[3], tokens[7], tokens[6]),
            (years[4], tokens[8], None),
        ]
        geography_id = match.group("geo")
        geography_name = (
            normalize_county_name(geography_id)
            if geography_level == "county" and geography_id != "Total"
            else geography_id
        )
        if geography_level == "county" and geography_name not in CA_COUNTIES and geography_name != "Total":
            continue
        for year, value_token, growth_token in pairs:
            rows.append(
                {
                    "coverage_end": source.coverage_end,
                    "fiscal_year": year,
                    "period_end": f"{year}-09-30",
                    "geography_level": geography_level,
                    "geography_id": geography_id,
                    "geography_name": geography_name,
                    "metric": "policy_count",
                    "value": clean_int(value_token),
                    "yoy_growth_pct": None if growth_token is None else growth_token.replace("%", ""),
                    "source_id": source.id,
                }
            )
    return rows


def parse_cdi_county_pdf(path: Path, source: SourceConfig) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    county_line = re.compile(r"^(?P<county>[A-Z ]+|State)\s+(?P<year>\d{4})\s+(?P<tail>(?:[\d,]+\s+){6}[\d,]+)$")
    continuation_line = re.compile(r"^(?P<year>\d{4})\s+(?P<tail>(?:[\d,]+\s+){6}[\d,]+)$")
    mappings = [
        ("voluntary", "new"),
        ("voluntary", "renewed"),
        ("voluntary", "nonrenewed"),
        ("fair_plan", "new"),
        ("fair_plan", "renewed"),
        ("dic", "new"),
        ("dic", "renewed"),
    ]
    current_county: str = ""
    for line in extract_pdf_lines(path):
        stripped = line.strip()
        match = county_line.match(stripped)
        if match:
            county = match.group("county")
            current_county = county if county == "State" else normalize_county_name(county)
        else:
            match = continuation_line.match(stripped)
            if match and current_county:
                pass  # use current_county
            else:
                continue
        year = int(match.group("year"))
        values = match.group("tail").split()
        for (segment, flow), token in zip(mappings, values):
            rows.append(
                {
                    "year": year,
                    "county": current_county,
                    "market_segment": segment,
                    "flow_metric": flow,
                    "value": clean_int(token),
                    "source_id": source.id,
                }
            )
    return rows


def parse_cdi_fact_sheet_appendix_a(path: Path, source: SourceConfig) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    lines = extract_pdf_lines(path)
    in_appendix = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("Appendix A: Statewide Policy Counts"):
            in_appendix = True
            continue
        if in_appendix and stripped.startswith("Appendix B:"):
            break
        if not in_appendix:
            continue
        if not stripped or not re.match(r"^\d{4}\s", stripped):
            continue
        values = stripped.split()
        if len(values) != 9:
            continue
        year = int(values[0])
        mappings = [
            ("voluntary", "new", values[1]),
            ("voluntary", "renewed", values[2]),
            ("voluntary", "nonrenewed_cancelled", values[3]),
            ("fair_plan", "new", values[4]),
            ("fair_plan", "renewed", values[5]),
            ("fair_plan", "nonrenewed_cancelled", values[6]),
            ("surplus_lines", "new", values[7]),
            ("surplus_lines", "renewed", values[8]),
        ]
        for segment, flow_metric, token in mappings:
            rows.append(
                {
                    "year": year,
                    "market_segment": segment,
                    "flow_metric": flow_metric,
                    "value": clean_int(token),
                    "source_id": source.id,
                }
            )
    return rows


def parse_distressed_geographies(path: Path, source: SourceConfig) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    lines = extract_pdf_lines(path)
    collecting_zips = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("LIST OF UNDERMARKETED ZIP CODES"):
            collecting_zips = True
            continue
        if not collecting_zips:
            county_match = re.match(r"^\d+\.\s+(.+)$", stripped)
            if county_match:
                county = county_match.group(1).strip()
                rows.append(
                    {
                        "effective_date": source.coverage_end,
                        "geo_type": "county",
                        "geo_id": county,
                        "geo_name": county,
                        "status": "distressed",
                        "source_id": source.id,
                    }
                )
            continue
        for zip_code in re.findall(r"\b9\d{4}\b", stripped):
            rows.append(
                {
                    "effective_date": source.coverage_end,
                    "geo_type": "zip",
                    "geo_id": zip_code,
                    "geo_name": zip_code,
                    "status": "distressed",
                    "source_id": source.id,
                }
            )
    return rows

