#!/usr/bin/env bash
# Fetch and process California ZIP boundary GeoJSON for the ZIP-level crisis
# map at /?view=zip.
#
# Source: OpenDataDE/State-zip-code-GeoJSON (Census-derived ZCTA boundaries,
# pre-filtered to California). MIT-licensed, public GitHub repo.
#
# Output: web/public/data/california-zips.json
#   - Polygon FeatureCollection with CLOCKWISE exterior rings (gj2008 spec).
#     Required: d3-geo / react-simple-maps treat CCW polygons as "the whole
#     sphere minus this region" and silently break the map.
#   - Each feature: properties.zip and properties.name (both = ZCTA code)
#   - Simplified ~4% to keep the file ~3 MB
#
# Re-run any time the source updates. Requires Node.js (uses npx mapshaper).

set -euo pipefail

SOURCE_URL="https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ca_california_zip_codes_geo.min.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../public/data"
OUT_FILE="$OUT_DIR/california-zips.json"
TMP_FILE="$(mktemp -t ca_zips_raw.XXXXXX.json)"

trap 'rm -f "$TMP_FILE"' EXIT

echo "Downloading CA ZIP boundaries..."
curl -fsSL "$SOURCE_URL" -o "$TMP_FILE"
echo "  raw: $(du -h "$TMP_FILE" | cut -f1)"

echo "Simplifying and normalizing..."
npx --yes mapshaper "$TMP_FILE" \
  -filter-fields ZCTA5CE10 \
  -rename-fields zip=ZCTA5CE10 \
  -each 'name = zip' \
  -simplify 4% keep-shapes \
  -o format=geojson precision=0.0001 gj2008 "$OUT_FILE"

echo "  out: $(du -h "$OUT_FILE" | cut -f1)  ->  $OUT_FILE"
