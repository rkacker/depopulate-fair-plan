# /// script
# requires-python = ">=3.11"
# dependencies = ["shapely>=2.0", "pyproj>=3.6"]
# ///
"""Compute the share of each ZIP's land area inside CAL FIRE FHSZ High/Very High zones.

One-off generator for config/zip_fire_hazard.csv (committed). Inputs:
- data/raw/calfire/fhsz_high_vh_3310.geojson — FHSZ High + Very High polygons,
  combined SRA (2024) / LRA (2025) layer `fhsz24_1` from the CALFIRE-Forestry
  ArcGIS org, fetched in EPSG:3310 with 50 m simplification.
- web/public/data/california-zips.json — site ZIP boundaries (EPSG:4326).

Method note: this is an *area* overlap (share of ZIP land area in the zones),
not a share of homes/buildings like the NYT's FEMA-footprint method. Run:
    uv run scripts/compute_zip_fire_hazard.py
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform as shp_transform
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parent.parent
FHSZ_PATH = ROOT / "data" / "raw" / "calfire" / "fhsz_high_vh_3310.geojson"
ZIPS_PATH = ROOT / "web" / "public" / "data" / "california-zips.json"
OUT_PATH = ROOT / "config" / "zip_fire_hazard.csv"


def main() -> None:
    fhsz = json.loads(FHSZ_PATH.read_text())
    hazard_geoms = []
    for f in fhsz["features"]:
        g = shape(f["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        if not g.is_empty:
            hazard_geoms.append(g)
    tree = STRtree(hazard_geoms)
    print(f"hazard polygons: {len(hazard_geoms)}")

    to_3310 = Transformer.from_crs("EPSG:4326", "EPSG:3310", always_xy=True).transform
    zips = json.loads(ZIPS_PATH.read_text())

    rows = []
    for feat in zips["features"]:
        zip_code = feat["properties"]["zip"]
        g = shp_transform(to_3310, shape(feat["geometry"]))
        if not g.is_valid:
            g = g.buffer(0)
        if g.is_empty:
            continue
        zip_area = g.area
        hit_area = 0.0
        for idx in tree.query(g):
            inter = hazard_geoms[idx].intersection(g)
            if not inter.is_empty:
                hit_area += inter.area
        pct = min(100.0, 100.0 * hit_area / zip_area) if zip_area else 0.0
        rows.append({
            "zip": zip_code,
            "zip_area_km2": round(zip_area / 1e6, 2),
            "fhsz_high_pct": round(pct, 1),
        })

    rows.sort(key=lambda r: r["zip"])
    with OUT_PATH.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["zip", "zip_area_km2", "fhsz_high_pct"])
        w.writeheader()
        w.writerows(rows)
    high = sum(1 for r in rows if r["fhsz_high_pct"] >= 50)
    low = sum(1 for r in rows if r["fhsz_high_pct"] < 10)
    print(f"wrote {len(rows)} ZIPs → {OUT_PATH}")
    print(f"  ≥50% of area in high/VH zones: {high}")
    print(f"  <10% of area in high/VH zones: {low}")


if __name__ == "__main__":
    main()
