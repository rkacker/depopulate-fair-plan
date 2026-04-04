#!/usr/bin/env python3
"""Build county-to-Senate-district crosswalk from Census 2020 data.

One-time offline script. Reads:
  - data/raw/census/06_CA_SLDU22.txt  (block → new Senate district, post-2021 redistricting)
  - data/raw/census/cageo2020.pl      (block GEOID → LOGRECNO)
  - data/raw/census/ca000012020.pl    (LOGRECNO → total population)

Writes:
  - config/county_senate_district_crosswalk.csv

Usage:
    python scripts/build_crosswalk.py
"""

from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

CENSUS_DIR = Path("data/raw/census")
OUTPUT_PATH = Path("config/county_senate_district_crosswalk.csv")

# California county FIPS → canonical name (matching parsers.CA_COUNTIES)
FIPS_TO_COUNTY = {
    "001": "Alameda", "003": "Alpine", "005": "Amador", "007": "Butte",
    "009": "Calaveras", "011": "Colusa", "013": "Contra Costa", "015": "Del Norte",
    "017": "El Dorado", "019": "Fresno", "021": "Glenn", "023": "Humboldt",
    "025": "Imperial", "027": "Inyo", "029": "Kern", "031": "Kings",
    "033": "Lake", "035": "Lassen", "037": "Los Angeles", "039": "Madera",
    "041": "Marin", "043": "Mariposa", "045": "Mendocino", "047": "Merced",
    "049": "Modoc", "051": "Mono", "053": "Monterey", "055": "Napa",
    "057": "Nevada", "059": "Orange", "061": "Placer", "063": "Plumas",
    "065": "Riverside", "067": "Sacramento", "069": "San Benito",
    "071": "San Bernardino", "073": "San Diego", "075": "San Francisco",
    "077": "San Joaquin", "079": "San Luis Obispo", "081": "San Mateo",
    "083": "Santa Barbara", "085": "Santa Clara", "087": "Santa Cruz",
    "089": "Shasta", "091": "Sierra", "093": "Siskiyou", "095": "Solano",
    "097": "Sonoma", "099": "Stanislaus", "101": "Sutter", "103": "Tehama",
    "105": "Trinity", "107": "Tulare", "109": "Tuolumne", "111": "Ventura",
    "113": "Yolo", "115": "Yuba",
}


def load_block_to_district(path: Path) -> dict[str, int]:
    """Read BEF file: GEOID → Senate district number."""
    mapping: dict[str, int] = {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            mapping[row["GEOID"]] = int(row["SLDUST"])
    return mapping


def load_block_populations(geo_path: Path, data_path: Path) -> dict[str, int]:
    """Read PL 94-171 files: 15-digit block GEOID → total population.

    geo file (pipe-delimited): field 2 = SUMLEV, field 7 = LOGRECNO, field 9 = GEOID
    data file (pipe-delimited): field 4 = LOGRECNO, field 5 = total population (P0010001)
    """
    # Step 1: Read data file to get LOGRECNO → population
    logrecno_to_pop: dict[str, int] = {}
    with data_path.open(encoding="latin-1") as f:
        for line in f:
            fields = line.rstrip("\n").split("|")
            logrecno_to_pop[fields[4]] = int(fields[5])

    # Step 2: Read geo file, filter to block level (SUMLEV=750), map GEOID → population
    block_pop: dict[str, int] = {}
    with geo_path.open(encoding="latin-1") as f:
        for line in f:
            fields = line.rstrip("\n").split("|")
            if fields[2] != "750":
                continue
            geoid = fields[9]  # 15-digit block GEOID
            logrecno = fields[7]
            pop = logrecno_to_pop.get(logrecno, 0)
            block_pop[geoid] = pop

    return block_pop


def build_crosswalk(
    block_to_district: dict[str, int],
    block_pop: dict[str, int],
) -> list[dict[str, object]]:
    """Compute population-weighted county → Senate district crosswalk."""
    # Accumulate population by (county_fips, district)
    pair_pop: dict[tuple[str, int], int] = defaultdict(int)
    county_total_pop: dict[str, int] = defaultdict(int)

    for geoid, district in block_to_district.items():
        county_fips = geoid[2:5]
        pop = block_pop.get(geoid, 0)
        pair_pop[(county_fips, district)] += pop
        county_total_pop[county_fips] += pop

    # Build rows with population weight
    rows: list[dict[str, object]] = []
    for (county_fips, district), pop in sorted(pair_pop.items()):
        county_name = FIPS_TO_COUNTY.get(county_fips)
        if county_name is None:
            continue
        total = county_total_pop[county_fips]
        weight = round(pop / total, 6) if total > 0 else 0.0
        rows.append({
            "county_name": county_name,
            "senate_district": district,
            "population_weight": weight,
            "district_county_pop": pop,
            "county_total_pop": total,
            "source": "census_2020_baf_sldu22",
        })

    return rows


def validate(rows: list[dict[str, object]]) -> None:
    """Run validation checks on the crosswalk."""
    # Check county weights sum to 1.0
    county_weights: dict[str, float] = defaultdict(float)
    for row in rows:
        county_weights[row["county_name"]] += row["population_weight"]

    for county, total_weight in sorted(county_weights.items()):
        if abs(total_weight - 1.0) > 0.002:
            print(f"  WARNING: {county} weights sum to {total_weight:.4f}")

    districts = sorted(set(row["senate_district"] for row in rows))
    counties = sorted(set(row["county_name"] for row in rows))
    total_pop = sum(row["district_county_pop"] for row in rows)

    print(f"Counties: {len(counties)}")
    print(f"Districts: {len(districts)} (range {min(districts)}-{max(districts)})")
    print(f"County-district pairs: {len(rows)}")
    print(f"Total population: {total_pop:,}")
    print(f"All county weights sum to ~1.0: {all(abs(w - 1.0) < 0.002 for w in county_weights.values())}")


def main() -> None:
    print("Loading block → Senate district mapping...")
    block_to_district = load_block_to_district(CENSUS_DIR / "06_CA_SLDU22.txt")
    print(f"  {len(block_to_district):,} blocks mapped to districts")

    print("Loading block populations from PL 94-171...")
    block_pop = load_block_populations(
        CENSUS_DIR / "cageo2020.pl",
        CENSUS_DIR / "ca000012020.pl",
    )
    print(f"  {len(block_pop):,} block populations loaded")

    print("Building crosswalk...")
    rows = build_crosswalk(block_to_district, block_pop)

    print("\nValidation:")
    validate(rows)

    print(f"\nWriting {OUTPUT_PATH}...")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "county_name", "senate_district", "population_weight",
            "district_county_pop", "county_total_pop", "source",
        ])
        writer.writeheader()
        writer.writerows(rows)

    print("Done.")


if __name__ == "__main__":
    main()
