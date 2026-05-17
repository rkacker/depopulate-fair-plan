#!/usr/bin/env bash
# Fetch GeoNames US postal-code data, filter to California, and write
# config/zip_cities.csv (zip,city). Run once; the output is checked into
# the repo so the regular pipeline stays offline-capable.
#
# Source: GeoNames US.zip — CC-BY 4.0 (https://www.geonames.org/).
# Format reference: https://download.geonames.org/export/zip/readme.txt

set -euo pipefail

SOURCE_URL="https://download.geonames.org/export/zip/US.zip"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_FILE="$REPO_ROOT/config/zip_cities.csv"
TMP_DIR="$(mktemp -d)"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading GeoNames US postal codes..."
curl -fsSL "$SOURCE_URL" -o "$TMP_DIR/US.zip"
echo "  raw: $(du -h "$TMP_DIR/US.zip" | cut -f1)"

unzip -q "$TMP_DIR/US.zip" -d "$TMP_DIR"

echo "Filtering to California ZIPs..."
# US.txt is tab-separated: country, zip, city, state_name, state_code, ...
# Keep CA only, dedupe on zip (GeoNames may list multiple cities per ZIP;
# keep the first occurrence — usually the primary city).
python3 - "$TMP_DIR/US.txt" "$OUT_FILE" <<'PY'
import csv, sys
src, dst = sys.argv[1], sys.argv[2]
seen = set()
rows = []
with open(src, encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 5:
            continue
        _country, zipc, city, _state_name, state_code = parts[:5]
        if state_code != "CA" or zipc in seen:
            continue
        seen.add(zipc)
        rows.append({"zip": zipc, "city": city})
rows.sort(key=lambda r: r["zip"])
with open(dst, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["zip", "city"])
    w.writeheader()
    w.writerows(rows)
print(f"  wrote {len(rows):,} CA ZIPs -> {dst}")
PY
