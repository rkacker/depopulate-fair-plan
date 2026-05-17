#!/usr/bin/env bash
# Fetch CA Census Place boundaries (incorporated cities + CDPs) for the city
# crisis map. Output: web/public/data/california-places.json.
#
# Source: US Census Bureau 2020 cartographic boundary file, state FP 06 (CA),
# pre-filtered to CA Places. Public domain.
#
# One-time fetch; output is committed. Re-run if Census publishes a newer year.

set -euo pipefail

SOURCE_URL="https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_06_place_500k.zip"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_FILE="$REPO_ROOT/web/public/data/california-places.json"
TMP_DIR="$(mktemp -d)"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading CA Census Places..."
curl -fsSL "$SOURCE_URL" -o "$TMP_DIR/places.zip"
echo "  raw zip: $(du -h "$TMP_DIR/places.zip" | cut -f1)"

unzip -q "$TMP_DIR/places.zip" -d "$TMP_DIR"

echo "Simplifying and normalizing..."
npx --yes mapshaper "$TMP_DIR"/*.shp \
  -filter-fields NAME \
  -rename-fields name=NAME \
  -simplify 5% keep-shapes \
  -o format=geojson precision=0.0001 gj2008 "$OUT_FILE"
# gj2008 → legacy GeoJSON spec with clockwise exterior rings, which d3-geo
# (and react-simple-maps) treat as "inside" the polygon. mapshaper's default
# RFC 7946 orientation (CCW) silently makes d3-geo render each polygon as
# "the whole sphere minus this region" — every polygon overlaps the entire
# viewport and the map appears not to render.

echo "  out: $(du -h "$OUT_FILE" | cut -f1)  ->  $OUT_FILE"
